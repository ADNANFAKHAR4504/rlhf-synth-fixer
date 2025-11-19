# Payment Processing System - ECS Fargate Infrastructure

This Pulumi TypeScript project deploys a containerized payment processing system on AWS ECS Fargate with three microservices, service discovery, auto-scaling, and comprehensive security controls.

## Architecture

### Services
- **api-gateway**: Public-facing service accessible via Application Load Balancer
- **payment-processor**: Internal service handling payment workflows
- **fraud-detector**: Internal service validating transactions

### Key Features
- ECS Fargate cluster across 3 availability zones
- AWS Cloud Map service discovery for inter-service communication
- Application Load Balancer for external traffic
- Auto-scaling based on CPU/memory metrics (70% threshold)
- Encrypted CloudWatch Logs with 30-day retention
- AWS Secrets Manager for credentials
- Container Insights enabled for observability
- ECR repositories with vulnerability scanning
- Least-privilege IAM roles per service

## Infrastructure Components

### Networking
- VPC with 10.0.0.0/16 CIDR
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- Internet Gateway for public subnets
- NAT Gateway for private subnet outbound traffic
- Security groups for ALB and ECS tasks

### Compute
- ECS Fargate cluster
- 3 task definitions (1 vCPU, 2GB memory each)
- 3 ECS services (2 tasks minimum per service)
- Auto-scaling from 2 to 10 tasks per service

### Storage & Data
- 3 ECR repositories with vulnerability scanning
- CloudWatch Log Groups with KMS encryption
- Secrets Manager for database credentials and API keys

### Load Balancing & Service Discovery
- Application Load Balancer (public)
- Target Group for api-gateway
- AWS Cloud Map private DNS namespace (payment.local)

### Security
- KMS key for CloudWatch Logs encryption
- IAM task execution role for ECS
- 3 IAM task roles (one per service)
- Security groups with least-privilege rules

### Monitoring
- Container Insights enabled
- CloudWatch Logs with 30-day retention
- Health checks on all services

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- Docker (for building and pushing container images)

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Configuration

The infrastructure uses environment variables for configuration. The `ENVIRONMENT_SUFFIX` is automatically read from the environment:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

### 4. Build and Push Container Images

After the infrastructure is deployed, build and push your Docker images to the ECR repositories:

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build and push api-gateway
docker build -t payment-api-gateway-${ENVIRONMENT_SUFFIX}:latest ./services/api-gateway
docker tag payment-api-gateway-${ENVIRONMENT_SUFFIX}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-api-gateway-${ENVIRONMENT_SUFFIX}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-api-gateway-${ENVIRONMENT_SUFFIX}:latest

# Build and push payment-processor
docker build -t payment-payment-processor-${ENVIRONMENT_SUFFIX}:latest ./services/payment-processor
docker tag payment-payment-processor-${ENVIRONMENT_SUFFIX}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-payment-processor-${ENVIRONMENT_SUFFIX}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-payment-processor-${ENVIRONMENT_SUFFIX}:latest

# Build and push fraud-detector
docker build -t payment-fraud-detector-${ENVIRONMENT_SUFFIX}:latest ./services/fraud-detector
docker tag payment-fraud-detector-${ENVIRONMENT_SUFFIX}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-fraud-detector-${ENVIRONMENT_SUFFIX}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-fraud-detector-${ENVIRONMENT_SUFFIX}:latest
```

### 5. Update Secrets

After deployment, update the Secrets Manager secrets with actual credentials:

```bash
aws secretsmanager update-secret \
  --secret-id payment-db-credentials-${ENVIRONMENT_SUFFIX} \
  --secret-string '{"username":"actual_user","password":"actual_password","host":"actual_host","port":5432,"database":"payments"}'

aws secretsmanager update-secret \
  --secret-id payment-api-keys-${ENVIRONMENT_SUFFIX} \
  --secret-string '{"stripe_api_key":"sk_live_xxx","fraud_detection_key":"fd_api_xxx"}'
