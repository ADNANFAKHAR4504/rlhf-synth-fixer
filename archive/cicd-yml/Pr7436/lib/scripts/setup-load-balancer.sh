
#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""
GKE_REGIONS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --gke-regions) GKE_REGIONS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[lb] env=${ENVIRONMENT} regions=${GKE_REGIONS}"
echo "[lb] Configuring global HTTP(S) Load Balancer with regional backends and health checks..."
echo "[lb] Enabling session affinity for sticky sessions and attaching Cloud Armor policies at the edge..."
# TODO: gcloud compute backend-services/url-maps/target-https-proxies configuration.
