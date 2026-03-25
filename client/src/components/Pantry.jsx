import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";
import api from "../services/api";

export default function Pantry() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    expiresAt: "",
  });

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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => api.delete(`/pantry/${itemId}`),
    onSuccess: () => qc.invalidateQueries(["pantry"]),
  });

  const getExpiryClass = (expiresAt) => {
    if (!expiresAt) return "bg-white";
    const days = Math.floor((new Date(expiresAt) - Date.now()) / 86400000);
    if (days < 0) return "bg-red-50 border-red-200";
    if (days <= 3) return "bg-orange-50 border-orange-200";
    return "bg-white";
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh pt-14">
      <header className="glass sticky top-14 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">My Pantry</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">Add Ingredient</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />{" "}
              {addMutation.isPending ? "Adding..." : "Add to Pantry"}
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-medium">Your pantry is empty.</p>
            <p className="text-sm mt-1">
              Add ingredients to get personalized suggestions!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const expiryClass = getExpiryClass(item.expiresAt);
              const daysLeft = item.expiresAt
                ? Math.floor((new Date(item.expiresAt) - Date.now()) / 86400000)
                : null;
              return (
                <div
                  key={item._id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${expiryClass}`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {(item.quantity || item.unit) && (
                      <p className="text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </p>
                    )}
                    {daysLeft !== null && (
                      <p
                        className={`text-xs mt-0.5 ${daysLeft < 0 ? "text-red-600" : daysLeft <= 3 ? "text-orange-600" : "text-gray-400"}`}
                      >
                        {daysLeft < 0
                          ? "Expired"
                          : daysLeft === 0
                            ? "Expires today"
                            : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(item._id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
