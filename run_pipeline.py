"""
run_pipeline.py — Run the full pipeline locally WITHOUT Airflow.
Use this to test everything works before setting up Airflow.

Usage:
    python run_pipeline.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "scripts"))

import ingest as ingest_module
import model  as model_module

def run():
    print("\n" + "="*55)
    print("  ENVIRONMENTAL DATA PIPELINE — LOCAL RUN")
    print("="*55)

    print("\n[STEP 1] Ingesting data from Open-Meteo API...")
    df = ingest_module.run()
    print(f"         ✓ {len(df)} rows available in DB")

    print("\n[STEP 2] Training / retraining ML model...")
    model, scaler = model_module.train()
    if model is None:
        print("         ✗ Training failed — need more data")
        return
    print("         ✓ Model trained and saved to model.joblib")

    print("\n[STEP 3] Running latest prediction...")
    pred = model_module.predict_latest()
    print(f"         ✓ Next-hour temperature: {pred:.2f}°C")

    print("\n[STEP 4] Backend Migration Complete.")
    print("         → The dashboard is now managed by Express and React.")
    print("         → Run 'npm run start' to launch the Express API and Dashboard.")

if __name__ == "__main__":
    run()
