#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [validate-pci] $*"; }
OUTPUT_DIR="compliance"
mkdir -p "${OUTPUT_DIR}"
ACCOUNTS="${PCI_ACCOUNTS:-dev staging prod}"
REGION="${AWS_REGION:-us-east-1}"
log "Starting PCI-DSS validation for accounts=${ACCOUNTS} region=${REGION}"
for ACCOUNT in ${ACCOUNTS}; do
  FILE="${OUTPUT_DIR}/prowler-${ACCOUNT}.json"
  log "Running Prowler for account=${ACCOUNT} -> ${FILE}"
  prowler -r "${REGION}" -M json --tags "Environment=${ACCOUNT}" > "${FILE}"
done
log "PCI-DSS validation completed"
