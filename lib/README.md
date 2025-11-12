# Payment Processing Application Infrastructure

This infrastructure deploys a production-ready payment processing web application with PCI DSS compliance requirements using CDKTF with Python.

## Architecture Overview

The infrastructure consists of:

1. **Networking** - VPC with 3 availability zones, public and private subnets, NAT gateways, and VPC Flow Logs
2. **Security** - Security groups, IAM roles, and AWS WAF with managed rule groups
3. **Frontend** - S3 bucket and CloudFront distribution for React frontend assets
4. **Compute** - Application Load Balancer, Auto Scaling Group, and EC2 instances for Node.js API
5. **Database** - RDS PostgreSQL Multi-AZ instance with encryption and automated backups
6. **Monitoring** - CloudWatch alarms for ALB errors and ASG CPU utilization

## Infrastructure Components

### Networking Stack
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (for ALB)
- 3 private subnets (for API servers and database)
- Internet Gateway for public access
- NAT Gateways for outbound internet from private subnets
- VPC Flow Logs to CloudWatch

### Security Stack
- ALB Security Group (HTTPS from internet)
- API Security Group (traffic from ALB only)
- Database Security Group (PostgreSQL from API servers only)
- IAM roles and instance profiles for EC2
- AWS WAF with managed rule groups:
  - Core Rule Set
  - Known Bad Inputs
  - SQL Injection protection

### Frontend Stack
- S3 bucket with encryption and versioning
- CloudFront distribution with OAI
- HTTPS redirect

### Compute Stack
- Application Load Balancer in public subnets
- Auto Scaling Group (2-6 instances) in private subnets
- Launch template with Amazon Linux 2023
- Node.js API with health check endpoint
- WAF association with ALB

### Database Stack
- RDS PostgreSQL 15.5 Multi-AZ
- Encrypted with KMS
- Automated backups (7-day retention)
- Performance Insights enabled
- Connection string stored in SSM Parameter Store

### Monitoring Stack
- CloudWatch alarm for ALB 5XX errors (>5%)
- CloudWatch alarm for unhealthy hosts
- CloudWatch alarm for ASG CPU utilization (>80%)
- CloudWatch alarm for ASG memory utilization (>80%)

## Deployment

### Prerequisites
- Python 3.9+
- Terraform CLI
- AWS CLI configured with credentials
- Pipenv for dependency management

### Deploy Infrastructure

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

# Install dependencies
pipenv install

# Synthesize CDKTF
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy
```

### Outputs

After deployment, the following outputs are available:

- `vpc_id` - VPC ID
- `cloudfront_distribution_id` - CloudFront distribution ID
- `cloudfront_domain_name` - CloudFront domain name for frontend access
- `alb_dns_name` - Application Load Balancer DNS name
- `rds_endpoint` - RDS database endpoint
- `db_connection_parameter` - SSM parameter name for database connection string

## Security Considerations

### PCI DSS Compliance

This infrastructure implements several PCI DSS requirements:

- **Data Encryption**: All data is encrypted at rest (S3, RDS) and in transit (HTTPS)
- **Network Segmentation**: Separate subnets for public (ALB), private (API), and database tiers
- **Access Controls**: Security groups enforce least privilege between tiers
- **Logging and Monitoring**: VPC Flow Logs, CloudWatch alarms, and RDS logs
- **Secure Configuration**: IMDSv2 required, encryption enabled by default

### Additional Security Features

- AWS WAF protects against common web exploits
- CloudFront OAI restricts S3 bucket access
- Multi-AZ deployment for high availability
- Automated backups with 7-day retention
- KMS encryption for database

## Cost Optimization

The infrastructure uses cost-effective configurations:

- `t3.micro` instances for API servers
- `db.t3.micro` for RDS (increase for production)
- CloudWatch log retention set to 7 days
- Auto Scaling to match demand

## Testing

Run unit tests:
```bash
pipenv run pytest tests/unit/ -v
```

Run integration tests (requires deployed infrastructure):
```bash
pipenv run pytest tests/integration/ -v
```

## Cleanup

To destroy all infrastructure:

```bash
pipenv run cdktf destroy
```

## Notes

- This is a demonstration infrastructure for synthetic task generation
- In production, use ACM certificates for HTTPS on ALB
- Configure proper HTTPS listener with SSL/TLS policies
- Implement database password rotation with AWS Secrets Manager
- Add CloudWatch dashboard for centralized monitoring
- Configure ALB access logs to S3
- Implement auto-scaling policies based on metrics
- Add SNS topics for alarm notifications
