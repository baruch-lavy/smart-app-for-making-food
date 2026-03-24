import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, CheckSquare, Square, Sparkles } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'

const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }

export default function RecipeDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [checked, setChecked] = useState([])
  const childrenMode = useAppStore(s => s.childrenMode)
  const [stepImages, setStepImages] = useState({})
  const isGenerated = location.pathname.includes('/recipe/generated/')
  const routeRecipe = location.state?.recipe

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', isGenerated ? `generated:${id}` : id],
    queryFn: () => api.get(isGenerated ? `/recipes/generated/${id}` : `/recipes/${id}`).then(r => r.data),
    initialData: routeRecipe,
  })

  const shoppingMutation = useMutation({
    mutationFn: (items) => api.post('/shopping/bulk-add', { items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); alert('Added to shopping list!') }
  })

  const toggleCheck = (idx) => setChecked(c => c.includes(idx) ? c.filter(i => i !== idx) : [...c, idx])

  const addToShopping = () => {
    if (!recipe) return
    const missing = recipe.ingredients
      .filter((_, i) => !checked.includes(i))
      .map(ing => ({
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        recipeSource: recipe.title,
      }))

    if (missing.length === 0) return
    shoppingMutation.mutate(missing)
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading recipe...</div></div>
  if (!recipe) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Recipe not found</div></div>

  // fetch simple SVG illustrations for steps when childrenMode is on
  React.useEffect(() => {
    let mounted = true
    if (!childrenMode || !recipe?.steps) return
    const fetchAll = async () => {
      const imgs = {}
      for (let i = 0; i < recipe.steps.length; i++) {
        try {
          const res = await api.post('/illustrations', { prompt: recipe.steps[i].instruction, childrenMode })
          imgs[i] = res.data.imageUrl || res.data.dataUri
        } catch (err) {
          imgs[i] = null
        }
      }
      if (mounted) setStepImages(imgs)
    }
    fetchAll()
    return () => { mounted = false }
  }, [childrenMode, recipe])

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
          {recipe.isGenerated && (
            <span className="inline-flex items-center gap-1 text-sm bg-gray-900 text-white rounded-full px-3 py-1 font-medium">
              <Sparkles className="w-4 h-4" /> Generated
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h2>
        <p className="text-gray-600 mb-5">{recipe.description}</p>

        {(recipe.imageUrl || recipe.sourceImageUrl) && (
          <div className="relative mb-5 overflow-hidden rounded-[28px] border border-gray-200 shadow-sm">
            <img
              src={recipe.imageUrl || recipe.sourceImageUrl}
              alt={recipe.title}
              className="w-full h-72 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
              <div className="text-white text-lg font-bold">{recipe.title}</div>
              <div className="text-white/80 text-sm mt-1">{recipe.prepTime + recipe.cookingTime} minutes total</div>
            </div>
          </div>
        )}

        {recipe.source?.url && (
          <div className="bg-[linear-gradient(135deg,#fff7ed_0%,#fff 100%)] rounded-2xl border border-orange-200 p-4 mb-5 text-sm text-gray-600">
            Inspired by <a href={recipe.source.url} target="_blank" rel="noreferrer" className="text-primary font-medium">{recipe.source.title || recipe.source.siteName || recipe.source.url}</a>
            {recipe.source.siteName && <span className="text-gray-400"> from {recipe.source.siteName}</span>}
          </div>
        )}

        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {recipe.tags.slice(0, 6).map(tag => (
              <span key={tag} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

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
              <div key={i} className="flex gap-3 flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-gray-700 text-sm leading-relaxed pt-1">{step.instruction}</p>
                </div>
                {childrenMode && stepImages[i] && (
                  <img src={stepImages[i]} alt={`step-${i+1}`} className="w-full rounded-lg border mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={addToShopping}
            disabled={shoppingMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-orange-50 transition-colors">
            <ShoppingCart className="w-5 h-5" /> {shoppingMutation.isPending ? 'Adding...' : 'Add to Shopping List'}
          </button>
          <button onClick={() => navigate(recipe.isGenerated ? `/cook/generated/${recipe._id}` : `/cook/${recipe._id}`, { state: { recipe } })}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
            <ChefHat className="w-5 h-5" /> Start Cooking!
          </button>
        </div>
      </div>
    </div>
  )
}
