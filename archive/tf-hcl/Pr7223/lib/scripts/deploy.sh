#!/bin/bash
# Deployment script for workspace-based environments

set -e

ENVIRONMENT=$1
TFVARS_FILE="${ENVIRONMENT}.tfvars"

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <dev|staging|prod>"
    exit 1
fi

if [ ! -f "$TFVARS_FILE" ]; then
    echo "Error: $TFVARS_FILE not found"
    exit 1
fi

echo "=== Deploying to $ENVIRONMENT environment ==="
echo ""

# Select or create workspace
if terraform workspace list | grep -q "$ENVIRONMENT"; then
    terraform workspace select "$ENVIRONMENT"
else
    terraform workspace new "$ENVIRONMENT"
fi

# Initialize
echo "Initializing Terraform..."
terraform init

# Validate
echo "Validating configuration..."
terraform validate

# Plan
echo "Creating deployment plan..."
terraform plan -var-file="$TFVARS_FILE" -out="${ENVIRONMENT}.tfplan"

# Apply
echo ""
read -p "Apply this plan? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    terraform apply "${ENVIRONMENT}.tfplan"
    echo ""
    echo "=== Deployment Complete ==="
    terraform output
else
    echo "Deployment cancelled"
    exit 0
fi
