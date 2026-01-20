# Use a smaller base image
FROM python:3.10

# Set working directory
WORKDIR /app

# System deps (optional): uncomment if you need build tools for wheels
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential gcc \
#  && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better layer caching
COPY requirements.txt .
# Use BuildKit cache if available; fallback to no-cache
# syntax=docker/dockerfile:1.6
# RUN --mount=type=cache,target=/root/.cache/pip \
#     pip install -r requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Create directories for uploads and Prometheus multiproc metrics
# Avoid 777; set proper ownership instead.
RUN mkdir -p /app/img /prometheus/tmp \
 && adduser --disabled-password --gecos "" appuser \
 && chown -R appuser:appuser /app /prometheus

# Environment: keep it minimal and relevant
ENV PYTHONUNBUFFERED=1
ENV PROMETHEUS_MULTIPROC_DIR=/prometheus/tmp

# Expose the application port
EXPOSE 8000

# Drop privileges
USER appuser

# Gunicorn: tune workers based on CPU count at runtime if desired.
# For CPU-bound Flask, gthread won't beat GIL; threads can still help with I/O.
# Consider starting with workers=2*CPU+1 and threads=1~2.
# Add sane timeouts and log to stdout.
CMD ["gunicorn", \
     "--workers", "5", \
     "--threads", "2", \
     "--timeout", "60", \
     "--graceful-timeout", "30", \
     "--keep-alive", "5", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--bind", "0.0.0.0:8000", \
     "--worker-class", "gthread", \
     "app:app"]
