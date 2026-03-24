import React from 'react'
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
import ModeSelect from './components/ModeSelect'
import MealPlanner from './components/MealPlanner'
import Analytics from './components/Analytics'
import LearningCenter from './components/LearningCenter'

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const token = useAuthStore(s => s.token)
  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/mode" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/mode" element={<ProtectedRoute><ModeSelect /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/suggest" element={<ProtectedRoute><RecipeSuggestions /></ProtectedRoute>} />
      <Route path="/recipe/generated/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
      <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
      <Route path="/cook/generated/:id" element={<ProtectedRoute><GuidedCooking /></ProtectedRoute>} />
      <Route path="/cook/:id" element={<ProtectedRoute><GuidedCooking /></ProtectedRoute>} />
      <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
      <Route path="/shopping" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
    </Routes>
  )
}
