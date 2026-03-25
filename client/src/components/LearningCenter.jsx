import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Award,
  CheckCircle,
  Target,
  ArrowLeft,
  Lightbulb,
  Flame,
  X,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "./ui/Toast";

const BUILT_IN_TECHNIQUES = [
  {
    _id: "b1",
    name: "Knife Skills — The Rock Chop",
    category: "knife-skills",
    difficulty: "beginner",
    emoji: "🔪",
    gradient: "from-red-400 to-rose-500",
    description:
      "The foundation of all cooking. Master the rocking motion for fast, even cuts.",
    steps: [
      "Curl fingers into a claw grip on the food.",
      "Keep the tip of the knife on the board.",
      "Rock the blade up and down in a smooth arc.",
      "Move your guiding hand backward after each cut.",
    ],
    commonMistakes: [
      "Lifting the knife tip off the board",
      "Cutting with fingers extended",
    ],
    proTips: [
      "A sharp knife is safer than a dull one.",
      "Let the weight of the knife do the work.",
    ],
  },
  {
    _id: "b2",
    name: "Mise en Place",
    category: "prep",
    difficulty: "beginner",
    emoji: "📐",
    gradient: "from-blue-400 to-cyan-500",
    description:
      '"Everything in its place" — prep and measure all ingredients before cooking.',
    steps: [
      "Read the recipe completely.",
      "Gather all ingredients.",
      "Wash, peel, and chop as specified.",
      "Arrange in small bowls by order of use.",
    ],
    commonMistakes: [
      "Starting to cook before prepping everything",
      "Not reading the full recipe first",
    ],
    proTips: [
      "Use a sheet pan to organize your bowls.",
      "Clean as you go to stay organized.",
    ],
  },
  {
    _id: "b3",
    name: "Searing & Browning",
    category: "cooking-methods",
    difficulty: "intermediate",
    emoji: "🔥",
    gradient: "from-orange-400 to-amber-500",
    description:
      "Create deep flavor with the Maillard reaction by searing at high heat.",
    steps: [
      "Pat meat completely dry with paper towels.",
      "Heat oil in a heavy pan until it shimmers.",
      "Place meat and don't move it for 2-3 minutes.",
      "Flip when a golden crust has formed.",
    ],
    commonMistakes: [
      "Overcrowding the pan",
      "Moving the meat too soon",
      "Using a cold pan",
    ],
    proTips: [
      "Dry surfaces brown — moisture steams.",
      "Use avocado or grapeseed oil for high heat.",
    ],
  },
  {
    _id: "b4",
    name: "Emulsification — Vinaigrettes & Sauces",
    category: "sauce-making",
    difficulty: "intermediate",
    emoji: "🫗",
    gradient: "from-yellow-400 to-lime-500",
    description:
      "Combine oil and water-based liquids into a smooth, stable mixture.",
    steps: [
      "Combine acid (vinegar/citrus) with mustard in a bowl.",
      "Slowly drizzle oil while whisking vigorously.",
      "The mixture should thicken and look creamy.",
      "Season to taste.",
    ],
    commonMistakes: [
      "Adding oil too quickly",
      "Skipping the emulsifier (mustard, egg yolk)",
    ],
    proTips: [
      "Room-temperature ingredients emulsify better.",
      "A jar with a lid works for quick shaking.",
    ],
  },
  {
    _id: "b5",
    name: "Deglazing",
    category: "sauce-making",
    difficulty: "beginner",
    emoji: "🍷",
    gradient: "from-purple-400 to-fuchsia-500",
    description:
      "Lift the flavorful browned bits (fond) from the pan with liquid.",
    steps: [
      "Remove cooked protein from pan.",
      "Add wine, stock, or water to the hot pan.",
      "Scrape the bottom with a wooden spoon.",
      "Reduce by half for a concentrated sauce.",
    ],
    commonMistakes: [
      "Using a non-stick pan (no fond forms)",
      "Not scraping thoroughly",
    ],
    proTips: [
      "Stand back when adding liquid — it will steam!",
      "This is the secret to restaurant-quality pan sauces.",
    ],
  },
  {
    _id: "b6",
    name: "Tempering Chocolate",
    category: "baking",
    difficulty: "advanced",
    emoji: "🍫",
    gradient: "from-amber-700 to-yellow-900",
    description: "Heat and cool chocolate to create a glossy, snappy finish.",
    steps: [
      "Melt 2/3 of chopped chocolate to 115°F (dark).",
      "Remove from heat, add remaining 1/3 chocolate.",
      "Stir until cooled to 82°F.",
      "Briefly reheat to 88-90°F — it's ready.",
    ],
    commonMistakes: [
      "Getting water in the chocolate",
      "Overheating past target temperature",
    ],
    proTips: [
      "Use a marble slab for faster cooling.",
      "Test on parchment — it should set in 5 min.",
    ],
  },
  {
    _id: "b7",
    name: "Toasting & Blooming Spices",
    category: "seasoning",
    difficulty: "beginner",
    emoji: "🌶️",
    gradient: "from-red-500 to-orange-600",
    description:
      "Unlock deeper flavor by toasting whole spices or blooming ground spices in fat.",
    steps: [
      "Heat a dry pan over medium heat.",
      "Add whole spices and toast 1-2 min until fragrant.",
      "For ground spices, bloom in warm oil for 30 seconds.",
      "Use immediately in your recipe.",
    ],
    commonMistakes: [
      "Burning spices over too-high heat",
      "Walking away — they go from perfect to burnt in seconds",
    ],
    proTips: [
      "Your nose knows — when you smell them, they're ready.",
      "Toast extra and store in a jar for the week.",
    ],
  },
  {
    _id: "b8",
    name: "Plating like a Pro",
    category: "plating",
    difficulty: "intermediate",
    emoji: "🎨",
    gradient: "from-pink-400 to-violet-500",
    description:
      "Arrange food using restaurant techniques: height, color contrast, and white space.",
    steps: [
      "Use a large plate and leave margins.",
      "Build height in the center for visual impact.",
      "Add contrasting colors (green herbs, red sauces).",
      "Wipe plate edges clean before serving.",
    ],
    commonMistakes: ["Overcrowding the plate", "Using too many colors at once"],
    proTips: [
      "Odd numbers of elements look more natural.",
      "A squeeze bottle gives precise sauce placement.",
    ],
  },
  {
    _id: "b9",
    name: "Braising — Low & Slow",
    category: "cooking-methods",
    difficulty: "intermediate",
    emoji: "🍲",
    gradient: "from-emerald-500 to-teal-600",
    description:
      "Turn tough cuts tender by searing then simmering in liquid at low temperature.",
    steps: [
      "Season and sear the meat on all sides.",
      "Remove meat, sauté aromatics in the same pot.",
      "Return meat, add liquid to come halfway up.",
      "Cover and cook at 300-325°F for 2-3 hours.",
    ],
    commonMistakes: [
      "Too much liquid (it should be halfway)",
      "Cooking too hot (it should barely simmer)",
    ],
    proTips: [
      "Collagen converts to gelatin around 180°F — patience!",
      "Always better the next day.",
    ],
  },
  {
    _id: "b10",
    name: "Bread Dough — The Window Pane Test",
    category: "baking",
    difficulty: "advanced",
    emoji: "🍞",
    gradient: "from-yellow-400 to-orange-500",
    description:
      "Know when your dough is properly kneaded by stretching a small piece thin.",
    steps: [
      "Knead dough for 8-12 minutes.",
      "Pinch off a small ball of dough.",
      "Gently stretch it thin between your fingers.",
      "If light passes through without tearing, gluten is developed.",
    ],
    commonMistakes: [
      "Under-kneading (dough tears immediately)",
      "Over-kneading (dough becomes tough and inelastic)",
    ],
    proTips: [
      "Autolyse (resting flour + water 20 min) reduces kneading time.",
      "Wet hands prevent sticking better than extra flour.",
    ],
  },
];

