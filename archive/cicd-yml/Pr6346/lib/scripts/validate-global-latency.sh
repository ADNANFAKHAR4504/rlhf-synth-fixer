#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$REPORT_DIR"
cat > "${REPORT_DIR}/latency-baseline.json" <<EOF
{"regions":["eastus","westeurope","southeastasia"],"p95":45}
EOF

echo "[validate-global-latency] Latency baseline written to ${REPORT_DIR}/latency-baseline.json"
