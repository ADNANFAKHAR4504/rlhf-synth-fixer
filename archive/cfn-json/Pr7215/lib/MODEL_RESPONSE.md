# CloudFormation Multi-Environment Infrastructure Solution

This document provides the complete CloudFormation JSON implementation for deploying consistent infrastructure across dev, staging, and production environments.

## Solution Overview

The architecture implements a master template with five nested stacks:

1. **VPC Stack** (`vpc-nested-stack.json`) - Network infrastructure with conditional NAT Gateway
2. **RDS Stack** (`rds-nested-stack.json`) - Aurora PostgreSQL cluster with encryption and backups
3. **Lambda Stack** (`lambda-nested-stack.json`) - Data processing functions with environment-specific memory
4. **S3 Stack** (`s3-nested-stack.json`) - Storage buckets with cross-region replication
5. **Monitoring Stack** (`monitoring-nested-stack.json`) - CloudWatch Alarms and SNS notifications

All templates use CloudFormation JSON format with parameter mappings, conditions, and comprehensive outputs for cross-stack references.

## Architecture Features

### Master Template (`master-template.json`)

The master template orchestrates all nested stacks and provides:
- Environment-specific parameter mappings for instance sizes and configurations
- Conditional logic for NAT Gateway creation (only staging and prod)
- Cross-stack references using Fn::GetAtt and stack outputs
- Comprehensive tagging strategy (Environment, Project, CostCenter)
- Stack dependency management with DependsOn attributes

**Key Mappings:**
- Dev: t3.micro instances, 256MB Lambda, db.t3.medium RDS, 10.0.0.0/16 VPC, no NAT Gateway
- Staging: t3.small instances, 256MB Lambda, db.r5.large RDS, 10.1.0.0/16 VPC, with NAT Gateway
- Prod: t3.medium instances, 512MB Lambda, db.r5.xlarge RDS, 10.2.0.0/16 VPC, with NAT Gateway

### VPC Nested Stack (`vpc-nested-stack.json`)

Provides complete network infrastructure:
- VPC with user-specified CIDR block (non-overlapping across environments)
- 2 public subnets across 2 availability zones with Internet Gateway
- 2 private subnets across 2 availability zones for database and Lambda
- Conditional NAT Gateway for private subnet internet access (staging/prod only)
- Security groups for database (PostgreSQL port 5432) and Lambda
- Route tables configured for public and private traffic patterns

**environmentSuffix Integration:**
All resources include the environmentSuffix parameter in naming:
- `vpc-{Environment}-{EnvironmentSuffix}`
- `public-subnet-1-{Environment}-{EnvironmentSuffix}`
- `database-sg-{Environment}-{EnvironmentSuffix}`

### Database Nested Stack (`rds-nested-stack.json`)

Implements production-grade RDS Aurora PostgreSQL:
- Aurora PostgreSQL 15.4 cluster with 2 instances for high availability
- Encryption at rest enabled using AWS managed keys
- Automated backups with 7-day retention period
- Performance Insights enabled with 7-day retention
- DB subnet group spanning private subnets across availability zones
- Secrets Manager integration for secure password management
- CloudWatch Logs export for PostgreSQL logs
- DeletionPolicy: Delete for clean teardown

**environmentSuffix Integration:**
- `aurora-cluster-{Environment}-{EnvironmentSuffix}`
- `db-subnet-group-{Environment}-{EnvironmentSuffix}`
- `rds-master-password-{Environment}-{EnvironmentSuffix}` (Secrets Manager)

### Compute Nested Stack (`lambda-nested-stack.json`)

Deploys Lambda functions with VPC integration:
- Python 3.11 runtime with inline sample code
- Environment-specific memory allocation (256MB dev/staging, 512MB prod)
- VPC configuration with private subnet placement
- IAM execution role with VPC, S3, and Secrets Manager permissions
- Environment variables for configuration (ENVIRONMENT, ENVIRONMENT_SUFFIX, LOG_LEVEL)
- CloudWatch Logs with 7-day retention
- 300-second timeout for data processing workloads

**environmentSuffix Integration:**
- `data-processor-{Environment}-{EnvironmentSuffix}`
- `lambda-execution-role-{Environment}-{EnvironmentSuffix}`
- `/aws/lambda/data-processor-{Environment}-{EnvironmentSuffix}` (CloudWatch Logs)

### Storage Nested Stack (`s3-nested-stack.json`)

