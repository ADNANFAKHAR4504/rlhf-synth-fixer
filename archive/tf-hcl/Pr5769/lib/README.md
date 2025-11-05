# Multi-Environment Infrastructure with Terraform

This Terraform configuration implements a multi-environment infrastructure solution for deploying consistent AWS infrastructure across development, staging, and production environments.

## Architecture

The infrastructure includes:
- VPC with public and private subnets across 2 availability zones
- NAT Gateways for outbound connectivity
- Application Load Balancer (ALB)
- ECS Fargate cluster with containerized application
- RDS PostgreSQL database with environment-specific instance classes
- S3 bucket with versioning and KMS encryption
- CloudWatch log groups with environment-specific retention
- Security groups with least privilege access
- KMS keys for encryption at rest

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state (update backend configuration)
- DynamoDB table for state locking (update backend configuration)

## Directory Structure

```
.
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf             # Output definitions
├── dev.tfvars             # Development environment variables
├── staging.tfvars         # Staging environment variables
├── prod.tfvars            # Production environment variables
└── modules/
    ├── vpc/               # VPC module
    ├── security_groups/   # Security groups module
    ├── kms/               # KMS encryption module
    ├── s3/                # S3 bucket module
    ├── rds/               # RDS database module
    ├── alb/               # Application Load Balancer module
    ├── ecs/               # ECS Fargate module
    └── cloudwatch/        # CloudWatch logs module
```

## Usage

### Initialize Terraform

```bash
terraform init
```

### Deploy Development Environment

```bash
terraform workspace new dev
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Deploy Staging Environment

```bash
terraform workspace new staging
terraform workspace select staging
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
```

### Deploy Production Environment

```bash
terraform workspace new prod
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Environment Configurations

### Development (dev.tfvars)
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.micro with 7-day backup retention
- ECS: 256 CPU, 512 MB memory, 1 task
- CloudWatch: 7-day log retention

### Staging (staging.tfvars)
- VPC CIDR: 10.2.0.0/16
- RDS: db.t3.small with 14-day backup retention
- ECS: 512 CPU, 1024 MB memory, 2 tasks
- CloudWatch: 30-day log retention

### Production (prod.tfvars)
- VPC CIDR: 10.3.0.0/16
- RDS: db.t3.medium with 30-day backup retention
- ECS: 1024 CPU, 2048 MB memory, 3 tasks
- CloudWatch: 90-day log retention

## Resource Naming Convention

All resources follow the naming pattern:
```
{environment}-{resource-type}-{environment_suffix}
```

Example: `dev-vpc-dev01`, `prod-alb-prod01`

## Security Features

- Encryption at rest using KMS for RDS, S3, and CloudWatch logs
- Encryption in transit using TLS/SSL
- Security groups with least privilege access
- Private subnets for databases and ECS tasks
- Public access blocked on S3 buckets
- IAM roles following principle of least privilege

## Outputs

After successful deployment, Terraform will output:
- VPC ID and CIDR
- Subnet IDs (public and private)
- ALB DNS name
- ECS cluster and service names
- RDS endpoint (sensitive)
- S3 bucket name
- KMS key ARN
- CloudWatch log group name

## Destroying Infrastructure

To destroy an environment:

```bash
terraform workspace select <env>
terraform destroy -var-file=<env>.tfvars
```

## Notes

- RDS instances are configured with `skip_final_snapshot = true` for easy destruction
- All resources support parallel deployments via the `environment_suffix` variable
- Database passwords are randomly generated and stored in AWS Secrets Manager
- Container insights are enabled for ECS clusters
