"""
dag.py — Airflow DAG for the Environmental Data Pipeline.
Schedule: every 6 hours.
Tasks: ingest → preprocess+store → train/retrain → predict → log metrics
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Make scripts importable inside Airflow
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import ingest as ingest_module
import model  as model_module

# ── Default args ───────────────────────────────────────────────────────────────

default_args = {
    "owner":            "preetesh",
    "depends_on_past":  False,
    "email_on_failure": False,
    "retries":          2,
    "retry_delay":      timedelta(minutes=5),
}

# ── Task functions ─────────────────────────────────────────────────────────────

def task_ingest(**context):
    """Task 1: Pull fresh data from Open-Meteo API and store raw rows in SQLite."""
    df = ingest_module.run()
    context["ti"].xcom_push(key="rows_ingested", value=len(df))
    print(f"[DAG] Ingested {len(df)} rows.")


def task_train(**context):
    """Task 2: Retrain RandomForest on all available data, log MAE + RMSE."""
    model, scaler = model_module.train()
    if model is None:
        raise ValueError("Training failed — not enough data.")
    print("[DAG] Model retrained and saved.")


def task_predict(**context):
    """Task 3: Run inference on latest data point, push result to XCom."""
    pred = model_module.predict_latest()
    if pred is not None:
        context["ti"].xcom_push(key="next_hour_temp", value=round(pred, 2))
        print(f"[DAG] Prediction pushed: {pred:.2f}°C")


def task_log_summary(**context):
    """Task 4: Pull XCom values and print a run summary."""
    ti           = context["ti"]
    rows         = ti.xcom_pull(task_ids="ingest_weather",  key="rows_ingested")
    prediction   = ti.xcom_pull(task_ids="predict_latest",  key="next_hour_temp")
    print("=" * 50)
    print(f"[DAG SUMMARY] Run time : {datetime.utcnow().isoformat()}")
    print(f"[DAG SUMMARY] New rows ingested : {rows}")
    print(f"[DAG SUMMARY] Next-hour temp forecast : {prediction}°C")
    print("=" * 50)


# ── DAG definition ─────────────────────────────────────────────────────────────

with DAG(
    dag_id          = "env_data_pipeline",
    default_args    = default_args,
    description     = "Ingest → Feature Engineer → Retrain → Predict (every 6h)",
    schedule_interval = "0 */6 * * *",   # every 6 hours
    start_date      = datetime(2025, 1, 1),
    catchup         = False,
    tags            = ["etl", "ml", "environmental", "airflow"],
) as dag:

    t1_ingest = PythonOperator(
        task_id         = "ingest_weather",
        python_callable = task_ingest,
        provide_context = True,
    )

    t2_train = PythonOperator(
        task_id         = "retrain_model",
        python_callable = task_train,
        provide_context = True,
    )

    t3_predict = PythonOperator(
        task_id         = "predict_latest",
        python_callable = task_predict,
        provide_context = True,
    )

    t4_summary = PythonOperator(
        task_id         = "log_summary",
        python_callable = task_log_summary,
        provide_context = True,
    )

    # Pipeline order: ingest → retrain → predict → summary
    t1_ingest >> t2_train >> t3_predict >> t4_summary
