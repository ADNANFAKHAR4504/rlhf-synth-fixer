#!/bin/bash
# Deployment script for payment processing infrastructure
# Usage: ./deploy.sh <environment> [operation]
# Example: ./deploy.sh dev up
# Example: ./deploy.sh prod preview

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment argument is required"
    echo "Usage: $0 <environment> [operation]"
    echo "Environments: dev, staging, prod"
    echo "Operations: up (default), preview, destroy, refresh"
    exit 1
fi

ENVIRONMENT=$1
OPERATION=${2:-up}

# Validate environment
case $ENVIRONMENT in
    dev|development)
        ENV_SUFFIX="dev"
        ACCOUNT_ID="123456789012"
        ;;
    staging|stg)
        ENV_SUFFIX="staging"
        ACCOUNT_ID="234567890123"
        ;;
    prod|production)
        ENV_SUFFIX="prod"
        ACCOUNT_ID="345678901234"
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: dev, staging, prod"
        exit 1
        ;;
esac

print_info "Deploying to environment: $ENV_SUFFIX"
print_info "Target AWS Account: $ACCOUNT_ID"

# Set environment variables
export ENVIRONMENT_SUFFIX=$ENV_SUFFIX
export AWS_REGION=${AWS_REGION:-us-east-1}

# Set Pulumi stack name
STACK_NAME="payment-processing-$ENV_SUFFIX"

print_info "Using Pulumi stack: $STACK_NAME"

# Check if stack exists, create if not
if ! pulumi stack ls | grep -q "^$STACK_NAME\*"; then
    if ! pulumi stack ls | grep -q "^$STACK_NAME$"; then
        print_info "Creating new Pulumi stack: $STACK_NAME"
        pulumi stack init $STACK_NAME
    else
        print_info "Selecting existing Pulumi stack: $STACK_NAME"
        pulumi stack select $STACK_NAME
    fi
else
    print_info "Stack $STACK_NAME is already selected"
fi

# Configure AWS region
pulumi config set aws:region $AWS_REGION

# Perform the requested operation
case $OPERATION in
    up|deploy)
        print_info "Deploying infrastructure..."
        pulumi up --yes

        # Export resource manifest
        print_info "Generating resource manifest..."
        MANIFEST_FILE="resource-manifest-$ENV_SUFFIX.json"
        pulumi stack output resource_manifest > $MANIFEST_FILE
        print_info "Resource manifest saved to: $MANIFEST_FILE"
        ;;
    preview)
        print_info "Previewing infrastructure changes..."
        pulumi preview
        ;;
    destroy)
        print_warning "WARNING: This will destroy all resources in $ENV_SUFFIX environment"
        read -p "Are you sure? Type 'yes' to confirm: " confirmation
        if [ "$confirmation" = "yes" ]; then
            print_info "Destroying infrastructure..."
            pulumi destroy --yes
        else
            print_info "Destroy cancelled"
            exit 0
        fi
        ;;
    refresh)
        print_info "Refreshing stack state..."
        pulumi refresh --yes
        ;;
    output)
        print_info "Stack outputs:"
        pulumi stack output
        ;;
    *)
        print_error "Invalid operation: $OPERATION"
        echo "Valid operations: up, preview, destroy, refresh, output"
        exit 1
        ;;
esac

print_info "Operation completed successfully"