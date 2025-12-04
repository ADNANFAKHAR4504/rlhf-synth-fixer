#!/bin/bash

# Exit on any error
set -e

echo "🧹 Starting cleanup and deployment process..."

# Configuration
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-"pr7781"}
AWS_REGION=${AWS_REGION:-"eu-central-1"}
export AWS_REGION
export ENVIRONMENT_SUFFIX

echo "Environment: $ENVIRONMENT_SUFFIX"
echo "Region: $AWS_REGION"

# Function to check if AWS CLI is configured
check_aws_credentials() {
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "❌ AWS credentials not configured. Please configure AWS CLI first."
        echo "   Run: aws configure"
        exit 1
    fi
    echo "✅ AWS credentials configured"
}

# Function to cleanup ECS service
cleanup_ecs_service() {
    local service_name="payment-service-${ENVIRONMENT_SUFFIX}"
    local cluster_name="payment-cluster-${ENVIRONMENT_SUFFIX}"

    echo "🔍 Checking for ECS service: $service_name"

    if aws ecs describe-services --cluster "$cluster_name" --services "$service_name" --region "$AWS_REGION" 2>/dev/null | grep -q "ACTIVE\|DRAINING"; then
        echo "⚠️  Found existing ECS service: $service_name"
        echo "   Updating service to 0 tasks..."
        aws ecs update-service --cluster "$cluster_name" --service "$service_name" --desired-count 0 --region "$AWS_REGION" 2>/dev/null || true
        sleep 10

        echo "   Deleting ECS service..."
        aws ecs delete-service --cluster "$cluster_name" --service "$service_name" --force --region "$AWS_REGION" 2>/dev/null || true

        echo "   Waiting for service deletion..."
        for i in {1..30}; do
            if ! aws ecs describe-services --cluster "$cluster_name" --services "$service_name" --region "$AWS_REGION" 2>/dev/null | grep -q "ACTIVE\|DRAINING"; then
                echo "   ✅ ECS service deleted"
                break
            fi
            echo "   Still deleting... ($i/30)"
            sleep 10
        done
    else
        echo "   ✅ No existing ECS service found"
    fi
}

# Function to list and optionally cleanup EIPs
cleanup_eips() {
    echo "🔍 Checking for Elastic IPs..."

    # List all EIPs
    EIPS=$(aws ec2 describe-addresses --region "$AWS_REGION" --query "Addresses[*].[PublicIp,AllocationId,Tags[?Key=='Environment']|[0].Value]" --output text 2>/dev/null || echo "")

    if [ -n "$EIPS" ]; then
        echo "   Found EIPs in account:"
        echo "$EIPS" | while read -r line; do
            echo "     $line"
        done

        # Count EIPs associated with this environment
        ENV_EIPS=$(aws ec2 describe-addresses --region "$AWS_REGION" --filters "Name=tag:Environment,Values=$ENVIRONMENT_SUFFIX" --query "Addresses[*].AllocationId" --output text 2>/dev/null || echo "")

        if [ -n "$ENV_EIPS" ]; then
            echo "   ⚠️  Found EIPs tagged with this environment:"
            for alloc_id in $ENV_EIPS; do
                echo "     Releasing: $alloc_id"
                aws ec2 release-address --allocation-id "$alloc_id" --region "$AWS_REGION" 2>/dev/null || echo "     Failed to release $alloc_id"
            done
        fi
    else
        echo "   ✅ No EIPs found"
    fi

    # Count total EIPs
    TOTAL_EIPS=$(aws ec2 describe-addresses --region "$AWS_REGION" --query "length(Addresses)" --output text 2>/dev/null || echo "0")
    echo "   Total EIPs in region: $TOTAL_EIPS/5 (AWS default limit)"
}

# Function to cleanup RDS instances if needed
cleanup_rds() {
    local cluster_id="v4-aurora-db-${ENVIRONMENT_SUFFIX}"

    echo "🔍 Checking for RDS cluster: $cluster_id"

    if aws rds describe-db-clusters --db-cluster-identifier "$cluster_id" --region "$AWS_REGION" 2>/dev/null | grep -q "DBClusterIdentifier"; then
        echo "⚠️  Found existing RDS cluster: $cluster_id"
        echo "   Note: RDS cluster exists. CDKTF will attempt to manage it."
        echo "   If you want to delete it manually, run:"
        echo "     aws rds delete-db-cluster --db-cluster-identifier $cluster_id --skip-final-snapshot --region $AWS_REGION"
    else
        echo "   ✅ No existing RDS cluster found"
    fi
}

# Main execution
echo ""
echo "=== Step 1: Check AWS Credentials ==="
check_aws_credentials

echo ""
echo "=== Step 2: Cleanup ECS Service ==="
cleanup_ecs_service

echo ""
echo "=== Step 3: Check EIPs ==="
cleanup_eips

echo ""
echo "=== Step 4: Check RDS ==="
cleanup_rds

echo ""
echo "=== Step 5: Synthesize CDKTF ==="
cd /home/adnan/turing/iac-test-automations
npm run cdktf:synth

echo ""
echo "=== Step 6: Deploy Infrastructure ==="
echo "⚠️  This will deploy the infrastructure with the fixes applied"
echo "   - Single NAT Gateway (instead of 3)"
echo "   - Updated ECS service configuration"
echo ""
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run cdktf:deploy
    echo ""
    echo "✅ Deployment completed successfully!"
else
    echo "❌ Deployment cancelled by user"
    exit 0
fi
