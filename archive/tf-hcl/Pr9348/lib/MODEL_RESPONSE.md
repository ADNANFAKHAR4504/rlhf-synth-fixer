# LocalStack-Compatible Secure Infrastructure

This infrastructure has been migrated to work with LocalStack for local development and testing.

## Architecture

The solution creates a complete secure AWS infrastructure stack with:

1. **Networking**: VPC with public, private, and database subnets across 2 availability zones
2. **Compute**: Auto Scaling Group with Launch Template for EC2 instances
3. **Database**: RDS MySQL instance with encryption
4. **Storage**: S3 buckets with AES-256 encryption for application data and CloudTrail logs
5. **Security**: IAM roles, Security Groups, KMS encryption, CloudTrail audit logging
6. **Secrets**: AWS Secrets Manager for database password

## LocalStack Compatibility Changes

### Region Configuration
- Changed from us-east-2 to us-east-1 (LocalStack default region)

### Provider Configuration
All AWS service endpoints configured to use http://localhost:4566:
- EC2, VPC, RDS, S3, CloudTrail, IAM, KMS, SecretsManager, AutoScaling
- s3_use_path_style = true for S3 compatibility
- skip_credentials_validation = true for local testing
- Test credentials (access_key/secret_key = "test")

### Networking Simplifications
- **NAT Gateway Removed**: LocalStack Community Edition has limited NAT Gateway support
  - Private subnets now route through Internet Gateway instead
  - EIP allocation removed (causes issues in LocalStack)
- **VPC remains unchanged**: Full VPC support in LocalStack

### RDS Simplifications
- **Enhanced Monitoring Disabled**: monitoring_interval = 0 (LocalStack has limited CloudWatch)
- **CloudWatch Log Exports Disabled**: enabled_cloudwatch_logs_exports = []
- **Encryption Kept**: KMS encryption still works in LocalStack

### CloudTrail
- **Event Selector Simplified**: Removed duplicate data_resource blocks
- **Multi-region Trail**: Kept enabled (LocalStack supports this)

### S3 Buckets
- **Encryption**: AES-256 encryption fully supported
- **Versioning**: Enabled and working
- **Public Access Block**: All configurations working

### Auto Scaling & Launch Template
- **Launch Template**: Fully supported with EBS encryption
- **Auto Scaling Group**: Working in LocalStack
- **User Data**: CloudWatch agent installation script included

### IAM & Security
- **IAM Roles**: Full support in LocalStack
- **Security Groups**: Full support
- **KMS Keys**: Basic encryption support
- **Secrets Manager**: Full support

## Files

- lib/provider.tf: LocalStack provider configuration with all endpoints
- lib/tap_stack.tf: Main infrastructure code with LocalStack adaptations
- lib/outputs.tf: Output definitions (NAT Gateway outputs removed)
- test/terraform.int.test.ts: Integration tests with LocalStack endpoint support
- test/terraform.unit.test.ts: Unit tests for Terraform configuration validation

## Deployment

### LocalStack
```bash
# Start LocalStack
localstack start -d

# Set endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1

# Deploy with tflocal (LocalStack wrapper)
tflocal init
tflocal plan
tflocal apply -auto-approve
```

### AWS (Production)
For production deployment, revert these changes:
1. Change region to desired AWS region
2. Remove LocalStack endpoint configuration
3. Re-add NAT Gateway with EIP
4. Enable RDS enhanced monitoring
5. Use real AWS credentials

## Testing

Tests automatically detect LocalStack via AWS_ENDPOINT_URL environment variable:
```bash
npm test  # Unit tests
npm run test:integration  # Integration tests (requires deployment)
```

## Security Features

- **Encryption at Rest**: S3 (AES-256), RDS (KMS), EBS (enabled)
- **Encryption in Transit**: S3 HTTPS, RDS SSL capable
- **Network Isolation**: Private subnets for compute, database subnets for RDS
- **Access Control**: Security groups restrict traffic to 203.0.113.0/24
- **Audit Logging**: CloudTrail logs all API calls to encrypted S3 bucket
- **Secrets Management**: Database password stored in Secrets Manager
- **IAM Best Practices**: Instance roles instead of hardcoded keys

## Resource Tagging

All resources tagged with:
- Environment: production
- Owner: infrastructure-team
- Department: engineering
- Project: secure-infrastructure
- ManagedBy: terraform
- Provider: localstack
- EnvironmentSuffix: (variable)
