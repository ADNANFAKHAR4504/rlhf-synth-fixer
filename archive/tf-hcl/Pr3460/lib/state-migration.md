# Terraform State Migration Guide
# Migration from us-west-1 to us-west-2

## Overview
This guide provides exact Terraform CLI commands for migrating infrastructure state from us-west-1 (source) to us-west-2 (target) while preserving resource identities and minimizing downtime.

## Prerequisites
- Terraform >= 1.5.0 installed
- AWS CLI configured with appropriate permissions
- Access to both us-west-1 and us-west-2 regions
- Backup of existing Terraform state from us-west-1

## Phase 1: Preparation and State Backup

### Step 1.1: Create State Bucket in Target Region (us-west-2)
```bash
# Create S3 bucket for state storage in us-west-2
aws s3api create-bucket \
  --bucket serverless-app-terraform-state-<ACCOUNT_ID> \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning for state recovery
aws s3api put-bucket-versioning \
  --bucket serverless-app-terraform-state-<ACCOUNT_ID> \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket serverless-app-terraform-state-<ACCOUNT_ID> \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

### Step 1.2: Backup Existing us-west-1 State
```bash
# Download current state from us-west-1
cd /path/to/project
terraform state pull > terraform-uswest1-backup-$(date +%Y%m%d-%H%M%S).tfstate

# Copy to S3 for safekeeping
aws s3 cp terraform-uswest1-backup-*.tfstate \
  s3://serverless-app-terraform-state-<ACCOUNT_ID>/backups/
```

### Step 1.3: Create Workspaces for Migration
```bash
# Initialize Terraform
terraform init

# Create workspace for source region state
terraform workspace new source-uswest1
terraform workspace select source-uswest1

# Create workspace for target region deployment
terraform workspace new target-uswest2
terraform workspace select target-uswest2
```

## Phase 2: Deploy Infrastructure in us-west-2

### Step 2.1: Initialize Backend Configuration
```bash
# Switch to target workspace
terraform workspace select target-uswest2

# Update backend configuration in backend.tf
# key = "serverless-app/us-west-2/terraform.tfstate"

# Initialize with new backend
terraform init -reconfigure \
  -backend-config="bucket=serverless-app-terraform-state-<ACCOUNT_ID>" \
  -backend-config="key=serverless-app/us-west-2/terraform.tfstate" \
  -backend-config="region=us-west-2"
```

### Step 2.2: Plan and Apply Target Infrastructure
```bash
# Set target region variables
export TF_VAR_target_region="us-west-2"
export TF_VAR_source_region="us-west-1"

# Review plan
terraform plan -out=migration-plan.tfplan

# Apply infrastructure (creates new resources in us-west-2)
terraform apply migration-plan.tfplan
```

## Phase 3: Data Migration

### Step 3.1: DynamoDB Table Migration
```bash
# Export data from us-west-1 DynamoDB table
aws dynamodb scan \
  --table-name serverless_app_primary_prod \
  --region us-west-1 \
  --output json > dynamodb-export-uswest1.json

# Import data to us-west-2 DynamoDB table
aws dynamodb batch-write-item \
  --request-items file://dynamodb-import-uswest2.json \
  --region us-west-2
```

### Step 3.2: S3 Bucket Data Migration
```bash
# Sync S3 data from us-west-1 to us-west-2
aws s3 sync \
  s3://serverless-app-data-<ACCOUNT_ID>-us-west-1 \
  s3://serverless-app-data-<ACCOUNT_ID>-us-west-2 \
  --source-region us-west-1 \
  --region us-west-2 \
  --storage-class STANDARD \
  --metadata-directive COPY
```

### Step 3.3: Secrets Manager Migration
```bash
# Export secrets from us-west-1
aws secretsmanager get-secret-value \
  --secret-id serverless-app-secrets-prod \
  --region us-west-1 \
  --output json > secrets-uswest1.json

# Import to us-west-2
aws secretsmanager create-secret \
  --name serverless-app-secrets-prod \
  --secret-string file://secrets-value.json \
  --region us-west-2
```

## Phase 4: State Import for Tracking (if needed)

If you want to track existing us-west-1 resources in Terraform state for validation:

```bash
# Switch to source workspace
terraform workspace select source-uswest1

# Import existing us-west-1 VPC
terraform import 'aws_vpc.main' vpc-0abc123def456789a

