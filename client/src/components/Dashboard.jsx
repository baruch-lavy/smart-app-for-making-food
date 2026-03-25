import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  ChefHat,
  Star,
  AlertTriangle,
  Flame,
  BookOpen,
  BarChart3,
  Users,
  Music,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import useAppStore from "../store/useAppStore";

const INTENTS = [
  {
    id: "quick",
    title: "Quick & Easy",
    sub: "Under 20 minutes",
    icon: "\u26A1",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "effort",
    title: "Put in Effort",
    sub: "Something special today",
    icon: "\uD83D\uDCAA",
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "easy",
    title: "Something Easy",
    sub: "Low effort, big flavor",
    icon: "\uD83D\uDE0C",
    color: "from-emerald-400 to-teal-500",
  },
];

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setIntent = useAppStore((s) => s.setIntent);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const todayKey = DAY_NAMES[new Date().getDay()];

  const { data: pantryData } = useQuery({
    queryKey: ["pantry"],
    queryFn: () => api.get("/pantry").then((r) => r.data),
  });
  const { data: historyData } = useQuery({
    queryKey: ["mealHistory"],
    queryFn: () => api.get("/mealhistory").then((r) => r.data),
  });
  const { data: mealPlan } = useQuery({
    queryKey: ["mealplan"],
    queryFn: () => api.get("/mealplan").then((r) => r.data),
  });

  const pantryItems = pantryData?.items || [];
  const recentMeals = historyData?.slice(0, 3) || [];

  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const expiringItems = pantryItems.filter(
    (i) =>
      i.expiresAt &&
      new Date(i.expiresAt) <= soon &&
      new Date(i.expiresAt) >= new Date(),
  );
  const todayPlan = mealPlan?.days?.[todayKey];
  const streak = historyData?.length || 0;

  const handleIntent = (intentId) => {
    setIntent(intentId);
    navigate("/suggest");
  };

  return (
    <div className="min-h-screen bg-gradient-mesh pt-14">
      {/* Glass header */}
      <header className="glass sticky top-14 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow-primary">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-gray-900">
              CookSmart
            </span>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center text-sm font-bold text-primary border border-primary/20 hover:shadow-glow-primary transition-all"
          >
            {user?.name?.[0]?.toUpperCase()}
          </button>
        </div>
      </header>

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 pt-6"
      >
        {/* Hero greeting */}
        <motion.div variants={item} className="mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
            Good {greeting},{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0]}</span>!
          </h2>
          <p className="text-gray-500">What are we cooking today?</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={item}
          className="flex gap-3 mb-5 overflow-x-auto pb-1 -mx-1 px-1"
        >
          <div className="flex-shrink-0 card px-4 py-3 flex items-center gap-3 min-w-[140px]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900">{streak}</p>
              <p className="text-xs text-gray-400">Meals cooked</p>
            </div>
          </div>
          <div className="flex-shrink-0 card px-4 py-3 flex items-center gap-3 min-w-[140px]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900">
                {pantryItems.length}
              </p>
              <p className="text-xs text-gray-400">In pantry</p>
            </div>
          </div>
          <div className="flex-shrink-0 card px-4 py-3 flex items-center gap-3 min-w-[140px]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900">
                {recentMeals.filter((m) => m.rating >= 4).length}
              </p>
              <p className="text-xs text-gray-400">Top rated</p>
            </div>
          </div>
        </motion.div>

        {/* Expiring items alert */}
        {expiringItems.length > 0 && (
          <motion.div
            variants={item}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-3xl p-4 mb-5 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {expiringItems.length} item
                {expiringItems.length > 1 ? "s" : ""} expiring soon!
              </p>
              <p className="text-sm text-amber-600 mt-0.5">
                {expiringItems.map((i) => i.name).join(", ")}
              </p>
              <button
                onClick={() => {
                  setIntent("quick");
                  navigate("/suggest");
                }}
                className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
              >
                Find recipes using these <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Today's plan card */}
        {todayPlan?.recipeId && (
          <motion.div
            variants={item}
            className="card overflow-hidden mb-5 cursor-pointer group"
            onClick={() => navigate(`/recipe/${todayPlan.recipeId}`)}
          >
            <div className="flex items-center gap-4 p-4">
              {todayPlan.imageUrl ? (
                <img
                  src={todayPlan.imageUrl}
                  alt={todayPlan.recipeTitle}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Today's Plan
                </p>
                <p className="font-bold text-gray-900 line-clamp-1 text-lg">
                  {todayPlan.recipeTitle}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  Tap to view recipe <ArrowRight className="w-3 h-3" />
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Intent buttons */}
        <motion.div variants={item} className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            What's the vibe?
          </h3>
          <div className="grid gap-3">
            {INTENTS.map(({ id, title, sub, icon, color }) => (
              <motion.button
                key={id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleIntent(id)}
                className="card p-4 flex items-center gap-4 text-left group hover:shadow-card-hover"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                >
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{title}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{sub}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Explore grid */}
        <motion.div variants={item} className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Explore
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                to: "/analytics",
                icon: BarChart3,
                label: "Analytics",
                color: "from-purple-400 to-indigo-500",
              },
              {
                to: "/learning",
                icon: BookOpen,
                label: "Learn",
                color: "from-blue-400 to-cyan-500",
              },
              {
                to: "/social",
                icon: Users,
                label: "Social",
                color: "from-pink-400 to-rose-500",
              },
              {
                to: "/experience",
                icon: Music,
                label: "Vibes",
                color: "from-green-400 to-emerald-500",
              },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="card p-3 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}
                >
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Pantry summary */}
        <motion.div variants={item} className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Your Pantry
            </h3>
            <Link
              to="/pantry"
              className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            {pantryItems.length > 0
              ? `${pantryItems.length} ingredient${pantryItems.length !== 1 ? "s" : ""} available`
              : "No items yet. Add ingredients for better suggestions!"}
          </p>
        </motion.div>

        {/* Recent meals */}
        {recentMeals.length > 0 && (
          <motion.div variants={item} className="card p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Recent Meals
            </h3>
            <div className="space-y-3">
              {recentMeals.map((meal) => (
                <div
                  key={meal._id}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {meal.recipeTitle}
                  </span>
                  {meal.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < meal.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
