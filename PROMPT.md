# Task: Serverless Fraud Detection Pipeline

## Problem Statement

Create a Pulumi Python program to deploy a serverless fraud detection pipeline. The configuration must:

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

Expected output: A fully functional serverless pipeline that accepts transaction data via API, stores it in DynamoDB, analyzes it for fraud patterns, queues suspicious transactions, and sends email notifications for potential fraud cases.

## Use Case

A fintech startup needs to process millions of daily transaction records for fraud detection. The system must handle variable loads, process events in near real-time, and maintain strict data privacy requirements while keeping operational costs minimal.

## Infrastructure Requirements

Serverless infrastructure deployed in us-east-1 for GDPR compliance. Core services include Lambda for compute, API Gateway for REST endpoints, DynamoDB for transaction storage, SQS for message queuing, EventBridge for event routing, and SNS for notifications. Requires Pulumi 3.x with Python 3.8+, AWS CLI configured with appropriate credentials. No VPC required for most components except data processing Lambdas which need private subnet access. KMS customer-managed keys for encryption at rest.

## Constraints

- Dead letter queues must retain messages for 14 days
- Lambda functions must have environment variables encrypted with a customer-managed KMS key
- All Lambda functions must use Python 3.11 runtime
- All IAM roles must follow principle of least privilege with no wildcard permissions
- Lambda functions processing sensitive data must run inside a VPC
- API Gateway must implement request throttling at 1000 requests per second
- DynamoDB tables must use on-demand billing mode
- Lambda functions must have reserved concurrent executions of at least 100
- EventBridge rules must use event pattern matching, not scheduled expressions
- SQS queues must have visibility timeout of exactly 6 minutes
