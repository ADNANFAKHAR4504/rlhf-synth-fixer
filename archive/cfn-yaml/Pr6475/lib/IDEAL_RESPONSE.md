# Multi-Environment Payment Processing Infrastructure - Implementation Guide

## Overview

This implementation provides a complete multi-environment AWS infrastructure using CloudFormation nested stacks for a payment processing system. The solution supports three environments (dev, staging, prod) with consistent configuration while allowing environment-specific sizing and policies.

## Architecture

The infrastructure consists of four CloudFormation templates organized as nested stacks:

### 1. Master Stack (master.yml)
The master stack orchestrates all nested stacks and manages the following:

**Key Features:**
- Environment-specific mappings for all configuration values
- Conditional logic based on environment type
- Parameter passing to nested stacks
- Cross-stack dependency management using DependsOn
- Centralized outputs with stack exports

**Environment Mappings:**
- **Dev**: Smaller resources (1 ECS task, 1 RDS instance, db.r5.large)
- **Staging**: Medium resources (2 ECS tasks, 2 RDS instances, db.r5.xlarge)
- **Prod**: Production-scale resources (5 ECS tasks, 3 RDS instances, db.r5.2xlarge)

**Parameters:**
- `EnvironmentType`: Controls environment-specific behavior (dev|staging|prod)
- `EnvironmentSuffix`: Unique identifier for resource naming
- `TemplateS3Bucket`: S3 bucket containing nested stack templates
- `TemplateS3Prefix`: S3 prefix for template organization

### 2. VPC Stack (vpc.yml)
Creates a multi-AZ VPC with complete networking infrastructure:

**Resources:**
- VPC with customizable CIDR block
- 3 public subnets (one per AZ) for ALB
- 3 private subnets (one per AZ) for ECS and RDS
- Internet Gateway for public internet access
- 3 NAT Gateways (one per AZ) for high availability
- 3 Elastic IPs for NAT Gateways
- Route tables and associations for both public and private subnets

**High Availability:**
- Each availability zone has its own NAT Gateway
- Failure of one NAT Gateway doesn't affect other AZs
- Resources distributed across 3 AZs for redundancy

### 3. Compute Stack (compute.yml)
Deploys ECS Fargate cluster with Application Load Balancer:

**Resources:**
- ECS Cluster with Container Insights enabled
- ECS Task Definition (Fargate compatible)
- ECS Service with configurable task count
- Application Load Balancer (internet-facing)
- Target Group with health checks
- Security Groups (ALB and ECS)
- IAM Roles (Task Execution and Task Role)
- CloudWatch Log Group for container logs
- CloudWatch Alarms for monitoring

**Security:**
- ALB Security Group: Allows HTTP/HTTPS from internet
- ECS Security Group: Only allows traffic from ALB
- ECS Task Role: Restricted by environment tag condition
- Tasks run in private subnets (no direct internet access)

### 4. Database Stack (database.yml)
Deploys RDS Aurora PostgreSQL with conditional deletion policies:

**Resources:**
- Aurora PostgreSQL 15.4 cluster
- 1-3 DB instances (based on environment)
- DB Subnet Group for private subnet placement
- DB Parameter Groups (cluster and instance level)
- KMS Key for encryption at rest
- Database Security Group
- Secrets Manager for password management
- CloudWatch Alarms for monitoring

**Conditional Deletion Policies:**
- **Production**: `DeletionPolicy: Retain` - Prevents accidental deletion
- **Staging**: `DeletionPolicy: Snapshot` - Creates final snapshot before deletion
- **Development**: `DeletionPolicy: Delete` - Clean removal for testing

## Key Features Implemented

### 1. Nested Stack Architecture
Master stack orchestrates VPC, Compute, and Database nested stacks with proper dependency management using DependsOn.

### 2. Environment-Specific Mappings
All configuration values defined in mappings: instance sizes, task counts, alarm thresholds, backup retention periods.

### 3. Conditional DeletionPolicy
Uses CloudFormation conditions to set appropriate deletion policies based on environment type.

### 4. Cross-Stack References with Exports
All critical outputs exported for use by other stacks or external resources.

### 5. Parameter Validation
AllowedValues constraints ensure only valid environment types can be specified.

### 6. Consistent Tagging Strategy
All resources tagged with Environment, CostCenter, Application, and ManagedBy tags.

### 7. CloudWatch Alarms
Environment-specific thresholds for ECS CPU/Memory, RDS CPU/Connections, ALB metrics.

### 8. Security Best Practices
- Encryption at rest with KMS
- Secrets in Secrets Manager
- Private subnets for compute and database
- Least privilege IAM roles
- Security groups with minimal access

## Deployment Instructions

### Prerequisites

1. Upload nested stack templates to S3:
   ```bash
   aws s3 cp lib/vpc.yml s3://cfn-templates-bucket/payment-processing/
   aws s3 cp lib/compute.yml s3://cfn-templates-bucket/payment-processing/
   aws s3 cp lib/database.yml s3://cfn-templates-bucket/payment-processing/
   ```

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/master.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=TemplateS3Bucket,ParameterValue=cfn-templates-bucket \
    ParameterKey=TemplateS3Prefix,ParameterValue=payment-processing \
  --capabilities CAPABILITY_NAMED_IAM
```

## Success Criteria

- All templates validate successfully
- Stack deploys to all three environments
- DeletionPolicy varies by environment
- CloudWatch alarms have environment-specific thresholds
- All resources have required tags
- Stack exports accessible
- Nested stack architecture with proper dependencies