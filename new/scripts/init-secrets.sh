#!/usr/bin/env bash
# Purpose: Force-overwrite ./.env and ./backend/.env for this Compose stack.
# Behavior:
#   - If .env files are missing, copy from corresponding .env.example first.
#   - Always overwrite existing keys with desired values afterwards.
#   - Secrets can be fixed strings or auto-generated each run (see CONFIG section).
#   - Writes both project-level .env (Compose interpolation) and backend/.env (app).
# Requirements: POSIX sh, sed, grep, awk; openssl OR /dev/urandom+base64

set -eu

PROJECT_ENV="./.env"
PROJECT_ENV_EXAMPLE="./.env.example"
BACKEND_ENV="./backend/.env"
BACKEND_ENV_EXAMPLE="./backend/.env.example"

# =====================[ CONFIG: edit to your needs ]=====================
# For secrets: set to a fixed string OR "GENERATE" to rotate each run.

# MySQL
MYSQL_DATABASE="db"
MYSQL_USER="root"
MYSQL_ROOT_PASSWORD="GENERATE"   # or set a fixed password
MYSQL_PASSWORD="GENERATE"        # or set a fixed password

# MinIO (do NOT use 'minioadmin' defaults)
MINIO_ROOT_USER="GENERATE"       # or fixed access key
MINIO_ROOT_PASSWORD="GENERATE"   # or fixed secret key

# InfluxDB 1.x
INFLUXDB_DB="metrics"
INFLUXDB_ADMIN_USER="admin"
INFLUXDB_ADMIN_PASSWORD="GENERATE"   # or fixed
INFLUXDB_HTTP_AUTH_ENABLED="true"
INFLUXDB_HOST="influxdb"
INFLUXDB_PORT="8086"

# Backend app config
DB_HOST_FOR_CONTAINER="mysql"
SECRET_KEY="GENERATE"                 # Flask/Django secret, etc.
GEMINI_MODEL="gemini-2.5-flash"
GRAFANA_ADMIN_USER="GENERATE"
GRAFANA_ADMIN_PASSWORD="GENERATE"
DEFAULT_EPSG="3826"
MINIO_ENDPOINT="minio:9000"
MINIO_SECURE="false"
# =======================================================================

# ---------- helpers ----------
sedi() { if sed --version >/dev/null 2>&1; then sed -i "$1" "$2"; else sed -i '' "$1" "$2"; fi; }

ensure_file() {
  f="$1"
  [ -f "$f" ] || { umask 077; mkdir -p "$(dirname "$f")"; printf "# env for %s\n" "$(basename "$f")" >"$f"; }
}

copy_from_example_if_missing() {
  # $1 target .env, $2 example file
  target="$1"; example="$2"
  if [ ! -f "$target" ] && [ -f "$example" ]; then
    umask 077
    mkdir -p "$(dirname "$target")"
    cp "$example" "$target"
    printf '[INFO] Created %s from %s\n' "$target" "$example"
  fi
}

escape_sed() { printf '%s' "$1" | awk '{ gsub(/\\/,"\\\\"); gsub(/\//,"\\/"); gsub(/&/,"\\&"); print }'; }

put_kv_force() {
  # Upsert KEY=VALUE (overwrite if exists)
  f="$1"; key="$2"; val="$3"; escv="$(escape_sed "$val")"
  ensure_file "$f"
  if grep -q "^[#]*[[:space:]]*${key}=" "$f"; then
    sedi "s|^[#]*[[:space:]]*${key}=.*$|${key}=${escv}|" "$f"
  else
    printf '%s=%s\n' "$key" "$val" >>"$f"
  fi
}

rand_b64() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -base64 24 | tr -d '\n'
  else ( dd if=/dev/urandom bs=1 count=24 2>/dev/null | base64 ) | tr -d '\n'; fi
}

val_or_gen() { v="$1"; [ "$v" = "GENERATE" ] && rand_b64 || printf '%s' "$v"; }

# ---------- ensure files exist (copy from .env.example if available) ----------
copy_from_example_if_missing "$PROJECT_ENV" "$PROJECT_ENV_EXAMPLE"
copy_from_example_if_missing "$BACKEND_ENV" "$BACKEND_ENV_EXAMPLE"
ensure_file "$PROJECT_ENV"
ensure_file "$BACKEND_ENV"

# ---------- Overwrite project-level .env (Compose interpolation) ----------
put_kv_force "$PROJECT_ENV" "MYSQL_ROOT_PASSWORD" "$(val_or_gen "$MYSQL_ROOT_PASSWORD")"
put_kv_force "$PROJECT_ENV" "MYSQL_DATABASE"       "$MYSQL_DATABASE"
put_kv_force "$PROJECT_ENV" "MYSQL_USER"           "$MYSQL_USER"
put_kv_force "$PROJECT_ENV" "MYSQL_PASSWORD"       "$(val_or_gen "$MYSQL_PASSWORD")"

