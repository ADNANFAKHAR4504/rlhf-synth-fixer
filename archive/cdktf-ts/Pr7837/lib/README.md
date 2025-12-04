# ECS Fargate Multi-Service Application Infrastructure

This CDKTF TypeScript project creates a complete containerized application infrastructure on AWS ECS Fargate with comprehensive networking, security, and auto-scaling capabilities.

## Architecture

The infrastructure deploys a three-tier containerized trading application:

1. **Frontend Service**: Web interface for traders (React/Node.js)
2. **API Gateway Service**: Backend API handling business logic
3. **Processing Service**: Heavy data processing and trade execution

### Key Features

- **High Availability**: Multi-AZ deployment across 3 availability zones
- **Network Isolation**: Private subnets for containers, public subnets for load balancers
- **Service Discovery**: AWS Cloud Map for internal service communication
- **Auto-scaling**: CPU-based scaling from 2 to 10 tasks per service
- **Security**: Secrets Manager for credentials, least-privilege IAM roles, security groups
- **Observability**: CloudWatch Logs with 30-day retention
- **Zero-downtime Deployments**: ECS rolling updates with traffic shifting

## Infrastructure Components

### Networking
- VPC with /16 CIDR (10.0.0.0/16)
- 3 public subnets for ALB and NAT Gateways
- 3 private subnets for ECS tasks
- Internet Gateway for public internet access
- 3 NAT Gateways (one per AZ) for private subnet internet access
- Route tables for public and private subnets

### Container Registry
- ECR repositories for each service (frontend, api-gateway, processing-service)
- Image tag immutability enabled
- Lifecycle policies (keep last 10 images)

### Compute
- ECS Cluster with Fargate and Fargate Spot capacity providers
- Task definitions with specific CPU/memory allocations:
  - Frontend: 512 CPU, 1024 MB memory
  - API Gateway: 1024 CPU, 2048 MB memory
  - Processing Service: 2048 CPU, 4096 MB memory
- ECS Services with desired count of 2, auto-scaling to 10

### Load Balancing
- Application Load Balancer in public subnets
- Target groups for frontend (port 3000) and api-gateway (port 8080)
- Health checks configured per service

### Service Discovery
- AWS Cloud Map private DNS namespace (trading.local)
- Service registry for api-gateway and processing-service
- Internal DNS resolution for service-to-service communication

### Security
- IAM task execution role with Secrets Manager access
- IAM task roles per service with least-privilege permissions
- Security groups:
  - ALB: Allows inbound HTTP/HTTPS from internet
  - Frontend: Allows traffic from ALB only
  - API Gateway: Allows traffic from ALB and frontend
  - Processing: Allows traffic from API Gateway only

### Secrets Management
- Database credentials in Secrets Manager
- API keys in Secrets Manager
- Secrets injected as environment variables in task definitions

### Logging
- CloudWatch Log Groups per service
- 30-day retention policy
- awslogs driver configuration

### Auto-scaling
- Target tracking scaling policies
- CPU utilization target: 70%
- Min capacity: 2 tasks
- Max capacity: 10 tasks
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

## Prerequisites

- Node.js 18 or later
- CDKTF CLI installed (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials
- Terraform 1.0 or later

## Configuration

The stack accepts the following configuration parameters:

- `environmentSuffix`: Unique suffix for resource names (required)
- `region`: AWS region for deployment (default: us-east-1)

Set via environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
