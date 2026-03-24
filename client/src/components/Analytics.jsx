import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Calendar, Clock, Target, Flame } from 'lucide-react';
import api from '../services/api';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchWeeklyInsight();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/overview');
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const fetchWeeklyInsight = async () => {
    try {
      const response = await api.get('/analytics/weekly-insight');
      setWeeklyInsight(response.data);
    } catch (error) {
      console.error('Error fetching weekly insight:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Loading analytics...</div>
      </div>
    );
  }

  const overallStats = analytics?.overallStats || {};
  const wasteTracking = analytics?.wasteTracking || {};
  const healthTrends = analytics?.healthTrends || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-purple-600" />
          Your Cooking Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Flame className="w-8 h-8 text-orange-500" />}
            title="Total Meals Cooked"
            value={overallStats.totalMealsCookedAllTime || 0}
            bgColor="bg-orange-50"
          />
          
          <StatCard
            icon={<Target className="w-8 h-8 text-blue-500" />}
            title="Unique Recipes"
            value={overallStats.uniqueRecipesCooked || 0}
            bgColor="bg-blue-50"
          />
          
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            title="Current Streak"
            value={`${overallStats.currentStreak || 0} days`}
            bgColor="bg-green-50"
          />
          
          <StatCard
            icon={<Clock className="w-8 h-8 text-purple-500" />}
            title="Cooking Hours"
            value={`${overallStats.totalCookingHours || 0}h`}
            bgColor="bg-purple-50"
          />
        </div>

        {weeklyInsight && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              This Week's Highlights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {weeklyInsight.mealsCookedCount}
                </div>
                <div className="text-gray-700">Meals Cooked</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  ${weeklyInsight.moneySaved || 0}
                </div>
                <div className="text-gray-700">Money Saved</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {weeklyInsight.averageMealRating?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-gray-700">Avg Rating</div>
              </div>
            </div>
            
            {weeklyInsight.newCuisinesTried?.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold text-gray-700 mb-2">New Cuisines Explored:</div>
                <div className="flex flex-wrap gap-2">
                  {weeklyInsight.newCuisinesTried.map((cuisine, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Waste Tracking</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Items Expired</span>
                <span className="font-bold text-red-600">{wasteTracking.totalItemsExpired || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Waste Value</span>
                <span className="font-bold text-red-600">${wasteTracking.totalWasteValue || 0}</span>
              </div>
              
              {wasteTracking.wasteReductionRate && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-700 font-semibold">
                    🎉 {wasteTracking.wasteReductionRate}% waste reduction!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nutrition Overview</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Avg Daily Calories</span>
                <span className="font-bold text-blue-600">
                  {Math.round(healthTrends.averageDailyCalories || 0)} kcal
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Avg Daily Protein</span>
                <span className="font-bold text-green-600">
                  {Math.round(healthTrends.averageDailyProtein || 0)}g
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Avg Daily Carbs</span>
                <span className="font-bold text-orange-600">
                  {Math.round(healthTrends.averageDailyCarbs || 0)}g
                </span>
              </div>
            </div>
          </div>
        </div>

        {overallStats.cuisinesExplored?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cuisines Explored</h2>
            <div className="flex flex-wrap gap-3">
              {overallStats.cuisinesExplored.map((cuisine, idx) => (
                <span 
                  key={idx} 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor }) => (
  <div className={`${bgColor} rounded-xl shadow p-6`}>
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="text-sm font-semibold text-gray-700 uppercase">{title}</h3>
    </div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
  </div>
);

export default Analytics;
