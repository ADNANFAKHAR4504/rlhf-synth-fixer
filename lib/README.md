# ECS Blue-Green Deployment Infrastructure

This CloudFormation template deploys a production-ready ECS cluster with blue-green deployment capabilities for a fintech microservices architecture.

## Architecture Overview

- **Platform**: AWS CloudFormation
- **Language**: JSON
- **Region**: us-east-1
- **Complexity**: Expert

## Infrastructure Components

### 1. Networking (VPC)
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- Internet Gateway for public internet access
- NAT Gateway for private subnet outbound traffic
- Network ACLs allowing ports 80, 443, 8080
- Security Groups for ALB and ECS tasks

### 2. ECS Cluster
- Container Insights enabled
- Capacity providers: FARGATE and FARGATE_SPOT
- Default capacity provider strategy with equal weight

### 3. ECS Services (Blue and Green)
- Two identical services for blue-green deployment
- 3 desired tasks per service
- Fargate launch type with platform version 1.4.0
- Private subnet deployment (no public IPs)
- Circuit breaker enabled with automatic rollback
- Service discovery via AWS Cloud Map

### 4. Task Definition
- 1 vCPU (1024 CPU units)
- 2GB RAM (2048 MB)
- awsvpc network mode
- awslogs driver with CloudWatch integration
- Optional Secrets Manager integration

### 5. Application Load Balancer
- Internet-facing ALB across 3 public subnets
- Two target groups (blue and green)
- Weighted routing: 50% to blue, 50% to green
- Path-based routing rule for `/app/*`
- Health checks every 15 seconds
- 30-second deregistration delay

### 6. Auto-Scaling
- Minimum tasks: 3
- Maximum tasks: 10
- CPU-based scaling: triggers at 70% utilization
- Memory-based scaling: triggers at 80% utilization
- Separate scaling policies for blue and green services
- 60-second cooldown periods

### 7. Monitoring and Alarms
- CloudWatch Log Group: `/ecs/app-${environmentSuffix}`
- 30-day log retention
- Unhealthy target alarms (threshold: 2+ unhealthy tasks)
- SNS topic for alarm notifications
- Container Insights metrics collection

### 8. Service Discovery
- AWS Cloud Map private DNS namespace: `services-${environmentSuffix}.local`
- Blue service: `blue.services-${environmentSuffix}.local`
- Green service: `green.services-${environmentSuffix}.local`
- A records with 60-second TTL

## Parameters

### Required
- **environmentSuffix** (String): Unique suffix for resource naming (e.g., "pr-123", "test-456")

### Optional
- **ContainerImage** (String): Docker image URI (default: nginx:latest)
- **ContainerPort** (Number): Container port (default: 80)
- **SecretArn** (String): ARN of secret in AWS Secrets Manager (optional)

## Deployment

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. IAM permissions for CloudFormation, ECS, EC2, ALB, IAM, CloudWatch, SNS
3. Optional: Existing secret in AWS Secrets Manager

### Deploy Stack

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name ecs-blue-green-pr-123 \
  --parameter-overrides \
    environmentSuffix=pr-123 \
    ContainerImage=account.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0.0 \
    ContainerPort=8080 \
    SecretArn=arn:aws:secretsmanager:us-east-1:123456789012:secret:myapp-secret-xyz123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Update Stack

To perform a blue-green deployment update:

```bash
aws cloudformation update-stack \
  --stack-name ecs-blue-green-pr-123 \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=pr-123 \
    ParameterKey=ContainerImage,ParameterValue=account.dkr.ecr.us-east-1.amazonaws.com/myapp:v2.0.0 \
  --capabilities CAPABILITY_NAMED_IAM
```

The circuit breaker will automatically roll back if the deployment fails.

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name ecs-blue-green-pr-123 \
  --region us-east-1
```

All resources will be cleanly removed (no DeletionPolicy: Retain).

## Stack Outputs

After deployment, the stack provides these outputs:

- **VPCId**: VPC identifier
- **ECSClusterName**: ECS cluster name
- **ECSClusterArn**: ECS cluster ARN
- **ALBDNSName**: Load balancer DNS name (for HTTP access)
- **ALBArn**: Load balancer ARN
- **BlueTargetGroupArn**: Blue target group ARN
- **GreenTargetGroupArn**: Green target group ARN
- **BlueServiceName**: Blue ECS service name
- **GreenServiceName**: Green ECS service name
- **ServiceDiscoveryNamespace**: Cloud Map namespace ID
- **LogGroupName**: CloudWatch log group name
- **SNSTopicArn**: SNS topic ARN for alarms

### Retrieve Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name ecs-blue-green-pr-123 \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Access Application

After deployment, access your application via the ALB DNS name:

```bash
# Get ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name ecs-blue-green-pr-123 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

