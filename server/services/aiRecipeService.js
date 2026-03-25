const { getGeneratedImageUrl } = require("./generatedImageService");

const SEARCH_TIMEOUT_MS = 12000;
const FETCH_TIMEOUT_MS = 12000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const PREFERRED_SEARCH_PROVIDER = (
  process.env.AI_SEARCH_PROVIDER || "auto"
).toLowerCase();
const NOT_KID_FRIENDLY_TERMS = [
  "wine",
  "beer",
  "vodka",
  "rum",
  "tequila",
  "bourbon",
  "whiskey",
  "whisky",
  "espresso",
  "coffee rub",
  "chili flakes",
  "ghost pepper",
  "jalapeno",
  "habanero",
  "serrano",
  "flambe",
];

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonLoose(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractJsonFromText(value) {
  const text = String(value || "").trim();
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
    return null;
  return candidate.slice(firstBrace, lastBrace + 1);
}

function parseDurationMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/P(?:T(?:(\d+)H)?(?:(\d+)M)?)/i);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  return hours * 60 + minutes || null;
}

function normalizeText(value, fallback = "") {
  const text = stripHtml(value || fallback);
  return text || fallback;
}

function normalizeIngredient(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    const parts = trimmed.match(/^([\d\/.\s]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
    return {
      amount: parts?.[1]?.trim() || "",
      unit: parts?.[2]?.trim() || "",
      name: (parts?.[3] || trimmed).trim(),
    };
  }

  const name = normalizeText(
    entry.name || entry.text || entry.ingredient || "",
  );
  if (!name) return null;

  return {
    name,
    amount: String(entry.amount || entry.quantity || ""),
    unit: String(entry.unit || ""),
  };
}

function normalizeStep(entry, index) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const instruction = normalizeText(entry);
    if (!instruction) return null;
    return {
      order: index + 1,
      instruction,
      tip: "",
      whyItMatters: "",
    };
  }

  const instruction = normalizeText(
    entry.text || entry.instruction || entry.name || "",
  );
  if (!instruction) return null;
  return {
    order: Number(entry.order || index + 1),
    instruction,
    tip: normalizeText(entry.tip || ""),
    whyItMatters: normalizeText(entry.whyItMatters || ""),
  };
}

function siteNameFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.split(".").slice(0, -1).join(".") || hostname;
  } catch {
    return "web";
  }
}

function getRecipeObjectsFromJsonLd(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.flatMap(getRecipeObjectsFromJsonLd);
  }
  if (parsed["@graph"]) {
    return getRecipeObjectsFromJsonLd(parsed["@graph"]);
  }
  if (typeof parsed === "object" && parsed["@type"]) {
    const types = Array.isArray(parsed["@type"])
      ? parsed["@type"]
      : [parsed["@type"]];
    if (types.some((type) => String(type).toLowerCase() === "recipe")) {
      return [parsed];
    }
  }
  return [];
}

