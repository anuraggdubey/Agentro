"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/stellar";

export function Topbar() {
  const { address, isConnected } = useWallet();

  return (
    <header className="h-20 glass-panel border-b-0 border-t-0 border-r-0 border-l-0 sticky top-0 z-30 px-8 flex items-center justify-between w-full max-w-full overflow-hidden shrink-0 rounded-none shadow-none gap-6">
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-all duration-300" size={18} />
          <input
            type="text"
            placeholder="Search Intelligence Database..."
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 focus:bg-card/80 transition-all duration-300 text-xs font-bold tracking-wide placeholder:text-muted/40"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 text-foreground ml-auto">
        <ThemeToggle />
        <Link
          href="/dashboard"
          className="hidden md:inline-flex px-4 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground hover:bg-card transition-all"
        >
          Workspace
        </Link>

        <button className="relative p-3 text-muted hover:text-foreground transition-all duration-300 hover:bg-card rounded-2xl glass-panel border-none shadow-inner group">
          <Bell size={18} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full border-2 border-background shadow-[0_0_10px_var(--color-accent)]" />
        </button>

        <div className="flex items-center space-x-4 pl-4 md:pl-6 border-l border-white/10">
          {isConnected ? (
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90">
                {shortenAddress(address)}
              </p>
              <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-0.5 px-2 py-0.5 bg-white/5 rounded-md inline-flex items-center gap-1">
                <ShieldCheck size={10} />
                Wallet Verified
              </p>
            </div>
          ) : null}

          <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl">
            <ConnectWalletButton />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
