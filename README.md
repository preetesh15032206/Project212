# Environmental Data Pipeline

**Python · Apache Airflow · SQLite · Scikit-learn · Node.js · Express · React · Tailwind CSS**

An end-to-end ETL pipeline that ingests real environmental sensor data, engineers features, trains a Random Forest forecasting model, auto-retrains on data drift, and serves results via a modern React + Express dashboard.

---

## 🚀 What's New
- **Upgraded Dashboard:** Ported the original Flask templates to a stunning, modern **React** Single-Page Application (SPA) built with **Vite** and **Tailwind CSS**.
- **Unified Backend:** An **Express.js** API seamlessly serves the frontend while fetching the latest machine learning evaluations and predictions from the SQLite DB.
- **Dockerized Ready:** A complete, single-container deployment setup via Docker.

---

## 🏗️ Architecture Stack
| Component | Technology | Purpose |
|------|---------|------|
| **Data Source** | Open-Meteo API | Real-time weather data pipeline |
| **Orchestration** | Apache Airflow | Scheduled data ingestion and retraining |
| **ML Engine** | Scikit-learn | Random Forest Regressor & evaluation logging |
| **Storage** | SQLite | Persistent edge-database for metrics & features |
| **Backend API** | Express + Node.js | Serves frontend & handles metric translation |
| **Frontend UI** | React + Tailwind CI | Modern interactive analytics dashboard |

---

## 💻 Local Development

### 1. Requirements
- Node.js 20+
- Python 3.10+

### 2. Install Dependencies
```bash
# Install Python dependencies for the pipeline
pip install -r requirements.txt

# Install Node dependencies for the dashboard
npm install
```

### 3. Run the ETL Pipeline (Once)
```bash
python run_pipeline.py
```

### 4. Start the Dashboard (Hot Reloading)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment (Render)

This repository includes a `render.yaml` Blueprint and a `Dockerfile`, making it zero-configuration to deploy on [Render](https://render.com).

### Quick Deploy:
1. Push this repository to your GitHub.
2. Go to your Render Dashboard -> **Blueprints** -> **New Blueprint Instance**.
3. Connect your repository.
4. Render will automatically detect the `render.yaml`, build the Dockerfile (combining Python Data pipelines + Node UI), and deploy it for free.

Alternatively, you can manually create a **New Web Service**:
- **Environment:** Docker
- **Build Command:** *(Docker handles this)*
- **Start Command:** *(Docker handles this)*

---

## Airflow Production Note
For local testing, `run_pipeline.py` executes the scripts sequentially. In a full production environment, place the `dags/` folder in your `$AIRFLOW_HOME` directory to orchestra periodic execution of the Python ingestion and model training scripts.
