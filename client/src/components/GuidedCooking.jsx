import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, HelpCircle, Star, X } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import useAppStore from '../store/useAppStore'

export default function GuidedCooking() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const cookingStep = useAppStore(s => s.cookingStep)
  const nextStep = useAppStore(s => s.nextStep)
  const prevStep = useAppStore(s => s.prevStep)
  const stopCooking = useAppStore(s => s.stopCooking)
  const [showTip, setShowTip] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [notes, setNotes] = useState('')
  const [historyId, setHistoryId] = useState(null)
  const isGenerated = location.pathname.includes('/cook/generated/')
  const routeRecipe = location.state?.recipe

  // Timer state
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Swipe gesture ref
  const touchStartX = useRef(null)

  const { data: recipe, isLoading } = useQuery({ queryKey: ['recipe', id], queryFn: () => api.get(`/recipes/${id}`).then(r => r.data) })
  const { data: recipe, isLoading } = useQuery({
    queryKey: ['cook-recipe', isGenerated ? `generated:${id}` : id],
    queryFn: () => api.get(isGenerated ? `/recipes/generated/${id}` : `/recipes/${id}`).then(r => r.data),
    initialData: routeRecipe,
  })

  const logMutation = useMutation({
    mutationFn: (data) => api.post('/mealhistory', data).then(r => r.data),
    onSuccess: (data) => setHistoryId(data._id)
  })

  const rateMutation = useMutation({
    mutationFn: ({ histId, ...data }) => api.put(`/mealhistory/${histId}/rate`, data),
    onSuccess: () => { stopCooking(); navigate('/dashboard') }
  })

  // Reset timer when step changes
  useEffect(() => {
    setTimerOpen(false)
    setTimerActive(false)
    setTimerSeconds(0)
    setTimerMinutes(5)
  }, [cookingStep])

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) { clearInterval(interval); setTimerActive(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!recipe) return null

  const steps = recipe.steps || []
  const totalSteps = Math.max(steps.length, 1)
  const currentStepData = steps[cookingStep]
  const progress = ((cookingStep + 1) / totalSteps) * 100
  const recipeDetailPath = recipe?.isGenerated ? `/recipe/generated/${id}` : `/recipe/${id}`

  const handleNext = () => {
    if (cookingStep === totalSteps - 1) {
      logMutation.mutate(recipe.isGenerated ? { recipeTitle: recipe.title } : { recipeId: recipe._id, recipeTitle: recipe.title })
      setShowDone(true)
    } else {
      nextStep()
      setShowTip(false)
      setShowWhy(false)
    }
  }

  const handleSubmitRating = () => {
    if (!historyId) return
    rateMutation.mutate({ histId: historyId, rating, feedback, notes })
  }

  const startTimer = () => {
    setTimerSeconds(timerMinutes * 60)
    setTimerActive(true)
  }

  const formatTimerDisplay = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    if (delta > 0) {
      handleNext()
    } else {
      if (cookingStep > 0) { prevStep(); setShowTip(false); setShowWhy(false) }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3 border-b border-gray-800">
        <button onClick={() => { stopCooking(); navigate(recipeDetailPath, { state: { recipe } }) }} className="p-2 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold truncate">{recipe.title}</h1>
          <p className="text-xs text-gray-400">Step {cookingStep + 1} of {totalSteps}</p>
        </div>
      </header>

      <div className="h-1.5 bg-gray-800">
        <div className="h-full bg-primary transition-all duration-300 rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      <div
        className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1">
          <div className="text-6xl font-black text-gray-700 mb-4">{cookingStep + 1}</div>
          <p className="text-2xl font-medium leading-relaxed text-white mb-6">{currentStepData?.instruction}</p>

          {/* Step Timer */}
          <div className="mb-4">
            {!timerOpen ? (
              <button onClick={() => setTimerOpen(true)}
                className="flex items-center gap-2 text-sm text-blue-300 font-medium hover:text-blue-200 transition-colors">
                ⏱️ Set Timer
              </button>
            ) : (
              <div className="bg-gray-800 rounded-2xl p-4">
                {timerActive || timerSeconds > 0 ? (
                  <div className="text-center">
                    {timerSeconds === 0 ? (
                      <div className="text-2xl font-bold text-yellow-400 animate-pulse">⏰ Time's up!</div>
                    ) : (
                      <>
                        <div className="text-5xl font-black text-white mb-3 font-mono tracking-widest">{formatTimerDisplay(timerSeconds)}</div>
                        <button onClick={() => { setTimerActive(false); setTimerSeconds(0) }}
                          className="text-sm text-gray-400 hover:text-white transition-colors">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min="1" max="60" value={timerMinutes}
                      onChange={e => setTimerMinutes(Math.min(60, Math.max(1, Number(e.target.value))))}
                      className="w-20 px-3 py-2 bg-gray-700 text-white rounded-xl text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-gray-400 text-sm">min</span>
                    <button onClick={startTimer}
                      className="flex-1 py-2 bg-primary rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                      ▶ Start
                    </button>
                    <button onClick={() => setTimerOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentStepData?.whyItMatters && (
            <div className="mb-3">
              <button onClick={() => setShowWhy(v => !v)}
                className="flex items-center gap-2 text-sm text-orange-300 font-medium">
                <HelpCircle className="w-4 h-4" />
                {showWhy ? 'Hide' : 'Why does this matter?'}
              </button>
              {showWhy && <p className="mt-2 text-sm text-gray-300 bg-gray-800 rounded-xl p-4 leading-relaxed">{currentStepData.whyItMatters}</p>}
            </div>
          )}

          {user?.learningMode && currentStepData?.tip && (
            <div>
              <button onClick={() => setShowTip(v => !v)}
                className="flex items-center gap-2 text-sm text-yellow-300 font-medium">
                <Lightbulb className="w-4 h-4" />
                {showTip ? 'Hide' : '🎓 Pro Tip'}
              </button>
              {showTip && <p className="mt-2 text-sm text-gray-300 bg-gray-800 rounded-xl p-4 leading-relaxed">{currentStepData.tip}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={() => { prevStep(); setShowTip(false); setShowWhy(false) }} disabled={cookingStep === 0}
            className="flex items-center gap-2 px-6 py-4 bg-gray-800 rounded-2xl font-semibold disabled:opacity-30 hover:bg-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Prev
          </button>
          <button onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary rounded-2xl font-semibold hover:bg-primary-dark transition-colors text-lg">
            {cookingStep === totalSteps - 1 ? '✅ Done Cooking!' : <>Next <ChevronRight className="w-5 h-5" /></>}
          </button>
        </div>
      </div>

      {showDone && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">🎉 Great work!</h2>
              <button onClick={() => { stopCooking(); navigate('/dashboard') }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-gray-500 mb-4">How did it turn out?</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`w-9 h-9 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {[['loved', '❤️ Loved it'], ['ok', '👍 It was OK'], ['disliked', '👎 Didnt like']].map(([val, label]) => (
                <button key={val} onClick={() => setFeedback(val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${feedback === val ? 'border-primary bg-orange-50 text-primary' : 'border-gray-200 text-gray-600'}`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes? (optional)"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary mb-4" rows={2} />
            <button onClick={handleSubmitRating} disabled={!rating || !feedback || rateMutation.isPending}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-60 hover:bg-primary-dark transition-colors">
              {rateMutation.isPending ? 'Saving...' : 'Save & Finish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
