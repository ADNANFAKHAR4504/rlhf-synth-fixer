# Payment Processing Environment - Pulumi TypeScript Implementation

Complete implementation of payment processing infrastructure using **Pulumi with TypeScript** deployed to **ap-southeast-1** region.

## Architecture

The infrastructure includes:
- VPC with 3 availability zones (public and private subnets)
- API Gateway REST API with Lambda integration
- 3 Lambda functions (payment-validator, payment-processor, payment-notifier)
- DynamoDB table with KMS encryption
- S3 bucket for audit logs with versioning
- SNS topic for notifications
- CloudWatch dashboard for monitoring
- VPC endpoints for S3 and DynamoDB
- NAT Gateways for Lambda connectivity

All resources use `environmentSuffix` for unique naming across PR environments.

## Generated Files

The implementation is organized into Component Resource stacks:

- `lib/network-stack.ts` - VPC, subnets, NAT gateways, VPC endpoints, Flow Logs
- `lib/kms-stack.ts` - Customer-managed KMS keys for encryption
- `lib/storage-stack.ts` - DynamoDB table and S3 audit bucket
- `lib/notification-stack.ts` - SNS topic for notifications
- `lib/lambda-stack.ts` - Lambda functions with IAM roles and CloudWatch alarms
- `lib/apigateway-stack.ts` - REST API with throttling
- `lib/monitoring-stack.ts` - CloudWatch dashboard
- `lib/tap-stack.ts` - Main orchestration component
- `bin/tap.ts` - Entry point with exports
- `lambda-packages/payment-validator/index.js` - Validator Lambda code
- `lambda-packages/payment-processor/index.js` - Processor Lambda code
- `lambda-packages/payment-notifier/index.js` - Notifier Lambda code

## Key Implementation Details

### Component Resource Pattern

All infrastructure organized as Pulumi ComponentResources for modularity and reusability.

### Networking

- VPC CIDR: 10.0.0.0/16
- 3 public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- 3 private subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- NAT Gateway in each public subnet
- VPC endpoints for S3 and DynamoDB (Gateway type)
- VPC Flow Logs to CloudWatch with 7-day retention

### Lambda Functions

All functions:
- Run in private subnets
- 512MB memory, 30-second timeout
- Reserved concurrent executions: 10
- CloudWatch Log Groups with 7-day retention
- IAM roles with 1-hour session duration
- Security group allowing outbound traffic only

**payment-validator**: Validates payment requests, checks for duplicates in DynamoDB
**payment-processor**: Stores transactions in DynamoDB, creates audit logs in S3
**payment-notifier**: Sends notifications via SNS

### API Gateway

- REST API with REGIONAL endpoint
- POST /payments endpoint
- Lambda proxy integration with payment-validator
- Throttling: 167 requests/second (~10,000/minute)
- Logging enabled

### Storage

**DynamoDB Table**:
- Name: `transactions-${environmentSuffix}`
- Partition key: transactionId (String)
- Sort key: timestamp (Number)
- On-demand billing mode
- Point-in-time recovery enabled
- KMS encryption with customer-managed key

**S3 Bucket**:
- Name: `payment-audit-logs-${environmentSuffix}`
- Versioning enabled
- Server-side encryption (AES256)
- Lifecycle policy: Archive to Glacier after 90 days
- Public access blocked

### Monitoring

CloudWatch Dashboard with 6 widgets:
1. Lambda Invocations (all 3 functions)
2. Lambda Errors (all 3 functions)
3. Lambda Duration (all 3 functions)
4. DynamoDB Capacity Units (read/write)
5. DynamoDB Errors (user/system)
6. Lambda Concurrent Executions

CloudWatch Alarms: One per Lambda function, triggers SNS on errors

### Security

- All Lambda functions in private subnets (no direct internet access)
- KMS customer-managed keys for DynamoDB encryption
- S3 server-side encryption
- IAM least-privilege roles
- Security groups with explicit rules
- VPC Flow Logs enabled
- API Gateway throttling
- Session policies with 1-hour duration

### Tagging

All resources tagged with:
- Environment: `${environmentSuffix}`
- Project: PaymentProcessing
- ManagedBy: Pulumi
- EnvironmentSuffix: `${environmentSuffix}`

## Deployment

```bash
# Install dependencies
npm install

# Configure Pulumi
pulumi config set aws:region ap-southeast-1
pulumi config set env <environment-suffix>
pulumi config set notificationEmail <email> # Optional

# Deploy
pulumi up
```

## Outputs

```typescript
export const apiUrl = stack.apiUrl;
export const auditBucketName = stack.auditBucketName;
export const dynamoTableName = stack.dynamoTableName;
export const dashboardUrl = stack.dashboardUrl;
```

## Testing the API

```bash
curl -X POST <api-url> \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 100.50,
    "currency": "USD",
    "customerEmail": "customer@example.com"
  }'
```

## Compliance

- PCI DSS compliant infrastructure
- Encryption at rest (KMS for DynamoDB, SSE for S3)
- Encryption in transit (HTTPS for API Gateway)
- Audit logging to S3 with versioning
- Point-in-time recovery for DynamoDB
- VPC Flow Logs for network monitoring

## Cost Optimization

- DynamoDB on-demand billing (pay per request)
- Lambda reserved concurrency prevents cold starts
- S3 lifecycle policy archives to Glacier after 90 days
- CloudWatch log retention limited to 7 days
- VPC endpoints reduce data transfer costs

## Infrastructure Destroyability

All resources are fully destroyable for CI/CD workflows:
- No DeletionPolicy: Retain
- No stateful resources requiring manual cleanup
- Secrets fetched from existing AWS Secrets Manager (not created by stack)
