#!/usr/bin/env bash
# Purpose: Create folders for each IaC category
# Usage  : ./create_iac_folders.sh

set -euo pipefail

CATEGORIES=(
  "Environment Migration"
  "Cloud Environment Setup"
  "Multi-Environment Consistency and Replication"
  "Web Application Deployment"
  "Serverless Infrastructure (Functions as Code)"
  "Failure Recovery Automation"
  "Security Configuration as Code"
  "Infrastructure Analysis/Monitoring"
  "General Infrastructure Tooling QA"
  "CI/CD Pipeline"
  "IaC Diagnosis/Edits"
  "IaC Optimization"
)

# Function to slugify names (lowercase, replace spaces/symbols with -)
slugify() {
  local s="$1"
  s="$(echo "$s" | tr '[:upper:]' '[:lower:]')"   # lowercase
  s="${s//&/and}"                                # replace &
  s="${s//\//-}"                                 # replace /
  s="$(echo "$s" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')" 
  echo "$s"
}

# Create top-level folder
mkdir -p categories

for CATEGORY in "${CATEGORIES[@]}"; do
  FOLDER="categories/$(slugify "$CATEGORY")"
  mkdir -p "$FOLDER"
  echo "✓ Created folder: $FOLDER"
done

echo "All IaC category folders created successfully."
