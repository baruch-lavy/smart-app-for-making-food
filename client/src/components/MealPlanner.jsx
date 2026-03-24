import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, X, Search, ChefHat, Package, ShoppingCart, User, Calendar } from 'lucide-react'
import api from '../services/api'
import { useToast } from './ui/Toast'

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

function getDateForDay(dayKey) {
  const today = new Date()
  const todayIdx = today.getDay() // 0=Sun,1=Mon,...
  const dayIdx = DAY_KEYS.indexOf(dayKey) // 0=Mon,...
  // Convert to 0=Sun scale: Mon=1,...,Sun=0
  const targetDay = (dayIdx + 1) % 7
  const diff = targetDay - todayIdx
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d
}

function isTodayKey(dayKey) {
  const today = new Date()
  const todayIdx = today.getDay()
  const dayIdx = DAY_KEYS.indexOf(dayKey)
  const targetDay = (dayIdx + 1) % 7
  return targetDay === todayIdx
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/planner" className="flex flex-col items-center gap-1 text-primary"><Calendar className="w-5 h-5" /><span className="text-xs">Planner</span></Link>
      <Link to="/shopping" className="flex flex-col items-center gap-1 text-gray-400"><ShoppingCart className="w-5 h-5" /><span className="text-xs">Shopping</span></Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400"><User className="w-5 h-5" /><span className="text-xs">Profile</span></Link>
    </nav>
  )
}

export default function MealPlanner() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToast()

  const [pickerDay, setPickerDay] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const { data: mealPlan, isLoading } = useQuery({
    queryKey: ['mealplan'],
    queryFn: () => api.get('/mealplan').then(r => r.data),
  })

  const setPlanMutation = useMutation({
    mutationFn: ({ day, recipeId, recipeTitle, imageUrl }) =>
      api.put(`/mealplan/${day}`, { recipeId, recipeTitle, imageUrl }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['mealplan'])
      addToast('Meal planned! 📅')
      setPickerDay(null)
      setSearchQuery('')
      setSearchResults([])
    },
    onError: () => addToast('Failed to update plan', 'error'),
  })

  const clearPlanMutation = useMutation({
    mutationFn: (day) => api.delete(`/mealplan/${day}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['mealplan']); addToast('Day cleared', 'info') },
    onError: () => addToast('Failed to clear', 'error'),
  })

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await api.get(`/recipes?q=${encodeURIComponent(q)}`)
      setSearchResults(res.data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handlePickRecipe = (recipe) => {
    if (!pickerDay) return
    setPlanMutation.mutate({
      day: pickerDay,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      imageUrl: recipe.imageUrl || '',
    })
  }

  const days = mealPlan?.days || {}

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">📅 Weekly Meal Planner</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading planner...</div>
        ) : (
          DAY_KEYS.map(day => {
            const planned = days[day]
            const isToday = isTodayKey(day)
            const date = getDateForDay(day)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <div
                key={day}
                className={`bg-white rounded-2xl border-2 transition-all ${isToday ? 'border-primary shadow-md shadow-orange-100' : 'border-gray-100'}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`flex-shrink-0 text-center w-12 ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                    <div className="text-xs font-semibold uppercase tracking-wide">{DAY_LABELS[day]}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-gray-400'}`}>{dateStr}</div>
                    {isToday && <div className="text-xs text-primary font-medium mt-0.5">Today</div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    {planned?.recipeId ? (
                      <button
                        onClick={() => navigate(`/recipe/${planned.recipeId}`)}
                        className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                      >
                        {planned.imageUrl ? (
                          <img src={planned.imageUrl} alt={planned.recipeTitle}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <ChefHat className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">{planned.recipeTitle}</span>
                      </button>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Nothing planned</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {planned?.recipeId && (
                      <button
                        onClick={() => clearPlanMutation.mutate(day)}
                        disabled={clearPlanMutation.isPending}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { setPickerDay(day); setSearchQuery(''); setSearchResults([]) }}
                      className={`p-2 rounded-xl transition-colors ${planned?.recipeId ? 'hover:bg-gray-100 text-gray-400' : 'bg-primary text-white hover:bg-primary-dark'}`}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Recipe Picker Modal */}
      {pickerDay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPickerDay(null)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pick a Recipe</h2>
                <p className="text-sm text-gray-500 capitalize">for {pickerDay}</p>
              </div>
              <button onClick={() => setPickerDay(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search recipes..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-900 placeholder-gray-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {searching && (
                <div className="text-center py-6 text-gray-400 text-sm">Searching...</div>
              )}
              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No recipes found</div>
              )}
              {!searching && !searchQuery && (
                <div className="text-center py-6 text-gray-400 text-sm">Type to search for a recipe</div>
              )}
              {searchResults.map(recipe => (
                <button
                  key={recipe._id}
                  onClick={() => handlePickRecipe(recipe)}
                  disabled={setPlanMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                >
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{recipe.title}</p>
                    {recipe.cuisine && <p className="text-xs text-gray-400 mt-0.5">{recipe.cuisine}</p>}
                  </div>
                  <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
