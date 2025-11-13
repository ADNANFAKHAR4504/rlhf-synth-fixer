# Financial Trading Analytics Platform - Infrastructure

Production-ready AWS infrastructure for a financial trading analytics platform built with AWS CDK and TypeScript.

## Architecture Overview

This infrastructure provides a complete, secure, and compliant environment for processing real-time market data and delivering insights to institutional clients.

### Key Components

- **Networking**: VPC with 10.0.0.0/16 CIDR across 3 availability zones
- **Database**: Aurora Serverless v2 PostgreSQL cluster for transactional data
- **NoSQL Storage**: DynamoDB tables for sessions and API key management
- **Object Storage**: S3 buckets for data ingestion, processing, and archival
- **Compute**: Lambda functions on ARM64 (Graviton2) for data processing
- **API Management**: API Gateway REST API with usage plans and throttling
- **Observability**: CloudWatch Logs with 30-day retention
- **Security**: Customer-managed KMS keys for all encryption
- **Compliance**: AWS Config rules for PCI-DSS compliance monitoring

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     VPC (10.0.0.0/16)                        │ │
│  │  ┌──────────────────────────────────────────────────────────┤ │
│  │  │  AZ-1        │     AZ-2        │     AZ-3                │ │
│  │  ├──────────────┼─────────────────┼─────────────────────────┤ │
│  │  │ Public       │  Public         │  Public                 │ │
│  │  │ NAT Gateway  │  NAT Gateway    │  NAT Gateway            │ │
│  │  ├──────────────┼─────────────────┼─────────────────────────┤ │
│  │  │ Private      │  Private        │  Private                │ │
│  │  │ Aurora       │  Aurora         │  Lambda Functions       │ │
│  │  │ Replica      │  Primary        │                         │ │
│  │  └──────────────┴─────────────────┴─────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  API Gateway → Lambda → Aurora/DynamoDB/S3                   │ │
│  │             ↓                                                 │ │
│  │        CloudWatch Logs (30-day retention)                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DynamoDB Tables                     S3 Buckets              │ │
│  │  - user-sessions                     - ingestion             │ │
│  │  - api-keys                          - analytics             │ │
│  │                                      - archival               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Security & Compliance                                       │ │
│  │  - KMS Keys (DB, S3, Lambda, DynamoDB)                       │ │
│  │  - AWS Config + PCI-DSS Rules                               │ │
│  │  - IAM Roles with Regional Restrictions                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js**: 18.x or higher
- **AWS CDK**: 2.x (`npm install -g aws-cdk`)
- **AWS CLI**: Configured with appropriate credentials
- **TypeScript**: 4.x or higher

## Installation

```bash
# Install dependencies
npm install

# Verify CDK installation
cdk --version
```

## Configuration

### Environment Suffix

All resources are created with an `environmentSuffix` to enable multiple environment deployments (dev, staging, prod):

```bash
# Set environment suffix (optional, defaults to 'dev')
export ENVIRONMENT_SUFFIX=dev
```

### AWS Account and Region

The stack is designed for deployment to **us-east-1**. Ensure your AWS CLI is configured:

```bash
aws configure
# Set region to us-east-1
```

## Deployment

### 1. Synthesize CloudFormation Template

```bash
# Generate CloudFormation template
cdk synth

# Review the generated template
cdk synth > template.yaml
```

### 2. Bootstrap CDK (First Time Only)

```bash
# Bootstrap CDK in your AWS account
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

### 3. Deploy Infrastructure

```bash
# Deploy with default environment (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod

# Deploy without confirmation prompts
cdk deploy --require-approval never
```

### 4. Retrieve Stack Outputs

After deployment, retrieve important resource identifiers:

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStackdev \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests (requires deployed stack)
npm run test:integration
```

## Resource Details

### VPC Configuration

- **CIDR**: 10.0.0.0/16
- **Availability Zones**: 3
- **Public Subnets**: 3 (one per AZ) with NAT Gateways
- **Private Subnets**: 3 (one per AZ) for compute and database

### Aurora Serverless v2

- **Engine**: PostgreSQL 15.3
- **Scaling**: 0.5 ACU (min) to 2 ACU (max)
- **Backup Retention**: 7 days
- **Encryption**: Customer-managed KMS key
- **High Availability**: Multi-AZ deployment

### DynamoDB Tables

**Sessions Table**:
- **Table Name**: `user-sessions-{environmentSuffix}`
- **Partition Key**: `sessionId` (String)
- **Billing**: On-demand
- **Features**: Point-in-time recovery, KMS encryption

**API Keys Table**:
- **Table Name**: `api-keys-{environmentSuffix}`
- **Partition Key**: `apiKeyId` (String)
- **Billing**: On-demand
- **Features**: Point-in-time recovery, KMS encryption

### S3 Buckets

1. **Ingestion Bucket**: `trading-ingestion-{environmentSuffix}-{account}`
   - Versioning enabled
   - 90-day Glacier transition
   - KMS encryption

2. **Analytics Bucket**: `trading-analytics-{environmentSuffix}-{account}`
   - Versioning enabled
   - 90-day Glacier transition
   - KMS encryption

3. **Archival Bucket**: `trading-archival-{environmentSuffix}-{account}`
   - Versioning enabled
   - 90-day Deep Archive transition
   - KMS encryption

