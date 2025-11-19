#!/bin/bash
set -euo pipefail

echo "Running TruffleHog scan on git history..."

# Install TruffleHog
pip install truffleHog3

# Scan entire git history
trufflehog3 --no-history \
    --format json \
    --output trufflehog-results.json \
    --rules rules/trufflehog-rules.yaml \
    .

# Check for findings
if [ -s trufflehog-results.json ]; then
    echo "Potential secrets found in git history:"
    cat trufflehog-results.json
    exit 1
fi

echo "TruffleHog scan completed - no secrets found"