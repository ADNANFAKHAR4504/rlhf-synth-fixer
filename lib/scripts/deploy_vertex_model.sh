#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .model_version ]]; then
  echo "Missing .model_version file. Did the model-build job run?"
  exit 1
fi

VERSION="$(cat .model_version)"
GCS_URI="gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"

echo "[Sub_T05] Deploying model version ${VERSION} from ${GCS_URI} to Vertex AI..."

MODEL_DISPLAY_NAME="subt05-model-${VERSION}"
ENDPOINT_DISPLAY_NAME="subt05-endpoint"

gcloud config set project "${GCP_PROJECT_ID}" >/dev/null

gcloud ai models upload   --region="${GCP_REGION}"   --display-name="${MODEL_DISPLAY_NAME}"   --artifact-uri="${GCS_URI}"   --container-image-uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest"

ENDPOINT_ID=$(gcloud ai endpoints list   --region="${GCP_REGION}"   --filter="displayName=${ENDPOINT_DISPLAY_NAME}"   --format="value(name)" || true)

if [[ -z "${ENDPOINT_ID}" ]]; then
  echo "[Sub_T05] Creating new endpoint ${ENDPOINT_DISPLAY_NAME}..."
  ENDPOINT_ID=$(gcloud ai endpoints create     --region="${GCP_REGION}"     --display-name="${ENDPOINT_DISPLAY_NAME}"     --format="value(name)")
fi

MODEL_ID=$(gcloud ai models list   --region="${GCP_REGION}"   --filter="displayName=${MODEL_DISPLAY_NAME}"   --format="value(name)" | tail -n 1)

if [[ -z "${MODEL_ID}" ]]; then
  echo "Failed to resolve uploaded model ID for ${MODEL_DISPLAY_NAME}"
  exit 1
fi

echo "[Sub_T05] Deploying model ${MODEL_ID} to endpoint ${ENDPOINT_ID}..."

gcloud ai endpoints deploy-model "${ENDPOINT_ID}"   --region="${GCP_REGION}"   --model="${MODEL_ID}"   --display-name="subt05-deployment-${VERSION}"   --traffic-split=0=100

echo "[Sub_T05] Vertex AI deployment complete."
