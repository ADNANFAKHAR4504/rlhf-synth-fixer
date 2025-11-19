# Zero-Trust Security Architecture

Comprehensive zero-trust security architecture for sensitive data processing on AWS, implemented with Terraform.

## Overview

This Terraform configuration deploys a production-grade zero-trust security architecture following AWS best practices. The infrastructure implements multiple layers of defense including network isolation, encryption at rest and in transit, comprehensive logging and monitoring, and automated threat detection.

## Architecture Components

### Network Security
- **VPC**: Isolated network with no internet gateway (private-only)
- **Private Subnets**: Multi-AZ deployment for high availability
- **Security Groups**: Least-privilege ingress/egress rules
- **Network ACLs**: Additional subnet-level protection
- **VPC Endpoints**: Private connectivity to AWS services (S3, KMS)
- **VPC Flow Logs**: Complete network traffic monitoring

### Encryption and Key Management
- **KMS Keys**: Customer-managed keys with automatic rotation
- **S3 Encryption**: Server-side encryption with KMS
- **CloudWatch Encryption**: Encrypted log storage
- **In-Transit Encryption**: Enforce TLS for all data transfers

### Data Protection
- **S3 Buckets**: Versioning, encryption, and access logging
- **Bucket Policies**: Enforce secure transport and encryption
- **Public Access Block**: All buckets blocked from public access
- **Lifecycle Policies**: Automated data retention and archival

### Monitoring and Logging
- **CloudTrail**: Comprehensive API activity logging
- **CloudWatch Logs**: Centralized application and system logs
- **CloudWatch Alarms**: Automated security event detection
- **VPC Flow Logs**: Network traffic analysis

### Compliance and Threat Detection
- **AWS Config**: Continuous compliance monitoring
- **Config Rules**: Automated security policy enforcement
- **GuardDuty**: Intelligent threat detection (optional)
- **IAM Roles**: Least-privilege access control

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions
- Unique environment suffix for resource naming

## Quick Start

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Configure Variables

Create `terraform.tfvars` from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your environment suffix:

```hcl
environment_suffix = "prod-001"  # Make this unique!
aws_region         = "us-east-1"
enable_guardduty   = false       # Set to true if no GuardDuty detector exists
```

### 3. Plan Deployment

```bash
terraform plan
```

Review the plan carefully to ensure all resources are correct.

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm deployment.

### 5. Verify Deployment

After successful deployment:

- Check VPC and subnets in AWS Console
- Verify CloudTrail is actively logging
- Review AWS Config compliance dashboard
- Confirm KMS keys are created with rotation enabled
- Test S3 bucket encryption settings

### 6. Destroy Resources (Testing Only)

When testing is complete:

```bash
terraform destroy
```

All resources will be cleanly removed, including S3 buckets (force_destroy is enabled for testing).

## Configuration Variables

### Required Variables

- `environment_suffix` (string): Unique suffix for all resource names. **REQUIRED** - no default value.

### Optional Variables

- `aws_region` (string): AWS region for deployment. Default: `us-east-1`
- `vpc_cidr` (string): CIDR block for VPC. Default: `10.0.0.0/16`
- `availability_zones` (list): AZs for multi-AZ deployment. Default: `["us-east-1a", "us-east-1b"]`
- `enable_guardduty` (bool): Enable GuardDuty detector. Default: `false`
- `cloudtrail_retention_days` (number): CloudTrail log retention. Default: `90`
- `cloudwatch_log_retention_days` (number): CloudWatch log retention. Default: `30`
- `tags` (map): Common tags for all resources

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `private_subnet_ids`: List of private subnet IDs
- `security_group_id`: Data processing security group ID
- `kms_key_id`: Main KMS key ID
- `kms_key_arn`: Main KMS key ARN
- `sensitive_data_bucket_name`: S3 bucket for sensitive data
- `cloudtrail_name`: CloudTrail name
- `flow_logs_log_group`: VPC Flow Logs CloudWatch group
- `config_recorder_id`: AWS Config recorder ID
- `guardduty_detector_id`: GuardDuty detector ID (if enabled)

View outputs:

```bash
terraform output
```

## Resource Naming Convention

All resources follow the naming pattern:

```
resource-type-${var.environment_suffix}
```

Examples:
- `zero-trust-vpc-prod-001`
- `zero-trust-kms-prod-001`
- `zero-trust-sensitive-data-prod-001`

This ensures unique resource names across multiple environments and prevents naming conflicts.

## Security Features

### Zero-Trust Principles

1. **Never Trust, Always Verify**: No implicit trust between components
2. **Least Privilege Access**: Minimal IAM permissions for all roles
3. **Assume Breach**: Multiple layers of defense
4. **Verify Explicitly**: Comprehensive logging and monitoring

