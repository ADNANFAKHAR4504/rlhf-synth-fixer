#!/bin/bash

# Set required environment variables for CDKTF deployment
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export AWS_REGION="us-east-1"
export ENVIRONMENT_SUFFIX="pr5706"
export REPOSITORY="TuringGpt/iac-test-automations"
export COMMIT_AUTHOR="mayanksethi-turing"

# Database credentials (already set but included for completeness)
export TF_VAR_db_username="${TF_VAR_db_username:-temp_admin}"
export TF_VAR_db_password="${TF_VAR_db_password:-TempPassword123!}"

echo "Environment variables configured:"
echo "  TERRAFORM_STATE_BUCKET: $TERRAFORM_STATE_BUCKET"
echo "  TERRAFORM_STATE_BUCKET_REGION: $TERRAFORM_STATE_BUCKET_REGION"
echo "  AWS_REGION: $AWS_REGION"
echo "  ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
echo ""
echo "You can now run: ./scripts/deploy.sh"
