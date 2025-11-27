# ECS Fargate Fraud Detection Service

Complete CloudFormation deployment for a high-availability fraud detection service using ECS Fargate.

## Architecture Overview

This infrastructure deploys a containerized fraud detection service with the following components:

- **VPC Infrastructure**: Complete networking with public and private subnets across 3 AZs
- **ECS Fargate Cluster**: Container orchestration with Container Insights enabled
- **Application Load Balancer**: Traffic distribution with health checks
- **Auto Scaling**: CPU-based scaling (2-10 tasks)
- **CloudWatch Logs**: Encrypted logs with 30-day retention
- **IAM Roles**: Least-privilege access policies
- **Security Groups**: Network isolation and secure communication

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, ECS, ALB, IAM resources

## Deployment Instructions

### 1. Prepare Parameters (Optional)

Create a parameters file `parameters.json` to customize the deployment:

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "public.ecr.aws/nginx/nginx:1.27-alpine"
  },
  {
    "ParameterKey": "ContainerPort",
    "ParameterValue": "80"
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

Or deploy with default parameters:

```bash
aws cloudformation create-stack \
  --stack-name fraud-detection-dev \
  --template-body file://lib/TapStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 4. Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### 5. Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Architecture Details

### VPC Configuration

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (across 3 AZs)
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 (across 3 AZs)
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: For private subnet outbound access

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
- **Health Checks**: Root path (/) with 30-second intervals
- **Routing Algorithm**: least_outstanding_requests

### Auto Scaling

- **Minimum Tasks**: 2
- **Maximum Tasks**: 10
- **Target CPU**: 70% utilization
- **Cooldown Period**: 120 seconds (2 minutes)

### Security

- **IAM Roles**: Least-privilege policies with specific actions
- **Security Groups**: ALB and ECS task isolation
- **Log Encryption**: Customer-managed KMS key
- **Network**: Private subnets for tasks, public subnets for ALB

### Logging and Monitoring

- **CloudWatch Logs**: 30-day retention
- **Log Encryption**: KMS encryption enabled
- **Container Insights**: Cluster-level metrics
- **Health Checks**: Container and target group health monitoring

## Resource Naming Convention

All resources follow the pattern: `fraud-detection-{resource-type}-${EnvironmentSuffix}`

Examples:
- VPC: `fraud-detection-vpc-dev`
- ECS Cluster: `fraud-detection-cluster-dev`
- ALB: `fraud-detection-alb-dev`
- Log Group: `/ecs/fraud-detection-dev`

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| EnvironmentSuffix | String | dev | Environment suffix for resource naming |
| ContainerImage | String | public.ecr.aws/nginx/nginx:1.27-alpine | Container image URI |
| ContainerPort | Number | 80 | Container port for application traffic |

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
| EnvironmentSuffix | Environment suffix used for deployment |

## Access the Application

After deployment, access the application using the ALB DNS name:

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

curl http://${ALB_DNS}/
```

## Monitoring

### View Container Logs

```bash
LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudWatchLogGroup`].OutputValue' \
  --output text)

aws logs tail ${LOG_GROUP} --follow --region us-east-1
```

### Check Service Status

```bash
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
  --output text)

SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-dev \
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
  --stack-name fraud-detection-dev \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name fraud-detection-dev \
  --region us-east-1
```

## Compliance

This template implements all mandatory requirements:

1. Complete VPC infrastructure with public and private subnets
2. ECS cluster with containerInsights enabled
3. Task definition with 2 vCPU and 4GB memory
4. Application Load Balancer with health checks on root path
5. ECS service with 2 tasks across availability zones
6. Auto-scaling policy based on CPU utilization (2-10 tasks)
7. CloudWatch log group with 30-day retention and KMS encryption
8. Security groups for ALB-to-ECS communication
9. IAM roles with least-privilege policies
10. All required outputs exported

All constraints satisfied:
- Fargate launch type with platform version 1.4.0
- Health checks with 3 retries and 30-second intervals
- least_outstanding_requests routing algorithm
- Deployment configuration: 100% minimum, 200% maximum
- Encrypted logs with customer-managed KMS key
- No wildcard actions in IAM policies (except ecr:GetAuthorizationToken)
- Auto-scaling at 70% CPU with 2-minute cooldown
- All resources use DeletionPolicy: Delete
