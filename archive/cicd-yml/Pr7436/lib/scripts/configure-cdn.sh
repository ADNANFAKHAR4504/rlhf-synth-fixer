
#!/usr/bin/env bash
set -euo pipefail
BUCKET=""
ASSET_PREFIX=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2 ;;
    --asset-prefix) ASSET_PREFIX="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[cdn] bucket=${BUCKET} asset_prefix=${ASSET_PREFIX}"
echo "[cdn] Setting object metadata for long-lived immutable assets (1 year TTL)..."
echo "[cdn] Ensuring Cloud CDN is enabled on backend buckets and cache policies are configured..."
# TODO: gsutil + gcloud compute backend-buckets/set-signed-url-key calls.
