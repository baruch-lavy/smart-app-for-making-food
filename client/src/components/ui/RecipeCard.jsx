import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, Heart, ExternalLink } from "lucide-react";

const DIFF_COLOR = {
  easy: "text-green-700 bg-green-100",
  medium: "text-yellow-700 bg-yellow-100",
  hard: "text-red-700 bg-red-100",
};

const FOOD_FALLBACKS = [
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80",
];
function getFallbackImg(title) {
  const hash = (title || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return FOOD_FALLBACKS[hash % FOOD_FALLBACKS.length];
}

export default function RecipeCard({
  recipe,
  onAddToShopping,
  onFavorite,
  isFavorite = false,
  showMissing = true,
  onImport,
}) {
  const navigate = useNavigate();
  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookingTime || recipe.readyInMinutes || 0);
  const missing = recipe.missingIngredients?.length || 0;

  // Determine if this is an un-imported search result (has spoonacularId or mealdbId but no _id)
  const isExternalResult =
    !recipe._id && (recipe.spoonacularId || recipe.mealdbId);

  const handleClick = () => {
    if (onImport) {
      onImport(recipe.spoonacularId || recipe.mealdbId, !!recipe.spoonacularId);
    } else if (recipe._id) {
      navigate(`/recipe/${recipe._id}`);
    }
  };

  const source = recipe.sourceName || (recipe.mealdbId ? "TheMealDB" : null);

  return (
    <div
      className="card overflow-hidden hover:shadow-card-hover transition-all cursor-pointer active:scale-[0.99]"
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={recipe.imageUrl || getFallbackImg(recipe.title)}
          alt={recipe.title}
          className="w-full h-44 object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.dataset.fallback = "1";
              e.target.src = getFallbackImg(recipe.title);
            }
          }}
        />
        {onFavorite && recipe._id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(recipe._id);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
            />
          </button>
        )}
        {recipe.matchPercent !== null && recipe.matchPercent !== undefined && (
          <div
            className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full
            ${recipe.matchPercent >= 80 ? "bg-green-500 text-white" : recipe.matchPercent >= 50 ? "bg-orange-500 text-white" : "bg-gray-700 text-white"}`}
          >
            {recipe.matchPercent}% match
          </div>
        )}
        {isExternalResult && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
            <span className="text-white text-xs font-medium">
              Tap to import recipe →
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-bold text-gray-900 line-clamp-2 mb-2">
          {recipe.title}
        </h4>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {recipe.cuisine && (
            <span className="text-xs bg-orange-100 text-primary rounded-full px-2 py-0.5">
              {recipe.cuisine}
            </span>
          )}
          {recipe.difficulty && (
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${DIFF_COLOR[recipe.difficulty] || "text-gray-600 bg-gray-100"}`}
            >
              {recipe.difficulty}
            </span>
          )}
          {source && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <ExternalLink className="w-3 h-3" />
              {source}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{totalTime || "?"} min</span>
          </div>
          {showMissing && missing > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToShopping?.(recipe._id);
              }}
              className="flex items-center gap-1 text-xs bg-red-50 text-red-600 rounded-full px-2.5 py-1 hover:bg-red-100 transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
              {missing} missing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
