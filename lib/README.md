# Multi-Environment Payment Processing Infrastructure

This Terraform configuration deploys a complete payment processing infrastructure across three environments (dev, staging, prod) with strict architectural consistency and environment-specific resource sizing.

## Architecture

The infrastructure includes:

- **Networking**: Multi-AZ VPC with public/private subnets, NAT Gateways, Internet Gateway
- **Compute**: Auto Scaling Group with EC2 instances, Application Load Balancer
- **Database**: RDS PostgreSQL with encryption, automated backups, Multi-AZ (staging/prod)
- **Security**: KMS encryption, CloudTrail audit logging, security groups, IAM roles
- **Monitoring**: CloudWatch logs/metrics/alarms, SNS notifications

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. S3 buckets and DynamoDB tables for remote state (one per environment)

## Environment Differences

| Feature | Dev | Staging | Prod |
|---------|-----|---------|------|
| Instance Type | t3.small | t3.medium | c5.xlarge |
| ASG Min/Max | 1/2 | 2/4 | 3/10 |
| RDS Instance | db.t3.small | db.t3.medium | db.r5.xlarge |
| RDS Multi-AZ | No | Yes | Yes |
| Multi-AZ NAT | No | Yes | Yes |
| Backup Retention | 7 days | 14 days | 30 days |
| Enhanced Monitoring | No | No | Yes |

## State Backend Setup

Before deploying, create the S3 buckets and DynamoDB tables for state management:

```bash
# For each environment (dev, staging, prod)
export ENV=dev  # or staging, prod

# Create S3 bucket for state
aws s3api create-bucket \
  --bucket payment-processing-terraform-state-${ENV} \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket payment-processing-terraform-state-${ENV} \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket payment-processing-terraform-state-${ENV} \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket payment-processing-terraform-state-${ENV} \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name payment-processing-terraform-locks-${ENV} \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Deployment

### Development Environment

```bash
# Initialize with backend configuration
terraform init -backend-config=backend-dev.hcl

# Plan deployment
terraform plan -var-file=dev.tfvars

# Apply configuration
terraform apply -var-file=dev.tfvars

# Get outputs
terraform output
```

### Staging Environment

```bash
# Initialize with backend configuration
terraform init -backend-config=backend-staging.hcl -reconfigure

# Plan deployment
terraform plan -var-file=staging.tfvars

# Apply configuration
terraform apply -var-file=staging.tfvars
```

### Production Environment

```bash
# Initialize with backend configuration
terraform init -backend-config=backend-prod.hcl -reconfigure

# Review plan carefully
terraform plan -var-file=prod.tfvars -out=prod.tfplan

# Apply configuration
terraform apply prod.tfplan
```

## Accessing the Application

After deployment, retrieve the Application Load Balancer DNS name:

```bash
terraform output alb_dns_name
```

Access the health check endpoint:

```bash
curl http://$(terraform output -raw alb_dns_name)/health
```

## Database Access

Database credentials are stored in AWS Secrets Manager:

```bash
# Get secret ARN
SECRET_ARN=$(terraform output -raw db_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --query SecretString \
  --output text | jq
```

## Security Considerations

1. **Encryption**: All data encrypted at rest using KMS
2. **Network Isolation**: Database in private subnets, not publicly accessible
3. **Audit Logging**: CloudTrail enabled for all API calls
4. **Access Control**: IAM roles with least privilege
5. **Secrets Management**: Credentials stored in Secrets Manager
6. **Monitoring**: CloudWatch alarms for critical metrics

## Compliance

This infrastructure is designed to support PCI DSS compliance:

- Encryption at rest and in transit
- Network segmentation
- Audit logging (CloudTrail)
- Access controls (IAM, Security Groups)
- Monitoring and alerting
- Automated backups

## Maintenance

### Updating Application

Deploy new application versions using the Auto Scaling Group:

1. Update Launch Template with new AMI or user data
2. Terraform will create new instances and terminate old ones

### Database Updates

- Minor version updates: Automated during maintenance window
- Major version updates: Plan and test in dev/staging first

### Scaling

Auto Scaling is configured with target tracking (70% CPU). Manual adjustments:

```bash
# Update tfvars file with new min/max/desired capacity
terraform apply -var-file=<env>.tfvars
```

## Cleanup

To destroy infrastructure:

```bash
# Ensure you're in the correct environment
terraform destroy -var-file=<env>.tfvars
```

**Warning**: This will permanently delete all resources including databases and backups.

## Troubleshooting

### Instance Health Checks Failing

1. Check security group rules
2. Verify user data script execution: `systemctl status payment-app`
3. Review CloudWatch logs in the application log group

### Database Connection Issues

1. Verify security group allows traffic from app security group
2. Check database endpoint in Secrets Manager
3. Ensure instances have correct IAM role for Secrets Manager access

### High Costs

Development environment is optimized for cost:
- Single-AZ deployment
- Single NAT Gateway
- Smaller instance sizes
- No enhanced monitoring

## Architecture Diagram

```
Internet
   |
   v
[Internet Gateway]
   |
   v
[Application Load Balancer] (Public Subnets)
   |
   v
[Auto Scaling Group] (Private App Subnets)
   |
   v
[RDS PostgreSQL] (Private DB Subnets)
   |
   v
[KMS Encryption]

[CloudTrail] --> [S3 Bucket]
[CloudWatch] --> [SNS Alarms]
```

## Support

For issues or questions, refer to:
- AWS Documentation: https://docs.aws.amazon.com/
- Terraform Registry: https://registry.terraform.io/providers/hashicorp/aws/
