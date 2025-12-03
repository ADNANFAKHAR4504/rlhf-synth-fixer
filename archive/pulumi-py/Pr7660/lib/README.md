# Production VPC Infrastructure - Pulumi Python

This Pulumi program creates a production-ready VPC infrastructure for a payment processing application with PCI DSS compliance requirements.

## Architecture

The infrastructure includes:

- **VPC**: 10.0.0.0/16 CIDR block with DNS hostnames and resolution enabled
- **Public Subnets**: 3 subnets across us-east-1a, us-east-1b, us-east-1c
  - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 3 subnets across us-east-1a, us-east-1b, us-east-1c
  - 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: Single NAT Gateway in us-east-1a for private subnet internet access
- **Security Groups**:
  - Web Server SG: HTTPS (443) from anywhere, SSH (22) from VPC
  - Database SG: PostgreSQL (5432) from web server SG only
- **VPC Flow Logs**: Stored in S3 with 7-day lifecycle policy

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI 3.x or higher
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

## Deployment

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Preview changes:
```bash
pulumi preview
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Stack Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_1_id`, `public_subnet_2_id`, `public_subnet_3_id`: Public subnet IDs
- `private_subnet_1_id`, `private_subnet_2_id`, `private_subnet_3_id`: Private subnet IDs
- `web_security_group_id`: Web server security group ID
- `database_security_group_id`: Database security group ID
- `nat_gateway_id`: NAT Gateway ID
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket`: S3 bucket name for VPC Flow Logs

## Destroy Infrastructure

To remove all resources:
```bash
pulumi destroy
```

## Compliance

This infrastructure meets PCI DSS requirements:
- Network segmentation between public and private tiers
- Least-privilege security group rules
- VPC Flow Logs for audit trails
- Multi-AZ deployment for high availability

## Cost Optimization

- Single NAT Gateway shared across all private subnets
- 7-day log retention to minimize S3 storage costs
- Serverless VPC Flow Logs (no CloudWatch Logs groups)

## Tags

All resources are tagged with:
- `Environment`: production
- `ManagedBy`: pulumi
- Additional environment-specific tags from provider configuration
