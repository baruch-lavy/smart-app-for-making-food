/**
 * Smart Cooking Assistant – Complete Setup Script
 * Run once:  node create-all-dirs.js
 * Creates every directory, every server file, and every client file.
 */
const fs   = require('fs');
const path = require('path');

const base = 'c:\\Users\\baruc\\OneDrive\\Desktop\\smart-app-for-making-food';

// ─── 1. Directories ──────────────────────────────────────────────────────────
const dirs = [
  'server','server/middleware','server/models','server/routes',
  'server/services','server/seeds',
  'client','client/src','client/src/components',
  'client/src/services','client/src/store',
];
dirs.forEach(d => {
  const full = path.join(base, d);
  if (!fs.existsSync(full)) { fs.mkdirSync(full, { recursive: true }); console.log('mkdir  ' + d); }
  else { console.log('exists ' + d); }
});
console.log('\n✓ All directories ready\n');

// ─── 2. Server files (delegate to existing script) ───────────────────────────
require('./create-all-server-files');

// ─── 3. Client files ─────────────────────────────────────────────────────────
function w(p, content) {
  fs.writeFileSync(path.join(base, p), content, 'utf8');
  console.log('wrote  ' + p);
}

// client/package.json
w('client/package.json', `{
  "name": "smart-cooking-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.5.0",
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.28",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.9"
  }
}
`);

// client/vite.config.js
w('client/vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } }
})
`);

// client/postcss.config.js
w('client/postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
`);

// client/tailwind.config.js
w('client/tailwind.config.js', `export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#f97316', light: '#fdba74', dark: '#ea580c' }
      }
    }
  },
  plugins: []
}
`);

// client/index.html
w('client/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart Cooking Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

// client/src/main.jsx
w('client/src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
)
`);

// client/src/index.css
w('client/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
body { font-family: 'Inter', system-ui, sans-serif; background: #fafaf9; }
`);

// client/src/services/api.js
w('client/src/services/api.js', `import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = \`Bearer \${token}\`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
`);

// client/src/store/useAuthStore.js
w('client/src/store/useAuthStore.js', `import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })(),
  token: localStorage.getItem('token'),
  login: (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    set({ user: userData, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
  updateUser: (updates) => {
    set(state => {
      const updated = { ...state.user, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return { user: updated }
    })
  }
}))

export default useAuthStore
`);

// client/src/store/useAppStore.js
w('client/src/store/useAppStore.js', `import { create } from 'zustand'

const useAppStore = create((set) => ({
  currentView: 'dashboard',
  selectedIntent: null,
  selectedIngredients: [],
  selectedRecipe: null,
  cookingStep: 0,
  cookingMode: false,
  setView: (view) => set({ currentView: view }),
  setIntent: (intent) => set({ selectedIntent: intent }),
  toggleIngredient: (ingredient) => set(state => ({
    selectedIngredients: state.selectedIngredients.includes(ingredient)
      ? state.selectedIngredients.filter(i => i !== ingredient)
      : [...state.selectedIngredients, ingredient]
  })),
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  nextStep: () => set(state => ({ cookingStep: state.cookingStep + 1 })),
  prevStep: () => set(state => ({ cookingStep: Math.max(0, state.cookingStep - 1) })),
  startCooking: () => set({ cookingMode: true, cookingStep: 0 }),
  stopCooking: () => set({ cookingMode: false, cookingStep: 0 })
}))

export default useAppStore
`);

// client/src/App.jsx
w('client/src/App.jsx', `import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import RecipeSuggestions from './components/RecipeSuggestions'
import RecipeDetail from './components/RecipeDetail'
import GuidedCooking from './components/GuidedCooking'
import Pantry from './components/Pantry'
import ShoppingList from './components/ShoppingList'
import Profile from './components/Profile'

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const token = useAuthStore(s => s.token)
  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/suggest" element={<ProtectedRoute><RecipeSuggestions /></ProtectedRoute>} />
      <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
      <Route path="/cook/:id" element={<ProtectedRoute><GuidedCooking /></ProtectedRoute>} />
      <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
      <Route path="/shopping" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  )
}
`);

// client/src/components/Auth.jsx
w('client/src/components/Auth.jsx', `import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ChefHat, Mail, Lock, User, AlertCircle } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      login(data.user, data.token)
      navigate(data.user.onboardingComplete ? '/dashboard' : '/onboarding')
    }
  })

  const registerMutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data).then(r => r.data),
    onSuccess: (data) => {
      login(data.user, data.token)
      navigate('/onboarding')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (tab === 'login') loginMutation.mutate({ email: form.email, password: form.password })
    else registerMutation.mutate(form)
  }

  const mutation = tab === 'login' ? loginMutation : registerMutation
  const error = mutation.error?.response?.data?.message || mutation.error?.message

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CookSmart</h1>
            <p className="text-sm text-gray-500">Your personal cooking assistant</p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={\`flex-1 py-2 rounded-md text-sm font-medium transition-all \${tab === t ? 'bg-white shadow text-primary' : 'text-gray-500'}\`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Full name" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="email" placeholder="Email address" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="password" placeholder="Password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {mutation.isPending ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
`);

// client/src/components/Onboarding.jsx
w('client/src/components/Onboarding.jsx', `import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ChefHat, Sprout, Flame, Zap } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const CUISINES = ['Italian','Asian','Mexican','Mediterranean','American','Indian','Japanese','Greek','French','Thai']
const DIETARY = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Halal','Kosher']
const DISLIKES = ['Cilantro','Mushrooms','Onions','Garlic','Spicy Food','Seafood','Red Meat','Eggs']

const LEVELS = [
  { value: 'beginner', label: 'Beginner', icon: Sprout, desc: 'I follow recipes step by step', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'intermediate', label: 'Intermediate', icon: Flame, desc: 'I can improvise occasionally', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'advanced', label: 'Advanced', icon: Zap, desc: 'I cook by feel and creativity', color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={\`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all \${active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}\`}>
      {label}
    </button>
  )
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState('beginner')
  const [tastes, setTastes] = useState([])
  const [dietary, setDietary] = useState([])
  const [dislikes, setDislikes] = useState([])
  const navigate = useNavigate()
  const updateUser = useAuthStore(s => s.updateUser)

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data).then(r => r.data),
    onSuccess: (data) => { updateUser(data); navigate('/dashboard') }
  })

  const toggle = (arr, setArr, val) =>
    setArr(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val])

  const steps = [
    {
      title: '🌟 Welcome to CookSmart!',
      subtitle: "Let's personalize your cooking experience in just a few steps.",
      content: (
        <div className="text-center py-4">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-12 h-12 text-primary" />
          </div>
          <p className="text-gray-600 text-lg">We'll ask you a few quick questions to tailor recipe suggestions just for you.</p>
        </div>
      )
    },
    {
      title: '👨‍🍳 What\'s your cooking level?',
      subtitle: 'This helps us suggest recipes at the right difficulty.',
      content: (
        <div className="grid gap-4">
          {LEVELS.map(({ value, label, icon: Icon, desc, color }) => (
            <button key={value} type="button" onClick={() => setLevel(value)}
              className={\`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left \${level === value ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}\`}>
              <div className={\`w-12 h-12 rounded-lg flex items-center justify-center \${color}\`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: '🍽️ What cuisines do you love?',
      subtitle: 'Select all that apply — we\'ll prioritize these in suggestions.',
      content: (
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => <Chip key={c} label={c} active={tastes.includes(c)} onClick={() => toggle(tastes, setTastes, c)} />)}
        </div>
      )
    },
    {
      title: '🥗 Any dietary restrictions?',
      subtitle: "We'll filter out recipes that don't fit your needs.",
      content: (
        <div className="flex flex-wrap gap-2">
          {DIETARY.map(d => <Chip key={d} label={d} active={dietary.includes(d)} onClick={() => toggle(dietary, setDietary, d)} />)}
        </div>
      )
    },
    {
      title: '😬 Anything you dislike?',
      subtitle: "We'll try to avoid these in your suggestions.",
      content: (
        <div className="flex flex-wrap gap-2">
          {DISLIKES.map(d => <Chip key={d} label={d} active={dislikes.includes(d)} onClick={() => toggle(dislikes, setDislikes, d)} />)}
        </div>
      )
    }
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleFinish = () => {
    mutation.mutate({ cookingLevel: level, tastePreferences: tastes, dietaryRestrictions: dietary, dislikes, onboardingComplete: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={\`flex-1 h-1.5 rounded-full transition-all \${i <= step ? 'bg-primary' : 'bg-gray-200'}\`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-medium mb-2">Step {step + 1} of {steps.length}</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.title}</h2>
        <p className="text-gray-500 mb-6">{current.subtitle}</p>
        <div className="min-h-[200px]">{current.content}</div>
        {mutation.error && <p className="text-red-500 text-sm mt-4">{mutation.error.response?.data?.message || 'Something went wrong'}</p>}
        <div className="flex justify-between mt-8">
          {step > 0
            ? <button onClick={() => setStep(s => s - 1)} className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-colors">← Back</button>
            : <div />
          }
          {isLast
            ? <button onClick={handleFinish} disabled={mutation.isPending}
                className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60">
                {mutation.isPending ? 'Saving...' : 'Get Cooking! 🎉'}
              </button>
            : <button onClick={() => setStep(s => s + 1)} className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors">Next →</button>
          }
        </div>
      </div>
    </div>
  )
}
`);

