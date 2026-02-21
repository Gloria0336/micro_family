import React, { useState } from "react";
import { Character } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Map, ArrowUpCircle, ArrowDownCircle, Layers } from "lucide-react";

interface FloorPlanProps {
  characters: Character[];
}

// Room coordinates for placing characters (center of the room)
const ROOM_COORDS: Record<string, { x: number; y: number; floor: "1F" | "2F" }> = {
  "廚房": { x: 100, y: 60, floor: "1F" },
  "浴廁": { x: 320, y: 60, floor: "1F" },
  "客廳": { x: 120, y: 210, floor: "1F" },
  // Stairs area on 1F for visual context, usually characters aren't "in" stairs but moving through
  "樓梯": { x: 340, y: 210, floor: "1F" }, 

  "主臥室": { x: 100, y: 150, floor: "2F" },
  "兒童房": { x: 320, y: 75, floor: "2F" },
  "書房": { x: 320, y: 225, floor: "2F" },
};

export function FloorPlan({ characters }: FloorPlanProps) {
  const [currentFloor, setCurrentFloor] = useState<"1F" | "2F">("1F");

  // Filter characters on the current floor
  const visibleCharacters = characters.filter(
    (c) => ROOM_COORDS[c.location]?.floor === currentFloor
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-700">Blueprint View</h3>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => setCurrentFloor("1F")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1",
              currentFloor === "1F"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ArrowDownCircle className="w-3 h-3" /> 1F
          </button>
          <button
            onClick={() => setCurrentFloor("2F")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1",
              currentFloor === "2F"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ArrowUpCircle className="w-3 h-3" /> 2F
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 relative bg-[#f0f4f8] flex items-center justify-center overflow-hidden">
        {/* Blueprint Container */}
        <div className="relative w-full max-w-[400px] aspect-[4/3] bg-white shadow-xl border-4 border-white">
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ 
              backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", 
              backgroundSize: "20px 20px" 
            }} 
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentFloor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {currentFloor === "1F" ? <Floor1SVG /> : <Floor2SVG />}
            </motion.div>
          </AnimatePresence>

          {/* Characters Layer */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {visibleCharacters.map((char, index) => {
                const coords = ROOM_COORDS[char.location] || { x: 200, y: 150 };
                // Add slight random offset so characters don't stack perfectly
                const offset = (index * 15) - (visibleCharacters.length * 7); 
                
                return (
                  <motion.div
                    key={char.name}
                    layoutId={`char-pin-${char.name}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      x: coords.x + offset, 
                      y: coords.y, 
                      scale: 1, 
                      opacity: 1 
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute top-0 left-0 -ml-5 -mt-5 w-10 h-10 pointer-events-auto cursor-help group z-20"
                  >
                    {/* Avatar Circle */}
                    <div className={cn(
                      "w-full h-full rounded-full border-2 shadow-md flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 bg-white",
                      char.mood.includes("開心") || char.mood.includes("平靜") ? "border-emerald-500 text-emerald-700" :
                      char.mood.includes("生氣") || char.mood.includes("煩躁") ? "border-rose-500 text-rose-700" :
                      "border-amber-500 text-amber-700"
                    )}>
                      {char.name[0]}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] bg-slate-900/90 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl backdrop-blur-sm">
                      <div className="font-bold text-indigo-300 mb-0.5">{char.name}</div>
                      <div className="text-slate-200 mb-1">{char.current_action}</div>
                      <div className="text-[10px] text-slate-400 italic border-t border-slate-700 pt-1 mt-1">
                        {char.mood}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90"></div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SVG Components for Floors ---

const Wall = ({ d }: { d: string }) => (
  <path d={d} fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="square" />
);

const ThinWall = ({ d }: { d: string }) => (
  <path d={d} fill="none" stroke="#94a3b8" strokeWidth="2" />
);

const Door = ({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) => (
  <g transform={`translate(${x},${y}) rotate(${rotate})`}>
    <path d="M0,0 L30,0 A30,30 0 0,1 0,30" fill="none" stroke="#94a3b8" strokeWidth="1" />
    <line x1="0" y1="0" x2="0" y2="30" stroke="#94a3b8" strokeWidth="2" />
  </g>
);

const Window = ({ x, y, w, h, rotate = 0 }: { x: number; y: number; w: number; h: number; rotate?: number }) => (
  <g transform={`translate(${x},${y}) rotate(${rotate})`}>
    <rect x="0" y="0" width={w} height={h} fill="white" stroke="none" />
    <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="#cbd5e1" strokeWidth="1" />
    <rect x="0" y="0" width={w} height={h} fill="none" stroke="#1e293b" strokeWidth="1" />
  </g>
);

const Label = ({ x, y, text }: { x: number; y: number; text: string }) => (
  <text x={x} y={y} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest select-none pointer-events-none">
    {text}
  </text>
);

const Floor1SVG = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full">
    {/* Floor Background */}
    <rect x="0" y="0" width="400" height="300" fill="#ffffff" />
    
    {/* Zones Background Colors (Subtle) */}
    <rect x="4" y="4" width="236" height="116" fill="#fff7ed" /> {/* Kitchen */}
    <rect x="244" y="4" width="152" height="116" fill="#ecfeff" /> {/* Bath */}
    <rect x="4" y="124" width="276" height="172" fill="#fffbeb" /> {/* Living */}
    <rect x="284" y="124" width="112" height="172" fill="#f1f5f9" /> {/* Stairs */}

    {/* Furniture: Kitchen */}
    <path d="M4,40 L40,40 L40,4" fill="none" stroke="#e2e8f0" strokeWidth="20" /> {/* Counter */}
    <circle cx="120" cy="60" r="20" fill="#e2e8f0" /> {/* Table */}
    <rect x="10" y="10" width="20" height="20" fill="#cbd5e1" /> {/* Sink/Stove */}

    {/* Furniture: Living Room */}
    <rect x="20" y="200" width="40" height="80" rx="4" fill="#e2e8f0" /> {/* Sofa */}
    <rect x="80" y="220" width="40" height="40" rx="2" fill="#e2e8f0" /> {/* Coffee Table */}
    <rect x="150" y="290" width="80" height="6" fill="#cbd5e1" /> {/* TV Unit */}

    {/* Furniture: Bathroom */}
    <rect x="360" y="10" width="30" height="50" rx="4" fill="#e2e8f0" /> {/* Tub */}
    <circle cx="270" cy="30" r="10" fill="#e2e8f0" /> {/* Toilet */}

    {/* Stairs */}
    <g transform="translate(290, 130)">
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1="0" y1={i * 20} x2="100" y2={i * 20} stroke="#cbd5e1" strokeWidth="1" />
      ))}
      <text x="50" y="80" textAnchor="middle" className="text-[10px] fill-slate-300 rotate-90">UP</text>
    </g>

    {/* Walls */}
    <Wall d="M2,2 L398,2 L398,298 L2,298 Z" /> {/* Outer Boundary */}
    <Wall d="M240,2 L240,120 L400,120" /> {/* Bath/Kitchen Separator */}
    <Wall d="M2,120 L280,120 L280,300" /> {/* Kitchen/Living Separator & Stairs Wall */}

    {/* Doors */}
    <Door x={200} y={120} rotate={90} /> {/* Kitchen to Living */}
    <Door x={240} y={80} rotate={90} /> {/* Bath Door */}
    <Door x={150} y={298} rotate={180} /> {/* Main Entrance (Bottom) */}

    {/* Windows */}
    <Window x={80} y={0} w={60} h={4} /> {/* Kitchen Window */}
    <Window x={300} y={0} w={40} h={4} /> {/* Bath Window */}
    <Window x={0} y={180} w={4} h={80} /> {/* Living Window Left */}
    <Window x={100} y={296} w={60} h={4} /> {/* Living Window Bottom */}

    {/* Labels */}
    <Label x={120} y={100} text="Kitchen" />
    <Label x={320} y={100} text="Bath" />
    <Label x={140} y={180} text="Living Room" />
    <Label x={340} y={280} text="Stairs" />
  </svg>
);

const Floor2SVG = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full">
    {/* Floor Background */}
    <rect x="0" y="0" width="400" height="300" fill="#ffffff" />

    {/* Zones Background */}
    <rect x="4" y="4" width="236" height="292" fill="#eef2ff" /> {/* Master Bed */}
    <rect x="244" y="4" width="152" height="146" fill="#fdf2f8" /> {/* Kids */}
    <rect x="244" y="154" width="152" height="142" fill="#f8fafc" /> {/* Study */}

    {/* Furniture: Master Bed */}
    <rect x="20" y="100" width="80" height="100" rx="2" fill="#e2e8f0" /> {/* Bed */}
    <rect x="10" y="10" width="100" height="30" fill="#cbd5e1" /> {/* Wardrobe */}
    <rect x="180" y="200" width="40" height="20" fill="#e2e8f0" /> {/* Desk */}

    {/* Furniture: Kids Room */}
    <rect x="340" y="10" width="50" height="80" rx="2" fill="#e2e8f0" /> {/* Bunk Bed */}
    <rect x="250" y="100" width="60" height="30" fill="#e2e8f0" /> {/* Desk */}

    {/* Furniture: Study */}
    <rect x="340" y="250" width="50" height="40" fill="#e2e8f0" /> {/* Desk */}
    <rect x="250" y="160" width="140" height="20" fill="#cbd5e1" /> {/* Bookshelf */}

    {/* Stairs Void/Landing */}
    <rect x="280" y="120" width="40" height="60" fill="none" stroke="#cbd5e1" strokeDasharray="4 4" />
    
    {/* Walls */}
    <Wall d="M2,2 L398,2 L398,298 L2,298 Z" /> {/* Outer */}
    <Wall d="M240,2 L240,300" /> {/* Vertical Split */}
    <Wall d="M240,150 L400,150" /> {/* Kids/Study Split */}

    {/* Doors */}
    <Door x={240} y={50} rotate={-90} /> {/* Kids Door */}
    <Door x={240} y={200} rotate={-90} /> {/* Study Door */}
    <Door x={240} y={250} rotate={90} /> {/* Master Door */}

    {/* Windows */}
    <Window x={0} y={120} w={4} h={60} /> {/* Master Window */}
    <Window x={300} y={0} w={50} h={4} /> {/* Kids Window */}
    <Window x={300} y={296} w={50} h={4} /> {/* Study Window */}

    {/* Labels */}
    <Label x={120} y={280} text="Master Bedroom" />
    <Label x={320} y={130} text="Kids Room" />
    <Label x={320} y={180} text="Study" />
  </svg>
);

