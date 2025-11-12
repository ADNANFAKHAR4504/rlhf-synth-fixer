# Terraform State Migration Guide

## Overview

This guide provides step-by-step instructions for migrating AWS infrastructure from us-west-1 to us-west-2 using Terraform workspaces and state management.

## Prerequisites

- Terraform 1.0+ installed
- AWS CLI configured with appropriate credentials
- Access to both us-west-1 (source) and us-west-2 (target) regions
- S3 bucket and DynamoDB table for backend created
- backend.tf configured with actual bucket and table names

## Migration Strategy

The migration uses Terraform workspaces to maintain separate state files for each region. This allows:

- Independent management of source and target infrastructure
- Safe state operations without affecting live resources
- Easy rollback capability
- Resource ID tracking and mapping

## Step 1: Initialize Terraform Backend

```bash
# Initialize Terraform with the S3 backend
terraform init

# Verify backend configuration
terraform version
terraform workspace list
```

## Step 2: Create Workspaces for Each Region

```bash
# Create workspace for source region (us-west-1)
terraform workspace new us-west-1

# Create workspace for target region (us-west-2)
terraform workspace new us-west-2

# List all workspaces to verify
terraform workspace list
```

## Step 3: Import Existing Resources (Source Region)

If you have existing infrastructure in us-west-1 that's not yet managed by Terraform:

```bash
# Switch to us-west-1 workspace
terraform workspace select us-west-1

# Import VPC
terraform import aws_vpc.main vpc-XXXXXXXX

# Import subnets
terraform import 'aws_subnet.public[0]' subnet-XXXXXXXX
terraform import 'aws_subnet.public[1]' subnet-YYYYYYYY
terraform import 'aws_subnet.private[0]' subnet-ZZZZZZZZ
terraform import 'aws_subnet.private[1]' subnet-AAAAAAAA

# Import Internet Gateway
terraform import aws_internet_gateway.main igw-XXXXXXXX

# Import route tables
terraform import aws_route_table.public rtb-XXXXXXXX
terraform import aws_route_table.private rtb-YYYYYYYY

# Import security groups
terraform import aws_security_group.web sg-XXXXXXXX
terraform import aws_security_group.app sg-YYYYYYYY
terraform import aws_security_group.database sg-ZZZZZZZZ

# Import EC2 instances
terraform import 'aws_instance.web[0]' i-XXXXXXXX
terraform import 'aws_instance.web[1]' i-YYYYYYYY
terraform import 'aws_instance.app[0]' i-ZZZZZZZZ
terraform import 'aws_instance.app[1]' i-AAAAAAAA

# Import RDS instance
terraform import aws_db_instance.main db-identifier

# Import S3 bucket
terraform import aws_s3_bucket.app_data bucket-name

# Import IAM resources
terraform import aws_iam_role.ec2_role role-name
terraform import aws_iam_instance_profile.ec2_profile profile-name
```

## Step 4: Verify Source Region State

```bash
# Ensure workspace is us-west-1
terraform workspace select us-west-1

# Validate configuration
terraform validate

# Check current state
terraform state list

# Create plan to verify no changes (state matches reality)
terraform plan

# Expected output: "No changes. Infrastructure is up-to-date."
```

## Step 5: Backup Source State

```bash
# Pull current state to local file
terraform state pull > state-us-west-1-backup.json

# Store backup securely
aws s3 cp state-us-west-1-backup.json s3://your-backup-bucket/terraform-states/us-west-1-$(date +%Y%m%d-%H%M%S).json
```

## Step 6: Deploy Target Region Infrastructure

```bash
# Switch to target region workspace
terraform workspace select us-west-2

# Create terraform.tfvars for us-west-2
cat > terraform.tfvars <<EOF
aws_region = "us-west-2"
environment = "prod"
environment_suffix = "prod-usw2"
availability_zones = ["us-west-2a", "us-west-2b"]
vpc_cidr = "10.0.0.0/16"
web_instance_count = 2
app_instance_count = 2
db_instance_class = "db.t3.small"
db_name = "appdb"
db_username = "dbadmin"
db_password = "REPLACE_WITH_SECURE_PASSWORD"
enable_nat_gateway = false
EOF

# Validate configuration
terraform validate

# Review plan
terraform plan -out=us-west-2.tfplan

# Apply configuration to create resources in us-west-2
terraform apply us-west-2.tfplan

# Save outputs
terraform output > us-west-2-outputs.txt
```

## Step 7: Verify Target Region Deployment

```bash
# Check state of target region
terraform state list

# Verify all resources created
terraform show

# Test connectivity to new resources
# (Application-specific testing should be performed here)
```

## Step 8: Resource ID Mapping

After deployment, document the mapping between old and new resource IDs:

```bash
# Extract resource IDs from both regions
terraform workspace select us-west-1
terraform state show aws_vpc.main | grep "^id" > us-west-1-ids.txt

terraform workspace select us-west-2
terraform state show aws_vpc.main | grep "^id" > us-west-2-ids.txt

# Compare and update id-mapping.csv with actual values
```

## Step 9: State Verification Commands

```bash
# Verify state integrity for us-west-1
terraform workspace select us-west-1
terraform state list
terraform plan

# Verify state integrity for us-west-2
terraform workspace select us-west-2
terraform state list
terraform plan

# Check for drift
terraform refresh
terraform plan
```

## Step 10: State Migration Validation

```bash
# Validate workspace separation
terraform workspace list
# Should show: default, us-west-1, us-west-2

# Verify backend storage
aws s3 ls s3://terraform-state-bucket-YOUR-SUFFIX/workspaces/ --recursive

# Check state lock table
aws dynamodb scan --table-name terraform-state-lock-YOUR-SUFFIX --region us-west-2
```

## Rollback Procedures

If issues occur during migration:

### Rollback Step 1: Restore from Backup

```bash
# Switch to affected workspace
terraform workspace select us-west-2

# Restore state from backup
terraform state push state-us-west-2-backup.json
```

### Rollback Step 2: Destroy Target Resources

```bash
# If new region has issues, destroy it
terraform workspace select us-west-2
terraform destroy -auto-approve

# Switch back to source region
terraform workspace select us-west-1
```

### Rollback Step 3: Verify Source Region

```bash
# Ensure source region is still operational
terraform workspace select us-west-1
terraform plan
# Should show no changes
```

## Common Issues and Solutions

### Issue: Import command fails with "resource already managed"

**Solution**: Check if resource is already in state with `terraform state list`

### Issue: Plan shows unexpected changes after import

**Solution**: Adjust configuration to match actual resource attributes

### Issue: State lock error

**Solution**: Force unlock with `terraform force-unlock LOCK_ID`

### Issue: Backend initialization fails

**Solution**: Verify S3 bucket and DynamoDB table exist and are accessible

## State Management Best Practices

1. Always backup state before major operations
2. Use workspaces to isolate environments
3. Enable versioning on S3 backend bucket
4. Regularly run `terraform plan` to check for drift
5. Document all manual changes to infrastructure
6. Keep state files secure (they may contain sensitive data)
7. Use state locking to prevent concurrent modifications

## Next Steps

After successful state migration:

1. Proceed with data migration (see runbook.md)
2. Configure DNS cutover (see runbook.md)
3. Monitor both regions during transition
4. Update documentation with actual resource IDs
5. Decommission source region after validation period
