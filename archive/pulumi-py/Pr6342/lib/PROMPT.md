# Task: Serverless Transaction Processing System

## Problem Statement

A fintech startup needs to process millions of daily transactions from various payment providers. They require a serverless architecture that can handle burst traffic during peak hours while maintaining PCI compliance. The system must validate transactions, detect fraud patterns, and store results for audit purposes.

## Requirements

Create a Pulumi Python program to deploy a serverless transaction processing system. The configuration must:

1. Create an API Gateway REST API with /transaction POST endpoint protected by API key authentication.
2. Deploy a Lambda function that validates incoming transactions against a DynamoDB table of merchant configurations.
3. Set up an SQS queue for valid transactions with visibility timeout of 300 seconds.
4. Create a second Lambda function triggered by SQS to perform fraud detection using pattern matching.
5. Store processed transactions in a DynamoDB table with partition key 'transaction_id' and sort key 'timestamp'.
6. Implement a third Lambda for failed transaction handling triggered by a separate DLQ.
7. Configure CloudWatch Log Groups with 30-day retention for all Lambda functions.
8. Set up SNS topic for alerting on fraud detection with email subscription.
9. Create CloudWatch dashboard displaying Lambda invocations, errors, and duration metrics.
10. Export API Gateway endpoint URL and CloudWatch dashboard URL as stack outputs.

## Infrastructure Specifications

Serverless infrastructure deployed in us-east-2 using AWS Lambda for transaction processing, API Gateway for REST endpoints, DynamoDB for transaction storage, and SQS for message queuing. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate credentials. VPC setup with private subnets across 3 AZs, VPC endpoints for AWS services to avoid internet routing. CloudWatch Logs for centralized logging, X-Ray for distributed tracing, and AWS WAF for API protection. KMS encryption required for all data storage.

## Constraints and Requirements

- Deploy all Lambda functions within a VPC using private subnets only
- Implement least-privilege IAM roles with condition keys for resource access
- Use KMS customer-managed keys for encrypting all data at rest
- Use DynamoDB with point-in-time recovery enabled and on-demand billing
- Implement X-Ray tracing for all Lambda functions and API Gateway
- Set up CloudWatch alarms for Lambda errors exceeding 1% error rate
- Configure Lambda functions with 512MB memory and 60-second timeout
- Use AWS Lambda with reserved concurrent executions set to 100 for the main processing function
- Implement dead letter queues for all SQS queues with a retention period of 14 days
- Configure API Gateway with AWS WAF integration using managed rule sets

## Expected Output

A fully deployed serverless architecture with three Lambda functions connected through SQS queues, API Gateway endpoint for transaction submission, DynamoDB tables for storage, and comprehensive monitoring through CloudWatch and X-Ray. The system should handle 1000+ transactions per second during peak loads.
