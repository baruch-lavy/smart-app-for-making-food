const { randomUUID } = require('crypto');

const GENERATED_RECIPE_TTL_MS = 1000 * 60 * 60;
const generatedRecipeStore = new Map();

function cleanupExpiredRecipes() {
  const now = Date.now();
  for (const [id, entry] of generatedRecipeStore.entries()) {
    if (entry.expiresAt <= now) {
      generatedRecipeStore.delete(id);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredRecipes, 1000 * 60 * 10);
cleanupTimer.unref();

function saveGeneratedRecipe(recipe) {
  const id = recipe._id || `generated-${randomUUID()}`;
  const normalizedRecipe = {
    ...recipe,
    _id: id,
    isGenerated: true,
  };

  generatedRecipeStore.set(id, {
    recipe: normalizedRecipe,
    expiresAt: Date.now() + GENERATED_RECIPE_TTL_MS,
  });

  return normalizedRecipe;
}

function getGeneratedRecipe(id) {
  const entry = generatedRecipeStore.get(id);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    generatedRecipeStore.delete(id);
    return null;
  }

  return entry.recipe;
}

module.exports = {
  saveGeneratedRecipe,
  getGeneratedRecipe,
};