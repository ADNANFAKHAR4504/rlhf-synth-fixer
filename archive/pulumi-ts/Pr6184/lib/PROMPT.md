Hey team,

We're building a serverless payment processing pipeline for a fintech startup that needs to handle credit card transaction webhooks from multiple payment processors. The business wants this to be completely serverless and scalable, with proper security controls for compliance auditing. I've been asked to create this infrastructure using **Pulumi with TypeScript** and deploy everything to the us-east-2 region.

The current situation is that payment processors send webhook notifications when transactions occur, but we don't have infrastructure to receive and process these events. We need to validate incoming webhooks, analyze them for fraud patterns, and store all transaction records for compliance. The system needs to handle high volumes during peak shopping periods while maintaining strong security controls since we're dealing with payment data.

The architecture should use API Gateway as the entry point, Lambda functions for processing, SNS/SQS for message routing, and DynamoDB for persistent storage. Everything needs to be encrypted and logged properly for audit trails.

## What we need to build

Create a serverless payment processing pipeline using **Pulumi with TypeScript** that receives payment webhooks, validates them, checks for fraud, and stores transaction records securely.

### Core Requirements

1. **API Gateway Configuration**
   - REST API with /webhook endpoint accepting POST requests
   - Request throttling: burst limit 5000, rate limit 2000 req/s
   - Integration with webhook-processor Lambda function

2. **Lambda Functions**
   - webhook-processor: Validates payloads and publishes to SNS topic
   - transaction-recorder: Stores transaction details in DynamoDB
   - fraud-detector: Analyzes transactions for fraud patterns
   - All functions must use Go runtime version 1.x
   - Reserved concurrent executions on all functions to prevent throttling
   - VPC configuration for private subnet access
   - Environment variables with API keys encrypted using customer-managed KMS

3. **Message Routing**
   - SNS topic named payment-events with two SQS queue subscriptions
   - SQS queue 1 triggers transaction-recorder function
   - SQS queue 2 triggers fraud-detector function
   - Message retention period of exactly 7 days for both queues

4. **Data Storage**
   - DynamoDB table named transactions
   - Partition key: transactionId
   - Sort key: timestamp
   - On-demand billing mode required

5. **Security and Encryption**
   - Customer-managed KMS keys for encrypting Lambda environment variables
   - Encryption at rest for DynamoDB
   - Encryption in transit for all communications

6. **Monitoring and Logging**
   - CloudWatch log groups for all Lambda functions
   - 30-day retention period for all logs
   - Appropriate monitoring metrics

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **API Gateway REST API** for webhook ingestion
- Use **Lambda** with Go 1.x runtime for compute
- Use **SNS** for event fanout to multiple consumers
- Use **SQS** for reliable message queuing
- Use **DynamoDB** for transaction storage with on-demand billing
- Use **KMS** customer-managed keys for encryption
- Use **VPC** with private subnets for Lambda functions
- Use **CloudWatch Logs** for monitoring with 30-day retention
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-2** region

### Constraints

- Lambda runtime must be Go 1.x, not Go 2.x or other runtimes
- All Lambda functions must have reserved concurrent executions configured
- DynamoDB billing mode must be on-demand, not provisioned
- API Gateway throttling limits are firm: 5000 burst, 2000 rate
- SQS retention must be exactly 7 days, not more or less
- Lambda environment variables with sensitive data must use customer-managed KMS encryption
- Lambda functions processing payment data must run in VPC with private subnet access
- CloudWatch logs retention must be 30 days for compliance
- All resources must be destroyable without Retain policies
- Follow principle of least privilege for all IAM roles and policies
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: API Gateway receives webhooks and triggers Lambda processing pipeline
- **Data Flow**: Messages flow through SNS to two SQS queues and trigger respective Lambda functions
- **Storage**: Transactions are stored in DynamoDB with proper partition and sort keys
- **Security**: All sensitive data encrypted with customer-managed KMS keys
- **Monitoring**: All Lambda functions have CloudWatch logs with 30-day retention
- **Performance**: API Gateway throttling configured correctly, Lambda concurrent executions reserved
- **Compliance**: VPC configuration for Lambda functions processing payment data
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: TypeScript code well-structured, properly typed, and documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Three Lambda functions in lib/lambda/ directory with Go 1.x code
- API Gateway REST API with /webhook endpoint
- SNS topic with two SQS queue subscriptions
- DynamoDB table with correct schema
- Customer-managed KMS keys for encryption
- VPC configuration for Lambda functions
- CloudWatch log groups with 30-day retention
- IAM roles and policies following least privilege
- Unit tests for infrastructure components
- Documentation explaining architecture and deployment