Provides S3 storage with disaster recovery:
- Primary bucket with versioning enabled
- Replica bucket for cross-region replication to us-west-2
- Intelligent tiering configuration for cost optimization
- Lifecycle policies: 30-day transition to Glacier
- Server-side encryption with AES256
- IAM replication role for cross-region replication
- Public access blocked for security
- DeletionPolicy: Delete for clean teardown

**environmentSuffix Integration:**
- `app-data-{Environment}-{EnvironmentSuffix}` (primary bucket)
- `app-data-{Environment}-{EnvironmentSuffix}-replica` (replica bucket)
- `s3-replication-role-{Environment}-{EnvironmentSuffix}`

### Monitoring Nested Stack (`monitoring-nested-stack.json`)

Implements comprehensive CloudWatch monitoring:
- SNS topic for alarm notifications
- RDS CPU utilization alarm (threshold: 80%, 2 evaluation periods of 5 minutes)
- RDS database connections alarm (threshold: 80 connections)
- Lambda errors alarm (threshold: 10 errors per minute)
- Lambda throttles alarm (threshold: 1 throttle event per minute)
- SNS topic policy allowing CloudWatch to publish
- TreatMissingData: notBreaching for alarm behavior

**environmentSuffix Integration:**
- `infrastructure-alarms-{Environment}-{EnvironmentSuffix}` (SNS topic)
- `rds-high-cpu-{Environment}-{EnvironmentSuffix}` (alarm)
- `lambda-high-errors-{Environment}-{EnvironmentSuffix}` (alarm)

## Stack Outputs

The master template exports all critical resource identifiers:

### Network Outputs
- VPCId - For application deployment references
- PublicSubnet1, PublicSubnet2 - For public-facing resources
- PrivateSubnet1, PrivateSubnet2 - For secure backend resources

### Database Outputs
- DatabaseEndpoint - Writer endpoint for application connections
- DatabaseReaderEndpoint - Reader endpoint for read-only queries
- DBSecretArn - Secrets Manager ARN for credentials

### Compute Outputs
- DataProcessorFunctionArn - Lambda function ARN for triggers
- DataProcessorFunctionName - For CloudWatch Logs and monitoring
- LambdaExecutionRoleArn - For additional permission grants

### Storage Outputs
- ApplicationBucketName - For application S3 operations
- ApplicationBucketArn - For IAM policy references
- ReplicaBucketName - Disaster recovery bucket name

### Monitoring Outputs
- AlarmTopicArn - For subscribing to infrastructure alerts
- AlarmTopicName - SNS topic name for notifications

## Deployment Process

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. S3 bucket created for hosting nested stack templates
3. Unique EnvironmentSuffix chosen (3-10 lowercase alphanumeric characters)

### Step 1: Upload Nested Stack Templates

```bash
# Upload all nested templates to S3
aws s3 cp lib/vpc-nested-stack.json s3://your-templates-bucket/
aws s3 cp lib/rds-nested-stack.json s3://your-templates-bucket/
aws s3 cp lib/lambda-nested-stack.json s3://your-templates-bucket/
aws s3 cp lib/s3-nested-stack.json s3://your-templates-bucket/
aws s3 cp lib/monitoring-nested-stack.json s3://your-templates-bucket/
```

### Step 2: Deploy Master Template

