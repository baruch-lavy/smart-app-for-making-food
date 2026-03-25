import React, { useState, useCallback } from "react";
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
  SkipBack,
  SkipForward,
  Search,
  Radio,
  X,
} from "lucide-react";
import api from "../services/api";
import useAudioStore from "../store/useAudioStore";

/* Web Audio ambiance helpers now live in useAudioStore */

/* ─── Music stations per mood (multiple per mood for next/prev) ─── */

const MOOD_STATIONS = {
  calm: [
    { url: "https://ice1.somafm.com/dronezone-128-mp3", name: "Drone Zone" },
    {
      url: "https://ice1.somafm.com/spacestation-128-mp3",
      name: "Space Station",
    },
    { url: "https://ice1.somafm.com/vaporwaves-128-mp3", name: "Vaporwaves" },
  ],
  upbeat: [
    {
      url: "https://ice1.somafm.com/groovesalad-256-mp3",
      name: "Groove Salad",
    },
    {
      url: "https://ice1.somafm.com/secretagent-128-mp3",
      name: "Secret Agent",
    },
    {
      url: "https://ice1.somafm.com/seventies-128-mp3",
      name: "Left Coast 70s",
    },
  ],
  focus: [
    {
      url: "https://ice1.somafm.com/deepspaceone-128-mp3",
      name: "Deep Space One",
    },
    { url: "https://ice1.somafm.com/dronezone-128-mp3", name: "Drone Zone" },
    {
      url: "https://ice1.somafm.com/spacestation-128-mp3",
      name: "Space Station",
    },
  ],
  energetic: [
    { url: "https://ice1.somafm.com/poptron-128-mp3", name: "PopTron" },
    { url: "https://ice1.somafm.com/covers-128-mp3", name: "Covers" },
    { url: "https://ice1.somafm.com/thistle-128-mp3", name: "ThistleRadio" },
  ],
  romantic: [
    { url: "https://ice1.somafm.com/lush-128-mp3", name: "Lush" },
    {
      url: "https://ice1.somafm.com/groovesalad-256-mp3",
      name: "Groove Salad",
    },
    {
      url: "https://ice1.somafm.com/secretagent-128-mp3",
      name: "Secret Agent",
    },
  ],
  party: [
    { url: "https://ice1.somafm.com/bootliquor-128-mp3", name: "Boot Liquor" },
    { url: "https://ice1.somafm.com/poptron-128-mp3", name: "PopTron" },
    { url: "https://ice1.somafm.com/covers-128-mp3", name: "Covers" },
  ],
};

/* All available stations for search */
const ALL_STATIONS = [
  {
    url: "https://ice1.somafm.com/groovesalad-256-mp3",
    name: "Groove Salad",
    tags: "chill ambient electronic",
  },
  {
    url: "https://ice1.somafm.com/dronezone-128-mp3",
    name: "Drone Zone",
    tags: "ambient atmospheric calm",
  },
  {
    url: "https://ice1.somafm.com/deepspaceone-128-mp3",
    name: "Deep Space One",
    tags: "deep ambient intergalactic",
  },
  {
    url: "https://ice1.somafm.com/spacestation-128-mp3",
    name: "Space Station Soma",
    tags: "ambient mid-tempo",
  },
  {
    url: "https://ice1.somafm.com/secretagent-128-mp3",
    name: "Secret Agent",
    tags: "lounge spy jazz",
  },
  {
    url: "https://ice1.somafm.com/lush-128-mp3",
    name: "Lush",
    tags: "sensual downtempo romantic",
  },
  {
    url: "https://ice1.somafm.com/bootliquor-128-mp3",
    name: "Boot Liquor",
    tags: "americana western roots",
  },
  {
    url: "https://ice1.somafm.com/poptron-128-mp3",
    name: "PopTron",
    tags: "electronic synthpop dance",
  },
  {
    url: "https://ice1.somafm.com/covers-128-mp3",
    name: "Covers",
    tags: "covers indie pop rock",
  },
  {
    url: "https://ice1.somafm.com/thistle-128-mp3",
    name: "ThistleRadio",
    tags: "celtic folk",
  },
  {
    url: "https://ice1.somafm.com/seventies-128-mp3",
    name: "Left Coast 70s",
    tags: "70s classic rock pop",
  },
  {
    url: "https://ice1.somafm.com/vaporwaves-128-mp3",
    name: "Vaporwaves",
    tags: "vaporwave retro chill",
  },
  {
    url: "https://ice1.somafm.com/folkfwd-128-mp3",
    name: "Folk Forward",
    tags: "folk indie acoustic",
  },
  {
    url: "https://ice1.somafm.com/u80s-128-mp3",
    name: "Underground 80s",
    tags: "80s new wave alternative",
  },
  {
    url: "https://ice1.somafm.com/indiepop-128-mp3",
    name: "Indie Pop Rocks",
    tags: "indie pop alternative",
  },
  {
    url: "https://ice1.somafm.com/defcon-128-mp3",
    name: "DEF CON Radio",
    tags: "synth dark electronic",
  },
  {
    url: "https://ice1.somafm.com/dubstep-128-mp3",
    name: "Dub Step Beyond",
    tags: "dubstep bass electronic",
  },
  {
    url: "https://ice1.somafm.com/7soul-128-mp3",
    name: "Seven Inch Soul",
    tags: "soul funk 60s 70s",
  },
];

