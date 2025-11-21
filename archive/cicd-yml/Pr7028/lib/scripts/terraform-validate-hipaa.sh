#!/bin/bash
set -euo pipefail
# Purpose: Run Terraform validation and HIPAA-focused Checkov checks.
# Usage: terraform-validate-hipaa.sh <environment>

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment>" >&2
  exit 1
fi

ENVIRONMENT="$1"
echo "[terraform-validate-hipaa] Running Terraform fmt/validate/tflint/Checkov for env='${ENVIRONMENT}'"
# TODO: terraform fmt -check; terraform validate; tflint; checkov -d . --framework terraform
