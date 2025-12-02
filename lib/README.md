# Product Catalog API Deployment

This infrastructure deploys a highly available, auto-scaling containerized web application using AWS ECS Fargate.

## Architecture

- **VPC**: Custom VPC with 3 public and 3 private subnets across availability zones
- **Networking**: Internet Gateway and NAT Gateways for connectivity
- **Container Registry**: ECR repository with lifecycle policy (retains 5 most recent images)
- **Compute**: ECS Fargate cluster with auto-scaling (2-10 tasks)
- **Load Balancing**: Application Load Balancer with health checks
- **Monitoring**: CloudWatch logs (7-day retention) and alarms
- **Secrets**: Systems Manager Parameter Store for sensitive data
- **Security**: IAM roles with least privilege, tasks in private subnets

## Prerequisites

1. Pulumi CLI 3.x or higher
2. Python 3.9+
3. AWS CLI configured with appropriate credentials
4. Docker for building container images

## Configuration

Set the following Pulumi config values:

```bash
pulumi config set environmentSuffix dev
pulumi config set region us-east-1
```

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Build and push Docker image to ECR:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t product-catalog-api .

# Tag image
docker tag product-catalog-api:latest <ecr-repository-url>:latest

# Push image
docker push <ecr-repository-url>:latest
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Access application via ALB endpoint:
```bash
curl http://<alb-endpoint>
```

## Auto Scaling

The service automatically scales between 2-10 tasks based on CPU utilization:
- **Target CPU**: 70%
- **Scale out cooldown**: 60 seconds
- **Scale in cooldown**: 300 seconds

## Monitoring

Two CloudWatch alarms are configured:
1. **High CPU Alarm**: Triggers when CPU > 80% for 10 minutes
2. **Low Task Count Alarm**: Triggers when healthy tasks < 2

## Secrets Management

Database connection strings and API keys are stored in Parameter Store:
- `/product-catalog/db-connection-{environmentSuffix}`
- `/product-catalog/api-key-{environmentSuffix}`

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Outputs

- `vpc_id`: VPC identifier
- `alb_endpoint`: ALB DNS name
- `alb_url`: Full HTTP URL to access the application
- `ecr_repository_uri`: ECR repository URL for pushing images
- `ecs_cluster_name`: ECS cluster name
- `ecs_service_name`: ECS service name
