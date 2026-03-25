import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import useAudioStore from "../../store/useAudioStore";

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

const MOOD_COLORS = {
  calm: "from-blue-400 to-cyan-300",
  upbeat: "from-yellow-400 to-orange-400",
  focus: "from-indigo-400 to-purple-400",
  energetic: "from-rose-400 to-red-500",
  romantic: "from-pink-400 to-rose-400",
  party: "from-purple-500 to-pink-500",
};

export default function MiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isPlaying,
    currentStation,
    selectedMood,
    musicLoading,
    togglePlayPause,
    stopMusic,
    nextStation,
    prevStation,
  } = useAudioStore();

  // Don't show on the experience page itself
  if (location.pathname === "/experience") return null;
  // Don't show if nothing is playing
  if (!currentStation && !selectedMood) return null;

  const stations = selectedMood ? MOOD_STATIONS[selectedMood] : null;
  const gradient = selectedMood
    ? MOOD_COLORS[selectedMood] || "from-gray-400 to-gray-500"
    : "from-violet-500 to-purple-600";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className={`fixed bottom-4 left-2 right-2 z-50 rounded-2xl bg-gradient-to-r ${gradient} text-white shadow-lg px-4 py-3`}
      >
        <div className="flex items-center gap-3">
          {/* Info — tap to go to Experience */}
          <button
            onClick={() => navigate("/experience")}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <Music className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {currentStation?.name || "Music"}
                {musicLoading && (
                  <span className="ml-1 text-xs opacity-70 animate-pulse">
                    Loading...
                  </span>
                )}
              </p>
              {selectedMood && (
                <p className="text-xs opacity-70 truncate capitalize">
                  {selectedMood} mood
                </p>
              )}
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {stations && (
              <button
                onClick={() => prevStation(stations)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            {stations && (
              <button
                onClick={() => nextStation(stations)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={stopMusic}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
