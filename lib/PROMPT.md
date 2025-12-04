# Serverless Fraud Detection Pipeline

## Platform and Language
**MANDATORY:** Use **CDKTF with Python** for this infrastructure

## Task Overview
Create a CDKTF Python program to deploy a serverless fraud detection pipeline. The configuration must:

1. Create an API Gateway REST API with /transactions POST endpoint that triggers a Lambda function.
2. Set up a DynamoDB table named 'transactions' with partition key 'transaction_id' (string) and sort key 'timestamp' (number).
3. Configure the API Lambda to validate incoming transactions and write them to DynamoDB.
4. Create an EventBridge rule that captures DynamoDB stream records when items are inserted.
5. Deploy a fraud detection Lambda triggered by the EventBridge rule that analyzes transactions.
6. Set up an SQS queue for suspicious transactions with a dead letter queue for failed processing.
7. Configure the fraud detection Lambda to send suspicious transactions to the SQS queue.
8. Create a notification Lambda that polls the SQS queue and sends alerts via SNS topic.
9. Deploy an SNS topic with email subscription endpoint for fraud alerts.
10. Implement proper IAM roles and policies for each Lambda function with minimal required permissions.
11. Add CloudWatch log groups for all Lambda functions with 7-day retention.
12. Configure X-Ray tracing for all Lambda functions and API Gateway.

## Expected Output
A fully functional serverless pipeline that accepts transaction data via API, stores it in DynamoDB, analyzes it for fraud patterns, queues suspicious transactions, and sends email notifications for potential fraud cases.

## Business Context
A fintech startup needs to process millions of daily transaction records for fraud detection. The system must handle variable loads, process events in near real-time, and maintain strict data privacy requirements while keeping operational costs minimal.

## Technical Environment
Serverless infrastructure deployed in us-east-1 for GDPR compliance. Core services include Lambda for compute, API Gateway for REST endpoints, DynamoDB for transaction storage, SQS for message queuing, EventBridge for event routing, and SNS for notifications. Requires Pulumi 3.x with Python 3.8+, AWS CLI configured with appropriate credentials. No VPC required for most components except data processing Lambdas which need private subnet access. KMS customer-managed keys for encryption at rest.

## Specific Constraints

1. Dead letter queues must retain messages for 14 days
2. Lambda functions must have environment variables encrypted with a customer-managed KMS key
3. All Lambda functions must use Python 3.11 runtime
4. All IAM roles must follow principle of least privilege with no wildcard permissions
5. Lambda functions processing sensitive data must run inside a VPC
6. API Gateway must implement request throttling at 1000 requests per second
7. DynamoDB tables must use on-demand billing mode
8. Lambda functions must have reserved concurrent executions of at least 100
9. EventBridge rules must use event pattern matching, not scheduled expressions
10. SQS queues must have visibility timeout of exactly 6 minutes

## Critical Requirements

### Resource Naming
- ALL named resources MUST include `environment_suffix` parameter
- Pattern: `resource-name-${environment_suffix}`
- Example: `transactions-table-${environment_suffix}`

### Destroyability
- NO DeletionPolicy: Retain or removal_policy = RemovalPolicy.RETAIN
- NO deletion_protection = true
- All resources must be fully destroyable for CI/CD testing

### AWS Services
Must include:
- API Gateway (REST API)
- Lambda (4 functions: API handler, fraud detection, notification, and any support functions)
- DynamoDB (transactions table with stream enabled)
- EventBridge (rule for DynamoDB stream events)
- SQS (main queue and dead letter queue)
- SNS (topic for fraud alerts)
- CloudWatch (log groups with 7-day retention)
- X-Ray (tracing enabled)
- KMS (customer-managed key for encryption)
- IAM (roles and policies)

### Security
- Implement least privilege IAM policies
- Enable encryption at rest using KMS
- Enable encryption in transit
- No wildcard permissions in IAM policies
- VPC configuration for Lambda functions processing sensitive data

### Monitoring & Observability
- CloudWatch log groups for all Lambda functions
- 7-day log retention
- X-Ray tracing enabled for all Lambda functions and API Gateway
- CloudWatch alarms for critical metrics (optional but recommended)

## Testing Requirements
The infrastructure must:
- Deploy successfully in us-east-1
- Support full end-to-end transaction flow from API to notifications
- Be fully testable with unit and integration tests
- Be completely destroyable after testing

## AWS Services Used
- API Gateway
- Lambda
- DynamoDB
- EventBridge
- SQS
- SNS
- CloudWatch Logs
- X-Ray
- KMS
- IAM
- VPC (for sensitive data processing Lambdas)
- EC2 (for VPC resources: subnets, security groups, etc.)
