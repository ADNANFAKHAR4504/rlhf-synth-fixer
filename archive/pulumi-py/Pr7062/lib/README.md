# Multi-Environment Payment Processing Infrastructure

This Pulumi Python application deploys a complete payment processing infrastructure across multiple AWS environments (development, staging, production) with environment-specific configurations.

## Architecture

The solution is built using reusable Pulumi ComponentResource patterns that enable:
- Consistent infrastructure deployment across environments
- Environment-specific configurations (memory, capacity, retention, thresholds)
- Automated compliance tracking through resource manifests
- Single-command deployments

### Components

1. **VPC Component** (`vpc_component.py`)
   - Isolated VPC per environment
   - 2 public and 2 private subnets
   - Internet Gateway and NAT Gateway
   - Route tables with proper associations

2. **Lambda Component** (`lambda_component.py`)
   - Payment processing functions
   - ARM64 architecture for cost optimization
   - Environment-specific memory allocation
   - CloudWatch log groups

3. **DynamoDB Component** (`dynamodb_component.py`)
   - Transaction storage tables
   - Environment-specific capacity modes
   - Point-in-time recovery (production only)
   - Global secondary indexes

4. **S3 Component** (`s3_component.py`)
   - Audit log storage
   - Environment-specific lifecycle policies
   - Server-side encryption
   - Versioning enabled

5. **IAM Component** (`iam_component.py`)
   - Least-privilege roles and policies
   - Cross-environment access restrictions
   - Region-specific conditions

6. **Monitoring Component** (`monitoring_component.py`)
   - CloudWatch alarms
   - Environment-specific thresholds
   - Lambda error monitoring
   - DynamoDB throttling alarms

## Environment Configurations

### Development
- Account: 123456789012
- Lambda Memory: 512MB
- DynamoDB: On-demand capacity
- S3 Retention: 30 days
- PITR: Disabled

### Staging
- Account: 234567890123
- Lambda Memory: 1024MB
- DynamoDB: Provisioned (5 RCU/WCU)
- S3 Retention: 90 days
- PITR: Disabled

### Production
- Account: 345678901234
- Lambda Memory: 2048MB
- DynamoDB: Provisioned (20 RCU/WCU)
- S3 Retention: 365 days
- PITR: Enabled

## Prerequisites

1. Python 3.9 or higher
2. Pulumi CLI (3.0+)
3. AWS CLI configured with appropriate credentials
4. Access to target AWS accounts

## Installation

1. Install dependencies: