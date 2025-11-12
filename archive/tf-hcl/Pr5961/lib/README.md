# ECS Fargate Containerized Microservices Infrastructure

This Terraform configuration deploys a production-ready containerized microservices architecture on AWS ECS Fargate with auto-scaling, load balancing, and service discovery.

## Architecture Overview

The infrastructure includes:

- **VPC Network**: Multi-AZ VPC with public and private subnets across 2 availability zones
- **ECS Cluster**: Fargate-based cluster with Container Insights enabled
- **Two Microservices**: 
  - `fraud-detection` - Fraud detection service
  - `transaction-processor` - Transaction processing service
- **Application Load Balancer**: Routes traffic to services with separate target groups
- **Auto Scaling**: CPU and memory-based scaling policies (2-10 tasks per service)
- **Service Discovery**: AWS Cloud Map for inter-service communication
- **ECR Repositories**: Private container image repositories with lifecycle policies
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **IAM Roles**: Least-privilege task execution and task roles

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured with appropriate credentials
- AWS Account with permissions to create ECS, VPC, IAM, ECR, and related resources

## Quick Start

### 1. Initialize Terraform

```bash
cd lib/
terraform init
```

### 2. Configure Variables

Create a `terraform.tfvars` file based on `terraform.tfvars.example`:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your `environmentSuffix`:

```hcl
environmentSuffix = "dev"  # or "prod", "staging", etc.
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

## Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `environmentSuffix` | Environment suffix for resource naming | Yes |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` |
| `public_subnet_cidrs` | Public subnet CIDRs | `["10.0.1.0/24", "10.0.2.0/24"]` |
| `private_subnet_cidrs` | Private subnet CIDRs | `["10.0.10.0/24", "10.0.20.0/24"]` |
| `fraud_detection_cpu` | CPU units for fraud detection | `1024` |
| `fraud_detection_memory` | Memory for fraud detection (MB) | `2048` |
| `transaction_processor_cpu` | CPU units for transaction processor | `1024` |
| `transaction_processor_memory` | Memory for transaction processor (MB) | `2048` |
| `environment` | Environment tag | `production` |
| `project` | Project tag | `fraud-detection` |

## Outputs

After deployment, Terraform will output:

- `alb_dns_name`: ALB DNS name for accessing services
- `ecs_cluster_name`: ECS cluster name
- `fraud_detection_ecr_url`: ECR repository URL for fraud detection service
- `transaction_processor_ecr_url`: ECR repository URL for transaction processor service
- `fraud_detection_endpoint`: Service endpoint via ALB
- `transaction_processor_endpoint`: Service endpoint via ALB
- `service_discovery_namespace`: Service discovery namespace

## Deploying Container Images

### 1. Build and Tag Docker Images

```bash
# Build fraud detection image
docker build -t fraud-detection:latest ./fraud-detection

# Build transaction processor image
docker build -t transaction-processor:latest ./transaction-processor
```

### 2. Authenticate to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Tag and Push Images

```bash
# Get ECR URLs from Terraform outputs
FRAUD_ECR=$(terraform output -raw fraud_detection_ecr_url)
TRANS_ECR=$(terraform output -raw transaction_processor_ecr_url)

# Tag images
docker tag fraud-detection:latest ${FRAUD_ECR}:latest
docker tag transaction-processor:latest ${TRANS_ECR}:latest

# Push images
docker push ${FRAUD_ECR}:latest
docker push ${TRANS_ECR}:latest
```

### 4. Update ECS Services

After pushing images, ECS will automatically deploy the new versions to your services.

## Service Endpoints

After deployment, access your services via the ALB:

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Access services
curl http://${ALB_DNS}/fraud-detection/health
curl http://${ALB_DNS}/transaction-processor/health
```

## Auto Scaling Configuration

Both services are configured with auto-scaling:

- **Min Tasks**: 2
- **Max Tasks**: 10
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization
- **Scale-out Cooldown**: 60 seconds
- **Scale-in Cooldown**: 300 seconds

## Service Discovery

Services can communicate with each other using Cloud Map DNS:

- Fraud Detection: `fraud-detection.local-<environmentSuffix>`
- Transaction Processor: `transaction-processor.local-<environmentSuffix>`

Example from within a container:

```bash
curl http://transaction-processor.local-dev:8080/api/process
```

## Monitoring and Logging

### CloudWatch Logs

View logs for each service:

```bash
# Fraud detection logs
aws logs tail /ecs/fraud-detection-<environmentSuffix> --follow

# Transaction processor logs
aws logs tail /ecs/transaction-processor-<environmentSuffix> --follow
```

### Container Insights

Container Insights is enabled on the ECS cluster. View metrics in the AWS Console:

1. Navigate to CloudWatch > Container Insights
2. Select your ECS cluster
3. View performance metrics for services and tasks

## Security

- **Network Isolation**: Containers run in private subnets with no direct internet access
- **Security Groups**: Traffic restricted to ALB on port 8080 only
- **IAM Roles**: Least-privilege access with separate task and execution roles
- **Private ECR**: Container images stored in private repositories
- **Encryption**: All logs encrypted at rest

## Cost Optimization

- **Fargate**: Pay only for resources your containers use
- **Spot Capacity**: Configured for cost savings (optional capacity provider)
- **Log Retention**: 7-day retention to manage CloudWatch costs
- **NAT Gateways**: 2 NAT gateways for high availability (consider 1 for dev environments)

## Destroying Infrastructure

To tear down all resources:

```bash
terraform destroy
```

Note: Ensure no critical data exists in CloudWatch logs before destroying.

## File Structure

```
lib/
├── main.tf                   # Terraform and provider configuration
├── variables.tf              # Variable definitions
├── vpc.tf                    # VPC, subnets, NAT gateways, route tables
├── security_groups.tf        # Security groups for ALB and ECS tasks
├── alb.tf                    # Application Load Balancer and target groups
├── ecs.tf                    # ECS cluster, task definitions, and services
├── ecr.tf                    # ECR repositories with lifecycle policies
├── iam.tf                    # IAM roles and policies
├── cloudwatch.tf             # CloudWatch log groups
├── service_discovery.tf      # AWS Cloud Map configuration
├── autoscaling.tf            # Auto-scaling targets and policies
├── outputs.tf                # Output values
├── terraform.tfvars.example  # Example variables file
└── README.md                 # This file
```

## Troubleshooting

### ECS Tasks Not Starting

1. Check CloudWatch logs for error messages
2. Verify ECR images exist and are accessible
3. Check IAM role permissions
4. Verify security group rules allow traffic

### ALB Health Checks Failing

1. Ensure containers expose port 8080
2. Verify `/health` endpoint exists and returns 200
3. Check security group allows ALB to container traffic
4. Review CloudWatch logs for application errors

### Auto Scaling Not Working

1. Verify CloudWatch metrics are being published
2. Check scaling policy configuration
3. Review ECS service events in AWS Console
4. Ensure min/max capacity allows scaling

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS ECS service events
3. Consult Terraform documentation
4. Review AWS ECS best practices

## License

This infrastructure code is provided as-is for deployment of ECS Fargate microservices.
