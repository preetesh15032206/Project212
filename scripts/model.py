"""
model.py — Feature engineering, training, prediction, and evaluation.
Target: predict temperature 1 hour ahead.
"""

import sqlite3
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

DB_PATH    = os.path.join(os.path.dirname(__file__), "..", "pipeline.db")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model.joblib")
SCALER_PATH= os.path.join(os.path.dirname(__file__), "..", "scaler.joblib")


# ── Feature Engineering ────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # Time encodings
    df["hour"]       = df["timestamp"].dt.hour
    df["hour_sin"]   = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"]   = np.cos(2 * np.pi * df["hour"] / 24)
    df["dayofweek"]  = df["timestamp"].dt.dayofweek

    # Lag features (1h, 2h, 3h back)
    for lag in [1, 2, 3]:
        df[f"temp_lag_{lag}"]     = df["temperature"].shift(lag)
        df[f"humidity_lag_{lag}"] = df["humidity"].shift(lag)
        df[f"wind_lag_{lag}"]     = df["windspeed"].shift(lag)

    # Rolling averages (3h, 6h windows)
    df["temp_roll3"]  = df["temperature"].rolling(3).mean()
    df["temp_roll6"]  = df["temperature"].rolling(6).mean()
    df["humid_roll3"] = df["humidity"].rolling(3).mean()

    # Target: temperature 1 hour ahead
    df["target"] = df["temperature"].shift(-1)

    df.dropna(inplace=True)
    return df


FEATURE_COLS = [
    "temperature", "humidity", "windspeed", "precipitation", "apparent_temp",
    "hour_sin", "hour_cos", "dayofweek",
    "temp_lag_1", "temp_lag_2", "temp_lag_3",
    "humidity_lag_1", "humidity_lag_2", "humidity_lag_3",
    "wind_lag_1", "wind_lag_2", "wind_lag_3",
    "temp_roll3", "temp_roll6", "humid_roll3",
]


# ── Database helpers ───────────────────────────────────────────────────────────

def load_raw_data() -> pd.DataFrame:
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM raw_weather ORDER BY timestamp", conn)
    conn.close()
    return df


def save_predictions(df_feat: pd.DataFrame, preds: np.ndarray):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            timestamp TEXT PRIMARY KEY,
            actual_temp REAL,
            predicted_temp REAL,
            created_at TEXT
        )
    """)
    now = datetime.now(timezone.utc).isoformat()
    for idx, (_, row) in enumerate(df_feat.iterrows()):
        try:
            conn.execute(
                "INSERT INTO predictions VALUES (?,?,?,?)",
                (str(row["timestamp"]), row["target"], float(preds[idx]), now)
            )
        except sqlite3.IntegrityError:
            conn.execute(
                "UPDATE predictions SET actual_temp=?, predicted_temp=?, created_at=? WHERE timestamp=?",
                (row["target"], float(preds[idx]), now, str(row["timestamp"]))
            )
    conn.commit()
    conn.close()


def save_metrics(mae: float, rmse: float, n_samples: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS eval_log (
            run_at TEXT,
            mae REAL,
            rmse REAL,
            n_samples INTEGER
        )
    """)
    conn.execute(
        "INSERT INTO eval_log VALUES (?,?,?,?)",
        (datetime.now(timezone.utc).isoformat(), round(mae, 4), round(rmse, 4), n_samples)
    )
    conn.commit()
    conn.close()


# ── Train ──────────────────────────────────────────────────────────────────────

def train():
    print("[model] Loading raw data...")
    df_raw = load_raw_data()

    if len(df_raw) < 30:
        print("[model] Not enough data to train (need ≥30 rows). Run ingest first.")
        return None, None

    df = engineer_features(df_raw)
    X = df[FEATURE_COLS].values
    y = df["target"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, shuffle=False
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds_test = model.predict(X_test)
    mae  = mean_absolute_error(y_test, preds_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds_test))

    print(f"[model] MAE={mae:.3f}°C  RMSE={rmse:.3f}°C  (n={len(X_train)} train rows)")

    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    save_metrics(mae, rmse, len(df))

    # Save predictions for full dataset
    all_preds = model.predict(X_scaled)
    save_predictions(df, all_preds)

    return model, scaler


# ── Predict ────────────────────────────────────────────────────────────────────

def predict_latest():
    if not os.path.exists(MODEL_PATH):
        print("[model] No trained model found. Run train() first.")
        return None

    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    df_raw = load_raw_data()
    df     = engineer_features(df_raw)

    if df.empty:
        return None

    latest = df.iloc[[-1]]
    X = scaler.transform(latest[FEATURE_COLS].values)
    pred = model.predict(X)[0]
    print(f"[model] Next-hour temperature prediction: {pred:.2f}°C")
    return pred


if __name__ == "__main__":
    train()
    predict_latest()
