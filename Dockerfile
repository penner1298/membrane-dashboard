# Use official Python runtime as base
FROM python:3.9-slim

# Install system dependencies, Node.js, and npm (required for tsc / npx verification)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g typescript \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set default port environment variable
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start FastAPI application using uvicorn
CMD ["python", "membrane_backend_updated.py"]
