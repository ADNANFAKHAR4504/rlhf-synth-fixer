#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-prod}"

echo "Rolling back DB migrations for environment: ${ENVIRONMENT}"

FLYWAY_URL_VAR="FLYWAY_URL_${ENVIRONMENT^^}"
FLYWAY_USER_VAR="FLYWAY_USER_${ENVIRONMENT^^}"
FLYWAY_PASS_VAR="FLYWAY_PASSWORD_${ENVIRONMENT^^}"

FLYWAY_URL="${!FLYWAY_URL_VAR:?Flyway URL not set for ${ENVIRONMENT}}"
FLYWAY_USER="${!FLYWAY_USER_VAR:?Flyway user not set for ${ENVIRONMENT}}"
FLYWAY_PASSWORD="${!FLYWAY_PASS_VAR:?Flyway password not set for ${ENVIRONMENT}}"

flyway   -url="${FLYWAY_URL}"   -user="${FLYWAY_USER}"   -password="${FLYWAY_PASSWORD}"   -locations="filesystem:./migrations"   undo

echo "DB rollback completed for ${ENVIRONMENT}"
