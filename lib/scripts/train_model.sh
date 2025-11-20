#!/usr/bin/env bash
set -euo pipefail

echo "[Sub_T05] Starting model training..."

MODEL_ROOT="artifacts/models"
mkdir -p "${MODEL_ROOT}"

VERSION="v$(date +%Y%m%d%H%M%S)_${GITHUB_SHA::7}"
VERSION_DIR="${MODEL_ROOT}/${VERSION}"

mkdir -p "${VERSION_DIR}"

# Run your training script (adjust path/args as needed)
poetry run python train.py --model-dir "${VERSION_DIR}"

# Persist version for later deployment job
echo "${VERSION}" > .model_version

echo "[Sub_T05] Uploading model artifacts to GCS bucket ${GCS_MODEL_BUCKET} ..."
gsutil -m cp "${VERSION_DIR}"/* "gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"

echo "[Sub_T05] Training + upload complete. Version: ${VERSION}"
