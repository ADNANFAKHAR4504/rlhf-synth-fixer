#!/usr/bin/env bash
set -euo pipefail

echo "[Sub_T05] Starting Vertex AI deployment..."

if [ ! -f ".model_version" ]; then
  echo "[Sub_T05] ERROR: .model_version file not found."
  echo "[Sub_T05] Did the model-build job run and upload/download the artifact?"
  exit 1
fi

VERSION="$(cat .model_version | tr -d '[:space:]')"

if [ -z "${VERSION}" ]; then
  echo "[Sub_T05] ERROR: Empty model version in .model_version file."
  exit 1
fi

if [ -z "${GCS_MODEL_BUCKET:-}" ]; then
  echo "[Sub_T05] ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

if [ -z "${GCP_REGION:-}" ]; then
  echo "[Sub_T05] ERROR: GCP_REGION environment variable not set."
  exit 1
fi

GCS_URI="gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"
MODEL_NAME="subt05-model-${VERSION}"
ENDPOINT_NAME="subt05-endpoint"
CONTAINER_IMAGE="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest"

echo "[Sub_T05] Deploying model version: ${VERSION}"
echo "[Sub_T05] Using GCS URI: ${GCS_URI}"
echo "[Sub_T05] Region: ${GCP_REGION}"
echo "[Sub_T05] Endpoint name: ${ENDPOINT_NAME}"

echo "[Sub_T05] Uploading model to Vertex AI..."
MODEL_ID="$(gcloud ai models upload \
  --region="${GCP_REGION}" \
  --display-name="${MODEL_NAME}" \
  --artifact-uri="${GCS_URI}" \
  --container-image-uri="${CONTAINER_IMAGE}" \
  --format="value(name)")"

if [ -z "${MODEL_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to upload model to Vertex AI."
  exit 1
fi

echo "[Sub_T05] Model uploaded with ID: ${MODEL_ID}"

echo "[Sub_T05] Checking for existing endpoint..."
ENDPOINT_ID="$(gcloud ai endpoints list \
  --region="${GCP_REGION}" \
  --filter="displayName=${ENDPOINT_NAME}" \
  --format="value(name)")"

if [ -z "${ENDPOINT_ID}" ]; then
  echo "[Sub_T05] No existing endpoint found. Creating new endpoint..."
  ENDPOINT_ID="$(gcloud ai endpoints create \
    --region="${GCP_REGION}" \
    --display-name="${ENDPOINT_NAME}" \
    --format="value(name)")"

  if [ -z "${ENDPOINT_ID}" ]; then
    echo "[Sub_T05] ERROR: Failed to create Vertex AI endpoint."
    exit 1
  fi

  echo "[Sub_T05] Created endpoint with ID: ${ENDPOINT_ID}"
else
  echo "[Sub_T05] Using existing endpoint: ${ENDPOINT_ID}"
fi

echo "[Sub_T05] Deploying model to endpoint with 100% traffic..."
DEPLOYMENT_ID="$(gcloud ai endpoints deploy-model "${ENDPOINT_ID}" \
  --region="${GCP_REGION}" \
  --model="${MODEL_ID}" \
  --display-name="${MODEL_NAME}" \
  --traffic-split="0=100" \
  --format="value(deployedModel.id)")"

if [ -z "${DEPLOYMENT_ID}" ]; then
  echo "[Sub_T05] ERROR: Failed to deploy model to endpoint."
  exit 1
fi

echo "[Sub_T05] Model successfully deployed."
echo "[Sub_T05] Deployment ID: ${DEPLOYMENT_ID}"
echo "[Sub_T05] deploy_vertex_model.sh completed successfully."
