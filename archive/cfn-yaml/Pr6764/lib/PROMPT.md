Hey team,

We need to build a serverless webhook processing system for cryptocurrency transactions that can handle real-time processing during market volatility. This is for a financial technology startup that needs to process transaction webhooks for compliance monitoring. The business requires sub-second processing times while maintaining full audit trails for regulatory compliance.

The challenge here is handling variable traffic spikes during market volatility without breaking the bank. We need to process BTC, ETH, and USDT transactions through dedicated webhook endpoints, validate and store them, and provide comprehensive monitoring. The system must be production-ready with proper error handling, distributed tracing, and cost controls in place.

## What we need to build

Create a serverless webhook processing system using **CloudFormation with YAML** for cryptocurrency transaction compliance monitoring.

### Core Requirements

1. **API Gateway REST API**
   - POST endpoint at /webhooks/{currency} supporting BTC, ETH, and USDT path parameters
   - Request validation using JSON schema for webhook payload structure
   - Usage plans with 1000 requests per day limit for each API key
   - X-Ray tracing enabled for distributed tracing

2. **Lambda Function Processing**
   - Python 3.11 runtime for transaction validation and processing
   - 1GB memory allocation with 60-second timeout
   - Reserved concurrency of exactly 50 to prevent runaway costs
   - Dead letter queue configuration with maxReceiveCount of 3
   - X-Ray tracing enabled
   - Environment variables encrypted using dedicated KMS key

3. **DynamoDB Transaction Storage**
   - Partition key: transactionId
   - Sort key: timestamp
   - Point-in-time recovery enabled
   - Encryption using AWS managed keys

4. **SQS Asynchronous Processing**
   - Standard queue with visibility timeout of 300 seconds
   - Dead letter queue for failed messages with 14 days retention

5. **IAM Security**
   - Execution role with least privilege permissions
   - No wildcard actions allowed in policies

6. **CloudWatch Monitoring**
   - Log Groups with 30 days retention for compliance
   - Metric filters to count transactions by currency type (BTC, ETH, USDT)

7. **KMS Encryption**
   - Customer managed key for Lambda environment variable encryption

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **API Gateway** for webhook endpoints with path parameters
- Use **Lambda** (Python 3.11) for transaction processing
- Use **DynamoDB** for transaction storage with PITR
- Use **SQS** for asynchronous processing queues
- Use **CloudWatch Logs** with metric filters for monitoring
- Use **X-Ray** for distributed tracing across API Gateway and Lambda
- Use **KMS** for encryption of sensitive data
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention with !Sub directives
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **EnvironmentSuffix** parameter in their names using !Sub notation
- All resources must be destroyable - use DeletionPolicy: Delete and UpdateReplacePolicy: Delete
- NO Retain deletion policies allowed
- DeletionProtectionEnabled must be false for all applicable resources
- Reserved concurrency of exactly 50 for Lambda function (cost control)
- Dead letter queue messages retained for exactly 14 days
- CloudWatch Logs retention set to exactly 30 days

### Constraints

- Lambda reserved concurrency must be exactly 50 to prevent cost overruns
- DynamoDB must use point-in-time recovery and AWS managed encryption keys
- API Gateway usage plans must limit to 1000 requests per day per API key
- Dead letter queues must retain messages for exactly 14 days before expiration
- CloudWatch Logs retention must be 30 days for compliance requirements
- All Lambda environment variables containing sensitive data must be encrypted with KMS
- VPC endpoints required for DynamoDB and S3 access without internet gateway
- All resources must be tagged appropriately for cost tracking

## Success Criteria

- **Functionality**: API Gateway accepts POST requests at /webhooks/{currency} with BTC, ETH, USDT support
- **Validation**: JSON schema validation rejects malformed webhook payloads at API Gateway
- **Storage**: Transactions stored in DynamoDB with transactionId partition key and timestamp sort key
- **Processing**: Lambda processes webhooks asynchronously with SQS integration
- **Reliability**: Dead letter queue captures failed messages after 3 attempts
- **Monitoring**: CloudWatch metric filters count transactions by currency type
- **Tracing**: X-Ray provides end-to-end visibility across API Gateway and Lambda
- **Security**: IAM roles use least privilege with no wildcard actions
- **Encryption**: KMS encrypts Lambda environment variables and DynamoDB data at rest
- **Resource Naming**: All resources include EnvironmentSuffix for environment isolation
- **Destroyability**: All resources can be deleted without retention policies blocking cleanup
- **Cost Control**: Lambda reserved concurrency prevents runaway costs during traffic spikes

## What to deliver

- Complete CloudFormation YAML template with all required resources
- API Gateway REST API with /webhooks/{currency} path, request validators, and usage plans
- Lambda function with Python 3.11 runtime, reserved concurrency, DLQ, and X-Ray tracing
- DynamoDB table with transactionId/timestamp keys, PITR, and encryption
- SQS standard queue and dead letter queue with correct retention settings
- IAM execution role with least privilege policies for Lambda
- CloudWatch Log Groups with 30-day retention and metric filters for currency counting
- KMS customer managed key for environment variable encryption
- VPC endpoints for DynamoDB and S3 access
- CloudFormation outputs for API endpoint URL, Lambda ARN, and DynamoDB table name
- All resources properly named with EnvironmentSuffix parameter
- Complete infrastructure ready for production cryptocurrency transaction processing