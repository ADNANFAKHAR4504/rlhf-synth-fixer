#!/usr/bin/env bash
set -euo pipefail

# prepare.sh
# Install production dependencies for the Lambda asset so CDK's
# Code.fromAsset includes node_modules in the uploaded zip.
#
# Usage:
#   ./lib/lambda/api/prepare.sh
#
# CI: call this script from your pipeline before running `cdk synth`/`cdk deploy`.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "==> Preparing Lambda asset in ${SCRIPT_DIR}"
cd "${SCRIPT_DIR}"

if [ ! -f package.json ]; then
  echo "No package.json found in ${SCRIPT_DIR}, nothing to do."
  exit 0
fi

echo "Running npm ci --production in ${SCRIPT_DIR}"
npm ci --production

echo "Lambda asset dependencies installed."
