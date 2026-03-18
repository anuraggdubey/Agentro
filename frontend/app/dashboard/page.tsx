"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Instagram, 
  Twitter, 
  Facebook,
  ArrowUpRight,
  Zap,
  Loader2,
  X,
  Wallet,
  Trophy,
  Coins,
  ScrollText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { fetchTrends, generateStrategy } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import {
  getRecentActivity,
  getNativeXlmBalance,
  getTopUsers,
  getUserAgents,
  getUserStats,
} from "@/services/contractService";

const performanceData = [
  { name: "Mon", value: 4000 },
  { name: "Tue", value: 3000 },
  { name: "Wed", value: 5000 },
  { name: "Thu", value: 4500 },
  { name: "Fri", value: 6000 },
  { name: "Sat", value: 7000 },
  { name: "Sun", value: 5500 },
];

interface Trend {
  title: string;
  description: string;
  url: string;
}

interface Strategy {
  title: string;
  hook: string;
  idea: string;
  viralityScore: number;
  reasoning: string;
}

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTrend, setActiveTrend] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [balance, setBalance] = useState("0");
  const [agentCount, setAgentCount] = useState(0);
  const [userStats, setUserStats] = useState<{ totalEarnings: string; bountiesCompleted: number } | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ id: string; event: string; ledger: number; amount?: string }[]>([]);
  const [leaderboardPreview, setLeaderboardPreview] = useState<{ user: string; totalEarnings: string }[]>([]);

  const categories = ["All", "Sports", "Tech", "Art", "Cinema"];

  useEffect(() => {
    async function loadTrends() {
      try {
        setLoading(true);
        const data = await fetchTrends();
        setTrends(data.trends || []);
        if (data.trends?.length > 0) {
          setActiveTrend(data.trends[0].title);
        }
      } catch {
        setError("Failed to fetch trends.");
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, []);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalance("0");
      setAgentCount(0);
      setUserStats(null);
      return;
    }

    const connectedAddress = address;

    async function loadWalletData() {
      try {
        const [xlmBalance, agents, stats] = await Promise.all([
          getNativeXlmBalance(connectedAddress),
          getUserAgents(connectedAddress),
          getUserStats(connectedAddress),
        ]);
        setBalance(xlmBalance);
        setAgentCount(agents.length);
        setUserStats(stats);
      } catch (walletError) {
        console.error(walletError);
      }
    }

    loadWalletData();
  }, [address, isConnected]);

  useEffect(() => {
    async function loadChainPanels() {
      try {
        const [activity, leaders] = await Promise.all([getRecentActivity(6), getTopUsers(3)]);
        setRecentActivity(activity);
        setLeaderboardPreview(
          leaders.map((entry) => ({
            user: `${entry.user.slice(0, 4)}...${entry.user.slice(-4)}`,
            totalEarnings: entry.totalEarnings,
          })),
        );
      } catch (chainError) {
        console.error(chainError);
      }
    }

    loadChainPanels();
  }, []);

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const query = category === "All" ? "" : category;
      const data = await fetchTrends(query);
      setTrends(data.trends || []);
      if (data.trends?.length > 0) setActiveTrend(data.trends[0].title);
      } catch (categoryError) {
        console.error(categoryError);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeTrend) return;
    setGenerating(true);
    setStrategy(null);
    try {
      const data = await generateStrategy(activeTrend, "general");
      setStrategy(data);
      } catch (strategyError) {
      console.error(strategyError);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Analytics <span className="text-gradient">Intelligence</span></h1>
          <p className="text-muted font-medium mt-1">Global internet signals & strategy overview.</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-card backdrop-blur-md flex items-center justify-center text-[10px] font-black text-primary shadow-lg ring-1 ring-white/10">
                A{i}
              </div>
            ))}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 glass-panel hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none"
          >
            Refresh Intel
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Signals Card */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-8 space-y-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl shadow-inner shadow-primary/20">
                <TrendingUp className="text-primary" size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-foreground uppercase text-xs">Viral Signal Intensity</h2>
            </div>
            
            <div className="flex items-center space-x-2 p-1 glass-panel rounded-xl border-none bg-card">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(123,92,255,0.3)]" 
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B5CFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7B5CFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 900 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--color-background)", 
                    backdropFilter: "blur(24px) saturate(160%)",
                    border: "1px solid var(--color-border)", 
                    borderRadius: "16px",
                    color: "var(--color-foreground)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#7B5CFF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 glass-panel animate-pulse rounded-2xl" />)
            ) : error ? (
              <div className="col-span-3 text-center text-red-400 py-6 font-bold">{error}</div>
            ) : (
              trends.slice(0, 3).map((trend, i) => (
                <motion.div 
                  key={i}
                  onClick={() => setActiveTrend(trend.title)}
                  className={`p-6 rounded-2xl glass-card group cursor-pointer border-white/5 transition-all ${
                    activeTrend === trend.title ? "border-primary/40 bg-white/5 shadow-[0_0_20px_rgba(123,92,255,0.1)]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md uppercase tracking-widest border border-primary/20">
                      Rising
                    </div>
                    <ArrowUpRight className="text-muted group-hover:text-primary transition-colors" size={16} />
                  </div>
                  <h3 className="font-bold text-xs leading-tight text-foreground mb-4 line-clamp-2 uppercase tracking-wide">{trend.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-muted/60 border border-white/5">
                      Intel
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Platform Insights */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col shadow-2xl">
          <div className="flex items-center space-x-4 mb-10">
            <div className="p-3 bg-secondary/10 rounded-xl shadow-inner shadow-secondary/20">
              <Activity className="text-secondary" size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase text-xs">Platform IQ</h2>
          </div>

          <div className="flex-1 space-y-8">
            {[
              { icon: Instagram, name: "Instagram", value: 82, color: "bg-gradient-to-r from-[#FF4ECD] to-[#7B5CFF]" },
              { icon: Twitter, name: "X Trends", value: 64, color: "bg-gradient-to-r from-[#00D4FF] to-[#7B5CFF]" },
              { icon: Facebook, name: "Facebook", value: 45, color: "bg-gradient-to-r from-blue-600 to-blue-400" },
            ].map((p, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 glass-panel rounded-lg border-none bg-white/5">
                      <p.icon size={16} className="text-white/80" />
                    </div>
                    <span className="font-black text-muted tracking-widest uppercase text-[9px]">{p.name}</span>
                  </div>
                  <span className="font-black text-foreground text-base">{p.value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.value}%` }}
                    transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                    className={`h-full ${p.color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group shadow-inner">
              <Sparkles className="absolute -right-4 -top-4 text-primary/10 rotate-12 group-hover:scale-125 transition-transform duration-700" size={100} />
              <div className="relative z-10">
                <p className="text-[9px] font-black text-primary mb-2 uppercase tracking-widest">Growth Engine</p>
                <h3 className="text-lg font-black mb-6 text-white leading-tight">
                  {activeTrend ? activeTrend : "Select Signal"}
                </h3>
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !activeTrend}
                  className="btn-primary w-full py-4 font-black text-[10px] tracking-[0.2em] uppercase disabled:opacity-50"
                >
                  {generating ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Compute Strategy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Display */}
        <AnimatePresence>
          {strategy && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="lg:col-span-3 glass-panel rounded-2xl p-10 border-primary/20 relative shadow-2xl overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] rounded-full -mr-40 -mt-40" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 blur-[100px] rounded-full -ml-40 -mb-40" />
              
              <button 
                onClick={() => setStrategy(null)}
                className="absolute top-6 right-6 p-2 text-muted hover:text-white transition-all z-20"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center space-x-5">
                    <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
                      <Zap className="text-white fill-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">{strategy.title}</h2>
                      <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">AI Synthesis Complete</p>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl glass-panel border-white/5 shadow-inner bg-white/2">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-4">Viral Hook</p>
                    <p className="text-2xl font-bold text-white italic leading-tight">&quot;{strategy.hook}&quot;</p>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Strategy Overview</p>
                     <p className="text-sm text-white/70 leading-relaxed font-medium">{strategy.idea}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-8">
                  <div className="glass-panel p-8 rounded-2xl bg-white/2 border-white/5 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-black tracking-tight text-foreground uppercase opacity-50">Impact Score</h3>
                      <div className="px-6 py-2 bg-background border border-highlight/30 text-highlight rounded-xl font-black text-2xl shadow-[0_0_20px_rgba(0,245,212,0.1)]">
                        {strategy.viralityScore}%
                      </div>
                    </div>
                    <p className="text-sm font-medium text-white/60 leading-relaxed italic border-l-2 border-highlight/30 pl-6">
                      &quot;{strategy.reasoning}&quot;
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="btn-primary flex-1 py-5 font-black text-[10px] uppercase tracking-[0.2em]">
                      Deploy Strategy
                    </button>
                    <button className="px-8 py-5 glass-panel rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 border-none">
                       Archive
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Viral Ideas - Display top trends if no strategy selected */}
        {!strategy && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
             {loading ? (
                [1, 2].map(i => <div key={i} className="h-44 glass-panel animate-pulse rounded-2xl" />)
             ) : (
                trends.slice(0, 2).map((trend, i) => (
                  <div key={i} className="glass-panel rounded-2xl p-8 flex items-center justify-between group shadow-xl bg-white/2">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-[8px] px-2 py-0.5 rounded-md bg-highlight/10 text-highlight uppercase font-black tracking-widest border border-highlight/20">
                          Critical
                        </span>
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest opacity-40">Predictive Signal</span>
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight uppercase tracking-tight">{trend.title}</h3>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Zap className="text-highlight fill-highlight/20" size={14} />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Intensity Index</span>
                        </div>
                        <div className="text-highlight text-sm font-black">94.8</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTrend(trend.title); handleGenerate(); }}
                      className="ml-8 w-14 h-14 rounded-xl bg-white/5 glass-panel border-none text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl flex items-center justify-center"
                    >
                      <ArrowUpRight size={24} />
                    </button>
                  </div>
                ))
             )}
          </div>
        )}

        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8">
          <div className="glass-panel rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl shadow-inner shadow-primary/20">
                  <Wallet className="text-primary" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground uppercase text-xs">
                    Wallet Command Center
                  </h2>
                  <p className="text-muted font-medium mt-1">
                    {isConnected && address ? address : "Connect a Stellar wallet to unlock on-chain actions."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "XLM Balance", value: `${balance} XLM`, icon: Coins },
                { label: "Owned Agents", value: agentCount.toString(), icon: Activity },
                {
                  label: "Bounties Won",
                  value: userStats ? userStats.bountiesCompleted.toString() : "0",
                  icon: Trophy,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-muted">
                      {item.label}
                    </p>
                    <item.icon className="text-highlight" size={16} />
                  </div>
                  <p className="mt-5 text-2xl font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {userStats ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-card p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-muted">
                  Total Bounty Earnings
                </p>
                <p className="mt-3 text-lg font-black text-highlight">
                  {userStats.totalEarnings} XLM
                </p>
              </div>
            ) : null}
          </div>

          <div className="glass-panel rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-highlight/10 rounded-xl shadow-inner shadow-highlight/20">
                <ScrollText className="text-highlight" size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-foreground uppercase text-xs">
                Live Chain Feed
              </h2>
            </div>

            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white">
                      {item.event.replace("_", " ")}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted">
                      L{item.ledger}
                    </span>
                  </div>
                  {item.amount ? (
                    <p className="mt-2 text-sm text-highlight font-black">{item.amount} XLM</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/5 pt-8">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-muted mb-4">
                Leaderboard Snapshot
              </p>
              <div className="space-y-3">
                {leaderboardPreview.map((entry, index) => (
                  <div key={entry.user} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      #{index + 1} {entry.user}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-highlight">
                      {entry.totalEarnings} XLM
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
