# Serverless Fraud Detection System - Pulumi Python Implementation

Complete implementation using Pulumi with Python for a serverless fraud detection system deployed to us-east-2 region.

## Architecture Overview

- API Gateway REST API with POST /transactions and GET /transactions/{id} endpoints
- Three Lambda functions: transaction processor, fraud analyzer, and report generator  
- DynamoDB table with streams for real-time processing
- S3 bucket for report storage with encryption
- CloudWatch logging and alarms
- IAM roles with least privilege access

## Implementation Files

All code uses **Pulumi with Python** (pulumi_aws SDK).

### File: lib/tap_stack.py

Complete Pulumi Python stack for fraud detection system.

### File: lib/lambda/transaction_processor.py

Lambda handler for processing transaction submissions (POST) and retrievals (GET).

### File: lib/lambda/fraud_analyzer.py

Lambda handler triggered by DynamoDB streams to analyze transactions for fraud patterns.

### File: lib/lambda/report_generator.py

Lambda handler triggered daily by EventBridge to generate comprehensive fraud reports.

### File: tap.py

Entry point that instantiates the TapStack with environment suffix.

### File: Pulumi.yaml

Pulumi project configuration specifying Python runtime and tap.py as main entry point.

## Key Features Implemented

1. **API Gateway Configuration**
   - REST API with throttling at 1000 req/s
   - POST /transactions endpoint for submission
   - GET /transactions/{id} endpoint for retrieval

2. **Lambda Functions (Python 3.11)**
   - Reserved concurrency: 100 per function
   - Timeout: 300 seconds (5 minutes)
   - VPC connectivity for secure processing
   - Environment variables for region and resource names

3. **DynamoDB Table**
   - Name: transactions-{environmentSuffix}
   - Partition key: transactionId (string)
   - Sort key: timestamp (number)
   - Billing mode: PAY_PER_REQUEST (on-demand)
   - Streams enabled with NEW_AND_OLD_IMAGES

4. **S3 Bucket**
   - Name: fraud-reports-{environmentSuffix}
   - Server-side encryption: AES256
   - Lifecycle policies: STANDARD_IA (30 days), GLACIER (90 days)

5. **IAM Roles**
   - Transaction processor: DynamoDB read/write access
   - Fraud analyzer: DynamoDB streams, table updates, S3 write
   - Report generator: DynamoDB scan/query, S3 write
   - VPC execution policies for all functions
   - Least privilege access principles

6. **CloudWatch Monitoring**
   - Log groups for each Lambda with 7-day retention
   - Error alarms for >1% error rate threshold
   - INFO level logging for API Gateway

7. **Event-Driven Processing**
   - DynamoDB streams trigger fraud analyzer
   - EventBridge daily schedule (midnight UTC) triggers report generator

8. **Resource Tagging**
   - Environment: {environmentSuffix}
   - CostCenter: fraud-detection
   - ManagedBy: Pulumi

## Stack Outputs

- api_url: HTTPS endpoint for API Gateway (POST /transactions, GET /transactions/{id})
- bucket_name: S3 bucket for fraud reports
- table_name: DynamoDB table for transactions

## Deployment

```bash
# Install dependencies
pip install pulumi pulumi-aws

# Deploy
pulumi up

# Test
API_URL=$(pulumi stack output api_url)
curl -X POST "$API_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-001","amount":1500.00,"currency":"USD","customerId":"cust-12345"}'

# Retrieve
curl "$API_URL/transactions/txn-001"

# Destroy
pulumi destroy
```

## Compliance

All requirements met:
- Lambda reserved concurrency: 100 per function
- DynamoDB billing: PAY_PER_REQUEST (on-demand)
- Lambda runtime: Python 3.11
- API Gateway throttling: 1000 req/s
- Lambda timeout: 300 seconds
- DynamoDB streams: Enabled
- Resource tags: Environment and CostCenter
- CloudWatch logs: 7-day retention
- Error alarms: >1% threshold
- Region: us-east-2
- Platform: **Pulumi with Python**
