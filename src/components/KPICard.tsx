import { cn } from "../utils";
import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  unit: string;
  trend?: "good" | "bad" | "neutral";
  icon?: ReactNode;
  className?: string;
}

export function KPICard({ label, value, unit, trend, icon, className }: KPICardProps) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/50", className)}>
      {/* Decorative top gradient line */}
      <div 
        className={cn("absolute top-0 left-0 w-full h-[2px]", 
          trend === 'good' ? "bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" : 
          trend === 'bad' ? "bg-gradient-to-r from-rose-500/0 via-rose-400 to-rose-500/0" : 
          "bg-gradient-to-r from-sky-500/0 via-sky-400 to-sky-500/0"
        )} 
      />
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</h3>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <span className={cn("text-3xl font-bold tracking-tight", 
            trend === 'bad' ? "text-rose-400" : "text-sky-400"
        )}>
          {value}
        </span>
        <span className="text-sm text-slate-500 font-medium">{unit}</span>
      </div>
    </div>
  );
}
