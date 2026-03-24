import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Search, Plus, X, ShoppingCart, RefreshCw } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'
import RecipeCard from './ui/RecipeCard'
import SkeletonCard from './ui/SkeletonCard'
import { useToast } from './ui/Toast'

const INTENT_LABEL = { quick: '⚡ Quick & Easy', effort: '💪 Effort Mode', easy: '😌 Easy Mode' }
const INTENT_LABEL = {
  short: '⏱️ Short',
  medium: '🕒 Medium',
  long: '🍲 Long',
  easy: '😌 Easy',
  medium_diff: '🟡 Medium',
  hard: '🔥 Hard'
}
const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'easiest', label: 'Easiest' },
  { value: 'best-match', label: 'Best Match' },
]

function getRecipePath(recipe) {
  return recipe?.isGenerated ? `/recipe/generated/${recipe._id}` : `/recipe/${recipe._id}`
}

export default function RecipeSuggestions() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToast()
  const selectedIntent = useAppStore(s => s.selectedIntent)
  // we now ask for a single main ingredient (string)
  const selectedIngredients = useAppStore(s => s.selectedIngredients)
  const toggleIngredient = useAppStore(s => s.toggleIngredient)

  const [customIngredient, setCustomIngredient] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeTab, setActiveTab] = useState('ai')
  const [mainIngredient, setMainIngredient] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [sideSuggestion, setSideSuggestion] = useState(null)
  const [responseMeta, setResponseMeta] = useState(null)
  const [sortBy, setSortBy] = useState('recommended')
  const [filters, setFilters] = useState({
    easyOnly: false,
    under30: false,
    kidFriendly: false,
    hasImage: false,
  })
  const [addedRecipes, setAddedRecipes] = useState({})
  const [favorites, setFavorites] = useState(new Set())

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.get('/pantry').then(r => r.data) })
  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/profile').then(r => r.data) })
  const pantryItems = pantryData?.items || []

  React.useEffect(() => {
    if (profileData?.favorites) setFavorites(new Set(profileData.favorites.map(f => f._id || f)))
  }, [profileData])

  const suggestMutation = useMutation({
    mutationFn: (data) => api.post('/recipes/suggest', data).then(r => r.data),
    onSuccess: (data) => { setSuggestions(data); setActiveTab('ai') }
  })

  const searchMutation = useMutation({
    mutationFn: (q) => api.get(`/recipes/search?q=${encodeURIComponent(q)}`).then(r => r.data),
    onSuccess: (data) => { setSearchResults(data); setActiveTab('search') }
  })

  const importMutation = useMutation({
    mutationFn: ({ id, isSpoonacular }) => {
      const endpoint = isSpoonacular ? `/recipes/spoonacular/${id}` : `/recipes/mealdb/${id}`
      return api.get(endpoint).then(r => r.data)
    },
    onSuccess: (recipe) => navigate(`/recipe/${recipe._id}`)
    onSuccess: (data) => {
      // server now returns { mains: [...], side: {...} }
      setSuggestions(data.mains || [])
      setSideSuggestion(data.side || null)
      setResponseMeta({
        mode: data.mode,
        metadata: data.metadata || null,
        sources: data.sources || [],
      })
    }
  })

  const handleSuggest = () => {
    // translate time option to maxTime in minutes
    let maxTime = undefined
    if (selectedIntent?.time === 'short') maxTime = 25
    else if (selectedIntent?.time === 'medium') maxTime = 45
    else if (selectedIntent?.time === 'long') maxTime = 10000

    const difficulty = selectedIntent?.difficulty

    const childrenMode = useAppStore.getState().childrenMode
    mutation.mutate({ intent: selectedIntent, availableIngredients: selectedIngredients, maxTime, difficulty, mainIngredient: mainIngredient?.trim() || undefined, childrenMode })
  }

  const getMatchPercent = (recipe) => {
    if (recipe?.metrics?.matchPercent !== undefined) return recipe.metrics.matchPercent || null
    if (!selectedIngredients.length) return null
    const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase())
    const matches = recipeIngs.filter(ri => selectedIngredients.some(si => ri.includes(si.toLowerCase()) || si.toLowerCase().includes(ri)))
    return Math.round((matches.length / recipeIngs.length) * 100)
  }

  const toggleFilter = (key) => setFilters(current => ({ ...current, [key]: !current[key] }))

  const filteredSuggestions = [...suggestions]
    .filter(recipe => !filters.easyOnly || recipe.difficulty === 'easy')
    .filter(recipe => !filters.under30 || (recipe.metrics?.totalTime || (recipe.prepTime + recipe.cookingTime)) <= 30)
    .filter(recipe => !filters.kidFriendly || (recipe.tags || []).some(tag => ['kid-friendly', 'family', 'kids'].includes(String(tag).toLowerCase())))
    .filter(recipe => !filters.hasImage || recipe.metrics?.hasImage || recipe.imageUrl || recipe.sourceImageUrl)
    .sort((left, right) => {
      if (sortBy === 'popular') return (right.metrics?.popularityScore || 0) - (left.metrics?.popularityScore || 0)
      if (sortBy === 'fastest') return (left.metrics?.totalTime || 0) - (right.metrics?.totalTime || 0)
      if (sortBy === 'easiest') {
        const difficultyDelta = (left.metrics?.difficultyRank || 99) - (right.metrics?.difficultyRank || 99)
        return difficultyDelta !== 0 ? difficultyDelta : (left.metrics?.totalTime || 0) - (right.metrics?.totalTime || 0)
      }
      if (sortBy === 'best-match') {
        const matchDelta = (right.metrics?.matchPercent || 0) - (left.metrics?.matchPercent || 0)
        return matchDelta !== 0 ? matchDelta : (right.metrics?.popularityScore || 0) - (left.metrics?.popularityScore || 0)
      }
      return (left.metrics?.recommendedRank || 999) - (right.metrics?.recommendedRank || 999)
    })

  const hasActiveFilters = Object.values(filters).some(Boolean)
  const resultLabel = SORT_OPTIONS.find(option => option.value === sortBy)?.label || 'Recommended'

  const addToShoppingMutation = useMutation({
    mutationFn: (recipeId) => api.post(`/shopping/from-recipe/${recipeId}`).then(r => r.data),
    onSuccess: (data, recipeId) => {
      qc.invalidateQueries(['shopping'])
      setAddedRecipes(prev => ({ ...prev, [recipeId]: data }))
      addToast(`${data.added} items added to shopping list`)
    }
  })

  const favoriteMutation = useMutation({
    mutationFn: (recipeId) => {
      if (favorites.has(recipeId)) return api.delete(`/users/favorites/${recipeId}`).then(r => r.data)
      return api.post(`/users/favorites/${recipeId}`).then(r => r.data)
    },
    onSuccess: (_, recipeId) => {
      setFavorites(prev => {
        const next = new Set(prev)
        if (next.has(recipeId)) { next.delete(recipeId); addToast('Removed from favorites', 'info') }
        else { next.add(recipeId); addToast('Added to favorites ❤️') }
        return next
      })
      qc.invalidateQueries(['profile'])
    }
  })

  const addCustom = () => {
    const trimmed = customIngredient.trim()
    if (trimmed && !selectedIngredients.includes(trimmed)) toggleIngredient(trimmed)
    setCustomIngredient('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim().length < 2) return
    searchMutation.mutate(searchQuery.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Find Your Recipe</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search real recipes (e.g. pasta, chicken...)"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" disabled={searchMutation.isPending}
            className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:opacity-60">
            {searchMutation.isPending ? '...' : 'Search'}
          </button>
        </form>

        {suggestions.length > 0 && searchResults.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('ai')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              🤖 Smart Suggestions
            </button>
            <button onClick={() => setActiveTab('search')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              🌍 Search Results
            </button>
          </div>
        )}

        {activeTab === 'ai' && (
          <>
            {selectedIntent && (
              <div className="inline-flex items-center gap-2 bg-orange-100 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                {INTENT_LABEL[selectedIntent]}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">🥕 Select Your Ingredients</h3>
              {pantryItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {pantryItems.map(item => (
                    <button key={item._id} onClick={() => toggleIngredient(item.name)}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${selectedIngredients.includes(item.name) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={customIngredient} onChange={e => setCustomIngredient(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                  placeholder="Add custom ingredient..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                <button onClick={addCustom} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark"><Plus className="w-5 h-5" /></button>
              </div>
              {selectedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedIngredients.map(ing => (
                    <span key={ing} className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-primary rounded-full text-sm">
                      {ing}<button onClick={() => toggleIngredient(ing)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setAddedRecipes({}); suggestMutation.mutate({ intent: selectedIntent, availableIngredients: selectedIngredients }) }}
              disabled={suggestMutation.isPending}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60 mb-6">
              <Search className="w-5 h-5" />
              {suggestMutation.isPending ? 'Finding recipes...' : '🤖 Get AI Suggestions'}
            </button>

            {suggestMutation.isPending && (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">✨ Suggested for You</h3>
                {suggestions.map(recipe => {
                  const addResult = addedRecipes[recipe._id]
                  return (
                    <div key={recipe._id}>
                      <RecipeCard
                        recipe={recipe}
                        onFavorite={(id) => favoriteMutation.mutate(id)}
                        isFavorite={favorites.has(recipe._id)}
                      />
                      {recipe.substitutions?.length > 0 && (
                        <div className="bg-blue-50 rounded-xl p-3 mt-1 mx-0.5">
                          <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1">
                            <RefreshCw className="w-3 h-3" /> Substitutions available
        <div className="rounded-[28px] border border-orange-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,244,230,0.95),_rgba(255,255,255,1)_55%),linear-gradient(135deg,#fffaf5_0%,#fff2e8_55%,#fffdf8_100%)] p-5 mb-5 shadow-sm overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-orange-200/30 blur-2xl" />
          <div className="absolute -left-10 bottom-0 w-24 h-24 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary border border-orange-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Smart recipe discovery
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Find a recipe built around what you already have.</h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">The app can search the web for inspiration, generate a tailored version, and keep children mode safer and simpler.</p>
          </div>
        </div>

        {selectedIntent && (
          <div className="inline-flex items-center gap-2 bg-orange-100 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            {selectedIntent.time && INTENT_LABEL[selectedIntent.time]}
            {selectedIntent.difficulty && <span className="px-2">•</span>}
            {selectedIntent.difficulty && INTENT_LABEL[selectedIntent.difficulty]}
          </div>
        )}

        {responseMeta?.metadata?.warnings?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 font-semibold text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              {responseMeta.mode === 'generated' ? 'Recipe generation notes' : 'Fallback notes'}
            </div>
            <div className="space-y-1 text-sm">
              {responseMeta.metadata.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">🥕 What main ingredient do you want to use today?</h3>
          <p className="text-sm text-gray-500 mb-3">Type the main material (e.g., chicken, potatoes, tofu). We'll prioritize recipes that feature it.</p>
          <div className="flex gap-2 mb-3">
            <input value={mainIngredient} onChange={e => setMainIngredient(e.target.value)}
              placeholder="Main ingredient (e.g., chicken)"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            <button onClick={() => setMainIngredient('')} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="text-sm text-gray-500">You can also toggle pantry items below to include them as extras.</div>
          {pantryItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {pantryItems.map(item => (
                <button key={item._id} onClick={() => toggleIngredient(item.name)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${selectedIngredients.includes(item.name) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {item.name}
                </button>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">✨ Recipe ideas</h3>
                <p className="text-sm text-gray-500 mt-1">Showing {filteredSuggestions.length} of {suggestions.length} recipes sorted by {resultLabel}.</p>
              </div>
              {responseMeta?.mode === 'generated' && (
                <div className="inline-flex items-center gap-1 bg-orange-100 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> AI + web inspired
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">Sort recipes</p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${sortBy === option.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">Filter recipes</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['easyOnly', 'Easy only'],
                    ['under30', 'Under 30 min'],
                    ['kidFriendly', 'Kid-friendly'],
                    ['hasImage', 'Has image'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filters[key] ? 'bg-orange-100 text-primary border-orange-200' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredSuggestions.map(recipe => {
              const match = getMatchPercent(recipe)
              return (
                <div key={recipe._id} className="bg-white rounded-[28px] border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                  {(recipe.imageUrl || recipe.sourceImageUrl) && (
                    <img
                      src={recipe.imageUrl || recipe.sourceImageUrl}
                      alt={recipe.title}
                      className="w-full h-52 object-cover rounded-2xl mb-4 border border-gray-100"
                    />
                  )}
            <h3 className="font-bold text-gray-900">✨ Suggested for You</h3>
            {suggestions.map(recipe => {
              const addResult = addedRecipes[recipe._id]
              const isAdded = !!addResult
              const isAdding = addToShoppingMutation.isPending && addToShoppingMutation.variables === recipe._id

              return (
                <div key={recipe._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{recipe.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-orange-100 text-primary rounded-full px-2 py-0.5">{recipe.cuisine}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${DIFF_COLOR[recipe.difficulty]}`}>{recipe.difficulty}</span>
                        {recipe.source?.siteName && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{recipe.source.siteName}</span>}
                      </div>
                    </div>
                    {recipe.matchPercent !== null && recipe.matchPercent !== undefined && (
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${recipe.matchPercent >= 80 ? 'text-green-600' : recipe.matchPercent >= 50 ? 'text-primary' : 'text-gray-400'}`}>
                          {recipe.matchPercent}%
                        </div>
                        <div className="text-xs text-gray-400">match</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.metrics?.totalTime || (recipe.prepTime + recipe.cookingTime)} min total</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">Popularity {recipe.metrics?.popularityScore || 0}</span>
                    {recipe.metrics?.averageRating > 0 && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">Rating {recipe.metrics.averageRating.toFixed(1)}</span>}
                    {recipe.metrics?.cookCount > 0 && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">Cooked {recipe.metrics.cookCount}x</span>}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                  {recipe.ingredients?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                        <span key={`${recipe._id}-ingredient-${index}`} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                          {ingredient.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400">{recipe.steps?.length || 0} guided steps</div>
                    <button onClick={() => navigate(getRecipePath(recipe), { state: { recipe } })}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-4 py-2 font-medium text-sm hover:gap-2 transition-all">
                      View Recipe <ChevronRight className="w-4 h-4" />
                    </button>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>

                  {/* Missing ingredients */}
                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-600">
                          Missing {recipe.missingIngredients.length} ingredient{recipe.missingIngredients.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recipe.missingIngredients.map((ing, i) => (
                          <span key={i} className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                            {ing.name}{ing.amount ? ` (${ing.amount}${ing.unit ? ' ' + ing.unit : ''})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Substitutions */}
                  {recipe.substitutions && recipe.substitutions.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-600">Substitutions available</span>
                      </div>
                      <div className="space-y-0.5">
                        {recipe.substitutions.map((s, i) => (
                          <p key={i} className="text-xs text-blue-700">
                            No <strong>{s.ingredient}</strong>? Use <strong>{s.substitute}</strong>
                          </p>
                          {recipe.substitutions.map((s, i) => (
                            <p key={i} className="text-xs text-blue-700">No <b>{s.ingredient}</b>? Use <b>{s.substitute}</b></p>
                          ))}
                        </div>
                      )}
                      {recipe.missingIngredients?.length > 0 && (
                        <div className="flex items-center justify-end mt-1 px-0.5">
                          {addResult ? (
                            <span className="text-xs text-green-600 font-medium">
                              ✅ {addResult.added} added{addResult.skipped > 0 ? `, ${addResult.skipped} already there` : ''}
                            </span>
                          ) : (
                            <button onClick={() => addToShoppingMutation.mutate(recipe._id)}
                              disabled={addToShoppingMutation.isPending}
                              className="flex items-center gap-1 text-xs bg-orange-100 text-primary rounded-xl px-3 py-1.5 font-semibold hover:bg-orange-200 transition-colors">
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Add {recipe.missingIngredients.length} missing to list
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {suggestMutation.isSuccess && suggestions.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <p className="text-4xl mb-3">🤔</p>
                <p className="font-medium">No recipes match your criteria.</p>
                <p className="text-sm mt-1">Try different ingredients or search for a specific recipe above.</p>
              </div>
            )}
          </>
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                      isAdded ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          ✅ {addResult.added} item{addResult.added !== 1 ? 's' : ''} added to list
                          {addResult.skipped > 0 && <span className="text-gray-400"> ({addResult.skipped} already there)</span>}
                        </span>
                      ) : (
                        <button
                          onClick={() => addToShoppingMutation.mutate(recipe._id)}
                          disabled={isAdding}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-primary rounded-xl text-xs font-semibold hover:bg-orange-200 transition-colors disabled:opacity-50">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {isAdding ? 'Adding...' : `🛒 Add ${recipe.missingIngredients.length} missing`}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}

            {filteredSuggestions.length === 0 && hasActiveFilters && (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-200">
                <p className="font-medium">No recipes match the selected filters.</p>
                <p className="text-sm mt-1">Try clearing one or more filters.</p>
              </div>
            )}

            {sideSuggestion && (
              <div className="bg-white rounded-[28px] border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900">🍟 Suggested side</h3>
                {(sideSuggestion.imageUrl || sideSuggestion.sourceImageUrl) && (
                  <img
                    src={sideSuggestion.imageUrl || sideSuggestion.sourceImageUrl}
                    alt={sideSuggestion.title}
                    className="w-full h-40 object-cover rounded-xl my-3 border border-gray-100"
                  />
                )}
                <div className="mt-3">
                  <h4 className="font-semibold">{sideSuggestion.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{sideSuggestion.description}</p>
                  <button onClick={() => navigate(getRecipePath(sideSuggestion), { state: { recipe: sideSuggestion } })} className="mt-3 text-primary font-medium">View side →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <>
            {searchMutation.isPending && (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">🌍 Results for "{searchQuery}"</h3>
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((recipe, i) => (
                    <RecipeCard
                      key={recipe.mealdbId || recipe.spoonacularId || i}
                      recipe={recipe}
                      onImport={(id, isSpoonacular) => importMutation.mutate({ id, isSpoonacular })}
                      showMissing={false}
                    />
                  ))}
                </div>
              </div>
            )}
            {searchMutation.isSuccess && searchResults.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium">No recipes found for "{searchQuery}".</p>
                <p className="text-sm mt-1">Try a different search term.</p>
              </div>
            )}
          </>
        )}

        {responseMeta?.sources?.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Sources used</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {responseMeta.sources.slice(0, 4).map((source, index) => (
                <div key={`${source?.url || index}`}>
                  {source?.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-primary font-medium">
                      {source.title || source.siteName || source.url}
                    </a>
                  ) : (
                    <span>{source?.title || source?.siteName || 'Source'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
