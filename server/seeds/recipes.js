require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const recipes = [
  {
    title: 'Classic Margherita Pizza',
    description: 'A timeless Italian pizza with fresh tomatoes, mozzarella, and basil.',
    cuisine: 'Italian',
    difficulty: 'medium',
    cookingTime: 20,
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'pizza dough', amount: '1', unit: 'ball' },
      { name: 'tomato sauce', amount: '1/2', unit: 'cup' },
      { name: 'fresh mozzarella', amount: '200', unit: 'g' },
      { name: 'fresh basil', amount: '10', unit: 'leaves' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: '1', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Preheat oven to 250°C (480°F) with a pizza stone inside.', tip: 'Place the stone in a cold oven before turning it on to avoid cracking.', whyItMatters: 'A very hot oven mimics a wood-fired pizza oven, creating a crispy crust.' },
      { order: 2, instruction: 'Stretch the dough on a floured surface into a 12-inch circle.', tip: 'Use your fists to gently stretch from the center outward, not a rolling pin.', whyItMatters: 'Stretching by hand preserves the air bubbles that make the crust light and airy.' },
      { order: 3, instruction: 'Spread tomato sauce evenly, leaving a 1-inch border.', tip: 'Dont over-sauce — less is more for authentic pizza.', whyItMatters: 'Too much sauce makes the center soggy and overwhelms the other flavors.' },
      { order: 4, instruction: 'Tear mozzarella into pieces and scatter over the sauce.', tip: 'Pat the mozzarella dry with paper towels first if its very wet.', whyItMatters: 'Wet cheese releases water during baking, making the pizza soggy.' },
      { order: 5, instruction: 'Bake for 10-12 minutes until crust is golden and cheese is bubbly.', tip: 'Watch it closely at the end — it can go from perfect to burned quickly.', whyItMatters: 'High heat caramelizes the crust and creates the signature leopard-spotted char.' },
      { order: 6, instruction: 'Remove from oven, top with fresh basil leaves and a drizzle of olive oil.', tip: 'Add basil after baking to preserve its bright color and fresh aroma.', whyItMatters: 'Heat destroys basils volatile oils quickly, making it dull and bitter.' }
    ],
    tags: ['Italian', 'vegetarian', 'pizza', 'classic'],
    nutritionInfo: { calories: 285, protein: 12, carbs: 36, fat: 10 }
  },
  {
    title: 'Chicken Fried Rice',
    description: 'A quick and flavorful Asian-style fried rice with chicken and vegetables.',
    cuisine: 'Asian',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 3,
    ingredients: [
      { name: 'cooked rice', amount: '3', unit: 'cups' },
      { name: 'chicken breast', amount: '200', unit: 'g' },
      { name: 'egg', amount: '2', unit: 'whole' },
      { name: 'soy sauce', amount: '3', unit: 'tbsp' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'green onions', amount: '3', unit: 'stalks' },
      { name: 'sesame oil', amount: '1', unit: 'tbsp' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Dice chicken into small cubes and season with a pinch of salt.', tip: 'Use day-old refrigerated rice for best texture — fresh rice is too moist.', whyItMatters: 'Dry rice fries better without clumping, giving you individual, separate grains.' },
      { order: 2, instruction: 'Heat oil in a wok over high heat. Cook chicken until golden, about 4 minutes. Set aside.', tip: 'Dont overcrowd the wok — cook in batches if needed.', whyItMatters: 'High heat and space creates the "wok hei" smoky flavor that makes fried rice special.' },
      { order: 3, instruction: 'Add garlic and stir-fry 30 seconds until fragrant.', tip: 'Have all ingredients ready before you start — fried rice cooks fast.', whyItMatters: 'Garlic burns easily; timing is crucial to get flavor without bitterness.' },
      { order: 4, instruction: 'Push ingredients to the side, scramble eggs in the center, then mix in.', tip: 'Let eggs set slightly before scrambling for fluffier curds.', whyItMatters: 'Cooking eggs separately from other ingredients ensures proper texture.' },
      { order: 5, instruction: 'Add rice, breaking up any clumps. Stir-fry 3 minutes.', tip: 'Press rice against the hot wok occasionally to get crispy bits.', whyItMatters: 'Those crispy rice bits (socarrat) add textural contrast and deep flavor.' },
      { order: 6, instruction: 'Add chicken back, soy sauce, and sesame oil. Toss and serve topped with green onions.', tip: 'Sesame oil is a finishing oil — add at the end to preserve its delicate flavor.', whyItMatters: 'Cooking sesame oil destroys its complex nutty notes; adding it last maximizes aroma.' }
    ],
    tags: ['Asian', 'quick', 'chicken', 'rice'],
    nutritionInfo: { calories: 420, protein: 28, carbs: 52, fat: 12 }
  },
  {
    title: 'Classic Guacamole',
    description: 'Creamy, tangy Mexican guacamole made fresh in minutes.',
    cuisine: 'Mexican',
    difficulty: 'easy',
    cookingTime: 0,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'avocado', amount: '3', unit: 'ripe' },
      { name: 'lime juice', amount: '2', unit: 'tbsp' },
      { name: 'cilantro', amount: '1/4', unit: 'cup' },
      { name: 'red onion', amount: '1/4', unit: 'cup' },
      { name: 'jalapeño', amount: '1', unit: 'small' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'garlic', amount: '1', unit: 'clove' }
    ],
    steps: [
      { order: 1, instruction: 'Halve and pit the avocados. Scoop flesh into a bowl.', tip: 'Use a spoon to scoop close to the dark green flesh near the skin — that is where nutrients are concentrated.', whyItMatters: 'The outermost flesh has the most antioxidants and gives guacamole its vibrant green color.' },
      { order: 2, instruction: 'Add lime juice and mash to your desired texture.', tip: 'Add lime juice immediately after cutting to prevent browning.', whyItMatters: 'Lime juices acidity slows the oxidation that turns avocado brown.' },
      { order: 3, instruction: 'Finely dice onion and jalapeño, mince garlic, chop cilantro.', tip: 'Rinse diced onion under cold water to remove harsh bite.', whyItMatters: 'Rinsing removes sulfurous compounds that can overpower the delicate avocado flavor.' },
      { order: 4, instruction: 'Fold in all vegetables and salt. Taste and adjust seasoning.', tip: 'Always taste before serving — a little more lime or salt can transform it.', whyItMatters: 'Seasoning is the difference between flat guacamole and one that pops with flavor.' }
    ],
    tags: ['Mexican', 'vegetarian', 'vegan', 'quick', 'dip'],
    nutritionInfo: { calories: 160, protein: 2, carbs: 9, fat: 15 }
  },
  {
    title: 'Greek Salad (Horiatiki)',
    description: 'A refreshing and authentic Greek village salad with crisp vegetables and feta.',
    cuisine: 'Mediterranean',
    difficulty: 'easy',
    cookingTime: 0,
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'tomatoes', amount: '4', unit: 'large' },
      { name: 'cucumber', amount: '1', unit: 'large' },
      { name: 'red onion', amount: '1', unit: 'small' },
      { name: 'kalamata olives', amount: '1/2', unit: 'cup' },
      { name: 'feta cheese', amount: '200', unit: 'g' },
      { name: 'green bell pepper', amount: '1', unit: 'whole' },
      { name: 'olive oil', amount: '4', unit: 'tbsp' },
      { name: 'dried oregano', amount: '1', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Cut tomatoes into wedges and cucumber into thick half-moons.', tip: 'Do not refrigerate tomatoes — cold kills their flavor and texture.', whyItMatters: 'Room temperature tomatoes have fuller, sweeter flavor than cold ones.' },
      { order: 2, instruction: 'Thinly slice the red onion and green pepper into rings.', tip: 'Soak red onion slices in cold water for 5 minutes to mellow their sharpness.', whyItMatters: 'Raw red onion can be very pungent and distract from the fresh vegetable flavors.' },
      { order: 3, instruction: 'Combine all vegetables and olives in a large bowl.', tip: 'Use the best quality olive oil you can afford — it is the dressing.', whyItMatters: 'In simple dishes, ingredient quality shines through since there is nothing to hide behind.' },
      { order: 4, instruction: 'Place a block of feta on top, drizzle with olive oil, sprinkle oregano, and serve.', tip: 'Dont crumble the feta — serve it as a block for a more authentic presentation.', whyItMatters: 'A block of feta looks dramatic and lets diners break off their preferred amount.' }
    ],
    tags: ['Mediterranean', 'vegetarian', 'Greek', 'salad', 'quick', 'healthy'],
    nutritionInfo: { calories: 220, protein: 8, carbs: 12, fat: 17 }
  },
  {
    title: 'Classic Beef Burger',
    description: 'A juicy homemade beef burger with all the classic toppings.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 10,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'ground beef', amount: '500', unit: 'g' },
      { name: 'burger buns', amount: '4', unit: 'whole' },
      { name: 'lettuce', amount: '4', unit: 'leaves' },
      { name: 'tomato', amount: '2', unit: 'medium' },
      { name: 'cheddar cheese', amount: '4', unit: 'slices' },
      { name: 'onion', amount: '1', unit: 'medium' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'black pepper', amount: '1/2', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Mix beef with salt and pepper. Divide into 4 equal portions.', tip: 'Handle the meat as little as possible — overworking makes tough burgers.', whyItMatters: 'Less handling keeps fat distributed evenly and results in a tender, juicy patty.' },
      { order: 2, instruction: 'Form patties slightly larger than the bun with an indent in the center.', tip: 'Make a dimple in the center with your thumb.', whyItMatters: 'Patties shrink and puff up during cooking; the dimple ensures they stay flat.' },
      { order: 3, instruction: 'Heat grill or pan to high heat. Cook patties 3-4 minutes per side.', tip: 'Do not press the patty while cooking — youll squeeze out the precious juices.', whyItMatters: 'Burgers are juicy because fat melts into the meat; pressing forces that moisture out.' },
      { order: 4, instruction: 'Add cheese slice in last minute of cooking. Toast buns alongside.', tip: 'Cover the pan briefly after adding cheese to melt it with steam.', whyItMatters: 'Steam melts cheese evenly without overcooking the patty.' },
      { order: 5, instruction: 'Assemble burgers with desired toppings and serve immediately.', tip: 'Put condiments on bun, not patty, to prevent sogginess.', whyItMatters: 'Sauce on the patty causes steam to soften the bun and makes it fall apart.' }
    ],
    tags: ['American', 'beef', 'burger', 'classic'],
    nutritionInfo: { calories: 580, protein: 38, carbs: 35, fat: 32 }
  },
  {
    title: 'Butter Chicken (Murgh Makhani)',
    description: 'Rich and creamy Indian butter chicken with aromatic spices.',
    cuisine: 'Indian',
    difficulty: 'medium',
    cookingTime: 40,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'chicken thighs', amount: '700', unit: 'g' },
      { name: 'butter', amount: '3', unit: 'tbsp' },
      { name: 'heavy cream', amount: '1/2', unit: 'cup' },
      { name: 'tomato puree', amount: '400', unit: 'g' },
      { name: 'garlic', amount: '5', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'inch' },
      { name: 'garam masala', amount: '2', unit: 'tsp' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'turmeric', amount: '1/2', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Marinate chicken in yogurt, garam masala, turmeric, and salt for at least 1 hour.', tip: 'Overnight marination gives deeper flavor penetration.', whyItMatters: 'Yogurs lactic acid tenderizes the protein fibers, making the chicken incredibly moist.' },
      { order: 2, instruction: 'Grill or pan-fry chicken until charred on edges. Set aside.', tip: 'Get a good char — the slight smokiness is key to authentic butter chicken.', whyItMatters: 'The Maillard reaction creates hundreds of flavor compounds that define the dish.' },
      { order: 3, instruction: 'Sauté garlic and ginger in butter until fragrant.', tip: 'Use unsalted butter to control seasoning throughout the dish.', whyItMatters: 'Butter carries and amplifies fat-soluble spice flavors better than oil.' },
      { order: 4, instruction: 'Add tomato puree and spices. Simmer 15 minutes, stirring occasionally.', tip: 'Simmer uncovered to concentrate the sauce and develop depth.', whyItMatters: 'Reducing the sauce intensifies flavors and evaporates acidic notes from the tomato.' },
      { order: 5, instruction: 'Blend sauce until smooth if desired, then return to pan.', tip: 'Blend when slightly cooled; hot liquids can splatter in a blender.', whyItMatters: 'A smooth sauce coats the chicken more evenly and gives the dish its silky texture.' },
      { order: 6, instruction: 'Add chicken and cream. Simmer 10 minutes more. Serve with rice or naan.', tip: 'Add a small pat of cold butter at the end for extra richness (beurre monté technique).', whyItMatters: 'Finishing with cold butter emulsifies into the sauce, creating an incredibly glossy, rich texture.' }
    ],
    tags: ['Indian', 'chicken', 'curry', 'creamy'],
    nutritionInfo: { calories: 520, protein: 42, carbs: 18, fat: 34 }
  },
  {
    title: 'Spaghetti Carbonara',
    description: 'Authentic Roman pasta with eggs, Pecorino cheese, guanciale, and black pepper.',
    cuisine: 'Italian',
    difficulty: 'medium',
    cookingTime: 20,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'spaghetti', amount: '400', unit: 'g' },
      { name: 'guanciale or pancetta', amount: '150', unit: 'g' },
      { name: 'egg yolks', amount: '4', unit: 'whole' },
      { name: 'Pecorino Romano cheese', amount: '100', unit: 'g' },
      { name: 'black pepper', amount: '2', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Bring a large pot of salted water to a boil. Cook spaghetti until al dente.', tip: 'Reserve 1 cup of pasta water before draining — it is liquid gold.', whyItMatters: 'Starchy pasta water is the emulsifier that turns eggs and cheese into a silky sauce.' },
      { order: 2, instruction: 'Cook guanciale in a pan over medium heat until crispy. Remove from heat.', tip: 'Cook in its own fat — no need to add oil. The rendered fat becomes part of the sauce.', whyItMatters: 'The rendered pork fat carries intense flavor and helps emulsify the final sauce.' },
      { order: 3, instruction: 'Whisk egg yolks with grated cheese and plenty of black pepper.', tip: 'Use a 3:1 ratio of Pecorino to Parmigiano for a well-balanced, less salty sauce.', whyItMatters: 'Cheese dilutes the egg slightly, preventing it from scrambling too fast when you add hot pasta.' },
      { order: 4, instruction: 'Add hot drained pasta to the pan with guanciale. Remove pan from heat.', tip: 'This is crucial — the pan must be OFF the heat when you add the egg mixture.', whyItMatters: 'Too much heat scrambles the eggs instead of creating a creamy emulsified sauce.' },
      { order: 5, instruction: 'Pour egg mixture over pasta, tossing quickly and adding pasta water splash by splash.', tip: 'Toss vigorously and continuously while adding pasta water a little at a time.', whyItMatters: 'The tossing motion and steam from pasta water emulsifies fats and proteins into a smooth sauce.' }
    ],
    tags: ['Italian', 'pasta', 'classic', 'quick'],
    nutritionInfo: { calories: 620, protein: 28, carbs: 72, fat: 24 }
  },
  {
    title: 'Miso Soup',
    description: 'A soothing and umami-rich Japanese miso soup with tofu and wakame.',
    cuisine: 'Asian',
    difficulty: 'easy',
    cookingTime: 10,
    prepTime: 5,
    servings: 4,
    ingredients: [
      { name: 'dashi stock', amount: '4', unit: 'cups' },
      { name: 'white miso paste', amount: '3', unit: 'tbsp' },
      { name: 'silken tofu', amount: '200', unit: 'g' },
      { name: 'dried wakame seaweed', amount: '2', unit: 'tbsp' },
      { name: 'green onions', amount: '2', unit: 'stalks' }
    ],
    steps: [
      { order: 1, instruction: 'Rehydrate dried wakame in cold water for 5 minutes. Drain.', tip: 'Wakame expands significantly — start with less than you think you need.', whyItMatters: 'Properly rehydrated wakame has a pleasant chewy texture without being slimy.' },
      { order: 2, instruction: 'Heat dashi stock to just below boiling.', tip: 'Never boil miso soup — it destroys beneficial probiotics and changes the flavor.', whyItMatters: 'Miso is a fermented food; high heat kills the live cultures and makes it taste flat.' },
      { order: 3, instruction: 'Dissolve miso paste in a small amount of warm dashi before adding to the pot.', tip: 'Use a small fine-mesh strainer to press and dissolve the miso smoothly.', whyItMatters: 'Dissolving separately prevents lumps and ensures even flavor distribution.' },
      { order: 4, instruction: 'Add tofu cubes and wakame. Heat briefly, then serve garnished with green onions.', tip: 'Cut silken tofu gently with a spoon rather than a knife to avoid breaking it.', whyItMatters: 'Silken tofu is very delicate; rough handling destroys the soft, custardy texture.' }
    ],
    tags: ['Asian', 'Japanese', 'vegetarian', 'soup', 'quick', 'healthy'],
    nutritionInfo: { calories: 80, protein: 6, carbs: 8, fat: 3 }
  },
  {
    title: 'Tacos al Pastor',
    description: 'Authentic Mexican street-style tacos with marinated pork and pineapple.',
    cuisine: 'Mexican',
    difficulty: 'medium',
    cookingTime: 25,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'pork shoulder', amount: '500', unit: 'g' },
      { name: 'corn tortillas', amount: '12', unit: 'small' },
      { name: 'pineapple', amount: '1/4', unit: 'whole' },
      { name: 'dried guajillo chiles', amount: '3', unit: 'whole' },
      { name: 'achiote paste', amount: '2', unit: 'tbsp' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'white onion', amount: '1', unit: 'medium' },
      { name: 'cilantro', amount: '1/4', unit: 'cup' },
      { name: 'lime', amount: '2', unit: 'whole' }
    ],
    steps: [
      { order: 1, instruction: 'Toast dried chiles briefly in a dry pan, then soak in hot water for 15 minutes.', tip: 'Toast until just fragrant — about 30 seconds per side. Toasting too long makes them bitter.', whyItMatters: 'Toasting activates and deepens the flavor compounds in dried chiles.' },
      { order: 2, instruction: 'Blend soaked chiles with achiote, garlic, and a bit of chile soaking water into a smooth paste.', tip: 'Wear gloves when handling chiles — capsaicin lingers on skin.', whyItMatters: 'The achiote provides the characteristic red-orange color and earthy, peppery flavor.' },
      { order: 3, instruction: 'Slice pork thin, coat with paste, marinate at least 2 hours.', tip: 'Slice against the grain for more tender meat after cooking.', whyItMatters: 'Cutting against the grain shortens muscle fibers, making each bite easier to chew.' },
      { order: 4, instruction: 'Cook marinated pork in a hot pan until caramelized. Add pineapple chunks and cook 2 minutes.', tip: 'Cook in batches to avoid steaming — you want caramelization, not braising.', whyItMatters: 'Caramelized pineapple adds sweet-acid balance that cuts through the rich, fatty pork.' },
      { order: 5, instruction: 'Warm tortillas on a dry pan. Serve pork and pineapple with diced onion, cilantro, and lime.', tip: 'Double up your tortillas for authentic street taco style.', whyItMatters: 'A double tortilla prevents splitting under the weight of fillings.' }
    ],
    tags: ['Mexican', 'pork', 'tacos', 'street food'],
    nutritionInfo: { calories: 380, protein: 28, carbs: 35, fat: 14 }
  },
  {
    title: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato and pepper sauce, popular across the Mediterranean.',
    cuisine: 'Mediterranean',
    difficulty: 'easy',
    cookingTime: 25,
    prepTime: 10,
    servings: 3,
    ingredients: [
      { name: 'eggs', amount: '6', unit: 'whole' },
      { name: 'crushed tomatoes', amount: '400', unit: 'g' },
      { name: 'red bell pepper', amount: '2', unit: 'medium' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'paprika', amount: '1', unit: 'tsp' },
      { name: 'cayenne', amount: '1/4', unit: 'tsp' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Sauté diced onion and bell pepper in olive oil until soft, about 8 minutes.', tip: 'Take your time with this step — well-cooked onions are the foundation of flavor.', whyItMatters: 'Cooking onions slowly caramelizes their natural sugars, building a sweet, savory base.' },
      { order: 2, instruction: 'Add garlic and spices. Cook 1 minute until fragrant.', tip: 'Add spices before the tomatoes so they bloom in the oil.', whyItMatters: 'Blooming spices in fat releases fat-soluble flavor compounds that water cannot extract.' },
      { order: 3, instruction: 'Pour in tomatoes. Simmer 10 minutes, stirring occasionally.', tip: 'Taste the sauce before adding eggs — it should be well-seasoned and slightly sweet.', whyItMatters: 'Eggs will dilute the sauce flavor slightly, so a well-seasoned base is essential.' },
      { order: 4, instruction: 'Make wells in the sauce and crack eggs into them. Cover and cook 5-7 minutes.', tip: 'For runny yolks, remove from heat just as the whites set but yolks still jiggle.', whyItMatters: 'Eggs continue cooking from residual heat after you remove the pan.' },
      { order: 5, instruction: 'Serve directly from pan with crusty bread.', tip: 'Crumble feta on top just before serving for a creamy, salty contrast.', whyItMatters: 'The cold, creamy feta against the hot, spicy sauce creates a delightful temperature and flavor contrast.' }
    ],
    tags: ['Mediterranean', 'vegetarian', 'eggs', 'breakfast', 'brunch'],
    nutritionInfo: { calories: 240, protein: 14, carbs: 18, fat: 13 }
  },
  {
    title: 'Pad Thai',
    description: 'Thailand is beloved for its stir-fried rice noodles with shrimp, eggs, and peanuts.',
    cuisine: 'Asian',
    difficulty: 'medium',
    cookingTime: 20,
    prepTime: 15,
    servings: 3,
    ingredients: [
      { name: 'rice noodles', amount: '200', unit: 'g' },
      { name: 'shrimp', amount: '250', unit: 'g' },
      { name: 'egg', amount: '2', unit: 'whole' },
      { name: 'bean sprouts', amount: '1', unit: 'cup' },
      { name: 'fish sauce', amount: '3', unit: 'tbsp' },
      { name: 'tamarind paste', amount: '2', unit: 'tbsp' },
      { name: 'brown sugar', amount: '1', unit: 'tbsp' },
      { name: 'roasted peanuts', amount: '1/4', unit: 'cup' },
      { name: 'lime', amount: '2', unit: 'whole' },
      { name: 'green onions', amount: '3', unit: 'stalks' }
    ],
    steps: [
      { order: 1, instruction: 'Soak rice noodles in room temperature water for 30 minutes until pliable.', tip: 'Do not use hot water — noodles should be barely softened to finish cooking in the wok.', whyItMatters: 'Over-soaked noodles will turn mushy in the wok. They should still have a slight firmness.' },
      { order: 2, instruction: 'Mix fish sauce, tamarind paste, and sugar into a sauce.', tip: 'Taste and adjust the balance — it should be sour, sweet, and salty in equal measure.', whyItMatters: 'Pad Thai is about balance of the four Thai flavor pillars: sour, sweet, salty, and spicy.' },
      { order: 3, instruction: 'Stir-fry shrimp in hot wok until pink, about 2 minutes. Push to side, scramble eggs in center.', tip: 'High heat is non-negotiable — a lukewarm wok produces steamed, not fried, food.', whyItMatters: 'The extreme heat creates smoky "wok hei" flavor that is central to Thai street food.' },
      { order: 4, instruction: 'Add drained noodles and sauce. Toss everything together for 3-4 minutes.', tip: 'Add a splash of water if noodles stick — this creates steam that helps them cook.', whyItMatters: 'Steam in the wok finishes cooking the noodles while keeping them from burning.' },
      { order: 5, instruction: 'Add bean sprouts and green onions. Serve with peanuts, lime wedges, and chili flakes.', tip: 'Add bean sprouts last — they should be warm but still crunchy.', whyItMatters: 'Overcooked sprouts turn limp and release water, making your noodles soggy.' }
    ],
    tags: ['Asian', 'Thai', 'noodles', 'seafood'],
    nutritionInfo: { calories: 480, protein: 32, carbs: 56, fat: 14 }
  },
  {
    title: 'French Onion Soup',
    description: 'Rich, deeply flavored French soup with caramelized onions and a cheesy crouton.',
    cuisine: 'Mediterranean',
    difficulty: 'medium',
    cookingTime: 60,
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'yellow onions', amount: '6', unit: 'large' },
      { name: 'beef stock', amount: '1.5', unit: 'liters' },
      { name: 'dry white wine', amount: '1/2', unit: 'cup' },
      { name: 'baguette', amount: '1', unit: 'whole' },
      { name: 'Gruyère cheese', amount: '200', unit: 'g' },
      { name: 'butter', amount: '3', unit: 'tbsp' },
      { name: 'thyme', amount: '4', unit: 'sprigs' },
      { name: 'bay leaf', amount: '2', unit: 'whole' }
    ],
    steps: [
      { order: 1, instruction: 'Slice onions into thin rings. Melt butter in a heavy pot over medium-low heat.', tip: 'Use a wide, heavy-bottomed pot to maximize surface area and heat distribution.', whyItMatters: 'Wider surface means more onions contact heat, caramelizing faster and more evenly.' },
      { order: 2, instruction: 'Add onions and cook, stirring occasionally, for 45-60 minutes until deep golden brown.', tip: 'Patience is the secret ingredient. Stir every 5-10 minutes and resist high heat.', whyItMatters: 'Properly caramelized onions develop dozens of new flavor compounds through the Maillard reaction.' },
      { order: 3, instruction: 'Deglaze with white wine, scraping up any brown bits. Simmer until reduced.', tip: 'Those dark bits on the bottom are concentrated flavor — the wine lifts them into the soup.', whyItMatters: 'Deglazing recovers the fond, which contains the most intensely flavored molecules in the pot.' },
      { order: 4, instruction: 'Add stock, thyme, and bay leaf. Simmer 15 minutes.', tip: 'Taste and season carefully — good beef stock is already salty.', whyItMatters: 'The stock needs time to meld with the onions, creating a unified, complex flavor.' },
      { order: 5, instruction: 'Ladle soup into oven-safe bowls. Top with baguette slice and grated Gruyère.', tip: 'Use enough cheese to fully cover the bread and soup surface.', whyItMatters: 'The cheese forms a sealed lid that traps steam, keeping the bread from becoming too soggy.' },
      { order: 6, instruction: 'Broil 3-4 minutes until cheese is bubbly and golden brown.', tip: 'Watch carefully under the broiler — cheese goes from golden to burned in seconds.', whyItMatters: 'Bubbling cheese indicates the proteins have denatured and fats have melted into a gooey, stretchy layer.' }
    ],
    tags: ['Mediterranean', 'French', 'soup', 'winter'],
    nutritionInfo: { calories: 380, protein: 18, carbs: 32, fat: 20 }
  },
  {
    title: 'Chicken Tikka Masala',
    description: 'Tender chicken pieces in a rich, aromatic tomato-cream sauce.',
    cuisine: 'Indian',
    difficulty: 'medium',
    cookingTime: 35,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'chicken breast', amount: '700', unit: 'g' },
      { name: 'yogurt', amount: '1/2', unit: 'cup' },
      { name: 'crushed tomatoes', amount: '400', unit: 'g' },
      { name: 'heavy cream', amount: '1/2', unit: 'cup' },
      { name: 'garlic', amount: '5', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'inch' },
      { name: 'garam masala', amount: '2', unit: 'tsp' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'coriander', amount: '1', unit: 'tsp' },
      { name: 'butter', amount: '2', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Cube chicken, mix with yogurt, half the spices, and salt. Marinate 2-24 hours.', tip: 'Overnight in the fridge gives spectacular results — the yogurt deeply tenderizes the meat.', whyItMatters: 'Lactic acid in yogurt breaks down muscle proteins, creating incredibly tender chicken.' },
      { order: 2, instruction: 'Grill or broil chicken pieces until lightly charred. Set aside.', tip: 'You want char marks but not fully cooked — it will finish in the sauce.', whyItMatters: 'The char adds smokiness that contrasts beautifully with the rich, creamy sauce.' },
      { order: 3, instruction: 'Sauté garlic and ginger in butter. Add remaining spices and toast 1 minute.', tip: 'The kitchen should smell incredible at this step — if it does not, your spices may be old.', whyItMatters: 'Fresh spices are at their most potent; old spices can give dull, flat flavor.' },
      { order: 4, instruction: 'Add tomatoes and simmer 15 minutes until sauce darkens and thickens.', tip: 'The sauce should be thick enough to coat the back of a spoon before adding cream.', whyItMatters: 'A concentrated sauce means more flavor per bite when the cream is added.' },
      { order: 5, instruction: 'Add cream and chicken. Simmer gently 10 minutes. Serve with rice or naan.', tip: 'Add a pinch of sugar if the sauce tastes too acidic.', whyItMatters: 'A tiny bit of sweetness rounds out acidity from tomatoes and creates flavor balance.' }
    ],
    tags: ['Indian', 'chicken', 'curry', 'creamy'],
    nutritionInfo: { calories: 490, protein: 45, carbs: 15, fat: 28 }
  },
  {
    title: 'Avocado Toast with Poached Eggs',
    description: 'Trendy and nutritious toast topped with creamy avocado and perfectly poached eggs.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 10,
    prepTime: 5,
    servings: 2,
    ingredients: [
      { name: 'sourdough bread', amount: '4', unit: 'slices' },
      { name: 'avocado', amount: '2', unit: 'ripe' },
      { name: 'egg', amount: '4', unit: 'whole' },
      { name: 'lemon juice', amount: '1', unit: 'tbsp' },
      { name: 'red pepper flakes', amount: '1/4', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'white vinegar', amount: '1', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Toast bread until golden and crispy.', tip: 'A slightly underdone toast will get soggy under the avocado and egg.', whyItMatters: 'A sturdy, well-toasted base supports the toppings and provides textural contrast.' },
      { order: 2, instruction: 'Mash avocado with lemon juice and salt.', tip: 'Keep the avocado slightly chunky — texture is more interesting than a smooth paste.', whyItMatters: 'Lemon juice seasons the avocado while also preventing oxidation and browning.' },
      { order: 3, instruction: 'Fill a deep pan with water, add vinegar, bring to a gentle simmer.', tip: 'The water should barely be simmering — large bubbles will tear the egg whites.', whyItMatters: 'Acidic water helps egg whites coagulate quickly around the yolk for a neat shape.' },
      { order: 4, instruction: 'Swirl water gently, crack each egg into a small cup, then slide into the swirl.', tip: 'The swirl wraps the white around the yolk, creating a compact, neat poached egg.', whyItMatters: 'The centripetal force of the swirl prevents the white from spreading in all directions.' },
      { order: 5, instruction: 'Poach 3 minutes for runny yolks. Remove with a slotted spoon, drain on a paper towel.', tip: 'Use a timer — even 30 extra seconds can take you from runny to hard yolk.', whyItMatters: 'Timing is everything with poached eggs; each extra minute firms the yolk significantly.' },
      { order: 6, instruction: 'Spread avocado on toast, top with poached egg, season with red pepper flakes.', tip: 'Serve immediately — poached eggs cool down quickly.', whyItMatters: 'A warm egg on cool avocado creates a pleasant temperature contrast when eating.' }
    ],
    tags: ['American', 'vegetarian', 'breakfast', 'brunch', 'quick', 'healthy'],
    nutritionInfo: { calories: 380, protein: 18, carbs: 32, fat: 22 }
  },
  {
    title: 'Ramen Noodle Bowl',
    description: 'A deeply satisfying Japanese-style ramen with a rich broth and soft-boiled egg.',
    cuisine: 'Asian',
    difficulty: 'hard',
    cookingTime: 180,
    prepTime: 30,
    servings: 4,
    ingredients: [
      { name: 'pork belly', amount: '400', unit: 'g' },
      { name: 'ramen noodles', amount: '400', unit: 'g' },
      { name: 'egg', amount: '4', unit: 'whole' },
      { name: 'chicken stock', amount: '2', unit: 'liters' },
      { name: 'soy sauce', amount: '4', unit: 'tbsp' },
      { name: 'miso paste', amount: '3', unit: 'tbsp' },
      { name: 'garlic', amount: '6', unit: 'cloves' },
      { name: 'ginger', amount: '2', unit: 'inches' },
      { name: 'green onions', amount: '4', unit: 'stalks' },
      { name: 'corn', amount: '1', unit: 'cup' },
      { name: 'nori sheets', amount: '4', unit: 'whole' }
    ],
    steps: [
      { order: 1, instruction: 'Score pork belly and season generously. Sear on all sides in a heavy pot.', tip: 'Get a deep brown sear — the color is flavor.', whyItMatters: 'Searing the pork creates the flavorful Maillard compounds that form the backbone of the broth.' },
      { order: 2, instruction: 'Add stock, garlic, ginger to the pot. Simmer covered for 2-3 hours.', tip: 'Skim the foam that rises in the first 20 minutes for a cleaner, clearer broth.', whyItMatters: 'Foam contains impurities and denatured proteins that cloud the broth and affect flavor.' },
      { order: 3, instruction: 'Soft-boil eggs for exactly 6.5 minutes. Ice bath immediately, peel, marinate in soy sauce.', tip: 'Use eggs directly from the fridge — cold eggs give you more control over timing.', whyItMatters: 'Starting from a known cold temperature makes the cooking time reliable and reproducible.' },
      { order: 4, instruction: 'Remove pork, slice thin. Season broth with soy sauce and miso.', tip: 'Never boil miso broth — add miso after removing from heat for best flavor.', whyItMatters: 'Boiling destroys miso is fermented probiotics and creates a bitter, flat taste.' },
      { order: 5, instruction: 'Cook noodles according to package. Divide into bowls, ladle hot broth over.', tip: 'Heat your bowls with boiling water before serving — cold bowls cool ramen too fast.', whyItMatters: 'Warm bowls maintain the soup temperature longer, giving you time to enjoy each component.' },
      { order: 6, instruction: 'Top with sliced pork, halved marinated eggs, corn, green onions, and nori.', tip: 'Arrange toppings deliberately — ramen is as much about visual presentation as flavor.', whyItMatters: 'Beautiful presentation signals care and sets mental expectations that enhance the eating experience.' }
    ],
    tags: ['Asian', 'Japanese', 'soup', 'noodles', 'pork'],
    nutritionInfo: { calories: 680, protein: 42, carbs: 68, fat: 28 }
  },
  {
    title: 'Lentil Dal',
    description: 'Hearty and comforting Indian spiced red lentil soup.',
    cuisine: 'Indian',
    difficulty: 'easy',
    cookingTime: 30,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'red lentils', amount: '300', unit: 'g' },
      { name: 'crushed tomatoes', amount: '200', unit: 'g' },
      { name: 'coconut milk', amount: '200', unit: 'ml' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'inch' },
      { name: 'turmeric', amount: '1', unit: 'tsp' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'garam masala', amount: '1', unit: 'tsp' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Rinse lentils until water runs clear. This removes excess starch.', tip: 'Red lentils cook in 20 minutes and need no soaking — perfect for weeknights.', whyItMatters: 'Rinsing prevents excess foam during cooking and results in a cleaner-tasting dal.' },
      { order: 2, instruction: 'Sauté diced onion until golden, about 8 minutes.', tip: 'Golden onions are sweet and mellow; raw onions would make the dal harsh.', whyItMatters: 'The Maillard reaction converts pungent onion sulfur compounds into sweet, complex sugars.' },
      { order: 3, instruction: 'Add garlic, ginger, and spices. Cook 2 minutes until fragrant.', tip: 'Add a splash of water if spices start to stick — they burn easily.', whyItMatters: 'Blooming spices in oil maximizes the release of their fat-soluble flavor molecules.' },
      { order: 4, instruction: 'Add lentils, tomatoes, coconut milk, and 2 cups water. Simmer 20 minutes.', tip: 'Stir occasionally and add water if it gets too thick — dal thickens as it cooks.', whyItMatters: 'Lentils absorb liquid continuously; proper hydration prevents burning and ensures even cooking.' },
      { order: 5, instruction: 'Mash lightly with the back of a spoon for a creamy texture. Serve with rice or naan.', tip: 'Finish with a squeeze of lemon juice to brighten all the flavors.', whyItMatters: 'Acid acts as a flavor enhancer, making other flavors taste more vibrant and pronounced.' }
    ],
    tags: ['Indian', 'vegetarian', 'vegan', 'lentils', 'healthy'],
    nutritionInfo: { calories: 340, protein: 18, carbs: 48, fat: 10 }
  },
  {
    title: 'BLT Sandwich',
    description: 'Classic American sandwich with crispy bacon, fresh lettuce, and ripe tomatoes.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 10,
    prepTime: 5,
    servings: 2,
    ingredients: [
      { name: 'bacon', amount: '8', unit: 'strips' },
      { name: 'white bread', amount: '4', unit: 'slices' },
      { name: 'tomato', amount: '2', unit: 'medium' },
      { name: 'romaine lettuce', amount: '4', unit: 'leaves' },
      { name: 'mayonnaise', amount: '3', unit: 'tbsp' },
      { name: 'salt', amount: '1/4', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Cook bacon in a pan over medium heat until crispy, turning once.', tip: 'Start bacon in a cold pan — it renders fat more slowly and evenly for crispier results.', whyItMatters: 'Starting cold allows fat to render out gradually, resulting in uniformly crispy strips.' },
      { order: 2, instruction: 'Toast bread while bacon cooks.', tip: 'Toast just long enough to be sturdy but not rock-hard.', whyItMatters: 'Toast prevents the bread from getting soggy from the tomatoes and mayo.' },
      { order: 3, instruction: 'Spread mayonnaise generously on both slices of toast.', tip: 'Season your mayo with a tiny pinch of salt and a drop of hot sauce for more flavor.', whyItMatters: 'Well-seasoned mayo amplifies the flavor of every other ingredient in the sandwich.' },
      { order: 4, instruction: 'Layer lettuce, tomato slices (seasoned with salt), then crispy bacon. Close and serve.', tip: 'Put lettuce against the mayo to create a moisture barrier protecting the bread.', whyItMatters: 'The lettuce layer prevents tomato juice from soaking directly into the toast.' }
    ],
    tags: ['American', 'sandwich', 'quick', 'classic', 'bacon'],
    nutritionInfo: { calories: 420, protein: 18, carbs: 28, fat: 28 }
  },
  {
    title: 'Vegetable Stir-Fry',
    description: 'A colorful and healthy Chinese-style vegetable stir-fry with garlic and oyster sauce.',
    cuisine: 'Asian',
    difficulty: 'easy',
    cookingTime: 10,
    prepTime: 15,
    servings: 3,
    ingredients: [
      { name: 'broccoli', amount: '1', unit: 'head' },
      { name: 'bell peppers', amount: '2', unit: 'mixed' },
      { name: 'snap peas', amount: '1', unit: 'cup' },
      { name: 'carrot', amount: '2', unit: 'medium' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'oyster sauce', amount: '3', unit: 'tbsp' },
      { name: 'sesame oil', amount: '1', unit: 'tsp' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Cut all vegetables into uniform, bite-sized pieces.', tip: 'Cut harder vegetables (carrot, broccoli) smaller than softer ones so they cook evenly.', whyItMatters: 'Uniform size ensures everything cooks in the same amount of time.' },
      { order: 2, instruction: 'Heat wok to smoking hot. Add oil, then garlic. Stir-fry 30 seconds.', tip: 'The wok should be so hot that a drop of water evaporates instantly.', whyItMatters: 'Extreme heat is what separates stir-fry from steaming — it creates texture and the "wok hei" flavor.' },
      { order: 3, instruction: 'Add harder vegetables first (carrots, broccoli), stir-fry 2 minutes.', tip: 'Keep everything moving — stir-fry means constant, vigorous movement.', whyItMatters: 'Constant motion prevents burning and ensures every piece gets equal contact with the hot surface.' },
      { order: 4, instruction: 'Add softer vegetables (peppers, snap peas). Stir-fry 2 more minutes.', tip: 'A splash of water or stock creates steam that helps cook through without burning.', whyItMatters: 'Adding liquid creates a brief steam that cooks vegetables from the inside.' },
      { order: 5, instruction: 'Add oyster sauce and sesame oil. Toss to coat. Serve immediately.', tip: 'Never keep stir-fry sitting — serve immediately to preserve crunch.', whyItMatters: 'Vegetables continue cooking from residual heat; immediate serving locks in the ideal texture.' }
    ],
    tags: ['Asian', 'vegetarian', 'vegan', 'healthy', 'quick'],
    nutritionInfo: { calories: 180, protein: 6, carbs: 22, fat: 9 }
  },
  {
    title: 'Caprese Salad',
    description: 'The simplest and most elegant Italian salad with fresh mozzarella, tomatoes, and basil.',
    cuisine: 'Italian',
    difficulty: 'easy',
    cookingTime: 0,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'fresh mozzarella', amount: '250', unit: 'g' },
      { name: 'tomatoes', amount: '4', unit: 'large ripe' },
      { name: 'fresh basil', amount: '20', unit: 'leaves' },
      { name: 'extra virgin olive oil', amount: '3', unit: 'tbsp' },
      { name: 'balsamic glaze', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: '1/2', unit: 'tsp' },
      { name: 'black pepper', amount: '1/4', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Slice tomatoes and mozzarella into 1/4-inch rounds.', tip: 'Use a sharp serrated knife for tomatoes to avoid crushing them.', whyItMatters: 'Crushed tomatoes release juice immediately, watering down the salad before it reaches the table.' },
      { order: 2, instruction: 'Alternate tomato and mozzarella slices on a platter.', tip: 'Slightly overlap each slice for an elegant, abundant presentation.', whyItMatters: 'Overlapping creates a beautiful pattern and means every bite gets both tomato and cheese.' },
      { order: 3, instruction: 'Tuck basil leaves between layers.', tip: 'Use whole leaves for dramatic appearance; chiffonade (thin strips) if preferred.', whyItMatters: 'Fresh basil is the aromatic bridge between the sweet tomato and milky mozzarella.' },
      { order: 4, instruction: 'Drizzle with olive oil and balsamic glaze. Season with salt and pepper just before serving.', tip: 'Use the best quality olive oil you have — its showcased here, not hidden.', whyItMatters: 'In simple dishes, each ingredient is prominent; inferior olive oil will noticeably diminish the dish.' }
    ],
    tags: ['Italian', 'vegetarian', 'salad', 'quick', 'no-cook'],
    nutritionInfo: { calories: 220, protein: 12, carbs: 8, fat: 16 }
  },
  {
    title: 'Chicken Caesar Salad',
    description: 'Classic Caesar salad with grilled chicken, house-made dressing, and parmesan crisps.',
    cuisine: 'American',
    difficulty: 'medium',
    cookingTime: 15,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'romaine lettuce', amount: '2', unit: 'heads' },
      { name: 'chicken breast', amount: '500', unit: 'g' },
      { name: 'parmesan cheese', amount: '100', unit: 'g' },
      { name: 'croutons', amount: '1', unit: 'cup' },
      { name: 'anchovy fillets', amount: '4', unit: 'whole' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'egg yolk', amount: '1', unit: 'whole' },
      { name: 'dijon mustard', amount: '1', unit: 'tsp' },
      { name: 'lemon juice', amount: '2', unit: 'tbsp' },
      { name: 'olive oil', amount: '1/4', unit: 'cup' }
    ],
    steps: [
      { order: 1, instruction: 'Season chicken with salt and pepper. Grill over high heat, 5-6 minutes per side.', tip: 'Let chicken rest 5 minutes before slicing — this is not optional.', whyItMatters: 'Resting allows juices to redistribute throughout the meat; cutting too early loses them all.' },
      { order: 2, instruction: 'Mash anchovies and garlic into a paste with the flat of a knife.', tip: 'Do not skip the anchovies — they provide savory depth without tasting "fishy".', whyItMatters: 'Anchovies dissolve into the dressing and provide glutamates that make everything taste more savory.' },
      { order: 3, instruction: 'Whisk together anchovy paste, egg yolk, mustard, and lemon juice.', tip: 'Room temperature egg yolk emulsifies better than a cold one.', whyItMatters: 'The yolk is lecithin acts as an emulsifier, binding the oil and water-based ingredients into a creamy dressing.' },
      { order: 4, instruction: 'Slowly drizzle in olive oil while whisking continuously to create the dressing.', tip: 'Add the oil drop by drop at first — rushing this breaks the emulsion.', whyItMatters: 'Slow addition allows the emulsifier (egg yolk) to coat each tiny oil droplet, preventing them from recombining.' },
      { order: 5, instruction: 'Toss romaine with dressing. Top with sliced chicken, croutons, and parmesan.', tip: 'Dress the leaves from the base up so dressing coats every part of the leaf.', whyItMatters: 'Every bite should have dressing — underdressed lettuce at the bottom is disappointing.' }
    ],
    tags: ['American', 'salad', 'chicken', 'classic'],
    nutritionInfo: { calories: 420, protein: 38, carbs: 18, fat: 22 }
  },
  {
    title: 'Hummus',
    description: 'Silky smooth Middle Eastern chickpea dip with tahini and lemon.',
    cuisine: 'Mediterranean',
    difficulty: 'easy',
    cookingTime: 0,
    prepTime: 15,
    servings: 6,
    ingredients: [
      { name: 'chickpeas', amount: '400', unit: 'g canned' },
      { name: 'tahini', amount: '3', unit: 'tbsp' },
      { name: 'lemon juice', amount: '3', unit: 'tbsp' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'olive oil', amount: '3', unit: 'tbsp' },
      { name: 'cumin', amount: '1/2', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'ice water', amount: '3', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Drain and rinse chickpeas. Remove any loose skins by rubbing them together.', tip: 'For ultra-smooth hummus, spend 5 minutes removing the skins from the chickpeas.', whyItMatters: 'Chickpea skins are what makes hummus grainy — removing them is the secret to restaurant-quality smoothness.' },
      { order: 2, instruction: 'Blend tahini with lemon juice and garlic first, until very smooth.', tip: 'Blend tahini alone first — it creates a creamy base that makes everything smoother.', whyItMatters: 'Pre-blending tahini emulsifies it with lemon juice, creating a smoother foundation.' },
      { order: 3, instruction: 'Add chickpeas and blend for at least 5 minutes, adding ice water gradually.', tip: 'Keep blending longer than you think necessary — the extended blending is what makes it silky.', whyItMatters: 'Prolonged blending breaks down more starch granules and incorporates air for an airy, light texture.' },
      { order: 4, instruction: 'Season with salt and cumin. Serve drizzled with olive oil and a sprinkle of paprika.', tip: 'Always taste after adding lemon — the brightness should be forward without being sharp.', whyItMatters: 'Lemon juice does not just add flavor; its acidity makes the other flavors taste more vivid and distinct.' }
    ],
    tags: ['Mediterranean', 'vegetarian', 'vegan', 'dip', 'quick', 'healthy'],
    nutritionInfo: { calories: 180, protein: 6, carbs: 18, fat: 10 }
  },
  {
    title: 'Pancakes',
    description: 'Fluffy American-style buttermilk pancakes perfect for weekend brunch.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 20,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'all-purpose flour', amount: '2', unit: 'cups' },
      { name: 'buttermilk', amount: '1.5', unit: 'cups' },
      { name: 'egg', amount: '2', unit: 'whole' },
      { name: 'butter', amount: '3', unit: 'tbsp melted' },
      { name: 'baking powder', amount: '2', unit: 'tsp' },
      { name: 'baking soda', amount: '1/2', unit: 'tsp' },
      { name: 'sugar', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: '1/2', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Whisk dry ingredients in one bowl and wet ingredients in another.', tip: 'Let buttermilk come to room temperature — cold buttermilk makes dense pancakes.', whyItMatters: 'Room temperature dairy incorporates more easily into batter, creating a more even texture.' },
      { order: 2, instruction: 'Pour wet ingredients into dry. Mix until JUST combined — lumps are okay.', tip: 'Overmixing develops gluten which makes pancakes tough and flat.', whyItMatters: 'Lumps mean you have not over-developed the gluten — they disappear during cooking and result in fluffiness.' },
      { order: 3, instruction: 'Let batter rest 5 minutes.', tip: 'During resting, the baking powder starts reacting, creating more bubbles.', whyItMatters: 'Resting allows flour to fully hydrate and leavening to begin working, ensuring maximum rise.' },
      { order: 4, instruction: 'Cook on a lightly buttered, medium-low griddle. Flip when bubbles form on the surface.', tip: 'Flip only once — multiple flips deflate the air bubbles that make pancakes fluffy.', whyItMatters: 'Surface bubbles indicate the bottom is set and the interior is mostly cooked through.' },
      { order: 5, instruction: 'Cook second side for 1-2 minutes until golden. Serve immediately with maple syrup.', tip: 'Keep finished pancakes in a 90°C oven while you cook the rest.', whyItMatters: 'Pancakes stale quickly; keeping them warm maintains texture so the whole batch is enjoyed hot.' }
    ],
    tags: ['American', 'vegetarian', 'breakfast', 'brunch', 'easy'],
    nutritionInfo: { calories: 320, protein: 8, carbs: 52, fat: 10 }
  },
  {
    title: 'Tomato Basil Pasta',
    description: 'Simple and elegant Italian pasta with fresh tomatoes and fragrant basil.',
    cuisine: 'Italian',
    difficulty: 'easy',
    cookingTime: 20,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'pasta', amount: '400', unit: 'g' },
      { name: 'cherry tomatoes', amount: '400', unit: 'g' },
      { name: 'fresh basil', amount: '1', unit: 'bunch' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'olive oil', amount: '5', unit: 'tbsp' },
      { name: 'parmesan cheese', amount: '60', unit: 'g' },
      { name: 'salt', amount: '1', unit: 'tbsp' },
      { name: 'red pepper flakes', amount: '1/4', unit: 'tsp' }
    ],
    steps: [
      { order: 1, instruction: 'Cook pasta in heavily salted boiling water until al dente.', tip: 'The pasta water should taste like the sea — generously salted water is the only chance to season the pasta itself.', whyItMatters: 'Salt penetrates pasta during cooking; no amount of sauce can season undersalted pasta.' },
      { order: 2, instruction: 'Halve cherry tomatoes. Mince garlic.', tip: 'Room temperature tomatoes give the sauce better flavor than refrigerated ones.', whyItMatters: 'Cold blunts the sweetness and aroma of tomatoes; room temperature allows them to express full flavor.' },
      { order: 3, instruction: 'Heat olive oil over medium heat. Add garlic and pepper flakes, cook 1 minute.', tip: 'Watch garlic carefully — golden is perfect, brown is acceptable, black is ruined.', whyItMatters: 'Burned garlic releases harsh, acrid compounds that cannot be masked by other ingredients.' },
      { order: 4, instruction: 'Add tomatoes, cook 5-7 minutes until they burst and release their juice.', tip: 'Press tomatoes gently with a spoon to help them release their sweet juices.', whyItMatters: 'The released juice forms the sauce and carries concentrated tomato flavor.' },
      { order: 5, instruction: 'Toss drained pasta into tomatoes with a splash of pasta water. Add basil and parmesan.', tip: 'Tear basil by hand rather than cutting to release more aromatic oils.', whyItMatters: 'Tearing creates more surface area and a cleaner break, preserving delicate basil oils lost on a cutting board.' }
    ],
    tags: ['Italian', 'vegetarian', 'pasta', 'quick', 'easy'],
    nutritionInfo: { calories: 420, protein: 14, carbs: 68, fat: 12 }
  },
  {
    title: 'Black Bean Tacos',
    description: 'Hearty and flavorful vegan tacos with spiced black beans and fresh toppings.',
    cuisine: 'Mexican',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'black beans', amount: '400', unit: 'g canned' },
      { name: 'corn tortillas', amount: '12', unit: 'small' },
      { name: 'avocado', amount: '2', unit: 'ripe' },
      { name: 'red cabbage', amount: '1/4', unit: 'head' },
      { name: 'lime', amount: '2', unit: 'whole' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'chili powder', amount: '1', unit: 'tsp' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'olive oil', amount: '1', unit: 'tbsp' }
    ],
    steps: [
      { order: 1, instruction: 'Drain and rinse black beans. Thinly shred red cabbage.', tip: 'Massage shredded cabbage with a pinch of salt and lime juice to soften it slightly.', whyItMatters: 'Salt draws out moisture from cabbage, making it tender and more pleasant to eat raw.' },
      { order: 2, instruction: 'Sauté garlic in oil, add beans and spices. Cook 5 minutes, mashing slightly.', tip: 'Mash about a third of the beans — this creates a paste that holds the taco filling together.', whyItMatters: 'Partial mashing thickens the mixture, preventing beans from rolling out of the taco.' },
      { order: 3, instruction: 'Mash avocado with lime juice and salt for a quick guacamole.', tip: 'Keep guacamole chunky for better texture in tacos.', whyItMatters: 'Chunky avocado provides bursts of creamy richness in each bite.' },
      { order: 4, instruction: 'Warm tortillas on a dry pan for 30 seconds each side.', tip: 'Warm tortillas are flexible; cold ones crack and split.', whyItMatters: 'Heat makes corn tortillas pliable by warming the starches and oils within them.' },
      { order: 5, instruction: 'Assemble tacos with beans, guacamole, and cabbage. Squeeze lime over everything.', tip: 'The final lime squeeze ties together all the flavors with brightness.', whyItMatters: 'Acid is the final flourish that makes a dish taste complete and well-balanced.' }
    ],
    tags: ['Mexican', 'vegetarian', 'vegan', 'tacos', 'quick', 'healthy'],
    nutritionInfo: { calories: 320, protein: 12, carbs: 52, fat: 10 }
  },
  {
    title: 'Chicken Noodle Soup',
    description: 'The ultimate comfort food — a classic, soul-warming chicken noodle soup.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 40,
    prepTime: 15,
    servings: 6,
    ingredients: [
      { name: 'chicken thighs', amount: '500', unit: 'g' },
      { name: 'egg noodles', amount: '200', unit: 'g' },
      { name: 'carrot', amount: '3', unit: 'medium' },
      { name: 'celery', amount: '3', unit: 'stalks' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'chicken stock', amount: '2', unit: 'liters' },
      { name: 'thyme', amount: '4', unit: 'sprigs' },
      { name: 'bay leaf', amount: '2', unit: 'whole' },
      { name: 'parsley', amount: '1/4', unit: 'cup' }
    ],
    steps: [
      { order: 1, instruction: 'Dice onion, carrot, and celery into uniform pieces.', tip: 'This classic combination is called "mirepoix" and is the aromatic foundation of countless soups.', whyItMatters: 'Each vegetable contributes different flavor compounds that together create the complex base flavor of the broth.' },
      { order: 2, instruction: 'Sauté vegetables in a large pot until softened, about 5 minutes.', tip: 'Do not rush this step — properly sweated vegetables release their sweetest flavors.', whyItMatters: 'Sautéed vegetables give up their volatile compounds to the fat, building the first layer of soup flavor.' },
      { order: 3, instruction: 'Add chicken, stock, garlic, thyme, and bay leaves. Bring to a boil then simmer 25 minutes.', tip: 'Bone-in, skin-on chicken makes richer broth — but boneless works for convenience.', whyItMatters: 'Collagen in the bones dissolves into the broth, giving it body and a silky, coating mouthfeel.' },
      { order: 4, instruction: 'Remove chicken, shred with two forks. Return shredded chicken to soup.', tip: 'Shred chicken while still hot — it pulls apart much more easily than cold chicken.', whyItMatters: 'Shredded chicken has more surface area, absorbing more broth flavor and distributing throughout the soup.' },
      { order: 5, instruction: 'Add noodles and cook according to package directions. Finish with fresh parsley.', tip: 'If making ahead, cook noodles separately and add to individual bowls to prevent them from getting mushy.', whyItMatters: 'Noodles continue absorbing liquid even after cooking; storing separately maintains their texture.' }
    ],
    tags: ['American', 'soup', 'chicken', 'comfort food', 'classic'],
    nutritionInfo: { calories: 290, protein: 24, carbs: 28, fat: 9 }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await Recipe.deleteMany({});
    console.log('Cleared existing recipes');
    await Recipe.insertMany(recipes);
    console.log(`Seeded ${recipes.length} recipes successfully`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
