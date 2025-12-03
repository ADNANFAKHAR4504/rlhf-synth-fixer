# Payment Processing Infrastructure

This CDKTF TypeScript project deploys a complete payment processing environment on AWS, designed for high-throughput transaction processing with PCI DSS compliance considerations.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ architecture spanning 3 availability zones with public and private subnets
- **Compute**: Three Lambda functions for payment validation, processing, and notification
- **Storage**: DynamoDB for transaction data, S3 for audit logs
- **Networking**: NAT Gateways, VPC endpoints, Internet Gateway
- **Monitoring**: CloudWatch dashboards, alarms, and log groups
- **Notifications**: SNS topic for payment status updates
- **API**: API Gateway REST API for payment submission

## Prerequisites

- Node.js 18+ and npm
- Terraform CLI
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, Lambda, DynamoDB, S3, etc.

## Installation

```bash
npm install
```

## Configuration

The infrastructure uses the following environment variables:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: 'dev')
- `AWS_REGION`: Target region (default: 'us-east-2')
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket

## Deployment

### 1. Synthesize CDKTF

```bash
npm run get        # Generate provider bindings
cdktf synth        # Synthesize Terraform JSON
```

### 2. Deploy Infrastructure

```bash
cdktf deploy
```

The deployment will create all resources and output:
- API Gateway URL
- S3 bucket name
- DynamoDB table name
- CloudWatch dashboard URL
- Lambda function names

### 3. Verify Deployment

Run integration tests after deployment:

```bash
npm test
```

## Infrastructure Components

### VPC and Networking

- **CIDR**: 10.0.0.0/16
- **Availability Zones**: 3 (automatically selected)
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- **NAT Gateways**: One per availability zone for Lambda internet access
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB
- **Flow Logs**: Enabled for all traffic, sent to CloudWatch Logs

### Lambda Functions

#### 1. Payment Validator (`payment-validator`)
- **Purpose**: Validates incoming payment requests
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Features**: Input validation, DynamoDB write, SNS notification

#### 2. Payment Processor (`payment-processor`)
- **Purpose**: Processes validated payments
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Features**: Payment processing simulation, audit logging to S3, status updates

#### 3. Payment Notifier (`payment-notifier`)
- **Purpose**: Sends notifications for payment status changes
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Features**: Status-based notifications, SNS publishing

All Lambda functions:
- Run in private subnets (no direct internet access)
- Have reserved concurrent executions (10 per function)
- Include comprehensive error handling and CloudWatch logging
- Use IAM roles with least-privilege permissions

### DynamoDB Table

- **Table Name**: `transactions-{environmentSuffix}`
- **Partition Key**: `transactionId` (String)
- **Sort Key**: `timestamp` (Number)
- **Billing**: Pay-per-request (on-demand)
- **Encryption**: Customer-managed KMS key with automatic rotation
- **Backup**: Point-in-time recovery enabled

### S3 Bucket

- **Bucket Name**: `payment-audit-logs-{environmentSuffix}`
- **Encryption**: AWS-managed keys (AES256)
- **Versioning**: Enabled
- **Lifecycle**: 90-day transition to Glacier storage class
- **Public Access**: Blocked (all four settings)

### API Gateway

- **Type**: REST API
- **Endpoint**: `/payments` (POST method)
- **Integration**: Lambda proxy integration with payment-validator
- **Stage**: `prod`
- **Throttling**: 10,000 requests per minute rate limit

### CloudWatch Monitoring

#### Log Groups
- `/aws/lambda/payment-validator-{environmentSuffix}` (7-day retention)
- `/aws/lambda/payment-processor-{environmentSuffix}` (7-day retention)
- `/aws/lambda/payment-notifier-{environmentSuffix}` (7-day retention)
- `/aws/vpc/flow-logs-{environmentSuffix}` (7-day retention)

#### Alarms
- Lambda error rate monitoring (triggers SNS notification if errors exceed 1%)
- One alarm per Lambda function

#### Dashboard
- Lambda invocations metrics
- Lambda errors metrics
- DynamoDB read/write capacity metrics

### SNS Topic

- **Topic Name**: `payment-notifications-{environmentSuffix}`
- **Subscriptions**: Email (placeholder: payments-team@example.com)
- **Purpose**: Payment status notifications and error alerts

### Security

