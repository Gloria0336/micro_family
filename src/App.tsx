import React, { useState, useEffect, useRef } from "react";
import { simulationService } from "./services/simulation";
import { WorldState, INITIAL_STATE } from "./types";
import { CharacterCard } from "./components/CharacterCard";
import { FloorPlan } from "./components/FloorPlan";
import { Clock, Send, Play, Plus, Loader2, Sun, Thermometer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [state, setState] = useState<WorldState>(INITIAL_STATE);
  const [narrativeHistory, setNarrativeHistory] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize simulation
    const init = async () => {
      setIsLoading(true);
      try {
        const response = await simulationService.startSimulation();
        setNarrativeHistory([response.narrative]);
        setState(response.state);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to init:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narrativeHistory]);

  const handleAction = async (customInput?: string) => {
    const action = customInput || input;
    if (!action.trim() || isLoading) return;

    setIsLoading(true);
    setInput(""); // Clear input if it was used

    try {
      const response = await simulationService.processAction(action, state);
      setNarrativeHistory((prev) => [...prev, response.narrative]);
      setState(response.state);
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "推進 15 分鐘",
    "推進 1 小時",
    "爸爸回家了",
    "發生了爭吵",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel: Narrative & Controls */}
      <div className="flex-1 flex flex-col h-screen md:border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">MicroSim Family</h1>
              <p className="text-xs text-slate-500">Virtual World Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              {state.time}
            </div>
            <div className="w-px h-3 bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              {state.environment.weather}
            </div>
            <div className="w-px h-3 bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500" />
              {state.environment.temperature}
            </div>
          </div>
        </div>

        {/* Narrative Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {narrativeHistory.map((text, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={index}
              className="prose prose-slate max-w-none"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs font-mono text-slate-500 mt-1">
                  {index + 1}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-700 leading-relaxed shadow-sm border border-slate-100">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center mt-1">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-400 italic">
                正在推演世界線...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg transition-colors border border-slate-200"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
              placeholder="輸入指令 (例如: 媽媽開始做午餐...)"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => handleAction()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-md shadow-indigo-200 disabled:shadow-none flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">發送</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: World State */}
      <div className="w-full md:w-[400px] lg:w-[450px] bg-slate-50/50 border-l border-slate-200 h-[40vh] md:h-screen overflow-y-auto p-4 md:p-6">
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 pb-4 mb-2 border-b border-slate-200/50">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">World State</h2>
          <div className="text-xl font-bold text-slate-900">家庭成員狀態</div>
        </div>
        
        <div className="space-y-6">
          {/* Floor Plan */}
          <FloorPlan characters={state.characters} />

          {/* Character Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Characters</h3>
            <AnimatePresence>
              {state.characters.map((char) => (
                <motion.div
                  key={char.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <CharacterCard character={char} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Environment</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-slate-700 text-sm leading-relaxed">
              {state.environment.notes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
