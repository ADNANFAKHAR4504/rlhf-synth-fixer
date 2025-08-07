# Terraform State Management for PR-Based Environments

This document explains how the Terraform CI/CD pipeline manages state for pull request-based environments.

## Overview

The pipeline creates isolated Terraform state management for each pull request, ensuring that:

- Each PR has its own state file
- Each PR has its own DynamoDB table for state locking
- State files are automatically cleaned up when PRs are closed
- No state conflicts between different PRs

## State Management Strategy

### State File Organization

State files are organized in S3 using the following structure:

```
s3://iac-rlhf-tf-states/
├── prs/
│   ├── pr123/
│   │   └── terraform.tfstate
│   ├── pr456/
│   │   └── terraform.tfstate
│   └── ...
└── environments/
    ├── dev/
    │   └── terraform.tfstate
    ├── staging/
    │   └── terraform.tfstate
    └── prod/
        └── terraform.tfstate
```

### DynamoDB Tables for State Locking

Each PR gets its own DynamoDB table for state locking:

- Table name: `terraform-state-lock-pr{PR_NUMBER}`
- Purpose: Prevent concurrent modifications to the same state file
- Billing: PAY_PER_REQUEST (cost-effective for PR environments)

## CI/CD Pipeline Integration

### Environment Variables

The pipeline uses these environment variables for state management:

```bash
ENVIRONMENT_SUFFIX=pr123                    # PR number or environment name
TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states   # S3 bucket for state files
TERRAFORM_STATE_BUCKET_REGION=us-east-1     # S3 bucket region
AWS_REGION=us-east-1                        # AWS region for resources
```

### Pipeline Steps

1. **Setup Terraform State Infrastructure**
   - Creates PR-specific DynamoDB table if it doesn't exist
   - Ensures S3 bucket exists with proper configuration
   - Enables versioning, encryption, and public access blocking

2. **Terraform Initialization**
   - Uses PR-specific state key: `prs/pr{PR_NUMBER}/terraform.tfstate`
   - Uses PR-specific DynamoDB table: `terraform-state-lock-pr{PR_NUMBER}`
   - Configures backend with encryption enabled

3. **Terraform Operations**
   - Plan, apply, and destroy operations use the PR-specific state
   - State locking prevents concurrent modifications
   - Automatic cleanup of state files and DynamoDB tables

4. **Cleanup**
   - Removes PR-specific state file from S3
   - Deletes PR-specific DynamoDB table
   - Ensures no orphaned resources

## Benefits

### Isolation

- Each PR has completely isolated state
- No risk of state conflicts between PRs
- Independent resource management

### Security

- State files are encrypted at rest
- DynamoDB tables are isolated per PR
- Public access is blocked on S3 bucket

### Cost Efficiency

- DynamoDB tables use PAY_PER_REQUEST billing
- Tables are automatically cleaned up
- No persistent costs for closed PRs

### Reliability

- State locking prevents race conditions
- Versioning provides state history
- Automatic cleanup prevents resource leaks

## Manual Operations

### Viewing State

```bash
# List resources in state
npm run tf:state-list

# Show specific resource
npm run tf:state-show aws_s3_bucket.bucket
```

### Force Unlock State

```bash
# If state is locked, force unlock with lock ID
npm run tf:force-unlock <LOCK_ID>
```

### Manual Cleanup

```bash
# Clean up PR state file
aws s3 rm s3://iac-rlhf-tf-states/prs/pr123/terraform.tfstate

# Clean up PR DynamoDB table
aws dynamodb delete-table --table-name terraform-state-lock-pr123 --region us-east-1
```

## Troubleshooting

### Common Issues

1. **State Lock Errors**
   - Check if another process is running Terraform
   - Use force unlock if necessary
   - Verify DynamoDB table exists

2. **Backend Configuration Errors**
   - Verify S3 bucket exists and is accessible
   - Check DynamoDB table exists and is active
   - Ensure proper AWS credentials

3. **State File Not Found**
   - Check if state file exists in S3
   - Verify state key path is correct
   - Re-initialize if necessary

### Debugging Commands

```bash
# Check backend configuration
terraform -chdir=bin init -backend-config=help

# Validate Terraform configuration
npm run tf:validate

# Check AWS credentials
aws sts get-caller-identity

# List S3 bucket contents
aws s3 ls s3://iac-rlhf-tf-states/prs/

# Check DynamoDB table status
aws dynamodb describe-table --table-name terraform-state-lock-pr123 --region us-east-1
```

## Best Practices

1. **Always use the pipeline** for PR deployments
2. **Don't manually modify state files** in S3
3. **Let the pipeline handle cleanup** automatically
4. **Monitor DynamoDB costs** if you have many concurrent PRs
5. **Use descriptive PR titles** for easier identification

## Security Considerations

- State files contain sensitive information (resource IDs, etc.)
- DynamoDB tables are isolated per PR for security
- S3 bucket has public access blocked
- All state files are encrypted at rest
- Access is controlled via AWS IAM policies
