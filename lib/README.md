# Multi-Account AWS Security Framework

This Terraform implementation provides a comprehensive security and compliance framework for managing multiple AWS accounts through AWS Organizations with centralized governance, encryption enforcement, and audit logging.

## Architecture Overview

The infrastructure creates a hierarchical organization structure with three organizational units (OUs):

- Security OU: For security and audit accounts
- Production OU: For production workloads
- Development OU: For development and testing environments

Each OU has inherited Service Control Policies (SCPs) that enforce:

- S3 bucket encryption (SSE-S3 or SSE-KMS only)
- EBS volume encryption
- RDS database encryption
- KMS key protection from accidental deletion

## Key Components

### AWS Organizations
- Multi-OU structure for workload isolation
- Organization trail for centralized CloudTrail logging
- Service Control Policies for governance

### Key Management (KMS)
- Primary KMS key in us-east-1 with annual rotation
- Replica KMS key in us-west-2 for disaster recovery
- Cross-account grants for member account access
- Automatic key rotation enabled

### Cross-Account IAM Roles
Three roles configured with MFA enforcement:

- Security Role: Audit and compliance permissions
- Operations Role: Operational monitoring and management
- Developer Role: Application development permissions

All roles require MFA token for assumption with explicit deny policies for dangerous actions.

### CloudWatch Logs
Centralized logging with:

- 90-day retention policy on all log groups
- KMS encryption for all logs
- Metric filters for security events (unauthorized API calls, root account usage, IAM changes, KMS key disabling)
- CloudWatch alarms for security events
- Cross-account log aggregation support

### AWS Config
Seven compliance rules deployed:

1. S3 bucket server-side encryption enabled
2. EBS volumes encrypted
3. RDS encryption enabled
4. Root account MFA enabled
5. IAM policy without admin access
6. CloudTrail enabled
7. Config enabled

All rules feed into a Security Conformance Pack for organization-wide compliance tracking.

### Audit Trail
- Organization-level CloudTrail logging
- S3 backend with encryption and versioning
- CloudTrail logs encrypted with KMS
- Immutable CloudTrail logging (S3 object lock ready)
- Integration with CloudWatch Logs

## Prerequisites

### AWS Setup
1. AWS Organizations enabled with all features (SCPs)
2. Primary AWS account with permissions to manage organizations
3. Backend S3 bucket created with versioning and encryption:
   ```bash
   aws s3api create-bucket \
     --bucket terraform-state-backend-prod \
     --region us-east-1 \
     --create-bucket-configuration LocationConstraint=us-east-1

   aws s3api put-bucket-versioning \
     --bucket terraform-state-backend-prod \
     --versioning-configuration Status=Enabled

   aws s3api put-bucket-encryption \
     --bucket terraform-state-backend-prod \
     --server-side-encryption-configuration '{
       "Rules": [{
         "ApplyServerSideEncryptionByDefault": {
           "SSEAlgorithm": "AES256"
         }
       }]
     }'
   ```

4. DynamoDB table for state locking:
   ```bash
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

### Local Setup
- Terraform >= 1.0
- AWS CLI v2 configured with credentials
- Appropriate IAM permissions in the management account

## Deployment

### Step 1: Initialize Terraform

```bash
cd lib
terraform init
```

### Step 2: Review and Update Variables

Edit `terraform.tfvars`:

```hcl
# Required changes
environment_suffix = "prod"  # Change as needed
trusted_account_ids = [
  "111111111111",  # Replace with actual member account IDs
  "222222222222"
]

# Optional: Set MFA device ARN if enforcing MFA
mfa_device_arn = "arn:aws:iam::123456789012:mfa/your-mfa-device"
```

### Step 3: Validate Configuration

```bash
terraform validate
terraform fmt -recursive
```

### Step 4: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan to ensure all resources will be created as expected.

### Step 5: Apply Configuration

```bash
terraform apply tfplan
```

This will:
1. Create AWS Organizations with 3 OUs
2. Set up KMS keys with replication
3. Create cross-account IAM roles
4. Enable CloudTrail at organization level
5. Configure CloudWatch Logs groups
6. Deploy 7 AWS Config compliance rules
7. Attach SCPs to OUs

### Step 6: Verify Deployment

```bash
terraform output

# Verify CloudTrail is logging
aws cloudtrail get-trail-status --name organization-trail-prod

