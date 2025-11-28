# Terraform State Management Guide

This document provides guidance on managing Terraform state for the database migration infrastructure.

## State Storage Backend

### Recommended: S3 Backend with DynamoDB Locking

Create backend configuration file:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "database-migration/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY-ID"
  }
}
```

### Setup Backend Resources

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket your-terraform-state-bucket \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-terraform-state-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "your-kms-key-id"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket your-terraform-state-bucket \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Migrate Local State to S3

If you started with local state:

```bash
# 1. Initialize with backend configuration
terraform init -backend-config=backend.tf

# 2. Terraform will prompt to migrate state
# Answer 'yes' to copy local state to S3

# 3. Verify state is in S3
aws s3 ls s3://your-terraform-state-bucket/database-migration/

# 4. Backup local state before removing
cp terraform.tfstate terraform.tfstate.backup

# 5. Remove local state (after verification)
rm terraform.tfstate terraform.tfstate.backup
```

## State Operations

### View Current State

```bash
# List all resources in state
terraform state list

# Show specific resource details
terraform state show aws_rds_cluster.aurora

# Pull state to local file for inspection
terraform state pull > state-backup.json
```

### Backup State

```bash
# Manual backup
terraform state pull > state-backup-$(date +%Y%m%d-%H%M%S).json

# Automated backup script
#!/bin/bash
BACKUP_DIR=~/.terraform-backups
mkdir -p $BACKUP_DIR
cd /path/to/terraform/project
terraform state pull > $BACKUP_DIR/state-backup-$(date +%Y%m%d-%H%M%S).json

# Keep only last 30 backups
ls -t $BACKUP_DIR/state-backup-* | tail -n +31 | xargs rm -f
```

### Restore State from Backup

```bash
# Restore from local backup
terraform state push state-backup-TIMESTAMP.json

# Restore from S3 version
aws s3api list-object-versions \
  --bucket your-terraform-state-bucket \
  --prefix database-migration/terraform.tfstate

aws s3api get-object \
  --bucket your-terraform-state-bucket \
  --key database-migration/terraform.tfstate \
  --version-id VERSION-ID \
  state-restored.json

terraform state push state-restored.json
```

### Import Existing Resources

If resources were created outside Terraform:

```bash
# Import Aurora cluster
terraform import aws_rds_cluster.aurora aurora-cluster-prod-001

# Import Aurora instance
terraform import 'aws_rds_cluster_instance.aurora[0]' aurora-instance-1-prod-001

# Import DMS replication instance
terraform import aws_dms_replication_instance.main dms-instance-prod-001

# Import S3 bucket
terraform import aws_s3_bucket.migration inventory-migration-prod-001
```

### Move Resources Between Modules

```bash
# Move resource within state
terraform state mv aws_rds_cluster.aurora module.database.aws_rds_cluster.aurora

# Move resource to different state file (requires both state files)
terraform state mv -state=source.tfstate -state-out=dest.tfstate aws_rds_cluster.aurora aws_rds_cluster.aurora
```

### Remove Resources from State

```bash
# Remove resource from state without destroying
terraform state rm aws_rds_cluster.aurora

# Useful when:
# - Resource managed outside Terraform
# - Resource manually deleted
# - Splitting infrastructure into multiple state files
```

## Workspace Management

### Using Workspaces for Environments

```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new production

# Create staging workspace
terraform workspace new staging

# Switch between workspaces
terraform workspace select production
terraform workspace select staging

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete staging
```

### Workspace-Specific Variables

```hcl
# variables.tf
locals {
  environment_config = {
    production = {
      aurora_instance_class = "db.r6g.xlarge"
      aurora_instance_count = 3
      dms_instance_class    = "dms.c5.2xlarge"
    }
    staging = {
      aurora_instance_class = "db.r6g.large"
      aurora_instance_count = 2
      dms_instance_class    = "dms.c5.xlarge"
    }
  }

  config = local.environment_config[terraform.workspace]
}

