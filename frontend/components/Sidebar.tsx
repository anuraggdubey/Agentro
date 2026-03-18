"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Instagram, 
  Twitter, 
  Facebook, 
  Trophy,
  ScrollText,
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bounties", href: "/bounties", icon: ScrollText },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Instagram", href: "/instagram", icon: Instagram },
  { name: "X Strategy", href: "/x", icon: Twitter },
  { name: "Facebook", href: "/facebook", icon: Facebook },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 glass-panel rounded-lg text-primary"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileOpen || true) && (
          <motion.aside
            initial={false}
            animate={{ 
              width: isCollapsed ? 80 : 260,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "sticky top-0 left-0 h-screen z-40 glass-panel border-r-0 flex flex-col shrink-0",
              !isMobileOpen && "hidden lg:flex",
              isMobileOpen && "fixed !flex"
            )}
          >
            {/* Logo Section */}
            <div className="h-24 flex items-center px-6 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mr-3 shadow-[0_0_20px_rgba(123,92,255,0.4)] transition-transform hover:rotate-12">
                <Zap className="text-white fill-white" size={24} />
              </div>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-black tracking-tighter text-foreground"
                >
                  Agentro
                </motion.span>
              )}
            </div>
            
            {/* Nav Links */}
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "text-foreground font-black" 
                        : "text-muted hover:text-foreground hover:bg-card"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/10 to-transparent z-0 blur-sm"
                      />
                    )}
                    
                    <item.icon className={cn("shrink-0 z-10 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary filter drop-shadow-[0_0_8px_rgba(123,92,255,0.6)]" : "text-muted group-hover:text-primary")} size={18} />
                    
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-4 font-bold z-10 tracking-widest text-[10px] uppercase text-foreground/80 group-hover:text-foreground"
                      >
                        {item.name}
                      </motion.span>
                    )}
                    
                    {isActive && (
                      <motion.div
                        layoutId="active-glow"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_#7b5cff]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-full h-12 rounded-xl hover:bg-white/5 transition-all text-muted hover:text-white glass-panel border-none"
              >
                {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center space-x-2"><ChevronLeft size={16} /><span className="text-[10px] uppercase tracking-[0.2em] font-black">Collapse</span></div>}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
