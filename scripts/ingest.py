"""
ingest.py — Fetches real environmental data from Open-Meteo (free, no API key).
Location: Bhubaneswar, India (KIIT campus area)
"""

import requests
import pandas as pd
from datetime import datetime, timezone
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "pipeline.db")

LATITUDE = 20.3549
LONGITUDE = 85.8192

def fetch_weather() -> pd.DataFrame:
    """Fetch last 7 days of hourly weather data from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": "temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,apparent_temperature",
        "past_days": 7,
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }
    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    data = response.json()["hourly"]

    df = pd.DataFrame({
        "timestamp":          data["time"],
        "temperature":        data["temperature_2m"],
        "humidity":           data["relativehumidity_2m"],
        "windspeed":          data["windspeed_10m"],
        "precipitation":      data["precipitation"],
        "apparent_temp":      data["apparent_temperature"],
    })
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["ingested_at"] = datetime.now(timezone.utc).isoformat()
    df.dropna(inplace=True)
    return df


def save_to_db(df: pd.DataFrame):
    """Save raw data to SQLite, skipping duplicates by timestamp."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS raw_weather (
            timestamp TEXT PRIMARY KEY,
            temperature REAL,
            humidity REAL,
            windspeed REAL,
            precipitation REAL,
            apparent_temp REAL,
            ingested_at TEXT
        )
    """)
    inserted = 0
    for _, row in df.iterrows():
        try:
            conn.execute("""
                INSERT INTO raw_weather VALUES (?,?,?,?,?,?,?)
            """, (
                str(row["timestamp"]), row["temperature"], row["humidity"],
                row["windspeed"], row["precipitation"], row["apparent_temp"],
                row["ingested_at"]
            ))
            inserted += 1
        except sqlite3.IntegrityError:
            pass  # duplicate timestamp, skip
    conn.commit()
    conn.close()
    print(f"[ingest] Saved {inserted} new rows to raw_weather.")
    return inserted


def run():
    print("[ingest] Fetching weather data from Open-Meteo...")
    df = fetch_weather()
    print(f"[ingest] Fetched {len(df)} rows.")
    save_to_db(df)
    return df


if __name__ == "__main__":
    run()
