/**
 * Run this script with: node create-all-server-files.js
 * It will create the entire server directory structure with all files.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "server");

// Create all directories
const dirs = [
  root,
  path.join(root, "middleware"),
  path.join(root, "models"),
  path.join(root, "routes"),
  path.join(root, "services"),
  path.join(root, "seeds"),
];

dirs.forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
});

// Helper
function write(relPath, content) {
  const fullPath = path.join(root, relPath);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`Created file: ${fullPath}`);
}

// ─── package.json ────────────────────────────────────────────────────────────
write(
  "package.json",
  `{
  "name": "smart-cooking-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "seed": "node seeds/recipes.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
`,
);

// ─── .env.example ────────────────────────────────────────────────────────────
write(
  ".env.example",
  `PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-cooking
JWT_SECRET=supersecretkey123
`,
);

// ─── .env ────────────────────────────────────────────────────────────────────
write(
  ".env",
  `PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-cooking
JWT_SECRET=supersecretkey123
`,
);

// ─── index.js ────────────────────────────────────────────────────────────────
write(
  "index.js",
  `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/pantry', require('./routes/pantry'));
app.use('/api/mealhistory', require('./routes/mealHistory'));
app.use('/api/shopping', require('./routes/shopping'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    app.listen(PORT, () => console.log(\`Server running on port \${PORT} (without DB)\`));
  });
`,
);

// ─── middleware/auth.js ───────────────────────────────────────────────────────
write(
  "middleware/auth.js",
  `const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
`,
);

// ─── models/User.js ──────────────────────────────────────────────────────────
write(
  "models/User.js",
  `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cookingLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tastePreferences: [String],
  dislikes: [String],
  dietaryRestrictions: [String],
  learningMode: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
`,
);

// ─── models/Recipe.js ────────────────────────────────────────────────────────
write(
  "models/Recipe.js",
  `const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  cuisine: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  cookingTime: Number,
  prepTime: Number,
  servings: Number,
  ingredients: [{
    name: String,
    amount: String,
    unit: String
  }],
  steps: [{
    order: Number,
    instruction: String,
    tip: String,
    whyItMatters: String
  }],
  tags: [String],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
});

module.exports = mongoose.model('Recipe', recipeSchema);
`,
);

// ─── models/Pantry.js ────────────────────────────────────────────────────────
write(
  "models/Pantry.js",
  `const mongoose = require('mongoose');

const pantrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    quantity: String,
    unit: String,
    expiresAt: Date,
    addedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Pantry', pantrySchema);
`,
);

// ─── models/MealHistory.js ───────────────────────────────────────────────────
write(
  "models/MealHistory.js",
  `const mongoose = require('mongoose');

const mealHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: String,
  cookedAt: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, enum: ['loved', 'ok', 'disliked'], default: 'ok' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('MealHistory', mealHistorySchema);
`,
);

// ─── models/ShoppingList.js ──────────────────────────────────────────────────
write(
  "models/ShoppingList.js",
  `const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    quantity: String,
    unit: String,
    checked: { type: Boolean, default: false },
    recipeSource: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
`,
);

// ─── routes/auth.js ──────────────────────────────────────────────────────────
write(
  "routes/auth.js",
  `const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, cookingLevel: user.cookingLevel, onboardingComplete: user.onboardingComplete } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, cookingLevel: user.cookingLevel, onboardingComplete: user.onboardingComplete, learningMode: user.learningMode } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── routes/users.js ─────────────────────────────────────────────────────────
write(
  "routes/users.js",
  `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { tastePreferences, dislikes, dietaryRestrictions, cookingLevel, learningMode, onboardingComplete } = req.body;
    const updates = {};
    if (tastePreferences !== undefined) updates.tastePreferences = tastePreferences;
    if (dislikes !== undefined) updates.dislikes = dislikes;
    if (dietaryRestrictions !== undefined) updates.dietaryRestrictions = dietaryRestrictions;
    if (cookingLevel !== undefined) updates.cookingLevel = cookingLevel;
    if (learningMode !== undefined) updates.learningMode = learningMode;
    if (onboardingComplete !== undefined) updates.onboardingComplete = onboardingComplete;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── routes/recipes.js ───────────────────────────────────────────────────────
write(
  "routes/recipes.js",
  `const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const { suggestRecipes } = require('../services/decisionEngine');

router.get('/', async (req, res) => {
  try {
    const { cuisine, difficulty, maxTime, tags } = req.query;
    const filter = {};
    if (cuisine) filter.cuisine = cuisine;
    if (difficulty) filter.difficulty = difficulty;
    if (maxTime) filter.$expr = { $lte: [{ $add: ['$cookingTime', '$prepTime'] }, parseInt(maxTime)] };
    if (tags) filter.tags = { $in: tags.split(',') };
    const recipes = await Recipe.find(filter);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/suggest', auth, async (req, res) => {
  try {
    const { intent, availableIngredients, maxTime } = req.body;
    const suggestions = await suggestRecipes({ userId: req.user.id, intent, availableIngredients, maxTime });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── routes/pantry.js ────────────────────────────────────────────────────────
write(
  "routes/pantry.js",
  `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Pantry = require('../models/Pantry');

router.get('/', auth, async (req, res) => {
  try {
    let pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) pantry = { items: [] };
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    let pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) pantry = new Pantry({ userId: req.user.id, items: [] });
    const newItems = Array.isArray(req.body) ? req.body : [req.body];
    pantry.items.push(...newItems);
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:itemId', auth, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ userId: req.user.id });
    if (!pantry) return res.status(404).json({ message: 'Pantry not found' });
    pantry.items = pantry.items.filter(item => item._id.toString() !== req.params.itemId);
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── routes/mealHistory.js ───────────────────────────────────────────────────
write(
  "routes/mealHistory.js",
  `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealHistory = require('../models/MealHistory');

router.get('/', auth, async (req, res) => {
  try {
    const history = await MealHistory.find({ userId: req.user.id }).sort({ cookedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { recipeId, recipeTitle, cookedAt } = req.body;
    const entry = new MealHistory({ userId: req.user.id, recipeId, recipeTitle, cookedAt: cookedAt || new Date() });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, feedback, notes } = req.body;
    const entry = await MealHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { rating, feedback, notes },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── routes/shopping.js ──────────────────────────────────────────────────────
write(
  "routes/shopping.js",
  `const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShoppingList = require('../models/ShoppingList');

router.get('/', auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = { items: [] };
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    await ShoppingList.findOneAndDelete({ userId: req.user.id });
    const list = new ShoppingList({ userId: req.user.id, items: req.body.items || [] });
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });
    list.items.push(req.body);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:itemId/check', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) return res.status(404).json({ message: 'Shopping list not found' });
    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.checked = !item.checked;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
`,
);

// ─── services/decisionEngine.js ──────────────────────────────────────────────
write(
  "services/decisionEngine.js",
  `const User = require('../models/User');
const Recipe = require('../models/Recipe');
const MealHistory = require('../models/MealHistory');

async function suggestRecipes({ userId, intent, availableIngredients, maxTime }) {
  const user = await User.findById(userId);
  const { tastePreferences = [], dislikes = [], dietaryRestrictions = [] } = user || {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentHistory = await MealHistory.find({ userId, cookedAt: { $gte: sevenDaysAgo } });
  const recentRecipeIds = recentHistory.map(h => h.recipeId?.toString());

  let recipes = await Recipe.find({});

  if (availableIngredients && availableIngredients.length > 0) {
    const available = availableIngredients.map(i => i.toLowerCase());
    recipes = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      const matches = recipeIngredients.filter(ri => available.some(ai => ri.includes(ai) || ai.includes(ri)));
      return matches.length / recipeIngredients.length >= 0.5;
    });
  }

  if (intent === 'quick') {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= 25);
  } else if (intent === 'easy') {
    recipes = recipes.filter(r => r.difficulty === 'easy');
  }

  if (maxTime) {
    recipes = recipes.filter(r => (r.cookingTime + r.prepTime) <= parseInt(maxTime));
  }

  const scored = recipes.map(recipe => {
    let score = 0;
    const tags = recipe.tags || [];
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());

    if (tastePreferences.some(pref => tags.some(t => t.toLowerCase().includes(pref.toLowerCase())))) {
      score += 20;
    }

    if (dislikes.some(dislike => ingredients.some(ing => ing.includes(dislike.toLowerCase())))) {
      score -= 40;
    }

    if (!recentRecipeIds.includes(recipe._id.toString())) {
      score += 15;
    }

    if (availableIngredients && availableIngredients.length > 0) {
      const available = availableIngredients.map(i => i.toLowerCase());
      const matchCount = ingredients.filter(ing => available.some(ai => ing.includes(ai) || ai.includes(ing))).length;
      score += matchCount * 10;
    }

    const restrictedMap = {
      'Vegetarian': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb'],
      'Vegan': ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'bacon', 'lamb', 'cheese', 'milk', 'butter', 'egg', 'cream', 'honey'],
      'Gluten-Free': ['flour', 'bread', 'pasta', 'wheat', 'soy sauce', 'barley'],
      'Dairy-Free': ['cheese', 'milk', 'butter', 'cream', 'yogurt'],
      'Nut-Free': ['almond', 'walnut', 'peanut', 'cashew', 'pecan', 'nut'],
    };
    for (const restriction of dietaryRestrictions) {
      const restricted = restrictedMap[restriction] || [];
      if (restricted.some(r => ingredients.some(ing => ing.includes(r)))) {
        score -= 10;
      }
    }

    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.recipe);
}

module.exports = { suggestRecipes };
`,
);

// ─── seeds/recipes.js ────────────────────────────────────────────────────────
write(
  "seeds/recipes.js",
  `require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const recipes = [
  {
    title: 'Classic Scrambled Eggs',
    description: 'Fluffy, creamy scrambled eggs perfect for any morning.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 5,
    prepTime: 2,
    servings: 2,
    ingredients: [
      { name: 'egg', amount: '4', unit: 'large' },
      { name: 'butter', amount: '1', unit: 'tbsp' },
      { name: 'milk', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: '1/4', unit: 'tsp' },
      { name: 'black pepper', amount: '1/8', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Crack the eggs into a bowl and add milk, salt, and pepper.', tip: 'Use room-temperature eggs for fluffier results.', whyItMatters: 'Mixing before heating ensures even cooking.' },
      { order: 2, instruction: 'Whisk the egg mixture until fully combined and slightly frothy.', tip: 'Whisk vigorously for 30 seconds.', whyItMatters: 'Air incorporated now means fluffier eggs.' },
      { order: 3, instruction: 'Melt butter in a non-stick pan over low-medium heat.', tip: 'Do not let the butter brown.', whyItMatters: 'Low heat gives you control over texture.' },
      { order: 4, instruction: 'Pour in the egg mixture and let it sit for 20 seconds.', tip: 'Resist the urge to stir immediately.', whyItMatters: 'Letting it set slightly creates larger curds.' },
      { order: 5, instruction: 'Gently fold the eggs with a spatula, pushing from the edges to the center.', tip: 'Remove from heat just before they look done.', whyItMatters: 'Residual heat finishes cooking without over-drying.' },
    ],
    tags: ['breakfast', 'quick', 'eggs', 'vegetarian'],
    nutritionInfo: { calories: 180, protein: 13, carbs: 1, fat: 14 },
  },
  {
    title: 'Spaghetti Aglio e Olio',
    description: 'A simple Italian pasta dish with garlic, olive oil, and chili flakes.',
    cuisine: 'Italian',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 5,
    servings: 2,
    ingredients: [
      { name: 'spaghetti', amount: '200', unit: 'g' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'olive oil', amount: '4', unit: 'tbsp' },
      { name: 'red chili flakes', amount: '1/2', unit: 'tsp' },
      { name: 'parsley', amount: '2', unit: 'tbsp' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'parmesan', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Bring a large pot of salted water to a boil and cook spaghetti until al dente.', tip: 'Reserve 1/2 cup of pasta water before draining.', whyItMatters: 'Starchy water helps bind the sauce.' },
      { order: 2, instruction: 'Thinly slice the garlic cloves.', tip: 'Uniform slices ensure even cooking.', whyItMatters: 'Thin slices crisp up beautifully in oil.' },
      { order: 3, instruction: 'Heat olive oil in a pan over medium-low heat and add garlic.', tip: 'Watch carefully — garlic burns fast.', whyItMatters: 'Golden garlic is sweet; burnt garlic is bitter.' },
      { order: 4, instruction: 'Add chili flakes to the oil, then add drained pasta and a splash of pasta water.', tip: 'Toss quickly to coat every strand.', whyItMatters: 'The pasta water emulsifies the oil into a light sauce.' },
      { order: 5, instruction: 'Remove from heat, toss with parsley and parmesan, and serve immediately.', tip: 'Finish with a drizzle of high-quality olive oil.', whyItMatters: 'Fresh herbs added off-heat retain their brightness.' },
    ],
    tags: ['pasta', 'Italian', 'quick', 'vegetarian', 'garlic'],
    nutritionInfo: { calories: 450, protein: 14, carbs: 65, fat: 17 },
  },
  {
    title: 'Chicken Stir Fry',
    description: 'Quick and colorful stir fry with chicken and vegetables in a savory sauce.',
    cuisine: 'Asian',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 3,
    ingredients: [
      { name: 'chicken breast', amount: '300', unit: 'g' },
      { name: 'bell pepper', amount: '1', unit: 'large' },
      { name: 'broccoli', amount: '1', unit: 'cup' },
      { name: 'soy sauce', amount: '3', unit: 'tbsp' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'tsp' },
      { name: 'sesame oil', amount: '1', unit: 'tsp' },
      { name: 'cornstarch', amount: '1', unit: 'tsp' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Slice chicken breast into thin strips. Mix with 1 tbsp soy sauce and cornstarch.', tip: 'Cut against the grain for tender pieces.', whyItMatters: 'Cornstarch coating creates a velvety texture.' },
      { order: 2, instruction: 'Chop all vegetables into similar-sized pieces.', tip: 'Uniform sizes ensure even cooking.', whyItMatters: 'Mismatched sizes lead to some pieces over- or under-cooked.' },
      { order: 3, instruction: 'Heat oil in a wok or large pan over high heat until smoking.', tip: 'High heat is the secret to restaurant-style stir fry.', whyItMatters: 'The "wok hei" (breath of the wok) creates unique flavor.' },
      { order: 4, instruction: 'Cook chicken in batches until golden, then set aside.', tip: 'Do not overcrowd the pan.', whyItMatters: 'Overcrowding steams instead of sears the meat.' },
      { order: 5, instruction: 'Stir fry garlic and ginger for 30 seconds, then add vegetables.', tip: 'Keep everything moving.', whyItMatters: 'Constant motion prevents burning and ensures even coating.' },
      { order: 6, instruction: 'Return chicken to pan, add remaining soy sauce and sesame oil, toss and serve.', tip: 'Serve immediately over steamed rice.', whyItMatters: 'Sesame oil added last preserves its fragrance.' },
    ],
    tags: ['chicken', 'Asian', 'quick', 'stir fry', 'healthy'],
    nutritionInfo: { calories: 320, protein: 30, carbs: 18, fat: 13 },
  },
  {
    title: 'Avocado Toast',
    description: 'Creamy mashed avocado on toasted sourdough with a fried egg on top.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 5,
    prepTime: 5,
    servings: 1,
    ingredients: [
      { name: 'sourdough bread', amount: '2', unit: 'slices' },
      { name: 'avocado', amount: '1', unit: 'ripe' },
      { name: 'egg', amount: '1', unit: 'large' },
      { name: 'lemon juice', amount: '1', unit: 'tsp' },
      { name: 'red chili flakes', amount: '1/4', unit: 'tsp' },
      { name: 'salt', amount: '1/4', unit: 'tsp' },
      { name: 'olive oil', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Toast the sourdough slices to your desired level.', tip: 'A darker toast holds toppings better.', whyItMatters: 'Crispy base prevents the toast from going soggy.' },
      { order: 2, instruction: 'Halve the avocado, remove the pit, and scoop the flesh into a bowl.', tip: 'Use a ripe avocado that yields to gentle pressure.', whyItMatters: 'Ripeness determines creaminess and flavor.' },
      { order: 3, instruction: 'Mash the avocado with lemon juice, salt, and chili flakes.', tip: 'Leave some chunks for texture.', whyItMatters: 'Lemon juice prevents browning and brightens flavor.' },
      { order: 4, instruction: 'Fry the egg in olive oil over medium heat to your preference.', tip: 'For a runny yolk, cook for 2-3 minutes covered.', whyItMatters: 'The runny yolk acts as a rich sauce.' },
      { order: 5, instruction: 'Spread mashed avocado on toast and top with the fried egg.', tip: 'Add extra chili flakes for heat.', whyItMatters: 'Layering from crunchy to creamy to egg creates contrast.' },
    ],
    tags: ['breakfast', 'vegetarian', 'avocado', 'quick', 'healthy'],
    nutritionInfo: { calories: 380, protein: 14, carbs: 35, fat: 22 },
  },
  {
    title: 'Beef Tacos',
    description: 'Seasoned ground beef in crispy taco shells with fresh toppings.',
    cuisine: 'Mexican',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'ground beef', amount: '400', unit: 'g' },
      { name: 'taco shells', amount: '8', unit: 'shells' },
      { name: 'onion', amount: '1', unit: 'medium' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'chili powder', amount: '1', unit: 'tsp' },
      { name: 'paprika', amount: '1/2', unit: 'tsp' },
      { name: 'cheddar cheese', amount: '100', unit: 'g' },
      { name: 'sour cream', amount: '4', unit: 'tbsp' },
      { name: 'lettuce', amount: '1', unit: 'cup' },
      { name: 'tomato', amount: '2', unit: 'medium' },
    ],
    steps: [
      { order: 1, instruction: 'Dice the onion and mince the garlic. Shred lettuce and dice tomatoes.', tip: 'Prep all toppings before cooking so assembly is fast.', whyItMatters: 'Organization prevents rushed cooking.' },
      { order: 2, instruction: 'Brown ground beef in a pan over medium-high heat, breaking it apart.', tip: 'Drain excess fat for a leaner result.', whyItMatters: 'Browning creates deeper flavor through the Maillard reaction.' },
      { order: 3, instruction: 'Add onion and garlic to the beef, cook for 3 minutes.', tip: 'Stir frequently.', whyItMatters: 'Softened aromatics blend into the meat flavor.' },
      { order: 4, instruction: 'Season with cumin, chili powder, paprika, salt, and a splash of water. Simmer 2 minutes.', tip: 'Taste and adjust seasoning.', whyItMatters: 'Water helps bloom the spices and creates a saucy texture.' },
      { order: 5, instruction: 'Warm taco shells in the oven at 180°C for 3 minutes, then fill with beef and toppings.', tip: 'Add toppings in layers: cheese first so it melts, then cool toppings.', whyItMatters: 'Warm shells are crispier and more enjoyable.' },
    ],
    tags: ['beef', 'Mexican', 'tacos', 'family meal'],
    nutritionInfo: { calories: 420, protein: 28, carbs: 32, fat: 20 },
  },
  {
    title: 'Vegetable Fried Rice',
    description: 'Savory fried rice loaded with colorful vegetables and a hint of sesame.',
    cuisine: 'Asian',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 3,
    ingredients: [
      { name: 'cooked rice', amount: '3', unit: 'cups' },
      { name: 'egg', amount: '2', unit: 'large' },
      { name: 'carrot', amount: '1', unit: 'medium' },
      { name: 'peas', amount: '1/2', unit: 'cup' },
      { name: 'corn', amount: '1/2', unit: 'cup' },
      { name: 'soy sauce', amount: '3', unit: 'tbsp' },
      { name: 'sesame oil', amount: '1', unit: 'tsp' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' },
      { name: 'green onion', amount: '2', unit: 'stalks' },
    ],
    steps: [
      { order: 1, instruction: 'Use day-old cold rice for best results. Break up any clumps.', tip: 'Cold rice fries instead of steaming.', whyItMatters: 'Moisture from fresh rice makes it sticky and clumped.' },
      { order: 2, instruction: 'Dice carrot, slice green onions, and mince garlic.', tip: 'Small uniform cuts cook quickly.', whyItMatters: 'Consistent size ensures even cooking.' },
      { order: 3, instruction: 'Heat oil in wok over high heat. Scramble eggs and set aside.', tip: 'Keep eggs slightly underdone.', whyItMatters: 'They finish cooking when mixed back with hot rice.' },
      { order: 4, instruction: 'Add garlic, carrot, peas, and corn to the wok. Stir fry 3 minutes.', tip: 'Keep heat high throughout.', whyItMatters: 'High heat cooks vegetables quickly while retaining crunch.' },
      { order: 5, instruction: 'Add rice and soy sauce. Toss everything together for 3 minutes.', tip: 'Press rice against the wok to get some crispy bits.', whyItMatters: 'Crispy rice adds texture contrast.' },
      { order: 6, instruction: 'Fold in eggs and green onions. Drizzle sesame oil and serve.', tip: 'Sesame oil is a finishing oil, not a cooking oil.', whyItMatters: 'Adding at the end preserves its nutty aroma.' },
    ],
    tags: ['rice', 'Asian', 'vegetarian', 'quick', 'fried rice'],
    nutritionInfo: { calories: 380, protein: 12, carbs: 60, fat: 11 },
  },
  {
    title: 'Tomato Basil Soup',
    description: 'A velvety, comforting tomato soup with fresh basil and a touch of cream.',
    cuisine: 'Italian',
    difficulty: 'easy',
    cookingTime: 25,
    prepTime: 10,
    servings: 4,
    ingredients: [
      { name: 'canned tomatoes', amount: '800', unit: 'g' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'vegetable broth', amount: '500', unit: 'ml' },
      { name: 'fresh basil', amount: '1/4', unit: 'cup' },
      { name: 'heavy cream', amount: '3', unit: 'tbsp' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'sugar', amount: '1', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Dice onion and mince garlic. Sauté in olive oil over medium heat for 5 minutes.', tip: 'Low and slow for sweeter onions.', whyItMatters: 'Caramelized onions add sweetness that balances tomato acidity.' },
      { order: 2, instruction: 'Add canned tomatoes (with juice) and vegetable broth. Bring to a simmer.', tip: 'Break up whole tomatoes with a spoon.', whyItMatters: 'Simmering melds flavors together.' },
      { order: 3, instruction: 'Add sugar and season with salt. Simmer 15 minutes.', tip: 'Sugar counteracts natural tomato acidity.', whyItMatters: 'Balance between sweet and acidic creates depth.' },
      { order: 4, instruction: 'Blend the soup until smooth using an immersion blender.', tip: 'Blend in batches if using a countertop blender — leave the lid vented.', whyItMatters: 'Hot liquids expand when blended and can overflow.' },
      { order: 5, instruction: 'Stir in fresh basil and cream. Taste and adjust seasoning. Serve hot.', tip: 'Add basil off the heat to preserve color and aroma.', whyItMatters: 'Heat destroys delicate basil flavor and turns it brown.' },
    ],
    tags: ['soup', 'vegetarian', 'Italian', 'tomato', 'comfort food'],
    nutritionInfo: { calories: 160, protein: 4, carbs: 20, fat: 8 },
  },
  {
    title: 'Banana Pancakes',
    description: 'Light and fluffy pancakes naturally sweetened with ripe banana.',
    cuisine: 'American',
    difficulty: 'easy',
    cookingTime: 15,
    prepTime: 10,
    servings: 2,
    ingredients: [
      { name: 'banana', amount: '2', unit: 'ripe' },
      { name: 'egg', amount: '2', unit: 'large' },
      { name: 'flour', amount: '1', unit: 'cup' },
      { name: 'milk', amount: '1/2', unit: 'cup' },
      { name: 'baking powder', amount: '1', unit: 'tsp' },
      { name: 'butter', amount: '1', unit: 'tbsp' },
      { name: 'vanilla extract', amount: '1', unit: 'tsp' },
      { name: 'salt', amount: '1/4', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Mash bananas in a large bowl until smooth.', tip: 'The riper the banana, the sweeter your pancakes.', whyItMatters: 'Overripe bananas provide natural sweetness and moisture.' },
      { order: 2, instruction: 'Whisk in eggs, milk, and vanilla extract.', tip: 'Mix until just combined.', whyItMatters: 'Overmixing develops gluten leading to tough pancakes.' },
      { order: 3, instruction: 'Fold in flour, baking powder, and salt until a lumpy batter forms.', tip: 'Lumps are fine — do not overmix.', whyItMatters: 'Lumps in batter disappear during cooking and keep pancakes tender.' },
      { order: 4, instruction: 'Heat a non-stick pan over medium heat and melt a little butter.', tip: 'Drop a bit of water — if it sizzles, the pan is ready.', whyItMatters: 'Correct temperature prevents burning before the inside cooks.' },
      { order: 5, instruction: 'Pour 1/4 cup batter per pancake. Cook until bubbles form on top, then flip once.', tip: 'Only flip once for fluffiness.', whyItMatters: 'Multiple flips deflate the pancake.' },
    ],
    tags: ['breakfast', 'pancakes', 'banana', 'vegetarian', 'sweet'],
    nutritionInfo: { calories: 340, protein: 11, carbs: 58, fat: 8 },
  },
  {
    title: 'Greek Salad',
    description: 'A refreshing Mediterranean salad with tomatoes, cucumber, olives, and feta.',
    cuisine: 'Greek',
    difficulty: 'easy',
    cookingTime: 0,
    prepTime: 10,
    servings: 2,
    ingredients: [
      { name: 'tomato', amount: '3', unit: 'medium' },
      { name: 'cucumber', amount: '1', unit: 'large' },
      { name: 'red onion', amount: '1/2', unit: 'medium' },
      { name: 'feta cheese', amount: '100', unit: 'g' },
      { name: 'kalamata olives', amount: '1/2', unit: 'cup' },
      { name: 'olive oil', amount: '3', unit: 'tbsp' },
      { name: 'red wine vinegar', amount: '1', unit: 'tbsp' },
      { name: 'dried oregano', amount: '1', unit: 'tsp' },
      { name: 'salt', amount: '1/2', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Cut tomatoes into wedges, slice cucumber into half-moons, and thinly slice the red onion.', tip: 'Soak onion in cold water for 5 minutes to mellow its sharpness.', whyItMatters: 'Raw onion can overpower; soaking makes it more pleasant.' },
      { order: 2, instruction: 'Combine tomatoes, cucumber, onion, and olives in a large bowl.', tip: 'Use ripe, in-season tomatoes for the best flavor.', whyItMatters: 'Good ingredients make a simple salad extraordinary.' },
      { order: 3, instruction: 'Whisk together olive oil, red wine vinegar, oregano, and salt.', tip: 'Taste and adjust the ratio to your liking.', whyItMatters: 'Dressing balance is personal — make it yours.' },
      { order: 4, instruction: 'Pour dressing over the salad and toss gently.', tip: 'Do not over-toss or the tomatoes will break down.', whyItMatters: 'Gentle handling keeps the salad looking beautiful.' },
      { order: 5, instruction: 'Top with crumbled feta and serve immediately.', tip: 'Add feta last so it does not dissolve into the dressing.', whyItMatters: 'Intact feta chunks provide satisfying salty bites.' },
    ],
    tags: ['salad', 'Greek', 'vegetarian', 'healthy', 'Mediterranean', 'no-cook'],
    nutritionInfo: { calories: 290, protein: 9, carbs: 14, fat: 23 },
  },
  {
    title: 'Lemon Garlic Shrimp Pasta',
    description: 'Succulent shrimp tossed with linguine in a bright lemon garlic butter sauce.',
    cuisine: 'Italian',
    difficulty: 'medium',
    cookingTime: 15,
    prepTime: 10,
    servings: 2,
    ingredients: [
      { name: 'shrimp', amount: '250', unit: 'g' },
      { name: 'linguine', amount: '200', unit: 'g' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'butter', amount: '2', unit: 'tbsp' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'lemon', amount: '1', unit: 'whole' },
      { name: 'parsley', amount: '3', unit: 'tbsp' },
      { name: 'red chili flakes', amount: '1/4', unit: 'tsp' },
      { name: 'white wine', amount: '1/4', unit: 'cup' },
      { name: 'salt', amount: '1/2', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Cook linguine in salted boiling water until al dente. Reserve 1/2 cup pasta water before draining.', tip: 'Salt the water generously — it should taste like the sea.', whyItMatters: 'The only chance to season pasta itself.' },
      { order: 2, instruction: 'Pat shrimp dry and season with salt and pepper.', tip: 'Dry shrimp sear; wet shrimp steam.', whyItMatters: 'Searing creates better flavor and texture.' },
      { order: 3, instruction: 'Heat olive oil and 1 tbsp butter in a pan over high heat. Sear shrimp 1-2 minutes per side until pink. Set aside.', tip: 'Do not overcook — shrimp turn rubbery quickly.', whyItMatters: 'Shrimp cook in seconds; they finish cooking in the sauce.' },
      { order: 4, instruction: 'In the same pan, sauté garlic and chili flakes for 30 seconds. Add white wine and lemon juice. Simmer 2 minutes.', tip: 'Scrape up any brown bits from the shrimp — that is flavor.', whyItMatters: 'Deglazing with wine lifts those precious caramelized bits.' },
      { order: 5, instruction: 'Add remaining butter and pasta water to create a sauce. Toss in pasta and shrimp.', tip: 'Toss vigorously to emulsify the sauce.', whyItMatters: 'Emulsification coats every strand with rich, silky sauce.' },
      { order: 6, instruction: 'Finish with lemon zest and chopped parsley. Serve immediately.', tip: 'Lemon zest adds fragrance that juice alone cannot provide.', whyItMatters: 'Zest contains essential oils with bright citrus aroma.' },
    ],
    tags: ['pasta', 'shrimp', 'Italian', 'seafood', 'lemon', 'garlic'],
    nutritionInfo: { calories: 520, protein: 34, carbs: 58, fat: 16 },
  },
  {
    title: 'Vegetable Curry',
    description: 'A warming, aromatic curry packed with seasonal vegetables in a rich coconut sauce.',
    cuisine: 'Indian',
    difficulty: 'medium',
    cookingTime: 30,
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'potato', amount: '2', unit: 'medium' },
      { name: 'cauliflower', amount: '1', unit: 'head' },
      { name: 'tomato', amount: '2', unit: 'medium' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'tbsp' },
      { name: 'coconut milk', amount: '400', unit: 'ml' },
      { name: 'curry powder', amount: '2', unit: 'tbsp' },
      { name: 'garam masala', amount: '1', unit: 'tsp' },
      { name: 'turmeric', amount: '1/2', unit: 'tsp' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Dice potatoes into 2cm cubes, break cauliflower into florets, dice tomatoes and onion.', tip: 'Uniform potato cubes cook evenly.', whyItMatters: 'Consistent sizing ensures nothing is raw or mushy.' },
      { order: 2, instruction: 'Heat oil in a large pot. Fry onion over medium heat for 8 minutes until golden.', tip: 'Patience here pays off — golden onion is the flavor base.', whyItMatters: 'Deeply cooked onion creates the sweetness backbone of curry.' },
      { order: 3, instruction: 'Add garlic, ginger, curry powder, and turmeric. Cook for 2 minutes, stirring constantly.', tip: 'Toast spices briefly to awaken their aromatic compounds.', whyItMatters: 'Blooming spices in fat releases fat-soluble flavor compounds.' },
      { order: 4, instruction: 'Add tomatoes and cook for 5 minutes until they break down.', tip: 'Mash them as they cook.', whyItMatters: 'Broken-down tomatoes form the sauce base and add acidity.' },
      { order: 5, instruction: 'Add potatoes, cauliflower, and coconut milk. Cover and simmer 20 minutes.', tip: 'Stir occasionally to prevent sticking.', whyItMatters: 'Long simmer allows potatoes to cook and sauce to thicken.' },
      { order: 6, instruction: 'Stir in garam masala, taste and season with salt. Serve with rice or naan.', tip: 'Garam masala added at the end is more fragrant.', whyItMatters: 'This finishing spice adds complexity without losing its bouquet to long cooking.' },
    ],
    tags: ['curry', 'Indian', 'vegetarian', 'vegan', 'comfort food', 'spicy'],
    nutritionInfo: { calories: 310, protein: 8, carbs: 38, fat: 15 },
  },
  {
    title: 'Classic French Omelette',
    description: 'A perfectly smooth, pale yellow omelette — the hallmark of classical French cooking.',
    cuisine: 'French',
    difficulty: 'medium',
    cookingTime: 5,
    prepTime: 3,
    servings: 1,
    ingredients: [
      { name: 'egg', amount: '3', unit: 'large' },
      { name: 'butter', amount: '1.5', unit: 'tbsp' },
      { name: 'chives', amount: '1', unit: 'tbsp' },
      { name: 'salt', amount: '1/4', unit: 'tsp' },
      { name: 'white pepper', amount: '1/8', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Crack eggs into a bowl with salt and white pepper. Beat vigorously with a fork until completely homogeneous.', tip: 'Beat 60 strokes for the smoothest omelette.', whyItMatters: 'Complete mixing prevents streaks of white and yolk in the final omelette.' },
      { order: 2, instruction: 'Heat an 18-20cm non-stick pan over medium-high heat. Add butter.', tip: 'The butter should foam but not turn brown.', whyItMatters: 'Butter foam indicates correct temperature — hot enough to cook quickly but not burn.' },
      { order: 3, instruction: 'Pour in eggs and immediately stir with a heatproof spatula in small circles while shaking the pan.', tip: 'This simultaneous stir-and-shake is the key French technique.', whyItMatters: 'Creates tiny, uniform curds for a silky texture.' },
      { order: 4, instruction: 'When eggs are just barely set (still slightly wet on top), stop stirring. Let it sit for 10 seconds.', tip: 'It should look underdone — it will finish cooking in the fold.', whyItMatters: 'Carryover heat finishes cooking inside the fold without drying out.' },
      { order: 5, instruction: 'Tilt the pan and fold the omelette in thirds, rolling it onto the plate seam-side down.', tip: 'A quick wrist flick helps roll it.', whyItMatters: 'The classic tri-fold presentation is both beautiful and keeps heat inside.' },
      { order: 6, instruction: 'Garnish with snipped chives and serve immediately.', tip: 'The omelette should be pale yellow with no browning.', whyItMatters: 'Browning indicates overcooked eggs and changes the delicate flavor.' },
    ],
    tags: ['eggs', 'French', 'breakfast', 'classic', 'quick'],
    nutritionInfo: { calories: 280, protein: 18, carbs: 1, fat: 23 },
  },
  {
    title: 'Margherita Pizza',
    description: 'Homemade pizza with a hand-stretched crust, crushed tomato, and fresh mozzarella.',
    cuisine: 'Italian',
    difficulty: 'medium',
    cookingTime: 15,
    prepTime: 90,
    servings: 2,
    ingredients: [
      { name: 'flour', amount: '300', unit: 'g' },
      { name: 'yeast', amount: '7', unit: 'g' },
      { name: 'water', amount: '190', unit: 'ml' },
      { name: 'salt', amount: '1', unit: 'tsp' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'canned tomatoes', amount: '400', unit: 'g' },
      { name: 'fresh mozzarella', amount: '200', unit: 'g' },
      { name: 'fresh basil', amount: '10', unit: 'leaves' },
      { name: 'garlic', amount: '1', unit: 'clove' },
    ],
    steps: [
      { order: 1, instruction: 'Mix warm water and yeast. Let stand 5 minutes until frothy. Combine with flour, salt, and oil. Knead 10 minutes.', tip: 'Water should be 38°C — too hot kills the yeast.', whyItMatters: 'Yeast activation creates the CO2 bubbles that give the crust its airy texture.' },
      { order: 2, instruction: 'Place dough in an oiled bowl, cover, and let rise in a warm place for 1 hour.', tip: 'Place in an oven with just the light on for ideal temperature.', whyItMatters: 'Proofing develops flavor and the gluten structure needed for stretching.' },
      { order: 3, instruction: 'Make sauce: blend canned tomatoes with garlic, salt, and 1 tbsp olive oil. Do not cook.', tip: 'Raw sauce keeps its bright, fresh flavor.', whyItMatters: 'The pizza oven will cook the sauce — starting raw prevents over-cooked bitterness.' },
      { order: 4, instruction: 'Preheat oven to its maximum temperature (250°C+) with a baking stone or upturned baking tray inside.', tip: 'Preheat at least 30 minutes.', whyItMatters: 'A screaming hot surface is what gives pizza its crispy bottom.' },
      { order: 5, instruction: 'Stretch dough by hand into a thin round. Top with sauce and torn mozzarella.', tip: 'Do not use a rolling pin — hand-stretching preserves gas bubbles for a lighter crust.', whyItMatters: 'Rolling crushes the structure built during proofing.' },
      { order: 6, instruction: 'Slide pizza onto hot stone and bake 10-12 minutes until crust is golden and cheese is bubbling.', tip: 'Rotate halfway for even cooking.', whyItMatters: 'Even a home oven has hot spots that can burn one side.' },
      { order: 7, instruction: 'Top with fresh basil leaves and a drizzle of olive oil. Serve immediately.', tip: 'Basil added after baking stays bright green and fragrant.', whyItMatters: 'Heat turns basil black and bitter.' },
    ],
    tags: ['pizza', 'Italian', 'vegetarian', 'baking', 'classic'],
    nutritionInfo: { calories: 560, protein: 24, carbs: 75, fat: 18 },
  },
  {
    title: 'Beef Bolognese',
    description: 'A slow-cooked Italian meat sauce with rich depth of flavor, served over tagliatelle.',
    cuisine: 'Italian',
    difficulty: 'medium',
    cookingTime: 120,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'ground beef', amount: '400', unit: 'g' },
      { name: 'pancetta', amount: '100', unit: 'g' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'carrot', amount: '1', unit: 'large' },
      { name: 'celery', amount: '2', unit: 'stalks' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'canned tomatoes', amount: '400', unit: 'g' },
      { name: 'tomato paste', amount: '2', unit: 'tbsp' },
      { name: 'red wine', amount: '200', unit: 'ml' },
      { name: 'milk', amount: '100', unit: 'ml' },
      { name: 'tagliatelle', amount: '400', unit: 'g' },
      { name: 'parmesan', amount: '60', unit: 'g' },
    ],
    steps: [
      { order: 1, instruction: 'Finely dice onion, carrot, celery (this is called "soffritto"). Mince garlic.', tip: 'The finer the dice, the more it melts into the sauce.', whyItMatters: 'Soffritto is the flavor foundation of Italian cooking.' },
      { order: 2, instruction: 'Render pancetta in a large heavy pot over medium heat until crispy.', tip: 'The fat rendered from pancetta is the cooking fat for the soffritto.', whyItMatters: 'Pancetta fat adds a savory pork depth to the base.' },
      { order: 3, instruction: 'Add soffritto and cook over low heat for 15 minutes until very soft.', tip: 'Low and slow is the only way here.', whyItMatters: 'Slowly cooked soffritto sweetens and caramelizes without burning.' },
      { order: 4, instruction: 'Add beef and brown over high heat, breaking it up fine. Season with salt and pepper.', tip: 'Brown in batches if needed to avoid steaming.', whyItMatters: 'Well-browned meat adds the Maillard reaction flavor that defines Bolognese.' },
      { order: 5, instruction: 'Pour in red wine and cook until fully evaporated, about 5 minutes.', tip: 'Use wine you would actually drink.', whyItMatters: 'Wine adds acidity and complexity; it must fully evaporate to remove harshness.' },
      { order: 6, instruction: 'Add tomato paste, canned tomatoes, and a cup of water. Bring to simmer.', tip: 'Toast tomato paste for 1 minute before adding liquids.', whyItMatters: 'Cooking the paste removes its raw, metallic flavor.' },
      { order: 7, instruction: 'Simmer uncovered on the lowest heat for 2 hours, stirring occasionally. Add milk in the last 30 minutes.', tip: 'The sauce should barely bubble.', whyItMatters: 'Long cooking breaks down the meat into silky strands. Milk tenderizes and adds richness.' },
      { order: 8, instruction: 'Toss with freshly cooked tagliatelle and top with grated parmesan.', tip: 'Add a ladleful of pasta water to help the sauce cling.', whyItMatters: 'The starchy pasta water emulsifies the sauce for better coating.' },
    ],
    tags: ['pasta', 'Italian', 'beef', 'slow cook', 'classic', 'comfort food'],
    nutritionInfo: { calories: 680, protein: 38, carbs: 72, fat: 24 },
  },
  {
    title: 'Chicken Tikka Masala',
    description: 'Tender marinated chicken in a luscious, spiced tomato-cream sauce.',
    cuisine: 'Indian',
    difficulty: 'medium',
    cookingTime: 40,
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'chicken breast', amount: '600', unit: 'g' },
      { name: 'yogurt', amount: '200', unit: 'ml' },
      { name: 'garlic', amount: '5', unit: 'cloves' },
      { name: 'ginger', amount: '2', unit: 'tbsp' },
      { name: 'garam masala', amount: '2', unit: 'tsp' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'turmeric', amount: '1', unit: 'tsp' },
      { name: 'paprika', amount: '1', unit: 'tsp' },
      { name: 'onion', amount: '1', unit: 'large' },
      { name: 'canned tomatoes', amount: '400', unit: 'g' },
      { name: 'heavy cream', amount: '100', unit: 'ml' },
      { name: 'butter', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Cut chicken into chunks. Marinate in yogurt, half the garlic and ginger, cumin, paprika, half the garam masala, turmeric, and salt. Marinate at least 1 hour (overnight is best).', tip: 'Score the chicken pieces to let the marinade penetrate.', whyItMatters: 'Yogurt tenderizes the protein through enzymatic action and acid.' },
      { order: 2, instruction: 'Grill or broil marinated chicken at high heat until charred in spots, about 10 minutes.', tip: 'The char is essential — it adds authentic tandoor flavor.', whyItMatters: 'Char creates bitter-smoky notes that contrast the rich sauce.' },
      { order: 3, instruction: 'In a pan, melt butter and cook onion over medium heat for 10 minutes until golden.', tip: 'A deeply golden onion creates a sweeter sauce.', whyItMatters: 'This is the flavor base that will carry all the spices.' },
      { order: 4, instruction: 'Add remaining garlic, ginger, and spices. Cook 2 minutes.', tip: 'Do not skip this step — raw spices taste harsh.', whyItMatters: 'Blooming activates fat-soluble flavor and aroma compounds.' },
      { order: 5, instruction: 'Add canned tomatoes and simmer 15 minutes until thick. Blend until smooth.', tip: 'Blend until absolutely velvety.', whyItMatters: 'A smooth sauce coats the chicken more evenly.' },
      { order: 6, instruction: 'Add grilled chicken to the sauce. Stir in cream and remaining garam masala. Simmer 5 minutes.', tip: 'Do not boil after adding cream.', whyItMatters: 'Boiling cream can cause it to split and look greasy.' },
    ],
    tags: ['chicken', 'Indian', 'curry', 'spicy', 'creamy', 'tikka masala'],
    nutritionInfo: { calories: 430, protein: 40, carbs: 14, fat: 24 },
  },
  {
    title: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato and pepper sauce — a North African and Middle Eastern classic.',
    cuisine: 'Middle Eastern',
    difficulty: 'easy',
    cookingTime: 25,
    prepTime: 10,
    servings: 2,
    ingredients: [
      { name: 'egg', amount: '4', unit: 'large' },
      { name: 'canned tomatoes', amount: '400', unit: 'g' },
      { name: 'bell pepper', amount: '1', unit: 'large' },
      { name: 'onion', amount: '1', unit: 'medium' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'cumin', amount: '1', unit: 'tsp' },
      { name: 'paprika', amount: '1', unit: 'tsp' },
      { name: 'chili flakes', amount: '1/2', unit: 'tsp' },
      { name: 'olive oil', amount: '2', unit: 'tbsp' },
      { name: 'feta cheese', amount: '50', unit: 'g' },
      { name: 'parsley', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Dice onion and bell pepper. Mince garlic.', tip: 'A colorful bell pepper makes the dish more vibrant.', whyItMatters: 'Red or yellow peppers are sweeter; green is more bitter.' },
      { order: 2, instruction: 'Heat olive oil in a wide pan over medium heat. Cook onion and pepper for 8 minutes.', tip: 'A wide, shallow pan lets the eggs cook more evenly.', whyItMatters: 'Surface area allows even heat distribution for poaching eggs.' },
      { order: 3, instruction: 'Add garlic, cumin, paprika, and chili flakes. Cook 1 minute.', tip: 'The spice bloom smells incredible — that aroma means they are ready.', whyItMatters: 'Toasting spices unlocks their full aromatic potential.' },
      { order: 4, instruction: 'Add canned tomatoes. Season with salt and simmer 10 minutes until sauce thickens.', tip: 'Crush whole tomatoes with a spoon.', whyItMatters: 'A thicker sauce creates stable nests for the eggs.' },
      { order: 5, instruction: 'Make 4 wells in the sauce with a spoon. Crack one egg into each well.', tip: 'Crack eggs into a small bowl first to avoid shell in the dish.', whyItMatters: 'Pre-cracking lets you check for shells and lets you place yolks precisely.' },
      { order: 6, instruction: 'Cover and cook over low heat for 5-7 minutes until whites are set but yolks are still runny.', tip: 'Check frequently — overcooked yolks are sad.', whyItMatters: 'Runny yolks mix with the sauce as you eat, creating a natural rich finish.' },
      { order: 7, instruction: 'Crumble feta on top, scatter parsley, and serve straight from the pan with crusty bread.', tip: 'Serve immediately — eggs continue cooking in the hot sauce.', whyItMatters: 'Timing is everything; the perfect egg waits for no one.' },
    ],
    tags: ['eggs', 'vegetarian', 'Middle Eastern', 'brunch', 'spicy', 'one-pan'],
    nutritionInfo: { calories: 310, protein: 19, carbs: 18, fat: 19 },
  },
  {
    title: 'Beef Bulgogi',
    description: 'Korean marinated beef with a sweet-savory glaze, cooked hot and fast.',
    cuisine: 'Korean',
    difficulty: 'medium',
    cookingTime: 10,
    prepTime: 20,
    servings: 3,
    ingredients: [
      { name: 'beef sirloin', amount: '400', unit: 'g' },
      { name: 'soy sauce', amount: '4', unit: 'tbsp' },
      { name: 'sesame oil', amount: '2', unit: 'tsp' },
      { name: 'brown sugar', amount: '2', unit: 'tbsp' },
      { name: 'garlic', amount: '4', unit: 'cloves' },
      { name: 'ginger', amount: '1', unit: 'tsp' },
      { name: 'asian pear', amount: '1/4', unit: 'whole' },
      { name: 'green onion', amount: '3', unit: 'stalks' },
      { name: 'sesame seeds', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Freeze beef for 30 minutes, then slice paper-thin against the grain.', tip: 'Partially frozen meat slices much more easily.', whyItMatters: 'Thin slices marinate faster and cook in seconds.' },
      { order: 2, instruction: 'Grate the Asian pear. Mix with soy sauce, sesame oil, sugar, minced garlic and ginger to make the marinade.', tip: 'Pear can be substituted with kiwi or apple.', whyItMatters: 'Pear contains enzymes (proteases) that tenderize the beef naturally.' },
      { order: 3, instruction: 'Marinate beef slices for at least 30 minutes (up to overnight).', tip: 'Do not marinate longer than 12 hours — the enzymes can make the texture mushy.', whyItMatters: 'The sweet marinade caramelizes beautifully when cooked on high heat.' },
      { order: 4, instruction: 'Cook in a very hot grill pan or skillet in a single layer. 1-2 minutes per side.', tip: 'Do not crowd the pan.', whyItMatters: 'Overcrowding causes steaming instead of caramelizing.' },
      { order: 5, instruction: 'Garnish with sesame seeds and sliced green onion. Serve with steamed rice and kimchi.', tip: 'Wrap in lettuce leaves with rice for a traditional "ssam" experience.', whyItMatters: 'Lettuce cuts through the richness and adds freshness.' },
    ],
    tags: ['beef', 'Korean', 'BBQ', 'marinated', 'Asian'],
    nutritionInfo: { calories: 370, protein: 32, carbs: 18, fat: 19 },
  },
  {
    title: 'Caesar Salad',
    description: 'Crisp romaine lettuce with homemade Caesar dressing, croutons, and shaved parmesan.',
    cuisine: 'American',
    difficulty: 'medium',
    cookingTime: 10,
    prepTime: 15,
    servings: 2,
    ingredients: [
      { name: 'romaine lettuce', amount: '1', unit: 'head' },
      { name: 'parmesan', amount: '60', unit: 'g' },
      { name: 'bread', amount: '2', unit: 'slices' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'anchovy paste', amount: '1', unit: 'tsp' },
      { name: 'egg yolk', amount: '1', unit: 'large' },
      { name: 'lemon juice', amount: '2', unit: 'tbsp' },
      { name: 'dijon mustard', amount: '1', unit: 'tsp' },
      { name: 'olive oil', amount: '5', unit: 'tbsp' },
      { name: 'worcestershire sauce', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Cube bread, toss with olive oil and a pinch of garlic powder, and bake at 200°C for 10 minutes until golden.', tip: 'Day-old bread makes the best croutons.', whyItMatters: 'Drier bread absorbs oil without becoming soggy.' },
      { order: 2, instruction: 'Make the dressing: mince garlic to a paste with salt. Whisk with egg yolk, lemon juice, mustard, anchovy paste, and worcestershire.', tip: 'Use the side of a knife to mash garlic with salt into a smooth paste.', whyItMatters: 'The egg yolk acts as an emulsifier to bind oil and water-based ingredients.' },
      { order: 3, instruction: 'Slowly drizzle in olive oil while whisking constantly to emulsify the dressing.', tip: 'Start with drops, not a stream, to get the emulsion started.', whyItMatters: 'Adding oil too fast breaks the emulsion and makes it greasy.' },
      { order: 4, instruction: 'Wash and dry romaine leaves thoroughly. Tear into large pieces.', tip: 'Wet lettuce dilutes the dressing.', whyItMatters: 'Dry leaves allow the dressing to coat and cling properly.' },
      { order: 5, instruction: 'Toss lettuce with dressing, half the parmesan, and croutons. Top with remaining shaved parmesan.', tip: 'Dress immediately before serving.', whyItMatters: 'Dressed salad wilts quickly — serve right away for crisp results.' },
    ],
    tags: ['salad', 'American', 'classic', 'Caesar', 'lunch'],
    nutritionInfo: { calories: 380, protein: 12, carbs: 22, fat: 28 },
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'A warm chocolate cake with a molten, flowing center — an elegant dessert ready in 20 minutes.',
    cuisine: 'French',
    difficulty: 'medium',
    cookingTime: 12,
    prepTime: 10,
    servings: 2,
    ingredients: [
      { name: 'dark chocolate', amount: '100', unit: 'g' },
      { name: 'butter', amount: '80', unit: 'g' },
      { name: 'egg', amount: '2', unit: 'large' },
      { name: 'egg yolk', amount: '2', unit: 'large' },
      { name: 'sugar', amount: '60', unit: 'g' },
      { name: 'flour', amount: '2', unit: 'tbsp' },
      { name: 'cocoa powder', amount: '1', unit: 'tsp' },
      { name: 'vanilla extract', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Preheat oven to 200°C. Butter and dust 2 ramekins with cocoa powder.', tip: 'Coat every surface to ensure the cake unmolds cleanly.', whyItMatters: 'A clean release is crucial — a stuck cake loses its dramatic effect.' },
      { order: 2, instruction: 'Melt chocolate and butter together in a double boiler or microwave in 30-second bursts. Stir until smooth.', tip: 'Do not overheat — chocolate seizes if it gets too hot.', whyItMatters: 'Gentle heat keeps the chocolate glossy and smooth.' },
      { order: 3, instruction: 'Whisk together eggs, egg yolks, and sugar until pale and slightly thickened.', tip: 'Beat for about 2 minutes.', whyItMatters: 'Incorporating air here gives the cake structure despite minimal flour.' },
      { order: 4, instruction: 'Fold chocolate mixture into the egg mixture gently. Sift in flour and fold until just combined.', tip: 'Use a rubber spatula with light, sweeping movements.', whyItMatters: 'Overmixing deflates the air bubbles and creates a dense cake.' },
      { order: 5, instruction: 'Divide batter between ramekins. Bake 10-12 minutes until the edges are set but the center jiggles.', tip: 'The jiggle is everything — it means the center is still liquid.', whyItMatters: 'Timing is the whole secret; 1-2 minutes too long and there is no lava.' },
      { order: 6, instruction: 'Let rest 1 minute, then run a knife around the edge and invert onto a plate. Serve immediately with vanilla ice cream.', tip: 'The contrast of hot cake and cold ice cream is part of the experience.', whyItMatters: 'Thermal contrast is a classic French technique called "jeu de températures."' },
    ],
    tags: ['dessert', 'chocolate', 'French', 'baking', 'elegant', 'sweet'],
    nutritionInfo: { calories: 520, protein: 10, carbs: 48, fat: 34 },
  },
  {
    title: 'Ramen',
    description: 'Homestyle ramen with a rich soy-based broth, soft-boiled egg, and all the toppings.',
    cuisine: 'Japanese',
    difficulty: 'hard',
    cookingTime: 60,
    prepTime: 30,
    servings: 2,
    ingredients: [
      { name: 'ramen noodles', amount: '200', unit: 'g' },
      { name: 'chicken broth', amount: '1', unit: 'liter' },
      { name: 'pork belly', amount: '300', unit: 'g' },
      { name: 'soy sauce', amount: '4', unit: 'tbsp' },
      { name: 'mirin', amount: '2', unit: 'tbsp' },
      { name: 'sake', amount: '2', unit: 'tbsp' },
      { name: 'egg', amount: '2', unit: 'large' },
      { name: 'green onion', amount: '3', unit: 'stalks' },
      { name: 'nori', amount: '2', unit: 'sheets' },
      { name: 'corn', amount: '1/2', unit: 'cup' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'ginger', amount: '2', unit: 'slices' },
      { name: 'sesame seeds', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Roll pork belly tightly and tie with kitchen twine. Sear on all sides in a pot until golden.', tip: 'Pat the pork completely dry before searing.', whyItMatters: 'Surface moisture prevents the browning needed for flavor.' },
      { order: 2, instruction: 'Add soy sauce, mirin, sake, garlic, and ginger to the pot. Add water to cover. Braise on low heat for 2 hours.', tip: 'The liquid should barely simmer, not boil.', whyItMatters: 'Gentle braising gives you silky, not stringy, pork.' },
      { order: 3, instruction: 'Make soft-boiled eggs: boil for exactly 6.5 minutes, then transfer to ice water. Peel and marinate in soy sauce and mirin for 30 minutes.', tip: 'A timer is non-negotiable here.', whyItMatters: '6.5 minutes gives a set white with a custardy, jammy yolk.' },
      { order: 4, instruction: 'Remove pork from braising liquid. Reserve the liquid. Refrigerate pork for 30 minutes, then slice thinly.', tip: 'Cold pork slices much more cleanly.', whyItMatters: 'Resting and chilling allows the structure to firm up.' },
      { order: 5, instruction: 'Combine chicken broth with reserved braising liquid. Adjust seasoning with soy sauce. Bring to a boil.', tip: 'Taste constantly — balance is key.', whyItMatters: 'The layered broth (tare + stock) is what separates good ramen from great ramen.' },
      { order: 6, instruction: 'Cook ramen noodles separately per package instructions. Drain and place in bowls.', tip: 'Do not overcook the noodles — they continue cooking in the hot broth.', whyItMatters: 'Al dente noodles absorb broth better and have better texture.' },
      { order: 7, instruction: 'Ladle hot broth over noodles. Top with sliced pork, halved marinated egg, nori, corn, green onion, and sesame seeds.', tip: 'Arrange toppings with care — ramen is eaten with the eyes first.', whyItMatters: 'Presentation elevates the dining experience and is central to Japanese food culture.' },
    ],
    tags: ['ramen', 'Japanese', 'noodles', 'pork', 'soup', 'umami'],
    nutritionInfo: { calories: 720, protein: 42, carbs: 68, fat: 28 },
  },
  {
    title: 'French Onion Soup',
    description: 'Deeply caramelized onion soup topped with a crusty crouton and bubbling Gruyère.',
    cuisine: 'French',
    difficulty: 'medium',
    cookingTime: 90,
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'onion', amount: '6', unit: 'large' },
      { name: 'butter', amount: '3', unit: 'tbsp' },
      { name: 'beef broth', amount: '1.5', unit: 'liter' },
      { name: 'dry white wine', amount: '200', unit: 'ml' },
      { name: 'thyme', amount: '3', unit: 'sprigs' },
      { name: 'bay leaf', amount: '2', unit: 'leaves' },
      { name: 'sourdough bread', amount: '4', unit: 'thick slices' },
      { name: 'gruyere cheese', amount: '200', unit: 'g' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
      { name: 'sugar', amount: '1', unit: 'tsp' },
      { name: 'salt', amount: '1', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Thinly slice all onions. Melt butter in a heavy-bottomed pot over medium heat.', tip: 'Use a heavy pot to distribute heat evenly and prevent burning.', whyItMatters: 'Thin, even slices caramelize uniformly.' },
      { order: 2, instruction: 'Add onions with a pinch of salt and cook, stirring every 5 minutes, for 60-75 minutes until deep golden brown.', tip: 'This cannot be rushed — low and slow is the only way.', whyItMatters: 'True caramelization takes over an hour and cannot be faked.' },
      { order: 3, instruction: 'Add sugar in the last 10 minutes to help deepen the caramelization.', tip: 'Increase heat slightly at this stage.', whyItMatters: 'Sugar accelerates the Maillard reaction for deeper browning.' },
      { order: 4, instruction: 'Pour in white wine and cook until evaporated. Add broth, thyme, and bay leaf. Simmer 20 minutes.', tip: 'Taste and season generously.', whyItMatters: 'Simmering melds the sweetness of onion with the savory depth of broth.' },
      { order: 5, instruction: 'Toast bread slices. Rub with a cut garlic clove.', tip: 'Garlic rubbed on toast is an easy flavor boost.', whyItMatters: 'The toast must be stale and dry to not turn soggy immediately in the soup.' },
      { order: 6, instruction: 'Ladle soup into oven-safe bowls. Float a crouton on top, pile with grated Gruyère. Broil until bubbling and browned.', tip: 'Place bowls on a baking tray for easier handling.', whyItMatters: 'The broiled cheese crust is the iconic defining element of this dish.' },
    ],
    tags: ['soup', 'French', 'onion', 'comfort food', 'classic', 'cheese'],
    nutritionInfo: { calories: 420, protein: 18, carbs: 40, fat: 20 },
  },
  {
    title: 'Pad Thai',
    description: 'Thailand\'s beloved stir-fried noodle dish with shrimp, tofu, and a tangy tamarind sauce.',
    cuisine: 'Thai',
    difficulty: 'medium',
    cookingTime: 20,
    prepTime: 20,
    servings: 2,
    ingredients: [
      { name: 'rice noodles', amount: '200', unit: 'g' },
      { name: 'shrimp', amount: '150', unit: 'g' },
      { name: 'tofu', amount: '100', unit: 'g' },
      { name: 'egg', amount: '2', unit: 'large' },
      { name: 'tamarind paste', amount: '2', unit: 'tbsp' },
      { name: 'fish sauce', amount: '2', unit: 'tbsp' },
      { name: 'brown sugar', amount: '2', unit: 'tbsp' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'bean sprouts', amount: '1', unit: 'cup' },
      { name: 'green onion', amount: '3', unit: 'stalks' },
      { name: 'peanut', amount: '3', unit: 'tbsp' },
      { name: 'lime', amount: '1', unit: 'whole' },
      { name: 'vegetable oil', amount: '2', unit: 'tbsp' },
    ],
    steps: [
      { order: 1, instruction: 'Soak rice noodles in room-temperature water for 30 minutes until flexible but still firm.', tip: 'Do not use boiling water — it makes them too soft.', whyItMatters: 'Partially hydrated noodles finish cooking in the wok absorbing all the sauce.' },
      { order: 2, instruction: 'Mix tamarind paste, fish sauce, and brown sugar to make the Pad Thai sauce. Taste and adjust balance.', tip: 'It should be sour, salty, and slightly sweet in equal measure.', whyItMatters: 'This sauce is the soul of Pad Thai — getting the balance right is everything.' },
      { order: 3, instruction: 'Heat oil in a wok over high heat. Fry tofu until crispy on all sides, then push to the side.', tip: 'Press tofu dry before frying.', whyItMatters: 'Crispy tofu holds its shape instead of dissolving into the dish.' },
      { order: 4, instruction: 'Add shrimp and garlic. Cook 1 minute. Push everything to the side. Scramble eggs in the space.', tip: 'Leave the eggs slightly underdone before mixing.', whyItMatters: 'They finish cooking when mixed with the hot noodles.' },
      { order: 5, instruction: 'Add drained noodles and pour sauce over everything. Toss constantly for 2-3 minutes.', tip: 'Work quickly — noodles can clump.', whyItMatters: 'Constant motion and high heat creates the characteristic smoky wok flavor.' },
      { order: 6, instruction: 'Add bean sprouts and half the green onions. Toss 30 seconds. Serve topped with peanuts, remaining onion, and lime.', tip: 'Bean sprouts are added last to maintain their crunch.', whyItMatters: 'Texture contrast between tender noodles and crunchy sprouts is essential.' },
    ],
    tags: ['Thai', 'noodles', 'shrimp', 'Asian', 'stir fry', 'pad thai'],
    nutritionInfo: { calories: 550, protein: 30, carbs: 72, fat: 16 },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await Recipe.deleteMany({});
    console.log('Cleared existing recipes');
    await Recipe.insertMany(recipes);
    console.log(\`Seeded \${recipes.length} recipes successfully\`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
`,
);

// Overwrite seeds/recipes.js with the correct 21 exact recipes
require('./fix-seeds');

console.log("\\n✅ ALL DONE! All server files have been created.");
console.log("\\nNext steps:");
console.log("  cd server");
console.log("  npm install");
console.log("  npm run seed   (optional: seeds recipe data into MongoDB)");
console.log("  npm run dev");
