# Multi-Service ECS Fargate Application Deployment

This project implements a production-grade containerized infrastructure for a financial services company using **Pulumi with TypeScript** on AWS.

## Architecture Overview

The infrastructure deploys a multi-service ECS Fargate application with the following components:

- **VPC**: Multi-AZ VPC with public and private subnets across 3 availability zones
- **ECS Cluster**: Fargate-based container orchestration with Container Insights
- **Services**: Three containerized services (frontend, api-gateway, processing-service)
- **Load Balancing**: Application Load Balancer for external traffic distribution
- **Service Discovery**: AWS Cloud Map for internal service-to-service communication
- **Container Registry**: ECR repositories with image scanning and lifecycle policies
- **Secrets Management**: AWS Secrets Manager for sensitive configuration
- **Observability**: CloudWatch Logs with 30-day retention
- **Auto Scaling**: CPU-based auto scaling for all services (min 2, max 10 tasks)

## Project Structure

```
lib/
├── PROMPT.md              # Human-readable requirements document
├── MODEL_RESPONSE.md      # Initial LLM-generated response with intentional errors
├── MODEL_FAILURES.md      # Documentation of errors and fixes
├── IDEAL_RESPONSE.md      # Corrected infrastructure code
├── tap-stack.ts          # Extracted Pulumi stack implementation
└── README.md             # This file

bin/
└── tap.ts                # Pulumi application entry point

test/
├── tap-stack.unit.test.ts # Comprehensive unit tests
└── tap-stack.int.test.ts  # Integration tests for deployed resources
```

## Intentional Errors and Fixes

This project contains 5 intentional errors in MODEL_RESPONSE.md that are corrected in IDEAL_RESPONSE.md:

### Error 1: Missing environmentSuffix in ECR Repository (Category B)
- **Issue**: API Gateway ECR repository name missing environmentSuffix
- **Impact**: Resource naming inconsistency, prevents parallel deployments
- **Fix**: Added environmentSuffix to resource name: `api-gateway-repo-${environmentSuffix}`

### Error 2: Missing Security Group Ingress Rules (Category A)
- **Issue**: ECS task security group lacks ingress rules from ALB
- **Impact**: Tasks cannot receive traffic, health checks fail
- **Fix**: Added ingress rules for ports 3000, 8080 (from ALB), 9090 (from VPC)

### Error 3: Overly Permissive S3 IAM Policy (Category A)
- **Issue**: Frontend task role has `s3:*` permissions instead of read-only
- **Impact**: Violates least-privilege principle, security risk
- **Fix**: Restricted to `s3:GetObject` and `s3:ListBucket`

### Error 4: Incorrect CPU/Memory Allocation (Category B)
- **Issue**: Processing service has 512/1024 instead of required 2048/4096
- **Impact**: Insufficient resources for trade processing, performance issues
- **Fix**: Updated to correct values: cpu: '2048', memory: '4096'

### Error 5: Missing API Gateway Target Group (Category A)
- **Issue**: API Gateway service has no target group or load balancer attachment
- **Impact**: Service cannot be accessed externally, breaks architecture
- **Fix**: Created target group and listener rule with path pattern `/api/*`

## Key Features

### Multi-AZ High Availability
- 3 availability zones for fault tolerance
- Separate NAT Gateways per AZ for resilience
- Multi-AZ subnet distribution for ECS tasks

### Security Best Practices
- Least-privilege IAM policies per service
- Network isolation with security groups
- Secrets stored in AWS Secrets Manager
- Private subnets for ECS tasks
- Image scanning on ECR push

### Scalability
- Auto scaling based on CPU utilization (target: 70%)
- Capacity provider strategies with Fargate and Fargate Spot
- Load balancer distribution across multiple tasks

### Observability
- Container Insights for cluster metrics
- CloudWatch Logs with structured logging
- 30-day log retention
- Health checks for all services

## Services Configuration

### Frontend Service
- **CPU/Memory**: 512/1024
- **Port**: 3000
- **Permissions**: Read-only S3 access for static assets
- **Load Balancer**: Direct ALB attachment (default action)

### API Gateway Service
- **CPU/Memory**: 1024/2048
- **Port**: 8080
- **Permissions**: DynamoDB, SQS, SNS access
- **Load Balancer**: Path-based routing (`/api/*`)

### Processing Service
- **CPU/Memory**: 2048/4096
- **Port**: 9090
- **Permissions**: DynamoDB and S3 read/write
- **Access**: Internal only via service discovery

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Pulumi CLI installed

### Deploy Stack

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Access Application

After deployment, the ALB DNS name is exported:

```bash
# Get ALB DNS name
pulumi stack output albDnsName

# Access frontend
curl http://<alb-dns-name>/

# Access API Gateway
curl http://<alb-dns-name>/api/health
```

## Testing

### Unit Tests

Run comprehensive unit tests to validate resource creation and configuration:

```bash
npm test -- tap-stack.unit.test.ts
```

Unit tests cover:
- Stack instantiation and outputs
- VPC and networking configuration (subnets, NAT gateways, route tables)
- ECR repository settings (scanning, immutability, lifecycle policies)
- ECS cluster configuration (Container Insights, capacity providers)
- Security group rules (ALB, ECS tasks)
- IAM roles and policies (least-privilege validation)
- Task definitions (CPU/Memory, container configs)
- Load balancer configuration (target groups, listeners, rules)
- Auto scaling policies
- Resource naming and tagging

### Integration Tests

Run integration tests against deployed infrastructure:

```bash
npm test -- tap-stack.int.test.ts
```

Integration tests verify:
- VPC and networking resources exist and are properly configured
- ECR repositories with correct settings
- ECS cluster status and capacity providers
- CloudWatch log groups with retention
- Secrets Manager secrets accessibility
- Security groups with correct rules
- IAM roles and policies
- Service discovery namespace and services
- Task definitions with correct resource allocations
- ALB with target groups and listeners
- ECS services running with desired count

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example:
- VPC: `ecs-vpc-dev`
- ECS Cluster: `ecs-cluster-dev`
- Frontend Repository: `frontend-repo-dev`
- API Gateway Service: `api-gateway-service-dev`

## Outputs

The stack exports the following outputs:

- `albDnsName`: DNS name of the Application Load Balancer
- `clusterArn`: ARN of the ECS cluster
- `ecrRepositories`: Array of ECR repository URLs
- `frontendServiceArn`: ARN of the frontend ECS service
- `apiGatewayServiceArn`: ARN of the API Gateway ECS service
- `processingServiceArn`: ARN of the processing service ECS service
- `namespaceId`: Service discovery namespace ID

## Cost Optimization

- Fargate Spot capacity providers (3:1 weight ratio) for cost savings
- Single NAT Gateway option available (commented out by default)
- Serverless options recommended where applicable
- Auto scaling prevents over-provisioning

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are created without Retain policies for easy cleanup.

## Documentation

- **PROMPT.md**: Human-readable requirements and specifications
- **MODEL_FAILURES.md**: Detailed documentation of intentional errors and fixes
- **IDEAL_RESPONSE.md**: Complete corrected infrastructure code

## Support

For issues or questions:
1. Review MODEL_FAILURES.md for common error patterns
2. Check integration test results for deployed resource status
3. Verify security group rules and IAM policies
4. Ensure environmentSuffix is set correctly
