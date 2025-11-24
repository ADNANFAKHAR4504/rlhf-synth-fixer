# Payment Processing Web Application Infrastructure

This Terraform configuration deploys a production-ready containerized payment processing application on AWS with comprehensive security controls, high availability, and automated scaling.

## Architecture

The infrastructure consists of:

- **VPC**: Custom VPC with public, private, and database subnets across 3 availability zones
- **Application Load Balancer**: Distributes traffic with SSL termination and path-based routing
- **ECS Fargate**: Serverless container orchestration with auto-scaling
- **RDS Aurora PostgreSQL**: Multi-AZ database cluster with encryption and automated backups
- **NAT Gateways**: One per availability zone for high availability
- **VPC Endpoints**: AWS PrivateLink for secure service communication
- **S3**: Buckets for ALB logs and VPC flow logs
- **CloudWatch**: Container Insights, monitoring, and logging
- **Systems Manager**: Parameter Store for secure credential management
- **ECR**: Container image repository with vulnerability scanning

## Prerequisites

- Terraform 1.5 or later
- AWS CLI 2.x configured with appropriate credentials
- IAM permissions to create all resources
- S3 bucket and DynamoDB table for Terraform state (optional but recommended)

## Deployment

### 1. Initialize Backend

First, create an S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for state
aws s3 mb s3://my-terraform-state-bucket --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your values, especially `environment_suffix`:

```hcl
environment_suffix = "dev-01"  # REQUIRED: Must be unique
aws_region         = "us-east-1"
# ... other variables
```

### 3. Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=my-terraform-state-bucket" \
  -backend-config="key=payment-app/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-state-lock"
```

### 4. Review Plan

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

### 6. Push Container Image

After deployment, push your application container image to ECR:

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)

# Tag your image
docker tag your-app:latest $(terraform output -raw ecr_repository_url):latest

# Push to ECR
docker push $(terraform output -raw ecr_repository_url):latest
```

### 7. Update ECS Service

Update the ECS task definition to use your new image:

```bash
# Update the container_image variable in terraform.tfvars
container_image = "YOUR_ECR_REPOSITORY_URL:latest"

# Apply the change
terraform apply
```

## Access the Application

After deployment, access the application using the ALB DNS name:

```bash
terraform output alb_dns_name
```

## Resource Naming

All resources are named using the pattern: `payment-app-{environment_suffix}-{resource-type}`

The `environment_suffix` variable ensures uniqueness across multiple deployments.

## Security Features

- **Network Isolation**: Separate subnets for web, application, and database tiers
- **Encryption**: All data encrypted at rest (RDS, S3)
- **VPC Endpoints**: Private connectivity to AWS services
- **Security Groups**: Least privilege network access
- **Parameter Store**: Secure credential storage with automatic rotation capability
- **VPC Flow Logs**: Network traffic logging for compliance
- **ALB Access Logs**: HTTP request logging

## Monitoring

- **CloudWatch Container Insights**: Enabled for ECS cluster
- **CloudWatch Dashboard**: Pre-configured dashboard for key metrics
- **CloudWatch Alarms**: CPU and memory alerts for ECS tasks
- **Enhanced RDS Monitoring**: Performance Insights enabled

## Auto-scaling

ECS service scales automatically based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min capacity: 2 tasks
- Max capacity: 10 tasks

## Backup and Recovery

- RDS automated backups with 3-day retention
- Point-in-time recovery enabled
- Multi-AZ deployment for high availability

## Cost Optimization

The infrastructure uses:
- Fargate for serverless container execution
- Aurora Serverless v2 scaling configuration (0.5 - 2.0 ACU)
- S3 lifecycle policies for log retention
- ECR lifecycle policies to clean up old images

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: All resources are configured with `force_destroy = true` or appropriate deletion policies to ensure clean teardown.

## Outputs

Key outputs include:
- `alb_dns_name`: Application URL
- `ecr_repository_url`: Container image repository
- `rds_cluster_endpoint`: Database connection endpoint
- `vpc_id`: VPC identifier
- `ecs_cluster_name`: ECS cluster name

Run `terraform output` to see all outputs.

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch logs:
```bash
aws logs tail /ecs/payment-app-{environment_suffix}-app --follow
```

### Database Connection Issues

Verify security group rules allow traffic from ECS tasks to RDS.

### Container Image Pull Errors

Ensure ECS task execution role has permissions to pull from ECR.

## Compliance

This infrastructure meets the following compliance requirements:
- PCI-DSS network isolation standards
- Encryption at rest and in transit
- Audit logging with VPC flow logs and ALB access logs
- Secure credential management

## Support

For issues or questions, refer to the AWS documentation for the specific services used.
