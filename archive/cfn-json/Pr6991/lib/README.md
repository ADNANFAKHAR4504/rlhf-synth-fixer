# Security, Compliance, and Governance Infrastructure

This CloudFormation template deploys a secure financial data processing pipeline with comprehensive encryption, VPC isolation, and compliance features.

## Architecture Overview

The infrastructure includes:

- **VPC with private subnets** for secure network isolation
- **Lambda functions** for transaction processing and secret rotation
- **DynamoDB table** for transaction storage with encryption at rest
- **S3 bucket** for transaction data with lifecycle policies
- **API Gateway** with throttling and monitoring
- **Secrets Manager** with automatic rotation
- **KMS encryption** for all data at rest
- **VPC endpoints** for secure AWS service communication
- **CloudWatch logging** with configurable retention

## Parameters

| Parameter           | Description                            | Default  | Valid Values                                                                                            |
| ------------------- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `environmentSuffix` | Environment suffix for resource naming | Required | 1-20 characters, lowercase letters, numbers, and hyphens                                                |
| `logRetentionDays`  | CloudWatch log retention period        | 90       | 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653 |

## Deployment Instructions

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **AWS account** with sufficient quotas
3. **Region selected** with at least 3 availability zones

### Required IAM Permissions

The deploying user/role needs the following permissions:

- `cloudformation:*`
- `iam:*` (for creating roles and policies)
- `lambda:*`
- `logs:*`
- `kms:*`
- `s3:*`
- `dynamodb:*`
- `apigateway:*`
- `secretsmanager:*`
- `ec2:*` (for VPC resources)

### Deployment Commands

#### Deploy via AWS CLI

```bash
# Deploy with default settings
aws cloudformation deploy \
  --template-file template.json \
  --stack-name financial-pipeline-dev \
  --parameter-overrides \
    environmentSuffix=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2

# Deploy with custom log retention
aws cloudformation deploy \
  --template-file template.json \
  --stack-name financial-pipeline-prod \
  --parameter-overrides \
    environmentSuffix=prod \
    logRetentionDays=365 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

#### Deploy via AWS Console

1. Navigate to CloudFormation console
2. Click "Create stack" → "With new resources"
3. Upload `template.json`
4. Provide stack name and parameters
5. Enable "I acknowledge that AWS CloudFormation might create IAM resources with custom names"
6. Click "Create stack"

### Multi-Environment Deployment

Deploy separate stacks for different environments:

```bash
# Development environment
aws cloudformation deploy \
  --template-file template.json \
  --stack-name financial-pipeline-dev \
  --parameter-overrides \
    environmentSuffix=dev \
    logRetentionDays=7 \
  --capabilities CAPABILITY_NAMED_IAM

# Staging environment
aws cloudformation deploy \
  --template-file template.json \
  --stack-name financial-pipeline-staging \
  --parameter-overrides \
    environmentSuffix=staging \
    logRetentionDays=30 \
  --capabilities CAPABILITY_NAMED_IAM

# Production environment
aws cloudformation deploy \
  --template-file template.json \
  --stack-name financial-pipeline-prod \
  --parameter-overrides \
    environmentSuffix=prod \
    logRetentionDays=365 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Network Architecture

### VPC Configuration

- **CIDR Block**: 10.0.0.0/16
- **Private Subnets**:
  - 10.0.1.0/24 (AZ-a)
  - 10.0.2.0/24 (AZ-b)
  - 10.0.3.0/24 (AZ-c)

### Lambda VPC Requirements

**⚠️ IMPORTANT: NAT Gateway Requirement**

Lambda functions deployed in VPC subnets require internet access for:

- AWS API calls (DynamoDB, S3, Secrets Manager, CloudWatch)
- Package downloads and updates

**Options for Lambda Internet Access:**

1. **VPC Endpoints (Recommended for production)**
   - Current template includes S3, DynamoDB, and Secrets Manager VPC endpoints
   - More secure and cost-effective for high-traffic environments
   - No data egress charges

2. **NAT Gateway (Required if not using all VPC endpoints)**
   - Required for services without VPC endpoints
   - Costs ~$32/month per NAT Gateway
   - Add to public subnet with Internet Gateway route

### VPC Endpoints Included

The template includes VPC endpoints for:

- **S3** (Gateway endpoint)
- **DynamoDB** (Gateway endpoint)
- **Secrets Manager** (Interface endpoint)

## Security Features

### Encryption