function extractRecipeFromHtml(html, url) {
  const scripts = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  );
  const recipeCandidates = scripts
    .map((match) => parseJsonLoose(match[1].trim()))
    .flatMap(getRecipeObjectsFromJsonLd)
    .filter(Boolean);

  const recipeJson = recipeCandidates[0];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    );
  const imageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );

  if (!recipeJson && !titleMatch) return null;

  const ingredients = (recipeJson?.recipeIngredient || [])
    .map(normalizeIngredient)
    .filter(Boolean);

  const instructionsRaw = Array.isArray(recipeJson?.recipeInstructions)
    ? recipeJson.recipeInstructions
    : recipeJson?.recipeInstructions
      ? [recipeJson.recipeInstructions]
      : [];

  const steps = instructionsRaw
    .map((entry, index) => {
      if (typeof entry === "object" && Array.isArray(entry.itemListElement)) {
        return entry.itemListElement.map((stepEntry, nestedIndex) =>
          normalizeStep(stepEntry, nestedIndex),
        );
      }
      return normalizeStep(entry, index);
    })
    .flat()
    .filter(Boolean);

  return {
    title: normalizeText(
      recipeJson?.name || titleMatch?.[1] || "Internet recipe",
    ),
    description: normalizeText(
      recipeJson?.description ||
        descMatch?.[1] ||
        "Recipe adapted from internet sources.",
    ),
    cuisine: normalizeText(recipeJson?.recipeCuisine || "Internet"),
    difficulty: null,
    cookingTime: parseDurationMinutes(recipeJson?.cookTime) || 20,
    prepTime: parseDurationMinutes(recipeJson?.prepTime) || 15,
    servings: Number(
      String(recipeJson?.recipeYield || "2").match(/\d+/)?.[0] || 2,
    ),
    ingredients,
    steps,
    tags: [siteNameFromUrl(url)],
    nutritionInfo: {
      calories: Number(
        String(recipeJson?.nutrition?.calories || "").match(/\d+/)?.[0] || 0,
      ),
      protein: Number(
        String(recipeJson?.nutrition?.proteinContent || "").match(/\d+/)?.[0] ||
          0,
      ),
      carbs: Number(
        String(recipeJson?.nutrition?.carbohydrateContent || "").match(
          /\d+/,
        )?.[0] || 0,
      ),
      fat: Number(
        String(recipeJson?.nutrition?.fatContent || "").match(/\d+/)?.[0] || 0,
      ),
    },
    source: {
      title: normalizeText(recipeJson?.name || titleMatch?.[1] || url),
      url,
      siteName: siteNameFromUrl(url),
    },
    sourceImageUrl:
      imageMatch?.[1] ||
      (Array.isArray(recipeJson?.image)
        ? recipeJson.image[0]
        : recipeJson?.image?.url || recipeJson?.image || ""),
  };
}

async function fetchPageRecipe(url) {
  const request = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: request.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SmartCookingBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    return extractRecipeFromHtml(html, url);
  } catch {
    return null;
  } finally {
    request.clear();
  }
}

async function searchWithTavily(query) {
  if (!process.env.TAVILY_API_KEY) return [];

  const request = withTimeout(SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: request.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.results || []).map((item) => ({
      title: item.title,
      url: item.url,
      snippet: item.content,
    }));
  } catch {
    return [];
  } finally {
    request.clear();
  }
}

async function searchWithSerpApi(query) {
  if (!process.env.SERPAPI_API_KEY) return [];

  const request = withTimeout(SEARCH_TIMEOUT_MS);
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
    url.searchParams.set("num", "8");

    const response = await fetch(url, { signal: request.signal });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.organic_results || []).map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }));
  } catch {
    return [];
  } finally {
    request.clear();
  }
}

async function searchRecipeSources(query) {
  const providerState = getProviderState();

  if (providerState.activeSearchProvider === "tavily") {
    const tavilyResults = await searchWithTavily(query);
    if (tavilyResults.length > 0) return tavilyResults;
    return providerState.serpApiConfigured ? searchWithSerpApi(query) : [];
  }

  if (providerState.activeSearchProvider === "serpapi") {
    const serpResults = await searchWithSerpApi(query);
    if (serpResults.length > 0) return serpResults;
    return providerState.tavilyConfigured ? searchWithTavily(query) : [];
  }

  return [];
}

function buildSearchQueries({
  intent,
  mainIngredient,
  availableIngredients,
  childrenMode,
  user,
}) {
  const timeLabel =
    intent?.time === "short"
      ? "quick"
      : intent?.time === "medium"
        ? "30 minute"
        : "weeknight";
  const difficultyLabel = intent?.difficulty || user?.cookingLevel || "easy";
  const pantryTerms = (availableIngredients || []).slice(0, 3).join(" ");
  const dietaryTerms = (user?.dietaryRestrictions || []).join(" ");
  const mainTerm = mainIngredient || pantryTerms || "dinner";
  const childTerm = childrenMode ? "kids children family friendly recipe" : "";
  return [
    `${mainTerm} ${timeLabel} ${difficultyLabel} recipe ${childTerm} ${dietaryTerms}`.trim(),
    `${mainTerm} recipe with ${pantryTerms} ${childTerm} ${dietaryTerms}`.trim(),
  ].filter(Boolean);
}

