# Terraform State Lock Troubleshooting

## Problem Description

When running Terraform deployments in CI/CD pipelines, you may encounter state lock errors like:

```
Error: Error acquiring the state lock
Error message: operation error S3: PutObject, https response error
StatusCode: 412, RequestID: ..., api error PreconditionFailed: At least one of the pre-conditions you specified did not hold
Lock Info:
  ID:        cf9b30c5-23c6-a9ee-4655-7adac84da06c
  Path:      iac-rlhf-tf-states/prs/pr2120/terraform.tfstate
  Operation: OperationTypeApply
  Who:       runner@pkrvmqc4gcfdwos
  Version:   1.13.0
  Created:   2025-08-23 19:09:40.121479358 +0000 UTC
```

## Root Cause

This error occurs when:
1. A previous Terraform deployment was interrupted or failed
2. The state lock in S3 was not properly released
3. Subsequent deployments cannot acquire the lock

## Solutions Implemented

### 1. Automated Lock Detection and Recovery (deploy.sh)

The `scripts/deploy.sh` script has been enhanced to:
- Detect state lock errors during deployment
- Extract the lock ID from error messages
- Automatically attempt to force unlock stuck locks
- Retry deployment after unlocking

### 2. Manual Force Unlock Script

A new script `scripts/force-unlock-state.sh` has been created for manual intervention:

```bash
# Usage
./scripts/force-unlock-state.sh <lock-id>

# Example
./scripts/force-unlock-state.sh cf9b30c5-23c6-a9ee-4655-7adac84da06c
```

This script:
- Validates the project is a Terraform project
- Sets up the correct backend configuration
- Initializes Terraform with the S3 backend
- Force unlocks the specified lock ID
- Verifies the fix by running a terraform plan

### 3. Environment Variable Requirements

For these scripts to work in CI/CD, ensure these environment variables are set:
- `TERRAFORM_STATE_BUCKET`: The S3 bucket for state storage
- `TERRAFORM_STATE_BUCKET_REGION`: AWS region for the state bucket
- `ENVIRONMENT_SUFFIX`: Unique suffix for this deployment (e.g., pr2120)

### 4. AWS Credentials

The scripts require valid AWS credentials to access the S3 state backend. In GitHub Actions, this is provided through:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Prevention

To prevent state lock issues:
1. Always run Terraform commands with appropriate timeouts
2. Monitor deployment processes to catch failures early
3. Ensure proper cleanup in CI/CD pipelines
4. Use lock timeouts in terraform commands (`-lock-timeout=300s`)

## Manual Intervention

If automated recovery fails:

1. Identify the stuck lock ID from the error message
2. Run the force unlock script with proper environment variables:
   ```bash
   export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
   export TERRAFORM_STATE_BUCKET_REGION="us-east-1"  
   export ENVIRONMENT_SUFFIX="pr2120"
   ./scripts/force-unlock-state.sh <lock-id>
   ```

3. Verify the deployment can proceed normally

## Files Modified

- `scripts/deploy.sh`: Enhanced with automatic lock detection and recovery
- `scripts/force-unlock-state.sh`: New script for manual lock recovery
- This documentation file