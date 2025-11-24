# Deployment Guide - Multi-Account AWS Security Framework

This guide provides step-by-step instructions for deploying the Terraform-based multi-account security framework.

## Pre-Deployment Checklist

Before deploying, ensure you have:

1. AWS Account Requirements:
   - Primary management account with Organizations enabled
   - AWS Organizations with all features activated (required for SCPs)
   - Appropriate IAM permissions in the management account

2. Local Tools:
   - Terraform >= 1.0 installed
   - AWS CLI v2 configured with credentials
   - Access to management account

3. AWS Resources:
   - S3 backend bucket: terraform-state-backend-prod (with versioning and encryption)
   - DynamoDB table for state locking: terraform-state-lock
   - KMS key for state encryption (optional but recommended)

## Step 1: Prepare AWS Backend

Create the S3 bucket for Terraform state:

```bash
aws s3api create-bucket \
  --bucket terraform-state-backend-prod \
  --region us-east-1 \
  --profile production

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket terraform-state-backend-prod \
  --versioning-configuration Status=Enabled \
  --profile production

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket terraform-state-backend-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --profile production

# Block public access
aws s3api put-public-access-block \
  --bucket terraform-state-backend-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile production
```

Create the DynamoDB table for state locking:

```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --profile production

# Enable encryption at rest
aws dynamodb update-table \
  --table-name terraform-state-lock \
  --sse-specification Enabled=true,SSEType=KMS \
  --region us-east-1 \
  --profile production
```

## Step 2: Configure Variables

Edit lib/terraform.tfvars with your environment:

```hcl
# Environment identifier
environment_suffix = "prod"

# AWS regions
primary_region   = "us-east-1"
secondary_region = "us-west-2"

# Organization configuration
organization_name = "turing-organization"
organizational_units = [
  "Security",
  "Production",
  "Development"
]

# KMS configuration (365 days = annual rotation)
kms_key_rotation_days = 365

# CloudWatch Logs retention
cloudwatch_log_retention_days = 90

# Enable services
enable_cloudtrail = true
enable_config     = true

# Replace with actual AWS account IDs that will assume cross-account roles
# These are MEMBER account IDs, not the management account
trusted_account_ids = [
  "111111111111",  # Production account ID
  "222222222222"   # Development account ID
]

# Optional: MFA device ARN for enforce MFA on role assumption
# mfa_device_arn = "arn:aws:iam::ACCOUNT_ID:mfa/your-mfa-device"

# Tags applied to all resources
tags = {
  Environment = "production"
  CostCenter  = "security"
  Owner       = "security-team"
  ManagedBy   = "Terraform"
  Project     = "multi-account-security-framework"
}
```

## Step 3: Initialize Terraform

```bash
cd lib

# Initialize Terraform with backend configuration
terraform init

# Output should show:
# - Backend configuration loaded
# - Terraform version verified
# - AWS provider configured
# - Remote state configured
```

## Step 4: Validate Configuration

Validate the Terraform code:

```bash
# Validate syntax
terraform validate

# Format check (fixes formatting)
terraform fmt -recursive

# Check for linting issues (if using tflint)
tflint . 2>/dev/null || true
```

## Step 5: Review Plan

Generate and review the deployment plan:

```bash
# Generate plan
terraform plan -out=tfplan

# This will output:
# - Resources to be created (should be ~75 resources)
# - Resource dependencies
# - Estimated changes

# Review the plan carefully:
# - Verify all resource names include environment_suffix
# - Confirm encryption is enabled on all resources
# - Check IAM role trust policies
# - Review SCP policies
```

Key resources to verify in plan:

1. AWS Organizations:
   - 1 Organization
   - 3 Organizational Units (Security, Production, Development)
   - 1 CloudTrail

2. KMS:
   - 1 Primary KMS key in us-east-1
   - 1 Replica KMS key in us-west-2
   - Multiple KMS grants for cross-account access

3. IAM:
   - 3 Cross-account roles (security, operations, developer)
   - 1 Config service role
   - 3 Role policies with MFA enforcement

