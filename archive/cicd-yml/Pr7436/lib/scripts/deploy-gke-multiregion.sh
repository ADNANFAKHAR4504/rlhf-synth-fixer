
#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""
REGION=""
IMAGE_PREFIX=""
TAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --image-prefix) IMAGE_PREFIX="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[deploy-gke] env=${ENVIRONMENT} region=${REGION} image_prefix=${IMAGE_PREFIX} tag=${TAG}"
echo "[deploy-gke] Configuring kubectl context for regional Autopilot cluster..."
echo "[deploy-gke] Deploying Helm charts for game-server, matchmaking, stats-aggregator, and Agones fleets..."
echo "[deploy-gke] Applying PodDisruptionBudgets and HPA based on player count metrics..."
# TODO: gcloud container clusters get-credentials + helm upgrade --install calls.
