"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Loader2, Trophy, Wallet } from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useWallet } from "@/hooks/useWallet";
import { getReadableError, getTopUsers, getUserStats, type LeaderboardUser, type UserStats } from "@/services/contractService";
import { shortenAddress } from "@/lib/stellar";

export default function LeaderboardPage() {
  const { address } = useWallet();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setStatus(null);
      const data = await getTopUsers(10);
      setLeaders(data);

      if (address) {
        const stats = await getUserStats(address);
        setCurrentUser(stats);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setStatus(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadLeaderboard();
    const interval = window.setInterval(loadLeaderboard, 15000);
    return () => window.clearInterval(interval);
  }, [loadLeaderboard]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Leader<span className="text-gradient">board</span>
          </h1>
          <p className="text-muted font-medium mt-1">
            Live AGT earnings and bounty completion rankings from Soroban.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      {currentUser ? (
        <section className="glass-panel rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-highlight/10 rounded-xl shadow-inner shadow-highlight/20">
              <Wallet className="text-highlight" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-white text-xs">
                Your Position
              </h2>
              <p className="text-sm text-white/60 mt-1">{shortenAddress(currentUser.user)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-card p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-muted">
                Total Earnings
              </p>
              <p className="mt-4 text-3xl font-black text-highlight">{currentUser.totalEarnings} AGT</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-muted">
                Bounties Completed
              </p>
              <p className="mt-4 text-3xl font-black text-white">{currentUser.bountiesCompleted}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="glass-panel rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl shadow-inner shadow-primary/20">
            <Trophy className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase text-white text-xs">
              Top Users
            </h2>
            <p className="text-sm text-white/60 mt-1">Ranked by total AGT earnings, then bounty wins.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-highlight" size={28} />
          </div>
        ) : (
          <div className="space-y-4">
            {leaders.map((leader) => {
              const isCurrentUser = Boolean(address) && leader.user === address;
              return (
                <div
                  key={leader.user}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border p-5 shadow-xl ${
                    isCurrentUser
                      ? "border-highlight/30 bg-highlight/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-lg font-black text-white">
                    {leader.rank <= 3 ? <Crown className="text-highlight" size={20} /> : `#${leader.rank}`}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-white">
                      {shortenAddress(leader.user)}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      {leader.bountiesCompleted} completed bounties
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-highlight">{leader.totalEarnings} AGT</p>
                    {isCurrentUser ? (
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        You
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {status ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm text-white/70">
            {status}
          </div>
        ) : null}
      </section>
    </div>
  );
}
