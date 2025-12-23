#!/bin/bash
set -euo pipefail
# Purpose: Apply Terraform with environment-aware behaviour (dev/staging/prod).
# Usage: terraform-apply-hipaa.sh <environment>

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment>" >&2
  exit 1
fi

ENVIRONMENT="$1"
echo "[terraform-apply-hipaa] Applying Terraform for env='${ENVIRONMENT}'"
# TODO: terraform workspace select "${ENVIRONMENT}" || terraform workspace new "${ENVIRONMENT}"; terraform apply -auto-approve
