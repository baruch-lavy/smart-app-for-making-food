# 🍳 Smart Cooking Assistant App - Complete MVP

Yo dawg! This is a comprehensive full-stack personalized cooking assistant with AI-powered decision engine, guided cooking mode, pantry management, meal planning, analytics, and much more.

## Tech Stack

- **Frontend**: React 18 + Vite + Zustand + React Query + Tailwind CSS + lucide-react
- **Backend**: Node.js + Express + MongoDB + Mongoose

---

## ✨ Complete Feature Set

### 🔐 1. User System & Onboarding
- JWT Authentication (Register / Login)
- 5-Step Onboarding (cooking level, cuisine preferences, dietary restrictions, dislikes)
- **Family/Household Profiles** - Add multiple family members with individual dietary needs
- **Skill Progression System** - Track your cooking skills and level up
- **Achievements & Badges** - Unlock cooking achievements
- **Voice Preferences** - Configure voice guidance settings
- **AI Dietary Profile** - Auto-detected allergies and restrictions

### 🤖 2. Smart Decision Engine
- Scores and ranks recipes based on:
  - User profile + pantry availability
  - Meal history and variety
  - Time-aware recommendations (breakfast, lunch, dinner timing)
  - Energy-level matching (low/medium/high energy)
  - Weather integration (cold weather → warm soups)
  - Leftover optimization (expiring ingredients)
  - Nutritional balancing across meals
  - Cuisine rotation (prevent monotony)
- Intent-based suggestions (Quick / Easy / Effort)
- Success prediction for recipes

### 🥦 3. Pantry Manager
- Add ingredients manually or via barcode scanner
- Expiry date tracking with color coding
- **Analytics Dashboard** - Most/least used items, waste tracking
- **Quantity Intelligence** - Track partial amounts
- **Shared Pantry** - Share items with household members
- **Usage Tracking** - See how often you use each item
- **Smart Alerts** - Notify about expiring items

### 🛒 4. Shopping List
- Auto-generate from recipe or meal plan
- Checkbox interface with clear checked items
- **Budget Optimization** - Track spending and set targets
- **Meal Prep Mode** - Generate weekly shopping lists
- **Smart Bundling** - "Buy 3 more items to unlock 5 recipes"
- **Price Alerts** - Track prices and get notified
- **Substitution Suggestions** - Alternative ingredients

### 🧑‍🍳 5. Guided Cooking Mode
- Step-by-step breakdown with progress tracking
- **Voice Control** - Hands-free navigation
- **Smart Timers** - Multiple timer management
- **Visual Aids** - Photos/videos for tricky techniques
- **Mistake Prevention** - Common pitfalls highlighted
- **Parallel Tasks** - Optimize cooking workflow
- Real-time adjustments (heat, texture, doneness)
- Pro tips and explanations at each step

### 📚 6. Learning Mode
- Toggle to show cooking tips during guided mode
- **Technique Library** - Video tutorials for skills
- **Chef's Notes** - Why each step matters
- **Progress Tracking** - Monitor skill improvement
- **Certification System** - Earn cooking certifications
- Identify knowledge gaps and strengthen weak areas
- Different detail levels (Beginner / Intermediate / Advanced)

### 📊 7. Analytics & Stats
- Total meals cooked, cooking streak
- Average rating, favorite cuisine
- **Analytics Dashboard** - Comprehensive cooking insights
- **Success Predictions** - "You have 85% chance of loving this recipe"
- **Waste Reduction Tracking** - Monitor food waste
- **Health Trends** - Calorie and nutrition tracking over time
- **Cooking Heatmaps** - Best times/days for cooking

### 🎵 8. Cooking Experience
- **Adaptive Music** - Changes with cooking phases (prep → cook → plate)
- **Ambiance Settings** - Nature sounds, café vibes, ASMR
- **Podcast Integration** - Listen while cooking
- **Social Cooking Rooms** - Cook with friends remotely
- **Chef Commentary** - Gordon Ramsay-style motivation

### 📅 9. Meal Planning & Scheduling
- **Weekly Meal Planner** - Drag-drop calendar interface
- **Family Scheduling** - Track who's home when
- **Prep Day Optimization** - Sunday meal prep suggestions
- **Leftover Scheduling** - Plan leftover usage across days
- Auto-generate shopping list from meal plan

