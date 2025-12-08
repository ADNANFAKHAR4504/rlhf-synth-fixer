# Terraform Backend Configuration

## Overview

This Terraform configuration uses an S3 backend to store state files. The backend is configured to prevent resource creation conflicts by isolating state per environment using unique state keys.

## State Bucket Details

- **Bucket Name**: `iac-rlhf-tf-states-***` (provided by CI/CD environment)
- **Region**: `us-east-1`
- **Encryption**: Enabled (server-side encryption)
- **State Key Pattern**: `prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate`

## How It Works

1. **State Isolation**: Each PR/environment gets its own state file using a unique key path
2. **Conflict Prevention**: Separate state files prevent resource naming conflicts between environments
3. **State Locking**: DynamoDB table ensures only one terraform operation runs at a time
4. **Encryption**: All state files are encrypted at rest

## Initialization

The backend is initialized with the following command (handled by CI/CD):

```bash
terraform init \
  -backend-config=bucket=iac-rlhf-tf-states-*** \
  -backend-config=key=prs/pr7302/terraform.tfstate \
  -backend-config=region=us-east-1 \
  -backend-config=encrypt=true
```

## Environment-Specific State

Each environment suffix (e.g., `pr7302`) gets its own state file:

- PR 7302: `prs/pr7302/terraform.tfstate`
- PR 7303: `prs/pr7303/terraform.tfstate`
- Production: `production/terraform.tfstate`

This ensures complete isolation and prevents one environment from affecting another.

## Benefits

1. **No Conflicts**: Multiple PRs can deploy simultaneously without interfering
2. **State Safety**: Locked state prevents concurrent modifications
3. **Auditability**: Each environment's state is tracked separately
4. **Recovery**: State versioning allows rollback if needed
5. **Security**: Encryption protects sensitive data in state files

## Troubleshooting

### Issue: "Error configuring the backend"

**Solution**: Ensure all backend-config parameters are provided during init.

### Issue: "Error acquiring state lock"

**Solution**: Another terraform operation is running. Wait for it to complete or manually release the lock.

### Issue: "NoSuchBucket"

**Solution**: Verify the state bucket exists and you have access to it.

## Local Development

For local development, you can use a local backend or configure your own S3 bucket:

```bash
# Use local backend (not recommended for team work)
terraform init -backend=false

# Use your own S3 bucket
terraform init \
  -backend-config=bucket=my-terraform-states \
  -backend-config=key=dev/terraform.tfstate \
  -backend-config=region=us-east-1
```

## State Management Commands

```bash
# Show current state
terraform show

# List resources in state
terraform state list

# Pull remote state
terraform state pull

# Push local state (use with caution)
terraform state push

# Remove a resource from state (doesn't destroy resource)
terraform state rm <resource_address>
```

## Best Practices

1. **Never** commit state files to Git
2. **Always** use remote state for team collaboration
3. **Use** state locking to prevent conflicts
4. **Enable** encryption for sensitive data
5. **Backup** state files regularly (S3 versioning helps)
6. **Isolate** state per environment to prevent cross-contamination