// client/src/components/Dashboard.jsx
w('client/src/components/Dashboard.jsx', `import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Zap, Trophy, Smile, Package, ShoppingCart, User, LogOut, ChefHat, Star } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import useAppStore from '../store/useAppStore'

const INTENTS = [
  { id: 'quick', icon: Zap, title: '⚡ Quick & Easy', sub: 'Under 20 minutes', color: 'from-yellow-50 to-orange-50 border-orange-200' },
  { id: 'effort', icon: Trophy, title: '💪 I\'ll Put in Effort', sub: 'Let\'s make something special', color: 'from-blue-50 to-indigo-50 border-blue-200' },
  { id: 'easy', icon: Smile, title: '😌 Something Easy', sub: 'Low effort, big flavor', color: 'from-green-50 to-emerald-50 border-green-200' },
]

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary">
        <ChefHat className="w-5 h-5" /><span className="text-xs">Home</span>
      </Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400">
        <Package className="w-5 h-5" /><span className="text-xs">Pantry</span>
      </Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-gray-400">
        <ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400">
        <User className="w-5 h-5" /><span className="text-xs">Profile</span>
      </Link>
    </nav>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const setIntent = useAppStore(s => s.setIntent)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.get('/pantry').then(r => r.data) })
  const { data: historyData } = useQuery({ queryKey: ['mealHistory'], queryFn: () => api.get('/mealhistory').then(r => r.data) })

  const pantryCount = pantryData?.items?.length || 0
  const recentMeals = historyData?.slice(0, 3) || []

  const handleIntent = (intentId) => {
    setIntent(intentId)
    navigate('/suggest')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-gray-900">CookSmart</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button onClick={() => { logout(); navigate('/login') }} className="p-2 text-gray-400 hover:text-gray-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Good {greeting}, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-gray-500 mb-6">What are we cooking today?</p>

        <div className="grid gap-4 mb-8">
          {INTENTS.map(({ id, title, sub, color }) => (
            <button key={id} onClick={() => handleIntent(id)}
              className={\`bg-gradient-to-r \${color} border-2 rounded-2xl p-5 text-left hover:shadow-md transition-all active:scale-[0.98]\`}>
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="text-sm text-gray-500 mt-1">{sub}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Your Pantry</h3>
            <Link to="/pantry" className="text-sm text-primary font-medium">Manage →</Link>
          </div>
          <p className="text-gray-500 text-sm">
            {pantryCount > 0 ? \`\${pantryCount} ingredient\${pantryCount !== 1 ? 's' : ''} available\` : 'No items yet. Add ingredients for better suggestions!'}
          </p>
        </div>

        {recentMeals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">🍽️ Recent Meals</h3>
            <div className="space-y-3">
              {recentMeals.map(meal => (
                <div key={meal._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">{meal.recipeTitle}</span>
                  {meal.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={\`w-3.5 h-3.5 \${i < meal.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}\`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
`);

// client/src/components/RecipeSuggestions.jsx
w('client/src/components/RecipeSuggestions.jsx', `import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, Clock, ChevronRight, Plus, X } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'

const INTENT_LABEL = { quick: '⚡ Quick & Easy', effort: '💪 Effort Mode', easy: '😌 Easy Mode' }
const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }

export default function RecipeSuggestions() {
  const navigate = useNavigate()
  const selectedIntent = useAppStore(s => s.selectedIntent)
  const selectedIngredients = useAppStore(s => s.selectedIngredients)
  const toggleIngredient = useAppStore(s => s.toggleIngredient)
  const [customIngredient, setCustomIngredient] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.get('/pantry').then(r => r.data) })
  const pantryItems = pantryData?.items || []

  const mutation = useMutation({
    mutationFn: (data) => api.post('/recipes/suggest', data).then(r => r.data),
    onSuccess: (data) => setSuggestions(data)
  })

  const addCustom = () => {
    const trimmed = customIngredient.trim()
    if (trimmed && !selectedIngredients.includes(trimmed)) toggleIngredient(trimmed)
    setCustomIngredient('')
  }

  const handleSuggest = () => {
    mutation.mutate({ intent: selectedIntent, availableIngredients: selectedIngredients })
  }

  const getMatchPercent = (recipe) => {
    if (!selectedIngredients.length) return null
    const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase())
    const matches = recipeIngs.filter(ri => selectedIngredients.some(si => ri.includes(si.toLowerCase()) || si.toLowerCase().includes(ri)))
    return Math.round((matches.length / recipeIngs.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-gray-900">Find Your Recipe</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {selectedIntent && (
          <div className="inline-flex items-center gap-2 bg-orange-100 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            {INTENT_LABEL[selectedIntent]}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">🥕 Select Your Ingredients</h3>
          {pantryItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {pantryItems.map(item => (
                <button key={item._id} onClick={() => toggleIngredient(item.name)}
                  className={\`px-3 py-1.5 rounded-full text-sm border-2 transition-all \${selectedIngredients.includes(item.name) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}\`}>
                  {item.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={customIngredient} onChange={e => setCustomIngredient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add custom ingredient..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            <button onClick={addCustom} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark"><Plus className="w-5 h-5" /></button>
          </div>
          {selectedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedIngredients.map(ing => (
                <span key={ing} className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-primary rounded-full text-sm">
                  {ing}
                  <button onClick={() => toggleIngredient(ing)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSuggest} disabled={mutation.isPending}
          className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60 mb-6">
          <Search className="w-5 h-5" />
          {mutation.isPending ? 'Finding recipes...' : '🔍 Find Recipes'}
        </button>

        {mutation.error && <p className="text-red-500 text-sm mb-4 text-center">Something went wrong. Try again.</p>}

        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">✨ Suggested for You</h3>
            {suggestions.map(recipe => {
              const match = getMatchPercent(recipe)
              return (
                <div key={recipe._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{recipe.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-orange-100 text-primary rounded-full px-2 py-0.5">{recipe.cuisine}</span>
                        <span className={\`text-xs rounded-full px-2 py-0.5 \${DIFF_COLOR[recipe.difficulty]}\`}>{recipe.difficulty}</span>
                      </div>
                    </div>
                    {match !== null && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary">{match}%</div>
                        <div className="text-xs text-gray-400">match</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.prepTime + recipe.cookingTime} min total</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                  <button onClick={() => navigate(\`/recipe/\${recipe._id}\`)}
                    className="flex items-center gap-1 text-primary font-medium text-sm hover:gap-2 transition-all">
                    View Recipe <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {mutation.isSuccess && suggestions.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-3">🤔</p>
            <p className="font-medium">No recipes match your criteria.</p>
            <p className="text-sm mt-1">Try different ingredients or a different intent.</p>
          </div>
        )}
      </div>
    </div>
  )
}
`);

