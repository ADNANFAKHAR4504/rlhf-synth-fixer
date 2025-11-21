#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"

echo "[cdn-validation] Validating CDN cache for env=${ENVIRONMENT}"

CDN_ENDPOINT_URL="${CDN_ENDPOINT_URL:-https://cdn-${ENVIRONMENT}.media.example.com/test-segment.ts}"

warm_cache() {
  for i in {1..10}; do
    curl -s -o /dev/null "${CDN_ENDPOINT_URL}"
  done
}

measure_cache_hit() {
  hits=0
  total=50
  for i in $(seq 1 "${total}"); do
    header=$(curl -s -D - -o /dev/null "${CDN_ENDPOINT_URL}" | grep -i "X-Cache")
    echo "Resp ${i}: ${header}"
    if echo "${header}" | grep -qi "HIT"; then
      hits=$((hits+1))
    fi
  done
  echo "${hits} ${total}"
}

echo "[cdn-validation] Warming cache..."
warm_cache

echo "[cdn-validation] Measuring cache hit ratio..."
read hits total < <(measure_cache_hit)
ratio=$(awk -v h="${hits}" -v t="${total}" 'BEGIN { if (t>0) print (h/t)*100; else print 0 }')
echo "CDN cache hit ratio=${ratio}%"

if (( $(echo "${ratio} < 85" | bc -l) )); then
  echo "CDN cache hit ratio below 85% threshold"
  exit 1
fi

echo "[cdn-validation] CDN cache hit rate OK (>=85%)"
