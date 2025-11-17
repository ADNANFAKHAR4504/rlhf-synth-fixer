# Multi-Environment Infrastructure with CDKTF Python

Complete infrastructure-as-code solution for deploying consistent multi-environment AWS infrastructure using CDKTF with Python.

## Overview

This project provides a modular CDKTF implementation that deploys:
- VPC with public and private subnets across 3 availability zones
- RDS PostgreSQL 14 with environment-specific configuration
- ECS Fargate services with Application Load Balancer
- S3 backend for Terraform state with DynamoDB locking
- SSM Parameter Store integration for cross-stack references
- Consistent resource naming with environment suffix

## Architecture

### Modules

- **naming**: Generates consistent resource names following {env}-{region}-{service}-{resource} pattern
- **vpc_module**: Creates VPC with configurable CIDR, 3 public and 3 private subnets, NAT gateway
- **rds_module**: PostgreSQL 14 database with conditional multi-AZ support
- **ecs_module**: Fargate services with ALB, auto-scaling, security groups
- **state_backend**: S3 bucket and DynamoDB table for Terraform state management
- **ssm_outputs**: Exports infrastructure outputs to SSM Parameter Store

### Environment Configuration

Three environments are supported:
- **dev**: Development environment with minimal resources, single-AZ (10.0.0.0/16)
- **staging**: Staging environment with moderate resources, single-AZ (10.1.0.0/16)
- **prod**: Production environment with multi-AZ, enhanced backup, higher capacity (10.2.0.0/16)

## Prerequisites

- Python 3.9+
- Node.js 16+
- AWS CLI configured with appropriate credentials
- Pipenv for dependency management

## Installation

1. Install dependencies:
```bash
npm install
pipenv install
```

2. Set up environment variables:
```bash
export ENVIRONMENT=dev  # or staging, prod
export ENVIRONMENT_SUFFIX=demo  # unique suffix for resources
export DB_PASSWORD=YourSecurePassword123!
```

## Usage

### Deploy Infrastructure

Deploy to development:
```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=demo
cdktf deploy
```

Deploy to staging:
```bash
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=demo
cdktf deploy
```

Deploy to production:
```bash
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=demo
cdktf deploy
```

### Synth and Plan

Generate Terraform configuration:
```bash
cdktf synth
```

View execution plan:
```bash
cdktf diff
```

### Destroy Infrastructure

```bash
cdktf destroy
```

## Configuration

Environment-specific settings are in `lib/config/environment_config.py`:

**Development (dev)**:
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro, single-AZ
- ECS: 256 CPU, 512 MB memory, 1 task
- NAT Gateway: Disabled
- Backup retention: 1 day

**Staging (staging)**:
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small, single-AZ
- ECS: 512 CPU, 1024 MB memory, 2 tasks
- NAT Gateway: Enabled
- Backup retention: 3 days

**Production (prod)**:
- VPC CIDR: 10.2.0.0/16
- RDS: db.t3.medium, multi-AZ
- ECS: 1024 CPU, 2048 MB memory, 3 tasks
- NAT Gateway: Enabled
- Backup retention: 7 days

## Resource Naming

All resources follow the pattern: `{env}-{resource}-{environmentSuffix}`

Examples:
- `dev-vpc-demo`
- `prod-postgres-demo`
- `staging-cluster-demo`

## State Management

Each environment maintains separate state:
- S3 bucket: `{env}-tfstate-{suffix}`
- DynamoDB table: `{env}-tflock-{suffix}`
- State key: `{env}/terraform.tfstate`

## SSM Parameter Store

Infrastructure outputs are exported to SSM:
- `/{env}/vpc_id`
- `/{env}/public_subnet_ids`
- `/{env}/private_subnet_ids`
- `/{env}/rds_endpoint`
- `/{env}/ecs_cluster_name`
- `/{env}/alb_dns_name`

## Cross-Account Deployment

Configure IAM role for cross-account deployment:

1. Create role in target account: `TerraformDeploymentRole`
2. Grant necessary permissions (VPC, RDS, ECS, ALB, S3, DynamoDB, SSM)
3. Update account_id in `environment_config.py`

Trust relationship:
```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::{source-account}:root"
  },
  "Action": "sts:AssumeRole"
}
```

## Testing

Run unit tests:
```bash
pipenv run pytest tests/
```

Run with coverage:
```bash
pipenv run pytest --cov=lib tests/
```

## Project Structure

```
lib/
├── __init__.py
├── tap_stack.py              # Main stack definition
├── modules/                  # Reusable infrastructure modules
│   ├── __init__.py
│   ├── naming.py            # Resource naming module
│   ├── vpc_module.py        # VPC with subnets
│   ├── rds_module.py        # RDS PostgreSQL
│   ├── ecs_module.py        # ECS Fargate with ALB
│   ├── state_backend.py     # S3 + DynamoDB backend
│   └── ssm_outputs.py       # SSM Parameter Store
├── config/                   # Environment configuration
│   ├── __init__.py
│   └── environment_config.py
└── README.md
```

## AWS Services Used

- **VPC**: Virtual Private Cloud for network isolation
- **EC2**: Subnets, Internet Gateway, NAT Gateway, Security Groups
- **RDS**: PostgreSQL 14 database instances
- **ECS**: Elastic Container Service with Fargate launch type
- **ALB**: Application Load Balancer for traffic distribution
- **S3**: State storage with versioning and encryption
- **DynamoDB**: State locking
- **SSM**: Parameter Store for outputs
- **IAM**: Roles and policies for ECS tasks and cross-account access
- **CloudWatch**: Log groups for ECS container logs

## Deployment Requirements

All resources are configured for easy destruction:
- S3 buckets: `force_destroy=True`
- RDS instances: `deletion_protection=False`, `skip_final_snapshot=True` (dev/staging)
- DynamoDB tables: `deletion_protection_enabled=False`
- No Retain policies or snapshot requirements

## Security Considerations

- RDS master password should be stored in AWS Secrets Manager (currently uses env var)
- Enable MFA for production deployments
- Review security group rules before production use
- Enable CloudTrail for audit logging
- Use AWS KMS for encryption at rest (currently using AES256)
- VPC Flow Logs for network monitoring

## Troubleshooting

### Import Errors
If you encounter module import errors:
```bash
pipenv install --dev
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Synth Failures
Check provider configuration:
```bash
cdktf get
```

### State Locking Issues
If deployment fails with state lock error:
```bash
aws dynamodb delete-item \
  --table-name {env}-tflock-{suffix} \
  --key '{"LockID":{"S":"{lock-id}"}}'
```

### Cross-Account Access
Ensure IAM role has proper trust relationship and permissions.

## Cost Optimization

Development environment optimizations:
- No NAT Gateway (private subnets use IGW)
- Single-AZ RDS
- Minimal task count
- Smaller instance sizes

Production environment includes:
- Multi-AZ RDS for high availability
- Multiple ECS tasks for redundancy
- NAT Gateway for private subnet internet access

## Maintenance

### Updating Dependencies
```bash
npm update
pipenv update
```

### Adding New Modules
1. Create module in `lib/modules/`
2. Import in `tap_stack.py`
3. Add to environment config if needed
4. Update tests

## Contributing

1. Follow Python PEP 8 style guide
2. Add unit tests for new modules
3. Update documentation
4. Test in dev environment before staging/prod

## License

MIT License
