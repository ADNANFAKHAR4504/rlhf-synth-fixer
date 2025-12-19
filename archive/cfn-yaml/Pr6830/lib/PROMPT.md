# Task: AWS CloudFormation

## Problem Statement

Create a CloudFormation template to deploy a serverless transaction validation system.

MANDATORY REQUIREMENTS (Must complete):

1. Create a Lambda function named 'TransactionProcessor' with arm64 architecture and 1024MB memory (CORE: Lambda)
2. Configure DynamoDB table 'TransactionRecords' with partition key 'transactionId' and sort key 'timestamp' (CORE: DynamoDB)
3. Add a global secondary index 'StatusIndex' on the DynamoDB table with partition key 'status' and projected attributes 'transactionId', 'amount', 'timestamp'
4. Create an SQS queue 'TransactionQueue' with 14-day message retention and visibility timeout of 6 times the Lambda timeout
5. Configure the Lambda function to be triggered by the SQS queue with batch size of 10
6. Create a customer-managed KMS key for encrypting Lambda environment variables
7. Implement IAM role for Lambda with permissions to read/write DynamoDB, receive/delete SQS messages, and use KMS key
8. Add CloudFormation Condition 'IsProduction' based on parameter 'Environment' to conditionally create a DLQ

OPTIONAL ENHANCEMENTS (If time permits):
 Add SNS topic for fraud alerts with email subscription (OPTIONAL: SNS) - enables real-time alerting
 Create API Gateway REST API for manual transaction submission (OPTIONAL: API Gateway) - improves testing capabilities
 Add CloudWatch dashboard with Lambda and DynamoDB metrics (OPTIONAL: CloudWatch) - enhances monitoring

Expected output: A complete CloudFormation YAML template that deploys all mandatory infrastructure components with proper IAM permissions, encryption, and conditional resources based on environment.

## Background

A fintech startup needs a serverless event processing system to handle real-time transaction notifications from multiple payment providers. The system must process webhook events, validate transactions against fraud rules, and store results for compliance reporting.

## Environment

Deploy serverless infrastructure in ap-southeast-1 region for transaction processing. Core services include Lambda functions for event processing, DynamoDB for transaction storage and fraud rule lookups, SNS for alert notifications, and SQS for reliable message queuing. Infrastructure spans 3 availability zones with encryption at rest using customer-managed KMS keys. Requires AWS CLI configured with appropriate permissions, CloudFormation YAML knowledge, and understanding of Lambda event sources. No VPC required as all services are managed.

## Constraints

Use Lambda reserved concurrent executions of exactly 100 for the main processor | DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled | Lambda functions must use AWS Graviton2 (arm64) architecture for cost optimization | All Lambda environment variables must be encrypted with a customer-managed KMS key | DynamoDB global secondary indexes must project only the attributes explicitly used in queries | Lambda functions must have a maximum timeout of 5 minutes and memory of 1024MB | Use CloudFormation Conditions to deploy DLQ only in production environment | All IAM policies must specify exact resource ARNs without wildcards