4. SCPs:
   - 4 Service Control Policies (S3, EBS, RDS, KMS)
   - 12 Policy attachments (4 policies × 3 OUs)

5. CloudWatch:
   - 5 Log groups with 90-day retention
   - 5 Metric filters
   - 4 Alarms for security events

6. Config:
   - 1 Recorder
   - 1 Delivery channel
   - 7 Compliance rules
   - 1 Conformance pack

7. S3:
   - 2 Buckets (CloudTrail, Config) with encryption and versioning

## Step 6: Deploy Infrastructure

Apply the Terraform configuration:

```bash
# Apply with saved plan
terraform apply tfplan

# This will:
# 1. Create AWS Organizations
# 2. Create organizational units
# 3. Create KMS keys with replication
# 4. Create cross-account IAM roles
# 5. Create S3 buckets for logs and snapshots
# 6. Enable CloudTrail at organization level
# 7. Create CloudWatch Logs groups
# 8. Deploy AWS Config rules
# 9. Attach Service Control Policies
# 10. Create metric filters and alarms

# Deployment typically takes 5-10 minutes
```

## Step 7: Verify Deployment

Verify all resources were created successfully:

```bash
# Check Terraform outputs
terraform output

# Expected outputs:
# - organization_id: o-xxxxxxxxxx
# - organization_root_id: r-xxxx
# - security_ou_id: ou-xxxx-xxxxxxxx
# - production_ou_id: ou-xxxx-xxxxxxxx
# - development_ou_id: ou-xxxx-xxxxxxxx
# - primary_kms_key_arn: arn:aws:kms:us-east-1:...:key/...
# - cross_account_security_role_arn: arn:aws:iam::...:role/...
# - cloudtrail_bucket_name: cloudtrail-logs-prod-...
# - config_bucket_name: aws-config-bucket-prod-...
```

Verify organization structure:

```bash
# List organizations
aws organizations describe-organization --region us-east-1

# List organizational units
aws organizations list-organizational-units-for-parent \
  --parent-id r-xxxx \
  --region us-east-1

# Should show 3 OUs: Security, Production, Development
```

Verify CloudTrail:

```bash
# Check CloudTrail status
aws cloudtrail describe-trails \
  --region us-east-1 \
  --query 'trailList[*].[Name,IsMultiRegionTrail,S3BucketName]'

# Get trail status
aws cloudtrail get-trail-status \
  --name organization-trail-prod \
  --region us-east-1
```

Verify KMS keys:

```bash
# List KMS keys
aws kms list-keys --region us-east-1

# Check primary key
aws kms describe-key \
  --key-id alias/security-primary-prod \
  --region us-east-1

# Check replica key
aws kms describe-key \
  --key-id alias/security-replica-prod \
  --region us-west-2
```

Verify Config rules:

```bash
# List Config rules
aws configservice describe-config-rules \
  --query 'ConfigRules[*].ConfigRuleName' \
  --region us-east-1

# Should show 7 rules deployed
```

Verify SCPs:

```bash
# List policies
aws organizations list-policies \
  --filter SERVICE_CONTROL_POLICY \
  --region us-east-1

# Check policy attachments
aws organizations list-targets-for-policy \
  --policy-id p-xxxxxxxxxx \
  --region us-east-1
```

## Step 8: Run Tests

Run the comprehensive test suite:

```bash
cd lib

# View all test outputs
terraform output | grep "^test_"

# Should show approximately 100 tests, all with value = true

# Count passing tests
terraform output -json | jq '[.[] | select(. == true)] | length'

# If any tests fail, investigate with:
terraform output -json | jq 'to_entries[] | select(.value == false) | .key'
```

## Post-Deployment Configuration

After deployment, complete these steps:

1. Configure member accounts:
   - Add member accounts to organizations
   - Invite accounts to their respective OUs
   - Enable Config/CloudTrail in member accounts

