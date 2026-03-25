import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Search, Plus, X, Clock } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'
import RecipeCard from './ui/RecipeCard'
import SkeletonCard from './ui/SkeletonCard'
import { useToast } from './ui/Toast'

const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'easiest', label: 'Easiest' },
  { value: 'best-match', label: 'Best Match' },
]

export default function RecipeSuggestions() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToast()
  const selectedIntent = useAppStore(s => s.selectedIntent)
  const selectedIngredients = useAppStore(s => s.selectedIngredients)
  const toggleIngredient = useAppStore(s => s.toggleIngredient)

  const [customIngredient, setCustomIngredient] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeTab, setActiveTab] = useState('ai')
  const [sortBy, setSortBy] = useState('recommended')
  const [filters, setFilters] = useState({ easyOnly: false, under30: false, hasImage: false })
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
    onSuccess: (data) => { setSuggestions(Array.isArray(data) ? data : data.mains || []); setActiveTab('ai') }
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
  })

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

  const toggleFilter = (key) => setFilters(f => ({ ...f, [key]: !f[key] }))

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

  const filteredSuggestions = [...suggestions]
    .filter(r => !filters.easyOnly || r.difficulty === 'easy')
    .filter(r => !filters.under30 || (r.prepTime + r.cookingTime) <= 30)
    .filter(r => !filters.hasImage || r.imageUrl)
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.metrics?.popularityScore || 0) - (a.metrics?.popularityScore || 0)
      if (sortBy === 'fastest') return (a.prepTime + a.cookingTime) - (b.prepTime + b.cookingTime)
      if (sortBy === 'easiest') {
        const diff = { easy: 0, medium: 1, hard: 2 }
        return (diff[a.difficulty] || 1) - (diff[b.difficulty] || 1)
      }
      if (sortBy === 'best-match') return (b.matchPercent || 0) - (a.matchPercent || 0)
      return 0
    })

  const displayList = activeTab === 'search' ? searchResults : filteredSuggestions

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
        {/* Internet Search */}
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

        {/* Tab switcher */}
        {suggestions.length > 0 && searchResults.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('ai')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              🤖 Smart Suggestions
            </button>
            <button onClick={() => setActiveTab('search')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              🌍 Search Results ({searchResults.length})
            </button>
          </div>
        )}

        {/* Search loading */}
        {searchMutation.isPending && (
          <div className="grid grid-cols-1 gap-4 mb-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* AI Suggestions tab */}
        {activeTab === 'ai' && (
          <>
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
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${sortBy === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {[['easyOnly', 'Easy only'], ['under30', 'Under 30 min'], ['hasImage', 'Has image']].map(([key, label]) => (
                    <button key={key} onClick={() => toggleFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filters[key] ? 'bg-orange-100 text-primary border-orange-200' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Recipe cards */}
        {importMutation.isPending && (
          <div className="text-center text-sm text-gray-400 py-3">Importing recipe...</div>
        )}

        {displayList.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">
              {activeTab === 'search' ? `🌍 ${searchResults.length} results from the web` : `✨ ${filteredSuggestions.length} Suggestions`}
            </h3>
            {displayList.map(recipe => {
              const addResult = addedRecipes[recipe._id]
              const isExternal = !recipe._id && (recipe.spoonacularId || recipe.mealdbId)
              return (
                <div key={recipe._id || recipe.spoonacularId || recipe.mealdbId}>
                  <RecipeCard
                    recipe={recipe}
                    onFavorite={recipe._id ? (id) => favoriteMutation.mutate(id) : undefined}
                    isFavorite={recipe._id ? favorites.has(recipe._id) : false}
                    onImport={isExternal ? (id, isSpoonacular) => importMutation.mutate({ id, isSpoonacular }) : undefined}
                    onClick={recipe._id ? () => navigate(`/recipe/${recipe._id}`) : undefined}
                  />
                  {recipe._id && (
                    <div className="mt-1 px-1">
                      {addResult ? (
                        <p className="text-xs text-green-600 font-medium px-2">✅ {addResult.added} items added to shopping list</p>
                      ) : (
                        <button
                          onClick={() => addToShoppingMutation.mutate(recipe._id)}
                          disabled={addToShoppingMutation.isPending}
                          className="text-xs text-gray-400 hover:text-primary px-2 py-1 transition-colors">
                          + Add ingredients to shopping list
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'ai' && suggestions.length === 0 && !suggestMutation.isPending && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="font-medium text-gray-600">Select ingredients and get smart recipe ideas</p>
            <p className="text-sm mt-1">Or search the web above for any recipe</p>
          </div>
        )}

        {activeTab === 'search' && searchResults.length === 0 && !searchMutation.isPending && searchQuery && (
          <div className="text-center py-8 text-gray-400">
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