function fallbackDescription(sourceRecipe, childrenMode) {
  if (childrenMode) {
    return `${sourceRecipe.description} Adapted into a child-friendly version with simpler steps and gentler flavors.`.trim();
  }
  return (
    sourceRecipe.description || "A web-inspired recipe adapted for this app."
  );
}

function hasUnsafeRecipeTerms(recipe) {
  const text =
    `${recipe.title} ${recipe.description} ${(recipe.tags || []).join(" ")} ${(recipe.ingredients || []).map((ingredient) => ingredient.name).join(" ")} ${(recipe.steps || []).map((step) => step.instruction).join(" ")}`.toLowerCase();
  return NOT_KID_FRIENDLY_TERMS.some((term) => text.includes(term));
}

function ensureKidFriendlyRecipe(recipe) {
  const text =
    `${recipe.title} ${recipe.description} ${(recipe.tags || []).join(" ")} ${(recipe.ingredients || []).map((ingredient) => ingredient.name).join(" ")} ${(recipe.steps || []).map((step) => step.instruction).join(" ")}`.toLowerCase();
  if (hasUnsafeRecipeTerms(recipe)) return false;

  return (
    KID_FRIENDLY_TAGS.some((tag) => text.includes(tag)) ||
    recipe.difficulty === "easy" ||
    recipe.cookingTime + recipe.prepTime <= 40
  );
}

function getProviderState() {
  const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY);
  const serpApiConfigured = Boolean(process.env.SERPAPI_API_KEY);
  let activeSearchProvider = "none";

  if (PREFERRED_SEARCH_PROVIDER === "tavily" && tavilyConfigured)
    activeSearchProvider = "tavily";
  else if (PREFERRED_SEARCH_PROVIDER === "serpapi" && serpApiConfigured)
    activeSearchProvider = "serpapi";
  else if (tavilyConfigured) activeSearchProvider = "tavily";
  else if (serpApiConfigured) activeSearchProvider = "serpapi";

  return {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    searchConfigured: tavilyConfigured || serpApiConfigured,
    preferredSearchProvider: PREFERRED_SEARCH_PROVIDER,
    activeSearchProvider,
    tavilyConfigured,
    serpApiConfigured,
    imageProvider: process.env.AI_IMAGE_PROVIDER || "pollinations",
    geminiModel: GEMINI_MODEL,
  };
}

function normalizeGeneratedRecipe(recipe, index, options = {}) {
  const childrenMode = Boolean(options.childrenMode);
  const source = recipe.source || options.source || null;
  const title = normalizeText(recipe.title || `Generated Recipe ${index + 1}`);
  const description = normalizeText(
    recipe.description || "AI-generated recipe inspired by internet sources.",
  );
  const cuisine = normalizeText(recipe.cuisine || "Fusion");
  const difficulty = ["easy", "medium", "hard"].includes(recipe.difficulty)
    ? recipe.difficulty
    : (() => {
        if (childrenMode) return "easy";
        const HARD_TECHNIQUES =
          /braise|flamb|deglaze|temper|julienne|chiffonade|confit|sous vide|caramelize|fold|blanch|bloom|clarif|emulsif|ferment|reduce|sear|debone|fillet/i;
        const ingCount = (recipe.ingredients || []).length;
        const stepList = recipe.steps || [];
        const totalTime =
          Number(recipe.cookingTime || 0) + Number(recipe.prepTime || 0);
        let score =
          Math.min(ingCount * 0.5, 5) + Math.min(stepList.length * 0.6, 5);
        if (totalTime > 60) score += 2;
        else if (totalTime > 30) score += 1;
        score +=
          stepList.filter((s) =>
            HARD_TECHNIQUES.test(s.instruction || s.text || ""),
          ).length * 1.5;
        if (score <= 3) return "easy";
        if (score >= 7) return "hard";
        return "medium";
      })();
  const ingredients = (recipe.ingredients || [])
    .map(normalizeIngredient)
    .filter(Boolean)
    .slice(0, 30);
  const steps = (recipe.steps || [])
    .map((step, stepIndex) => normalizeStep(step, stepIndex))
    .filter(Boolean)
    .slice(0, 12);
  const tags = Array.isArray(recipe.tags)
    ? recipe.tags.map((tag) => normalizeText(tag)).filter(Boolean)
    : [];
  const recipeTags = childrenMode
    ? Array.from(new Set([...tags, "kid-friendly"]))
    : tags;
  const imagePrompt = `${title}, ${description}. ${childrenMode ? "Bright child-friendly plated meal, playful kitchen scene, wholesome food photography." : "Appetizing plated meal, editorial food photography, natural light."}`;
  return {
    _id: recipe._id,
    title,
    description,
    cuisine,
    difficulty,
    cookingTime: Number(recipe.cookingTime || 20),
    prepTime: Number(recipe.prepTime || 15),
    servings: Number(recipe.servings || 2),
    ingredients,
    steps,
    tags: recipeTags,
    nutritionInfo: {
      calories: Number(recipe.nutritionInfo?.calories || 0),
      protein: Number(recipe.nutritionInfo?.protein || 0),
      carbs: Number(recipe.nutritionInfo?.carbs || 0),
      fat: Number(recipe.nutritionInfo?.fat || 0),
    },
    source,
    sourceImageUrl: recipe.sourceImageUrl || options.sourceImageUrl || "",
    imageUrl:
      recipe.imageUrl ||
      getGeneratedImageUrl(imagePrompt, { seed: index + 11 }),
    isGenerated: true,
  };
}

