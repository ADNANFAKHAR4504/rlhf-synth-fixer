# ECS Fargate Order Processing System - CDK TypeScript Implementation

## Overview

This CDK application deploys a complete containerized order processing system on AWS ECS Fargate with comprehensive monitoring and alerting capabilities. The system handles both REST API requests and asynchronous message processing with automatic scaling based on queue depth.

## Architecture

### Core Components

1. **Networking**: VPC with public and private subnets across 2 availability zones
2. **Container Registry**: Private ECR repositories for API and Worker service images
3. **ECS Cluster**: Fargate cluster with capacity providers
4. **Services**:
   - API Service (2 tasks) for REST endpoints
   - Worker Service (1-10 tasks) for queue processing with auto-scaling
5. **Load Balancing**: Application Load Balancer with path-based routing (/api/*)
6. **Message Queue**: SQS with main queue and dead letter queue (4-day retention)
7. **Service Discovery**: Cloud Map namespace for inter-service communication
8. **Logging**: CloudWatch Log Groups with 7-day retention
9. **Monitoring**: 8 CloudWatch alarms for critical metrics
10. **Alerting**: SNS topic for centralized notifications

### Monitoring Features (Iteration 1 Enhancement)

#### CloudWatch Alarms (8 Total)
1. **ALB Target Unhealthy**: Alerts when targets become unhealthy (threshold: 1)
2. **API Service CPU High**: Alerts at 80% CPU utilization
3. **API Service Memory High**: Alerts at 80% memory utilization
4. **API Service No Tasks**: Alerts when no tasks running
5. **Worker Service CPU High**: Alerts at 80% CPU utilization
6. **Worker Service Memory High**: Alerts at 80% memory utilization
7. **Worker Service No Tasks**: Alerts when no tasks running
8. **DLQ Messages**: Alerts when messages enter dead letter queue (threshold: 1)

#### SNS Topic
- Name: `order-processing-alerts-{environmentSuffix}`
- All alarms publish to this topic
- Supports email subscriptions for operations team
- Topic ARN exported as stack output

## Prerequisites

- AWS CDK installed (`npm install -g aws-cdk`)
- Node.js 18+ and npm
- AWS credentials configured
- Docker (for building container images)

## Deployment

### 1. Install Dependencies

```bash
npm ci
```

### 2. Configure Environment

```bash
export CDK_DEFAULT_ACCOUNT=<your-aws-account-id>
export CDK_DEFAULT_REGION=ap-southeast-1
export ENVIRONMENT_SUFFIX=<unique-suffix>
```

### 3. Build the Application

```bash
npm run build
```

### 4. Synthesize CloudFormation Template

```bash
npm run synth
```

### 5. Deploy the Stack

```bash
cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

### 6. Subscribe to Alerts

After deployment, subscribe email addresses to the SNS topic:

```bash
aws sns subscribe \
  --topic-arn <SNS-TOPIC-ARN> \
  --protocol email \
  --notification-endpoint ops-team@example.com \
  --region ap-southeast-1
```

## Post-Deployment Configuration

### 1. Build and Push Container Images

Build your application containers and push to ECR:

```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com

# Build and push API service
docker build -t api-service:latest ./api
docker tag api-service:latest <api-repo-uri>:latest
docker push <api-repo-uri>:latest

# Build and push Worker service
docker build -t worker-service:latest ./worker
docker tag worker-service:latest <worker-repo-uri>:latest
docker push <worker-repo-uri>:latest
```

### 2. Create Parameter Store Secrets

Create application configuration parameters:

```bash
aws ssm put-parameter \
  --name /app/config/database-url \
  --value "your-database-url" \
  --type SecureString \
  --region ap-southeast-1

aws ssm put-parameter \
  --name /app/config/api-key \
  --value "your-api-key" \
  --type SecureString \
  --region ap-southeast-1
```

### 3. Update ECS Services

Force new deployment to use latest container images:

```bash
aws ecs update-service \
  --cluster order-cluster-$ENVIRONMENT_SUFFIX \
  --service api-service-$ENVIRONMENT_SUFFIX \
  --force-new-deployment \
  --region ap-southeast-1

aws ecs update-service \
  --cluster order-cluster-$ENVIRONMENT_SUFFIX \
  --service worker-service-$ENVIRONMENT_SUFFIX \
  --force-new-deployment \
  --region ap-southeast-1
```

## Stack Outputs

After deployment, the following outputs are available:

- **ALBDnsName**: Load balancer DNS name for API access
- **OrderQueueUrl**: SQS queue URL for order processing
- **OrderDLQUrl**: Dead letter queue URL for failed messages
- **SNSTopicArn**: SNS topic ARN for alert subscriptions
- **ServiceDiscoveryNamespace**: Cloud Map namespace for service mesh
- **ApiRepositoryUri**: ECR repository URI for API service
- **WorkerRepositoryUri**: ECR repository URI for Worker service

## Auto-scaling Behavior

The Worker service automatically scales based on SQS queue depth:

- **Scale Up**: When queue has 10+ messages
- **Scale Down**: When queue has 2 or fewer messages
- **Min Capacity**: 1 task
- **Max Capacity**: 10 tasks

## Monitoring Dashboard

Access CloudWatch console to view:

1. **ECS Metrics**: CPU, memory, running task count
2. **ALB Metrics**: Target health, request count, latency
3. **SQS Metrics**: Message counts, queue depth
4. **Alarm Status**: Current alarm states

## Testing

### Unit Tests

Run comprehensive unit tests:

```bash
npm test
```

Coverage: 100% (statements, branches, functions, lines)

### Integration Tests

Integration tests verify end-to-end infrastructure:

```bash
npm test test/tap-stack.int.test.ts
```

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

**Note**: ECR repositories are configured to empty on delete automatically.

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- VPC: `order-vpc-dev`
- ECS Cluster: `order-cluster-dev`
- SQS Queue: `order-queue-dev`
- ALB: `order-alb-dev`
- SNS Topic: `order-processing-alerts-dev`

## Security Considerations

- All containers run in private subnets
- Container images pulled from private ECR only
- Secrets managed via AWS Systems Manager Parameter Store
- IAM roles follow least-privilege principle
- Task execution role limited to CloudWatch and ECR access
- Task role limited to Parameter Store path `/app/config/*`

## Cost Optimization

- Fargate Spot not used (prioritize reliability)
- Single NAT Gateway (acceptable for dev/test)
- 7-day log retention (configurable)
- Auto-scaling prevents over-provisioning
- No reserved capacity (pay-as-you-go)

## Troubleshooting

### Services Not Starting

Check CloudWatch Logs:
```bash
aws logs tail /ecs/api-service-$ENVIRONMENT_SUFFIX --follow
aws logs tail /ecs/worker-service-$ENVIRONMENT_SUFFIX --follow
```

### High CPU/Memory Alerts

1. Check CloudWatch metrics for specific service
2. Review application logs for errors
3. Consider increasing task resources or count

### DLQ Messages Alert

1. Inspect DLQ messages:
   ```bash
   aws sqs receive-message --queue-url <DLQ-URL>
   ```
2. Review worker service logs
3. Fix application bugs causing failures
4. Redrive messages after fix

## Support

For issues or questions:
1. Review CloudWatch Logs and alarms
2. Check AWS CloudFormation events
3. Verify IAM permissions
4. Ensure container images are accessible

## Version History

- **v1.0**: Initial deployment with core ECS infrastructure
- **v1.1**: Added comprehensive monitoring and SNS alerting (Iteration 1)
