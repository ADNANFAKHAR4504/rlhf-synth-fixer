#!/bin/bash
# Detects if alternative fix strategy exists for deployment error
# Usage: detect-alternative-strategy.sh <error_message> <error_count>

set -euo pipefail

ERROR_MSG="$1"
ERROR_COUNT="${2:-5}"

echo "🔍 Analyzing error for alternative strategies..."

# Pattern matching for common errors that have alternatives
if echo "$ERROR_MSG" | grep -qiE "circular dependency|circular reference"; then
  echo "✅ Alternative strategy available: Break circular dependency"
  echo "STRATEGY: Restructure resources, use data sources, split stacks"
  echo "DETAILS: Circular dependencies can be resolved by restructuring resource creation order or splitting into multiple stacks"
  exit 0
fi

if echo "$ERROR_MSG" | grep -qiE "resource limit|quota|limit exceeded|too many"; then
  echo "✅ Alternative strategy available: Reduce resource count"
  echo "STRATEGY: Consolidate resources, use shared resources, reduce AZs"
  echo "DETAILS: Resource limits can be worked around by consolidating resources or reducing redundancy"
  exit 0
fi

if echo "$ERROR_MSG" | grep -qiE "invalid parameter|unsupported|not supported|invalid value"; then
  echo "✅ Alternative strategy available: Use different configuration"
  echo "STRATEGY: Try alternative parameter values, use different service version"
  echo "DETAILS: Invalid parameters may work with different values or service versions"
  exit 0
fi

if echo "$ERROR_MSG" | grep -qiE "timeout|takes too long|exceeded.*time|timed out"; then
  echo "✅ Alternative strategy available: Optimize deployment"
  echo "STRATEGY: Reduce resource complexity, use faster alternatives, split deployment"
  echo "DETAILS: Timeouts can be avoided by simplifying resources or splitting into smaller deployments"
  exit 0
fi

if echo "$ERROR_MSG" | grep -qiE "dependency|depends on|not found|does not exist"; then
  echo "✅ Alternative strategy available: Fix dependencies"
  echo "STRATEGY: Add explicit dependencies, use data sources, create resources in correct order"
  echo "DETAILS: Dependency issues can be resolved by explicit dependency management"
  exit 0
fi

if echo "$ERROR_MSG" | grep -qiE "permission|access denied|unauthorized|forbidden"; then
  echo "⚠️ Permission errors may require IAM policy fixes"
  echo "STRATEGY: Review and update IAM policies, check service roles"
  echo "DETAILS: Permission issues typically require IAM policy updates"
  exit 0
fi

echo "❌ No alternative strategy detected"
echo "DETAILS: Error pattern does not match known fixable patterns"
exit 1