#### IAM Roles
- **Lambda Role**: Includes permissions for:
  - CloudWatch Logs (logging)
  - DynamoDB (read/write to transactions table)
  - S3 (write to audit bucket)
  - SNS (publish notifications)
  - EC2 (VPC network interface management)
  - KMS (encrypt/decrypt with customer-managed key)
- **Max Session Duration**: 1 hour (as per PCI DSS requirements)

#### Security Groups
- **Lambda Security Group**:
  - Egress: HTTPS (443) to 0.0.0.0/0
  - No ingress rules (Lambda doesn't need inbound access)

#### KMS
- **Key Rotation**: Enabled
- **Deletion Window**: 7 days
- **Alias**: `alias/dynamodb-{environmentSuffix}`

## API Usage

### Submit Payment

```bash
curl -X POST https://{api-id}.execute-api.us-east-2.amazonaws.com/prod/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "credit_card"
  }'
```

**Response:**
```json
{
  "message": "Payment validated successfully",
  "transactionId": "TXN-ABC123",
  "timestamp": 1234567890000,
  "status": "validated"
}
```

### Valid Payment Methods
- `credit_card`
- `debit_card`
- `bank_transfer`
- `digital_wallet`

### Supported Currencies
- USD, EUR, GBP, JPY, AUD

## Testing

### Unit Tests

```bash
npm run test:unit
```

Tests resource configurations, IAM policies, naming conventions, and infrastructure setup.

### Integration Tests

```bash
npm run test:integration
```

Tests deployed infrastructure using actual AWS SDK calls:
- VPC and networking verification
- DynamoDB read/write operations
- S3 operations
- Lambda invocations
- API Gateway endpoint testing
- End-to-end payment flow

**Coverage Target**: 90%+

## Cost Optimization

- **Serverless Architecture**: Lambda and DynamoDB on-demand minimize idle costs
- **VPC Endpoints**: Reduce NAT Gateway data transfer costs for S3/DynamoDB
- **CloudWatch Log Retention**: 7-day retention reduces storage costs
- **S3 Lifecycle**: 90-day archival to Glacier reduces storage costs

## Compliance Considerations

- **PCI DSS**: Private subnet compute, encryption at rest, audit logging
- **Encryption**: KMS for DynamoDB, AES256 for S3
- **Least Privilege**: IAM policies grant only necessary permissions
- **Monitoring**: CloudWatch alarms for anomaly detection
- **Audit Trail**: S3 audit logs with versioning

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured without deletion protection for easy cleanup.

## Troubleshooting

### Lambda Errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/payment-validator-{environmentSuffix} --follow
```

### DynamoDB Issues
Verify table status:
```bash
aws dynamodb describe-table --table-name transactions-{environmentSuffix}
```

### API Gateway Errors
Check API Gateway logs in CloudWatch or enable detailed logging in the stage settings.

### VPC Connectivity
Verify NAT Gateway status and route tables if Lambda functions can't reach external services.

## Project Structure

```
.
├── bin/
│   └── tap.ts                    # CDK App entry point
├── lib/
│   ├── tap-stack.ts              # Main stack wrapper
│   ├── payment-stack.ts          # Payment infrastructure stack
│   └── lambda/                   # Lambda function code
│       ├── payment-validator/
│       ├── payment-processor/
│       └── payment-notifier/
├── test/
│   ├── payment-stack.unit.test.ts
│   ├── payment-stack.int.test.ts
│   └── tap-stack.unit.test.ts
├── cdktf.json                    # CDKTF configuration
├── package.json
└── README.md
```

## Outputs Reference

After deployment, the following outputs are available:

| Output Name | Description | Example |
|-------------|-------------|---------|
| `api-gateway-url` | Payment API endpoint | `https://abc123.execute-api.us-east-2.amazonaws.com/prod/payments` |
| `s3-bucket-name` | Audit logs bucket | `payment-audit-logs-dev` |
| `dynamodb-table-name` | Transactions table | `transactions-dev` |
| `cloudwatch-dashboard-url` | Metrics dashboard | `https://console.aws.amazon.com/cloudwatch/...` |
| `vpc-id` | VPC identifier | `vpc-abc123` |
| `validator-function-name` | Validator Lambda name | `payment-validator-dev` |
| `processor-function-name` | Processor Lambda name | `payment-processor-dev` |
| `notifier-function-name` | Notifier Lambda name | `payment-notifier-dev` |

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Review integration test results
3. Verify all required environment variables are set
4. Ensure AWS credentials have necessary permissions

## License

This infrastructure code is provided as-is for payment processing deployment.
