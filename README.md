# 🍳 Smart Cooking Assistant App

A complete full-stack personalized cooking assistant with decision engine, guided cooking mode, pantry management, and more.

## Tech Stack

- **Frontend**: React 18 + Vite + Zustand + React Query + Tailwind CSS + lucide-react
- **Backend**: Node.js + Express + MongoDB + Mongoose

---

## 🚀 Quick Setup (Run Once)

**Step 1 — Generate all project files:**

```bash
cd c:\Users\baruc\OneDrive\Desktop\smart-app-for-making-food
node create-all-dirs.js
```

This creates `server/` and `client/` folders with all files.

**Step 2 — Install server dependencies:**

```bash
cd server
npm install
```

**Step 3 — Install client dependencies:**

```bash
cd ..\client
npm install
```

---

## ▶️ Running the App

**Terminal 1 — Start the server:**

```bash
cd server
npm run seed   # Seed 25 recipes into MongoDB (run once)
npm run dev    # Starts on http://localhost:5000
```

**Terminal 2 — Start the client:**

```bash
cd client
npm run dev    # Starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## ✨ Features

- 🔐 JWT Authentication (Register / Login)
- 🎯 5-Step Onboarding (cooking level, cuisine preferences, dietary restrictions, dislikes)
- 🤖 Smart Decision Engine — scores and ranks recipes based on your profile + pantry
- ⚡ Intent-based suggestions (Quick / Easy / Effort)
- 🧑‍🍳 Guided Cooking Mode with step-by-step instructions + pro tips + explanations
- 🥦 Pantry Manager with expiry date tracking and color coding
- 🛒 Shopping List with checkbox, auto-add from recipe, clear checked
- 📊 Profile & Stats (meals cooked, avg rating, favorite cuisine)
- 📚 Learning Mode toggle — shows cooking tips during guided mode

---

## 📁 Project Structure

```
smart-app-for-making-food/
├── server/
│   ├── index.js              # Express app entry point
│   ├── middleware/auth.js    # JWT middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── services/decisionEngine.js
│   └── seeds/recipes.js      # 25 real recipes
└── client/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── store/            # Zustand stores
        ├── services/api.js   # Axios instance
        └── components/       # All React components
```

---

## ⚙️ Environment Variables

Copy `server/.env.example` to `server/.env` and set:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-cooking
JWT_SECRET=supersecretkey123
```

> **Note:** MongoDB must be running locally. Install from https://www.mongodb.com/try/download/community

---

# 🎯 Core Principle

👉 _The application provides excellent cooking solutions — with full dynamic personalization for each user_

The system doesn’t just suggest recipes — it calculates what is the most appropriate thing to cook right now based on:

- What ingredients are available at home
- What has been eaten recently
- Personal preferences
- Current context (time, mood, effort level)

👉 This is a decision engine, not a recipe engine

---

# 🧠 1. Core Decision Engine

This is the heart of the system.

### Inputs:

- User profile
- Meal history
- Available ingredients
- Daily preferences

### Output:

- One or several highly relevant recipe suggestions

### Logic:

- Prevent repetition
- Ensure variety
- Adapt to constraints (time, ingredients)
- Maintain high-quality results

---

# 👤 2. Smart Personal Area

### User Profile:

- Taste preferences
- Cooking level
- Likes / dislikes

### Persistent Memory:

- What the user cooked
- What worked well
- What didn’t

👉 The system improves over time

---

# 🚀 3. Full User Experience

## 3.1 Smart Onboarding

- Short questionnaire
- Initial profile creation

## 3.2 Daily Usage

- Daily intent selection (quick / effort / easy)
- Ingredient selection or detection
- Get a tailored solution

---

# 🥦 4. Pantry Management System

### Options:

- Manual input
- Fridge scanning (camera)

### Capabilities:

- Ingredient detection
- Expiration tracking
- Missing ingredient detection

---

# 🛒 5. Smart Shopping System

### Shopping List Generation:

- Based on recipes
- Based on weekly planning

### Core Value:

👉 Not just “what to cook” but also “what to buy”

### Extensions:

- Supermarket integration
- Smart shopping planning

---

# 🍳 6. Smart Recipe Engine

### Based on:

- Real recipes
- AI for adaptation and enhancement

### Capabilities:

- Ingredient substitutions
- Personalization
- Difficulty adjustment

---

# 📋 7. Guided Cooking

- Step-by-step breakdown
- Progress tracking
- Real-time adjustments

### Control Over Outcome:

- Heat level
- Texture
- Doneness level

---

# 📊 8. Learning System (User Behavior)

- Analyze user choices
- Improve recommendations
- Identify patterns

---

# 🎓 9. Cooking Learning System

The app doesn’t just help users cook — it teaches them how to cook.

### Goals:

- Improve user cooking skills
- Increase confidence
- Teach principles, not just recipes

### Capabilities:

#### Learning While Cooking

- Short explanations at each step:
  - Why this action is performed
  - What happens if done incorrectly

#### User Levels

- Beginner
- Intermediate
- Advanced

👉 Each level gets:

- Different level of detail
- Different depth of explanation

#### Learning Modes

- Regular mode (just execute)
- Learning mode (with explanations)

#### Smart Tips

- Real-time tips
- Prevention of common mistakes

#### Skill Building

- Identify knowledge gaps
- Strengthen weak areas

---

# 🎵 10. Cooking Experience

- Adaptive music
- Atmosphere-based experience

---

# 🔮 11. Forward Planning

- Suggestions for upcoming days
- Weekly meal planning

👉 Connects past, present, and future

---

# 🧩 12. Suggested Architecture

### Frontend

- React
- Zustand

### Backend

- Node.js
- Express

### Database

- MongoDB

### AI Layer

- Controlled prompt engine
- Combination of real data + AI

---

# 📈 13. Differentiation

- Not a recipe app
- Not a chatbot

👉 A system that decides what you should cook

---

# 🧠 Summary

The app solves a real problem:

👉 People don’t know what to cook

And it solves it intelligently:

👉 By combining:

- Real recipes
- Personalization
- Context awareness (past + present + ingredients)

👉 This turns it into a true personal cooking assistant
