#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-prod}"

echo "[failover-test] Running regional failover test for env=${ENVIRONMENT}"

PRIMARY_URL="${PRIMARY_URL:-https://media-eastus.example.com/health}"
SECONDARY_URL="${SECONDARY_URL:-https://media-westeurope.example.com/health}"
TERTIARY_URL="${TERTIARY_URL:-https://media-seasia.example.com/health}"

check_region() {
  local url="$1"
  echo "[failover-test] Checking ${url}"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}")
  echo "[failover-test] ${url} -> ${http_code}"
  if [[ "${http_code}" != "200" ]]; then
    return 1
  fi
  return 0
}

if ! check_region "${PRIMARY_URL}"; then
  echo "[failover-test] Primary region unhealthy, validating secondary"
  if ! check_region "${SECONDARY_URL}"; then
    echo "[failover-test] Secondary also unhealthy, checking tertiary"
    check_region "${TERTIARY_URL}" || (echo "All regions unhealthy!" && exit 1)
  fi
fi

echo "[failover-test] Regional failover validation succeeded"
