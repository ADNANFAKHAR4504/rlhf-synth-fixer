# Infrastructure Requirements

**Platform**: CDKTF (Cloud Development Kit for Terraform)
**Language**: Python

## Problem Statement

Create a Terraform configuration to deploy a serverless fraud detection system for processing financial transactions. The configuration must:

1. Create a DynamoDB table named 'transactions' with partition key 'transaction_id' (string) and sort key 'timestamp' (number), with on-demand billing and streams enabled.

2. Create a DynamoDB table named 'fraud_scores' with partition key 'transaction_id' (string) and TTL enabled on 'expiry' attribute.

3. Deploy a Lambda function 'transaction-processor' that reads from the transactions table stream with 512MB memory and 60-second timeout.

4. Deploy a Lambda function 'fraud-scorer' invoked by transaction-processor with 1024MB memory and 120-second timeout.

5. Create an API Gateway REST API with POST endpoint /transactions that triggers transaction ingestion.

6. Configure SQS dead letter queues for both Lambda functions with 5 retry attempts.

7. Set up SNS topic 'fraud-alerts' that fraud-scorer publishes to when score exceeds 0.8.

8. Implement CloudWatch alarms for Lambda errors exceeding 1% error rate.

9. Create IAM roles with minimal permissions for each Lambda to access only required resources.

10. Configure API Gateway with 1000 requests per second steady-state limit and 2000 burst limit.

11. Set reserved concurrent executions to 100 for transaction-processor and 50 for fraud-scorer.

12. Enable X-Ray tracing for all Lambda functions and API Gateway.

## Business Context

A fintech startup needs to build a real-time fraud detection system that processes transaction events, analyzes patterns, and stores results for compliance reporting. The system must handle variable transaction volumes efficiently while maintaining sub-second response times for fraud scoring.

## Expected Infrastructure

Serverless fraud detection infrastructure deployed in us-east-1 using DynamoDB for transaction storage with streams enabled, Lambda functions for processing logic, API Gateway REST API for transaction ingestion, SQS for dead letter queues, and SNS for alert notifications. Requires Terraform 1.5+ with HCL syntax. No VPC required as all services are serverless. IAM roles with least privilege access for each Lambda function. CloudWatch Logs for all Lambda execution logs with 7-day retention.

## Critical Requirements

- All resource names MUST include environmentSuffix parameter
- All resources MUST be destroyable (no retention policies)
- Lambda functions MUST be compatible with Node.js 18+ runtime
- IAM roles MUST follow least privilege principle
- CloudWatch Logs MUST have 7-day retention
- X-Ray tracing MUST be enabled on all Lambda functions and API Gateway
- Reserved concurrent executions MUST be configured as specified
- DynamoDB tables MUST use on-demand billing
- API Gateway MUST have rate limiting configured as specified
