# CloudFormation Solution for Loan Processing Application

This CloudFormation template deploys a complete loan processing application infrastructure with ECS Fargate, Aurora PostgreSQL Serverless v2, Application Load Balancer, and S3 document storage.

## Architecture Overview

- VPC with public/private subnets across 3 availability zones
- ECS Fargate cluster with auto-scaling based on ALB request count
- Aurora PostgreSQL Serverless v2 (0.5-4 ACUs) with customer-managed KMS encryption
- Application Load Balancer with HTTPS listener
- S3 bucket for document storage with versioning and lifecycle policies
- CloudWatch Log Groups with 365-day retention for compliance

## Files

The complete CloudFormation template has been generated in `lib/cfn-template.json`. This file contains all infrastructure resources defined in JSON format as required.

### File: lib/cfn-template.json

See `lib/cfn-template.json` for the complete CloudFormation JSON template (60+ resources, 2000+ lines).

### Template Structure

The CloudFormation template includes:

**Parameters** (8 configurable values):
- EnvironmentSuffix: Unique suffix for resource naming
- ContainerImage: Docker image URI for the application
- CertificateArn: ACM certificate for HTTPS (optional)
- DBMasterUsername: Aurora PostgreSQL master username
- DBMasterPassword: Aurora PostgreSQL master password
- DesiredTaskCount: Initial number of ECS tasks (default: 2)
- MinTaskCount: Minimum tasks for auto-scaling (default: 2)
- MaxTaskCount: Maximum tasks for auto-scaling (default: 10)

**Resources** (60+ AWS resources):

1. **Networking** (22 resources):
   - VPC with 10.0.0.0/16 CIDR
   - 3 Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - 3 Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
   - Internet Gateway
   - 3 NAT Gateways with Elastic IPs
   - Route tables and associations

2. **Security** (4 resources):
   - ALB Security Group (allows HTTP/HTTPS from internet)
   - ECS Task Security Group (allows traffic from ALB)
   - RDS Security Group (allows PostgreSQL from ECS tasks)
   - KMS Key for Aurora backup encryption with proper key policy

3. **Database** (4 resources):
   - Aurora PostgreSQL Serverless v2 cluster
   - DB Subnet Group spanning 3 private subnets
   - 2 Aurora instances for Multi-AZ configuration
   - KMS Key Alias

4. **Storage** (1 resource):
   - S3 bucket with encryption, versioning, lifecycle policies

5. **Container Platform** (7 resources):
   - ECS Fargate cluster
   - Task definition with 512 CPU / 1024 MB memory
   - ECS service with load balancer integration
   - Task execution IAM role
   - Task IAM role with S3 access
   - CloudWatch Log Group with 365-day retention
   - Auto-scaling configuration

6. **Load Balancing** (4 resources):
   - Application Load Balancer (internet-facing)
   - Target group with health checks
   - HTTP listener (port 80)
   - HTTPS listener (port 443, conditional)

7. **Auto-scaling** (2 resources):
   - Application Auto Scaling target
   - Target tracking policy based on ALB RequestCountPerTarget

**Outputs** (10 values):
- VPC ID, Public/Private subnet IDs
- ECS cluster and service names
- Aurora cluster endpoints (read/write)
- S3 bucket name
- ALB DNS name and URL
- CloudWatch Log Group name

### Key Features Implemented

1. **High Availability**: Resources across 3 AZs, Aurora Multi-AZ
2. **Security**: Private subnets, KMS encryption, least-privilege IAM
3. **Compliance**: 365-day log retention, encrypted backups
4. **Auto-scaling**: Custom metric-based (ALB RequestCountPerTarget)
5. **Cost Optimization**: Serverless Aurora, S3 lifecycle policies
6. **Resource Naming**: All resources include EnvironmentSuffix
7. **Destroyability**: No Retain policies, all resources cleanable

### Deployment Instructions

Deploy to **us-east-2** region:

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-dev \
  --template-body file://lib/cfn-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=ContainerImage,ParameterValue=your-image:latest \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

Monitor deployment:

```bash
aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus'
```

### Architecture

```
Internet --> ALB (Public) --> ECS Fargate (Private) --> Aurora Serverless v2 (Private)
                                                     --> S3 (Documents)
                                                     --> CloudWatch Logs

NAT Gateways (3 AZs) --> Internet (outbound only)
KMS Key --> Aurora Backup Encryption
```

### Compliance Features

- 365-day log retention (CloudWatch)
- Customer-managed KMS encryption (Aurora backups)
- S3 versioning (audit trail)
- Network isolation (private subnets)
- Least-privilege IAM

### Cleanup

```bash
# Empty S3 bucket first
aws s3 rm s3://loan-documents-dev-ACCOUNT_ID --recursive --region us-east-2

# Delete stack
aws cloudformation delete-stack --stack-name loan-processing-dev --region us-east-2
```
