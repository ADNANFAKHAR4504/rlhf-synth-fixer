# Multi-Environment Terraform Infrastructure

This repository contains a complete Terraform implementation for managing multi-environment infrastructure on AWS. It provides complete isolation between dev, staging, and production environments with proper state management and resource naming conventions.

## Architecture Overview

The infrastructure uses a modular, directory-based approach with:
- Separate state files for each environment in S3 with DynamoDB locking
- Shared reusable modules for consistency
- Environment-specific configurations for flexibility
- Complete network isolation with separate VPCs per environment
- ECS Fargate workloads with auto-scaling
- Application Load Balancer for traffic distribution

## Directory Structure

```
lib/
├── backend-setup/          # Initial S3 and DynamoDB setup
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── modules/                # Reusable infrastructure modules
│   ├── networking/         # VPC, subnets, IGW, NAT
│   ├── security-groups/    # Security groups for ECS and ALB
│   ├── iam/                # IAM roles and policies
│   └── ecs/                # ECS cluster, service, ALB
└── environments/           # Environment-specific configs
    ├── dev/
    ├── staging/
    └── production/
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create resources
- S3 bucket names must be globally unique

## Initial Setup

### Step 1: Configure Backend Resources

Before deploying any environment, create the S3 bucket and DynamoDB table for state management:

```bash
cd lib/backend-setup

# Initialize Terraform
terraform init

# Create backend for dev environment
terraform apply -var="environment_suffix=dev001"

# Create backend for staging environment
terraform apply -var="environment_suffix=stg001"

# Create backend for production environment
terraform apply -var="environment_suffix=prd001"
```

This creates:
- S3 bucket for state storage with versioning and encryption
- DynamoDB table for state locking

### Step 2: Deploy Environments

After backend setup, deploy each environment:

#### Dev Environment

```bash
cd lib/environments/dev

# Initialize Terraform backend
terraform init

# Review the execution plan
terraform plan -var-file=terraform.tfvars

# Apply the configuration
terraform apply -var-file=terraform.tfvars
```

#### Staging Environment

```bash
cd lib/environments/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

#### Production Environment

```bash
cd lib/environments/production
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## Environment Configuration

Each environment has its own configuration in `terraform.tfvars`:

### Dev Environment
- VPC CIDR: 10.0.0.0/16
- NAT Gateway: Disabled (cost optimization)
- ECS Tasks: 1-2 (min-max)
- Resources: Minimal for development

### Staging Environment
- VPC CIDR: 10.1.0.0/16
- NAT Gateway: Enabled
- ECS Tasks: 1-4 (min-max)
- Resources: Production-like for testing

### Production Environment
- VPC CIDR: 10.2.0.0/16
- NAT Gateway: Enabled
- ECS Tasks: 2-10 (min-max)
- Resources: High availability configuration

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environment_suffix}`

Examples:
- `vpc-dev-dev001`
- `ecs-cluster-staging-stg001`
- `alb-production-prd001`

The `environment_suffix` ensures uniqueness and prevents naming conflicts.

## State Management

### Backend Configuration

Each environment uses a separate S3 backend:
- Dev: `terraform-state-multi-env-infra-dev001`
- Staging: `terraform-state-multi-env-infra-stg001`
- Production: `terraform-state-multi-env-infra-prd001`

State files are:
- Encrypted at rest (AES256)
- Versioned for rollback capability
- Locked using DynamoDB to prevent concurrent modifications

### State Operations

View current state:
```bash
terraform state list
```

Show specific resource:
```bash
terraform state show aws_vpc.main
```

Import existing resource:
```bash
terraform import module.networking.aws_vpc.main vpc-12345678
```

## Modules

### Networking Module

Creates VPC infrastructure:
- VPC with DNS support
- Public and private subnets across 2 AZs
- Internet Gateway
- NAT Gateways (optional, enabled per environment)
- Route tables and associations

### Security Groups Module

Manages security groups:
- ECS tasks security group (allows traffic from ALB)
- ALB security group (allows HTTP/HTTPS from internet)

### IAM Module

