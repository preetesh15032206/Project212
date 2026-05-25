import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { subHours, format, addHours } from "date-fns";
import { PredictionRecord, EvalRecord } from "./types";

/**
 * Utility to merge Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate mock time-series data for the chart.
 * Uses a sine wave to simulate daily temperature cycles (peaks midday, drops at night).
 */
export function generateMockPredictions(hours: number = 48): PredictionRecord[] {
  const data: PredictionRecord[] = [];
  const now = new Date();
  
  // Base temperature offset
  const baseTemp = 25; 

  for (let i = hours; i >= -12; i--) {
    const time = subHours(now, i);
    // Rough sine wave simulating 24-hr daily cycle (in radians, adjust phase so peak is around 2PM/14:00)
    const hourOfDay = time.getHours();
    const cycle = Math.sin((hourOfDay - 8) * (Math.PI / 12)); 
    
    // Noise to make it look like real weather
    const actualNoise = (Math.random() - 0.5) * 3;
    const predictNoise = (Math.random() - 0.5) * 2;
    
    const actual = baseTemp + cycle * 8 + actualNoise;
    // Predictions tend to smooth out extreme noise
    const predicted = baseTemp + cycle * 8 + predictNoise;

    data.push({
      timestamp: time.toISOString(),
      // Future data points shouldn't have an actual temperature yet
      actual_temp: i < 0 ? null : Number(actual.toFixed(1)),
      predicted_temp: Number(predicted.toFixed(1)),
    });
  }
  return data;
}

/**
 * Generate mock evaluation history records
 */
export function generateMockEvalHistory(): EvalRecord[] {
  const history: EvalRecord[] = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    // Airflow runs every 6 hours
    const runTime = subHours(now, i * 6);
    
    // Simulate slight model drift over time (older runs subtly worse, or just varied)
    const maeBase = 1.2 + (Math.random() * 0.5 - 0.2);
    const rmseBase = maeBase + 0.5 + (Math.random() * 0.3);
    
    history.push({
      run_at: runTime.toISOString(),
      mae: Number(maeBase.toFixed(3)),
      rmse: Number(rmseBase.toFixed(3)),
      n_samples: 15400 + (Math.floor(Math.random() * 500)),
    });
  }
  
  return history;
}
