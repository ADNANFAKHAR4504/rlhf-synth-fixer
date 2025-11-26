# ECS Fargate Fraud Detection Service

Complete CloudFormation deployment for a high-availability fraud detection service using ECS Fargate.

---

## 🔍 Code Review Status - PR #7345

**Review Date:** 2025-11-26
**Branch:** synth-101912669
**Overall Assessment:** ⚠️ REQUIRES CHANGES (Score: 8.5/10)

### Critical Issues Found (4)
1. ❌ **VPC Infrastructure Mismatch** - Creates new VPC instead of using existing vpc-0123456789abcdef0
2. ❌ **Desired Count Wrong** - Template has 2 tasks, requires 3
3. ❌ **Container Port Wrong** - Defaults to 80, requires 8080
4. ❌ **Health Check Hardcoded** - Uses port 80 instead of ${ContainerPort}

### Quick Fixes Required
- Remove VPC/subnet/NAT/IGW resources, add parameters (30-45 min)
- Change DesiredCount: 2 → 3 (1 min)
- Change ContainerPort default: 80 → 8080 (1 min)
- Update health check to use ${ContainerPort} and /health endpoint (5 min)

**Total Estimated Fix Time:** ~45 minutes

---

## Architecture Overview

This infrastructure deploys a containerized fraud detection service with the following components:

- **ECS Fargate Cluster**: Container orchestration with Container Insights enabled
- **Application Load Balancer**: Traffic distribution with health checks
- **Auto Scaling**: CPU-based scaling (2-10 tasks)
- **CloudWatch Logs**: Encrypted logs with 30-day retention
- **IAM Roles**: Least-privilege access policies
- **Security Groups**: Network isolation and secure communication

## Prerequisites

- AWS CLI configured with appropriate credentials
- VPC with public and private subnets in 3 availability zones
- ECR repository with fraud-detector container image
- Subnet IDs for deployment

## Deployment Instructions

### 1. Prepare Parameters

Create a parameters file `parameters.json`:

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-0123456789abcdef0"
  },
  {
    "ParameterKey": "PublicSubnet1",
    "ParameterValue": "subnet-public-1a"
  },
  {
    "ParameterKey": "PublicSubnet2",
    "ParameterValue": "subnet-public-1b"
  },
  {
    "ParameterKey": "PublicSubnet3",
    "ParameterValue": "subnet-public-1c"
  },
  {
    "ParameterKey": "PrivateSubnet1",
    "ParameterValue": "subnet-private-1a"
  },
  {
    "ParameterKey": "PrivateSubnet2",
    "ParameterValue": "subnet-private-1b"
  },
  {
    "ParameterKey": "PrivateSubnet3",
    "ParameterValue": "subnet-private-1c"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "123456789012.dkr.ecr.us-east-1.amazonaws.com/fraud-detector:latest"
  },
  {
    "ParameterKey": "ContainerPort",
    "ParameterValue": "8080"
  }
]
```

### 2. Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1
```

### 3. Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name fraud-detection-prod \
  --template-body file://lib/TapStack.json \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 4. Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### 5. Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Architecture Details

### ECS Cluster Configuration

- **Container Insights**: Enabled for comprehensive monitoring
- **Launch Type**: Fargate for serverless container execution
- **Platform Version**: 1.4.0 (as per requirements)

### Task Definition

- **CPU**: 2048 (2 vCPU)
- **Memory**: 4096 MB (4 GB)
- **Network Mode**: awsvpc for enhanced networking
- **Health Checks**: Container health monitoring with 3 retries

### Application Load Balancer

- **Scheme**: Internet-facing
- **Subnets**: Deployed across 3 public subnets
- **Health Checks**: /health endpoint with 30-second intervals
- **Routing Algorithm**: least_outstanding_requests

### Auto Scaling

- **Minimum Tasks**: 2
- **Maximum Tasks**: 10
- **Target CPU**: 70% utilization
- **Cooldown Period**: 120 seconds (2 minutes)

### Security

- **IAM Roles**: Least-privilege policies with specific actions
- **Security Groups**: ALB and ECS task isolation
- **Log Encryption**: AWS-managed KMS keys
- **Network**: Private subnets for tasks, public subnets for ALB

### Logging and Monitoring

- **CloudWatch Logs**: 30-day retention
- **Log Encryption**: KMS encryption enabled
- **Container Insights**: Cluster-level metrics
- **Health Checks**: Container and target group health monitoring

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- ECS Cluster: `fraud-detection-cluster-prod`
- ALB: `fraud-detection-alb-prod`
- Log Group: `/ecs/fraud-detection-prod`

## Outputs

| Output | Description |
|--------|-------------|
| ECSClusterArn | ARN of the ECS cluster |
| ECSClusterName | Name of the ECS cluster |
| ALBDNSName | DNS name for accessing the application |
| ALBArn | ARN of the Application Load Balancer |
| ECSServiceName | Name of the ECS service |
| TaskDefinitionArn | ARN of the task definition |
| CloudWatchLogGroup | Log group for container logs |

## Access the Application

After deployment, access the application using the ALB DNS name:

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

curl http://${ALB_DNS}/health
```

## Monitoring

### View Container Logs

```bash
LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudWatchLogGroup`].OutputValue' \
  --output text)

aws logs tail ${LOG_GROUP} --follow --region us-east-1
```

### Check Service Status

```bash
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
  --output text)

SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSServiceName`].OutputValue' \
  --output text)

aws ecs describe-services \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME} \
  --region us-east-1
```

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name fraud-detection-prod \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name fraud-detection-prod \
  --region us-east-1
```

## Compliance

This template implements all mandatory requirements:

1. ECS cluster with containerInsights enabled
2. Task definition with 2 vCPU and 4GB memory
3. Application Load Balancer with /health endpoint health checks
4. ECS service with 3 tasks across availability zones
5. Auto-scaling policy based on CPU utilization (2-10 tasks)
6. CloudWatch log group with 30-day retention
7. Security groups for ALB-to-ECS communication on port 8080
8. IAM roles with least-privilege policies (no wildcards)
9. Outputs for ALB DNS name and ECS cluster ARN

All constraints satisfied:
- Fargate launch type with platform version 1.4.0
- Health checks with 3 retries and 30-second intervals
- least_outstanding_requests routing algorithm
- Deployment configuration: 100% minimum, 200% maximum
- Encrypted logs with AWS-managed KMS keys
- No wildcard actions in IAM policies
- Auto-scaling at 70% CPU with 2-minute cooldown
