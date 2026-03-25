import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ChefHat, Sprout, Flame, Zap } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

const CUISINES = [
  "Italian",
  "Asian",
  "Mexican",
  "Mediterranean",
  "American",
  "Indian",
  "Japanese",
  "Greek",
  "French",
  "Thai",
];
const DIETARY = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
];
const DISLIKES = [
  "Cilantro",
  "Mushrooms",
  "Onions",
  "Garlic",
  "Spicy Food",
  "Seafood",
  "Red Meat",
  "Eggs",
];

const LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    icon: Sprout,
    desc: "I follow recipes step by step",
    color: "text-green-600 bg-green-50 border-green-200",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: Flame,
    desc: "I can improvise occasionally",
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: Zap,
    desc: "I cook by feel and creativity",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${active ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"}`}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("beginner");
  const [tastes, setTastes] = useState([]);
  const [dietary, setDietary] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);

  const mutation = useMutation({
    mutationFn: (data) => api.put("/users/profile", data).then((r) => r.data),
    onSuccess: (data) => {
      updateUser(data);
      navigate("/mode");
    },
  });

  const toggle = (arr, setArr, val) =>
    setArr((a) => (a.includes(val) ? a.filter((x) => x !== val) : [...a, val]));

  const steps = [
    {
      title: "🌟 Welcome to CookSmart!",
      subtitle:
        "Let's personalize your cooking experience in just a few steps.",
      content: (
        <div className="text-center py-4">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-12 h-12 text-primary" />
          </div>
          <p className="text-gray-600 text-lg">
            We'll ask you a few quick questions to tailor recipe suggestions
            just for you.
          </p>
        </div>
      ),
    },
    {
      title: "👨‍🍳 What is your cooking level?",
      subtitle: "This helps us suggest recipes at the right difficulty.",
      content: (
        <div className="grid gap-4">
          {LEVELS.map(({ value, label, icon: Icon, desc, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLevel(value)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${level === value ? "border-primary bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "🍽️ What cuisines do you love?",
      subtitle:
        "Select all that apply — we will prioritize these in suggestions.",
      content: (
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={tastes.includes(c)}
              onClick={() => toggle(tastes, setTastes, c)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "🥗 Any dietary restrictions?",
      subtitle: "We'll filter out recipes that don't fit your needs.",
      content: (
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((d) => (
            <Chip
              key={d}
              label={d}
              active={dietary.includes(d)}
              onClick={() => toggle(dietary, setDietary, d)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "😬 Anything you dislike?",
      subtitle: "We'll try to avoid these in your suggestions.",
      content: (
        <div className="flex flex-wrap gap-2">
          {DISLIKES.map((d) => (
            <Chip
              key={d}
              label={d}
              active={dislikes.includes(d)}
              onClick={() => toggle(dislikes, setDislikes, d)}
            />
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleFinish = () => {
    mutation.mutate({
      cookingLevel: level,
      tastePreferences: tastes,
      dietaryRestrictions: dietary,
      dislikes,
      onboardingComplete: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="card-glass w-full max-w-lg p-8">
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-medium mb-2">
          Step {step + 1} of {steps.length}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {current.title}
        </h2>
        <p className="text-gray-500 mb-6">{current.subtitle}</p>
        <div className="min-h-[200px]">{current.content}</div>
        {mutation.error && (
          <p className="text-red-500 text-sm mt-4">
            {mutation.error.response?.data?.message || "Something went wrong"}
          </p>
        )}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={mutation.isPending}
              className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : "Get Cooking! 🎉"}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-8 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
