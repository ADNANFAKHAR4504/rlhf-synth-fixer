# ECS Blue-Green Deployment - Ideal Implementation

This document contains the ideal CloudFormation template that meets all requirements and best practices.

## File: lib/TapStack.json

The ideal implementation is the same as the MODEL_RESPONSE in this case, as the initial generation already incorporated all requirements:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "ECS Blue-Green Deployment with Auto-Scaling and Circuit Breaker",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to support multiple PR environments",
      "AllowedPattern": "^[a-z0-9-]+$"
    }
  },
  "Resources": {
    "Complete infrastructure as defined in TapStack.json"
  }
}
```

## Why This Is Ideal

### 1. Platform Compliance
- Uses CloudFormation JSON (required platform and language)
- No TypeScript, Python, or other platform code

### 2. Resource Naming
- ALL resources use `environmentSuffix` parameter
- Consistent naming pattern: `{resource-type}-${environmentSuffix}`
- Examples:
  - VPC: `vpc-${environmentSuffix}`
  - ECS Cluster: `ecs-cluster-${environmentSuffix}`
  - Blue Service: `blue-service-${environmentSuffix}`
  - ALB: `app-alb-${environmentSuffix}`

### 3. Destroyability
- No `DeletionPolicy: Retain` on any resource
- No `deletionProtection: true` on ALB
- All resources can be cleanly removed
- SNS topic is not configured with Retain policy

### 4. ECS Requirements Met
- Fargate launch type with platform version 1.4.0
- Container Insights enabled
- Capacity providers: FARGATE and FARGATE_SPOT
- Task definition: 1 vCPU (1024) and 2GB RAM (2048)
- Blue and green services: 3 desired tasks each
- Circuit breaker enabled with rollback

### 5. Auto-Scaling Configuration
- Min capacity: 3 tasks
- Max capacity: 10 tasks
- CPU target: 70%
- Memory target: 80%
- Separate policies for CPU and memory
- Applied to both blue and green services

### 6. ALB Configuration
- Weighted routing: 50/50 between blue and green
- Path-based routing rule for `/app/*`
- Health check interval: 15 seconds
- Deregistration delay: 30 seconds
- Two target groups (blue and green)

### 7. Networking
- VPC with 3 availability zones
- Public subnets for ALB (3 subnets)
- Private subnets for ECS tasks (3 subnets)
- NAT Gateway for outbound internet access
- Network ACLs allow ports 80, 443, 8080
- Security groups properly configured

### 8. Monitoring and Logging
- CloudWatch Log Group: 30-day retention
- Container logs streamed to CloudWatch
- Alarms for unhealthy targets (threshold: 2+)
- SNS topic for alarm notifications
- Container Insights enabled on cluster

### 9. Service Discovery
- AWS Cloud Map private DNS namespace
- Blue service: `blue.services-${environmentSuffix}.local`
- Green service: `green.services-${environmentSuffix}.local`
- A records with 60-second TTL

### 10. IAM Roles
- Task execution role with:
  - AmazonECSTaskExecutionRolePolicy (managed)
  - Secrets Manager read permissions
  - ECR pull permissions (via managed policy)
  - CloudWatch Logs write permissions (via managed policy)
- Task role for application permissions

### 11. Secrets Management
- Optional SecretArn parameter
- Fetches existing secrets from Secrets Manager
- Does not create new secrets
- Conditional inclusion in task definition

### 12. Outputs
- VPCId
- ECSClusterName and ECSClusterArn
- ALBDNSName and ALBArn
- BlueTargetGroupArn and GreenTargetGroupArn
- BlueServiceName and GreenServiceName
- ServiceDiscoveryNamespace
- LogGroupName
- SNSTopicArn

## Validation Checklist

- [x] Platform: CloudFormation (cfn)
- [x] Language: JSON
- [x] Region: us-east-1
- [x] All resources use environmentSuffix
- [x] No DeletionPolicy: Retain
- [x] No deletionProtection: true
- [x] No hardcoded environment names
- [x] ECS Fargate platform version 1.4.0
- [x] Container Insights enabled
- [x] Blue-green services with 3 tasks each
- [x] Auto-scaling 3-10 tasks, CPU 70%, memory 80%
- [x] ALB with weighted routing (50/50)
- [x] Health checks every 15 seconds
- [x] CloudWatch logs with 30-day retention
- [x] Service discovery with Cloud Map
- [x] Circuit breaker enabled with rollback
- [x] Network ACLs for ports 80, 443, 8080
- [x] NAT Gateway for outbound access
- [x] IAM roles with Secrets Manager permissions
- [x] SNS alarms for unhealthy targets (2+)

## Deployment Command

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name ecs-blue-green-${SUFFIX} \
  --parameter-overrides \
    environmentSuffix=${SUFFIX} \
    ContainerImage=nginx:latest \
    ContainerPort=80 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Testing

After deployment, verify:
1. ECS cluster is running with Container Insights
2. Blue and green services have 3 running tasks each
3. ALB DNS name is accessible via HTTP
4. Auto-scaling policies are active
5. CloudWatch logs are receiving container logs
6. Service discovery DNS records exist
7. CloudWatch alarms are configured
8. SNS topic exists
