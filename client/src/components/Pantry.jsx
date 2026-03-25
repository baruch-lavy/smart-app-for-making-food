import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Package,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

const CATEGORIES = [
  { id: "all", label: "All", emoji: "📦" },
  { id: "produce", label: "Produce", emoji: "🥬" },
  { id: "protein", label: "Protein", emoji: "🥩" },
  { id: "dairy", label: "Dairy", emoji: "🧀" },
  { id: "grains", label: "Grains", emoji: "🌾" },
  { id: "spices", label: "Spices", emoji: "🌶️" },
  { id: "other", label: "Other", emoji: "🫙" },
];

function guessCategory(name) {
  const n = (name || "").toLowerCase();
  const produce = [
    "tomato",
    "lettuce",
    "onion",
    "garlic",
    "pepper",
    "carrot",
    "potato",
    "cucumber",
    "spinach",
    "broccoli",
    "avocado",
    "lemon",
    "lime",
    "apple",
    "banana",
    "orange",
    "mushroom",
    "celery",
    "ginger",
    "herbs",
    "basil",
    "cilantro",
    "parsley",
    "mint",
  ];
  const protein = [
    "chicken",
    "beef",
    "pork",
    "fish",
    "salmon",
    "tuna",
    "shrimp",
    "egg",
    "tofu",
    "turkey",
    "lamb",
    "bacon",
    "sausage",
  ];
  const dairy = [
    "milk",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "sour cream",
    "mozzarella",
    "parmesan",
  ];
  const grains = [
    "rice",
    "pasta",
    "bread",
    "flour",
    "oats",
    "noodle",
    "tortilla",
    "quinoa",
    "couscous",
  ];
  const spices = [
    "salt",
    "pepper",
    "cumin",
    "paprika",
    "oregano",
    "thyme",
    "cinnamon",
    "chili",
    "curry",
    "turmeric",
    "bay",
    "rosemary",
    "nutmeg",
    "vanilla",
  ];
  if (produce.some((w) => n.includes(w))) return "produce";
  if (protein.some((w) => n.includes(w))) return "protein";
  if (dairy.some((w) => n.includes(w))) return "dairy";
  if (grains.some((w) => n.includes(w))) return "grains";
  if (spices.some((w) => n.includes(w))) return "spices";
  return "other";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Pantry() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    expiresAt: "",
  });
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pantry"],
    queryFn: () => api.get("/pantry").then((r) => r.data),
  });
  const items = data?.items || [];

  const addMutation = useMutation({
    mutationFn: (item) => api.post("/pantry", item),
    onSuccess: () => {
      qc.invalidateQueries(["pantry"]);
      setForm({ name: "", quantity: "", unit: "", expiresAt: "" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => api.delete(`/pantry/${itemId}`),
    onSuccess: () => qc.invalidateQueries(["pantry"]),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMutation.mutate(form);
  };

  const categorizedItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      _category: i.category || guessCategory(i.name),
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = categorizedItems;
    if (activeCategory !== "all")
      list = list.filter((i) => i._category === activeCategory);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [categorizedItems, activeCategory, searchQ]);

  const expiringCount = items.filter((i) => {
    if (!i.expiresAt) return false;
    const d = Math.floor((new Date(i.expiresAt) - Date.now()) / 86400000);
    return d >= 0 && d <= 3;
  }).length;

  const expiredCount = items.filter(
    (i) => i.expiresAt && new Date(i.expiresAt) < new Date(),
  ).length;

  const getExpiryInfo = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.floor((new Date(expiresAt) - Date.now()) / 86400000);
    if (days < 0)
      return {
        text: "Expired",
        color: "text-red-600 bg-red-50",
        ring: "ring-red-200",
      };
    if (days === 0)
      return {
        text: "Today!",
        color: "text-orange-600 bg-orange-50",
        ring: "ring-orange-200",
      };
    if (days <= 3)
      return {
        text: `${days}d left`,
        color: "text-amber-600 bg-amber-50",
        ring: "ring-amber-200",
      };
    return { text: `${days}d`, color: "text-gray-400 bg-gray-50", ring: "" };
  };

  const catCounts = useMemo(() => {
    const counts = { all: items.length };
    categorizedItems.forEach((i) => {
      counts[i._category] = (counts[i._category] || 0) + 1;
    });
    return counts;
  }, [categorizedItems, items.length]);

  return (
    <div className="min-h-screen bg-gradient-mesh pt-14">
      <header className="glass sticky top-14 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">My Pantry</h1>
            {items.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary !px-4 !py-2 text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card p-5 mb-4">
                <h3 className="font-bold text-gray-900 mb-3">Add Ingredient</h3>
                <form onSubmit={handleAdd} className="space-y-3">
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Ingredient name *"
                    required
                    className="input-field"
                  />
                  <div className="flex gap-2">
                    <input
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                      placeholder="Quantity"
                      className="flex-1 input-field"
                    />
                    <input
                      value={form.unit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unit: e.target.value }))
                      }
                      placeholder="Unit (g, cups...)"
                      className="flex-1 input-field"
                    />
                  </div>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAt: e.target.value }))
                    }
                    className="input-field text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="btn-primary w-full"
                  >
                    {addMutation.isPending ? "Adding..." : "Add to Pantry"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expiry Alert */}
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="flex gap-2 mb-4">
            {expiredCount > 0 && (
              <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {expiredCount} expired
                </span>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  {expiringCount} expiring soon
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {items.length > 0 && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search pantry..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        )}

        {/* Category Filters */}
        {items.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 -mx-1 px-1 scrollbar-hide">
            {CATEGORIES.filter((c) => c.id === "all" || catCounts[c.id]).map(
              (cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-primary/30"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                  {catCounts[cat.id] ? (
                    <span
                      className={`text-[10px] ${activeCategory === cat.id ? "text-white/70" : "text-gray-400"}`}
                    >
                      ({catCounts[cat.id]})
                    </span>
                  ) : null}
                </button>
              ),
            )}
          </div>
        )}

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">🛒</div>
            <p className="font-bold text-lg text-gray-700">
              Your pantry is empty
            </p>
            <p className="text-sm mt-2 text-gray-400">
              Add ingredients to get personalized recipe suggestions!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add Your First Ingredient
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">No items match your filter</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 pb-6"
          >
            {filteredItems.map((item) => {
              const expiry = getExpiryInfo(item.expiresAt);
              const catData =
                CATEGORIES.find((c) => c.id === item._category) ||
                CATEGORIES[6];
              return (
                <motion.div
                  key={item._id}
                  variants={itemAnim}
                  className={`bg-white rounded-2xl border border-gray-100 p-4 relative group hover:shadow-card-hover transition-all ${expiry?.ring ? `ring-1 ${expiry.ring}` : ""}`}
                >
                  <button
                    onClick={() => deleteMutation.mutate(item._id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-lg mb-2">{catData.emoji}</div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                    {item.name}
                  </p>
                  {(item.quantity || item.unit) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.quantity} {item.unit}
                    </p>
                  )}
                  {expiry && (
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${expiry.color}`}
                    >
                      {expiry.text}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
