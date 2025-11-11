#!/usr/bin/env bash
set -euo pipefail
# Deploys/updates a Cloud Run service for preview environments.
# Usage: deploy-cloudrun.sh <preview-name> <gcp-project-id> <gcp-registry> <commit-sha>
# Outputs preview.env with PREVIEW_URL for downstream jobs (e.g., ZAP).
PRV_NAME="${1:?preview name required}"
GCP_PROJECT="${2:?gcp project id required}"
GCP_REGISTRY="${3:?gcp registry required}"
COMMIT_SHA="${4:?commit sha required}"

APP_IMAGE="${GCP_REGISTRY}/${GCP_PROJECT}/app-name:${COMMIT_SHA}"

echo "[cloudrun] Using image: ${APP_IMAGE}"
gcloud config set project "${GCP_PROJECT}" 1>/dev/null

# Create or update service
gcloud run deploy "${PRV_NAME}"   --image "${APP_IMAGE}"   --platform managed   --region "${CLOUD_RUN_REGION:-us-central1}"   --allow-unauthenticated   --ingress all   --min-instances=0   --max-instances="${MAX_INSTANCES:-3}"   --quiet

# Fetch URL and write dotenv for later stages
URL="$(gcloud run services describe "${PRV_NAME}" --region "${CLOUD_RUN_REGION:-us-central1}" --format='value(status.url)')"
echo "PREVIEW_URL=${URL}" | tee preview.env
echo "[cloudrun] Deployed preview at ${URL}"

