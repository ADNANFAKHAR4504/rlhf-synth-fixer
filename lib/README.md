# Secure AWS Environment - Terraform Configuration

This Terraform configuration creates a secure, compliant AWS environment with comprehensive security controls and monitoring.

## Features

### Security Controls
- **Encryption**: All resources use KMS encryption (S3, RDS, EBS, CloudTrail, SSM)
- **Network Security**: Private VPC with isolated subnets, VPC endpoints, and restrictive security groups
- **IAM**: Least privilege policies, MFA enforcement, strict password policy
- **Compliance**: AWS Config rules for continuous compliance monitoring
- **Logging**: CloudTrail multi-region logging, VPC Flow Logs
- **Monitoring**: GuardDuty threat detection enabled

### Resources Created
- VPC with private subnets and NAT gateways
- S3 buckets with KMS encryption and VPC endpoint restrictions
- RDS Multi-AZ database with automated backups
- Lambda functions with encrypted environment variables
- Lambda@Edge for CloudFront security headers
- CloudTrail with log file validation
- GuardDuty detector
- AWS Config with compliance rules
- SSM Parameter Store for secrets management

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. Appropriate AWS permissions to create all resources

## Deployment

### 1. Create providers.tf file

Create a `providers.tf` file with your AWS configuration:

```hcl
provider "aws" {
  region = "eu-north-1"
}

# For Lambda@Edge (must be in us-east-1)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}
```

### 2. Initialize Terraform

```bash
# Initialize with local backend
terraform init

# OR initialize with S3 backend
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=secure-env/terraform.tfstate" \
  -backend-config="region=eu-north-1" \
  -backend-config="encrypt=true" \
  -backend-config="dynamodb_table=terraform-state-lock"
```

### 3. Review and Customize Variables

Edit `terraform.tfvars` or use `-var` flags:

```bash
# Example terraform.tfvars
project_name = "my-secure-env"
environment = "production"
allowed_admin_ips = ["203.0.113.0/24"]  # Your admin IP ranges
```

### 4. Plan and Apply

```bash
# Validate configuration
terraform validate

# Review planned changes
terraform plan

# Apply configuration
terraform apply
```

## Post-Deployment Steps

1. **Enable MFA for all IAM users**: Attach the MFA enforcement policy to user groups
2. **Review Security Group Rules**: Ensure only necessary ports are open
3. **Configure CloudWatch Alarms**: Set up alerts for security events
4. **Review AWS Config Compliance**: Check Config dashboard for any non-compliant resources
5. **Update Secrets**: Replace placeholder values in Parameter Store with actual secrets

## Security Best Practices

1. **Rotate Credentials Regularly**: Use AWS Secrets Manager rotation for RDS passwords
2. **Review IAM Policies**: Conduct quarterly reviews of IAM permissions
3. **Monitor GuardDuty Findings**: Set up SNS notifications for high-severity findings
4. **Enable AWS Shield**: Consider enabling Shield Advanced for DDoS protection
5. **Use AWS WAF**: Add WAF rules for web applications

## Cost Optimization

- NAT Gateways: Consider NAT instances for dev/test environments
- RDS: Use Reserved Instances for production workloads
- S3: Implement lifecycle policies for log archival
- Lambda: Monitor and optimize function memory allocation

## Troubleshooting

### Common Issues

1. **Lambda@Edge Deployment**: Ensure us-east-1 provider is configured
2. **S3 Bucket Names**: Must be globally unique; random suffix is added automatically
3. **KMS Key Permissions**: Ensure the deploying user has KMS key administration permissions
4. **VPC Endpoint Access**: Update route tables if S3 access issues occur

## Cleanup

To destroy all resources:

```bash
# Disable deletion protection on RDS first
terraform apply -var="deletion_protection=false" -target=aws_db_instance.main

# Then destroy all resources
terraform destroy
```

## Compliance Notes

This configuration implements controls for:
- PCI DSS (encryption, access controls, logging)
- HIPAA (encryption at rest and in transit)
- SOC 2 (monitoring, logging, access controls)
- ISO 27001 (comprehensive security controls)

## Support

For issues or questions, review:
- AWS Well-Architected Framework Security Pillar
- Terraform AWS Provider Documentation
- AWS Security Best Practices