2. Enable SNS notifications:
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT:config-notifications-prod \
     --protocol email \
     --notification-endpoint security-team@example.com \
     --region us-east-1
   ```

3. Configure CloudWatch Logs:
   ```bash
   # Create subscription from member accounts to central logs
   aws logs put-subscription-filter \
     --log-group-name /aws/lambda/my-function \
     --filter-name route-to-central \
     --filter-pattern "" \
     --destination-arn arn:aws:logs:us-east-1:ACCOUNT:destination:central-logs \
     --region us-east-1
   ```

4. Set up cross-account access:
   - Create IAM users/roles in member accounts
   - Configure trust policies to allow role assumption
   - Distribute role ARNs to team members

5. Document compliance procedures:
   - Map Config rules to compliance requirements
   - Set up compliance tracking
   - Define remediation procedures for non-compliant resources

## Monitoring and Alerting

Monitor the deployed infrastructure:

1. CloudWatch Alarms:
   - Check alarms in CloudWatch console
   - Subscribe to SNS notifications
   - Set up escalation procedures

2. AWS Config Dashboard:
   - Review compliance status
   - Check for non-compliant resources
   - Create remediation workflows

3. CloudTrail Logs:
   - Monitor CloudTrail for API calls
   - Review CloudWatch Logs for security events
   - Create custom metric filters as needed

4. Security Center:
   - Use AWS Security Hub for centralized monitoring
   - Review findings from Config
   - Track remediation progress

## Maintenance Tasks

Regular maintenance:

1. Weekly:
   - Check CloudWatch alarms
   - Review Config compliance dashboard
   - Verify CloudTrail is logging

2. Monthly:
   - Review CloudTrail logs for suspicious activity
   - Check cross-account role usage
   - Audit IAM policies

3. Quarterly:
   - Update SCPs as needed
   - Review and update Config rules
   - Assess compliance coverage

4. Annually:
   - Rotate MFA devices
   - Update trust policies
   - Review security architecture
   - Plan upgrades

## Troubleshooting

Common deployment issues:

1. Organization Already Exists:
   ```
   Error: Error creating organization: OrganizationAlreadyExistsException
   Solution: Use existing organization or delete old organization first
   ```

2. CloudTrail Permission Denied:
   ```
   Error: Error creating CloudTrail: Service does not have sufficient permissions
   Solution: Verify S3 bucket policy allows CloudTrail service
   ```

3. Config Recorder Error:
   ```
   Error: Error starting Config recorder: InvalidRecorderNameException
   Solution: Ensure recorder doesn't already exist or delete old recorder
   ```

4. KMS Key Replication Failed:
   ```
   Error: Error creating KMS replica key: UnsupportedOperationException
   Solution: Ensure KMS is available in secondary region
   ```

5. State Lock Timeout:
   ```
   Error: Error acquiring the state lock
   Solution: Check DynamoDB table exists and is accessible
   ```

## Rollback Procedure

If deployment fails or needs rollback:

```bash
# Option 1: Destroy specific resources
terraform destroy -target aws_cloudtrail.organization

# Option 2: Destroy everything
terraform destroy

# WARNING: This will delete:
# - All AWS infrastructure
# - All logs in S3
# - KMS keys (30-day deletion window)
# - Organizations (requires removing member accounts first)
```

## Cost Estimation

Expected monthly costs:

- Organizations: Free (no charge)
- CloudTrail: ~USD 2-5 per 100,000 events
- KMS: ~USD 1 per key + usage
- Config Rules: ~USD 2 per rule
- CloudWatch Logs: ~USD 0.50 per GB ingested
- S3 Storage: Variable based on log volume

Total estimate: USD 50-150/month for typical organization

## Support and Issues

For deployment issues:

1. Check Terraform logs:
   ```bash
   TF_LOG=DEBUG terraform apply 2>&1 | tee deploy.log
   ```

2. Verify AWS API calls:
   ```bash
   aws cloudtrail lookup-events --region us-east-1
   ```

3. Check resource state:
   ```bash
   terraform state show aws_organizations_organization.main
   ```

4. Review CloudTrail events for errors
5. Check AWS CloudWatch Logs for service logs
