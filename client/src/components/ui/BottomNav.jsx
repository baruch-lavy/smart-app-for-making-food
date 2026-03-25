import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Package, Calendar, ShoppingCart, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: ChefHat, label: "Home" },
  { to: "/pantry", icon: Package, label: "Pantry" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/shopping", icon: ShoppingCart, label: "Shop" },
  { to: "/profile", icon: User, label: "Profile" },
];

const HIDDEN_ON = ["/login", "/onboarding"];

export default function TopNav() {
  const location = useLocation();
  const path = location.pathname;

  if (HIDDEN_ON.includes(path)) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-white/30 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-around items-center py-1.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              path === item.to || (item.to === "/dashboard" && path === "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-colors duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 relative z-10 transition-colors duration-200 ${isActive ? "text-primary" : "text-gray-400"}`}
                />
                <span
                  className={`text-[10px] font-semibold relative z-10 transition-colors duration-200 ${isActive ? "text-primary" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
