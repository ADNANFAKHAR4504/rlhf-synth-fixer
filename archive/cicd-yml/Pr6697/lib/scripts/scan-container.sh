#!/bin/bash
set -euo pipefail

IMAGE=$1
SEVERITY_THRESHOLD="CRITICAL,HIGH"

echo "Scanning container image: $IMAGE"

# Pull the image
docker pull "$IMAGE"

# Run Trivy scan
trivy image --severity "$SEVERITY_THRESHOLD" --exit-code 1 \
    --format json --output trivy-report.json "$IMAGE"

# Check exit code
if [ $? -ne 0 ]; then
    echo "Critical vulnerabilities found in $IMAGE"
    cat trivy-report.json | jq '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")'
    exit 1
fi

echo "Container scan passed for $IMAGE"