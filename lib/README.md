# Multi-Service ECS Orchestration Platform

AWS CDK TypeScript implementation for orchestrating containerized microservices on Amazon ECS with comprehensive monitoring, service discovery, and distributed tracing.

## Architecture Overview

This solution deploys a complete microservices platform with:

- ECS Cluster with Fargate and Fargate Spot capacity providers
- Three microservices: api-gateway, order-processor, market-data
- Application Load Balancer with path-based routing
- AWS Cloud Map for service discovery
- Auto-scaling based on CPU and memory utilization
- ECR repositories with lifecycle policies
- CloudWatch Container Insights
- X-Ray distributed tracing
- Comprehensive CloudWatch dashboards

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`
- Docker (for building and pushing container images)

## Project Structure

```
.
├── bin/
│   └── tap.ts                 # CDK app entry point
├── lib/
│   ├── tap-stack.ts           # Main stack implementation
│   ├── PROMPT.md              # Original requirements
│   ├── MODEL_RESPONSE.md      # Generated implementation
│   ├── IDEAL_RESPONSE.md      # Ideal implementation description
│   ├── MODEL_FAILURES.md      # Deployment status and notes
│   └── README.md              # This file
└── test/
    ├── tap-stack.unit.test.ts # Unit tests
    └── tap-stack.int.test.ts  # Integration tests
```

## Deployment Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Container Images

Before deploying, you need to build and push container images for each microservice:

```bash
# Example for api-gateway service
docker build -t api-gateway:latest ./path/to/api-gateway
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag api-gateway:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-repo-api-gateway-<suffix>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-repo-api-gateway-<suffix>:latest

# Repeat for order-processor and market-data services
```

### Step 3: Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Step 4: Deploy the Stack

```bash
# With custom environment suffix
cdk deploy --context environmentSuffix=dev123

# Or let it auto-generate suffix
cdk deploy
```

### Step 5: Verify Deployment

```bash
# Get ALB DNS name from outputs
aws cloudformation describe-stacks --stack-name TapStack-<suffix> --query 'Stacks[0].Outputs'

# Test API gateway endpoint
curl http://<alb-dns-name>/api/health
```

## Configuration

### Environment Suffix

The `environmentSuffix` parameter is required for resource naming uniqueness:

```bash
cdk deploy --context environmentSuffix=prod-v1
```

### Capacity Providers

The stack uses a mix of Fargate and Fargate Spot:
- Base capacity: 1 task on Fargate (always available)
- Additional capacity: 80% on Fargate Spot (cost-optimized)

### Auto-Scaling Configuration

Each service auto-scales based on:
- CPU utilization: target 70%
- Memory utilization: target 80%
- Min tasks: 1
- Max tasks: 10

## Service Discovery

Services communicate using AWS Cloud Map DNS:

- Namespace: `services-<suffix>.local`
- API Gateway: `api-gateway.services-<suffix>.local:8080`
- Order Processor: `order-processor.services-<suffix>.local:8080`
- Market Data: `market-data.services-<suffix>.local:8080`

## Monitoring

### CloudWatch Container Insights

Cluster-level metrics automatically collected:
- Task CPU and memory utilization
- Network metrics
- Storage metrics

### CloudWatch Dashboard

Access the dashboard: `ecs-services-<suffix>`

Metrics include:
- ALB request count and response time
- Target group health
- Per-service CPU and memory utilization

### X-Ray Tracing

Each task includes X-Ray daemon sidecar. Configure your application to use AWS X-Ray SDK:

```typescript
// Example Node.js configuration
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests (requires AWS credentials):

```bash
npm run test:int
```

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=<your-suffix>
```

All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup.

## Troubleshooting

### Services not starting

Check CloudWatch Logs:
```bash
aws logs tail /aws/ecs/api-gateway --follow
```

### Auto-scaling not working

Verify CloudWatch metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=svc-api-gateway-<suffix> \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

### Service discovery not resolving

Verify Cloud Map service registration:
```bash
aws servicediscovery list-services --namespace-id <namespace-id>
```

## Cost Optimization

- Uses Fargate Spot for 80% of capacity (up to 70% cost savings)
- No NAT Gateways (public subnets only)
- Log retention set to 1 week (3 days for X-Ray)
- ECR lifecycle policies keep only 10 images

## Security Considerations

- Task execution roles have minimal required permissions
- Task roles scoped per service
- Security groups follow least-privilege
- Container image scanning enabled
- All secrets should use AWS Secrets Manager

## Resources Created

This stack creates the following AWS resources:

- 1 VPC with 2 Availability Zones
- 1 ECS Cluster with Container Insights
- 3 ECR Repositories (with lifecycle policies)
- 1 Cloud Map Private DNS Namespace
- 3 Cloud Map Services
- 1 Application Load Balancer
- 1 ALB Listener
- 1 Target Group
- 3 Security Groups
- 3 ECS Task Definitions (with X-Ray sidecars)
- 3 ECS Services (with circuit breaker)
- 6 IAM Roles (execution + task roles)
- 6 Auto-Scaling Targets and Policies
- 1 CloudWatch Dashboard
- Multiple CloudWatch Log Groups

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [AWS Cloud Map Documentation](https://docs.aws.amazon.com/cloud-map/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