```bash
# Deploy development environment
aws cloudformation create-stack \
  --stack-name infrastructure-dev \
  --template-body file://lib/master-template.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=xyz123 \
    ParameterKey=VPCTemplateURL,ParameterValue=https://your-templates-bucket.s3.amazonaws.com/vpc-nested-stack.json \
    ParameterKey=RDSTemplateURL,ParameterValue=https://your-templates-bucket.s3.amazonaws.com/rds-nested-stack.json \
    ParameterKey=LambdaTemplateURL,ParameterValue=https://your-templates-bucket.s3.amazonaws.com/lambda-nested-stack.json \
    ParameterKey=S3TemplateURL,ParameterValue=https://your-templates-bucket.s3.amazonaws.com/s3-nested-stack.json \
    ParameterKey=MonitoringTemplateURL,ParameterValue=https://your-templates-bucket.s3.amazonaws.com/monitoring-nested-stack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
# Watch stack creation
aws cloudformation describe-stacks \
  --stack-name infrastructure-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'

# Get stack outputs after completion
aws cloudformation describe-stacks \
  --stack-name infrastructure-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Environment-Specific Configurations

| Configuration | Dev | Staging | Prod |
|--------------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Type | t3.micro | t3.small | t3.medium |
| Lambda Memory | 256MB | 256MB | 512MB |
| RDS Instance | db.t3.medium | db.r5.large | db.r5.xlarge |
| NAT Gateway | No | Yes | Yes |
| Backup Retention | 7 days | 7 days | 7 days |

## Design Decisions

### 1. Nested Stacks Architecture
Chose nested stacks over monolithic template for:
- Modular design allowing independent stack updates
- Better organization and maintainability
- Reusability across multiple environments
- Easier testing and validation of individual components

### 2. Parameter Mappings
Used CloudFormation Mappings instead of multiple parameter files to:
- Centralize environment-specific configurations
- Reduce deployment complexity and parameter management
- Enforce consistency across environments
- Simplify deployment commands

### 3. Conditional NAT Gateway
Implemented conditional NAT Gateway creation to:
- Optimize costs in development environment
- Maintain production-grade networking in staging and prod
- Demonstrate CloudFormation Conditions capabilities
- Provide cost-effective development experience

### 4. Aurora PostgreSQL
Selected Aurora over standard RDS for:
- Better performance and scalability for financial services workloads
- Automated failover with 2 instances for high availability
- Point-in-time recovery and continuous backups
- Enhanced monitoring with Performance Insights

### 5. Secrets Manager Integration
Used AWS Secrets Manager for database credentials to:
- Eliminate hardcoded passwords in templates
- Enable automatic password rotation capability
- Integrate securely with RDS using dynamic secret resolution
- Follow AWS security best practices

### 6. Cross-Region Replication
Implemented S3 cross-region replication to:
- Provide disaster recovery capability to us-west-2
- Meet business continuity requirements
- Ensure data durability across geographic regions
- Comply with financial services data protection requirements

### 7. Comprehensive Monitoring
Deployed CloudWatch alarms and SNS for:
- Proactive monitoring of RDS CPU and connections
- Lambda error rate and throttling detection
- Centralized notification through SNS topic
- Operational visibility across all environments

### 8. DeletionPolicy: Delete
Set DeletionPolicy to Delete for all resources to:
- Enable clean stack teardown without manual intervention
- Support automated testing and CI/CD pipelines
- Prevent resource accumulation in test environments
- Simplify stack lifecycle management

## Cost Optimization Features

1. **Conditional NAT Gateway** - Only created in staging and production (saves $32/month in dev)
2. **Right-Sized Instances** - Environment-specific instance sizing (dev uses smaller, cheaper instances)
3. **Intelligent Tiering** - S3 automatically moves objects to cost-effective storage tiers
4. **Lifecycle Policies** - 30-day transition to Glacier for archived data
5. **CloudWatch Logs Retention** - 7-day retention to control log storage costs

## Security Features

1. **Encryption at Rest** - RDS and S3 use encryption
2. **Private Subnets** - Database and Lambda in private subnets with no public access
3. **Security Groups** - Restricted ingress/egress rules following least privilege
4. **IAM Roles** - Proper trust relationships and scoped permissions
5. **Secrets Manager** - Secure credential management with rotation capability
6. **S3 Public Access Block** - All S3 buckets block public access
7. **VPC Isolation** - Non-overlapping CIDR blocks for network segmentation

## Compliance and Tagging

All resources include mandatory tags:
- **Environment** - Identifies deployment environment (dev/staging/prod)
- **Project** - Project name for organizational tracking
- **CostCenter** - Cost center for billing and chargeback

These tags support:
- AWS Cost Allocation Reports
- Resource organization and filtering
- Compliance auditing and reporting
- Multi-team cost attribution

## Testing and Validation

### Template Validation

```bash
# Validate each template
aws cloudformation validate-template --template-body file://lib/master-template.json
aws cloudformation validate-template --template-body file://lib/vpc-nested-stack.json
aws cloudformation validate-template --template-body file://lib/rds-nested-stack.json
aws cloudformation validate-template --template-body file://lib/lambda-nested-stack.json
aws cloudformation validate-template --template-body file://lib/s3-nested-stack.json
aws cloudformation validate-template --template-body file://lib/monitoring-nested-stack.json
```

### Deployment Testing

1. Deploy to dev environment first for validation
2. Verify all resources created successfully
3. Test Lambda function execution
4. Verify RDS connectivity from Lambda
5. Validate S3 replication to us-west-2
6. Confirm CloudWatch alarms configured correctly
7. Test stack deletion and cleanup

### Resource Verification

```bash
# Verify VPC and subnets
aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=dev"
aws ec2 describe-subnets --filters "Name=tag:Environment,Values=dev"

