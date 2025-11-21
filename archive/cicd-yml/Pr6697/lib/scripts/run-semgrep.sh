#!/bin/bash
set -euo pipefail

echo "Running Semgrep security analysis..."

# Install Semgrep
pip install semgrep

# Run Semgrep with custom retail rules
semgrep --config=auto \
    --config=rules/retail-security.yaml \
    --json \
    --output=semgrep-results.json \
    src/

# Check for high-severity findings
HIGH_FINDINGS=$(jq '.results | map(select(.extra.severity == "ERROR")) | length' semgrep-results.json)

if [ "$HIGH_FINDINGS" -gt 0 ]; then
    echo "High severity security issues found:"
    jq '.results[] | select(.extra.severity == "ERROR")' semgrep-results.json
    exit 1
fi

echo "Semgrep analysis completed"