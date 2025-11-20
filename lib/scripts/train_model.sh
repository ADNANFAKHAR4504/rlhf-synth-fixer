#!/usr/bin/env bash
set -euo pipefail

DATE_FORMAT="$(date '+%Y%m%d%H%M%S')"
SHORT_SHA="${GITHUB_SHA:-local}"
SHORT_SHA="${SHORT_SHA:0:7}"
VERSION="v${DATE_FORMAT}_${SHORT_SHA}"
VERSION_DIR="artifacts/models/${VERSION}"

echo "  Starting model training process..."
echo "  Using model version: ${VERSION}"
echo "  Version directory: ${VERSION_DIR}"

mkdir -p "${VERSION_DIR}"
echo "  Created model directory at ${VERSION_DIR}"

echo "  Running training: poetry run python train.py --model-dir \"${VERSION_DIR}\""
poetry run python train.py --model-dir "${VERSION_DIR}"
echo "  Training step completed, validating artifacts..."

# Validate artifacts were created
if [ ! -d "${VERSION_DIR}" ] || [ -z "$(ls -A "${VERSION_DIR}")" ]; then
  echo "  ERROR: Model training failed or produced no artifacts in ${VERSION_DIR}"
  exit 1
fi

echo "  Model artifacts detected in ${VERSION_DIR}"

if [ -z "${GCS_MODEL_BUCKET:-}" ]; then
  echo "  ERROR: GCS_MODEL_BUCKET environment variable not set."
  exit 1
fi

GCS_URI="gs://${GCS_MODEL_BUCKET}/models/${VERSION}/"
echo "  Uploading artifacts to: ${GCS_URI}"

# Use -r to handle nested directories
gsutil -m cp -r "${VERSION_DIR}"/* "${GCS_URI}"

echo "  Artifacts uploaded successfully."

# Write model version to file in repo root
echo "${VERSION}" > .model_version
echo "  Model version written to .model_version"

echo " train_model.sh completed successfully."
