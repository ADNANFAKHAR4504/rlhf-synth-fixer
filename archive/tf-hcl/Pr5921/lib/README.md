# Multi-Environment Payment Platform Infrastructure

This Terraform configuration deploys identical infrastructure across development, staging, and production environments using workspace-based configuration.

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for remote state: `terraform-state-bucket-fintech`
- DynamoDB table for state locking: `terraform-state-lock`

## Architecture

Each environment consists of:
- **VPC** with non-overlapping CIDR blocks (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod)
- **ECS Fargate** cluster with environment-appropriate task counts
- **RDS Aurora PostgreSQL** cluster with automated backups
- **Application Load Balancer** with path-based routing
- **S3 buckets** with versioning and lifecycle policies

## Workspace Setup

### Create Workspaces

```bash
# Create development workspace
terraform workspace new dev

# Create staging workspace
terraform workspace new staging

# Create production workspace
terraform workspace new prod
```

### Select Workspace

```bash
terraform workspace select dev
```

## Deployment

### Development Environment

```bash
terraform workspace select dev
terraform init
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
```

### Staging Environment

```bash
terraform workspace select staging
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Production Environment

```bash
terraform workspace select prod
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

## Environment-Specific Configuration

| Environment | VPC CIDR     | ECS Tasks | RDS Instance  | Health Check Interval |
|-------------|-------------|-----------|---------------|----------------------|
| dev         | 10.1.0.0/16 | 1         | db.t3.micro   | 60s                  |
| staging     | 10.2.0.0/16 | 2         | db.t3.small   | 45s                  |
| prod        | 10.3.0.0/16 | 3         | db.t3.medium  | 30s                  |

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name` - ALB endpoint for the application
- `rds_cluster_endpoint` - Database writer endpoint
- `ecs_cluster_name` - ECS cluster name
- `audit_logs_bucket_name` - S3 bucket for audit logs

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example: `ecs-cluster-dev`, `alb-staging`, `vpc-prod`

## Cleanup

```bash
# Select the workspace to destroy
terraform workspace select dev

# Destroy infrastructure
terraform destroy -var-file="dev.tfvars"
```

## Security Features

- VPC with public and private subnets across 2 AZs
- Security groups with least privilege access
- RDS encryption at rest
- S3 bucket encryption and versioning
- CloudWatch logging enabled
- Enhanced RDS monitoring

## Cost Optimization

- NAT Gateways (consider NAT instances for dev)
- RDS Aurora with appropriate instance sizes per environment
- S3 lifecycle policies to transition to IA and Glacier
- ECS Fargate with scaled task counts
