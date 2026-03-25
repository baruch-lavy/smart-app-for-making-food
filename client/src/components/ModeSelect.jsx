import React from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import api from "../services/api";

export default function ModeSelect() {
  const navigate = useNavigate();
  const setChildrenMode = useAppStore((s) => s.setChildrenMode);

  const choose = (withKids) => {
    setChildrenMode(!!withKids);
    api.put("/users/profile", { childrenMode: !!withKids }).catch(() => {});
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="card-glass max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-primary text-3xl">
          👨‍🍳
        </div>
        <h1 className="text-2xl font-bold mb-2">Who are you cooking with?</h1>
        <p className="text-gray-500 mb-6">
          Choose a mode to get recipes and steps tailored for you.
        </p>

        <div className="grid gap-4">
          <button onClick={() => choose(false)} className="btn-primary w-full">
            Cook alone
          </button>

          <button onClick={() => choose(true)} className="btn-secondary w-full">
            Cook with children
          </button>
        </div>
      </div>
    </div>
  );
}
