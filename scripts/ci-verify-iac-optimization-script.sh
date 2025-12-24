#!/bin/bash

# Verify IaC Program Optimization script exists
# This script checks if the required analysis scripts exist for Infrastructure Analysis/Monitoring tasks

set -e

echo "🔍 Verifying IaC Program Optimization script exists..."

if [ ! -f "lib/analyse.py" ] && [ ! -f "lib/analyse.sh" ]; then
  echo "❌ Expected lib/analyse.py or lib/analyse.sh for IaC Program Optimization task"
  exit 1
fi

echo "✅ IaC Program Optimization script found"
exit 0