Creates IAM roles:
- ECS task execution role (for ECS service)
- ECS task role (for application containers)
- Policies following least privilege principle

### ECS Module

Deploys ECS infrastructure:
- ECS Fargate cluster
- Task definition with CloudWatch logging
- ECS service with desired count
- Application Load Balancer
- Target group with health checks
- Auto-scaling policies (CPU and memory based)

## Customization

### Changing Container Image

Edit the `container_image` variable in `terraform.tfvars`:

```hcl
container_image = "your-registry/your-image:tag"
```

### Adjusting Auto-Scaling

Modify capacity variables in `terraform.tfvars`:

```hcl
desired_count = 3
min_capacity  = 2
max_capacity  = 10
```

### Adding Environment Variables

Update the `environment_variables` in the module call:

```hcl
module "ecs" {
  ...
  environment_variables = [
    {
      name  = "APP_ENV"
      value = "production"
    },
    {
      name  = "LOG_LEVEL"
      value = "info"
    }
  ]
}
```

## Destroying Resources

To destroy an environment:

```bash
cd lib/environments/{environment}
terraform destroy -var-file=terraform.tfvars
```

To destroy backend resources (do this last):

```bash
cd lib/backend-setup
terraform destroy -var="environment_suffix={suffix}"
```

## Migration from Single Environment

If migrating from an existing single-environment setup:

1. Create backend resources first
2. Use `terraform import` to import existing resources
3. Gradually migrate resources to the new modular structure
4. Use `terraform state mv` to reorganize state
5. Test thoroughly in dev before migrating staging and production
6. Plan for downtime or use blue-green deployment strategy

## Cost Optimization

- Dev environment disables NAT Gateway (saves ~$32/month per AZ)
- Uses Fargate Spot capacity for dev (optional)
- Auto-scaling ensures resources scale down during low usage
- CloudWatch log retention set to 7 days
- S3 state bucket uses standard storage

## Security Best Practices

- State files encrypted at rest and in transit
- IAM roles follow least privilege principle
- Security groups restrict traffic by source
- Private subnets for ECS tasks
- Public subnets only for ALB
- All resources tagged for compliance
- No hardcoded credentials

## Troubleshooting

### State Lock Error

If state is locked:
```bash
terraform force-unlock LOCK_ID
```

### Backend Initialization Issues

Ensure backend resources exist:
```bash
aws s3 ls s3://terraform-state-multi-env-infra-dev001
aws dynamodb describe-table --table-name terraform-locks-multi-env-infra-dev001
```

### Resource Naming Conflicts

Ensure `environment_suffix` is unique across all environments.

### ECS Service Failed to Stabilize

Check:
- Container image is accessible
- Task definition is valid
- Security groups allow necessary traffic
- Subnets have proper routing

## Outputs

After successful deployment, Terraform outputs:

- `vpc_id`: VPC identifier
- `ecs_cluster_name`: ECS cluster name
- `alb_dns_name`: Load balancer DNS (use this to access your application)
- `ecs_service_name`: ECS service name

Access outputs:
```bash
terraform output
terraform output -json
terraform output alb_dns_name
```

## Testing

After deployment, test the infrastructure:

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Test HTTP endpoint
curl http://$ALB_DNS

# Check ECS service status
aws ecs describe-services \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --services $(terraform output -raw ecs_service_name)
```

## CI/CD Integration

This structure supports CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Terraform Apply
  run: |
    cd lib/environments/${{ matrix.environment }}
    terraform init
    terraform apply -var-file=terraform.tfvars -auto-approve
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Monitoring

The infrastructure includes:
- CloudWatch Container Insights (enabled by default)
- ECS service metrics
- ALB target health metrics
- Auto-scaling metrics

Access logs in CloudWatch:
```bash
aws logs tail /ecs/dev-dev001 --follow
```

## Support

For issues or questions:
1. Review Terraform plan output carefully
2. Check AWS CloudWatch logs
3. Verify AWS service quotas
4. Ensure IAM permissions are sufficient

## License

This infrastructure code is provided as-is for educational and production use.