// client/src/components/RecipeDetail.jsx
w('client/src/components/RecipeDetail.jsx', `import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, CheckSquare, Square } from 'lucide-react'
import api from '../services/api'

const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [checked, setChecked] = useState([])

  const { data: recipe, isLoading } = useQuery({ queryKey: ['recipe', id], queryFn: () => api.get(\`/recipes/\${id}\`).then(r => r.data) })

  const shoppingMutation = useMutation({
    mutationFn: (items) => api.post('/shopping/add', items),
    onSuccess: () => { qc.invalidateQueries(['shopping']); alert('Added to shopping list!') }
  })

  const toggleCheck = (idx) => setChecked(c => c.includes(idx) ? c.filter(i => i !== idx) : [...c, idx])

  const addToShopping = () => {
    if (!recipe) return
    const missing = recipe.ingredients.filter((_, i) => !checked.includes(i))
    missing.forEach(ing => shoppingMutation.mutate({ name: ing.name, quantity: ing.amount, unit: ing.unit }))
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading recipe...</div></div>
  if (!recipe) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Recipe not found</div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-gray-900 truncate">{recipe.title}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm bg-orange-100 text-primary rounded-full px-3 py-1 font-medium">{recipe.cuisine}</span>
          <span className={\`text-sm rounded-full px-3 py-1 font-medium \${DIFF_COLOR[recipe.difficulty]}\`}>{recipe.difficulty}</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h2>
        <p className="text-gray-600 mb-5">{recipe.description}</p>

        <div className="bg-orange-50 rounded-2xl p-4 flex flex-wrap gap-5 mb-6">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><div><div className="text-xs text-gray-500">Total Time</div><div className="font-bold text-sm">{recipe.prepTime + recipe.cookingTime} min</div></div></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400" /><div><div className="text-xs text-gray-500">Prep</div><div className="font-bold text-sm">{recipe.prepTime} min</div></div></div>
          <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-orange-400" /><div><div className="text-xs text-gray-500">Cook</div><div className="font-bold text-sm">{recipe.cookingTime} min</div></div></div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><div><div className="text-xs text-gray-500">Serves</div><div className="font-bold text-sm">{recipe.servings}</div></div></div>
        </div>

        {recipe.nutritionInfo && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[['Calories', recipe.nutritionInfo.calories, 'kcal'], ['Protein', recipe.nutritionInfo.protein, 'g'], ['Carbs', recipe.nutritionInfo.carbs, 'g'], ['Fat', recipe.nutritionInfo.fat, 'g']].map(([label, val, unit]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-lg font-bold text-primary">{val}</div>
                <div className="text-xs text-gray-400">{unit}</div>
                <div className="text-xs text-gray-600 font-medium">{label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h3 className="font-bold text-gray-900 mb-4">🧺 Ingredients</h3>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <button key={i} onClick={() => toggleCheck(i)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left">
                {checked.includes(i) ? <CheckSquare className="w-5 h-5 text-primary flex-shrink-0" /> : <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                <span className={\`flex-1 text-sm \${checked.includes(i) ? 'line-through text-gray-400' : 'text-gray-700'}\`}>{ing.name}</span>
                <span className="text-sm font-medium text-primary">{ing.amount} {ing.unit}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">📋 Steps</h3>
          <div className="space-y-4">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={addToShopping}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-orange-50 transition-colors">
            <ShoppingCart className="w-5 h-5" /> Add to Shopping List
          </button>
          <button onClick={() => navigate(\`/cook/\${recipe._id}\`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
            <ChefHat className="w-5 h-5" /> Start Cooking!
          </button>
        </div>
      </div>
    </div>
  )
}
`);

// client/src/components/GuidedCooking.jsx
w('client/src/components/GuidedCooking.jsx', `import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, HelpCircle, Star, X } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import useAppStore from '../store/useAppStore'

export default function GuidedCooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const cookingStep = useAppStore(s => s.cookingStep)
  const nextStep = useAppStore(s => s.nextStep)
  const prevStep = useAppStore(s => s.prevStep)
  const stopCooking = useAppStore(s => s.stopCooking)
  const [showTip, setShowTip] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [notes, setNotes] = useState('')
  const [historyId, setHistoryId] = useState(null)

  const { data: recipe, isLoading } = useQuery({ queryKey: ['recipe', id], queryFn: () => api.get(\`/recipes/\${id}\`).then(r => r.data) })

  const logMutation = useMutation({
    mutationFn: (data) => api.post('/mealhistory', data).then(r => r.data),
    onSuccess: (data) => setHistoryId(data._id)
  })

  const rateMutation = useMutation({
    mutationFn: ({ histId, ...data }) => api.put(\`/mealhistory/\${histId}/rate\`, data),
    onSuccess: () => { stopCooking(); navigate('/dashboard') }
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!recipe) return null

  const steps = recipe.steps || []
  const totalSteps = steps.length
  const currentStepData = steps[cookingStep]
  const progress = ((cookingStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (cookingStep === totalSteps - 1) {
      logMutation.mutate({ recipeId: recipe._id, recipeTitle: recipe.title })
      setShowDone(true)
    } else {
      nextStep()
      setShowTip(false)
      setShowWhy(false)
    }
  }

  const handleSubmitRating = () => {
    if (!historyId) return
    rateMutation.mutate({ histId: historyId, rating, feedback, notes })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3 border-b border-gray-800">
        <button onClick={() => { stopCooking(); navigate(\`/recipe/\${id}\`) }} className="p-2 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold truncate">{recipe.title}</h1>
          <p className="text-xs text-gray-400">Step {cookingStep + 1} of {totalSteps}</p>
        </div>
      </header>

      <div className="h-1.5 bg-gray-800">
        <div className="h-full bg-primary transition-all duration-300 rounded-r-full" style={{ width: \`\${progress}%\` }} />
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex-1">
          <div className="text-6xl font-black text-gray-700 mb-4">{cookingStep + 1}</div>
          <p className="text-2xl font-medium leading-relaxed text-white mb-6">{currentStepData?.instruction}</p>

          {currentStepData?.whyItMatters && (
            <div className="mb-3">
              <button onClick={() => setShowWhy(v => !v)}
                className="flex items-center gap-2 text-sm text-orange-300 font-medium">
                <HelpCircle className="w-4 h-4" />
                {showWhy ? 'Hide' : 'Why does this matter?'}
              </button>
              {showWhy && <p className="mt-2 text-sm text-gray-300 bg-gray-800 rounded-xl p-4 leading-relaxed">{currentStepData.whyItMatters}</p>}
            </div>
          )}

          {user?.learningMode && currentStepData?.tip && (
            <div>
              <button onClick={() => setShowTip(v => !v)}
                className="flex items-center gap-2 text-sm text-yellow-300 font-medium">
                <Lightbulb className="w-4 h-4" />
                {showTip ? 'Hide' : '🎓 Pro Tip'}
              </button>
              {showTip && <p className="mt-2 text-sm text-gray-300 bg-gray-800 rounded-xl p-4 leading-relaxed">{currentStepData.tip}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={() => { prevStep(); setShowTip(false); setShowWhy(false) }} disabled={cookingStep === 0}
            className="flex items-center gap-2 px-6 py-4 bg-gray-800 rounded-2xl font-semibold disabled:opacity-30 hover:bg-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Prev
          </button>
          <button onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary rounded-2xl font-semibold hover:bg-primary-dark transition-colors text-lg">
            {cookingStep === totalSteps - 1 ? '✅ Done Cooking!' : <>Next <ChevronRight className="w-5 h-5" /></>}
          </button>
        </div>
      </div>

      {showDone && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">🎉 Great work!</h2>
              <button onClick={() => { stopCooking(); navigate('/dashboard') }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-gray-500 mb-4">How did it turn out?</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={\`w-9 h-9 \${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}\`} />
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {[['loved', '❤️ Loved it'], ['ok', '👍 It was OK'], ['disliked', '👎 Didn\'t like']].map(([val, label]) => (
                <button key={val} onClick={() => setFeedback(val)}
                  className={\`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all \${feedback === val ? 'border-primary bg-orange-50 text-primary' : 'border-gray-200 text-gray-600'}\`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes? (optional)"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary mb-4" rows={2} />
            <button onClick={handleSubmitRating} disabled={!rating || !feedback || rateMutation.isPending}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-primary-dark transition-colors">
              {rateMutation.isPending ? 'Saving...' : 'Save & Finish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
`);

