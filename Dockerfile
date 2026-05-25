# Use Python 3.10 as the base image for our ETL pipeline
FROM python:3.10-slim

# Install system dependencies & Node.js 20.x
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React dashboard and Express server
RUN npm run build

# Run the single-pass ETL pipeline to fetch initial data and train the model
RUN python run_pipeline.py

# Expose the standard port used by Render/Express
EXPOSE 3000

# Start up the Express API + Dashboard
CMD ["npm", "start"]
