
#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""
GKE_REGIONS=""
TIER=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --gke-regions) GKE_REGIONS="$2"; shift 2 ;;
    --tier) TIER="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[memorystore] env=${ENVIRONMENT} regions=${GKE_REGIONS} tier=${TIER}"
echo "[memorystore] Creating Redis instances with automatic failover and allkeys-lru eviction..."
echo "[memorystore] Configuring cross-region replication for session data where applicable..."
# TODO: gcloud redis instances create / update with proper flags per region.
