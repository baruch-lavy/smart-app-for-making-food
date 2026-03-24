import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Search, Clock, ChevronRight, Plus, X, ShoppingCart, AlertCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'

const INTENT_LABEL = { quick: '⚡ Quick & Easy', effort: '💪 Effort Mode', easy: '😌 Easy Mode' }
const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }

export default function RecipeSuggestions() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const selectedIntent = useAppStore(s => s.selectedIntent)
  const selectedIngredients = useAppStore(s => s.selectedIngredients)
  const toggleIngredient = useAppStore(s => s.toggleIngredient)
  const [customIngredient, setCustomIngredient] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [addedRecipes, setAddedRecipes] = useState({})

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.get('/pantry').then(r => r.data) })
  const pantryItems = pantryData?.items || []

  const mutation = useMutation({
    mutationFn: (data) => api.post('/recipes/suggest', data).then(r => r.data),
    onSuccess: (data) => setSuggestions(data)
  })

  const addToShoppingMutation = useMutation({
    mutationFn: (recipeId) => api.post(`/shopping/from-recipe/${recipeId}`).then(r => r.data),
    onSuccess: (data, recipeId) => {
      qc.invalidateQueries(['shopping'])
      setAddedRecipes(prev => ({ ...prev, [recipeId]: data }))
    }
  })

  const addCustom = () => {
    const trimmed = customIngredient.trim()
    if (trimmed && !selectedIngredients.includes(trimmed)) toggleIngredient(trimmed)
    setCustomIngredient('')
  }

  const handleSuggest = () => {
    setAddedRecipes({})
    mutation.mutate({ intent: selectedIntent, availableIngredients: selectedIngredients })
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
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${selectedIngredients.includes(item.name) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>
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
                    <span>{recipe.prepTime + recipe.cookingTime} min total</span>
                  </div>

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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <button onClick={() => navigate(`/recipe/${recipe._id}`)}
                      className="flex items-center gap-1 text-primary font-medium text-sm hover:gap-2 transition-all">
                      View Recipe <ChevronRight className="w-4 h-4" />
                    </button>

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
