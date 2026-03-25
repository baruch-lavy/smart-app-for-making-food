import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  X,
  SkipBack,
  SkipForward,
  GripVertical,
  ChevronUp,
  ChevronDown,
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
  const constraintsRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
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

  if (location.pathname === "/experience") return null;
  if (!currentStation && !selectedMood) return null;

  const stations = selectedMood ? MOOD_STATIONS[selectedMood] : null;
  const gradient = selectedMood
    ? MOOD_COLORS[selectedMood] || "from-gray-400 to-gray-500"
    : "from-violet-500 to-purple-600";

  return (
    <>
      {/* Invisible drag boundary — full viewport */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[49]"
      />

      <AnimatePresence>
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          whileDrag={{ scale: 1.05 }}
          className={`fixed bottom-4 right-3 z-50 rounded-2xl bg-gradient-to-r ${gradient} text-white shadow-lg cursor-grab active:cursor-grabbing select-none`}
          style={{ touchAction: "none" }}
        >
          {/* Collapsed: tiny pill */}
          {!expanded ? (
            <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5">
              <button
                onClick={() => navigate("/experience")}
                className="flex items-center gap-1.5 min-w-0"
              >
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-semibold truncate max-w-[80px]">
                  {currentStation?.name || "Music"}
                </span>
              </button>

              <button
                onClick={togglePlayPause}
                className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={() => setExpanded(true)}
                className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* Expanded: compact controls */
            <div className="px-3 py-2 min-w-[180px]">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => navigate("/experience")}
                  className="flex items-center gap-1.5 min-w-0 flex-1"
                >
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {currentStation?.name || "Music"}
                      {musicLoading && (
                        <span className="ml-1 text-[10px] opacity-70 animate-pulse">
                          ...
                        </span>
                      )}
                    </p>
                    {selectedMood && (
                      <p className="text-[10px] opacity-60 capitalize">
                        {selectedMood}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 ml-1"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1">
                {stations && (
                  <button
                    onClick={() => prevStation(stations)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <SkipBack className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>
                {stations && (
                  <button
                    onClick={() => nextStation(stations)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <SkipForward className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={stopMusic}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
