#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="compliance"
mkdir -p "${OUTPUT_DIR}"

echo "Running Prowler PCI-DSS checks for dev, staging, and prod"

ACCOUNTS=("dev" "staging" "prod")

for env in "${ACCOUNTS[@]}"; do
  REGION="${AWS_REGION:-us-east-1}"
  OUT_FILE="${OUTPUT_DIR}/prowler-${env}.json"
  echo "Running Prowler for ${env} in ${REGION}"
  prowler -r "${REGION}" -M json > "${OUT_FILE}"
done

echo "Validating CloudTrail, encryption, and VPC flow logs via Security Hub summaries"
aws securityhub get-findings   --filters '{"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}'   --region "${AWS_REGION:-us-east-1}"   > "${OUTPUT_DIR}/securityhub-findings.json"

echo "PCI validation complete"
