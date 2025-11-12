# Video Processing Pipeline Infrastructure - Complete Solution

This CDK Python implementation creates a complete video processing pipeline for StreamTech Japan with all resources deployed in ap-northeast-1 region with multi-AZ configuration where applicable.

## Architecture Overview

The solution uses seven nested CDK stacks to organize infrastructure components:

### 1. NetworkStack (lib/network_stack.py)
- VPC with CIDR 10.0.0.0/16 spanning 2 availability zones
- Three subnet tiers:
  - Public subnets for NAT gateways and load balancers
  - Private subnets with egress for application workloads
  - Isolated database subnets for RDS and ElastiCache
- 1 NAT gateway for cost optimization
- Security groups for ECS, RDS, Redis, and EFS with proper ingress rules
- VPC endpoints for S3 and DynamoDB for cost optimization

### 2. StorageStack (lib/storage_stack.py)
- RDS PostgreSQL 16.6 instance with:
  - Multi-AZ deployment for high availability
  - Storage encryption enabled
  - Automated backups (7-day retention)
  - Performance Insights enabled
  - GP3 storage with auto-scaling (100GB-500GB)
- Database credentials stored in AWS Secrets Manager
- EFS file system for temporary video processing storage:
  - Encryption at rest enabled
  - Elastic throughput mode
  - Automatic backups enabled
  - Access point configured for ECS tasks

### 3. CacheStack (lib/cache_stack.py)
- ElastiCache Redis 7.1 replication group with:
  - 2 cache nodes (satisfies requirement for at least 2 nodes)
  - Multi-AZ enabled with automatic failover
  - Encryption at rest and in transit
  - cache.t4g.medium instance type
  - Automated snapshots with 5-day retention
  - Deployed in private subnets across multiple AZs

### 4. ComputeStack (lib/compute_stack.py)
- ECS Cluster configured with:
  - Fargate capacity providers
  - Container Insights enabled for monitoring
- IAM roles:
  - Task execution role with ECS policies
  - Task role with permissions for:
    - EFS access (ClientMount, ClientWrite, ClientRootAccess)
    - Secrets Manager access (GetSecretValue)
    - CloudWatch metrics and logs
- CloudWatch log group for container logs (7-day retention)

### 5. ApiStack (lib/api_stack.py)
- API Gateway REST API with:
  - Regional endpoint type
  - CloudWatch logging enabled
  - Rate limiting (1000 req/sec, 2000 burst)
  - CORS enabled for all origins
- Lambda function (Python 3.12) for API backend with:
  - 512MB memory, 30-second timeout
  - Environment variables for database and Redis endpoints
  - IAM permissions to read Secrets Manager
- API endpoints:
  - GET /health (no authentication required)
  - GET/POST /metadata (API key required)
- API key and usage plan for authentication
- Monthly quota: 1,000,000 requests

### 6. NotificationStack (lib/notification_stack.py)
- SNS topic for video processing completion notifications:
  - Topic name: video-processing-completion-{env}
  - Standard (non-FIFO) topic
- SNS topic for video processing error notifications:
  - Topic name: video-processing-error-{env}
  - Standard (non-FIFO) topic
- CloudFormation exports for topic ARNs and names

### 7. WorkflowStack (lib/workflow_stack.py)
- Step Functions state machine for video processing orchestration:
  - State machine name: video-processing-workflow-{env}
  - 30-minute execution timeout
  - AWS X-Ray tracing enabled
  - CloudWatch logging with full execution data
- ECS Fargate task definition for video processing:
  - 1024 CPU units (1 vCPU)
  - 2048 MB memory
  - Uses aws-cli container image for demo
- Workflow features:
  - ECS task execution with RUN_JOB integration pattern
  - Retry logic (3 attempts with exponential backoff)
  - Error handling with catch states
  - SNS notifications on success and failure
- IAM permissions:
  - State machine can run ECS tasks
  - State machine can publish to SNS topics
  - Task role includes Step Functions callback permissions

## Key Features

1. **Multi-AZ High Availability**: RDS, ElastiCache, and VPC subnets span multiple availability zones
2. **Security**: All data encrypted at rest and in transit, credentials in Secrets Manager
3. **Cost Optimization**: Single NAT gateway, VPC endpoints for AWS services
4. **Monitoring**: Container Insights, Performance Insights, CloudWatch logs, Step Functions execution logs
5. **Compliance**: Resources deployed in ap-northeast-1 region as required
6. **Scalability**: ECS Fargate for auto-scaling, EFS with elastic throughput, RDS with storage auto-scaling
7. **Workflow Orchestration**: Step Functions for coordinating video processing tasks with retry and error handling
8. **Notifications**: SNS topics for alerting on processing completion and errors

## Files Structure

```
lib/
├── tap_stack.py           # Main orchestration stack
├── network_stack.py       # VPC and security groups
├── storage_stack.py       # RDS and EFS
├── cache_stack.py         # ElastiCache Redis
├── compute_stack.py       # ECS cluster and IAM roles
├── api_stack.py           # API Gateway and Lambda
├── notification_stack.py  # SNS topics for notifications
└── workflow_stack.py      # Step Functions state machine
```

## Deployment

The infrastructure is deployed using:
```bash
export ENVIRONMENT_SUFFIX="your-suffix"
export AWS_REGION="ap-northeast-1"
npm run cdk:deploy
```

## Testing

- **Unit Tests**: 25+ tests covering all stack components with >90% code coverage
  - NetworkStack: 7 tests
  - TapStack: 3 tests
  - NotificationStack: 8 tests
  - WorkflowStack: 8 tests
- **Integration Tests**: 13 tests validating deployed AWS resources and their interconnections
  - VPC and networking
  - RDS, EFS, ElastiCache
  - ECS cluster and API Gateway
  - SNS topics
  - Step Functions state machine

## Resource Naming

All resources use the environment suffix for multi-environment support:
- VPC: `video-processing-vpc-{suffix}`
- RDS: `videometadata`
- ElastiCache: `video-cache-{suffix}`
- ECS Cluster: `video-processing-cluster-{suffix}`
- API: `video-metadata-api-{suffix}`

## Outputs

The deployment exports key resource identifiers:
- VPC ID and security group IDs
- Database endpoint and secret ARN
- Redis primary and reader endpoints
- ECS cluster name and ARN
- API Gateway endpoint URL and API key ID
- EFS file system ID
- SNS topic ARNs (completion and error)
- Step Functions state machine ARN and name
- ECS task definition ARN for video processing