### Implemented Controls

- Network segmentation with private subnets only
- Encryption at rest using KMS customer-managed keys
- Encryption in transit enforced via bucket policies
- No public internet access - VPC endpoints for AWS services
- CloudTrail logging all API activity
- VPC Flow Logs capturing all network traffic
- AWS Config continuous compliance monitoring
- GuardDuty intelligent threat detection (optional)
- CloudWatch alarms for security events
- IAM roles with least-privilege policies

### Compliance Features

- Multi-region CloudTrail with log file validation
- Encrypted log storage with KMS
- S3 versioning and access logging
- Config rules for security baseline
- Automated compliance checks

## Important Notes

### GuardDuty

GuardDuty detector is **account-level**. Only one detector can exist per AWS account. Set `enable_guardduty = false` if a detector already exists in your account, otherwise deployment will fail.

### AWS Config

This configuration uses the AWS managed IAM policy `service-role/AWS_ConfigRole` for AWS Config. This is the recommended approach per AWS best practices.

### KMS Key Deletion

KMS keys have a minimum deletion window of 7 days. When you run `terraform destroy`, keys will be scheduled for deletion but won't be immediately removed.

### S3 Force Destroy

All S3 buckets use `force_destroy = true` to enable clean destruction during testing. **For production**, consider removing this flag to prevent accidental data loss.

### Cost Optimization

This configuration is designed for security over cost. Consider these for cost reduction in non-production:

- Disable GuardDuty when not actively testing
- Reduce log retention periods
- Use shorter CloudTrail retention
- Consider single-AZ deployment for dev/test

## Troubleshooting

### Issue: GuardDuty detector already exists

**Error**: `A GuardDuty detector already exists for the current account`

**Solution**: Set `enable_guardduty = false` in terraform.tfvars

### Issue: Config recorder already exists

**Error**: `MaxNumberOfConfigurationRecordersExceededException`

**Solution**: AWS Config allows only one recorder per region. Either use existing recorder or delete it first.

### Issue: S3 bucket name conflict

**Error**: `BucketAlreadyExists`

**Solution**: Ensure your `environment_suffix` is globally unique. S3 bucket names must be unique across all AWS accounts.

### Issue: KMS key policy error

**Error**: `The new key policy will not allow you to update the key policy in the future`

**Solution**: Verify the KMS key policy includes permissions for the root account. This is required to manage the key.

## File Structure

```
lib/
├── provider.tf              # Terraform and AWS provider configuration
├── variables.tf             # Input variable definitions
├── data.tf                  # Data sources
├── vpc.tf                   # VPC, subnets, security groups, VPC endpoints
├── kms.tf                   # KMS keys for encryption
├── s3.tf                    # S3 buckets for data and logs
├── iam.tf                   # IAM roles and policies
├── cloudtrail.tf            # CloudTrail configuration
├── cloudwatch.tf            # CloudWatch logs and alarms
├── guardduty.tf             # GuardDuty threat detection
├── config.tf                # AWS Config and compliance rules
├── outputs.tf               # Output values
├── terraform.tfvars.example # Example variable values
├── PROMPT.md                # Task requirements
├── MODEL_RESPONSE.md        # Generated solution
└── README.md                # This file
```

## Testing

### Validation

```bash
# Format code
terraform fmt

# Validate configuration
terraform validate

# Check plan
terraform plan
```

### Deployment Test

```bash
# Deploy
terraform apply -auto-approve

# Verify resources
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=zero-trust-vpc-*"
aws kms list-keys
aws s3 ls | grep zero-trust

# Destroy
terraform destroy -auto-approve
```

## AWS Services Used

- **VPC**: Network isolation
- **KMS**: Encryption key management
- **S3**: Secure data storage
- **CloudTrail**: API activity logging
- **CloudWatch**: Logs, metrics, and alarms
- **GuardDuty**: Threat detection
- **AWS Config**: Compliance monitoring
- **IAM**: Identity and access management
- **VPC Flow Logs**: Network monitoring

## Additional Resources

- [AWS Zero Trust on AWS](https://aws.amazon.com/security/zero-trust/)
- [AWS Well-Architected Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Config Best Practices](https://docs.aws.amazon.com/config/latest/developerguide/best-practices.html)
- [AWS GuardDuty User Guide](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)

## Support

For issues or questions about this infrastructure:

1. Review this README and troubleshooting section
2. Check AWS service limits and quotas
3. Verify IAM permissions for deployment
4. Review Terraform plan output carefully before applying

## License

This infrastructure code is provided as-is for educational and demonstration purposes.
