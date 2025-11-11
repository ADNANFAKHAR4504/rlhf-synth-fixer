# Serverless Payment Processing System

A production-ready serverless payment processing infrastructure built with CDKTF (Terraform CDK) and TypeScript, deployed on AWS. This system demonstrates enterprise-grade architecture with comprehensive security controls, monitoring, and compliance considerations for PCI DSS.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Component Description](#detailed-component-description)
- [Deployment Instructions](#deployment-instructions)
- [Testing](#testing)
- [Configuration](#configuration)
- [Security & Compliance](#security--compliance)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)
- [Cleanup](#cleanup)

## Architecture Overview

This infrastructure implements a complete serverless payment processing system with the following AWS services:

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│      API Gateway REST API           │
│  - /transactions (POST)             │
│  - /status (GET)                    │
│  - CORS enabled (*)                 │
│  - Throttling: 10,000 rps           │
│  - X-Ray tracing enabled            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         VPC (10.0.0.0/16)           │
│  ┌───────────────────────────────┐  │
│  │   Private Subnets (1a, 1b)    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Lambda Functions      │  │  │
│  │  │  - Transaction Processor│  │  │
│  │  │  - Status Checker       │  │  │
│  │  │  - 512MB memory         │  │  │
│  │  │  - X-Ray tracing        │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   VPC Endpoints               │  │
│  │  - DynamoDB (Gateway)         │  │
│  │  - S3 (Gateway)               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│       AWS Services                   │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  DynamoDB   │  │  SQS FIFO    │  │
│  │  - On-demand│  │  - 14d retention│ │
│  │  - PITR     │  │  - Dedup     │  │
│  │  - KMS      │  └──────────────┘  │
│  └─────────────┘                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  SNS Topic  │  │  CloudWatch  │  │
│  │  - Email    │  │  - Logs      │  │
│  │  - Alerts   │  │  - Alarms    │  │
│  └─────────────┘  │  - Dashboard │  │
│                   └──────────────┘  │
│  ┌─────────────┐                    │
│  │  KMS        │                    │
│  │  - Customer │                    │
│  │  - Rotation │                    │
│  └─────────────┘                    │
└──────────────────────────────────────┘
```

## Prerequisites

Before deploying this infrastructure, ensure you have the following installed and configured:

### Required Software

- **Node.js**: 18.x or later ([Download](https://nodejs.org/))
- **npm**: 9.x or later (included with Node.js)
- **CDKTF CLI**: Install globally with `npm install -g cdktf-cli@latest`
- **Terraform**: 1.5+ (automatically managed by CDKTF)
- **AWS CLI**: 2.x ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))

### AWS Credentials

Configure AWS credentials using one of the following methods:

```bash
# Option 1: AWS CLI configuration
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1

# Option 3: AWS SSO
aws sso login --profile your-profile
export AWS_PROFILE=your-profile
```

### Required AWS Permissions

Your AWS credentials must have permissions to create:
- VPC, Subnets, Route Tables, Security Groups, VPC Endpoints
- Lambda Functions, Lambda Permissions
- API Gateway REST APIs
- DynamoDB Tables
- SQS Queues
- SNS Topics
- IAM Roles and Policies
- KMS Keys
- CloudWatch Log Groups, Dashboards, Alarms
- S3 Buckets (for Terraform state)

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd <repository-directory>

# 2. Install dependencies
npm ci

# 3. Install Lambda function dependencies
cd lib/lambda/transaction-processor && npm install && cd ../../..
cd lib/lambda/status-checker && npm install && cd ../../..

# 4. Set environment variables (optional - defaults provided)
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# 5. Synthesize CDKTF
cdktf synth

# 6. Deploy infrastructure
cdktf deploy

# 7. Test the API (use the API URL from deployment outputs)
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "card_last_four": "1234",
    "merchant_id": "merchant-123"
  }'
```

## Detailed Component Description

### API Gateway

- **Type**: REST API (Regional)
- **Endpoints**:
  - `POST /transactions` - Process new payment transactions
  - `GET /status?transaction_id=<id>` - Query transaction status
  - `OPTIONS /transactions` - CORS preflight
  - `OPTIONS /status` - CORS preflight
- **Features**:
  - CORS enabled with wildcard origin (`*`)
  - Request validation for query string parameters
  - Throttling: 10,000 requests per second (burst and rate)
  - X-Ray tracing enabled
  - Lambda proxy integration
  - Production stage with caching disabled

### Lambda Functions

#### Transaction Processor
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Reserved Concurrency**: 10
- **Timeout**: 30 seconds
- **VPC**: Deployed in private subnets (us-east-1a, us-east-1b)
- **Functionality**:
  - Parses incoming transaction request
  - Stores transaction in DynamoDB
  - Sends message to SQS for audit trail
  - Publishes notification to SNS
  - Returns transaction ID and status
- **Environment Variables**:
  - `DYNAMODB_TABLE`: DynamoDB table name
  - `SQS_QUEUE_URL`: SQS queue URL
  - `SNS_TOPIC_ARN`: SNS topic ARN
  - `AWS_REGION`: Deployment region

#### Status Checker
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Reserved Concurrency**: 5
- **Timeout**: 30 seconds
- **VPC**: Deployed in private subnets (us-east-1a, us-east-1b)
- **Functionality**:
  - Queries DynamoDB by transaction ID
  - Returns transaction details and status
  - Returns 404 if transaction not found
- **Environment Variables**:
  - `DYNAMODB_TABLE`: DynamoDB table name
  - `AWS_REGION`: Deployment region

### DynamoDB

- **Table Name**: `payment-transactions-{environmentSuffix}`
- **Partition Key**: `transaction_id` (String)
- **Sort Key**: `timestamp` (Number)
- **Billing Mode**: On-demand (PAY_PER_REQUEST)
- **Features**:
  - Point-in-time recovery enabled
  - Server-side encryption with KMS customer-managed key
  - Automatic scaling with on-demand capacity
- **Attributes Stored**:
  - `transaction_id`: Unique transaction identifier
  - `timestamp`: Unix timestamp in milliseconds
  - `amount`: Transaction amount
  - `status`: Transaction status (pending, completed, failed)
  - `card_last_four`: Last 4 digits of card (PCI compliant)
  - `merchant_id`: Merchant identifier

### SQS Queue

- **Type**: FIFO Queue
- **Name**: `transaction-queue-{environmentSuffix}.fifo`
- **Message Retention**: 14 days (1,209,600 seconds)
- **Visibility Timeout**: 5 minutes (300 seconds)
- **Features**:
  - Content-based deduplication enabled
  - FIFO ordering guarantees
  - Used for audit trail and asynchronous logging

### SNS Topic

- **Name**: `payment-notifications-{environmentSuffix}`
- **Subscription**: Email (admin@example.com)
- **Purpose**: Send notifications for:
  - New transactions
  - Error alerts from CloudWatch Alarms
  - System health notifications

### VPC & Networking

- **VPC CIDR**: 10.0.0.0/16
- **Private Subnets**:
  - `10.0.1.0/24` (us-east-1a)
  - `10.0.2.0/24` (us-east-1b)
- **Public Subnet**: `10.0.100.0/24` (us-east-1a)
- **VPC Endpoints**:
  - DynamoDB Gateway Endpoint
  - S3 Gateway Endpoint
- **Security Groups**:
  - Lambda Security Group: Allows all outbound traffic
- **Cost Optimization**: Uses VPC endpoints instead of NAT Gateway

### KMS Encryption

- **Key Type**: Customer-managed KMS key
- **Key Rotation**: Enabled (automatic annual rotation)
- **Usage**:
  - DynamoDB table encryption
  - Accessible by Lambda IAM roles for encrypt/decrypt operations

### IAM Roles

#### Transaction Processor Role
- **Permissions**:
  - DynamoDB: PutItem, GetItem, UpdateItem, Query
  - SQS: SendMessage, ReceiveMessage, DeleteMessage, GetQueueAttributes
  - SNS: Publish
  - KMS: Decrypt, Encrypt, GenerateDataKey
  - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents (restricted to `/aws/lambda/*`)
  - EC2: CreateNetworkInterface, DescribeNetworkInterfaces, DeleteNetworkInterface
  - X-Ray: PutTraceSegments, PutTelemetryRecords

#### Status Checker Role
- **Permissions**:
  - DynamoDB: GetItem, Query, Scan
  - KMS: Decrypt
  - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents (restricted to `/aws/lambda/*`)
  - EC2: CreateNetworkInterface, DescribeNetworkInterfaces, DeleteNetworkInterface
  - X-Ray: PutTraceSegments, PutTelemetryRecords

### CloudWatch Monitoring

#### Log Groups
- `/aws/lambda/transaction-processor-{environmentSuffix}`
- `/aws/lambda/status-checker-{environmentSuffix}`
- **Retention**: 30 days

#### Dashboard
- **Name**: `payment-dashboard-{environmentSuffix}`
- **Widgets**:
  - Lambda invocations (transaction processor and status checker)
  - Lambda errors (transaction processor and status checker)
  - DynamoDB consumed capacity (read and write)

#### Alarms
- **Transaction Processor Alarm**: Triggers when errors exceed threshold of 1
- **Status Checker Alarm**: Triggers when errors exceed threshold of 1
- **Evaluation Periods**: 2 consecutive periods (5 minutes each)
- **Action**: Send notification to SNS topic

### X-Ray Tracing

- **Enabled On**:
  - All Lambda functions (active mode)
  - API Gateway stage
- **Benefits**:
  - Distributed tracing across services
  - Performance analysis
  - Error identification
  - Security audit trails

## Deployment Instructions

### Step 1: Prepare Environment

```bash
# Set environment variables (optional - defaults provided)
export ENVIRONMENT_SUFFIX=dev           # Default: 'dev'
export AWS_REGION=us-east-1            # Default: 'us-east-1'
export TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states
export TERRAFORM_STATE_BUCKET_REGION=us-east-1
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm ci

# Install Lambda function dependencies
cd lib/lambda/transaction-processor
npm install
cd ../../..

cd lib/lambda/status-checker
npm install
cd ../../..
```

### Step 3: Update Configuration (Optional)

Edit `lib/tap-stack.ts` to customize:

```typescript
// Update SNS email endpoint
const snsStack = new SnsStack(this, 'SnsStack', {
  environmentSuffix,
  emailEndpoint: 'your-email@example.com', // Replace with your email
});
```

### Step 4: Synthesize CDKTF

```bash
cdktf synth
```

This will generate Terraform configuration files in `cdktf.out/stacks/`.

### Step 5: Deploy Infrastructure

```bash
# Deploy all stacks
cdktf deploy

# Or deploy with auto-approve (skip confirmation)
cdktf deploy --auto-approve
```

Deployment typically takes 5-10 minutes. You'll see outputs including:
- `api_url`: Your API Gateway URL
- `dynamodb_table_name`: DynamoDB table name
- `sqs_queue_url`: SQS queue URL
- `sns_topic_arn`: SNS topic ARN

### Step 6: Confirm SNS Subscription

Check your email inbox for an SNS subscription confirmation email and click the confirmation link.

### Step 7: Verify Deployment

```bash
# Export API URL from outputs
export API_URL="<api_url_from_outputs>"

# Test transaction creation
curl -X POST $API_URL/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "card_last_four": "1234",
    "merchant_id": "merchant-123"
  }'

# Save the transaction_id from the response
export TRANSACTION_ID="<transaction_id_from_response>"

# Test status check
curl "$API_URL/status?transaction_id=$TRANSACTION_ID"
```

## Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tap-stack.unit.test.ts
```

### Integration Tests

```bash
# Set required environment variables
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev

# Run integration tests
npm run test:integration
```

### Component Tests

```bash
# Run API Gateway component tests
npm test -- api-gateway-stack.component.test.ts

# Run CloudWatch component tests
npm test -- cloudwatch-stack.component.test.ts
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT_SUFFIX` | Unique suffix for resource naming | `dev` | No |
| `AWS_REGION` | AWS region for deployment | `us-east-1` | No |
| `TERRAFORM_STATE_BUCKET` | S3 bucket for Terraform state | `iac-rlhf-tf-states` | No |
| `TERRAFORM_STATE_BUCKET_REGION` | Region for state bucket | `us-east-1` | No |

### Lambda Configuration

Edit `lib/lambda-stack.ts`:

```typescript
// Adjust memory allocation
memorySize: 512, // Increase for more CPU/memory (128-10240 MB)

// Adjust reserved concurrent executions
reservedConcurrentExecutions: 10, // Adjust based on expected load

// Adjust timeout
timeout: 30, // Maximum: 900 seconds (15 minutes)
```

### API Gateway Throttling

Edit `lib/api-gateway-stack.ts`:

```typescript
// Adjust throttling limits
throttlingBurstLimit: 10000, // Maximum burst requests
throttlingRateLimit: 10000,  // Sustained requests per second
```

### DynamoDB Configuration

Edit `lib/dynamodb-stack.ts`:

```typescript
// Change to provisioned capacity (for predictable workloads)
billingMode: 'PROVISIONED',
readCapacity: 5,
writeCapacity: 5,
```

## Security & Compliance

### Encryption

- **Data at Rest**: All data encrypted with KMS customer-managed keys
- **Data in Transit**: HTTPS for API Gateway, TLS for AWS SDK
- **Key Management**: Automatic key rotation enabled

### Network Security

- **VPC Isolation**: Lambda functions in private subnets
- **No Internet Access**: Lambda uses VPC endpoints for AWS services
- **Security Groups**: Controlled outbound access only
- **No NAT Gateway**: Cost-optimized design using VPC endpoints

### IAM Security

- **Least Privilege**: Each Lambda has minimum required permissions
- **No Wildcard Resources**: CloudWatch Logs resources restricted to `/aws/lambda/*` (except EC2 network interfaces and X-Ray where wildcards are AWS best practice)
- **Separate Roles**: Transaction processor and status checker have distinct roles

### PCI DSS Considerations

This infrastructure addresses several PCI DSS requirements:

- **Requirement 3** (Protect Stored Cardholder Data):
  - Only stores last 4 digits of card number
  - No full PAN, CVV, or PIN stored
  - KMS encryption for data at rest

- **Requirement 4** (Encrypt Transmission):
  - HTTPS for API Gateway
  - TLS for all AWS service communication

- **Requirement 10** (Track and Monitor Access):
  - CloudWatch Logs with 30-day retention
  - X-Ray tracing for audit trails
  - SQS queue for audit messages

- **Requirement 11** (Regularly Test Security):
  - Comprehensive test suite included
  - CloudWatch alarms for error detection

### Security Best Practices Implemented

- Sensitive data logging redacted (no full card numbers in logs)
- X-Ray tracing for security monitoring
- CloudWatch alarms for anomaly detection
- Principle of least privilege in IAM policies
- Encrypted storage and transmission
- VPC isolation of compute resources
- KMS key rotation enabled

### Additional Security Recommendations for Production

- Implement AWS WAF on API Gateway for protection against common web exploits
- Add API Gateway throttling per API key/client for DoS protection
- Use AWS Secrets Manager for sensitive configuration
- Implement DynamoDB backup/restore procedures
- Enable AWS CloudTrail for API audit logging
- Conduct regular penetration testing
- Implement API key authentication or OAuth 2.0
- Add request/response logging with sensitive data redaction
- Set up AWS Config for compliance monitoring

## Monitoring & Observability

### CloudWatch Dashboard

Access your dashboard:
1. Log into AWS Console
2. Navigate to CloudWatch → Dashboards
3. Select `payment-dashboard-{environmentSuffix}`

**Metrics Available**:
- Lambda invocations (transaction processor and status checker)
- Lambda errors (transaction processor and status checker)
- DynamoDB consumed capacity units (read and write)

### CloudWatch Alarms

**Active Alarms**:
- `transaction-processor-errors-{environmentSuffix}`: Triggers when errors > 1
- `status-checker-errors-{environmentSuffix}`: Triggers when errors > 1

**Alarm Actions**:
- Sends notification to SNS topic
- Email notification to configured address

### X-Ray Tracing

Access X-Ray traces:
1. Log into AWS Console
2. Navigate to X-Ray → Service map
3. View end-to-end request traces

**Use Cases**:
- Identify performance bottlenecks
- Debug errors and exceptions
- Analyze latency across services
- Security audit trails

### Log Analysis

```bash
# View Lambda logs
aws logs tail /aws/lambda/transaction-processor-dev --follow

# Search for errors in last hour
aws logs filter-log-events \
  --log-group-name /aws/lambda/transaction-processor-dev \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"

# Get Lambda invocation metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=transaction-processor-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Troubleshooting

### Lambda VPC Connectivity Issues

**Symptom**: Lambda functions timeout or cannot access DynamoDB/S3

**Solution**:
1. Verify VPC endpoints are created:
   ```bash
   aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"
   ```
2. Check private subnet route tables have VPC endpoint routes
3. Verify security group allows outbound traffic
4. Check Lambda function is deployed in private subnets

### DynamoDB Access Denied

**Symptom**: Lambda returns 403 or AccessDenied error

**Solution**:
1. Verify IAM role has required permissions:
   ```bash
   aws iam get-role-policy \
     --role-name transaction-processor-role-dev \
     --policy-name transaction-processor-policy-dev
   ```
2. Ensure KMS key policy allows Lambda role to decrypt
3. Check DynamoDB table ARN matches in IAM policy

### API Gateway 5xx Errors

**Symptom**: API returns 500 or 502 errors

**Solution**:
1. Check Lambda CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/transaction-processor-dev --since 5m
   ```
2. Verify Lambda execution role has correct permissions
3. Check Lambda timeout settings (default: 30 seconds)
4. Verify Lambda function is deployed and not in failed state

### SQS Messages Not Being Processed

**Symptom**: Messages accumulate in SQS queue

**Solution**:
- The SQS queue is for audit trail/async logging and currently has no consumer
- This is by design in the current implementation
- To process messages, add a Lambda consumer or document as future enhancement

### CloudWatch Alarms Not Triggering

**Symptom**: No alarm notifications despite errors

**Solution**:
1. Verify SNS subscription is confirmed (check email)
2. Check alarm state:
   ```bash
   aws cloudwatch describe-alarms \
     --alarm-names transaction-processor-errors-dev
   ```
3. Verify alarm threshold and evaluation periods are appropriate
4. Check SNS topic policy allows CloudWatch to publish

### Deployment Failures

**Common Issues**:

1. **Insufficient IAM Permissions**: Ensure AWS credentials have all required permissions
2. **Resource Limits**: Check AWS service quotas (Lambda concurrent executions, VPCs, etc.)
3. **Terraform State Lock**: If state is locked, wait or manually unlock:
   ```bash
   cdktf destroy --force
   ```
4. **Duplicate Resource Names**: Ensure `ENVIRONMENT_SUFFIX` is unique

## Cost Optimization

### Current Cost-Saving Features

- **Serverless Architecture**: Pay only for actual usage
- **VPC Endpoints**: $0.01/GB instead of NAT Gateway ($0.045/GB + $0.045/hour)
- **DynamoDB On-Demand**: No idle capacity costs
- **Lambda Reserved Concurrency**: Controlled costs
- **CloudWatch Logs 30-day Retention**: Automatic cleanup
- **SQS 14-day Retention**: Automatic message cleanup

### Estimated Monthly Costs (Moderate Usage)

**Assumptions**: 1 million transactions/month, 100 status checks/sec

| Service | Monthly Cost |
|---------|-------------|
| Lambda (transaction processor) | ~$20 |
| Lambda (status checker) | ~$5 |
| API Gateway | ~$3.50 |
| DynamoDB (on-demand) | ~$15 |
| SQS | ~$1 |
| SNS | ~$0.50 |
| VPC Endpoints | ~$15 |
| CloudWatch | ~$5 |
| KMS | ~$1 |
| X-Ray | ~$2 |
| **Total** | **~$68/month** |

### Cost Optimization Tips

1. **Reduce Lambda Memory**: If CPU usage is low, reduce from 512MB to 256MB
2. **Adjust Log Retention**: Reduce from 30 days to 7 days if acceptable
3. **Use DynamoDB Reserved Capacity**: For predictable workloads
4. **Optimize VPC Endpoints**: Remove S3 endpoint if not needed
5. **Batch SQS Messages**: Reduce SQS API calls
6. **Disable X-Ray**: In non-production environments
7. **Use AWS Budgets**: Set cost alerts

## Cleanup

### Destroy All Resources

```bash
# Destroy infrastructure
cdktf destroy

# Confirm when prompted
# Type 'yes' to proceed
```

### Manual Cleanup (if needed)

If `cdktf destroy` fails, manually delete resources in this order:

1. Lambda Functions
2. API Gateway
3. CloudWatch Log Groups
4. CloudWatch Alarms
5. CloudWatch Dashboard
6. DynamoDB Table
7. SQS Queue
8. SNS Topic and Subscriptions
9. IAM Roles and Policies
10. VPC Endpoints
11. Security Groups
12. Subnets
13. Route Tables
14. Internet Gateway
15. VPC
16. KMS Key (schedule for deletion)

### Verify Cleanup

```bash
# Check for remaining Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `transaction-processor`) || starts_with(FunctionName, `status-checker`)].FunctionName'

# Check for remaining DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `payment-transactions`)]'

# Check for remaining VPCs
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=payment-vpc-*"
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue in the repository.

## Additional Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Best Practices](https://docs.aws.amazon.com/apigateway/latest/developerguide/best-practices.html)
- [PCI DSS on AWS](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