4. **Config Bucket**: `config-bucket-{environmentSuffix}-{account}`
   - For AWS Config data
   - Versioning enabled
   - KMS encryption

### Lambda Functions

- **Function Name**: `data-processor-{environmentSuffix}`
- **Runtime**: Node.js 18.x
- **Architecture**: ARM64 (Graviton2)
- **Environment Variables**: Encrypted with KMS
- **Log Retention**: 30 days
- **IAM**: Custom role with regional restrictions

### API Gateway

- **API Name**: `trading-api-{environmentSuffix}`
- **Type**: REST API
- **Authentication**: API Key required
- **Throttling**: 1000 RPS per API key (2000 burst)
- **Logging**: CloudWatch Logs with 30-day retention
- **Stage**: Named after environment suffix

### Security Features

1. **Encryption at Rest**:
   - All data encrypted using customer-managed KMS keys
   - Separate keys for RDS, DynamoDB, S3, and Lambda

2. **Encryption in Transit**:
   - S3 buckets enforce SSL/TLS connections
   - API Gateway uses HTTPS only

3. **IAM Least-Privilege**:
   - Lambda has read-only access to ingestion bucket
   - Lambda has write-only access to analytics bucket
   - Regional restrictions prevent resource creation outside us-east-1

4. **Network Security**:
   - Aurora deployed in private subnets (no internet access)
   - Lambda functions in VPC with controlled egress
   - S3 buckets block all public access

### Compliance

**AWS Config Rules**:
- `ENCRYPTED_VOLUMES`: Verify EBS encryption
- `RDS_STORAGE_ENCRYPTED`: Verify RDS encryption
- `S3_BUCKET_PUBLIC_READ_PROHIBITED`: Block public read
- `S3_BUCKET_PUBLIC_WRITE_PROHIBITED`: Block public write
- `S3_BUCKET_LOGGING_ENABLED`: Verify access logging

**Resource Tagging**:
- `Environment`: Environment identifier (dev, staging, prod)
- `CostCenter`: trading-platform
- `Compliance`: PCI-DSS
- `DataClassification`: Confidential

## Cost Optimization

This infrastructure is designed for cost efficiency:

1. **Aurora Serverless v2**: Scales down to 0.5 ACU during low traffic
2. **Lambda Graviton2**: 20% better price-performance than x86
3. **DynamoDB On-Demand**: Pay only for actual usage
4. **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
5. **NAT Gateways**: Shared across AZs (consider reducing to 1-2 for dev)

## Cleanup

To avoid ongoing AWS charges, destroy the stack when no longer needed:

```bash
# Destroy stack
cdk destroy

# Destroy with custom environment
cdk destroy -c environmentSuffix=prod

# Skip confirmation
cdk destroy --force
```

**Note**: All resources have `RemovalPolicy.DESTROY` and will be deleted. S3 buckets have `autoDeleteObjects` enabled for complete cleanup.

## Troubleshooting

### Deployment Failures

1. **Stack Already Exists**:
   ```bash
   # Delete existing stack
   cdk destroy
   # Redeploy
   cdk deploy
   ```

2. **Insufficient IAM Permissions**:
   - Ensure your AWS credentials have administrator access
   - Or grant specific permissions for VPC, RDS, DynamoDB, S3, Lambda, API Gateway, IAM, KMS, Config

3. **Resource Naming Conflicts**:
   - Use different `environmentSuffix` values for different environments
   - Bucket names include account ID to ensure global uniqueness

### AWS Config Issues

If Config rules show as non-compliant:

1. Wait 10-15 minutes for initial evaluation
2. Check Config recorder status:
   ```bash
   aws configservice describe-configuration-recorder-status
   ```
3. Manually trigger evaluation:
   ```bash
   aws configservice start-config-rules-evaluation --config-rule-names <rule-name>
   ```

### Lambda Function Issues

1. **VPC Connectivity**:
   - Lambda is attached to VPC with NAT gateway for internet access
   - Verify NAT gateway and route tables

2. **Permission Errors**:
   - Check Lambda execution role has required permissions
   - Verify KMS key grants for environment variable decryption

## Security Best Practices

1. **Rotate KMS Keys**: Enable automatic key rotation (already configured)
2. **Review IAM Policies**: Audit Lambda and Config roles regularly
3. **Monitor CloudWatch Logs**: Set up alarms for suspicious activity
4. **Enable AWS CloudTrail**: Track all API calls for audit
5. **Implement Secrets Manager**: Store database credentials securely
6. **Enable VPC Flow Logs**: Monitor network traffic patterns

## Maintenance

### Updating Infrastructure

```bash
# Update CDK dependencies
npm update

# Deploy updated infrastructure
cdk deploy
```

### Monitoring

- **CloudWatch Dashboards**: Create custom dashboards for key metrics
- **CloudWatch Alarms**: Set up alarms for:
  - Lambda errors and throttles
  - API Gateway 4xx/5xx errors
  - RDS connection count
  - DynamoDB throttled requests

### Backup and Recovery

- **RDS**: Automated backups with 7-day retention
- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Versioning enabled on all buckets

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Aurora Serverless v2](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [API Gateway Usage Plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config.html)
- [PCI-DSS on AWS](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review AWS Config compliance status
3. Verify IAM permissions
4. Consult AWS documentation for specific services

## License

This infrastructure code is provided as-is for the financial trading analytics platform project.
