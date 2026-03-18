"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Map, 
  ArrowUpRight, 
  Flame, 
  Globe,
  Filter,
  Loader2,
  Sparkles,
  Zap,
  Activity,
  ChevronRight
} from "lucide-react";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from "recharts";
import { fetchTrends, generateStrategy } from "@/lib/api";

const heatmapData = [
  { x: 10, y: 30, z: 200, name: "Tech" },
  { x: 20, y: 50, z: 400, name: "Fashion" },
  { x: 45, y: 10, z: 300, name: "AI" },
  { x: 30, y: 80, z: 150, name: "Travel" },
  { x: 70, y: 40, z: 500, name: "Crypto" },
  { x: 60, y: 60, z: 250, name: "Fitness" },
  { x: 80, y: 20, z: 350, name: "Politics" },
];

interface Trend {
  title: string;
  description: string;
  url: string;
}

interface Strategy {
  hook: string;
  idea: string;
  viralityScore: number;
  reasoning: string;
}

interface HeatmapPoint {
  x: number;
  y: number;
  z: number;
  name: string;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Sports", "Tech", "Art", "Cinema", "Business", "Health"];

  useEffect(() => {
    async function loadTrends() {
      try {
        setLoading(true);
        const data = await fetchTrends();
        setTrends(data.trends || []);
      } catch {
        setError("Unable to fetch trends right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTrends([]);
    try {
      const data = await fetchTrends(searchQuery);
      setTrends(data.trends || []);
    } catch {
      setError("Search failed. Please try again.");
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
    } catch {
      setError("Failed to filter trends.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrendClick = async (trend: Trend) => {
    setSelectedTrend(trend.title);
    setGenerating(true);
    setStrategy(null);
    try {
      const data = await generateStrategy(trend.title, "general");
      setStrategy(data);
    } catch (generateError) {
      console.error(generateError);
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center tracking-tighter text-foreground uppercase">
            <Globe className="mr-4 text-primary" size={28} />
            Global <span className="text-gradient ml-2">Intel Map</span>
          </h1>
          <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-2 px-3 py-1 bg-card rounded-md inline-block">Real-time Signal Sync</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-6 py-3 glass-panel rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-card transition-all border-none">
            <Filter className="mr-2" size={14} /> Refine Signals
          </button>
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-all duration-300" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Engine..." 
              className="pl-12 pr-6 py-3 bg-card border border-border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 focus:bg-card/80 text-xs font-bold tracking-tight transition-all duration-300 w-full md:w-64 placeholder:text-muted/30"
            />
          </form>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap border transition-all duration-300 ${
              selectedCategory === cat 
                ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(123,92,255,0.3)] scale-105" 
                : "bg-card border-border text-muted hover:text-foreground hover:border-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Heatmap Visualization */}
      <div className="glass-panel rounded-2xl p-10 relative overflow-hidden group shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6 relative z-10">
           <div className="flex items-center space-x-4">
            <div className="p-3 bg-highlight/10 rounded-xl shadow-inner shadow-highlight/20">
              <Map className="text-highlight" size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tighter text-foreground uppercase italic">Signal Density Matrix</h2>
          </div>
          <div className="flex items-center space-x-6 text-[8px] font-bold text-muted/40 uppercase tracking-[0.3em] bg-card backdrop-blur-md px-6 py-3 rounded-xl border border-border">
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-primary/40 mr-2 shadow-[0_0_10px_#7b5cff]" /> Satellite</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_10px_#7b5cff]" /> Primary</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-highlight mr-2 shadow-[0_0_15px_#00F5D4]" /> Core</div>
          </div>
        </div>

        <div className="h-[400px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis type="number" dataKey="x" name="Platform Overlap" unit="%" hide />
              <YAxis type="number" dataKey="y" name="Virality Velocity" unit="%" hide />
              <ZAxis type="number" dataKey="z" range={[200, 1500]} name="Volume" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-5 rounded-2xl border-border shadow-2xl bg-card">
                        <p className="text-foreground font-black tracking-widest mb-2 text-xs uppercase">{data.name}</p>
                        <div className="flex items-center space-x-2">
                           <Zap size={12} className="text-highlight" />
                           <p className="text-[10px] font-black text-muted/60 uppercase tracking-widest">Magnitude: <span className="text-highlight">{data.z}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Trends" 
                data={heatmapData}
                onClick={(data: { payload?: HeatmapPoint } | undefined) => {
                  if (data && data.payload) {
                    const point = data.payload;
                    // Try to find a matching trend in the API results or just use the name
                    const matchingTrend = trends.find(t => t.title.toLowerCase().includes(point.name.toLowerCase()));
                    if (matchingTrend) {
                      handleTrendClick(matchingTrend);
                    } else {
                      // Fallback for demo data
                      setSelectedTrend(point.name);
                      setGenerating(true);
                      setTimeout(() => {
                        setStrategy({
                          hook: `The ${point.name} Surge`,
                          idea: `Leverage the current ${point.name} momentum by creating high-frequency content nodes.`,
                          viralityScore: point.z / 10,
                          reasoning: "High signal density detected in recent platform sync."
                        });
                        setGenerating(false);
                      }, 1500);
                    }
                  }
                }}
              >
                {heatmapData.map((entry, index) => {
                  const isHighlighted = selectedCategory === "All" || entry.name === selectedCategory;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.z > 300 ? "#00F5D4" : "#7B5CFF"} 
                      className={`drop-shadow-[0_0_15px_rgba(123,92,255,0.4)] transition-all duration-500 cursor-pointer ${isHighlighted ? "opacity-100 scale-110" : "opacity-20 scale-90"}`}
                      style={{ filter: `blur(${entry.z < 250 ? '0.5px' : '0px'})` }}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(loading || isSearching) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-16 text-center rounded-2xl border-red-500/10 shadow-2xl">
          <p className="text-red-400 font-bold mb-6 text-sm uppercase tracking-widest">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-500/10 text-red-500 rounded-xl font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20">Reset Core</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trends.map((trend, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              onClick={() => handleTrendClick(trend)}
              className={`glass-panel p-8 rounded-2xl group cursor-pointer transition-all border-border flex flex-col shadow-xl ${
                selectedTrend === trend.title ? "border-primary/40 bg-card" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-highlight/10 rounded-xl shadow-inner shadow-highlight/20 group-hover:shadow-highlight/40 transition-all">
                  <Flame className="text-highlight fill-highlight/20" size={18} />
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black text-muted/40 uppercase tracking-widest mb-1">Status</span>
                  <span className="text-highlight font-black text-[10px] tracking-tighter uppercase">Apex Signal</span>
                </div>
              </div>
              <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-4 uppercase tracking-wide">
                {trend.title}
              </h3>
              <p className="text-xs font-medium text-muted/60 line-clamp-3 mb-6 flex-1 leading-relaxed">
                {trend.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                 <a 
                  href={trend.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[8px] font-black text-primary hover:text-white uppercase tracking-[0.3em] flex items-center bg-white/5 px-3 py-2 rounded-lg border border-primary/20 transition-all"
                >
                  View Trace <ArrowUpRight className="ml-2" size={10} />
                </a>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center space-x-2">
                   <Activity size={12} className="text-muted/40" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-muted/50">Core Power: <span className="text-white">94</span></span>
                </div>
                <div className="relative">
                   <span className="relative text-[8px] font-black uppercase px-3 py-1 rounded-md bg-primary text-white tracking-widest shadow-lg shadow-primary/20">
                    Active
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected Trend Strategy Modal/Section */}
      <AnimatePresence>
        {(selectedTrend || generating) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-panel rounded-2xl p-12 border-primary/20 shadow-2xl overflow-hidden relative group mt-12"
          >
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all" />
            
            {generating ? (
              <div className="flex flex-col items-center justify-center py-20 relative z-10">
                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="animate-spin text-white relative z-10" size={48} />
                </div>
                <p className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Analyzing Global Signals</p>
                <p className="text-muted/40 font-black uppercase tracking-[0.4em] text-[8px] animate-pulse">Agentro Compute Engine v4</p>
              </div>
            ) : strategy ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                <div className="space-y-10">
                  <div className="flex items-center space-x-6">
                    <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl">
                      <Sparkles className="text-white fill-white" size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-foreground mb-1 uppercase">{selectedTrend}</h2>
                      <div className="inline-flex items-center space-x-2 bg-card px-3 py-1 rounded-md border border-border">
                        <div className="w-1.5 h-1.5 bg-highlight rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">Strategy Optimized</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-10 rounded-2xl glass-panel border-border shadow-inner bg-card relative overflow-hidden group/hook">
                       <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-6 border-b border-primary/20 pb-4 inline-block">The Apex Hook</p>
                       <p className="text-2xl font-bold text-foreground italic leading-tight">&quot;{strategy.hook}&quot;</p>
                    </div>
                    
                    <div className="p-8 rounded-2xl bg-card border border-border">
                      <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] mb-4">Core Synthesis</p>
                      <p className="text-base font-medium text-foreground/70 leading-relaxed">{strategy.idea}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-10">
                  <div className="glass-panel p-10 rounded-2xl bg-card border-border shadow-2xl relative overflow-hidden group/stats">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <h3 className="text-lg font-black tracking-tighter text-foreground uppercase opacity-50">Virality Index</h3>
                      <div className="px-6 py-3 bg-background border border-highlight/30 text-highlight rounded-xl font-black text-3xl shadow-[0_0_20px_rgba(0,245,212,0.1)]">
                        {strategy.viralityScore}%
                      </div>
                    </div>
                    <p className="text-base font-medium italic text-muted leading-relaxed border-l-2 border-highlight/30 pl-8">
                       &quot;{strategy.reasoning}&quot;
                    </p>
                  </div>

                  <div className="flex gap-6 relative z-10">
                    <button className="btn-primary flex-1 py-6 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">
                       Deploy Intelligence <ChevronRight className="ml-3" size={20} />
                    </button>
                    <button 
                      onClick={() => { setSelectedTrend(null); setStrategy(null); }}
                      className="px-10 py-6 glass-panel rounded-xl font-black text-[10px] uppercase tracking-widest text-foreground hover:bg-card transition-all border-none"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
