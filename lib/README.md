# Payment Processing System - Multi-Environment Infrastructure

A comprehensive AWS CDK Python implementation for deploying payment processing infrastructure across multiple environments (development, staging, production) with environment-specific configurations.

## Overview

This solution implements a scalable payment processing system with the following components:

- **VPC Infrastructure**: Isolated VPCs with 3 availability zones, private and public subnets
- **API Gateway**: RESTful API with environment-specific throttling
- **Lambda Functions**: Payment processing with 512MB memory and 30-second timeout
- **DynamoDB**: Transaction storage with environment-specific billing modes
- **S3**: Audit log storage with versioning and lifecycle policies
- **SQS**: Dead-letter queues with environment-specific retention
- **KMS**: Environment-specific encryption keys
- **CloudWatch**: Monitoring and alarms (staging/production only)
- **IAM**: Least-privilege roles and policies

## Architecture

### Environment Configurations

| Component | Development | Staging | Production |
|-----------|------------|---------|------------|
| **Region** | us-east-1 | us-east-2 | us-east-1 |
| **DynamoDB Billing** | On-Demand | On-Demand | Provisioned (5 RCU/5 WCU) |
| **S3 Glacier Transition** | 30 days | 30 days | 90 days |
| **API Rate Limit** | 100 req/sec | 1000 req/sec | 10000 req/sec |
| **DLQ Retention** | 3 days | 7 days | 14 days |
| **CloudWatch Alarms** | No | Yes | Yes |

## Prerequisites

- Python 3.9 or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Node.js 18+ (for CDK CLI)

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install CDK CLI (if not already installed):

```bash
npm install -g aws-cdk
```

3. Bootstrap CDK (first time only):

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2  # For staging
```

## Deployment

### Deploy to Development

```bash
cdk deploy -c env=dev
```

### Deploy to Staging

```bash
cdk deploy -c env=staging
```

### Deploy to Production

```bash
cdk deploy -c env=production
```

## Stack Components

### 1. VPC Infrastructure

- 3 Availability Zones
- Public subnets for load balancers
- Private subnets for compute resources
- Single NAT Gateway for cost optimization

### 2. DynamoDB Table

- Partition key: `transaction_id`
- Sort key: `timestamp`
- KMS encryption
- Environment-specific billing mode
- Point-in-time recovery (staging/production)

### 3. S3 Bucket

- Versioning enabled
- KMS encryption
- Lifecycle rules for Glacier transition
- Auto-delete on stack destruction

### 4. Lambda Function

- Runtime: Python 3.9
- Memory: 512MB (consistent across all environments)
- Timeout: 30 seconds (consistent across all environments)
- VPC-attached
- Dead-letter queue configured

### 5. API Gateway

- REST API
- POST /payments endpoint
- API key authentication
- Environment-specific throttling
- Usage plans

### 6. KMS Key

- Environment-specific encryption key
- Key rotation enabled
- Used for DynamoDB, S3, and SQS encryption

### 7. SQS Dead-Letter Queue

- Environment-specific retention periods
- KMS encryption

### 8. CloudWatch Alarms (Staging/Production Only)

- Lambda error rate monitoring
- API Gateway 4xx rate monitoring
- API Gateway 5xx rate monitoring

## Testing

Run unit tests:

```bash
pytest tests/ -v
```

Run tests with coverage:

```bash
pytest tests/ --cov=lib --cov-report=term-missing
```

## CDK Commands

- `cdk ls` - List all stacks
- `cdk synth -c env=dev` - Synthesize CloudFormation template
- `cdk diff -c env=dev` - Compare deployed stack with current state
- `cdk deploy -c env=dev` - Deploy stack
- `cdk destroy -c env=dev` - Destroy stack

## Configuration Management

Environment-specific configurations are centralized in `app.py`:

```python
env_configs = {
    "dev": {...},
    "staging": {...},
    "production": {...}
}
```

All configurations are applied through CDK context, preventing configuration drift.

## Security Features

1. **Encryption at Rest**: All data stores use KMS encryption
2. **Encryption in Transit**: TLS/SSL for all API communication
3. **Least-Privilege IAM**: Granular permissions for each resource
4. **Network Isolation**: VPC with private subnets for compute
5. **Mandatory Tagging**: CDK Aspects enforce tagging standards

## Tagging Strategy

All resources are tagged with:

- `Environment`: dev/staging/production
- `CostCenter`: Engineering/Finance
- `Owner`: Team name
- `DataClassification`: Internal/Confidential/Restricted

## Cost Optimization

- Serverless architecture (Lambda, API Gateway)
- On-demand DynamoDB billing for non-production
- Single NAT Gateway
- S3 lifecycle policies for archival
- No reserved capacity

## Cleanup

To destroy all resources:

```bash
cdk destroy -c env=dev
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Troubleshooting

### Issue: Stack fails to deploy

- Check AWS credentials
- Verify CDK bootstrap in target region
- Check CloudFormation events in AWS Console

### Issue: Lambda function errors

- Check CloudWatch Logs
- Verify IAM permissions
- Check VPC security groups

### Issue: API Gateway throttling

- Adjust rate limits in `env_configs`
- Check usage plan configuration

## Support

For issues or questions, contact the development team.