# Import existing us-west-1 DynamoDB table
terraform import 'aws_dynamodb_table.primary' serverless_app_primary_prod

# Import existing us-west-1 Lambda function
terraform import 'aws_lambda_function.processor' serverless-app-processor-prod

# Note: This is optional and only needed if you want to manage us-west-1 resources via Terraform
```

## Phase 5: Cross-Region Validation

### Step 5.1: Verify us-west-2 Resources
```bash
# Switch to target workspace
terraform workspace select target-uswest2

# Verify state matches infrastructure
terraform plan

# Should output: "No changes. Infrastructure is up-to-date."

# List all resources in state
terraform state list

# Inspect specific resources
terraform state show aws_vpc.main
terraform state show aws_dynamodb_table.primary
terraform state show aws_lambda_function.processor
```

### Step 5.2: Validate Data Migration
```bash
# Check DynamoDB item count
aws dynamodb describe-table \
  --table-name serverless_app_primary_prod \
  --region us-west-2 \
  --query 'Table.ItemCount'

# Check S3 object count
aws s3 ls s3://serverless-app-data-<ACCOUNT_ID>-us-west-2 \
  --recursive --summarize | grep "Total Objects"

# Test Lambda function
aws lambda invoke \
  --function-name serverless-app-processor-prod \
  --region us-west-2 \
  --payload '{"test": "migration"}' \
  response.json
```

## Phase 6: Workspace Cleanup (Post-Cutover)

After successful cutover to us-west-2:

```bash
# List all workspaces
terraform workspace list

# Switch to default or target workspace
terraform workspace select target-uswest2

# Delete source workspace (optional, after confirming migration success)
terraform workspace delete source-uswest1

# Rename target workspace to default (optional)
# This makes target-uswest2 the primary workspace
```

## State File Locations

After migration, state files are organized as:
```
s3://serverless-app-terraform-state-<ACCOUNT_ID>/
├── backups/
│   └── terraform-uswest1-backup-20250103-193000.tfstate
├── serverless-app/
│   ├── us-west-1/
│   │   └── terraform.tfstate (archived, read-only)
│   └── us-west-2/
│       └── terraform.tfstate (active, primary)
```

## Rollback Procedure

If migration fails and rollback to us-west-1 is needed:

```bash
# Switch to source workspace
terraform workspace select source-uswest1

# Restore backed-up state
terraform state push terraform-uswest1-backup-<timestamp>.tfstate

# Re-point DNS to us-west-1 (see runbook.md)

# Destroy us-west-2 resources (if needed)
terraform workspace select target-uswest2
terraform destroy -auto-approve
```

## Important Notes

1. **State Locking**: Always use DynamoDB table for state locking to prevent concurrent modifications
2. **Backups**: Keep multiple state backups before and after each migration phase
3. **Testing**: Perform dry-runs in non-production environments first
4. **Downtime**: Schedule migration during low-traffic windows
5. **Validation**: Thoroughly test us-west-2 infrastructure before DNS cutover
6. **Monitoring**: Keep CloudWatch alarms active in both regions during migration
7. **Cost**: Be aware of data transfer costs between regions

## Verification Checklist

- [ ] State bucket created and configured in us-west-2
- [ ] State locking table created in us-west-2
- [ ] us-west-1 state backed up to S3
- [ ] Workspaces created (source-uswest1, target-uswest2)
- [ ] us-west-2 infrastructure deployed successfully
- [ ] All resources in Terraform state
- [ ] DynamoDB data migrated and verified
- [ ] S3 data synced and verified
- [ ] Secrets migrated to us-west-2
- [ ] Lambda functions tested in us-west-2
- [ ] API Gateway endpoints accessible
- [ ] CloudWatch metrics flowing
- [ ] No drift detected (terraform plan shows no changes)

## Support and Troubleshooting

### Common Issues

**Issue**: State lock timeout
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

**Issue**: Backend initialization fails
```bash
# Reconfigure backend
terraform init -reconfigure -upgrade
```

**Issue**: Resource already exists error
```bash
# Import existing resource
terraform import <resource_type>.<resource_name> <resource_id>
```

**Issue**: State drift detected
```bash
# Refresh state from actual infrastructure
terraform refresh

# Or during plan
terraform plan -refresh-only
```

For additional support, refer to:
- AWS Terraform Provider documentation
- Terraform state management best practices
- AWS migration hub resources
