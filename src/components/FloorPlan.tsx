import React, { useState } from "react";
import { Character } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Map, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface FloorPlanProps {
  characters: Character[];
}

const ROOMS = {
  "1F": [
    { id: "廚房", name: "廚房", className: "col-span-1 row-span-1 bg-orange-50 border-orange-200" },
    { id: "浴廁", name: "浴廁", className: "col-span-1 row-span-1 bg-cyan-50 border-cyan-200" },
    { id: "客廳", name: "客廳", className: "col-span-2 row-span-2 bg-amber-50 border-amber-200" },
  ],
  "2F": [
    { id: "書房", name: "書房", className: "col-span-1 row-span-1 bg-slate-50 border-slate-200" },
    { id: "兒童房", name: "兒童房", className: "col-span-1 row-span-1 bg-pink-50 border-pink-200" },
    { id: "主臥室", name: "主臥室", className: "col-span-2 row-span-2 bg-indigo-50 border-indigo-200" },
  ],
};

export function FloorPlan({ characters }: FloorPlanProps) {
  const [currentFloor, setCurrentFloor] = useState<"1F" | "2F">("1F");

  const getCharactersInRoom = (roomName: string) => {
    return characters.filter((char) => char.location === roomName);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-700">House View</h3>
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

      <div className="flex-1 p-6 relative bg-slate-50/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFloor}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 grid-rows-3 gap-4 h-full min-h-[300px]"
          >
            {ROOMS[currentFloor].map((room) => {
              const charsInRoom = getCharactersInRoom(room.name);
              
              return (
                <div
                  key={room.id}
                  className={cn(
                    "relative rounded-xl border-2 p-3 transition-colors flex flex-col",
                    room.className
                  )}
                >
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {room.name}
                  </span>
                  
                  <div className="flex flex-wrap gap-2 content-start">
                    <AnimatePresence>
                      {charsInRoom.map((char) => (
                        <motion.div
                          key={char.name}
                          layoutId={`char-${char.name}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="relative group cursor-help"
                        >
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-100 shadow-sm flex items-center justify-center text-sm font-bold text-indigo-600 hover:border-indigo-400 transition-colors z-10 relative">
                            {char.name[0]}
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-800 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                            <div className="font-bold mb-0.5">{char.name}</div>
                            <div className="text-slate-300">{char.current_action}</div>
                            <div className="arrow-down absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                          
                          {/* Mood Indicator */}
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]",
                            char.mood.includes("開心") || char.mood.includes("平靜") ? "bg-emerald-400" :
                            char.mood.includes("生氣") || char.mood.includes("煩躁") ? "bg-rose-400" :
                            "bg-amber-400"
                          )}>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
