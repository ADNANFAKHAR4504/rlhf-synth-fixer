#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [rollback-migrations] $*"; }
ENVIRONMENT="${1:?ENVIRONMENT is required}"
FLYWAY_CMD="${FLYWAY_CMD:-flyway}"
DB_HOST="${DB_HOST:?DB_HOST is required}"
DB_NAME="${DB_NAME:?DB_NAME is required}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
URL="jdbc:postgresql://${DB_HOST}/${DB_NAME}"
log "Rolling back Flyway migrations for env=${ENVIRONMENT} on ${URL}"
${FLYWAY_CMD} -url="${URL}" -user="${DB_USER}" -password="${DB_PASSWORD}" -locations="filesystem:sql/migrations/${ENVIRONMENT}" undo
log "Rollback completed for env=${ENVIRONMENT}"
