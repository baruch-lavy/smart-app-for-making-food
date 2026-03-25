import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ChefHat, Mail, Lock, User, AlertCircle } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const loginMutation = useMutation({
    mutationFn: (data) => api.post("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      // always navigate to mode selection; onboarding flow remains available
      navigate("/mode");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data) => api.post("/auth/register", data).then((r) => r.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate("/onboarding");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === "login")
      loginMutation.mutate({ email: form.email, password: form.password });
    else registerMutation.mutate(form);
  };

  const mutation = tab === "login" ? loginMutation : registerMutation;
  const error =
    mutation.error?.response?.data?.message || mutation.error?.message;

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="card-glass w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow-primary">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CookSmart</h1>
            <p className="text-sm text-gray-500">
              Your personal cooking assistant
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-primary" : "text-gray-500"}`}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-3 input-field"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-3 input-field"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-3 input-field"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full"
          >
            {mutation.isPending
              ? "Please wait..."
              : tab === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