# Verify RDS cluster
aws rds describe-db-clusters --filters "Name=tag:Environment,Values=dev"

# Verify Lambda function
aws lambda list-functions --query "Functions[?contains(FunctionName, 'dev')]"

# Verify S3 buckets
aws s3 ls | grep dev

# Verify CloudWatch alarms
aws cloudwatch describe-alarms --alarm-name-prefix "rds-high-cpu-dev"
```

## Troubleshooting

### Stack Creation Failures

If stack creation fails, check CloudFormation events:

```bash
aws cloudformation describe-stack-events \
  --stack-name infrastructure-dev \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

Common issues:
1. **Nested template URLs** - Ensure S3 URLs are publicly accessible or stack has read permissions
2. **Unique EnvironmentSuffix** - S3 bucket names must be globally unique
3. **Service Limits** - Check AWS service quotas for VPC, RDS, Lambda
4. **IAM Permissions** - Ensure deployment role has CAPABILITY_NAMED_IAM

### Cross-Region Replication Not Working

1. Verify versioning enabled on both source and destination buckets
2. Check IAM replication role has correct permissions
3. Ensure destination bucket exists and is accessible
4. Verify replica bucket is in target region (us-west-2)

### Lambda Function Errors

Check CloudWatch Logs for function execution errors:

```bash
aws logs tail /aws/lambda/data-processor-dev-xyz123 --follow --region us-east-1
```

Common issues:
1. **VPC Configuration** - Lambda needs NAT Gateway or VPC endpoints for internet access
2. **Security Groups** - Verify Lambda security group allows outbound traffic
3. **Timeout** - Increase Lambda timeout if processing takes longer than 300 seconds
4. **Memory** - Monitor memory usage and increase if functions are being throttled

### RDS Connectivity Issues

1. Verify security group allows traffic from Lambda security group on port 5432
2. Ensure Lambda and RDS are in same VPC
3. Check RDS cluster is in Available state
4. Retrieve database credentials from Secrets Manager

## Stack Cleanup

To delete the stack and all resources:

```bash
# Delete the master stack (automatically deletes nested stacks)
aws cloudformation delete-stack \
  --stack-name infrastructure-dev \
  --region us-east-1

# Monitor deletion progress
aws cloudformation describe-stacks \
  --stack-name infrastructure-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

**Note:** All resources have DeletionPolicy: Delete, ensuring complete cleanup without manual intervention. S3 buckets will be deleted even if they contain objects.

## Files Included

1. **master-template.json** - Master orchestration template (239 lines)
2. **vpc-nested-stack.json** - VPC infrastructure template (361 lines)
3. **rds-nested-stack.json** - RDS Aurora cluster template (154 lines)
4. **lambda-nested-stack.json** - Lambda functions template (154 lines)
5. **s3-nested-stack.json** - S3 storage template (187 lines)
6. **monitoring-nested-stack.json** - CloudWatch monitoring template (174 lines)
7. **README.md** - Deployment documentation and architecture guide

## Summary

This CloudFormation solution provides:
- Complete multi-environment infrastructure using nested stacks
- Environment-specific configurations through parameter mappings
- Conditional resources (NAT Gateway) for cost optimization
- Secure architecture with encryption, private subnets, and IAM roles
- Comprehensive monitoring with CloudWatch alarms and SNS notifications
- Cross-region replication for disaster recovery
- Clean teardown capability with DeletionPolicy: Delete
- Production-ready implementation following AWS best practices

All requirements from PROMPT.md have been implemented:
1. Master template with nested stacks - Implemented
2. Parameter mappings for environment-specific values - Implemented
3. RDS Aurora PostgreSQL with encryption and backups - Implemented
4. Lambda functions with environment-specific memory - Implemented
5. S3 buckets with intelligent tiering and cross-region replication - Implemented
6. VPC infrastructure with non-overlapping CIDRs - Implemented (note: VPC peering requires manual configuration post-deployment)
7. Conditional NAT Gateway creation - Implemented
8. CloudWatch Alarms with SNS topics - Implemented
9. Comprehensive stack outputs - Implemented

**Platform:** CloudFormation (cfn)
**Language:** JSON
**Deployment Region:** us-east-1 (primary), us-west-2 (disaster recovery)
