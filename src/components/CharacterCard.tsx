import React from "react";
import { Character } from "../types";
import { cn } from "../lib/utils";
import { User, Briefcase, MapPin, Activity, Smile, FileText } from "lucide-react";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const getMoodColor = (mood: string) => {
    if (mood.includes("開心") || mood.includes("平靜")) return "text-emerald-500";
    if (mood.includes("煩躁") || mood.includes("生氣")) return "text-red-500";
    if (mood.includes("疲憊")) return "text-amber-500";
    return "text-blue-500";
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {character.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{character.name}</h3>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {character.role}
            </span>
          </div>
        </div>
        <div className={cn("text-sm font-medium flex items-center gap-1", getMoodColor(character.mood))}>
          <Smile className="w-4 h-4" />
          {character.mood}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="font-medium">位置:</span> {character.location}
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="font-medium">動作:</span> {character.current_action}
        </div>
        {character.notes && (
          <div className="flex items-start gap-2 text-gray-500 text-xs mt-2 bg-gray-50 p-2 rounded-lg">
            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
            {character.notes}
          </div>
        )}
      </div>
    </div>
  );
}
