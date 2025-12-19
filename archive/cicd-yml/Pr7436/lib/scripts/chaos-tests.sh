
#!/usr/bin/env bash
set -euo pipefail
GKE_REGIONS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gke-regions) GKE_REGIONS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[chaos] regions=${GKE_REGIONS}"
echo "[chaos] Injecting latency (50-200ms), packet loss (1-5%), and pod failures using Chaos Mesh..."
# TODO: apply Chaos Mesh experiments for network and pod disruption.