```

## Outputs

After deployment, Pulumi provides these outputs:

- **vpcId**: VPC ID for the infrastructure
- **ecsClusterName**: Name of the ECS cluster
- **albDnsName**: DNS name of the Application Load Balancer (access point for api-gateway)
- **apiGatewayServiceName**: Name of the api-gateway ECS service
- **paymentProcessorServiceName**: Name of the payment-processor ECS service
- **fraudDetectorServiceName**: Name of the fraud-detector ECS service
- **serviceDiscoveryNamespace**: Cloud Map namespace for service discovery

Access outputs with:
```bash
pulumi stack output albDnsName
```

## Service Communication

Services communicate via AWS Cloud Map DNS:
- **api-gateway.payment.local:8080** - API Gateway service
- **payment-processor.payment.local:8080** - Payment Processor service
- **fraud-detector.payment.local:8080** - Fraud Detector service

The api-gateway is publicly accessible via the ALB. The other services are internal only.

## Auto-Scaling

Each service scales automatically:
- **Minimum tasks**: 2 per service
- **Maximum tasks**: 10 per service
- **Scaling triggers**: 70% CPU or Memory utilization
- **Scale-out cooldown**: 60 seconds
- **Scale-in cooldown**: 300 seconds

## Monitoring

- **Container Insights**: Enabled for cluster-level metrics
- **CloudWatch Logs**: All container logs encrypted and retained for 30 days
- **Health Checks**: Each service has health check endpoint at `/health`
- **Log Groups**:
  - `/ecs/payment-api-gateway-${ENVIRONMENT_SUFFIX}`
  - `/ecs/payment-payment-processor-${ENVIRONMENT_SUFFIX}`
  - `/ecs/payment-fraud-detector-${ENVIRONMENT_SUFFIX}`

## Security

- All ECS tasks run in private subnets
- Least-privilege IAM roles per service
- Secrets stored in AWS Secrets Manager
- CloudWatch Logs encrypted with KMS
- Security groups restrict traffic to required ports only
- Container image vulnerability scanning enabled
- No deletion protection (infrastructure is destroyable)

## Testing

Run tests after infrastructure is deployed:

```bash
npm test
```

## Cleanup

To destroy all infrastructure:

```bash
pulumi destroy
```

Note: This will remove all resources including the VPC, ECS cluster, ECR repositories, and all associated resources.

## Troubleshooting

### Services not starting
- Check CloudWatch Logs for container errors: `aws logs tail /ecs/payment-api-gateway-${ENVIRONMENT_SUFFIX} --follow`
- Verify ECR images exist and are accessible
- Ensure Secrets Manager secrets are populated
- Check security group rules allow required traffic

### Auto-scaling not working
- Verify CloudWatch metrics are being published
- Check auto-scaling policies are attached correctly: `aws application-autoscaling describe-scalable-targets --service-namespace ecs`
- Review scaling cooldown periods

### Service discovery issues
- Verify Cloud Map namespace and service registrations: `aws servicediscovery list-namespaces`
- Check ECS service `serviceRegistries` configuration
- Ensure DNS resolution works within VPC (test from another service)

### ALB health check failures
- Verify containers are listening on port 8080
- Ensure `/health` endpoint returns HTTP 200
- Check security group allows ALB to reach ECS tasks on port 8080

## Cost Optimization

This architecture is optimized for cost with:
- Fargate for pay-per-use compute (no EC2 instances to manage)
- Single NAT Gateway (cost: ~$32/month) - can increase to 3 for production
- 30-day CloudWatch log retention
- Auto-scaling to match demand (scales down to 2 tasks per service)
- ECR lifecycle policies to clean old images (keeps last 10)

Estimated monthly cost (with 2 tasks per service running 24/7):
- Fargate: ~$50-80/month (6 tasks @ 1vCPU/2GB)
- NAT Gateway: ~$32/month
- ALB: ~$16/month
- CloudWatch Logs: ~$5-10/month
- Secrets Manager: ~$1/month
- **Total**: ~$100-140/month

## Compliance

All resources are tagged with:
- **Environment**: Environment suffix value (from ENVIRONMENT_SUFFIX)
- **Repository**: Repository name (from REPOSITORY env var)
- **Author**: Commit author (from COMMIT_AUTHOR env var)
- **PRNumber**: Pull request number (from PR_NUMBER env var)
- **Team**: Team identifier (from TEAM env var)
- **CreatedAt**: Resource creation timestamp

These tags are managed automatically by the CI/CD system.

## Architecture Diagram

```
Internet
   |
   v
Application Load Balancer (public subnets)
   |
   v
api-gateway (private subnets, 2-10 tasks)
   |
   v (via Cloud Map service discovery)
   +---> payment-processor (private subnets, 2-10 tasks)
   |
   +---> fraud-detector (private subnets, 2-10 tasks)
         |
         v
   AWS Secrets Manager (credentials)
         |
         v
   CloudWatch Logs (encrypted, 30-day retention)
```

All services communicate internally via AWS Cloud Map DNS resolution on the `payment.local` namespace.
