```markdown
# ECS Fargate Batch Processing Infrastructure

This CloudFormation template deploys a complete containerized batch processing system using ECS Fargate for financial services risk calculations.

## Architecture Overview

The infrastructure includes:

- **ECS Cluster**: Fargate-based cluster with managed capacity providers
- **Three Task Definitions**:
  - Data Ingestion (1 vCPU, 2GB RAM)
  - Risk Calculation (2 vCPU, 4GB RAM)
  - Report Generation (0.5 vCPU, 1GB RAM)
- **ECR Repositories**: Container image storage with lifecycle policies (last 10 images) and vulnerability scanning
- **CloudWatch Logs**: KMS-encrypted log groups with 30-day retention
- **ECS Services**: Circuit breaker deployment with 120-second health check grace period
- **Auto-Scaling**: CPU-based scaling targeting 70% utilization with 5-minute cooldown
- **EventBridge**: S3-triggered task execution for data processing automation
- **CloudWatch Alarms**: Task failure monitoring (5% threshold over 10 minutes)

## Prerequisites

1. AWS Account with appropriate permissions
2. VPC with 3 private subnets across different availability zones
3. NAT Gateway or VPC endpoints for ECS and ECR access
4. Two S3 buckets (data input and output)
5. Container images built and ready for ECR

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Environment identifier | dev, staging, prod |
| VpcId | VPC ID for ECS tasks | vpc-12345678 |
| PrivateSubnet1 | First private subnet | subnet-11111111 |
| PrivateSubnet2 | Second private subnet | subnet-22222222 |
| PrivateSubnet3 | Third private subnet | subnet-33333333 |
| DataBucketName | S3 bucket for input data | my-data-bucket |
| OutputBucketName | S3 bucket for output data | my-output-bucket |

## Deployment Steps

### 1. Validate the Template

```bash
aws cloudformation validate-template \
