#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [generate-compliance-report] $*"; }
SOURCE_DIR="compliance"
REPORT_DIR="compliance"
REPORT_FILE="${REPORT_DIR}/report.json"
mkdir -p "${REPORT_DIR}"
log "Generating aggregated compliance report from ${SOURCE_DIR}"
command -v jq >/dev/null 2>&1 || { log "jq is required to generate compliance report"; exit 1; }
jq -s '{generated_at: now, sources: ( [ inputs ] | to_entries | map({index:.key, file:input_filename, findings:.value}) )}' "${SOURCE_DIR}"/prowler-*.json > "${REPORT_FILE}"
log "Compliance report written to ${REPORT_FILE}"
