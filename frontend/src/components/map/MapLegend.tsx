import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute bottom-6 left-6 z-[1000]">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs text-slate-300 max-w-[280px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between font-semibold text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Map Legend & Priority</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isOpen && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2">
            {/* Priority Colors */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Waste Request Priority
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
                  <span>Critical (Urgent)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>High Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Low</span>
                </div>
              </div>
            </div>

            {/* Infrastructure Entities */}
            <div className="pt-1 border-t border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Entities & Infrastructure
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-[10px]">
                    🚚
                  </span>
                  <span>Fleet Vehicle (Active / En-route)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-800 border border-emerald-400 flex items-center justify-center text-[10px]">
                    🗑️
                  </span>
                  <span>Smart IoT Bin (Telemetry)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-800 border border-purple-400 flex items-center justify-center text-[10px]">
                    🏭
                  </span>
                  <span>Waste Processing Plant (Disposal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-800 border border-sky-400 flex items-center justify-center text-[10px]">
                    🏢
                  </span>
                  <span>BKC Central Operations Depot</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