- **KMS customer-managed key** with automatic rotation
- **S3 server-side encryption** with KMS
- **DynamoDB encryption** at rest with KMS
- **CloudWatch logs encryption** with KMS
- **Secrets Manager encryption** with KMS

### Network Security

- **Private subnets only** for compute resources
- **Security groups** with least-privilege access
- **VPC endpoints** to avoid internet routing
- **API Gateway throttling** (50 RPS, 100 burst)

### Access Control

- **IAM roles** with least-privilege permissions
- **API key authentication** for API Gateway
- **Resource-specific policies** for cross-service access

### Compliance Features

- **Automatic secret rotation** (30-day cycle)
- **Point-in-time recovery** for DynamoDB
- **S3 lifecycle policies** for data archival
- **CloudWatch monitoring** and alerting
- **Comprehensive tagging** for governance

## Outputs

| Output                            | Description                |
| --------------------------------- | -------------------------- |
| `EncryptionKeyId`                 | KMS Key ID for encryption  |
| `EncryptionKeyArn`                | KMS Key ARN for encryption |
| `VPCId`                           | VPC identifier             |
| `TransactionBucketName`           | S3 bucket name             |
| `TransactionTableName`            | DynamoDB table name        |
| `TransactionProcessorFunctionArn` | Lambda function ARN        |
| `APIEndpoint`                     | API Gateway endpoint URL   |
| `APIKey`                          | API key for authentication |
| `DatabaseSecretArn`               | Secrets Manager ARN        |

## Testing the Deployment

### 1. Verify Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name financial-pipeline-dev \
  --query 'Stacks[0].StackStatus'
```

### 2. Test API Endpoint

```bash
# Get API key
API_KEY=$(aws cloudformation describe-stacks \
  --stack-name financial-pipeline-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`APIKey`].OutputValue' \
  --output text)

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name financial-pipeline-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

# Test transaction processing
curl -X POST \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "test-123", "amount": 100.00}' \
  "$API_ENDPOINT/transactions"
```

### 3. Verify Encryption

```bash
# Check KMS key
aws kms describe-key \
  --key-id $(aws cloudformation describe-stacks \
    --stack-name financial-pipeline-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`EncryptionKeyId`].OutputValue' \
    --output text)
```

## Cleanup

```bash
# Delete stack
aws cloudformation delete-stack \
  --stack-name financial-pipeline-dev

# Wait for completion
aws cloudformation wait stack-delete-complete \
  --stack-name financial-pipeline-dev
```

**Note**: S3 bucket must be empty before stack deletion. Use `aws s3 rm s3://bucket-name --recursive` if needed.

## Cost Optimization

### Development Environment

- Set `logRetentionDays` to 7 or 14
- Use smaller Lambda memory sizes
- Consider scheduled Lambda for non-production workloads

### Production Environment

- Set `logRetentionDays` to 365 or higher
- Enable S3 lifecycle policies for long-term archival
- Monitor CloudWatch costs with log filtering

### Estimated Monthly Costs

- **Development**: ~$20-50 (low usage)
- **Production**: ~$100-300 (depending on transaction volume)
- **Major cost factors**: Lambda invocations, API Gateway requests, CloudWatch logs, S3 storage

## Monitoring and Alerts

The template includes CloudWatch alarms for:

- Lambda function errors (>5 errors in 5 minutes)
- API Gateway 5XX errors (>10 errors in 5 minutes)

## Troubleshooting

### Common Issues

1. **Lambda timeout in VPC**
   - Verify VPC endpoints are accessible
   - Check security group rules
   - Ensure subnets have route to VPC endpoints

2. **Secret rotation failures**
   - Verify Lambda execution role permissions
   - Check VPC connectivity to Secrets Manager
   - Review CloudWatch logs for rotation function

3. **API Gateway 403 errors**
   - Verify API key is included in request headers
   - Check usage plan limits
   - Verify method configuration

### Useful Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/transaction-processor-dev --follow

# Check secret rotation status
aws secretsmanager describe-secret \
  --secret-id $(aws cloudformation describe-stacks \
    --stack-name financial-pipeline-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
    --output text)

# Monitor API Gateway log
aws logs tail /aws/apigateway/transaction-api-dev --follow
```

## Support

For issues with this infrastructure:

1. Check CloudFormation stack events
2. Review CloudWatch logs for specific services
3. Verify IAM permissions and resource limits
4. Consult AWS documentation for service-specific troubleshooting
