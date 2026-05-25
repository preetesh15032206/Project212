export interface PredictionRecord {
  timestamp: string;
  actual_temp: number | null;
  predicted_temp: number;
}

export interface EvalRecord {
  run_at: string;
  mae: number;
  rmse: number;
  n_samples: number;
}
