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
      </div>
    </div>
  )
}
