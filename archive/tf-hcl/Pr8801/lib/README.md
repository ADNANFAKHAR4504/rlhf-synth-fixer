# Multi-Account Security Framework with Centralized Key Management

This Terraform configuration implements a comprehensive zero-trust security architecture across AWS multi-account structure with centralized encryption key management and granular access controls that comply with PCI-DSS requirements.

## Architecture Overview

### Components Deployed

1. **AWS Organizations Structure**
   - Root organization with full feature set enabled
   - Three Organizational Units (OUs):
     - Security OU
     - Production OU
     - Development OU
   - AWS service access enabled for CloudTrail, Config, GuardDuty, and Security Hub

2. **Cross-Account IAM Roles**
   - Security Audit Role: Read-only access with MFA enforcement
   - Compliance Audit Role: Compliance-specific read access with MFA enforcement
   - MFA requirement: Token must be < 1 hour old for AssumeRole operations

3. **KMS Multi-Region Encryption**
   - Primary KMS key in us-east-1 with automatic annual rotation
   - Replica KMS key in eu-west-1
   - AES-256 encryption standard
   - Customer-managed keys for all sensitive data

4. **Service Control Policies (SCPs)**
   - Enforce S3 bucket encryption (AES256 or KMS)
   - Enforce EBS volume encryption
   - Enforce RDS instance encryption
   - Prevent disabling of CloudWatch Logs
   - Applied to all three OUs

5. **IAM Security Policies**
   - Root user action restrictions
   - Tagging compliance enforcement
   - Least-privilege access examples
   - No wildcard permissions except for read-only actions

6. **CloudWatch Logs**
   - IAM activity logging with 90-day retention
   - CloudTrail logs with 90-day retention
   - Encrypted using KMS customer-managed keys

7. **AWS Config Compliance Monitoring**
   - Configuration recorder tracking all resources
   - S3 delivery channel for compliance data
   - 8 security compliance rules:
     - S3 bucket encryption enabled
     - EBS volume encryption enabled
     - RDS storage encryption enabled
     - IAM password policy compliance
     - IAM user MFA enabled
     - Root account MFA enabled
     - CloudTrail enabled
     - CloudWatch log group encryption

8. **CloudTrail Organization Trail**
   - Multi-region trail covering all accounts
   - Log file validation enabled
   - Integration with CloudWatch Logs
   - S3 storage with KMS encryption

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform 1.5+ installed
- Access to AWS Organizations management account
- Permissions to create Organizations, IAM roles, KMS keys, and SCPs

## Deployment Instructions

### Step 1: Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=<your-state-bucket>" \
  -backend-config="key=security-framework/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

### Step 2: Review the Planned Changes

```bash
terraform plan \
  -var="environment_suffix=<your-suffix>" \
  -var="aws_region=us-east-1" \
  -var="repository=<repo-name>" \
  -var="commit_author=<author>" \
  -var="pr_number=<pr>" \
  -var="team=<team>"
```

### Step 3: Deploy the Infrastructure

```bash
terraform apply \
  -var="environment_suffix=<your-suffix>" \
  -var="aws_region=us-east-1" \
  -var="repository=<repo-name>" \
  -var="commit_author=<author>" \
  -var="pr_number=<pr>" \
  -var="team=<team>"
```

### Step 4: Verify Deployment

```bash
# Check Organizations structure
aws organizations list-organizational-units-for-parent --parent-id <root-id>

# Verify KMS keys
aws kms list-keys --region us-east-1
aws kms list-keys --region eu-west-1

# Check Config rules
aws configservice describe-config-rules --region us-east-1

# Verify CloudTrail
aws cloudtrail describe-trails --region us-east-1
```

## Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | Primary AWS region | `us-east-1` | No |
| `environment_suffix` | Environment suffix for resource naming | `dev` | No |
| `repository` | Repository name for tagging | `unknown` | No |
| `commit_author` | Commit author for tagging | `unknown` | No |
| `pr_number` | PR number for tagging | `unknown` | No |
| `team` | Team name for tagging | `unknown` | No |

## Important Security Considerations

### Multi-Factor Authentication (MFA)

All cross-account IAM role assumptions require:
- MFA device authentication
- MFA token age < 1 hour
- This prevents unauthorized access even if credentials are compromised

### Encryption at Rest

All data is encrypted using:
- KMS customer-managed keys (not AWS-managed keys)
- AES-256 encryption standard
- Automatic annual key rotation
- Multi-region key replication for disaster recovery

### Service Control Policies

SCPs are preventive controls that:
- Cannot be bypassed by any user or role
- Apply to all accounts in the OU
- Enforce encryption for S3, EBS, and RDS
- Protect CloudWatch Logs from deletion

### Least Privilege Access

IAM policies follow least privilege principles:
- Specific resource ARNs (no wildcards except for read-only)
- Explicit deny for root user actions
- Required tags enforcement
- Read-only access for audit roles

### Compliance Monitoring

AWS Config continuously monitors:
- Encryption compliance (S3, EBS, RDS, CloudWatch)
- IAM security (password policy, MFA)
- CloudTrail status
- Automatic detection of non-compliant resources

## Post-Deployment Steps

1. **Create Member Accounts**
   ```bash
   aws organizations create-account \
     --email security@example.com \
     --account-name "Security Account"

   aws organizations create-account \
     --email production@example.com \
     --account-name "Production Account"

   aws organizations create-account \
     --email development@example.com \
     --account-name "Development Account"
   ```

