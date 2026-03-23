import { create } from 'zustand'

const useAppStore = create((set) => ({
  currentView: 'dashboard',
  selectedIntent: null,
  selectedIngredients: [],
  selectedRecipe: null,
  cookingStep: 0,
  cookingMode: false,
  setView: (view) => set({ currentView: view }),
  setIntent: (intent) => set({ selectedIntent: intent }),
  toggleIngredient: (ingredient) => set(state => ({
    selectedIngredients: state.selectedIngredients.includes(ingredient)
      ? state.selectedIngredients.filter(i => i !== ingredient)
      : [...state.selectedIngredients, ingredient]
  })),
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  nextStep: () => set(state => ({ cookingStep: state.cookingStep + 1 })),
  prevStep: () => set(state => ({ cookingStep: Math.max(0, state.cookingStep - 1) })),
  startCooking: () => set({ cookingMode: true, cookingStep: 0 }),
  stopCooking: () => set({ cookingMode: false, cookingStep: 0 })
}))

export default useAppStore
