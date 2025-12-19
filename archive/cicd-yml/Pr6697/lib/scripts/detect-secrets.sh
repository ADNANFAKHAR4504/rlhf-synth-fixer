#!/bin/bash
set -euo pipefail

echo "Scanning for secrets..."

# Install detect-secrets
pip install detect-secrets

# Create baseline if it doesn't exist
if [ ! -f .secrets.baseline ]; then
    detect-secrets scan --baseline .secrets.baseline
fi

# Scan for secrets
detect-secrets scan --baseline .secrets.baseline

# Audit the results
detect-secrets audit .secrets.baseline

# Check for any active secrets
ACTIVE_SECRETS=$(jq '.results | to_entries | map(select(.value | map(.is_secret) | any)) | length' .secrets.baseline)

if [ "$ACTIVE_SECRETS" -gt 0 ]; then
    echo "Active secrets detected in codebase!"
    exit 1
fi

echo "No secrets detected"