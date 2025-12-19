#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$PERF_DIR"

cat > k6.js <<'EOF'
import http from "k6/http";
export let options = {
  vus: 100000,
  duration: "30s",
};
export default function () {
  http.get("https://example.com");
}
EOF

echo "[synthetic-players] Starting k6 run..."
k6 run k6.js --out json="${PERF_DIR}/k6.json"
test -s "${PERF_DIR}/k6.json"

echo "[synthetic-players] k6 results written to ${PERF_DIR}/k6.json"
