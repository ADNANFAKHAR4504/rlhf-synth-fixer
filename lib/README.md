# Transaction Processing Infrastructure - CloudFormation Nested Stacks

This solution provides an optimized CloudFormation nested stack architecture for a transaction processing system spanning multiple AWS regions.

## Architecture

The infrastructure is split into 4 nested stacks:

1. **NetworkStack** - VPC, subnets, security groups, VPC endpoints
2. **DatabaseStack** - RDS Aurora MySQL cluster with proper deletion policies
3. **ComputeStack** - Lambda functions using ECR container images, SSM parameters
4. **MonitoringStack** - CloudWatch alarms and rollback triggers

## Key Features

- **Circular Dependency Resolution**: Lambda functions read RDS endpoint from SSM Parameter Store instead of direct references
- **Fast Deployments**: Nested stack architecture enables parallel deployment and faster updates
- **Container-based Lambda**: All Lambda functions use ECR container images for faster updates
- **Rollback Protection**: CloudWatch alarms trigger automatic rollback on failure
- **Multi-Region Ready**: Uses CloudFormation StackSets for consistent multi-region deployment
- **Proper Resource Naming**: All resources include environmentSuffix parameter for uniqueness

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. S3 bucket for storing nested stack templates
3. ECR repositories with Lambda container images built
4. Database credentials stored securely

## Deployment

### Step 1: Build and Push Lambda Container Images
