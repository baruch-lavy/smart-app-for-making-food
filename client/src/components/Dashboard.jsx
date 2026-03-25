import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ShoppingCart, User, LogOut, ChefHat, Star, Calendar, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import useAppStore from '../store/useAppStore'

const INTENTS = [
  { id: 'quick',  title: '⚡ Quick & Easy',        sub: 'Under 20 minutes',             color: 'from-yellow-50 to-orange-50 border-orange-200' },
  { id: 'effort', title: '💪 I Will Put in Effort', sub: 'Let us make something special', color: 'from-blue-50 to-indigo-50 border-blue-200' },
  { id: 'easy',   title: '�� Something Easy',       sub: 'Low effort, big flavor',       color: 'from-green-50 to-emerald-50 border-green-200' },
]

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry"    className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/planner"   className="flex flex-col items-center gap-1 text-gray-400"><Calendar className="w-5 h-5" /><span className="text-xs">Planner</span></Link>
      <Link to="/shopping"  className="flex flex-col items-center gap-1 text-gray-400"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile"   className="flex flex-col items-center gap-1 text-gray-400"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
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
  const todayKey = DAY_NAMES[new Date().getDay()]

  const { data: pantryData }  = useQuery({ queryKey: ['pantry'],      queryFn: () => api.get('/pantry').then(r => r.data) })
  const { data: historyData } = useQuery({ queryKey: ['mealHistory'],  queryFn: () => api.get('/mealhistory').then(r => r.data) })
  const { data: mealPlan }    = useQuery({ queryKey: ['mealplan'],     queryFn: () => api.get('/mealplan').then(r => r.data) })

  const pantryItems  = pantryData?.items || []
  const recentMeals  = historyData?.slice(0, 3) || []

  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const expiringItems = pantryItems.filter(i => i.expiresAt && new Date(i.expiresAt) <= soon && new Date(i.expiresAt) >= new Date())
  const todayPlan = mealPlan?.days?.[todayKey]

  const handleIntent = (intentId) => { setIntent(intentId); navigate('/suggest') }

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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Good {greeting}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-gray-500 mb-5">What are we cooking today?</p>

        {expiringItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring soon!</p>
              <p className="text-sm text-amber-700 mt-0.5">{expiringItems.map(i => i.name).join(', ')}</p>
              <button onClick={() => { setIntent('quick'); navigate('/suggest') }} className="mt-2 text-xs font-semibold text-amber-700 underline">
                Find recipes using these →
              </button>
            </div>
          </div>
        )}

        {todayPlan?.recipeId && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate(`/recipe/${todayPlan.recipeId}`)}>
            <div className="flex items-center gap-3 p-4">
              {todayPlan.imageUrl && (
                <img src={todayPlan.imageUrl} alt={todayPlan.recipeTitle} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">📅 Today's Plan</p>
                <p className="font-bold text-gray-900 line-clamp-1">{todayPlan.recipeTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tap to view recipe →</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 mb-6">
          {INTENTS.map(({ id, title, sub, color }) => (
            <button key={id} onClick={() => handleIntent(id)}
              className={`bg-gradient-to-r ${color} border-2 rounded-2xl p-5 text-left hover:shadow-md transition-all active:scale-[0.98]`}>
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
            {pantryItems.length > 0 ? `${pantryItems.length} ingredient${pantryItems.length !== 1 ? 's' : ''} available` : 'No items yet. Add ingredients for better suggestions!'}
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
                        <Star key={i} className={`w-3.5 h-3.5 ${i < meal.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
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
