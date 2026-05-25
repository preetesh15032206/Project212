import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Line, 
  ComposedChart,
  ReferenceLine
} from "recharts";
import { PredictionRecord } from "../types";
import { format, parseISO } from "date-fns";

interface ForecastChartProps {
  data: PredictionRecord[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  // Find the exact "now" threshold where actual data stops
  const nowIndex = data.findIndex(d => d.actual_temp === null);
  const nowIso = nowIndex !== -1 && data[nowIndex - 1] ? data[nowIndex - 1].timestamp : undefined;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full h-[400px] flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Temperature Forecast</h2>
          <p className="text-sm text-slate-400">Actual measurements vs Model Predictions (48h)</p>
        </div>
        <div className="flex gap-4 mt-3 sm:mt-0 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400" />
            <span className="text-slate-300">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-slate-300">Predicted</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(val) => format(parseISO(val), "HH:mm")}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}°`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
              labelFormatter={(label) => format(parseISO(label as string), "MMM d, yyyy HH:mm")}
            />
            
            {/* Draw a vertical line denoting "Now" */}
            {nowIso && (
              <ReferenceLine 
                x={nowIso} 
                stroke="#64748b" 
                strokeDasharray="3 3" 
                label={{ position: "top", value: "NOW", fill: "#94a3b8", fontSize: 10 }} 
              />
            )}

            <Area 
              type="monotone" 
              dataKey="actual_temp" 
              name="Actual (°C)"
              stroke="#38bdf8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="predicted_temp" 
              name="Predicted (°C)"
              stroke="#fb7185" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
