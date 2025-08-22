#!/bin/bash

# Pulumi deployment helper script
# This script provides proper environment variable handling for Pulumi deployments
# Works around the Pipfile syntax issues while staying within lib/ directory

set -e

# Ensure PULUMI_CONFIG_PASSPHRASE is set for CI/CD compatibility
export PULUMI_CONFIG_PASSPHRASE="${PULUMI_CONFIG_PASSPHRASE:-}"

# Function to create or select Pulumi stack
create_stack() {
    echo "Creating/selecting Pulumi stack..."
    python lib/pulumi_wrapper.py create-stack
}

# Function to deploy Pulumi stack
deploy_stack() {
    echo "Deploying Pulumi stack..."
    python lib/pulumi_wrapper.py deploy
}

# Function to run the full deployment process
full_deploy() {
    echo "🚀 Starting Pulumi deployment process..."
    
    # Step 1: Login to Pulumi backend
    echo "Logging into Pulumi backend..."
    pulumi login "$PULUMI_BACKEND_URL"
    
    # Step 2: Create/select stack
    create_stack
    
    # Step 3: Deploy
    deploy_stack
    
    echo "✅ Deployment completed successfully"
}

# Check command line argument
case "${1:-}" in
    "create-stack")
        create_stack
        ;;
    "deploy")
        deploy_stack
        ;;
    "full-deploy"|"")
        full_deploy
        ;;
    *)
        echo "Usage: $0 [create-stack|deploy|full-deploy]"
        echo "  create-stack: Create or select the Pulumi stack"
        echo "  deploy: Deploy the infrastructure"
        echo "  full-deploy: Run complete deployment (default)"
        exit 1
        ;;
esac