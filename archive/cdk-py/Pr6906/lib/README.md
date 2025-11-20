# Container Orchestration Platform for Microservices

Production-ready ECS-based container orchestration platform with AWS App Mesh service mesh, supporting microservices architecture with automated deployments and comprehensive monitoring.

## Architecture Overview

This implementation provides a complete container orchestration platform with:

### Core Components

- **VPC with High Availability**: Public and private subnets across 3 availability zones
- **ECS Fargate Cluster**: Container orchestration with Fargate and Fargate Spot capacity providers
- **AWS App Mesh**: Service mesh providing service discovery and mTLS encryption
- **Application Load Balancer**: Internet-facing ALB with path-based routing to services
- **ECR Repositories**: Private container registries with vulnerability scanning
- **Auto-Scaling**: CPU-based scaling (70% target) for each service independently
- **Monitoring**: CloudWatch Container Insights and custom dashboards
- **Secrets Management**: AWS Secrets Manager for database credentials
- **Security**: KMS encryption for logs, IAM least privilege policies

### Microservices

The platform supports 3 microservices:
1. **Payment Service** (port 8080, path `/payment/*`)
2. **Order Service** (port 8081, path `/order/*`)
3. **Notification Service** (port 8082, path `/notification/*`)

Each service includes:
- Fargate Spot capacity provider (minimum 2 tasks)
- App Mesh virtual node and virtual service
- ALB target group with health checks every 10 seconds
- Auto-scaling based on CPU utilization (70% target)
- Circuit breaker deployment with automatic rollback
- IAM task roles with least-privilege S3 and DynamoDB permissions
- Envoy proxy sidecar for service mesh integration

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9 or later
- Docker Desktop (for building container images)
- Node.js 18+ (for CDK)

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://<account-id>/us-east-1
```

### 3. Synthesize CloudFormation Template

```bash
cdk synth --context environmentSuffix=dev
```

## Deployment

### Deploy the Stack

```bash
# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Or set environment variable
export ENVIRONMENT_SUFFIX=dev
cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

### Deployment Outputs

After successful deployment, note the following outputs:
- `VpcId`: VPC identifier
- `ClusterName`: ECS cluster name
- `MeshName`: App Mesh name
- `LoadBalancerDns`: ALB DNS name for accessing services
- `EcrRepoPayment`, `EcrRepoOrder`, `EcrRepoNotification`: ECR repository URIs

## Building and Pushing Container Images

### 1. Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Build and Push Images

```bash
# For each service (payment, order, notification)
SERVICE_NAME=payment  # or order, notification
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepo${SERVICE_NAME^}'].OutputValue" \
  --output text)

# Build image
docker build -t $SERVICE_NAME-service ./path/to/$SERVICE_NAME

# Tag and push
docker tag $SERVICE_NAME-service:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### 3. Update Task Definitions

After pushing images, update ECS services to use the new images:

```bash
# This is done automatically if you redeploy the stack
cdk deploy --context environmentSuffix=dev
```

## Post-Deployment Configuration

### 1. Verify ECS Services

```bash
aws ecs list-services --cluster microservices-cluster-dev
```

### 2. Check App Mesh Configuration

```bash
aws appmesh list-virtual-nodes --mesh-name microservices-mesh-dev
aws appmesh list-virtual-services --mesh-name microservices-mesh-dev
```

### 3. Test Service Endpoints

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDns'].OutputValue" \
  --output text)

# Test each service
curl http://$ALB_DNS/payment/health
curl http://$ALB_DNS/order/health
curl http://$ALB_DNS/notification/health
```

## Key Features

### Auto-Scaling

Each service scales independently based on CPU utilization:
- **Target**: 70% CPU utilization
- **Min Capacity**: 2 tasks
- **Max Capacity**: 10 tasks
- **Cooldown**: 60 seconds for scale in/out

### Blue-Green Deployment

ECS services use circuit breaker deployment:
- **Automatic Rollback**: Enabled on deployment failures
- **Zero Downtime**: Services continue running during deployments
- **Independent Lifecycles**: Each service deploys independently

### Service Mesh

