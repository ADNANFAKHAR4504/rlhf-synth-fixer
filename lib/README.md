# ECS Payment Processing System

This CDKTF Python infrastructure deploys a containerized payment processing system on AWS ECS with Fargate.

## Architecture

The infrastructure consists of:

- **VPC and Networking**: 3 availability zones with public and private subnets, NAT gateways for outbound connectivity
- **ECS Cluster**: Fargate cluster with Container Insights enabled, using both Fargate and Fargate Spot (50/50 split)
- **Microservices**: Three containerized services (payment-api, fraud-detection, notification-service)
- **Application Load Balancer**: HTTPS-only ALB with path-based routing to payment-api
- **Auto-scaling**: Target tracking policies based on CPU (>70%) and memory (>80%) utilization
- **CloudWatch Logging**: Encrypted log groups with 30-day retention for each service
- **IAM Roles**: Least privilege execution and task roles with explicit resource permissions

## Prerequisites

1. CDKTF CLI installed (`npm install -g cdktf-cli`)
2. Python 3.8+
3. AWS credentials configured
4. ACM certificate ARN for HTTPS (update in `tap_stack.py`)
5. ECR repositories created for each microservice

## Configuration

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

Update the certificate ARN in `lib/tap_stack.py` line 91:
```python
certificate_arn="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID",
```

Update ECR repository URLs in `lib/ecs_services.py` to match your account ID.

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Synthesize CDKTF
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- VPC: `payment-vpc-{environmentSuffix}`
- ECS Cluster: `payment-cluster-{environmentSuffix}`
- Services: `{service-name}-{environmentSuffix}`

## Security

- All ECS tasks run in private subnets with no direct internet access
- Security groups enforce port-level isolation between services
- IAM roles follow least privilege principle
- ALB uses HTTPS with TLS 1.2+
- CloudWatch logs encrypted with AWS-managed keys

## Monitoring

- Container Insights enabled on ECS cluster
- CloudWatch log groups with 30-day retention
- ECS service metrics for CPU and memory utilization
- ALB health checks every 30 seconds

## Cost Optimization

- Fargate Spot instances handle 50% of capacity
- Auto-scaling reduces over-provisioning
- NAT gateways required for private subnet connectivity (consider VPC endpoints for further optimization)

## Tags

All resources tagged with:
- Environment: production
- Team: payments
- CostCenter: engineering
