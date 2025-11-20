#!/bin/bash
set -e

# Set environment variables
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=synth101912523
export TERRAFORM_STATE_BUCKET=iac-rlhf-terraform-states-us-east-1-342597974367
export REPOSITORY=synth-101912523
export COMMIT_AUTHOR="Arpit Patidar"
export TEAM=synth

# Generate database credentials
export TF_VAR_db_master_username=postgres
export TF_VAR_db_master_password=$(openssl rand -base64 32 | tr -d '/+=' | head -c 20)
export TF_VAR_source_db_server=oracle.example.com
export TF_VAR_source_db_username=oracle_user
export TF_VAR_source_db_password=$(openssl rand -base64 32 | tr -d '/+=' | head -c 20)

echo "Environment variables configured:"
echo "AWS_REGION: $AWS_REGION"
echo "ENVIRONMENT_SUFFIX: $ENVIRONMENT_SUFFIX"
echo "TERRAFORM_STATE_BUCKET: $TERRAFORM_STATE_BUCKET"

# Run deployment script
bash .claude/scripts/deploy.sh