put_kv_force "$PROJECT_ENV" "MINIO_ROOT_USER"      "$(val_or_gen "$MINIO_ROOT_USER")"
put_kv_force "$PROJECT_ENV" "MINIO_ROOT_PASSWORD"  "$(val_or_gen "$MINIO_ROOT_PASSWORD")"

put_kv_force "$PROJECT_ENV" "INFLUXDB_DB"                 "$INFLUXDB_DB"
put_kv_force "$PROJECT_ENV" "INFLUXDB_ADMIN_USER"         "$INFLUXDB_ADMIN_USER"
put_kv_force "$PROJECT_ENV" "INFLUXDB_ADMIN_PASSWORD"     "$(val_or_gen "$INFLUXDB_ADMIN_PASSWORD")"
put_kv_force "$PROJECT_ENV" "INFLUXDB_HTTP_AUTH_ENABLED"  "$INFLUXDB_HTTP_AUTH_ENABLED"
put_kv_force "$PROJECT_ENV" "INFLUXDB_HOST"               "$INFLUXDB_HOST"
put_kv_force "$PROJECT_ENV" "INFLUXDB_PORT"               "$INFLUXDB_PORT"

put_kv_force "$PROJECT_ENV" "GRAFANA_ADMIN_USER"     "$(val_or_gen "$GRAFANA_ADMIN_USER")"
put_kv_force "$PROJECT_ENV" "GRAFANA_ADMIN_PASSWORD" "$(val_or_gen "$GRAFANA_ADMIN_PASSWORD")"

# ---------- Overwrite backend/.env (app-facing) ----------
put_kv_force "$BACKEND_ENV" "DB_HOST"       "$DB_HOST_FOR_CONTAINER"
put_kv_force "$BACKEND_ENV" "DB_DATABASE"   "$MYSQL_DATABASE"
put_kv_force "$BACKEND_ENV" "DB_USER"       "$MYSQL_USER"
# NOTE: since DB_USER is "root" in CONFIG, use MYSQL_ROOT_PASSWORD; change here if you switch to a non-root user
put_kv_force "$BACKEND_ENV" "DB_PASSWORD"   "$(grep -E '^MYSQL_ROOT_PASSWORD=' "$PROJECT_ENV" | cut -d= -f2-)"

put_kv_force "$BACKEND_ENV" "SECRET_KEY"    "$(val_or_gen "$SECRET_KEY")"

put_kv_force "$BACKEND_ENV" "INFLUXDB_HOST"          "$INFLUXDB_HOST"
put_kv_force "$BACKEND_ENV" "INFLUXDB_PORT"          "$INFLUXDB_PORT"
put_kv_force "$BACKEND_ENV" "INFLUXDB_DB"            "$INFLUXDB_DB"
put_kv_force "$BACKEND_ENV" "INFLUXDB_ADMIN_USER"    "$INFLUXDB_ADMIN_USER"
put_kv_force "$BACKEND_ENV" "INFLUXDB_ADMIN_PASSWORD" "$(grep -E '^INFLUXDB_ADMIN_PASSWORD=' "$PROJECT_ENV" | cut -d= -f2-)"

put_kv_force "$BACKEND_ENV" "GEMINI_MODEL"   "$GEMINI_MODEL"

put_kv_force "$BACKEND_ENV" "GRAFANA_ADMIN_USER"     "$(grep -E '^GRAFANA_ADMIN_USER=' "$PROJECT_ENV" | cut -d= -f2-)"
put_kv_force "$BACKEND_ENV" "GRAFANA_ADMIN_PASSWORD" "$(grep -E '^GRAFANA_ADMIN_PASSWORD=' "$PROJECT_ENV" | cut -d= -f2-)"

put_kv_force "$BACKEND_ENV" "MINIO_ENDPOINT"   "$MINIO_ENDPOINT"
put_kv_force "$BACKEND_ENV" "MINIO_ACCESS_KEY" "$(grep -E '^MINIO_ROOT_USER=' "$PROJECT_ENV" | cut -d= -f2-)"
put_kv_force "$BACKEND_ENV" "MINIO_SECRET_KEY" "$(grep -E '^MINIO_ROOT_PASSWORD=' "$PROJECT_ENV" | cut -d= -f2-)"
put_kv_force "$BACKEND_ENV" "MINIO_SECURE"     "$MINIO_SECURE"

printf '\n[OK] Ensured & overwrote:\n  - %s\n  - %s\n' "$PROJECT_ENV" "$BACKEND_ENV"
printf 'Verify: sudo docker compose config --environment\n'
