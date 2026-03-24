require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const { CATEGORIES, fetchCategoryIds, fetchMealById, transformMeal } = require('../services/mealdbService');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await Recipe.deleteMany({});
  console.log('Cleared existing recipes');

  const allMeals = [];

  for (const category of CATEGORIES) {
    console.log(`Fetching ${category}...`);
    try {
      const ids = await fetchCategoryIds(category, 8);
      for (const id of ids) {
        try {
          const meal = await fetchMealById(id);
          if (meal) { allMeals.push(transformMeal(meal)); process.stdout.write('.'); }
          await sleep(120);
        } catch (e) { process.stdout.write('x'); }
      }
    } catch (e) { console.error(`Category ${category} failed:`, e.message); }
    await sleep(400);
  }

  if (allMeals.length === 0) {
    console.log('\nNo recipes fetched - check internet connection.');
  } else {
    await Recipe.insertMany(allMeals, { ordered: false });
    console.log(`\nSeeded ${allMeals.length} real recipes from TheMealDB`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
