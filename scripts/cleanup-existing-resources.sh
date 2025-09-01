#!/bin/bash

# Quick cleanup script for existing resources that conflict with CDKTF deployment
# This is a convenience wrapper around fix-resource-conflicts.sh

set -e

ENVIRONMENT_SUFFIX="${1:-${ENVIRONMENT_SUFFIX:-pr2472}}"

echo "🧹 Quick cleanup of existing resources for environment: $ENVIRONMENT_SUFFIX"
echo ""
echo "This will delete the following resources if they exist:"
echo "  - CloudWatch Log Groups: /aws/ec2/tap-log-group-*-$ENVIRONMENT_SUFFIX"
echo "  - DB Subnet Groups: tap-db-subnet-group-*-$ENVIRONMENT_SUFFIX"
echo ""

read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

./scripts/fix-resource-conflicts.sh cleanup "$ENVIRONMENT_SUFFIX"

echo ""
echo "✅ Cleanup completed! You can now deploy with:"
echo "   npm run cdktf:deploy"
echo "   # or"
echo "   ./scripts/deploy.sh"