#!/bin/bash
# Auto-format Go files for CI pipeline
set -e

echo "Auto-formatting Go files..."

if command -v gofmt > /dev/null 2>&1; then
    echo "Running gofmt on lib/ and tests/"
    gofmt -w lib/ tests/
    echo "Go files formatted successfully"
else
    echo "gofmt not available, skipping format"
fi