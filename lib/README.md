# Security-Hardened Infrastructure for Payment Processing APIs

This Terraform configuration deploys a PCI-DSS compliant, security-hardened infrastructure for payment processing APIs on AWS.

## Architecture Overview

This infrastructure implements defense-in-depth security principles with:

- **Encryption Everywhere**: All data encrypted at rest and in transit using customer-managed KMS keys
- **Network Isolation**: VPC with private subnets only, no internet gateway, traffic via PrivateLink
- **Least Privilege Access**: IAM roles with strict policies, external ID requirements, 1-hour session limits
- **Comprehensive Monitoring**: CloudWatch logs with 90-day retention, alarms for security events
- **Multi-AZ Deployment**: RDS PostgreSQL with automated backups across 3 availability zones

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, RDS, Lambda, KMS, S3, IAM resources

## Security Features

### 1. Customer-Managed KMS Keys
- Separate keys for RDS, S3, CloudWatch Logs, and Lambda
- Automatic key rotation enabled
- Strict key policies with separation of duties

### 2. RDS PostgreSQL
- Encryption at rest with customer-managed KMS key
- SSL/TLS enforcement via parameter group
- Multi-AZ deployment for high availability
- Automated encrypted backups with 7-day retention

### 3. S3 Buckets
- SSE-KMS encryption with customer-managed keys
- Versioning enabled
- Bucket policies deny unencrypted uploads
- Public access blocked
- 90-day retention for flow logs

### 4. VPC Configuration
- Private subnets only (no public subnets or internet gateway)
- VPC endpoints for S3 (Gateway) and RDS (Interface)
- NAT Gateway omitted for enhanced security
- Security groups with explicit deny-all-except-required rules

### 5. Lambda Functions
- Environment variable encryption with KMS
- VPC configuration in private subnets
- Dead letter queue for failed invocations
- IAM role with least privilege
- Example payment processing function

### 6. CloudWatch Monitoring
- Log groups with KMS encryption
- 90-day retention on all logs
- Alarms for:
  - RDS connection failures
  - Lambda errors
  - Failed authentication attempts
  - Encryption violations

### 7. VPC Flow Logs
- Enabled on VPC for all traffic
- Dual destination: S3 and CloudWatch
- Encrypted storage
- 90-day retention minimum

### 8. IAM Roles
- External ID requirements for cross-account access
- 1-hour maximum session duration
- No inline policies (all managed policies)
- Separate roles for Lambda, RDS monitoring, and Flow Logs

## Deployment Instructions

### Step 1: Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
- `environment_suffix`: Unique suffix for resource naming (e.g., "dev-001", "prod-abc")
- `db_username`: Database master username
- `db_password`: Strong database password (use AWS Secrets Manager in production)

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Plan

```bash
terraform plan
```

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Review the plan and type `yes` to confirm.

### Step 5: Verify Deployment

```bash
# View outputs
terraform output

# Check RDS endpoint
terraform output rds_endpoint

# Check Lambda function
terraform output lambda_function_name
```

## Testing the Lambda Function

```bash
# Get function name
FUNCTION_NAME=$(terraform output -raw lambda_function_name)

# Invoke test
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"body": "{\"transaction_id\": \"test-001\", \"amount\": 99.99}"}' \
  response.json

# View response
cat response.json
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` to confirm deletion.

## Compliance

This infrastructure meets the following PCI-DSS requirements:

- **Requirement 2**: Encrypted data transmission (SSL/TLS enforcement)
- **Requirement 3**: Encrypted data storage (KMS encryption everywhere)
- **Requirement 4**: Encrypted data over public networks (VPC isolation, no public access)
- **Requirement 8**: Unique IDs, strong authentication (IAM roles, external IDs)
- **Requirement 10**: Audit trails (CloudWatch logs, VPC Flow Logs)

## Cost Optimization

This configuration uses:
- RDS db.t3.micro (eligible for free tier)
- Lambda with pay-per-use pricing
- S3 with lifecycle policies
- Minimal NAT Gateway usage (omitted for security)

Estimated monthly cost: $20-40 USD (excluding data transfer)

## Security Best Practices

1. **Rotate Credentials**: Use AWS Secrets Manager for database passwords
2. **Enable MFA**: Require MFA for IAM users accessing this infrastructure
3. **Review Logs**: Regularly audit CloudWatch logs and VPC Flow Logs
4. **Update Dependencies**: Keep Terraform and provider versions up to date
5. **Least Privilege**: Review and minimize IAM policies regularly

## Support

For issues or questions, refer to:
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [PCI-DSS Compliance on AWS](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