function fallbackFromSources(sourceRecipes, options) {
  const filtered = options.childrenMode
    ? sourceRecipes.filter((recipe) => !hasUnsafeRecipeTerms(recipe))
    : sourceRecipes;

  return filtered.slice(0, 6).map((recipe, index) =>
    normalizeGeneratedRecipe(
      {
        ...recipe,
        title: options.childrenMode
          ? `${normalizeText(recipe.title)} Family Style`
          : recipe.title,
        description: fallbackDescription(recipe, options.childrenMode),
        difficulty: options.childrenMode ? "easy" : recipe.difficulty,
        cookingTime: options.childrenMode
          ? Math.min(Number(recipe.cookingTime || 20), 30)
          : recipe.cookingTime,
        prepTime: options.childrenMode
          ? Math.min(Number(recipe.prepTime || 15), 15)
          : recipe.prepTime,
        steps: options.childrenMode
          ? (recipe.steps || []).map((step, stepIndex) => ({
              ...step,
              order: Number(step.order || stepIndex + 1),
              instruction: normalizeText(
                step.instruction || step.text || step.name || "",
              ),
              tip: normalizeText(
                step.tip ||
                  "Keep the steps simple and let children help with safe mixing and measuring tasks.",
              ),
              whyItMatters: normalizeText(
                step.whyItMatters ||
                  "This keeps the recipe easy to follow and child-friendly.",
              ),
            }))
          : recipe.steps,
        tags: options.childrenMode
          ? [...(recipe.tags || []), "kid-friendly", "family"]
          : recipe.tags,
      },
      index,
      options,
    ),
  );
}