resource "aws_rds_cluster_instance" "aurora" {
  count          = local.config.aurora_instance_count
  instance_class = local.config.aurora_instance_class
  # ...
}
```

## State Locking

### Verify Locking is Working

```bash
# Terminal 1: Start long-running operation
terraform apply

# Terminal 2: Try concurrent operation (should fail with lock error)
terraform plan
# Expected: Error acquiring the state lock

# Verify lock in DynamoDB
aws dynamodb scan \
  --table-name terraform-state-locks \
  --region us-east-1
```

### Force Unlock (Use with Caution)

```bash
# If Terraform crashes and leaves lock
terraform force-unlock LOCK-ID

# Get lock ID from error message or DynamoDB
aws dynamodb scan --table-name terraform-state-locks --region us-east-1
```

## State Security

### Encrypt Sensitive Data

```hcl
# Mark variables as sensitive
variable "aurora_master_password" {
  type      = string
  sensitive = true
}

variable "dms_source_password" {
  type      = string
  sensitive = true
}

# Sensitive values are redacted in CLI output but stored in state
# Ensure state file is encrypted at rest (S3 + KMS)
```

### Access Control

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowTerraformStateAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/TerraformRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::your-terraform-state-bucket/database-migration/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/TerraformRole"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-terraform-state-bucket"
    }
  ]
}
```

## Disaster Recovery

### State Corruption Recovery

```bash
# 1. Stop all Terraform operations

# 2. Pull current state
terraform state pull > state-corrupted.json

# 3. Restore from S3 version history
aws s3api list-object-versions \
  --bucket your-terraform-state-bucket \
  --prefix database-migration/terraform.tfstate \
  --query 'Versions[*].[VersionId,LastModified]' \
  --output table

# 4. Download previous version
aws s3api get-object \
  --bucket your-terraform-state-bucket \
  --key database-migration/terraform.tfstate \
  --version-id GOOD-VERSION-ID \
  state-restored.json

# 5. Validate restored state
cat state-restored.json | jq .

# 6. Push restored state
terraform state push state-restored.json

# 7. Verify with plan
terraform plan
```

### Complete State Loss Recovery

If all state is lost:

```bash
# 1. Create new empty state
terraform init

# 2. Import all resources one by one
# See "Import Existing Resources" section above

# 3. Run plan to verify
terraform plan

# 4. State should show no changes if all resources imported correctly
```

## Best Practices

1. **Always Use Remote State**: Never use local state in production
2. **Enable State Locking**: Prevent concurrent modifications
3. **Enable Versioning**: Allow state recovery from S3 versions
4. **Encrypt State**: Use KMS encryption for sensitive data
5. **Backup Regularly**: Automate state backups
6. **Use Workspaces**: Separate environments (dev/staging/prod)
7. **Limit Access**: Restrict state file access with IAM
8. **Review State**: Regularly audit state for drift
9. **Test Imports**: Validate resource imports before production
10. **Document Changes**: Keep changelog of state operations

## Troubleshooting

### State Drift Detection

```bash
# Check for drift
terraform plan -detailed-exitcode

# Exit codes:
# 0 = No changes
# 1 = Error
# 2 = Changes detected (drift)

# Refresh state from actual infrastructure
terraform refresh

# Show specific resource
terraform state show aws_rds_cluster.aurora
```

### State Conflicts

```bash
# If state conflicts occur during concurrent operations
# 1. Let current operation complete
# 2. Pull latest state
terraform init -reconfigure

# 3. Run plan again
terraform plan
```

### Large State Files

```bash
# Check state file size
terraform state pull | wc -c

# If state is too large (>50MB):
# 1. Split into separate modules
# 2. Use selective applies: terraform apply -target=module.database
# 3. Remove unused resources: terraform state rm
```

## CI/CD Integration

### GitLab CI Example

```yaml
terraform:
  before_script:
    - terraform init -backend-config="backend.tf"
  script:
    - terraform plan -out=tfplan
    - terraform apply tfplan
  only:
    - main
  artifacts:
    paths:
      - tfplan
```

### GitHub Actions Example

```yaml
name: Terraform

on:
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - run: terraform init -backend-config="backend.tf"
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan
```
```