AWS App Mesh provides:
- **Service Discovery**: Automatic discovery via Cloud Map
- **mTLS Encryption**: Secure service-to-service communication
- **Health Checks**: HTTP health checks every 30 seconds at `/health`
- **Observability**: Metrics via Envoy proxy sidecars

### Monitoring

CloudWatch monitoring includes:
- **Container Insights**: Cluster-level CPU and memory metrics
- **Service Metrics**: Per-service CPU, memory, and task count
- **ALB Metrics**: Request count, response time, HTTP errors
- **Custom Dashboard**: `microservices-dashboard-dev`

### Security

Security features:
- **IAM Least Privilege**: Task roles with specific S3 and DynamoDB permissions
- **Encrypted Logs**: CloudWatch Logs encrypted with KMS
- **Secrets Management**: Database credentials in Secrets Manager
- **Network Isolation**: Private subnets for ECS tasks
- **Security Groups**: Restrictive ingress/egress rules

### Cost Optimization

Cost-saving measures:
- **Fargate Spot**: All services run on Fargate Spot (up to 70% savings)
- **Single NAT Gateway**: Shared NAT for all private subnets
- **VPC Endpoints**: Free access to S3, DynamoDB, ECR
- **Short Log Retention**: 7-day retention for CloudWatch Logs

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │  Application    │
                │  Load Balancer  │
                │   (Public)      │
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    /payment/*      /order/*      /notification/*
        │                │                │
┌───────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ Payment Svc   │ │ Order Svc   │ │ Notify Svc  │
│ (2-10 tasks)  │ │ (2-10 tasks)│ │ (2-10 tasks)│
│               │ │             │ │             │
│ ┌──────────┐  │ │ ┌──────────┐│ │ ┌──────────┐│
│ │Container │  │ │ │Container ││ │ │Container ││
│ │+ Envoy   │  │ │ │+ Envoy   ││ │ │+ Envoy   ││
│ └──────────┘  │ │ └──────────┘│ │ └──────────┘│
└───────┬───────┘ └──────┬──────┘ └──────┬──────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                  ┌──────▼──────┐
                  │  App Mesh   │
                  │  (Service   │
                  │  Discovery) │
                  └─────────────┘

         Private Subnets (3 AZs)

┌─────────────────────────────────────────────────┐
│  VPC Endpoints: S3, DynamoDB, ECR, Logs        │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Services Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster microservices-cluster-dev \
  --services payment-service-dev \
  --query 'services[0].events[0:5]'

# Check task logs
aws logs tail /ecs/payment-service-dev --follow
```

### App Mesh Issues

```bash
# Check virtual node status
aws appmesh describe-virtual-node \
  --mesh-name microservices-mesh-dev \
  --virtual-node-name payment-node-dev

# Check Envoy proxy logs
aws logs tail /ecs/payment-service-dev --filter-pattern "envoy" --follow
```

### ALB Not Routing

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*microservices*"
```

## Cleanup

### Destroy the Stack

```bash
# This will delete all resources
cdk destroy --context environmentSuffix=dev
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup. ECR repositories will be emptied automatically before deletion.

## Cost Estimates

Approximate monthly costs (us-east-1, as of 2025):

| Resource                    | Quantity | Cost/Month  |
|-----------------------------|----------|-------------|
| Fargate Spot (0.5 vCPU)     | 6 tasks  | ~$15-20     |
| NAT Gateway                 | 1        | ~$32        |
| ALB                         | 1        | ~$20        |
| VPC Endpoints (Interface)   | 3        | ~$22        |
| CloudWatch Logs (5 GB)      | -        | ~$3         |
| **Total**                   |          | **~$92-97** |

**Note**: Actual costs depend on traffic, scaling, and data transfer. Fargate Spot provides up to 70% savings compared to Fargate On-Demand.

## Development

### Run Unit Tests

```bash
pytest tests/unit/
```

### Run Integration Tests

```bash
pytest tests/integration/
```

### Lint Code

```bash
pylint lib/**/*.py
```

### Format Code

```bash
black lib/**/*.py
```

## License

This project is part of the TAP (Test Automation Platform) infrastructure automation.

## Support

For issues or questions:
1. Check CloudWatch Logs for service errors
2. Review ECS service events
3. Verify App Mesh configuration
4. Check IAM role permissions
