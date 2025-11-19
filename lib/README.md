# Multi-Tier Containerized Payment Processing System

## Overview

Production-ready AWS CDK Python implementation of a multi-tier containerized payment processing system using ECS Fargate. The system deploys three microservices with full observability, auto-scaling, and blue-green deployment capabilities.

## Architecture Components

### 1. Networking Stack (`networking_stack.py`)
- VPC spanning 3 availability zones
- Public subnets for Application Load Balancer
- Private subnets with NAT Gateways for ECS tasks
- Isolated subnets for Aurora database
- VPC Flow Logs with 30-day retention

### 2. Security Stack (`security_stack.py`)
- KMS encryption key with automatic rotation
- AWS Secrets Manager for database credentials and API keys
- Security Groups:
  - ALB SG: HTTP/HTTPS from internet
  - ECS SG: Traffic from ALB and inter-service communication
  - DB SG: PostgreSQL access only from ECS tasks

### 3. Database Stack (`database_stack.py`)
- Aurora Serverless v2 PostgreSQL cluster
- Multi-AZ deployment with writer and reader instances
- Auto-scaling capacity: 0.5 to 2.0 ACUs
- Automated backups (7-day retention)
- Encrypted storage using KMS
- CloudWatch Logs integration

### 4. Container Stack (`container_stack.py`)
- ECR repositories for three microservices:
  - payment-api
  - transaction-processor
  - notification-service
- Vulnerability scanning enabled (scan-on-push)
- Lifecycle policies (keep last 10 images)

### 5. ECS Stack (`ecs_stack.py`)
- ECS cluster with Container Insights enabled
- Fargate and Fargate Spot capacity providers
- Three microservices:
  - **payment-api**: 2 vCPU, 4GB RAM (customer-facing)
  - **transaction-processor**: 1 vCPU, 2GB RAM (backend processing)
  - **notification-service**: 1 vCPU, 2GB RAM (async, 80% Spot)
- Application Load Balancer with path-based routing:
  - `/api/payments/*` → payment-api
  - `/api/transactions/*` → transaction-processor
  - `/api/notifications/*` → notification-service
- AWS Cloud Map for service discovery
- Circuit breaker pattern with automatic rollback
- X-Ray sidecar containers for distributed tracing
- Auto-scaling based on CPU (70%), memory (80%), and request count (1000 req/target)
- Health checks every 30 seconds (3 consecutive failures threshold)
- CloudWatch Logs with 30-day retention and KMS encryption
- Runtime secret injection from Secrets Manager

### 6. Monitoring Stack (`monitoring_stack.py`)
- CloudWatch dashboard with key metrics:
  - ALB request count and response times
  - ECS service CPU and memory utilization
  - Target group health status
- CloudWatch alarms:
  - High CPU (>85%)
  - High memory (>90%)
  - High response times (>1000ms)
- SNS topic for alarm notifications

### 7. Deployment Stack (`deployment_stack.py`)
- CodeDeploy application for ECS
- Blue-green deployment groups for each service
- Linear traffic shifting: 10% every 1 minute (10-minute total)
- Automatic rollback on:
  - Failed deployments
  - Stopped deployments
  - CloudWatch alarm triggers

## Prerequisites

- AWS CDK 2.110.0 or later
- Python 3.9 or later
- Docker installed locally
- AWS CLI configured with appropriate credentials

## Deployment Instructions

### 1. Install Dependencies

```bash
pip install -r lib/requirements.txt
```

### 2. Set Environment Variables

```bash
export CDK_DEFAULT_ACCOUNT=<your-aws-account-id>
export CDK_DEFAULT_REGION=us-east-1
```

### 3. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap
```

### 4. Build and Push Container Images

After ECR repositories are created, build and push images:

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push payment-api
docker build -t payment-api:latest ./services/payment-api
docker tag payment-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/payment-api-<env-suffix>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/payment-api-<env-suffix>:latest

# Repeat for transaction-processor and notification-service
```

### 5. Deploy Infrastructure

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Or for production
cdk deploy --context environmentSuffix=prod
```

### 6. Verify Deployment

```bash
# Get stack outputs
aws cloudformation describe-stacks --stack-name TapStackdev --query 'Stacks[0].Outputs'

