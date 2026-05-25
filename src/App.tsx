import { useEffect, useState } from "react";
import { KPICard } from "./components/KPICard";
import { ForecastChart } from "./components/ForecastChart";
import { HistoryTable } from "./components/HistoryTable";
import { PredictionRecord, EvalRecord } from "./types";
import { 
  Activity, 
  Target, 
  Database, 
  Clock, 
  LayoutDashboard, 
  LineChart as LineChartIcon,
  RefreshCw,
  Server
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pipeline'>('dashboard');
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [history, setHistory] = useState<EvalRecord[]>([]);
  const [latestRun, setLatestRun] = useState<EvalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [predsRes, metricsRes, latestRes] = await Promise.all([
        fetch('/api/data'),
        fetch('/api/metrics'),
        fetch('/api/latest_metric')
      ]);
      
      const preds = await predsRes.json();
      const metrics = await metricsRes.json();
      const latest = await latestRes.json();
      
      setPredictions(preds);
      setHistory(metrics);
      setLatestRun(latest);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30 w-full flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-64 border-r border-slate-800 bg-slate-950 flex flex-col transition-all">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800 shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-100 hidden md:block whitespace-nowrap">EnvioCast Monitor</span>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium text-sm hidden md:block">Realtime Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'pipeline' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LineChartIcon size={20} />
            <span className="font-medium text-sm hidden md:block">Evaluation History</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 group cursor-help">
            <Server size={18} />
            <div className="hidden md:flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold">Backend</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Express + SQLite API
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {activeTab === 'dashboard' ? 'Environmental Data Pipeline' : 'Pipeline Evaluation Runs'}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Apache Airflow · SQLite · Scikit-learn · Open-Meteo API
              </p>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-medium rounded-lg transition-colors text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Sync Data
            </button>
          </header>

          {isLoading ? (
             <div className="flex items-center justify-center h-64 text-slate-500">
                <RefreshCw className="animate-spin w-8 h-8 text-sky-500/50" />
             </div>
          ) : (
            <>
              {activeTab === 'dashboard' && latestRun && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* KPI Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                      label="Latest MAE" 
                      value={latestRun.mae.toFixed(3)} 
                      unit="°C" 
                      trend={latestRun.mae < 1.5 ? 'good' : 'bad'}
                      icon={<Target />}
                    />
                    <KPICard 
                      label="Latest RMSE" 
                      value={latestRun.rmse.toFixed(3)} 
                      unit="°C" 
                      trend={latestRun.rmse < 2.0 ? 'good' : 'bad'}
                      icon={<Target />}
                    />
                    <KPICard 
                      label="Training Samples" 
                      value={latestRun.n_samples.toLocaleString()} 
                      unit="records" 
                      trend="neutral"
                      icon={<Database />}
                    />
                    <KPICard 
                      label="Last Retrain" 
                      value={format(parseISO(latestRun.run_at), "HH:mm")} 
                      unit="UTC" 
                      trend="neutral"
                      icon={<Clock />}
                    />
                  </div>

                  {/* Time-Series Chart */}
                  <ForecastChart data={predictions} />
                  
                  <div className="text-sm text-slate-500 text-center pb-8">
                    Data refreshed every 6 hours via Airflow DAG. Current location config: Bhubaneswar, India.
                  </div>
                </div>
              )}

              {activeTab === 'pipeline' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <HistoryTable history={history} />
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
