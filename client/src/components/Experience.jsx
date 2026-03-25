import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Music,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Coffee,
  CloudRain,
  Flame,
  Waves,
  Trees,
  Wind,
  ChefHat,
  Package,
  ShoppingCart,
  User,
  Calendar,
  Sparkles,
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
        to="/profile"
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-xs">Profile</span>
      </Link>
    </nav>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const MOODS = [
  {
    id: "calm",
    label: "Calm",
    emoji: "🧘",
    color: "from-blue-400 to-cyan-300",
    desc: "Peaceful cooking vibes",
  },
  {
    id: "upbeat",
    label: "Upbeat",
    emoji: "🎵",
    color: "from-yellow-400 to-orange-400",
    desc: "Fun & energetic",
  },
  {
    id: "focus",
    label: "Focus",
    emoji: "🎯",
    color: "from-indigo-400 to-purple-400",
    desc: "Deep concentration",
  },
  {
    id: "energetic",
    label: "Energetic",
    emoji: "⚡",
    color: "from-rose-400 to-red-500",
    desc: "High energy cooking",
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "🕯️",
    color: "from-pink-400 to-rose-400",
    desc: "Date night cooking",
  },
  {
    id: "party",
    label: "Party",
    emoji: "🎉",
    color: "from-purple-500 to-pink-500",
    desc: "Cooking with friends",
  },
];

const AMBIANCE = [
  {
    id: "nature",
    label: "Nature",
    icon: Trees,
    color: "text-green-600 bg-green-50",
  },
  {
    id: "cafe",
    label: "Café",
    icon: Coffee,
    color: "text-amber-600 bg-amber-50",
  },
  {
    id: "rain",
    label: "Rain",
    icon: CloudRain,
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: "fireplace",
    label: "Fireplace",
    icon: Flame,
    color: "text-orange-600 bg-orange-50",
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: Waves,
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    id: "wind",
    label: "Wind",
    icon: Wind,
    color: "text-slate-600 bg-slate-50",
  },
];

export default function Experience() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedAmbiance, setSelectedAmbiance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  const { data: preferences } = useQuery({
    queryKey: ["experience-prefs"],
    queryFn: () =>
      api
        .get("/experience/preferences")
        .then((r) => r.data)
        .catch(() => null),
  });

  const saveMutation = useMutation({
    mutationFn: (prefs) => api.put("/experience/preferences", prefs),
  });

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setIsPlaying(true);
    saveMutation.mutate({ musicMood: mood, ambianceType: selectedAmbiance });
  };

  const handleAmbianceSelect = (amb) => {
    setSelectedAmbiance(amb === selectedAmbiance ? null : amb);
    saveMutation.mutate({
      musicMood: selectedMood,
      ambianceType: amb === selectedAmbiance ? null : amb,
    });
  };

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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cooking Vibes</h1>
            <p className="text-xs text-gray-400">
              Set the mood for your kitchen
            </p>
          </div>
        </div>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 pt-5 space-y-6"
      >
        {/* Now Playing Banner */}
        <AnimatePresence>
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`card p-5 bg-gradient-to-r ${MOODS.find((m) => m.id === selectedMood)?.color || "from-gray-400 to-gray-500"} border-0 text-white overflow-hidden relative`}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-semibold text-sm">Now Playing</span>
                  </div>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <h3 className="text-lg font-bold">
                  {MOODS.find((m) => m.id === selectedMood)?.label} Mix
                </h3>
                <p className="text-sm opacity-80">
                  {MOODS.find((m) => m.id === selectedMood)?.desc}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <VolumeX className="w-4 h-4 opacity-60" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
                  />
                  <Volume2 className="w-4 h-4 opacity-60" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music Moods */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <Headphones className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Music Mood</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOODS.map((mood) => (
              <motion.button
                key={mood.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleMoodSelect(mood.id)}
                className={`card p-4 text-left transition-all duration-200 ${selectedMood === mood.id ? "ring-2 ring-primary shadow-glow-primary border-primary/30" : "hover:shadow-card-hover"}`}
              >
                <div className="text-2xl mb-2">{mood.emoji}</div>
                <p className="font-semibold text-sm text-gray-900">
                  {mood.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{mood.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Ambiance Sounds */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-gray-900">Ambiance Sounds</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Layer background sounds over your music
          </p>
          <div className="grid grid-cols-3 gap-3">
            {AMBIANCE.map((amb) => (
              <motion.button
                key={amb.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAmbianceSelect(amb.id)}
                className={`card p-4 flex flex-col items-center gap-2 transition-all duration-200 ${selectedAmbiance === amb.id ? "ring-2 ring-accent shadow-glow-accent border-accent/30" : "hover:shadow-card-hover"}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${amb.color}`}
                >
                  <amb.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {amb.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Presets */}
        <motion.div variants={item}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Quick Presets
          </h2>
          <div className="space-y-2">
            {[
              {
                label: "Sunday Brunch",
                mood: "calm",
                amb: "cafe",
                emoji: "☕",
              },
              { label: "Kitchen Party", mood: "party", amb: null, emoji: "🎉" },
              {
                label: "Focus Cooking",
                mood: "focus",
                amb: "rain",
                emoji: "🌧️",
              },
              {
                label: "Date Night",
                mood: "romantic",
                amb: "fireplace",
                emoji: "🕯️",
              },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedMood(preset.mood);
                  setSelectedAmbiance(preset.amb);
                  setIsPlaying(true);
                }}
                className="w-full card p-4 flex items-center gap-3 text-left hover:shadow-card-hover transition-all"
              >
                <span className="text-2xl">{preset.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {preset.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {MOODS.find((m) => m.id === preset.mood)?.label}
                    {preset.amb
                      ? ` + ${AMBIANCE.find((a) => a.id === preset.amb)?.label}`
                      : ""}
                  </p>
                </div>
                <Play className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <BottomNav />
    </div>
  );
}