function buildDeterministicChildrenFallback(sourceRecipes, requestContext) {
  const primarySource = sourceRecipes[0] || {};
  const mainIngredient = normalizeText(
    requestContext.mainIngredient ||
      requestContext.availableIngredients?.[0] ||
      "pasta",
  );
  const pantryIngredients = Array.isArray(requestContext.availableIngredients)
    ? requestContext.availableIngredients
        .slice(0, 4)
        .map((item) => normalizeText(item))
        .filter(Boolean)
    : [];
  const ingredientNames = Array.from(
    new Set([
      mainIngredient,
      ...pantryIngredients,
      "olive oil",
      "mild cheese",
      "herbs",
    ]),
  )
    .filter(Boolean)
    .slice(0, 6);

  const recipe = {
    title: `${mainIngredient.replace(/(^|\s)\S/g, (match) => match.toUpperCase())} Family Bowl`,
    description: `A quick, gentle recipe built for cooking with children using familiar ingredients and simple steps.`,
    cuisine: primarySource.cuisine || "Family",
    difficulty: "easy",
    cookingTime: 20,
    prepTime: 10,
    servings: 2,
    ingredients: ingredientNames.map((name, index) => ({
      name,
      amount: index === 0 ? "2" : "1",
      unit: index === 0 ? "cups" : index < 3 ? "cup" : "tbsp",
    })),
    steps: [
      {
        order: 1,
        instruction: `Wash and measure the ingredients, then let children help place the ${mainIngredient} and other items into separate bowls.`,
        tip: "Give children safe measuring and stirring tasks.",
        whyItMatters:
          "Organizing ingredients first keeps the cooking process calm and easy to follow.",
      },
      {
        order: 2,
        instruction: `Cook the ${mainIngredient} until tender, then gently stir in the other ingredients over low heat.`,
        tip: "Keep the heat low and flavors mild for a child-friendly result.",
        whyItMatters:
          "Gentle cooking keeps the texture soft and the flavor approachable.",
      },
      {
        order: 3,
        instruction: `Serve in bowls and invite children to add a final sprinkle of cheese or herbs.`,
        tip: "Let children finish the plate themselves for more engagement.",
        whyItMatters:
          "A simple finishing step helps children feel included without adding risk.",
      },
    ],
    tags: ["kid-friendly", "family", "easy"],
    nutritionInfo: {
      calories: 420,
      protein: 18,
      carbs: 42,
      fat: 14,
    },
    source: primarySource.source || null,
    sourceImageUrl: primarySource.sourceImageUrl || "",
  };

  return [
    normalizeGeneratedRecipe(recipe, 0, {
      childrenMode: true,
      source: primarySource.source || null,
      sourceImageUrl: primarySource.sourceImageUrl || "",
    }),
  ];
}

async function generateWithGemini({ sourceRecipes, requestContext, user }) {
  if (!process.env.GEMINI_API_KEY || sourceRecipes.length === 0) return null;

  const prompt = {
    task: "Create structured cooking recipes inspired by source recipes from the internet. Do not copy source text verbatim. Synthesize a fresh recipe object using the source facts.",
    constraints: {
      childrenMode: Boolean(requestContext.childrenMode),
      strictChildrenMode: Boolean(requestContext.childrenMode),
      mainIngredient: requestContext.mainIngredient || "",
      availableIngredients: requestContext.availableIngredients || [],
      intent: requestContext.intent || null,
      dietaryRestrictions: user?.dietaryRestrictions || [],
      dislikes: user?.dislikes || [],
      cookingLevel: user?.cookingLevel || "beginner",
    },
    outputSchema: {
      recipes: [
        {
          title: "string",
          description: "string",
          cuisine: "string",
          difficulty: "easy | medium | hard",
          prepTime: "number",
          cookingTime: "number",
          servings: "number",
          ingredients: [{ name: "string", amount: "string", unit: "string" }],
          steps: [
            { instruction: "string", tip: "string", whyItMatters: "string" },
          ],
          tags: ["string"],
          nutritionInfo: {
            calories: "number",
            protein: "number",
            carbs: "number",
            fat: "number",
          },
          sourceIndex: "number",
        },
      ],
    },
    rules: [
      "Return valid JSON only.",
      "Return 3 to 6 recipes when enough source material exists, otherwise return as many valid recipes as possible.",
      "Every recipe must have at least 5 ingredients and 3 steps.",
      "If childrenMode is true, all recipes must be easy, safe, and clearly suitable for cooking with children.",
      "Use concise ingredient names and realistic timings.",
    ],
    sources: sourceRecipes.map((recipe, index) => ({
      index,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source: recipe.source,
    })),
  };

  const request = withTimeout(SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        signal: request.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.6,
          },
          contents: [
            {
              role: "user",
              parts: [{ text: JSON.stringify(prompt) }],
            },
          ],
        }),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";
    const jsonText = extractJsonFromText(text);
    if (!jsonText) return null;
    const parsed = parseJsonLoose(jsonText);
    if (!parsed || !Array.isArray(parsed.recipes)) return null;
    return parsed.recipes;
  } catch {
    return null;
  } finally {
    request.clear();
  }
}