// client/src/components/Pantry.jsx
w('client/src/components/Pantry.jsx', `import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChefHat, Package, ShoppingCart, User } from 'lucide-react'
import api from '../services/api'

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-primary"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-gray-400"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
    </nav>
  )
}

export default function Pantry() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', expiresAt: '' })

  const { data, isLoading } = useQuery({ queryKey: ['pantry'], queryFn: () => api.get('/pantry').then(r => r.data) })
  const items = data?.items || []

  const addMutation = useMutation({
    mutationFn: (item) => api.post('/pantry', item),
    onSuccess: () => { qc.invalidateQueries(['pantry']); setForm({ name: '', quantity: '', unit: '', expiresAt: '' }) }
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId) => api.delete(\`/pantry/\${itemId}\`),
    onSuccess: () => qc.invalidateQueries(['pantry'])
  })

  const getExpiryClass = (expiresAt) => {
    if (!expiresAt) return 'bg-white'
    const days = Math.floor((new Date(expiresAt) - Date.now()) / 86400000)
    if (days < 0) return 'bg-red-50 border-red-200'
    if (days <= 3) return 'bg-orange-50 border-orange-200'
    return 'bg-white'
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addMutation.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">🥦 My Pantry</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">Add Ingredient</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ingredient name *" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            <div className="flex gap-2">
              <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Quantity"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unit (g, cups...)"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary text-gray-500" />
            <button type="submit" disabled={addMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60">
              <Plus className="w-5 h-5" /> {addMutation.isPending ? 'Adding...' : 'Add to Pantry'}
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-medium">Your pantry is empty.</p>
            <p className="text-sm mt-1">Add ingredients to get personalized suggestions!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const expiryClass = getExpiryClass(item.expiresAt)
              const daysLeft = item.expiresAt ? Math.floor((new Date(item.expiresAt) - Date.now()) / 86400000) : null
              return (
                <div key={item._id} className={\`flex items-center justify-between p-4 rounded-xl border \${expiryClass}\`}>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {(item.quantity || item.unit) && <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>}
                    {daysLeft !== null && (
                      <p className={\`text-xs mt-0.5 \${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-gray-400'}\`}>
                        {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Expires today' : \`Expires in \${daysLeft} day\${daysLeft !== 1 ? 's' : ''}\`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteMutation.mutate(item._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
`);

// client/src/components/ShoppingList.jsx
w('client/src/components/ShoppingList.jsx', `import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChefHat, Package, ShoppingCart, User, Trash2 } from 'lucide-react'
import api from '../services/api'

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-primary"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
    </nav>
  )
}

export default function ShoppingList() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', quantity: '', unit: '' })

  const { data, isLoading } = useQuery({ queryKey: ['shopping'], queryFn: () => api.get('/shopping').then(r => r.data) })
  const items = data?.items || []

  const addMutation = useMutation({
    mutationFn: (item) => api.post('/shopping/add', item),
    onSuccess: () => { qc.invalidateQueries(['shopping']); setForm({ name: '', quantity: '', unit: '' }) }
  })

  const checkMutation = useMutation({
    mutationFn: (itemId) => api.put(\`/shopping/\${itemId}/check\`),
    onSuccess: () => qc.invalidateQueries(['shopping'])
  })

  const clearCheckedMutation = useMutation({
    mutationFn: () => {
      const unchecked = items.filter(i => !i.checked)
      return api.post('/shopping', { items: unchecked })
    },
    onSuccess: () => qc.invalidateQueries(['shopping'])
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addMutation.mutate(form)
  }

  const checkedCount = items.filter(i => i.checked).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🛒 Shopping List</h1>
          {checkedCount > 0 && (
            <button onClick={() => clearCheckedMutation.mutate()} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" /> Clear Checked ({checkedCount})
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex gap-2 flex-wrap">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name *" required
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Qty"
            className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unit"
            className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          <button type="submit" disabled={addMutation.isPending}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🛍️</div>
            <p className="font-medium">Your shopping list is empty.</p>
            <p className="text-sm mt-1">Add items manually or get suggestions from a recipe!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <button key={item._id} onClick={() => checkMutation.mutate(item._id)}
                className={\`w-full flex items-center gap-3 p-4 rounded-xl border bg-white text-left transition-all \${item.checked ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-primary'}\`}>
                <div className={\`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 \${item.checked ? 'bg-primary border-primary' : 'border-gray-300'}\`}>
                  {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1">
                  <span className={\`font-medium text-sm \${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}\`}>{item.name}</span>
                  {(item.quantity || item.unit) && <span className="text-xs text-gray-400 ml-2">{item.quantity} {item.unit}</span>}
                  {item.recipeSource && <span className="text-xs text-orange-400 ml-2">({item.recipeSource})</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
`);

// client/src/components/Profile.jsx
w('client/src/components/Profile.jsx', `import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChefHat, Package, ShoppingCart, User, LogOut, ToggleLeft, ToggleRight, Save } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const CUISINES = ['Italian','Asian','Mexican','Mediterranean','American','Indian','Japanese','Greek','French','Thai']
const DIETARY = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Halal','Kosher']
const DISLIKES_LIST = ['Cilantro','Mushrooms','Onions','Garlic','Spicy Food','Seafood','Red Meat','Eggs']
const LEVEL_COLOR = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-orange-100 text-orange-700', advanced: 'bg-purple-100 text-purple-700' }

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={\`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all \${active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}\`}>
      {label}
    </button>
  )
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-gray-400"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-primary"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
    </nav>
  )
}

export default function Profile() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const updateUser = useAuthStore(s => s.updateUser)

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/profile').then(r => r.data) })
  const { data: historyData } = useQuery({ queryKey: ['mealHistory'], queryFn: () => api.get('/mealhistory').then(r => r.data) })

  const [editing, setEditing] = useState(false)
  const [tastes, setTastes] = useState([])
  const [dietary, setDietary] = useState([])
  const [dislikes, setDislikes] = useState([])
  const [saved, setSaved] = useState(false)

  React.useEffect(() => {
    if (profile) {
      setTastes(profile.tastePreferences || [])
      setDietary(profile.dietaryRestrictions || [])
      setDislikes(profile.dislikes || [])
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data).then(r => r.data),
    onSuccess: (data) => { updateUser(data); qc.invalidateQueries(['profile']); setSaved(true); setTimeout(() => setSaved(false), 3000); setEditing(false) }
  })

  const learningMutation = useMutation({
    mutationFn: (val) => api.put('/users/profile', { learningMode: val }).then(r => r.data),
    onSuccess: (data) => { updateUser(data); qc.invalidateQueries(['profile']) }
  })

  const toggle = (arr, setArr, val) => setArr(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val])

  const totalMeals = historyData?.length || 0
  const avgRating = historyData?.filter(m => m.rating).reduce((acc, m, _, arr) => acc + m.rating / arr.length, 0) || 0
  const cuisineCount = {}
  historyData?.forEach(m => { if (m.recipeId?.cuisine) cuisineCount[m.recipeId.cuisine] = (cuisineCount[m.recipeId.cuisine] || 0) + 1 })
  const favCuisine = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">👤 Profile</h1>
          <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              {profile?.cookingLevel && (
                <span className={\`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold capitalize \${LEVEL_COLOR[profile.cookingLevel] || 'bg-gray-100 text-gray-700'}\`}>
                  {profile.cookingLevel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalMeals}</div>
            <div className="text-xs text-gray-500 mt-1">Meals Cooked</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary">{avgRating ? avgRating.toFixed(1) : '—'}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Rating</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-sm font-bold text-primary">{favCuisine || '—'}</div>
            <div className="text-xs text-gray-500 mt-1">Fav Cuisine</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">📚 Learning Mode</h3>
              <p className="text-sm text-gray-500">Show cooking tips & explanations</p>
            </div>
            <button onClick={() => learningMutation.mutate(!profile?.learningMode)} disabled={learningMutation.isPending}>
              {profile?.learningMode
                ? <ToggleRight className="w-10 h-10 text-primary" />
                : <ToggleLeft className="w-10 h-10 text-gray-300" />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">✏️ Preferences</h3>
            {!editing
              ? <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">Edit</button>
              : <button onClick={() => updateMutation.mutate({ tastePreferences: tastes, dietaryRestrictions: dietary, dislikes })}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1 text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
            }
          </div>
          {saved && <p className="text-green-600 text-sm mb-3">✅ Preferences saved!</p>}

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Favorite Cuisines</p>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map(c => <Chip key={c} label={c} active={tastes.includes(c)} onClick={editing ? () => toggle(tastes, setTastes, c) : undefined} />)}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Dietary Restrictions</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY.map(d => <Chip key={d} label={d} active={dietary.includes(d)} onClick={editing ? () => toggle(dietary, setDietary, d) : undefined} />)}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Dislikes</p>
              <div className="flex flex-wrap gap-2">
                {DISLIKES_LIST.map(d => <Chip key={d} label={d} active={dislikes.includes(d)} onClick={editing ? () => toggle(dislikes, setDislikes, d) : undefined} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
`);

console.log('\n✅ All client files written!');
console.log('\nNext steps:');
console.log('  cd server   && npm install && npm run seed && npm run dev');
console.log('  cd client   && npm install && npm run dev');

process.exit(0);

// client/package.json
w('client/package.json', JSON.stringify({
  name: 'smart-cooking-client',
  version: '1.0.0',
  private: true,
  dependencies: {
    axios: '^1.6.2',
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-router-dom': '^6.20.0',
    'react-scripts': '5.0.1',
  },
  scripts: { start: 'react-scripts start', build: 'react-scripts build' },
  browserslist: { production: ['>0.2%','not dead','not op_mini all'], development: ['last 1 chrome version','last 1 firefox version','last 1 safari version'] },
}, null, 2));