# Test application
curl http://${ALB_DNS}/
curl http://${ALB_DNS}/app/health
```

## Monitoring

### View Logs

```bash
aws logs tail /ecs/app-pr-123 --follow
```

### Check Service Health

```bash
aws ecs describe-services \
  --cluster ecs-cluster-pr-123 \
  --services blue-service-pr-123 green-service-pr-123 \
  --query 'services[*].[serviceName,desiredCount,runningCount,status]' \
  --output table
```

### View CloudWatch Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "blue-unhealthy-targets-pr-123"
```

## Blue-Green Deployment Strategy

### Manual Traffic Shifting

To shift traffic between blue and green services, update the ALB listener rules:

```bash
# Shift 100% traffic to green
aws elbv2 modify-listener \
  --listener-arn <LISTENER_ARN> \
  --default-actions Type=forward,ForwardConfig='{TargetGroups=[{TargetGroupArn=<GREEN_TG_ARN>,Weight=100},{TargetGroupArn=<BLUE_TG_ARN>,Weight=0}]}'
```

### Automatic Rollback

The circuit breaker is configured with:
- **Threshold**: 50% failures trigger rollback
- **Evaluation Period**: 10 minutes
- **Automatic Rollback**: Enabled

If deployment fails, ECS automatically reverts to the previous task definition.

## Cost Considerations

### Estimated Monthly Cost (3 tasks)
- **Fargate tasks**: ~$50-75 (3 x 1vCPU, 2GB RAM)
- **NAT Gateway**: ~$32 (per month)
- **ALB**: ~$16-20 (per month)
- **CloudWatch Logs**: ~$0.50-2 (depending on volume)
- **Data Transfer**: Variable

**Total**: ~$100-130/month for minimal traffic

### Cost Optimization
- Use Fargate Spot for non-production (up to 70% savings)
- Delete NAT Gateway when not needed (recreate for testing)
- Adjust log retention to 7 days for non-production
- Scale down to 1 task per service for development

## Troubleshooting

### Tasks Not Starting

Check task execution role permissions:
```bash
aws ecs describe-tasks \
  --cluster ecs-cluster-pr-123 \
  --tasks <TASK_ARN> \
  --query 'tasks[0].stoppedReason'
```

### ALB Health Checks Failing

Verify security group and target group configuration:
```bash
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>
```

### High Memory Usage

Scale up task resources or increase auto-scaling limits:
```bash
aws ecs update-service \
  --cluster ecs-cluster-pr-123 \
  --service blue-service-pr-123 \
  --desired-count 5
```

## Security

### IAM Roles
- **Task Execution Role**: Minimal permissions for ECR, CloudWatch, Secrets Manager
- **Task Role**: Application-specific permissions (customize as needed)

### Network Security
- ECS tasks in private subnets (no public IPs)
- Security groups restrict traffic to ALB only
- NACLs limit inbound ports to 80, 443, 8080

### Secrets Management
- Secrets fetched from AWS Secrets Manager at runtime
- No secrets stored in task definitions or environment variables
- Use `SecretArn` parameter to reference existing secrets

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

Tests validate:
- Stack deployment succeeds
- All resources are created
- ECS services are running
- ALB is accessible
- Auto-scaling is configured
- CloudWatch logs are receiving data

## File Structure

```
lib/
├── TapStack.json           # CloudFormation template
├── PROMPT.md              # Original task requirements
├── MODEL_RESPONSE.md      # Initial generated solution
├── IDEAL_RESPONSE.md      # Corrected/ideal implementation
├── MODEL_FAILURES.md      # Documentation of fixes
└── README.md              # This file

test/
├── tap-stack.unit.test.ts    # Unit tests
└── tap-stack.int.test.ts     # Integration tests
```

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Fargate Platform Versions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform_versions.html)
- [Blue/Green Deployments with ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)
- [Circuit Breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html)

## Support

For issues or questions:
1. Check CloudFormation stack events for errors
2. Review ECS service events for task failures
3. Check CloudWatch logs for application errors
4. Verify IAM role permissions
5. Ensure secrets exist in Secrets Manager (if using)
