#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="compliance"
REPORT_DIR="compliance"
REPORT_FILE="${REPORT_DIR}/pci-report.json"

mkdir -p "${REPORT_DIR}"

echo "Generating aggregated PCI-DSS compliance report"

jq -s '
  {
    prowler: {
      dev: .[0],
      staging: .[1],
      prod: .[2]
    },
    securityhub: .[3]
  }
'   "${INPUT_DIR}/prowler-dev.json"   "${INPUT_DIR}/prowler-staging.json"   "${INPUT_DIR}/prowler-prod.json"   "${INPUT_DIR}/securityhub-findings.json"   > "${REPORT_FILE}"

echo "Compliance report written to ${REPORT_FILE}"
