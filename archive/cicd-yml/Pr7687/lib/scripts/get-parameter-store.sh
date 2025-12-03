#!/bin/bash
set -euo pipefail

PARAMETER_PATH="$1"
AWS_REGION="$2"

aws ssm get-parameters-by-path \
  --path "${PARAMETER_PATH}" \
  --recursive \
  --with-decryption \
  --region "${AWS_REGION}" || echo "No parameters found"

