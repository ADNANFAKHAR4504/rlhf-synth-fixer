# Serverless Transaction Processing Pipeline

A serverless transaction processing pipeline built with AWS CDK, Step Functions, Lambda, and DynamoDB.

## Architecture

This solution processes financial transactions through three sequential validation steps:

1. **Fraud Detection** - Analyzes transactions for fraudulent patterns
2. **Compliance Check** - Validates regulatory compliance requirements
3. **Risk Assessment** - Calculates overall risk score

### AWS Services Used

- **AWS Lambda**: Three Node.js 18.x functions (512MB, 60s timeout)
- **AWS Step Functions**: Orchestrates workflow with Map state for batch processing
- **Amazon DynamoDB**: Two tables (transactions-raw, transactions-processed) with on-demand billing
- **Amazon CloudWatch**: Logs with 30-day retention for execution history
- **AWS IAM**: Managed roles and permissions

### Key Features

- Parallel batch processing using Step Functions Map state
- Error handling with exponential backoff (2s, 4s, 8s intervals)
- Three retry attempts for each Lambda invocation
- Full execution logging to CloudWatch
- Resource tagging: Environment=production, Application=transaction-processor
- Unique resource naming with environmentSuffix

## Prerequisites

- Node.js 18.x or later
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- TypeScript

## Installation

```bash
npm install
```

## Deployment

Deploy with environment suffix:

```bash
cdk deploy -c environmentSuffix=prod
```

Or use default (dev):

```bash
cdk deploy
```

## Testing the Pipeline

Create a test execution with sample transactions:

```bash
aws stepfunctions start-execution \
  --state-machine-arn <STATE_MACHINE_ARN> \
  --input '{
    "transactions": [
      {
        "transactionId": "txn-001",
        "amount": 1500,
        "currency": "USD"
      },
      {
        "transactionId": "txn-002",
        "amount": 15000,
        "currency": "USD"
      }
    ]
  }'
```

## Monitoring

View execution logs in CloudWatch:

```bash
aws logs tail /aws/vendedlogs/states/transaction-processor-<environmentSuffix> --follow
```

## DynamoDB Tables

### transactions-raw
- Partition Key: transactionId (String)
- Billing: On-demand
- Purpose: Store incoming raw transactions

### transactions-processed
- Partition Key: transactionId (String)
- Billing: On-demand
- Purpose: Store processed transactions with validation results

## Lambda Functions

### fraud-detector
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Detects fraudulent transactions (flags amounts > $10,000)

### compliance-checker
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Validates compliance (reviews amounts > $5,000)

### risk-assessor
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Calculates final risk score (LOW/MEDIUM/HIGH)

## Error Handling

Each Lambda invocation includes:
- 3 retry attempts
- Exponential backoff starting at 2 seconds
- Backoff rate: 2x (2s → 4s → 8s)

## Cleanup

Remove all resources:

```bash
cdk destroy -c environmentSuffix=<your-suffix>
```

## Resource Tagging

All resources tagged with:
- Environment: production
- Application: transaction-processor

## Outputs

After deployment, you'll receive:
- State Machine ARN
- Transactions Raw Table Name
- Transactions Processed Table Name
