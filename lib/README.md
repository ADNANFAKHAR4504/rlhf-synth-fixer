# Multi-Environment CloudFormation Infrastructure

This directory contains the CloudFormation template for deploying a complete multi-environment application infrastructure with VPC, ECS Fargate, ALB, and DynamoDB.

## Architecture Overview

- **VPC**: Environment-specific CIDR blocks (dev: 10.0.0.0/16, staging: 10.1.0.0/16, prod: 10.2.0.0/16)
- **Public Subnets**: ALB deployment across 2 AZs
- **Private Subnets**: ECS Fargate tasks with NAT Gateway egress
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: Distributes traffic across ECS tasks
- **DynamoDB On-Demand**: Fast deployment, no RDS provisioning delay
- **CloudWatch**: Comprehensive monitoring and alarms
- **Systems Manager**: Environment-specific parameter storage

## Prerequisites

- AWS CLI v2 or later
- jq (for JSON processing)
- Appropriate IAM permissions for CloudFormation, ECS, DynamoDB, etc.

## Deployment

### Deploy Development Environment

```bash
./deploy.sh myapp-dev dev
```

### Deploy Staging Environment

```bash
./deploy.sh myapp-staging staging
```

### Deploy Production Environment

```bash
./deploy.sh myapp-prod prod
```

## Template Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnvironmentName | dev | Environment: dev, staging, or prod |
| EnvironmentSuffix | dev-suffix | Unique suffix for resource naming |
| ApplicationName | myapp | Application name for resource naming |
| ContainerImage | nginx:latest | Docker image URI |
| ContainerPort | 80 | Container port |
| DesiredCount | 2 | Initial number of ECS tasks |

## Stack Outputs

- **VPCId**: VPC identifier
- **LoadBalancerDNS**: ALB endpoint
- **ECSClusterName**: ECS cluster name
- **ECSServiceName**: ECS service name
- **DynamoDBTableName**: DynamoDB table name
- **DynamoDBStreamArn**: Stream ARN for event processing
- **CloudWatchLogGroupName**: Log group name
- **SNSTopicArn**: SNS topic for alarms

## Cleanup

To delete the stack and remove all resources:

```bash
aws cloudformation delete-stack \
  --stack-name myapp-dev \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name myapp-dev \
  --region us-east-1
```

## Environment-Specific Configuration

Configuration differences by environment:

- **Dev**: 1-4 tasks, 256 CPU, 512 MB memory, 7-day log retention
- **Staging**: 2-8 tasks, 512 CPU, 1024 MB memory, 7-day log retention
- **Production**: 3-12 tasks, 1024 CPU, 2048 MB memory, 30-day log retention

## Monitoring

Access CloudWatch Dashboard:

1. Console → CloudWatch → Dashboards
2. Select dashboard named `dashboard-{EnvironmentSuffix}`

Alarms are configured for:
- ALB target health
- ECS CPU utilization
- DynamoDB throttling

## Best Practices

1. **Resource Naming**: All resources include environmentSuffix for uniqueness
2. **Destroyability**: No Retain policies; clean deletion with delete-stack
3. **Security**: Private subnets for compute, IAM roles properly scoped
4. **Monitoring**: Alarms integrated with SNS for notifications
5. **Cost Optimization**: DynamoDB On-Demand for flexible billing
