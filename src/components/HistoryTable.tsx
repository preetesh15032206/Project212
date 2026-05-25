import { EvalRecord } from "../types";
import { format, parseISO } from "date-fns";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface HistoryTableProps {
  history: EvalRecord[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-200">Model Evaluation History</h2>
        <p className="text-sm text-slate-400">Automated Pipeline Runs (Airflow)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Run Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">MAE (°C)</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">RMSE (°C)</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Samples Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.map((record) => {
              const maeIsGood = record.mae < 1.5;
              const rmseIsGood = record.rmse < 2.0;

              return (
                <tr key={record.run_at} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-300 font-medium">
                    {format(parseISO(record.run_at), "MMM d, yyyy · HH:mm 'UTC'")}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={maeIsGood ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                        {record.mae.toFixed(3)}
                      </span>
                      {maeIsGood ? 
                        <CheckCircle2 strokeWidth={2.5} className="w-4 h-4 text-emerald-500/70 opacity-0 group-hover:opacity-100 transition-opacity" /> : 
                        <AlertCircle strokeWidth={2.5} className="w-4 h-4 text-rose-500/70" />
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <span className={rmseIsGood ? "text-slate-300 font-mono" : "text-rose-400 font-mono"}>
                        {record.rmse.toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-400 font-mono">
                    {record.n_samples.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
