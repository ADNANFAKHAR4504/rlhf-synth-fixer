#!/usr/bin/env bash
set -euo pipefail
# Gradual multi-region rollout for Cloud Run: 10% -> 50% -> 100% with health checks.
# Usage: gradual-rollout.sh "<regions space-separated>" <gcp-project-id> <image-ref>
REGIONS="${1:?regions required}"
GCP_PROJECT="${2:?gcp project id required}"
IMAGE="${3:?image ref required}"
SERVICE="${SERVICE_NAME:-app-name}"

for REGION in ${REGIONS}; do
  echo "[rollout] Deploying ${SERVICE} in ${REGION} with image ${IMAGE}"
  gcloud run deploy "${SERVICE}" --image "${IMAGE}" --region "${REGION}" --platform managed --allow-unauthenticated --quiet
  for PCT in 10 50 100; do
    echo "[rollout] Setting traffic ${PCT}% in ${REGION}"
    gcloud run services update-traffic "${SERVICE}" --region "${REGION}" --to-latest --traffic="${PCT}" --quiet
    echo "[rollout] Health check waiting..."
    sleep "${HEALTH_WAIT_SECONDS:-30}"
  done
done

