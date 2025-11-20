#!/bin/bash
set -euo pipefail

IMAGE=$1

echo "Running Trivy security scan on $IMAGE..."

# Pull the latest vulnerability database
trivy image --download-db-only

# Scan the image
trivy image \
    --severity CRITICAL,HIGH,MEDIUM \
    --format json \
    --output "trivy-$BUILD_BUILDID.json" \
    "$IMAGE"

# Check for CRITICAL vulnerabilities
CRITICAL_COUNT=$(jq '[.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")] | length' "trivy-$BUILD_BUILDID.json")

if [ "$CRITICAL_COUNT" -gt 0 ]; then
    echo "CRITICAL vulnerabilities found:"
    jq '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")' "trivy-$BUILD_BUILDID.json"
    exit 1
fi

echo "Trivy scan completed - no CRITICAL vulnerabilities"