### 🌐 10. Social & Community
- **Share Recipes** - Send to friends
- **Rate & Review** - Community feedback
- **Cooking Challenges** - 30-day streak challenges
- **Community Tips** - User-contributed advice
- **Follow System** - Follow favorite home chefs

---

## 🚀 Quick Setup

### Step 1 — Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Step 2 — Set Environment Variables

Copy `server/.env.example` to `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-cooking
JWT_SECRET=supersecretkey123
GEMINI_API_KEY=your_google_ai_api_key
GEMINI_MODEL=gemini-2.0-flash
TAVILY_API_KEY=optional_for_web_search
SERPAPI_API_KEY=optional_alternative_search_provider
AI_SEARCH_PROVIDER=auto
AI_IMAGE_MODEL=flux
AI_IMAGE_PROVIDER=pollinations
```

> **Note:** MongoDB must be running locally. Install from https://www.mongodb.com/try/download/community
>
> The AI recipe flow uses Gemini for structured recipe generation, a search provider for finding internet recipe sources, and AI-generated images. If no search or Gemini key is configured, the app falls back to the local recipe database.
>
> `AI_SEARCH_PROVIDER` accepts `auto`, `tavily`, or `serpapi`. In `auto`, Tavily is preferred when both providers are configured.

---

## ▶️ Running the App

### Terminal 1 — Start the server

```bash
cd server
npm run seed   # Seed recipes into MongoDB (run once)
npm run dev    # Starts on http://localhost:5000
```

### Terminal 2 — Start the client

```bash
cd client
npm run dev    # Starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
smart-app-for-making-food/
├── server/
│   ├── index.js                    # Express app entry point
│   ├── middleware/auth.js          # JWT middleware
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── Recipe.js
│   │   ├── Pantry.js
│   │   ├── ShoppingList.js
│   │   ├── MealHistory.js
│   │   ├── MealPlan.js
│   │   ├── Analytics.js
│   │   ├── Learning.js
│   │   ├── Experience.js
│   │   └── Social.js
│   ├── routes/                     # Express routers
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── recipes.js
│   │   ├── pantry.js
│   │   ├── shopping.js
│   │   ├── mealHistory.js
│   │   ├── mealPlan.js
│   │   ├── analytics.js
│   │   ├── learning.js
│   │   ├── experience.js
│   │   └── social.js
│   ├── services/
│   │   ├── decisionEngine.js
│   │   ├── analyticsService.js
│   │   └── shoppingService.js
│   └── seeds/recipes.js            # Recipe seed data
└── client/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── store/                  # Zustand stores
        ├── services/api.js         # Axios instance
        └── components/             # All React components
            ├── Auth.jsx
            ├── Onboarding.jsx
            ├── Dashboard.jsx
            ├── RecipeSuggestions.jsx
            ├── RecipeDetail.jsx
            ├── GuidedCooking.jsx
            ├── Pantry.jsx
            ├── ShoppingList.jsx
            ├── Profile.jsx
            ├── MealPlanner.jsx
            ├── Analytics.jsx
            └── LearningCenter.jsx
```

---

## 🎯 Core Principles

### 1. AI-First Approach
Not just recipe search - intelligent, adaptive, learning system that gets smarter with use

### 2. Decision Engine, Not Recipe Engine
The system decides what you should cook right now based on:
- What ingredients are available
- What has been eaten recently
- Personal preferences
- Current context (time, mood, effort level)

### 3. Holistic Experience
- Music and ambiance
- Social connection
- Learning while cooking
- Waste reduction
- Health tracking

### 4. Personalization at Scale
- Family/household support
- Individual dietary needs
- Skill progression
- Predictive success rates

---

## 📈 What Makes This MVP Impressive

1. **AI-First Approach** - Not just recipe search, but intelligent decision-making
2. **Accessibility** - Voice control, multi-user, family-friendly
3. **Sustainability** - Waste reduction, expiration tracking, leftover optimization
4. **Education** - Users become better cooks, not just recipe followers
5. **Experience** - Holistic approach with music, ambiance, social connection
6. **Data Intelligence** - Every interaction makes the system smarter
7. **Future-Ready** - Architecture supports IoT integration and smart home compatibility

---

**Built with ❤️ to solve the daily question: "What should I cook today?"**
