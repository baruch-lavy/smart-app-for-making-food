import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChefHat, Package, ShoppingCart, User, LogOut, ToggleLeft, ToggleRight, Save, Calendar } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const CUISINES = ['Italian','Asian','Mexican','Mediterranean','American','Indian','Japanese','Greek','French','Thai']
const DIETARY = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Halal','Kosher']
const DISLIKES_LIST = ['Cilantro','Mushrooms','Onions','Garlic','Spicy Food','Seafood','Red Meat','Eggs']
const LEVEL_COLOR = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-orange-100 text-orange-700', advanced: 'bg-purple-100 text-purple-700' }

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
      {label}
    </button>
  )
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400"><ChefHat className="w-5 h-5" /><span className="text-xs">Home</span></Link>
      <Link to="/pantry" className="flex flex-col items-center gap-1 text-gray-400"><Package className="w-5 h-5" /><span className="text-xs">Pantry</span></Link>
      <Link to="/planner" className="flex flex-col items-center gap-1 text-gray-400"><Calendar className="w-5 h-5" /><span className="text-xs">Planner</span></Link>
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
  const { data: favoritesData } = useQuery({ queryKey: ['favorites'], queryFn: () => api.get('/users/favorites').then(r => r.data) })

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
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${LEVEL_COLOR[profile.cookingLevel] || 'bg-gray-100 text-gray-700'}`}>
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

        {/* Favorites Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">❤️ My Favorites</h3>
          {!favoritesData || favoritesData.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-gray-500 text-sm">No favorites yet. Heart a recipe to save it here!</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {favoritesData.map(r => (
                <button key={r._id} onClick={() => navigate(`/recipe/${r._id}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 hover:opacity-80 transition-opacity">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.title} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <span className="text-xs text-gray-700 font-medium text-center leading-tight line-clamp-2 w-full">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition This Week */}
        {historyData && historyData.length > 0 && (() => {
          const last7 = historyData.slice(0, 7).filter(m => m.recipeId?.nutritionInfo?.calories)
          if (last7.length === 0) return null
          const maxCal = Math.max(...last7.map(m => m.recipeId.nutritionInfo.calories))
          const avgCal = Math.round(last7.reduce((sum, m) => sum + m.recipeId.nutritionInfo.calories, 0) / last7.length)
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">📊 Nutrition This Week</h3>
              <div className="flex items-end gap-2 h-24 mb-2">
                {last7.map((m, i) => {
                  const cal = m.recipeId.nutritionInfo.calories
                  const barH = Math.round((cal / maxCal) * 80)
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-end justify-center w-full" style={{ height: '80px' }}>
                        <div
                          className="bg-primary rounded-t-lg w-8 transition-all"
                          style={{ height: `${barH}px` }}
                          title={`${cal} kcal`}
                        />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{m.recipeTitle?.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-gray-500 text-center">Avg: <span className="font-semibold text-primary">{avgCal} kcal</span> per meal</p>
            </div>
          )
        })()}

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