2. **Move Accounts to OUs**
   ```bash
   aws organizations move-account \
     --account-id <security-account-id> \
     --source-parent-id <root-id> \
     --destination-parent-id <security-ou-id>

   aws organizations move-account \
     --account-id <production-account-id> \
     --source-parent-id <root-id> \
     --destination-parent-id <production-ou-id>

   aws organizations move-account \
     --account-id <development-account-id> \
     --source-parent-id <root-id> \
     --destination-parent-id <development-ou-id>
   ```

3. **Configure IAM Password Policy**
   ```bash
   aws iam update-account-password-policy \
     --minimum-password-length 14 \
     --require-symbols \
     --require-numbers \
     --require-uppercase-characters \
     --require-lowercase-characters \
     --allow-users-to-change-password \
     --max-password-age 90 \
     --password-reuse-prevention 24
   ```

4. **Enable Root Account MFA**
   - Log in to each account with root credentials
   - Navigate to IAM console
   - Enable MFA for root user using virtual or hardware MFA device

5. **Test Cross-Account Access**
   ```bash
   # Assume security audit role with MFA
   aws sts assume-role \
     --role-arn <security-audit-role-arn> \
     --role-session-name test-session \
     --serial-number <mfa-device-arn> \
     --token-code <mfa-token>
   ```

## Compliance Features

### PCI-DSS Compliance

This architecture addresses key PCI-DSS requirements:

- **Requirement 3**: Protect stored cardholder data
  - All data encrypted using KMS customer-managed keys
  - Automatic key rotation enabled

- **Requirement 7**: Restrict access to cardholder data
  - Least privilege IAM policies
  - MFA enforcement for cross-account access

- **Requirement 8**: Identify and authenticate access
  - MFA required for privileged operations
  - Root user actions restricted

- **Requirement 10**: Track and monitor all access
  - CloudTrail logging all API calls
  - CloudWatch Logs with 90-day retention
  - AWS Config continuous compliance monitoring

- **Requirement 11**: Regularly test security systems
  - AWS Config rules for continuous monitoring
  - Automated compliance checks

## Monitoring and Alerts

### CloudWatch Logs

Two log groups are created:
- `/aws/iam/activity-<suffix>`: IAM-related activities
- `/aws/cloudtrail/organization-<suffix>`: All AWS API calls

### CloudTrail

Organization trail captures:
- All management events
- Multi-region coverage
- Log file validation
- Integration with CloudWatch Logs

### AWS Config

Continuous monitoring with automatic compliance checks:
- Non-compliant resources flagged immediately
- Compliance dashboard in AWS Console
- Historical configuration tracking

## Cost Optimization Notes

- CloudTrail: ~$2/month per 100k events
- AWS Config: ~$2/month per active rule per region
- KMS: ~$1/month per key + $0.03 per 10k requests
- CloudWatch Logs: ~$0.50/GB ingested
- S3 storage: Standard pricing for log storage

## Disaster Recovery

### Multi-Region Architecture

- Primary region: us-east-1
- Secondary region: eu-west-1
- KMS keys replicated across regions
- CloudTrail and Config are region-agnostic

### Recovery Procedures

If primary region fails:
1. KMS replica key in eu-west-1 automatically available
2. CloudTrail logs stored in S3 (region-independent)
3. AWS Config data accessible via S3
4. IAM roles and SCPs are global resources

## Cleanup Instructions

To destroy all resources:

```bash
terraform destroy \
  -var="environment_suffix=<your-suffix>" \
  -var="aws_region=us-east-1"
```

**WARNING**: This will:
- Delete all AWS Config rules and recordings
- Delete CloudTrail and associated logs
- Delete KMS keys (with 7-day deletion window)
- Remove all SCPs
- Delete IAM roles and policies
- Dismantle AWS Organizations structure

## Troubleshooting

### Issue: Organization Already Exists

If you see "OrganizationAlreadyExistsException":
- AWS only allows one organization per management account
- Use `terraform import` to import existing organization
- Or deploy in a different AWS account

### Issue: SCP Attachment Fails

If SCPs fail to attach:
- Verify that SCPs are enabled in your organization
- Check that you're using the management account
- Ensure the OU IDs are correct

### Issue: KMS Replica Creation Fails

If KMS replica fails:
- Verify that the primary key is in "Enabled" state
- Check that you have permissions in both regions
- Ensure the replica key is being created in a different region

### Issue: CloudTrail Validation Fails

If CloudTrail fails to create:
- Verify S3 bucket policy is in place
- Check that CloudWatch Logs role has correct permissions
- Ensure KMS key policy allows CloudTrail to encrypt

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**:
   - Review AWS Config compliance dashboard
   - Check CloudTrail logs for anomalies
   - Verify KMS key rotation status

2. **Quarterly**:
   - Review and update IAM policies
   - Audit SCPs for effectiveness
   - Test cross-account role assumption

3. **Annually**:
   - Review and update password policy
   - Audit organization structure
   - Update compliance documentation

### Additional Resources

- [AWS Organizations Best Practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)
- [KMS Key Management Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [PCI-DSS on AWS](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)

## License

This code is provided as-is for demonstration purposes. Review and test thoroughly before using in production environments.