/* ─── Component ─── */

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  // Global audio store
  const {
    isPlaying,
    volume,
    selectedMood,
    selectedAmbiance,
    stationIndex,
    currentStation,
    musicLoading,
    setVolume,
    playStation,
    stopMusic,
    startAmbiance,
    stopAmbianceAudio,
    selectMood,
    nextStation,
    prevStation,
    togglePlayPause,
  } = useAudioStore();

  const searchResults = searchQuery.trim()
    ? ALL_STATIONS.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tags.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : ALL_STATIONS;

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
    selectMood(mood, MOOD_STATIONS[mood]);
    saveMutation.mutate({ musicMood: mood, ambianceType: selectedAmbiance });
  };

  const handleNext = () => {
    if (!selectedMood) return;
    nextStation(MOOD_STATIONS[selectedMood]);
  };

  const handlePrev = () => {
    if (!selectedMood) return;
    prevStation(MOOD_STATIONS[selectedMood]);
  };

  const handlePlayCustomUrl = () => {
    const url = customUrl.trim();
    if (!url) return;
    useAudioStore.setState({ selectedMood: null, isPlaying: true });
    playStation({ url, name: "Custom Stream" });
    setCustomUrl("");
  };

  const handleSearchSelect = (station) => {
    useAudioStore.setState({ selectedMood: null, isPlaying: true });
    playStation(station);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleAmbianceSelect = (amb) => {
    const newAmb = amb === selectedAmbiance ? null : amb;
    startAmbiance(newAmb);
    saveMutation.mutate({
      musicMood: selectedMood,
      ambianceType: newAmb,
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
          {(selectedMood || currentStation) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`card p-5 bg-gradient-to-r ${selectedMood ? MOODS.find((m) => m.id === selectedMood)?.color || "from-gray-400 to-gray-500" : "from-violet-500 to-purple-600"} border-0 text-white overflow-hidden relative`}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-semibold text-sm">Now Playing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold">
                  {currentStation?.name ||
                    MOODS.find((m) => m.id === selectedMood)?.label + " Mix"}
                  {musicLoading && (
                    <span className="ml-2 text-sm opacity-70 animate-pulse">
                      Loading...
                    </span>
                  )}
                </h3>
                <p className="text-sm opacity-80">
                  {selectedMood
                    ? `${MOODS.find((m) => m.id === selectedMood)?.label} • Station ${stationIndex + 1}/${MOOD_STATIONS[selectedMood]?.length || 0}`
                    : "Custom station"}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <VolumeX className="w-4 h-4 opacity-60" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(+e.target.value)}
                    className="flex-1 h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
                  />
                  <Volume2 className="w-4 h-4 opacity-60" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Custom URL */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Find a Station</h2>
          </div>
          <div className="space-y-3">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-full card p-3 flex items-center gap-3 text-left hover:shadow-card-hover transition-all"
            >
              <Search className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                Search stations by name or genre...
              </span>
            </button>

            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="card p-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or genre..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {searchResults.map((station) => (
                        <button
                          key={station.url}
                          onClick={() => handleSearchSelect(station)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-colors ${
                            currentStation?.url === station.url
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <Radio className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {station.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {station.tags}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* Custom URL input */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 mb-2">
                        Or paste a stream URL:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handlePlayCustomUrl()
                          }
                          placeholder="https://stream-url.com/stream.mp3"
                          className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <button
                          onClick={handlePlayCustomUrl}
                          disabled={!customUrl.trim()}
                          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

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
                  handleMoodSelect(preset.mood);
                  if (preset.amb) handleAmbianceSelect(preset.amb);
                  else {
                    startAmbiance(null);
                  }
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
