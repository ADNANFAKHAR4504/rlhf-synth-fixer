# Multi-Environment Infrastructure with CDKTF Python

This project implements a production-ready multi-environment infrastructure management solution using CDKTF with Python. The solution provides consistent infrastructure deployment across development, staging, and production environments while supporting environment-specific configurations.

## Architecture

### Components

The solution deploys the following AWS resources for each environment:

- **RDS PostgreSQL Database**
  - Environment-specific instance sizing (t3.micro/small/large)
  - Multi-AZ deployment for production only
  - Storage encryption enabled
  - Automated backups with 7-day retention
  - CloudWatch logs enabled

- **Auto Scaling Groups**
  - Configurable min/max/desired capacity per environment
  - ELB health checks with 5-minute grace period
  - Launch templates with IMDSv2 enforced
  - Proper IAM roles with SSM and CloudWatch access

- **Application Load Balancer**
  - Internet-facing ALB with configurable CIDR access
  - Target group with health checks
  - HTTP listener (HTTPS can be added)
  - Cross-zone load balancing

- **S3 Storage**
  - Environment-specific bucket naming
  - Versioning enabled for production only
  - Server-side encryption (AES256)
  - Public access blocked
  - Force destroy enabled for testing

- **Security Groups**
  - Restricted database access (configurable CIDR)
  - ALB security group (internet-facing)
  - EC2 security group (ALB-only access)
  - Proper descriptions for all rules

- **IAM Roles and Policies**
  - EC2 instance profile with SSM access
  - CloudWatch agent permissions
  - Least-privilege principle

### Tagging Strategy

All resources are tagged with:
- Environment: dev/staging/prod
- Project: multi-env-infrastructure
- ManagedBy: CDKTF
- EnvironmentSuffix: Unique identifier for resource naming
- Name: Resource-specific name with suffix

## Prerequisites

- Python 3.8 or higher
- Terraform 1.5+ (managed by CDKTF)
- AWS CLI configured with appropriate credentials
- Node.js 16+ (for CDKTF CLI)
- AWS account with appropriate permissions

## Installation

### 1. Install CDKTF CLI

```bash
npm install -g cdktf-cli
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialize CDKTF Providers

```bash
cdktf get
```

## Configuration

### Environment Variables

The stack requires two environment variables:

- ENVIRONMENT: The target environment (dev, staging, prod)
- ENVIRONMENT_SUFFIX: A unique suffix for resource naming (e.g., "test-001", "prod-001")

### Environment-Specific Configurations

The lib/tap_stack.py file contains configurations for each environment:

#### Development
- Region: ap-southeast-1
- Database: t3.micro, single AZ
- ASG: min 1, max 2, desired 1
- Instance Type: t3.micro
- S3 Versioning: Disabled

#### Staging
- Region: ap-southeast-1
- Database: t3.small, single AZ
- ASG: min 2, max 4, desired 2
- Instance Type: t3.small
- S3 Versioning: Disabled

#### Production
- Region: ap-southeast-1
- Database: t3.large, Multi-AZ
- ASG: min 3, max 10, desired 5
- Instance Type: t3.small
- S3 Versioning: Enabled

## AWS Secrets Manager Requirement

The RDS database password is retrieved from AWS Secrets Manager. Before deployment, create a secret:

```bash
aws secretsmanager create-secret \
  --name rds-password-<environment-suffix> \
  --description "RDS password for <environment>" \
  --secret-string "YourSecurePassword123!"
```

For example:
```bash
aws secretsmanager create-secret \
  --name rds-password-dev-test-001 \
  --secret-string "MyDevPassword123!"
```

## Usage

### Synthesize Infrastructure

Generate Terraform JSON configuration:

```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-test-001
cdktf synth
```

### Deploy Infrastructure

Deploy to specific environment:

```bash
# Development
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-001
cdktf deploy

# Staging
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=staging-001
cdktf deploy

# Production
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=prod-001
cdktf deploy
```

### Destroy Infrastructure

Clean up all resources:

```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-001
cdktf destroy
```

## Testing

### Run Unit Tests

```bash
pytest test/ -v
```

### Run Specific Test

```bash
pytest test/test_multi_env_stack.py::TestMultiEnvStack::test_multi_az_only_for_prod -v
```

### Test Coverage

```bash
pytest test/ --cov=lib --cov-report=html
```

## Outputs

After deployment, the stack provides the following outputs:

- db_endpoint: Full RDS endpoint with port (host:port)
- db_address: RDS hostname without port
- alb_dns: Application Load Balancer DNS name
- alb_arn: Application Load Balancer ARN
- bucket_name: S3 bucket name
- bucket_arn: S3 bucket ARN
- asg_name: Auto Scaling Group name
- vpc_id: VPC ID used for deployment

Access outputs after deployment:

```bash
cdktf output
```

## Security Best Practices

1. Secrets Management: Database passwords stored in AWS Secrets Manager
2. Encryption:
   - RDS storage encryption enabled
   - S3 server-side encryption enabled
   - SSL/TLS for data in transit
3. Network Security:
   - Security groups with restricted CIDR blocks
   - Private database access only
   - Public access blocked on S3 buckets
4. IAM: Least-privilege roles and policies
5. Instance Metadata: IMDSv2 enforced on EC2 instances
6. Logging: CloudWatch logs enabled for RDS

## Troubleshooting

### Issue: Secrets Manager secret not found

Solution: Create the secret before deployment:
```bash
aws secretsmanager create-secret --name rds-password-<suffix> --secret-string "password"
```

### Issue: Insufficient subnet count

Solution: Ensure VPC has at least 2 subnets in different AZs for ALB

### Issue: AMI not available

Solution: Update the ami_id in tap_stack.py for your region:
```bash
aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId"
```

## Cost Optimization

- Development environment uses smallest instance sizes
- Multi-AZ only enabled for production
- S3 versioning only in production
- Auto Scaling maintains minimum capacity based on environment
- All resources are destroyable to avoid ongoing costs

## Maintenance

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Update CDKTF Providers

```bash
cdktf get
```

### Update AMI IDs

Regularly update AMI IDs in tap_stack.py for security patches.

## Contributing

When making changes:
1. Update unit tests in test/test_multi_env_stack.py
2. Run tests: pytest test/ -v
3. Update this README if adding new features
4. Follow CDKTF and Python best practices

## License

This project is maintained as part of infrastructure automation efforts.