# Test endpoints
curl http://<alb-dns>/api/payments/health
curl http://<alb-dns>/api/transactions/health
curl http://<alb-dns>/api/notifications/health
```

## Configuration

### Environment Suffix

Use `environmentSuffix` context variable to create unique resources:

```bash
cdk deploy --context environmentSuffix=dev
cdk deploy --context environmentSuffix=staging
cdk deploy --context environmentSuffix=prod
```

### Resource Naming Convention

All resources follow: `{resource-type}-{env-suffix}`

Examples:
- VPC: `payment-processing-vpc-dev`
- Cluster: `payment-processing-cluster-dev`
- Service: `payment-api-dev`

### Auto-Scaling Settings

Each service auto-scales based on:
- **CPU Utilization**: Target 70% (scale-out: 30s, scale-in: 60s)
- **Memory Utilization**: Target 80% (scale-out: 30s, scale-in: 60s)
- **Request Count**: Target 1000 requests per target
- **Min Capacity**: 2 tasks
- **Max Capacity**: 10 tasks

### Capacity Providers

- **payment-api**: 100% Fargate (critical service)
- **transaction-processor**: 100% Fargate (critical service)
- **notification-service**: 80% Fargate Spot, 20% Fargate (cost optimization)

## Security Features

### Network Isolation
- ECS tasks in private subnets (no direct internet access)
- Database in isolated subnets (ECS access only)
- ALB in public subnets (only entry point)

### Encryption
- All data encrypted at rest (KMS)
- All data encrypted in transit (TLS)
- Secrets encrypted in Secrets Manager

### IAM
- Dedicated task execution roles for secret access
- Dedicated task roles with minimal permissions
- X-Ray tracing permissions

### PCI DSS Compliance
- Network segmentation
- Encryption at rest and in transit
- Access logging and monitoring
- Container image vulnerability scanning

## Monitoring and Observability

### CloudWatch Dashboard

View metrics:
- ALB request count and response times
- ECS service CPU and memory utilization
- Target group health status

### CloudWatch Logs

Log groups with 30-day retention:
- `/ecs/payment-processing/payment-api-{env}`
- `/ecs/payment-processing/transaction-processor-{env}`
- `/ecs/payment-processing/notification-service-{env}`
- `/aws/vpc/payment-processing-{env}`

### X-Ray Tracing

Distributed tracing enabled for all services. View traces in AWS X-Ray console.

### Container Insights

Enabled on ECS cluster. View detailed container-level metrics.

## Blue-Green Deployments

### Triggering Deployments

```bash
aws deploy create-deployment \
  --application-name payment-processing-dev \
  --deployment-group-name payment-api-dg-dev \
  --revision revisionType=S3,s3Location={bucket=my-bucket,key=my-app.zip,bundleType=zip}
```

### Traffic Shifting

- **Strategy**: Linear 10% every 1 minute
- **Total Duration**: 10 minutes
- **Automatic Rollback**: On alarm triggers or failures
- **Termination Wait**: 5 minutes after full shift

## Cost Optimization

1. **Fargate Spot**: notification-service uses 80% Spot capacity
2. **Aurora Serverless v2**: Auto-scales 0.5-2.0 ACUs
3. **ECR Lifecycle**: Keeps last 10 images only
4. **Log Retention**: 30-day retention
5. **NAT Gateways**: One per AZ for high availability

## Cleanup

```bash
# Delete stack
cdk destroy --context environmentSuffix=dev
```

All resources configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Troubleshooting

### Service Not Starting
1. Check CloudWatch Logs for errors
2. Verify ECR images exist
3. Check security group rules
4. Verify secrets are accessible

### Auto-Scaling Not Working
1. Check CloudWatch metrics
2. Verify auto-scaling policies
3. Check service desired vs. running count

### Blue-Green Deployment Failed
1. Check CodeDeploy deployment logs
2. Verify alarms not triggered
3. Check target group health

### Database Connection Issues
1. Verify security group rules
2. Check database secret format
3. Verify cluster availability
4. Check VPC routing

## AWS Services Used

- Amazon ECS (Fargate + Fargate Spot)
- Application Load Balancer
- Aurora Serverless v2 PostgreSQL
- AWS Cloud Map
- Amazon ECR
- VPC with 3 AZs
- AWS Secrets Manager
- AWS CodeDeploy
- CloudWatch (Logs, Metrics, Alarms, Dashboards)
- AWS KMS
- IAM Roles and Policies
- AWS X-Ray
- Amazon SNS

## File Structure

```
lib/
├── tap_stack.py                  # Main orchestration stack
├── networking_stack.py           # VPC, subnets, NAT Gateways
├── security_stack.py             # KMS, Secrets Manager, Security Groups
├── database_stack.py             # Aurora Serverless v2
├── container_stack.py            # ECR repositories
├── ecs_stack.py                  # ECS cluster, services, ALB, service discovery
├── monitoring_stack.py           # CloudWatch dashboards and alarms
├── deployment_stack.py           # CodeDeploy blue-green deployments
├── requirements.txt              # Python dependencies
├── PROMPT.md                     # Original requirements
├── MODEL_RESPONSE.md             # Implementation documentation
└── README.md                     # This file
```

## Implementation Status

All requirements implemented:
- ECS cluster with Fargate and Fargate Spot
- Three microservices with specified resource allocations
- Application Load Balancer with path-based routing
- Aurora Serverless v2 PostgreSQL
- AWS Cloud Map service discovery
- ECR with vulnerability scanning
- VPC with 3 AZs and NAT Gateways
- Auto-scaling (CPU, memory, request-based)
- CloudWatch Container Insights and encrypted logging
- X-Ray tracing
- Health checks (30s interval, 3 failures threshold)
- CodeDeploy blue-green deployments (10-minute linear shift)
- Secrets Manager with runtime injection
- KMS encryption
- Dedicated IAM roles per service
- Circuit breaker pattern
- All resources include environmentSuffix
- No deletion protection (fully destroyable)
- PCI DSS compliance considerations

## License

This project is provided as-is for demonstration purposes.
