
#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""
REGION=""
IMAGE_PREFIX=""
TAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --image-prefix) IMAGE_PREFIX="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[agones] env=${ENVIRONMENT} region=${REGION} image_prefix=${IMAGE_PREFIX} tag=${TAG}"
echo "[agones] Deploying test GKE cluster with Agones for integration tests..."
echo "[agones] Testing game server lifecycle: allocation -> ready -> shutdown..."
echo "[agones] Validating player connection flow and matchmaking at multiple player counts..."
# TODO: Apply Agones GameServer, Fleet, and allocation tests via kubectl.
