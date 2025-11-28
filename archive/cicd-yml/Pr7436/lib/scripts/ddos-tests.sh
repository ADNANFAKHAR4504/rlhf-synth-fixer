
#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
echo "[ddos] env=${ENVIRONMENT}"
echo "[ddos] Simulating volumetric and application-layer attacks to validate Cloud Armor rules and rate limiting..."
# TODO: integrate with a synthetic attack generator or k6 scripts behind Cloud Armor.
