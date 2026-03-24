import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, CheckSquare, Square, AlertCircle, Heart, Minus, Plus, ExternalLink } from 'lucide-react'
import api from '../services/api'
import { useToast } from './ui/Toast'
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, CheckSquare, Square, Sparkles } from 'lucide-react'
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, CheckSquare, Square, AlertCircle } from 'lucide-react'
import api from '../services/api'
import useAppStore from '../store/useAppStore'

const DIFF_COLOR = { easy: 'text-green-700 bg-green-100', medium: 'text-yellow-700 bg-yellow-100', hard: 'text-red-700 bg-red-100' }

export default function RecipeDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [checked, setChecked] = useState([])
  const childrenMode = useAppStore(s => s.childrenMode)
  const [stepImages, setStepImages] = useState({})
  const isGenerated = location.pathname.includes('/recipe/generated/')
  const routeRecipe = location.state?.recipe
  const [addResult, setAddResult] = useState(null)
  const [servings, setServings] = useState(null)

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', isGenerated ? `generated:${id}` : id],
    queryFn: () => api.get(isGenerated ? `/recipes/generated/${id}` : `/recipes/${id}`).then(r => r.data),
    initialData: routeRecipe,
  })

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/profile').then(r => r.data) })

  const shoppingMutation = useMutation({
    mutationFn: (items) => api.post('/shopping/bulk-add', { items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); alert('Added to shopping list!') }
  const { data: missingData } = useQuery({
    queryKey: ['missing', id],
    queryFn: () => api.get(`/shopping/missing/${id}`).then(r => r.data),
    enabled: !!id,
  })

  // Initialize servings when recipe loads
  React.useEffect(() => {
    if (recipe && servings === null) setServings(recipe.servings)
  }, [recipe])

  const isFavorite = profileData?.favorites?.includes(id) || false

  const addFavMutation = useMutation({
    mutationFn: () => api.post(`/users/favorites/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['profile']); addToast('Added to favorites! ❤️') }
  })

  const removeFavMutation = useMutation({
    mutationFn: () => api.delete(`/users/favorites/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['profile']); addToast('Removed from favorites', 'info') }
  })

  const toggleFavorite = () => {
    if (isFavorite) removeFavMutation.mutate()
    else addFavMutation.mutate()
  }

  // Smart add: only missing from pantry
  const smartAddMutation = useMutation({
    mutationFn: () => api.post(`/shopping/from-recipe/${id}`).then(r => r.data),
    onSuccess: (data) => { qc.invalidateQueries(['shopping']); setAddResult(data) }
  })

  // Manual add: unchecked items (original behaviour)
  const manualAddMutation = useMutation({
    mutationFn: (items) => Promise.all(items.map(ing => api.post('/shopping/add', { name: ing.name, quantity: ing.amount, unit: ing.unit, recipeSource: recipe?.title }))),
    onSuccess: () => { qc.invalidateQueries(['shopping']); addToast('Added to shopping list!') }
  })

  const toggleCheck = (idx) => setChecked(c => c.includes(idx) ? c.filter(i => i !== idx) : [...c, idx])

  const addUncheckedToShopping = () => {
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

  const currentServings = servings ?? recipe.servings
  const scaleFactor = currentServings / recipe.servings
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
  const missingCount = missingData?.missing?.length ?? 0

  const formatAmount = (amount) => {
    if (!amount) return amount
    const scaled = amount * scaleFactor
    if (Number.isInteger(scaled)) return String(scaled)
    return scaled.toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{recipe.title}</h1>
          <button
            onClick={toggleFavorite}
            disabled={addFavMutation.isPending || removeFavMutation.isPending}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </header>

      {recipe.imageUrl && (
        <div className="max-w-2xl mx-auto">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-56 object-cover" />
        </div>
      )}

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
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-gray-500">Serves</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(s => Math.max(1, (s ?? recipe.servings) - 1))}
                  className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{currentServings}</span>
                <button
                  onClick={() => setServings(s => (s ?? recipe.servings) + 1)}
                  className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
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

        {/* Missing ingredients banner */}
        {missingData && missingCount > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                {missingCount} missing ingredient{missingCount > 1 ? 's' : ''} from your pantry
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {missingData.missing.map((ing, i) => (
                <span key={i} className="text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-1">
                  {ing.name}{ing.amount ? ` · ${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : ''}
                </span>
              ))}
            </div>
            {addResult ? (
              <p className="text-sm text-green-600 font-medium">
                ✅ {addResult.added} item{addResult.added !== 1 ? 's' : ''} added to your shopping list
                {addResult.skipped > 0 && <span className="text-gray-400"> ({addResult.skipped} already there)</span>}
              </p>
            ) : (
              <button
                onClick={() => smartAddMutation.mutate()}
                disabled={smartAddMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                <ShoppingCart className="w-4 h-4" />
                {smartAddMutation.isPending ? 'Adding...' : `Add all ${missingCount} to Shopping List`}
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h3 className="font-bold text-gray-900 mb-4">🧺 Ingredients</h3>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const isMissing = missingData?.missing?.some(m => m.name.toLowerCase() === ing.name.toLowerCase())
              return (
                <button key={i} onClick={() => toggleCheck(i)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left">
                  {checked.includes(i) ? <CheckSquare className="w-5 h-5 text-primary flex-shrink-0" /> : <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                  <span className={`flex-1 text-sm ${checked.includes(i) ? 'line-through text-gray-400' : isMissing ? 'text-red-600' : 'text-gray-700'}`}>
                    {ing.name}
                    {isMissing && <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">missing</span>}
                  </span>
                  <span className="text-sm font-medium text-primary">{formatAmount(ing.amount)} {ing.unit}</span>
                </button>
              )
            })}
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
          <button onClick={addUncheckedToShopping}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-orange-50 transition-colors">
            <ShoppingCart className="w-5 h-5" /> Add Unchecked
          </button>
          <button onClick={() => navigate(recipe.isGenerated ? `/cook/generated/${recipe._id}` : `/cook/${recipe._id}`, { state: { recipe } })}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
            <ChefHat className="w-5 h-5" /> Start Cooking!
          </button>
        </div>

        {recipe.sourceUrl && (
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors py-2">
            <ExternalLink className="w-4 h-4" />
            View original recipe on {recipe.sourceName || new URL(recipe.sourceUrl).hostname}
          </a>
        )}
      </div>
    </div>
  )
}
