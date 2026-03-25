import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Trophy,
  Users,
  Star,
  Send,
  ThumbsUp,
  Flame,
  ChefHat,
  Package,
  ShoppingCart,
  User,
  Calendar,
  TrendingUp,
} from "lucide-react";
import api from "../services/api";

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 flex justify-around py-2 z-50">
      <Link
        to="/dashboard"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors"
      >
        <ChefHat className="w-5 h-5" />
        <span className="text-xs">Home</span>
      </Link>
      <Link
        to="/pantry"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors"
      >
        <Package className="w-5 h-5" />
        <span className="text-xs">Pantry</span>
      </Link>
      <Link
        to="/planner"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors"
      >
        <Calendar className="w-5 h-5" />
        <span className="text-xs">Planner</span>
      </Link>
      <Link
        to="/shopping"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="text-xs">Shopping</span>
      </Link>
      <Link
        to="/social"
        className="flex flex-col items-center gap-1 text-primary"
      >
        <Users className="w-5 h-5" />
        <span className="text-xs">Social</span>
      </Link>
    </nav>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Social() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("challenges");
  const [newTip, setNewTip] = useState("");

  const { data: challenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: () =>
      api
        .get("/social/challenges")
        .then((r) => r.data)
        .catch(() => []),
  });

  const { data: communityTips = [] } = useQuery({
    queryKey: ["community-tips"],
    queryFn: () =>
      api
        .get("/social/community-tips")
        .then((r) => r.data)
        .catch(() => []),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      api
        .get("/social/leaderboard")
        .then((r) => r.data)
        .catch(() => []),
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId) =>
      api.post(`/social/challenges/${challengeId}/join`),
    onSuccess: () => qc.invalidateQueries(["challenges"]),
  });

  const submitTipMutation = useMutation({
    mutationFn: (tip) => api.post("/social/community-tips", { tip }),
    onSuccess: () => {
      qc.invalidateQueries(["community-tips"]);
      setNewTip("");
    },
  });

  const likeTipMutation = useMutation({
    mutationFn: (tipId) => api.post(`/social/community-tips/${tipId}/like`),
    onSuccess: () => qc.invalidateQueries(["community-tips"]),
  });

  const tabs = [
    { id: "challenges", label: "Challenges", icon: Trophy },
    { id: "community", label: "Community", icon: Users },
    { id: "leaderboard", label: "Leaderboard", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh pb-24">
      <header className="glass sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Community</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 p-1 bg-white/60 backdrop-blur rounded-2xl mb-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t.id ? "bg-white shadow-card text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "challenges" && (
            <motion.div
              key="challenges"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.div
                variants={item}
                className="card p-5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-yellow-300" />
                  <h3 className="font-bold text-lg">Weekly Challenge</h3>
                </div>
                <p className="text-purple-100 text-sm mb-4">
                  Cook 5 meals this week using only pantry ingredients. No
                  shopping allowed!
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {["🧑‍🍳", "👩‍🍳", "👨‍🍳"].map((e, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm border-2 border-purple-500"
                        >
                          {e}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-purple-200">42 joined</span>
                  </div>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
                    Join Challenge
                  </button>
                </div>
              </motion.div>

              {(challenges || []).length > 0 ? (
                challenges.map((challenge) => (
                  <motion.div
                    key={challenge._id}
                    variants={item}
                    className="card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {challenge.participants?.length || 0} participants
                      </span>
                      <button
                        onClick={() => joinMutation.mutate(challenge._id)}
                        className="px-4 py-1.5 btn-primary text-xs"
                      >
                        Join
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div variants={item} className="card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        30-Day Cooking Streak
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Cook at least one meal every day for 30 days
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                      style={{ width: "10%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">3 / 30 days completed</p>
                </motion.div>
              )}

              <motion.div variants={item} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Cuisine Explorer
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Try recipes from 5 different cuisines this month
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["Italian", "Asian", "Mexican", "Indian", "French"].map(
                    (c, i) => (
                      <span
                        key={c}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${i < 2 ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        {c}
                      </span>
                    ),
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {tab === "community" && (
            <motion.div
              key="community"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.div variants={item} className="card p-5 text-center">
                <div className="text-4xl mb-2">💡</div>
                <h3 className="font-bold text-gray-900 mb-1">Community Tips</h3>
                <p className="text-sm text-gray-500">
                  Learn from fellow home chefs
                </p>
              </motion.div>

              <motion.div variants={item} className="card p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Share a cooking tip..."
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    className="input-field flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTip.trim())
                        submitTipMutation.mutate(newTip.trim());
                    }}
                  />
                  <button
                    onClick={() =>
                      newTip.trim() && submitTipMutation.mutate(newTip.trim())
                    }
                    disabled={!newTip.trim() || submitTipMutation.isPending}
                    className="btn-primary px-4 text-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {communityTips.map((tip) => (
                <motion.div key={tip._id} variants={item} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-xl flex-shrink-0">
                      {tip.emoji || "💡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {tip.author || tip.userName || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {tip.tip}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => likeTipMutation.mutate(tip._id)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />{" "}
                          {tip.likes || tip.votes || 0}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <motion.div
                variants={item}
                className="card p-5 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
              >
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="font-bold text-gray-900">Top Home Chefs</h3>
                <p className="text-sm text-gray-500">
                  This month's most active cooks
                </p>
              </motion.div>

              {leaderboard.map((entry) => (
                <motion.div
                  key={entry.rank}
                  variants={item}
                  className={`card p-4 flex items-center gap-4 ${entry.isCurrentUser || entry.name === "You" ? "border-primary/30 bg-orange-50/50" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {typeof entry.badge === "string" &&
                    entry.badge.length > 1 ? (
                      entry.badge
                    ) : (
                      <span className="text-gray-400">{entry.badge}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm ${entry.isCurrentUser || entry.name === "You" ? "text-primary" : "text-gray-900"}`}
                    >
                      {entry.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.meals} meals · {entry.streak} day streak
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      #{entry.rank}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