# Check Config rules
aws config describe-config-rules --query 'ConfigRules[].ConfigRuleName'

# Verify KMS keys
aws kms list-keys
```

## Resource Naming

All resources include the `environment_suffix` variable for uniqueness:

- KMS keys: `primary-kms-key-{environment_suffix}`, `replica-kms-key-{environment_suffix}`
- IAM roles: `cross-account-security-role-{environment_suffix}`, etc.
- Log groups: `/aws/security/central-logs-{environment_suffix}`, etc.
- S3 buckets: `cloudtrail-logs-{environment_suffix}-{account-id}`

## Destructibility

All resources are fully destroyable with no Retain policies:

```bash
terraform destroy
```

Warning: This will delete all infrastructure including:
- AWS Organizations structure (member accounts must be removed first)
- KMS keys (with 30-day deletion window)
- All CloudTrail logs and Config snapshots in S3
- All CloudWatch Logs

## Security Considerations

### MFA Enforcement
Cross-account roles require MFA tokens. Users must authenticate with:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT:role/cross-account-security-role-prod \
  --role-session-name security-session \
  --serial-number arn:aws:iam::ACCOUNT:mfa/user-name \
  --token-code 123456
```

### KMS Key Management
- Annual automatic rotation enabled
- Cross-account access via key grants
- Deletion protection through SCPs
- CloudTrail encrypted with KMS

### SCPs and Compliance
- SCPs inherited by all OUs
- Encryption enforcement prevents non-compliant resources
- Config rules monitor compliance continuously
- CloudWatch alarms alert on policy violations

### Audit Trail
- All API calls logged in CloudTrail
- Logs encrypted and immutable
- 90-day retention in CloudWatch
- Integration with Config for compliance tracking

## Monitoring and Alerting

CloudWatch Alarms are configured for:

- Unauthorized API calls (threshold: 5 per 5 minutes)
- Root account usage (threshold: 1 occurrence)
- IAM policy changes (immediate alert)
- KMS key disabling (immediate alert)

Set up SNS subscriptions to receive alerts:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:config-notifications-prod \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### CloudTrail Errors
If CloudTrail deployment fails, check:
1. Organization trail is not already enabled
2. S3 bucket policy is correctly configured
3. KMS key policy allows CloudTrail service principal

### Config Issues
If Config rules fail to deploy:
1. Ensure Config recorder is started
2. Verify IAM role has correct permissions
3. Check S3 bucket exists and is accessible

### KMS Replica Key Issues
If replica key creation fails:
1. Ensure both regions are available
2. Check KMS service is enabled in secondary region
3. Verify primary key policy allows replication

### Cross-Account Access
If cross-account role assumption fails:
1. Verify trust policy in member accounts
2. Ensure MFA device is registered
3. Check IAM permissions in trusted accounts

## Cleanup

To destroy the infrastructure:

```bash
# Disable all Config rules first
aws configservice delete-config-rule --config-rule-name <rule-name>

# Disable CloudTrail
aws cloudtrail stop-logging --name organization-trail-prod

# Then destroy with Terraform
terraform destroy
```

Warning: Member accounts must be removed from the organization before organization can be deleted.

## Cost Optimization

- Serverless: Uses CloudWatch and Config for monitoring
- KMS encryption: Pay per API call (minimal cost)
- S3 storage: Only CloudTrail and Config snapshots
- No compute resources: Purely control plane operations

Estimated monthly cost: USD 50-100 for average organization (varies by API call volume).

## Support and Maintenance

### Regular Tasks
- Review Config compliance reports monthly
- Rotate MFA devices as required
- Audit cross-account role usage
- Review CloudWatch logs for security events

### Upgrades
- Update Terraform AWS provider quarterly
- Review new compliance rules and SCPs
- Monitor AWS security recommendations

## Files and Structure

```
lib/
  providers.tf          - AWS provider configuration with S3 backend
  variables.tf          - Input variables and validation rules
  main.tf              - Organizations setup and CloudTrail
  kms.tf               - KMS keys with replication
  iam.tf               - Cross-account roles and policies
  scp.tf               - Service Control Policies
  cloudwatch.tf        - CloudWatch Logs and alarms
  config.tf            - AWS Config rules and conformance pack
  outputs.tf           - Terraform outputs
  terraform.tfvars     - Variable values (update before deployment)
  README.md            - This documentation
```

## License

This Terraform code is provided as-is for AWS infrastructure deployment.
