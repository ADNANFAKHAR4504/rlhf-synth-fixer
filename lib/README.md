# Multi-Environment Infrastructure with CDKTF Python

This infrastructure implements a modular, workspace-based architecture for managing AWS resources across development, staging, and production environments using Cloud Development Kit for Terraform (CDKTF) with Python.

## Architecture Overview

The infrastructure consists of five main modules:

1. **VPC Module** - Network infrastructure with public/private subnets, NAT gateways, and route tables
2. **IAM Module** - ECS task and execution roles with least privilege policies
3. **Secrets Module** - AWS Secrets Manager integration for sensitive configuration
4. **ECS Module** - Fargate cluster with Application Load Balancer for containerized applications
5. **RDS Module** - Aurora PostgreSQL cluster with conditional Multi-AZ deployment

## Workspace Configuration

Infrastructure uses Terraform workspaces to manage environment separation:

- **dev**: Development environment (2 ECS containers, single-AZ RDS)
- **staging**: Staging environment (4 ECS containers, single-AZ RDS)
- **prod**: Production environment (8 ECS containers, Multi-AZ RDS)

## Environment-Specific Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| ECS Containers | 2 | 4 | 8 |
| RDS Multi-AZ | No | No | Yes |
| RDS Instance Class | db.t3.medium | db.r5.large | db.r5.xlarge |
| Availability Zones | 2 | 2 | 3 |

## Prerequisites

- Python 3.9 or higher
- Node.js 18+ (for CDKTF CLI)
- Terraform 1.5+
- AWS CLI v2 configured with appropriate credentials
- cdktf-cli installed: `npm install -g cdktf-cli@latest`

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

### Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev-12345"  # Unique suffix for resources
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export TEAM="synth-2"
```

### Deploy to Development

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy to dev environment
cdktf deploy
```

### Deploy to Staging or Production

Change the workspace prefix in `ENVIRONMENT_SUFFIX`:

```bash
# For staging
export ENVIRONMENT_SUFFIX="staging-12345"
cdktf deploy

# For production
export ENVIRONMENT_SUFFIX="prod-12345"
cdktf deploy
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{suffix}`

Examples:
- VPC: `vpc-dev-12345`
- ECS Cluster: `ecs-cluster-staging-67890`
- IAM Role: `prod-ecs-task-role-abc123`

## State Management

- **Backend**: S3 with workspace-specific state files
- **State Path**: `s3://{bucket}/{workspace}/{stack-name}.tfstate`
- **Locking**: DynamoDB table per workspace (`terraform-state-lock-{workspace}`)
- **Encryption**: Enabled on S3 backend

## Secrets Management

Sensitive values are stored in AWS Secrets Manager with workspace-aware paths:

- Database credentials: `{workspace}/database/credentials-{suffix}`
- Application config: `{workspace}/application/config-{suffix}`

### Accessing Secrets

```python
from lib.modules.secrets_module import SecretsModule

secret_value = SecretsModule.get_secret_value(
    scope,
    "dev/database/credentials-12345",
    "db-secret-data"
)
```

## Validation

The infrastructure includes validation logic for:

- CIDR block format and non-overlapping ranges
- Container count limits (1-100)
- RDS instance class format
- Availability zone count (1-6)
- Environment suffix format (alphanumeric with hyphens, max 50 chars)

## Outputs

After deployment, the following outputs are available:

- `vpc_id` - VPC identifier
- `public_subnet_ids` - List of public subnet IDs
- `private_subnet_ids` - List of private subnet IDs
- `ecs_cluster_name` - ECS cluster name
- `alb_dns_name` - Application Load Balancer DNS name
- `rds_cluster_endpoint` - Database writer endpoint
- `rds_cluster_reader_endpoint` - Database reader endpoint
- `db_secret_arn` - Database credentials secret ARN
- `app_secret_arn` - Application config secret ARN

## Destroying Infrastructure

```bash
cdktf destroy
```

All resources are configured for safe destruction (no retention policies, skip final snapshots, etc.).

## Module Versioning

Modules use semantic versioning with Git tags:

```bash
git tag -a v1.0.0 -m "Initial release of multi-environment infrastructure"
git push origin v1.0.0
```

## Testing

Run unit tests:
```bash
pytest tests/unit/ -v
```

Run integration tests:
```bash
pytest tests/integration/ -v
```

## Troubleshooting

### State Lock Issues

If state is locked, identify and release the lock:

```bash
aws dynamodb get-item \
  --table-name terraform-state-lock-dev \
  --key '{"LockID": {"S": "iac-rlhf-tf-states/dev/TapStackdev-12345.tfstate"}}'

# If stuck, delete the lock (use with caution)
aws dynamodb delete-item \
  --table-name terraform-state-lock-dev \
  --key '{"LockID": {"S": "iac-rlhf-tf-states/dev/TapStackdev-12345.tfstate"}}'
```

### Workspace Errors

Verify workspace configuration:

```bash
terraform workspace list
terraform workspace select dev
```

## Security Considerations

- All data encrypted at rest (S3, RDS, Secrets Manager)
- IAM roles follow least privilege principle
- Security groups restrict traffic to required ports only
- Secrets rotation should be implemented in production
- Database master password should be managed through Secrets Manager

## Cost Optimization

- Development environments use smaller instance sizes
- RDS Multi-AZ only enabled for production
- NAT Gateways can be reduced to 1 per environment if cost is a concern
- Container Insights disabled for dev/staging

## Support

For issues or questions, contact the infrastructure team.
