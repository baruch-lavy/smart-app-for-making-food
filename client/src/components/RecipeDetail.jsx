import React, { useState } from 'react'
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

  const { data: recipe, isLoading } = useQuery({ queryKey: ['recipe', id], queryFn: () => api.get(`/recipes/${id}`).then(r => r.data) })

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
          <span className={`text-sm rounded-full px-3 py-1 font-medium ${DIFF_COLOR[recipe.difficulty]}`}>{recipe.difficulty}</span>
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
                <span className={`flex-1 text-sm ${checked.includes(i) ? 'line-through text-gray-400' : 'text-gray-700'}`}>{ing.name}</span>
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
          <button onClick={() => navigate(`/cook/${recipe._id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
            <ChefHat className="w-5 h-5" /> Start Cooking!
          </button>
        </div>
      </div>
    </div>
  )
}
