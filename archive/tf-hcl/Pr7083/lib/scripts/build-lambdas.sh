#!/usr/bin/env bash
set -euo pipefail

# Build script to package each lambda function directory into a zip under lib/lambdas
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LAMBDA_DIR="$ROOT_DIR/lambdas"

for fn in webhook_receiver payload_validator transaction_processor; do
  pushd "$LAMBDA_DIR/$fn" >/dev/null
  rm -f "$ROOT_DIR/lambdas/${fn}.zip"
  # install dependencies into package dir
  mkdir -p build
  pip install -r ../requirements.txt -t build/
  cp -r *.py build/ || true
  (cd build && zip -r ../${fn}.zip .)
  rm -rf build
  popd >/dev/null
done

echo "Built lambda zips in $ROOT_DIR/lambdas"
