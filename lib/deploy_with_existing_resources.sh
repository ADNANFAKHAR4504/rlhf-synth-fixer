#!/bin/bash

# Deployment script that handles existing resources gracefully
# This script sets environment variables to skip resource creation that might conflict

echo "🚀 Deploying with existing resource handling..."

# Set environment variables to handle existing resources
export SKIP_IAM_CREATION=true
export SKIP_CLOUDTRAIL_REGIONS=us-east-1

echo "Environment variables set:"
echo "  SKIP_IAM_CREATION=$SKIP_IAM_CREATION"
echo "  SKIP_CLOUDTRAIL_REGIONS=$SKIP_CLOUDTRAIL_REGIONS"

# Run the deployment
echo "Starting deployment..."
cd ..
./scripts/deploy.sh
