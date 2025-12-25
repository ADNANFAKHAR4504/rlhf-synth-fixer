Hey team,

We need to build a serverless webhook processing system for cryptocurrency transactions that can handle real-time processing during market volatility. This is for a financial technology startup that needs to process transaction webhooks for compliance monitoring. The business requires sub-second processing times while maintaining full audit trails for regulatory compliance.

The challenge here is handling variable traffic spikes during market volatility without breaking the bank. We need to process BTC, ETH, and USDT transactions through dedicated webhook endpoints, validate and store them, and provide comprehensive monitoring. The system must be production-ready with proper error handling, distributed tracing, and cost controls in place.

## What we need to build

Create a serverless webhook processing system using CloudFormation with YAML for cryptocurrency transaction compliance monitoring.

## Core Architecture Flow

API Gateway receives POST requests at webhook endpoints that trigger Lambda functions for transaction validation. Lambda queries DynamoDB to check for duplicate transactions, then writes validated transaction records to DynamoDB table. For asynchronous processing, Lambda publishes messages to SQS queue that triggers another Lambda for background compliance checks. Lambda connects to CloudWatch Logs for audit trails and uses X-Ray to trace the full request flow from API Gateway through Lambda to DynamoDB and SQS. KMS encrypts Lambda environment variables containing API keys and secrets. IAM execution role grants Lambda specific permissions to write to DynamoDB table, publish to SQS queue, write to CloudWatch Logs, and decrypt KMS keys.

### Detailed Requirements

API Gateway REST API with POST endpoint at webhook path supporting BTC, ETH, and USDT currency parameters. Request validation using JSON schema for webhook payload structure. Usage plans with 1000 requests per day limit for each API key. X-Ray tracing enabled for distributed tracing.

Lambda function with Python 3.11 runtime for transaction validation and processing. 1GB memory allocation with 60-second timeout. Reserved concurrency of exactly 50 to prevent runaway costs. Dead letter queue configuration with maxReceiveCount of 3. X-Ray tracing enabled. Environment variables encrypted using dedicated KMS key.

DynamoDB table for transaction storage with partition key transactionId and sort key timestamp. Point-in-time recovery enabled. Encryption using AWS managed keys. Lambda reads from this table to check duplicates and writes new transactions.

SQS standard queue with visibility timeout of 300 seconds for asynchronous processing. Dead letter queue for failed messages with 14 days retention. Lambda publishes to queue after writing to DynamoDB.

IAM execution role with least privilege permissions. Lambda role grants dynamodb:GetItem and dynamodb:PutItem on specific DynamoDB table ARN, sqs:SendMessage on specific SQS queue ARN, logs:CreateLogStream and logs:PutLogEvents on specific log group ARN, and kms:Decrypt on specific KMS key ARN.

CloudWatch Log Groups with 30 days retention for compliance. Metric filters to count transactions by currency type.

KMS customer managed key for Lambda environment variable encryption. Lambda uses this key to decrypt environment variables at runtime.

### Technical Requirements

All infrastructure defined using CloudFormation with YAML. API Gateway integrated with Lambda through proxy integration. Lambda connects to DynamoDB for transaction storage. Lambda publishes to SQS for async processing. CloudWatch Logs captures Lambda execution logs. X-Ray traces requests across API Gateway and Lambda. KMS encrypts sensitive Lambda environment variables. Resource names include EnvironmentSuffix parameter for uniqueness. Deploy to us-east-1 region.

### Deployment Requirements

All resources include EnvironmentSuffix parameter in their names using Sub notation. All resources are destroyable with DeletionPolicy Delete and UpdateReplacePolicy Delete. DeletionProtectionEnabled set to false for all applicable resources. Reserved concurrency of exactly 50 for Lambda function. Dead letter queue messages retained for exactly 14 days. CloudWatch Logs retention set to exactly 30 days.

### Constraints

Lambda reserved concurrency exactly 50 to prevent cost overruns. DynamoDB uses point-in-time recovery and AWS managed encryption keys. API Gateway usage plans limit to 1000 requests per day per API key. Dead letter queues retain messages for exactly 14 days before expiration. CloudWatch Logs retention 30 days for compliance requirements. Lambda environment variables containing sensitive data encrypted with KMS. All resources tagged appropriately for cost tracking.

## Success Criteria

API Gateway accepts POST requests at webhook endpoints with BTC, ETH, USDT support. JSON schema validation rejects malformed webhook payloads at API Gateway. Lambda validates transactions and writes to DynamoDB with transactionId partition key and timestamp sort key. Lambda publishes to SQS for asynchronous processing. Dead letter queue captures failed messages after 3 attempts. CloudWatch metric filters count transactions by currency type. X-Ray provides end-to-end visibility from API Gateway through Lambda to DynamoDB and SQS. IAM role grants specific permissions to Lambda for DynamoDB table access, SQS queue publishing, CloudWatch Logs writing, and KMS key decryption. KMS encrypts Lambda environment variables. All resources include EnvironmentSuffix for environment isolation. All resources can be deleted without retention policies blocking cleanup. Lambda reserved concurrency prevents runaway costs during traffic spikes.

## What to deliver

Complete CloudFormation YAML template with API Gateway REST API integrated with Lambda through proxy integration. Lambda function with Python 3.11 runtime, reserved concurrency, DLQ connection, and X-Ray tracing. DynamoDB table accessed by Lambda for transaction storage with PITR and encryption. SQS standard queue and dead letter queue with Lambda publishing messages. IAM execution role granting Lambda specific permissions for DynamoDB GetItem and PutItem, SQS SendMessage, CloudWatch Logs CreateLogStream and PutLogEvents, and KMS Decrypt. CloudWatch Log Groups capturing Lambda logs with 30-day retention and metric filters. KMS customer managed key used by Lambda for environment variable encryption. CloudFormation outputs for API endpoint URL, Lambda ARN, and DynamoDB table name. All resources properly named with EnvironmentSuffix parameter.