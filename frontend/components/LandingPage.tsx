"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, TrendingUp, Wallet, Zap } from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useWallet } from "@/hooks/useWallet";

export function LandingPage() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center z-10 max-w-4xl px-6"
      >
        <div className="flex justify-center mb-10">
          <div className="p-5 glass-panel rounded-2xl relative group shadow-2xl">
            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <Zap className="text-white relative z-10" size={48} />
          </div>
        </div>

        <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter text-white uppercase italic">
          Agent<span className="text-gradient">ro</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted/60 mb-16 leading-tight font-black uppercase tracking-widest max-w-2xl mx-auto">
          Neural Trend Intelligence for the <span className="text-white">Next Generation</span> of Creators.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          {isConnected ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="btn-primary w-full sm:w-auto px-12 py-5 font-black text-[10px] tracking-[0.3em] uppercase flex items-center justify-center">
                Open Dashboard
                <ArrowRight className="ml-4" size={16} />
              </button>
            </Link>
          ) : (
            <div className="w-full sm:w-auto">
              <ConnectWalletButton />
            </div>
          )}

          <Link href="/bounties" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-12 py-5 glass-panel hover:bg-white/10 rounded-xl font-black text-[10px] tracking-[0.3em] uppercase transition-all border-white/5 shadow-2xl active:scale-95 flex items-center justify-center">
              <Wallet className="mr-4" size={16} />
              Explore Bounties
            </button>
          </Link>
        </div>

        {isConnected ? (
          <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-highlight font-black">
            Wallet session active
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.5 }}
        className="mt-32 flex flex-wrap justify-center gap-6 px-6"
      >
        {[
          { icon: TrendingUp, text: "Signal Intercept", color: "text-[#00D4FF]" },
          { icon: Sparkles, text: "Neural Hooks", color: "text-[#FF4ECD]" },
          { icon: Target, text: "Platform Sync", color: "text-[#7B5CFF]" },
        ].map((f, i) => (
          <div key={i} className="px-10 py-5 glass-panel rounded-xl flex items-center text-[9px] font-black uppercase tracking-[0.3em] border-white/5 shadow-xl bg-white/[0.02]">
            <f.icon className={`${f.color} mr-4`} size={18} />
            {f.text}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
