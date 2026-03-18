"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Loader2, Wallet, X } from "lucide-react";
import { CopyAddressButton } from "@/components/CopyAddressButton";
import { shortenAddress } from "@/lib/stellar";
import { useWallet } from "@/hooks/useWallet";

export function ConnectWalletButton() {
  const {
    address,
    connectWallet,
    disconnectWallet,
    error,
    isConnected,
    isConnecting,
    wallets,
    selectedWalletId,
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  async function handleConnect(walletId: string) {
    try {
      await connectWallet(walletId);
      setIsOpen(false);
    } catch {
      // Error state is shown in the modal.
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-highlight shadow-[0_0_12px_var(--color-highlight)]" />
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-muted">
              {selectedWalletId ?? "wallet"}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {shortenAddress(address)}
            </p>
          </div>
          <CopyAddressButton address={address} />
        </div>
        <button
          onClick={disconnectWallet}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted transition-all hover:bg-card hover:text-foreground"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em]"
      >
        {isConnecting ? <Loader2 className="animate-spin" size={14} /> : <Wallet size={14} />}
        Connect Wallet
        <ChevronDown size={14} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 z-[60] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-background/95 p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-highlight">
                    Wallet Auth
                  </p>
                  <h2 className="mt-3 text-2xl font-black uppercase text-white">
                    Choose Your Wallet
                  </h2>
                  <p className="mt-3 text-sm text-white/60">
                    Freighter, Albedo, and xBull are supported for Agentro on Stellar testnet.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl border border-white/10 p-3 text-muted transition-colors hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-8 space-y-3">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={isConnecting || !wallet.isAvailable}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-white">
                        {wallet.name}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                        {wallet.isAvailable ? "Ready to connect" : "Not installed"}
                      </p>
                    </div>
                    {wallet.isAvailable ? (
                      <CheckCircle2 className="text-highlight" size={18} />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                        Install
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
