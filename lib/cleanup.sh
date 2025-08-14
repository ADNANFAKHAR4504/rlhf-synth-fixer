#!/bin/bash
# Terraform Infrastructure Cleanup Script
# This script provides rollback functionality by cleaning up AWS resources

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧹 Starting infrastructure cleanup..."

# Check if terraform is available
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed or not in PATH"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    exit 1
fi

# Function to clean up S3 buckets before destroy
cleanup_s3_buckets() {
    echo "🪣 Cleaning up S3 buckets..."
    
    # Get bucket names from terraform state
    MAIN_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
    CLOUDTRAIL_BUCKET=$(terraform output -json resources_for_cleanup 2>/dev/null | jq -r '.s3_bucket_names[1]' 2>/dev/null || echo "")
    
    for bucket in "$MAIN_BUCKET" "$CLOUDTRAIL_BUCKET"; do
        if [[ -n "$bucket" && "$bucket" != "null" ]]; then
            echo "  Emptying bucket: $bucket"
            # Delete all object versions
            aws s3api list-object-versions --bucket "$bucket" --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text 2>/dev/null | while read key version_id; do
                if [[ -n "$key" && -n "$version_id" && "$key" != "None" && "$version_id" != "None" ]]; then
                    aws s3api delete-object --bucket "$bucket" --key "$key" --version-id "$version_id" 2>/dev/null || true
                fi
            done
            
            # Delete all delete markers
            aws s3api list-object-versions --bucket "$bucket" --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text 2>/dev/null | while read key version_id; do
                if [[ -n "$key" && -n "$version_id" && "$key" != "None" && "$version_id" != "None" ]]; then
                    aws s3api delete-object --bucket "$bucket" --key "$key" --version-id "$version_id" 2>/dev/null || true
                fi
            done
            
            # Delete remaining objects
            aws s3 rm "s3://$bucket" --recursive 2>/dev/null || true
        fi
    done
}

# Function to stop any running EC2 instances
cleanup_ec2_instances() {
    echo "🖥️ Stopping EC2 instances..."
    
    INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")
    if [[ -n "$INSTANCE_ID" && "$INSTANCE_ID" != "null" ]]; then
        echo "  Stopping instance: $INSTANCE_ID"
        aws ec2 stop-instances --instance-ids "$INSTANCE_ID" 2>/dev/null || true
        
        # Wait for instance to stop
        echo "  Waiting for instance to stop..."
        aws ec2 wait instance-stopped --instance-ids "$INSTANCE_ID" 2>/dev/null || true
    fi
}

# Main cleanup function
main() {
    # Initialize terraform if needed
    if [[ ! -d ".terraform" ]]; then
        echo "🔧 Initializing Terraform..."
        terraform init -input=false
    fi
    
    # Clean up resources that need special handling
    cleanup_s3_buckets
    cleanup_ec2_instances
    
    # Run terraform destroy
    echo "💥 Running terraform destroy..."
    if terraform destroy -auto-approve -input=false; then
        echo "✅ Infrastructure successfully destroyed!"
    else
        echo "⚠️ Terraform destroy completed with warnings. Some resources may need manual cleanup."
        exit 1
    fi
    
    # Clean up terraform state files
    echo "🗑️ Cleaning up Terraform files..."
    rm -f terraform.tfstate*
    rm -f tfplan*
    rm -f .terraform.lock.hcl
    rm -rf .terraform/
    
    echo "🎉 Cleanup completed successfully!"
}

# Handle script termination
trap 'echo "🛑 Cleanup interrupted. Some resources may need manual cleanup."' INT TERM

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Infrastructure Cleanup Script"
    echo ""
    echo "This script safely destroys the Terraform infrastructure by:"
    echo "1. Emptying S3 buckets (including all versions)"
    echo "2. Stopping EC2 instances"
    echo "3. Running terraform destroy"
    echo "4. Cleaning up local terraform files"
    echo ""
    echo "Usage: $0 [--help]"
    echo ""
    echo "Environment variables:"
    echo "  AWS_REGION - AWS region (default: us-east-1)"
    echo ""
    echo "Prerequisites:"
    echo "  - Terraform installed and in PATH"
    echo "  - AWS CLI configured with appropriate credentials"
    echo "  - Current directory should be the lib/ directory"
    exit 0
fi

# Confirm before proceeding
echo "⚠️ This will destroy ALL infrastructure managed by this Terraform configuration."
echo "Current directory: $(pwd)"
echo "Terraform workspace: $(terraform workspace show 2>/dev/null || echo 'default')"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

# Run main function
main