// client/public/index.html
w('client/public/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Smart Cooking Assistant</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>
`);

// client/src/index.js
w('client/src/index.js', `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
`);

// client/src/index.css
w('client/src/index.css', `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #212529; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
.card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); padding: 1.5rem; }
.btn { display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.2rem; border: none; border-radius: 8px; font-size: .95rem; font-weight: 600; transition: opacity .15s; }
.btn:hover { opacity: .85; }
.btn-primary { background: #ff6b35; color: #fff; }
.btn-secondary { background: #e9ecef; color: #495057; }
.btn-danger  { background: #dc3545; color: #fff; }
.badge { display: inline-block; padding: .2rem .55rem; border-radius: 20px; font-size: .75rem; font-weight: 600; background: #ffe0cc; color: #c0392b; }
.form-group { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1rem; }
.form-group label { font-weight: 600; font-size: .9rem; }
.form-group input, .form-group select, .form-group textarea { padding: .6rem .85rem; border: 1.5px solid #dee2e6; border-radius: 8px; font-size: .95rem; transition: border-color .15s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #ff6b35; }
.error-msg { color: #dc3545; font-size: .85rem; margin-top: .25rem; }
.page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
`);

// client/src/services/api.js
w('client/src/services/api.js', `import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = \`Bearer \${token}\`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
`);

// client/src/store/AuthContext.js
w('client/src/store/AuthContext.js', `import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [token, setToken]   = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally { setLoading(false); }
  }, []);

  const updateUser = useCallback(updates => {
    const updated = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`);

// client/src/App.js
w('client/src/App.js', `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import Navbar       from './components/Navbar';
import Login        from './components/Login';
import Register     from './components/Register';
import Onboarding   from './components/Onboarding';
import Dashboard    from './components/Dashboard';
import RecipeList   from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import PantryManager from './components/PantryManager';
import ShoppingList from './components/ShoppingList';
import MealHistory  from './components/MealHistory';
import Profile      from './components/Profile';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login"    element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/"         element={<Protected><Dashboard /></Protected>} />
        <Route path="/recipes"  element={<Protected><RecipeList /></Protected>} />
        <Route path="/recipes/:id" element={<Protected><RecipeDetail /></Protected>} />
        <Route path="/pantry"   element={<Protected><PantryManager /></Protected>} />
        <Route path="/shopping" element={<Protected><ShoppingList /></Protected>} />
        <Route path="/history"  element={<Protected><MealHistory /></Protected>} />
        <Route path="/profile"  element={<Protected><Profile /></Protected>} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
`);

// client/src/components/Navbar.js
w('client/src/components/Navbar.js', `import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const links = [
  { to: '/',         label: '🏠 Home' },
  { to: '/recipes',  label: '📖 Recipes' },
  { to: '/pantry',   label: '🥦 Pantry' },
  { to: '/shopping', label: '🛒 Shopping' },
  { to: '/history',  label: '📅 History' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navStyle = { background: '#fff', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, zIndex: 100 };
  const innerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1.5rem', maxWidth: 1100, margin: '0 auto' };
  const logoStyle = { fontWeight: 800, fontSize: '1.2rem', color: '#ff6b35' };
  const ulStyle = { display: 'flex', gap: '1.5rem', listStyle: 'none', alignItems: 'center' };
  const getLinkStyle = (to) => ({ fontWeight: 600, color: location.pathname === to ? '#ff6b35' : '#495057', fontSize: '.92rem' });

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <Link to="/" style={logoStyle}>🍳 SmartCook</Link>
        <ul style={ulStyle}>
          {links.map(l => <li key={l.to}><Link to={l.to} style={getLinkStyle(l.to)}>{l.label}</Link></li>)}
          <li><Link to="/profile" style={getLinkStyle('/profile')}>👤 {user?.name?.split(' ')[0]}</Link></li>
          <li><button className="btn btn-secondary" style={{padding:'.35rem .8rem',fontSize:'.85rem'}} onClick={handleLogout}>Logout</button></li>
        </ul>
      </div>
    </nav>
  );
}
`);

// client/src/components/Login.js
w('client/src/components/Login.js', `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const { login, loading }  = useAuth();
  const navigate = useNavigate();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(form.email, form.password);
      navigate(data.user.onboardingComplete ? '/' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fff5f0,#ffe8d6)' };
  const boxStyle  = { width: '100%', maxWidth: 420, padding: '2.5rem', borderRadius: 16, background: '#fff', boxShadow: '0 4px 30px rgba(0,0,0,.1)' };

  return (
    <div style={pageStyle}>
      <div style={boxStyle}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'3rem'}}>🍳</div>
          <h1 style={{fontSize:'1.8rem',fontWeight:800,color:'#ff6b35'}}>SmartCook</h1>
          <p style={{color:'#6c757d',marginTop:'.4rem'}}>Your personal cooking assistant</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:'.5rem'}}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'1.5rem',color:'#6c757d',fontSize:'.9rem'}}>
          No account? <Link to="/register" style={{color:'#ff6b35',fontWeight:600}}>Register</Link>
        </p>
      </div>
    </div>
  );
}
`);

// client/src/components/Register.js
w('client/src/components/Register.js', `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fff5f0,#ffe8d6)' };
  const boxStyle  = { width: '100%', maxWidth: 440, padding: '2.5rem', borderRadius: 16, background: '#fff', boxShadow: '0 4px 30px rgba(0,0,0,.1)' };

  return (
    <div style={pageStyle}>
      <div style={boxStyle}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'3rem'}}>🍳</div>
          <h1 style={{fontSize:'1.8rem',fontWeight:800,color:'#ff6b35'}}>Create Account</h1>
          <p style={{color:'#6c757d',marginTop:'.4rem'}}>Start cooking smarter today</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={onChange} placeholder="Jane Smith" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Min 6 characters" minLength={6} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:'.5rem'}}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'1.5rem',color:'#6c757d',fontSize:'.9rem'}}>
          Have an account? <Link to="/login" style={{color:'#ff6b35',fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
`);

// client/src/components/Onboarding.js
w('client/src/components/Onboarding.js', `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';

const LEVELS   = ['beginner','intermediate','advanced'];
const TASTES   = ['spicy','sweet','savory','sour','umami','mild'];
const DIETS    = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Halal','Kosher'];
const DISLIKES = ['cilantro','mushrooms','olives','onions','garlic','shellfish','nuts','eggs'];

export default function Onboarding() {
  const [step, setStep]       = useState(0);
  const [level, setLevel]     = useState('beginner');
  const [tastes, setTastes]   = useState([]);
  const [diets, setDiets]     = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { updateUser }        = useAuth();
  const navigate              = useNavigate();

  const toggle = (arr, setArr, val) => setArr(a => a.includes(val) ? a.filter(x=>x!==val) : [...a, val]);

  const finish = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', { cookingLevel: level, tastePreferences: tastes, dietaryRestrictions: diets, dislikes, onboardingComplete: true });
      updateUser(data);
      navigate('/');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const boxStyle = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#fff5f0,#ffe8d6)' };
  const cardStyle = { width:'100%', maxWidth:520, padding:'2.5rem', borderRadius:16, background:'#fff', boxShadow:'0 4px 30px rgba(0,0,0,.1)' };
  const chipStyle = (active) => ({ display:'inline-block', padding:'.4rem .9rem', margin:'.25rem', borderRadius:20, border:'2px solid '+(active?'#ff6b35':'#dee2e6'), background:active?'#fff5f0':'#fff', color:active?'#ff6b35':'#495057', fontWeight:600, cursor:'pointer', fontSize:'.88rem', transition:'all .15s' });

  const steps = [
    <div key="step0">
      <h2 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:'.5rem'}}>👋 Welcome! What's your cooking level?</h2>
      <p style={{color:'#6c757d',marginBottom:'1.5rem'}}>This helps us suggest the right recipes for you.</p>
      {LEVELS.map(l => <div key={l} style={chipStyle(level===l)} onClick={()=>setLevel(l)}>{l.charAt(0).toUpperCase()+l.slice(1)}</div>)}
    </div>,
    <div key="step1">
      <h2 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:'.5rem'}}>🍽️ What flavors do you love?</h2>
      <p style={{color:'#6c757d',marginBottom:'1.5rem'}}>Pick as many as you like.</p>
      {TASTES.map(t => <div key={t} style={chipStyle(tastes.includes(t))} onClick={()=>toggle(tastes,setTastes,t)}>{t}</div>)}
    </div>,
    <div key="step2">
      <h2 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:'.5rem'}}>🚫 Any dietary restrictions?</h2>
      <p style={{color:'#6c757d',marginBottom:'1.5rem'}}>We'll filter recipes accordingly.</p>
      {DIETS.map(d => <div key={d} style={chipStyle(diets.includes(d))} onClick={()=>toggle(diets,setDiets,d)}>{d}</div>)}
    </div>,
    <div key="step3">
      <h2 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:'.5rem'}}>😖 Any ingredients you dislike?</h2>
      <p style={{color:'#6c757d',marginBottom:'1.5rem'}}>We'll try to avoid these in suggestions.</p>
      {DISLIKES.map(d => <div key={d} style={chipStyle(dislikes.includes(d))} onClick={()=>toggle(dislikes,setDislikes,d)}>{d}</div>)}
    </div>,
  ];

  return (
    <div style={boxStyle}>
      <div style={cardStyle}>
        <div style={{display:'flex', gap:'.4rem', marginBottom:'2rem'}}>
          {steps.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background: i<=step?'#ff6b35':'#dee2e6', transition:'background .3s'}} />)}
        </div>
        {steps[step]}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'2rem'}}>
          {step > 0 ? <button className="btn btn-secondary" onClick={()=>setStep(s=>s-1)}>Back</button> : <div />}
          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>Next →</button>
            : <button className="btn btn-primary" onClick={finish} disabled={loading}>{loading?'Saving…':'Finish Setup 🎉'}</button>
          }
        </div>
      </div>
    </div>
  );
}
`);

// client/src/components/Dashboard.js
w('client/src/components/Dashboard.js', `import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import RecipeCard from './RecipeCard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions]   = useState([]);
  const [pantryItems, setPantryItems]   = useState([]);
  const [intent, setIntent]             = useState('any');
  const [maxTime, setMaxTime]           = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (user && !user.onboardingComplete) navigate('/onboarding');
    loadPantry();
    fetchSuggestions();
  }, []);

  const loadPantry = async () => {
    try { const { data } = await api.get('/pantry'); setPantryItems(data.items || []); }
    catch {}
  };

  const fetchSuggestions = async (opts={}) => {
    setLoading(true);
    try {
      const body = {
        intent: opts.intent || intent,
        availableIngredients: pantryItems.map(i=>i.name),
        maxTime: opts.maxTime || maxTime || undefined,
      };
      const { data } = await api.post('/recipes/suggest', body);
      setSuggestions(data);
    } catch {}
    finally { setLoading(false); }
  };

  const quickFilters = ['any','quick','easy','healthy'];

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem'}}>
      <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.3rem'}}>
        Good day, {user?.name?.split(' ')[0]}! 👋
      </h1>
      <p style={{color:'#6c757d',marginBottom:'2rem'}}>Here are some recipes picked just for you.</p>

      {/* Smart filter bar */}
      <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginBottom:'2rem',padding:'1rem 1.25rem',background:'#fff',borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:'.4rem',flex:1,flexWrap:'wrap'}}>
          {quickFilters.map(f=>(
            <button key={f} onClick={()=>{setIntent(f);fetchSuggestions({intent:f});}}
              className="btn" style={{padding:'.4rem .85rem',fontSize:'.85rem',background:intent===f?'#ff6b35':'#f1f3f5',color:intent===f?'#fff':'#495057'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <input type="number" placeholder="Max time (min)" value={maxTime}
          onChange={e=>setMaxTime(e.target.value)}
          style={{width:140,padding:'.4rem .7rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.9rem'}} />
        <button className="btn btn-primary" onClick={()=>fetchSuggestions()} disabled={loading} style={{whiteSpace:'nowrap'}}>
          {loading?'Finding…':'Find Recipes'}
        </button>
      </div>

      {loading
        ? <div style={{textAlign:'center',padding:'3rem',color:'#adb5bd',fontSize:'1.1rem'}}>🔍 Finding the best recipes for you…</div>
        : suggestions.length === 0
          ? <div style={{textAlign:'center',padding:'3rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🍽️</div>
              <p style={{color:'#6c757d'}}>No suggestions yet. Try adjusting your filters or add ingredients to your <Link to="/pantry" style={{color:'#ff6b35'}}>pantry</Link>.</p>
            </div>
          : <div className="grid-3">{suggestions.map(r=><RecipeCard key={r._id} recipe={r} />)}</div>
      }

      {/* Quick links */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'1rem',marginTop:'2.5rem'}}>
        {[
          {to:'/recipes',icon:'📖',label:'Browse All Recipes'},
          {to:'/pantry',icon:'🥦',label:'Manage Pantry'},
          {to:'/shopping',icon:'🛒',label:'Shopping List'},
          {to:'/history',icon:'📅',label:'Meal History'},
        ].map(l=>(
          <Link to={l.to} key={l.to} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'1rem 1.25rem',background:'#fff',borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,.06)',fontWeight:600,color:'#212529',transition:'transform .15s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <span style={{fontSize:'1.5rem'}}>{l.icon}</span>{l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
`);

// client/src/components/RecipeCard.js
w('client/src/components/RecipeCard.js', `import React from 'react';
import { Link } from 'react-router-dom';

const diffColor = { easy:'#28a745', medium:'#fd7e14', hard:'#dc3545' };

export default function RecipeCard({ recipe }) {
  const { _id, title, description, cuisine, difficulty, cookingTime, prepTime, tags=[] } = recipe;
  const totalTime = (cookingTime||0) + (prepTime||0);

  return (
    <Link to={\`/recipes/\${_id}\`} style={{textDecoration:'none'}}>
      <div className="card" style={{height:'100%',transition:'transform .2s,box-shadow .2s',cursor:'pointer'}}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.12)';}}
        onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.75rem'}}>
          <span style={{fontSize:'.8rem',fontWeight:600,color:'#ff6b35',background:'#fff5f0',padding:'.2rem .55rem',borderRadius:20}}>{cuisine}</span>
          <span style={{fontSize:'.8rem',fontWeight:700,color:diffColor[difficulty]||'#6c757d'}}>{difficulty}</span>
        </div>
        <h3 style={{fontWeight:700,marginBottom:'.4rem',fontSize:'1.05rem',color:'#212529'}}>{title}</h3>
        <p style={{color:'#6c757d',fontSize:'.87rem',lineHeight:1.5,marginBottom:'1rem',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{description}</p>
        <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginBottom:'.75rem'}}>
          {totalTime > 0 && <span style={{fontSize:'.82rem',color:'#495057'}}>⏱ {totalTime} min</span>}
        </div>
        <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap'}}>
          {tags.slice(0,3).map(t=><span key={t} className="badge">{t}</span>)}
        </div>
      </div>
    </Link>
  );
}
`);

// client/src/components/RecipeList.js
w('client/src/components/RecipeList.js', `import React, { useEffect, useState } from 'react';
import api from '../services/api';
import RecipeCard from './RecipeCard';

export default function RecipeList() {
  const [recipes, setRecipes]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [cuisine, setCuisine]   = useState('');
  const [difficulty, setDiff]   = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => { api.get('/recipes').then(({data})=>{ setRecipes(data); setFiltered(data); }).finally(()=>setLoading(false)); }, []);

  useEffect(() => {
    let r = recipes;
    if (search)     r = r.filter(x=>x.title.toLowerCase().includes(search.toLowerCase())||x.tags.some(t=>t.toLowerCase().includes(search.toLowerCase())));
    if (cuisine)    r = r.filter(x=>x.cuisine===cuisine);
    if (difficulty) r = r.filter(x=>x.difficulty===difficulty);
    setFiltered(r);
  }, [search, cuisine, difficulty, recipes]);

  const cuisines = [...new Set(recipes.map(r=>r.cuisine))].sort();

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem'}}>
      <h1 className="page-title">📖 All Recipes</h1>
      <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'2rem'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search recipes or tags…"
          style={{flex:1,minWidth:200,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem'}} />
        <select value={cuisine} onChange={e=>setCuisine(e.target.value)}
          style={{padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:140}}>
          <option value="">All cuisines</option>
          {cuisines.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={difficulty} onChange={e=>setDiff(e.target.value)}
          style={{padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem'}}>
          <option value="">All levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      {loading
        ? <div style={{textAlign:'center',padding:'4rem',color:'#adb5bd'}}>Loading recipes…</div>
        : filtered.length === 0
          ? <div style={{textAlign:'center',padding:'3rem',color:'#6c757d'}}>No recipes match your filters.</div>
          : <div className="grid-3">{filtered.map(r=><RecipeCard key={r._id} recipe={r} />)}</div>
      }
    </div>
  );
}
`);

// client/src/components/RecipeDetail.js
w('client/src/components/RecipeDetail.js', `import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActive] = useState(0);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.get(\`/recipes/\${id}\`).then(({data})=>setRecipe(data)).catch(()=>navigate('/recipes')).finally(()=>setLoading(false));
  }, [id]);

  const logMeal = async () => {
    setSaving(true);
    try {
      await api.post('/mealhistory', { recipeId: recipe._id, recipeTitle: recipe.title });
      setSaved(true);
    } catch {}
    finally { setSaving(false); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'4rem',color:'#adb5bd'}}>Loading…</div>;
  if (!recipe) return null;

  const { title, description, cuisine, difficulty, cookingTime, prepTime, servings, ingredients=[], steps=[], tags=[], nutritionInfo={} } = recipe;
  const diffColor = { easy:'#28a745', medium:'#fd7e14', hard:'#dc3545' };

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem',maxWidth:800}}>
      <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',color:'#ff6b35',fontWeight:600,fontSize:'.95rem',marginBottom:'1.25rem',cursor:'pointer'}}>← Back</button>
      <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginBottom:'1rem'}}>
        <span style={{background:'#fff5f0',color:'#ff6b35',padding:'.25rem .65rem',borderRadius:20,fontWeight:600,fontSize:'.85rem'}}>{cuisine}</span>
        <span style={{color:diffColor[difficulty],fontWeight:700,fontSize:'.85rem',padding:'.25rem .65rem',border:\`1.5px solid \${diffColor[difficulty]}\`,borderRadius:20}}>{difficulty}</span>
        {tags.map(t=><span key={t} className="badge">{t}</span>)}
      </div>
      <h1 style={{fontSize:'1.9rem',fontWeight:800,marginBottom:'.5rem'}}>{title}</h1>
      <p style={{color:'#6c757d',marginBottom:'1.5rem',fontSize:'.98rem',lineHeight:1.6}}>{description}</p>

      {/* Meta */}
      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap',padding:'1rem 1.5rem',background:'#fff5f0',borderRadius:12,marginBottom:'2rem'}}>
        {[['⏱ Prep',prepTime+' min'],['🔥 Cook',cookingTime+' min'],['🍽️ Serves',servings+' people'],
          ['🔥 Calories',nutritionInfo.calories+'kcal']].map(([l,v])=>(
          <div key={l}><div style={{fontSize:'.8rem',color:'#6c757d'}}>{l}</div><div style={{fontWeight:700}}>{v}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:'2rem',flexWrap:'wrap'}}>
        {/* Ingredients */}
        <div>
          <h2 style={{fontWeight:700,marginBottom:'.85rem'}}>🧺 Ingredients</h2>
          <ul style={{listStyle:'none'}}>
            {ingredients.map((ing,i)=>(
              <li key={i} style={{display:'flex',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid #f1f3f5',fontSize:'.94rem'}}>
                <span>{ing.name}</span>
                <span style={{fontWeight:600,color:'#ff6b35'}}>{ing.amount} {ing.unit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div>
          <h2 style={{fontWeight:700,marginBottom:'.85rem'}}>👨‍🍳 Steps</h2>
          {steps.map((step,i)=>(
            <div key={i} onClick={()=>setActive(i)}
              style={{padding:'1rem',marginBottom:'.6rem',borderRadius:10,background:activeStep===i?'#fff5f0':'#fff',border:\`1.5px solid \${activeStep===i?'#ff6b35':'#dee2e6'}\`,cursor:'pointer',transition:'all .15s'}}>
              <div style={{display:'flex',gap:'.6rem',alignItems:'flex-start'}}>
                <span style={{minWidth:24,height:24,background:activeStep===i?'#ff6b35':'#dee2e6',color:activeStep===i?'#fff':'#495057',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.8rem'}}>{step.order||i+1}</span>
                <div>
                  <p style={{fontWeight:500,lineHeight:1.5,fontSize:'.93rem'}}>{step.instruction}</p>
                  {activeStep===i && step.tip && <p style={{marginTop:'.4rem',fontSize:'.85rem',color:'#fd7e14'}}>💡 <em>{step.tip}</em></p>}
                  {activeStep===i && step.whyItMatters && <p style={{marginTop:'.3rem',fontSize:'.83rem',color:'#6c757d'}}>🧠 {step.whyItMatters}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:'2rem',textAlign:'center'}}>
        {saved
          ? <p style={{color:'#28a745',fontWeight:600}}>✅ Logged to your meal history!</p>
          : <button className="btn btn-primary" onClick={logMeal} disabled={saving} style={{fontSize:'1rem',padding:'.7rem 2rem'}}>
              {saving?'Saving…':'✅ I cooked this!'}
            </button>
        }
      </div>
    </div>
  );
}
`);

// client/src/components/PantryManager.js
w('client/src/components/PantryManager.js', `import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function PantryManager() {
  const [items, setItems]   = useState([]);
  const [form, setForm]     = useState({ name:'', quantity:'', unit:'' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get('/pantry'); setItems(data.items||[]); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try { const { data } = await api.post('/pantry', form); setItems(data.items||[]); setForm({name:'',quantity:'',unit:''}); }
    catch {}
  };

  const remove = async id => {
    try { const { data } = await api.delete(\`/pantry/\${id}\`); setItems(data.items||[]); }
    catch {}
  };

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem'}}>
      <h1 className="page-title">🥦 My Pantry</h1>
      <div className="card" style={{marginBottom:'2rem',maxWidth:500}}>
        <h3 style={{marginBottom:'1rem',fontWeight:700}}>Add Item</h3>
        <form onSubmit={add} style={{display:'flex',gap:'.6rem',flexWrap:'wrap'}}>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ingredient name" required
            style={{flex:2,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:130}} />
          <input value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} placeholder="Amount"
            style={{flex:1,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:70}} />
          <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="Unit"
            style={{flex:1,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:70}} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>
      {loading ? <div style={{color:'#adb5bd'}}>Loading…</div>
        : items.length === 0 ? <div style={{color:'#6c757d',padding:'2rem 0'}}>Your pantry is empty. Add some ingredients!</div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
            {items.map(item=>(
              <div key={item._id} style={{background:'#fff',borderRadius:10,padding:'1rem 1.25rem',boxShadow:'0 2px 10px rgba(0,0,0,.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:600}}>{item.name}</div>
                  {(item.quantity||item.unit) && <div style={{fontSize:'.83rem',color:'#6c757d'}}>{item.quantity} {item.unit}</div>}
                </div>
                <button onClick={()=>remove(item._id)} style={{background:'none',border:'none',color:'#dc3545',fontSize:'1.1rem',cursor:'pointer',lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
`);

// client/src/components/ShoppingList.js
w('client/src/components/ShoppingList.js', `import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ShoppingList() {
  const [list, setList]     = useState({ items:[] });
  const [form, setForm]     = useState({ name:'', quantity:'', unit:'' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get('/shopping'); setList(data||{items:[]}); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try { const { data } = await api.post('/shopping/add', form); setList(data); setForm({name:'',quantity:'',unit:''}); }
    catch {}
  };

  const toggle = async id => {
    try { const { data } = await api.put(\`/shopping/\${id}/check\`); setList(data); }
    catch {}
  };

  const items = list.items || [];
  const done  = items.filter(i=>i.checked).length;

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h1 className="page-title" style={{marginBottom:0}}>🛒 Shopping List</h1>
        {items.length>0 && <span style={{color:'#6c757d',fontSize:'.9rem'}}>{done}/{items.length} checked</span>}
      </div>
      <div className="card" style={{marginBottom:'2rem',maxWidth:500}}>
        <form onSubmit={add} style={{display:'flex',gap:'.6rem',flexWrap:'wrap'}}>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Item name" required
            style={{flex:2,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:130}} />
          <input value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} placeholder="Qty"
            style={{flex:1,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:60}} />
          <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="Unit"
            style={{flex:1,padding:'.55rem .85rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.95rem',minWidth:60}} />
          <button className="btn btn-primary" type="submit">+ Add</button>
        </form>
      </div>
      {loading ? <div style={{color:'#adb5bd'}}>Loading…</div>
        : items.length === 0 ? <div style={{color:'#6c757d',padding:'2rem 0'}}>Your shopping list is empty.</div>
        : <div style={{maxWidth:500}}>
            {items.map(item=>(
              <div key={item._id} onClick={()=>toggle(item._id)}
                style={{display:'flex',alignItems:'center',gap:'.85rem',padding:'.85rem 1.1rem',background:'#fff',borderRadius:10,marginBottom:'.5rem',boxShadow:'0 1px 6px rgba(0,0,0,.06)',cursor:'pointer',opacity:item.checked?.6:1,transition:'opacity .15s'}}>
                <div style={{width:22,height:22,borderRadius:6,border:'2px solid '+(item.checked?'#28a745':'#dee2e6'),background:item.checked?'#28a745':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
                  {item.checked && <span style={{color:'#fff',fontSize:'.85rem',lineHeight:1}}>✓</span>}
                </div>
                <div style={{flex:1,textDecoration:item.checked?'line-through':'none',color:item.checked?'#adb5bd':'#212529'}}>
                  <span style={{fontWeight:600}}>{item.name}</span>
                  {(item.quantity||item.unit) && <span style={{color:'#6c757d',fontSize:'.85rem',marginLeft:'.5rem'}}>{item.quantity} {item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
`);

// client/src/components/MealHistory.js
w('client/src/components/MealHistory.js', `import React, { useEffect, useState } from 'react';
import api from '../services/api';

const feedbackEmoji = { loved:'❤️', ok:'👍', disliked:'👎' };

export default function MealHistory() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [rating, setRating]     = useState({});
  const [feedback, setFeedback] = useState({});

  const load = async () => {
    try { const { data } = await api.get('/mealhistory'); setHistory(data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const rate = async (id) => {
    try {
      const { data } = await api.put(\`/mealhistory/\${id}/rate\`, { rating: rating[id], feedback: feedback[id] });
      setHistory(h => h.map(e => e._id===id ? data : e));
    } catch {}
  };

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem'}}>
      <h1 className="page-title">📅 Meal History</h1>
      {loading ? <div style={{color:'#adb5bd'}}>Loading…</div>
        : history.length === 0
          ? <div style={{textAlign:'center',padding:'3rem',color:'#6c757d'}}>No meals logged yet. Cook a recipe and click "I cooked this!"</div>
          : <div style={{maxWidth:640}}>
              {history.map(entry=>(
                <div key={entry._id} className="card" style={{marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'.5rem'}}>
                    <div>
                      <h3 style={{fontWeight:700}}>{entry.recipeTitle}</h3>
                      <p style={{color:'#6c757d',fontSize:'.85rem'}}>{new Date(entry.cookedAt).toLocaleDateString('en-US',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</p>
                    </div>
                    {entry.feedback && <span style={{fontSize:'1.4rem'}} title={entry.feedback}>{feedbackEmoji[entry.feedback]}</span>}
                  </div>
                  {entry.rating && <div style={{color:'#ffc107',marginTop:'.4rem',fontSize:'1.1rem'}}>{'★'.repeat(entry.rating)}{'☆'.repeat(5-entry.rating)}</div>}
                  {!entry.rating && (
                    <div style={{marginTop:'.85rem',display:'flex',gap:'.5rem',flexWrap:'wrap',alignItems:'center'}}>
                      <select value={rating[entry._id]||''} onChange={e=>setRating(r=>({...r,[entry._id]:+e.target.value}))}
                        style={{padding:'.35rem .6rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.85rem'}}>
                        <option value="">Rate…</option>
                        {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} star{n>1?'s':''}</option>)}
                      </select>
                      <select value={feedback[entry._id]||''} onChange={e=>setFeedback(r=>({...r,[entry._id]:e.target.value}))}
                        style={{padding:'.35rem .6rem',border:'1.5px solid #dee2e6',borderRadius:8,fontSize:'.85rem'}}>
                        <option value="">Feedback…</option>
                        <option value="loved">❤️ Loved it</option>
                        <option value="ok">👍 It was ok</option>
                        <option value="disliked">👎 Didn't like</option>
                      </select>
                      <button className="btn btn-primary" onClick={()=>rate(entry._id)} style={{padding:'.35rem .85rem',fontSize:'.85rem'}}>Save</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }
    </div>
  );
}
`);

// client/src/components/Profile.js
w('client/src/components/Profile.js', `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';

const DIETS = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Halal','Kosher'];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [level, setLevel]   = useState(user?.cookingLevel || 'beginner');
  const [tastes, setTastes] = useState(user?.tastePreferences || []);
  const [diets, setDiets]   = useState(user?.dietaryRestrictions || []);
  const [learn, setLearn]   = useState(user?.learningMode || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const toggle = (arr, setArr, val) => setArr(a => a.includes(val) ? a.filter(x=>x!==val) : [...a, val]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const { data } = await api.put('/users/profile', { cookingLevel:level, tastePreferences:tastes, dietaryRestrictions:diets, learningMode:learn });
      updateUser(data);
      setSaved(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch {}
    finally { setSaving(false); }
  };

  const chipStyle = (active) => ({ display:'inline-block', padding:'.35rem .8rem', margin:'.2rem', borderRadius:20, border:'2px solid '+(active?'#ff6b35':'#dee2e6'), background:active?'#fff5f0':'#fff', color:active?'#ff6b35':'#495057', fontWeight:600, cursor:'pointer', fontSize:'.85rem' });

  return (
    <div className="container" style={{paddingTop:'2rem',paddingBottom:'3rem',maxWidth:620}}>
      <h1 className="page-title">👤 My Profile</h1>
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <h3 style={{fontWeight:700,marginBottom:'.3rem'}}>{user?.name}</h3>
        <p style={{color:'#6c757d',fontSize:'.9rem'}}>{user?.email}</p>
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <h3 style={{fontWeight:700,marginBottom:'1rem'}}>Cooking Level</h3>
        {['beginner','intermediate','advanced'].map(l=>(
          <div key={l} style={chipStyle(level===l)} onClick={()=>setLevel(l)}>{l.charAt(0).toUpperCase()+l.slice(1)}</div>
        ))}
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <h3 style={{fontWeight:700,marginBottom:'1rem'}}>Dietary Restrictions</h3>
        {DIETS.map(d=><div key={d} style={chipStyle(diets.includes(d))} onClick={()=>toggle(diets,setDiets,d)}>{d}</div>)}
      </div>

      <div className="card" style={{marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h3 style={{fontWeight:700}}>Learning Mode</h3>
          <p style={{color:'#6c757d',fontSize:'.88rem',marginTop:'.2rem'}}>Show cooking tips and explanations in recipe steps</p>
        </div>
        <div onClick={()=>setLearn(l=>!l)} style={{width:44,height:24,borderRadius:12,background:learn?'#ff6b35':'#dee2e6',cursor:'pointer',position:'relative',transition:'background .25s'}}>
          <div style={{position:'absolute',top:2,left:learn?22:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}} />
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{minWidth:130}}>
          {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
        <button className="btn btn-danger" onClick={()=>{logout();navigate('/login');}}>Sign Out</button>
      </div>
    </div>
  );
}
`);

// ─── 4. Root-level files ─────────────────────────────────────────────────────
w('.env.example', `MONGODB_URI=mongodb://localhost:27017/smart-cooking
JWT_SECRET=change-me-in-production
PORT=5000
`);

w('.gitignore', `node_modules/
.env
client/build/
`);

w('README.md', `# 🍳 Smart Cooking Assistant

A full-stack web app that suggests personalised recipes based on your pantry, preferences and cooking level.

## Stack
- **Backend**: Node.js · Express · MongoDB (Mongoose)
- **Frontend**: React 18 · React Router v6 · Axios

## Quick Start

\`\`\`bash
# 1. Install server deps
cd server && npm install

# 2. Seed the database (needs MongoDB running)
npm run seed

# 3. Start server (http://localhost:5000)
npm run dev

# 4. In another terminal – install & start client
cd ../client && npm install && npm start
\`\`\`

Open http://localhost:3000 in your browser.

## Features
- 🔐 JWT auth (register / login)
- 🎯 Personalised onboarding (cooking level, tastes, dietary restrictions)
- 🤖 Smart recipe suggestions via scoring engine
- 📖 Recipe browser with search & filters
- 🥦 Pantry inventory manager
- 🛒 Shopping list with check-off
- 📅 Meal history with ratings
- 👤 User profile settings
`);

console.log('\n✅  All done!');
console.log('\nNext steps:');
console.log('  cd server   && npm install && npm run seed && npm run dev');
console.log('  cd client   && npm install && npm start');

