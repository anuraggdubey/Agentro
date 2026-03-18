"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Twitter, 
  Layers, 
  Zap,
  BarChart2,
  Loader2,
  ChevronDown,
  Sparkles,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { fetchTrends, generateStrategy } from "@/lib/api";

interface Trend {
  title: string;
  description: string;
  url: string;
}

interface Strategy {
  hook: string;
  idea: string;
  viralityScore: number;
  velocityIndex?: string;
  reachEstimate?: string;
  retentionSignal?: string;
}

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-white/5"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-white"
        />
      </svg>
      <span className="absolute text-xl font-black text-white">{value}%</span>
    </div>
  );
};

export default function XPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<string>("");
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Sports", "Tech", "Art", "Cinema"];

  useEffect(() => {
    async function loadTrends() {
      try {
        const data = await fetchTrends();
        setTrends(data.trends || []);
        if (data.trends?.length > 0) setSelectedTrend(data.trends[0].title);
      } catch (loadError) {
        console.error(loadError);
      }
    }
    loadTrends();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const data = await fetchTrends(searchQuery);
      setTrends(data.trends || []);
      if (data.trends?.length > 0) setSelectedTrend(data.trends[0].title);
    } catch (searchError) {
      console.error("Search failed", searchError);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setIsSearching(true);
    setTrends([]);
    try {
      const query = category === "All" ? "" : category;
      const data = await fetchTrends(query);
      setTrends(data.trends || []);
      if (data.trends?.length > 0) setSelectedTrend(data.trends[0].title);
    } catch (categoryError) {
      console.error("Category filter failed", categoryError);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTrend) return;
    setLoading(true);
    try {
      const data = await generateStrategy(selectedTrend, "x");
      setStrategy(data);
    } catch (generateError) {
      console.error(generateError);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-12 w-full">
      {/* Page Header */}
      <div className="flex items-center space-x-6">
        <div className="p-4 bg-white/10 glass-panel rounded-2xl shadow-xl border-white/20 transform hover:scale-105 transition-all duration-500">
          <Twitter className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">X <span className="text-gradient">Intelligence</span></h1>
          <p className="text-[10px] font-black text-muted/50 uppercase tracking-widest mt-1">Real-time viral thread forecasting & engagement signal analysis.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <form onSubmit={handleSearch} className="relative flex-[2] group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white transition-all duration-300" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query X Signals..." 
              className="w-full pl-14 pr-6 py-4 bg-card border border-border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 focus:bg-card/80 text-xs font-bold transition-all duration-300 placeholder:text-muted/30"
            />
          </form>

          <div className="relative flex-1 w-full group">
            <select 
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
              className="w-full appearance-none pl-6 pr-12 py-4 bg-card border border-border rounded-xl outline-none focus:border-primary/40 focus:bg-card/80 text-xs font-black uppercase tracking-widest cursor-pointer transition-all duration-300"
              disabled={isSearching}
            >
              {isSearching ? (
                <option>Syncing signals...</option>
              ) : (
                trends.map((t, i) => <option key={i} value={t.title} className="bg-background text-foreground">{t.title}</option>)
              )}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-muted pointer-events-none group-hover:text-white transition-colors" size={16} />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !selectedTrend}
            className="px-10 py-4 bg-white text-black hover:bg-neutral-200 rounded-xl font-black text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center whitespace-nowrap uppercase"
          >
            {loading ? <Loader2 className="animate-spin mr-3" size={16} /> : <Sparkles size={16} className="mr-3" />}
            Forge
          </button>
        </div>

        {/* Category Chips inside Control Panel */}
        <div className="mt-8 flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none border-t border-border/10 pt-8 relative z-10">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted mr-4">Intel Niche:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                selectedCategory === cat 
                  ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/10 scale-105" 
                  : "bg-card border-border text-muted hover:border-primary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Thread Velocity", value: strategy?.velocityIndex || "Mach 2.1", icon: Zap, label: "Fast Pulse", color: "text-primary" },
          { title: "Network Reach", value: strategy?.reachEstimate || "2.4M+", icon: Layers, label: "Saturation", color: "text-highlight" },
          { title: "Viral Velocity", value: strategy?.retentionSignal || "88%", icon: BarChart2, label: "Sentiment", color: "text-secondary" },
        ].map((card, i) => (
          <div key={i} className="glass-panel p-8 rounded-2xl group transition-all duration-500 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted/40">{card.title}</p>
              <div className={`p-3 bg-white/5 rounded-xl ${card.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 shadow-inner`}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-2xl font-black text-white">{card.value}</p>
              <span className="text-[8px] text-white/50 font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-md uppercase tracking-widest shadow-xl">
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Strategy Output Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl relative group">
        <div className="p-1 px-10 py-6 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/[0.02]">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <Sparkles className="text-secondary" size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tighter text-white uppercase">Neural Thread <span className="text-gradient">Synthesis</span></h2>
          </div>
          {strategy && (
            <button 
              onClick={() => copyToClipboard(`${strategy.hook}\n\n${strategy.idea}`)}
              className="p-3 glass-panel rounded-xl hover:bg-white/10 transition-all text-muted hover:text-white border-none shadow-lg active:scale-95"
            >
              {copied ? <Check size={18} className="text-highlight" /> : <Copy size={18} />}
            </button>
          )}
        </div>

        <div className="p-10 relative z-10">
          <AnimatePresence mode="wait">
            {strategy ? (
              <motion.div 
                key="strategy"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="p-10 rounded-2xl glass-panel border-white/5 bg-white/2 space-y-6 relative overflow-hidden group/hook">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 relative z-10 flex items-center">
                         Viral Anchor Alpha (Post #1)
                      </p>
                      <p className="text-3xl font-black italic leading-tight text-white relative z-10">&quot;{strategy.hook}&quot;</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/40 border-b border-white/5 pb-4">Thread Narrative Logic</p>
                      <p className="text-lg font-bold leading-relaxed text-white/80">{strategy.idea}</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary border-l-2 border-secondary pl-6">Signal Meta Analysis</p>
                      <div className="glass-panel p-8 rounded-xl border-white/5 bg-white/2 shadow-inner">
                        <p className="text-base text-white/50 italic leading-relaxed">
                          &quot;Optimized for algorithmic acceleration on {selectedTrend}.&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between space-y-12 lg:border-l lg:border-white/5 lg:pl-16">
                    <div className="space-y-8">
                      <div className="flex flex-col items-center justify-center p-10 glass-panel rounded-2xl border-white/5 bg-white/2 text-center relative overflow-hidden shadow-inner">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/40 mb-8">Reach Momentum</p>
                        <CircularProgress value={strategy.viralityScore} />
                        <div className="mt-10 w-full space-y-3">
                           <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted/40">
                              <span>Confidence Engine</span>
                              <span className="text-highlight">Stable</span>
                           </div>
                           <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-white shadow-[0_0_10px_white]" 
                              />
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <button className="w-full py-5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-200 active:scale-95 transition-all">
                        Commit To Forge
                      </button>
                      <p className="text-[8px] text-center text-muted/20 font-black uppercase tracking-[0.4em]">Agentro Core Oracle v4.1</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-8"
              >
                {loading ? (
                  <div className="space-y-6">
                    <div className="relative mb-10">
                       <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full animate-pulse" />
                       <Loader2 className="animate-spin text-white relative z-10 mx-auto" size={48} />
                    </div>
                    <p className="text-white font-black text-xl tracking-tighter uppercase animate-pulse">Forging Thread Narrative...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-10 glass-panel rounded-2xl bg-white/2 text-white/5 shadow-inner">
                      <Twitter size={60} />
                    </div>
                    <div className="max-w-md space-y-3">
                      <h3 className="text-xl font-black text-white tracking-widest uppercase">Forge Initialized</h3>
                      <p className="text-[10px] font-black text-muted/40 uppercase tracking-widest leading-relaxed">Awaiting signal selection to initiate high-conversion thread construction.</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