const DAILY_TIPS = [
  {
    tip: "Salt your pasta water until it tastes like the sea — about 1 tablespoon per quart.",
    icon: "🧂",
  },
  {
    tip: "Rest meat after cooking for at least 5 minutes. The juices redistribute for a moister result.",
    icon: "🥩",
  },
  {
    tip: "Add a splash of pasta water to your sauce — the starch helps it cling to noodles.",
    icon: "🍝",
  },
  {
    tip: "Taste as you go! Adjust seasoning in layers, not just at the end.",
    icon: "👅",
  },
  {
    tip: "Preheat your pan before adding oil. Hot pan + cold oil = food won't stick.",
    icon: "🍳",
  },
  {
    tip: "Acid (lemon, vinegar) brightens flavors. If a dish tastes flat, it probably needs acid.",
    icon: "🍋",
  },
  {
    tip: "Store herbs upright in a glass of water in the fridge. They last much longer.",
    icon: "🌿",
  },
];

const CATEGORIES = [
  { id: "all", label: "All", emoji: "📚" },
  { id: "knife-skills", label: "Knife Skills", emoji: "🔪" },
  { id: "cooking-methods", label: "Cooking", emoji: "🔥" },
  { id: "baking", label: "Baking", emoji: "🍞" },
  { id: "prep", label: "Prep", emoji: "📐" },
  { id: "plating", label: "Plating", emoji: "🎨" },
  { id: "sauce-making", label: "Sauces", emoji: "🫗" },
  { id: "seasoning", label: "Seasoning", emoji: "🌶️" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const LearningCenter = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [techniques, setTechniques] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchTechniques();
    fetchLearningPath();
  }, []);

  const fetchTechniques = async () => {
    try {
      const response = await api.get("/learning/techniques");
      setTechniques(response.data?.length ? response.data : []);
    } catch {
      setTechniques([]);
    }
  };

  const fetchLearningPath = async () => {
    try {
      const response = await api.get("/learning/path");
      setLearningPath(response.data);
    } catch {
      setLearningPath(null);
    }
  };

  const completeTechnique = async (techniqueId, techniqueName) => {
    try {
      await api.post("/learning/path/complete-technique", {
        techniqueId,
        techniqueName,
      });
      fetchLearningPath();
      addToast(`✅ "${techniqueName}" marked as practiced!`);
    } catch {
      addToast("Could not save progress. Try again.");
    }
  };

  const allTechniques = useMemo(() => {
    const apiIds = new Set(techniques.map((t) => t._id));
    const merged = [
      ...techniques,
      ...BUILT_IN_TECHNIQUES.filter((b) => !apiIds.has(b._id)),
    ];
    return merged;
  }, [techniques]);

  const filteredTechniques =
    filterCategory === "all"
      ? allTechniques
      : allTechniques.filter((t) => t.category === filterCategory);
  const completedTechniques = learningPath?.techniquesCompleted || [];

  const dailyTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  const totalMastery =
    completedTechniques.length > 0
      ? Math.round(
          completedTechniques.reduce((s, c) => s + (c.masteryLevel || 0), 0) /
            Math.max(allTechniques.length, 1),
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-mesh pt-14">
      <header className="glass sticky top-14 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" /> Learning Center
          </h1>
        </div>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 pt-5 pb-8"
      >
        {/* Daily Tip */}
        <motion.div
          variants={itemAnim}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-3xl p-4 mb-5 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
            {dailyTip.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Tip of the Day
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">
              {dailyTip.tip}
            </p>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div variants={itemAnim} className="card p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" /> Your Progress
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 text-center">
              <div className="text-2xl font-extrabold text-purple-600">
                {learningPath?.currentLevel?.toUpperCase() || "—"}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Level</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-2xl font-extrabold text-green-600">
                {completedTechniques.length}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Practiced</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-3 text-center">
              <div className="text-2xl font-extrabold text-orange-600">
                {totalMastery}%
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Mastery</div>
            </div>
          </div>

          {/* Overall mastery bar */}
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalMastery}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-full"
            />
          </div>

          {/* Certifications */}
          {learningPath?.certifications?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Award className="w-3 h-3" /> Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {learningPath.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm"
                  >
                    🏆 {cert.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Filters */}
        <motion.div
          variants={itemAnim}
          className="flex gap-1.5 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-hide"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary/30"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Technique Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredTechniques.map((technique) => {
            const isCompleted = completedTechniques.some(
              (ct) =>
                ct.techniqueId?.toString() === technique._id?.toString() ||
                ct.techniqueName === technique.name,
            );
            const masteryData = completedTechniques.find(
              (ct) =>
                ct.techniqueId?.toString() === technique._id?.toString() ||
                ct.techniqueName === technique.name,
            );
            const builtIn = BUILT_IN_TECHNIQUES.find(
              (b) => b._id === technique._id,
            );
            const gradient = builtIn?.gradient || "from-gray-400 to-gray-500";
            const emoji = builtIn?.emoji || "📖";

            return (
              <motion.div
                key={technique._id}
                variants={itemAnim}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTechnique(technique)}
                className={`card p-4 cursor-pointer group hover:shadow-card-hover transition-all ${isCompleted ? "ring-1 ring-green-200" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}
                  >
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">
                        {technique.name}
                      </h3>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {technique.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {technique.difficulty}
                      </span>
                      {masteryData && (
                        <div className="flex items-center gap-1.5 flex-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{
                                width: `${masteryData.masteryLevel || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {masteryData.masteryLevel || 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredTechniques.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">
              No techniques in this category yet
            </p>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTechnique && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setSelectedTechnique(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`bg-gradient-to-br ${BUILT_IN_TECHNIQUES.find((b) => b._id === selectedTechnique._id)?.gradient || "from-primary to-accent"} p-6 rounded-t-3xl sm:rounded-t-3xl relative`}
              >
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-4xl mb-2">
                  {BUILT_IN_TECHNIQUES.find(
                    (b) => b._id === selectedTechnique._id,
                  )?.emoji || "📖"}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {selectedTechnique.name}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                    {selectedTechnique.category}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                    {selectedTechnique.difficulty}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-gray-600 leading-relaxed">
                  {selectedTechnique.description}
                </p>

                {selectedTechnique.steps?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" /> Steps
                    </h3>
                    <ol className="space-y-2">
                      {selectedTechnique.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selectedTechnique.commonMistakes?.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-4">
                    <h3 className="font-bold text-red-700 text-sm mb-2">
                      ⚠️ Common Mistakes
                    </h3>
                    <ul className="space-y-1.5">
                      {selectedTechnique.commonMistakes.map((mistake, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-red-600 flex items-start gap-2"
                        >
                          <span className="text-red-400 mt-0.5">•</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTechnique.proTips?.length > 0 && (
                  <div className="bg-green-50 rounded-2xl p-4">
                    <h3 className="font-bold text-green-700 text-sm mb-2">
                      💡 Pro Tips
                    </h3>
                    <ul className="space-y-1.5">
                      {selectedTechnique.proTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-green-600 flex items-start gap-2"
                        >
                          <span className="text-green-400 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    completeTechnique(
                      selectedTechnique._id,
                      selectedTechnique.name,
                    );
                    setSelectedTechnique(null);
                  }}
                  className="btn-primary w-full"
                >
                  {completedTechniques.some(
                    (ct) =>
                      ct.techniqueId?.toString() ===
                        selectedTechnique._id?.toString() ||
                      ct.techniqueName === selectedTechnique.name,
                  )
                    ? "✓ Practice Again"
                    : "Mark as Practiced"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningCenter;
