import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, ShoppingCart, ChefHat } from 'lucide-react';
import api from '../services/api';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const MealPlanner = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [mealPlan, setMealPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('dinner');

  useEffect(() => {
    fetchMealPlan();
    fetchRecipes();
  }, [currentWeekStart]);

  const fetchMealPlan = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const response = await api.get('/mealplan/current');
      
      if (response.data && 
          new Date(response.data.weekStartDate) <= currentWeekStart && 
          new Date(response.data.weekEndDate) >= weekEnd) {
        setMealPlan(response.data);
      } else {
        const newPlan = await api.post('/mealplan/create', {
          weekStartDate: currentWeekStart,
          weekEndDate: weekEnd
        });
        setMealPlan(newPlan.data);
      }
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const addMealToPlan = async (recipeId, recipeTitle) => {
    try {
      await api.put(`/mealplan/${mealPlan._id}/add-meal`, {
        date: selectedDate,
        mealType: selectedMealType,
        recipeId,
        recipeTitle,
        servings: 2
      });
      fetchMealPlan();
      setShowAddMealModal(false);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const removeMeal = async (mealId) => {
    try {
      await api.delete(`/mealplan/${mealPlan._id}/meal/${mealId}`);
      fetchMealPlan();
    } catch (error) {
      console.error('Error removing meal:', error);
    }
  };

  const generateShoppingList = async () => {
    try {
      await api.post(`/mealplan/${mealPlan._id}/generate-shopping-list`);
      alert('✅ Shopping list generated successfully!');
    } catch (error) {
      console.error('Error generating shopping list:', error);
    }
  };

  const getMealsForDay = (dayIndex) => {
    if (!mealPlan) return {};
    
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    
    const mealsForDay = {};
    mealTypes.forEach(type => {
      mealsForDay[type] = mealPlan.plannedMeals?.find(
        m => new Date(m.date).toDateString() === date.toDateString() && m.mealType === type
      );
    });
    
    return mealsForDay;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flexJustifyBetweenItemsCenter mb-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              Weekly Meal Planner
            </h1>
            
            <button
              onClick={generateShoppingList}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              Generate Shopping List
            </button>
          </div>
          
          <div className="flexJustifyBetweenItemsCenter mb-6">
            <button
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              ← Previous Week
            </button>
            
            <span className="text-lg font-semibold text-gray-700">
              {currentWeekStart.toLocaleDateString()} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
            
            <button
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeekStart(newDate);
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Next Week →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const meals = getMealsForDay(dayIndex);
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + dayIndex);
            
            return (
              <div key={dayIndex} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-gray-800 mb-3 text-center">
                  {daysOfWeek[date.getDay()]}
                  <div className="text-xs text-gray-500">{date.toLocaleDateString()}</div>
                </h3>
                
                {mealTypes.map(type => (
                  <div key={type} className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      {type}
                    </div>
                    
                    {meals[type] ? (
                      <div className="bg-purple-50 p-2 rounded border border-purple-200 relative group">
                        <div className="text-sm font-medium text-gray-800 pr-6">
                          {meals[type].recipeTitle}
                        </div>
                        <button
                          onClick={() => removeMeal(meals[type]._id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedMealType(type);
                          setShowAddMealModal(true);
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 p-2 rounded border-2 border-dashed border-gray-300 transition"
                      >
                        <Plus className="w-4 h-4 mx-auto text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {showAddMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Select a Recipe</h2>
            
            <div className="space-y-2">
              {recipes.map(recipe => (
                <button
                  key={recipe._id}
                  onClick={() => addMealToPlan(recipe._id, recipe.title)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-purple-50 rounded-lg transition border border-gray-200"
                >
                  <div className="font-semibold text-gray-800">{recipe.title}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {(recipe.cookingTime || 0) + (recipe.prepTime || 0)} min
                    </span>
                    <span>{recipe.cuisine}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAddMealModal(false)}
              className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default MealPlanner;