async function collectSourceRecipes(requestContext, user) {
  const queries = buildSearchQueries({ ...requestContext, user });
  const urlMap = new Map();

  for (const query of queries) {
    const results = await searchRecipeSources(query);
    for (const result of results) {
      if (!result?.url || urlMap.has(result.url)) continue;
      urlMap.set(result.url, result);
      if (urlMap.size >= 8) break;
    }
    if (urlMap.size >= 8) break;
  }

  const recipes = [];
  for (const result of urlMap.values()) {
    const recipe = await fetchPageRecipe(result.url);
    if (!recipe) continue;
    recipes.push({
      ...recipe,
      description: recipe.description || normalizeText(result.snippet || ""),
    });
    if (recipes.length >= 8) break;
  }

  return recipes;
}

async function suggestInternetRecipes({ user, ...requestContext }) {
  const providerState = getProviderState();
  const sourceRecipes = await collectSourceRecipes(requestContext, user);
  if (sourceRecipes.length === 0) {
    return {
      mains: [],
      side: null,
      sources: [],
      metadata: {
        providerState,
        warnings: [
          providerState.searchConfigured
            ? "No recipe sources were extracted from search results."
            : "No search provider is configured, so internet recipe search is disabled.",
        ],
        fallbackReason: "source-search-empty",
      },
    };
  }

  const generatedRecipes = await generateWithGemini({
    sourceRecipes,
    requestContext,
    user,
  });

  let mains = (
    generatedRecipes && generatedRecipes.length > 0
      ? generatedRecipes.map((recipe, index) => {
          const source =
            sourceRecipes[recipe.sourceIndex] || sourceRecipes[index] || null;
          return normalizeGeneratedRecipe(
            {
              ...recipe,
              source: source?.source || recipe.source,
              sourceImageUrl: source?.sourceImageUrl,
            },
            index,
            {
              childrenMode: requestContext.childrenMode,
              source: source?.source || null,
              sourceImageUrl: source?.sourceImageUrl || "",
            },
          );
        })
      : fallbackFromSources(sourceRecipes, {
          childrenMode: requestContext.childrenMode,
        })
  )
    .filter(
      (recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0,
    )
    .filter(
      (recipe) =>
        !requestContext.childrenMode || ensureKidFriendlyRecipe(recipe),
    )
    .slice(0, 6);

  if (mains.length === 0 && requestContext.childrenMode) {
    mains = fallbackFromSources(sourceRecipes, { childrenMode: true })
      .filter(
        (recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0,
      )
      .filter(ensureKidFriendlyRecipe)
      .slice(0, 6);

    if (mains.length === 0) {
      mains = buildDeterministicChildrenFallback(sourceRecipes, requestContext)
        .filter(
          (recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0,
        )
        .filter(ensureKidFriendlyRecipe)
        .slice(0, 6);
    }
  }

  if (mains.length === 0) {
    return {
      mains: [],
      side: null,
      sources: sourceRecipes.map((recipe) => recipe.source),
      metadata: {
        providerState,
        warnings: [
          requestContext.childrenMode
            ? "No child-friendly recipes passed validation."
            : "No valid generated recipes were produced.",
        ],
        fallbackReason: requestContext.childrenMode
          ? "children-validation-empty"
          : "generation-empty",
      },
    };
  }

  const warnings = [];
  if (!providerState.geminiConfigured)
    warnings.push(
      "Gemini is not configured, so results were adapted directly from extracted source recipes.",
    );
  if (!providerState.searchConfigured)
    warnings.push(
      "No search provider is configured. Only local recipes are available until search credentials are added.",
    );
  if (requestContext.childrenMode)
    warnings.push(
      "Children mode is enforcing stricter ingredient and language filtering.",
    );

  return {
    mains,
    side: null,
    sources: sourceRecipes.map((recipe) => recipe.source),
    metadata: {
      providerState,
      warnings,
      fallbackReason:
        generatedRecipes && generatedRecipes.length > 0
          ? null
          : "used-extracted-sources",
    },
  };
}

module.exports = {
  suggestInternetRecipes,
  ensureKidFriendlyRecipe,
  getProviderState,
};
