Hey team,

We've got an exciting project for a fintech startup that needs a serverless crypto price alert system. They're building a mobile app where users can set price alerts for various cryptocurrencies, and they need a reliable backend to process incoming webhooks from crypto exchanges, evaluate user-defined rules, and send push notifications when price targets are hit. The goal is to keep costs low during quiet periods while maintaining responsiveness when alerts trigger.

The system needs to handle real-time webhook ingestion from multiple crypto exchanges, store user alert configurations, maintain price history for analysis, and send notifications through SNS. Since this is a production system handling financial data, we need proper encryption, monitoring, and error handling throughout. The startup specifically requested **Pulumi with TypeScript** for their infrastructure, and they want everything serverless to minimize operational overhead.

I've been tasked with building the foundation, and we need to make sure we follow AWS best practices for serverless architectures. The business wants this deployed to us-east-1, and we need to think carefully about security since we'll be handling API keys and user data.

## What we need to build

Create a serverless crypto price alert processing system using **Pulumi with TypeScript** for infrastructure deployment. This system will ingest cryptocurrency price data via webhooks, evaluate user-defined alert rules, and send notifications when thresholds are met.

### Core Requirements

1. **Lambda Functions**
   - Webhook ingestion Lambda with 256MB memory using ARM64 architecture
   - Rule evaluation Lambda with 512MB memory using ARM64 architecture
   - Both functions must have X-Ray tracing enabled for debugging
   - Environment variables containing sensitive data must be encrypted with custom KMS key

2. **Data Storage**
   - DynamoDB table for user alert rules with partition key 'userId' and sort key 'alertId'
   - Point-in-time recovery enabled on alert rules table
   - DynamoDB table for price history with TTL enabled on 'expiryTime' attribute
   - Both tables must support efficient lookups and scalable reads

3. **API Gateway**
   - REST API with POST endpoint '/webhook' triggering ingestion Lambda
   - Request validation configured to require fields: 'exchange', 'symbol', 'price'
   - X-Ray tracing enabled on API Gateway for end-to-end visibility

4. **Message Queuing**
   - SQS queue between ingestion and evaluation Lambdas with 5-minute visibility timeout
   - Dead letter queue configured with maximum receive count of 3
   - Proper permissions for Lambda functions to read from queues

5. **Notifications**
   - SNS topic for outbound push notifications
   - Server-side encryption enabled on SNS topic
   - IAM permissions for evaluation Lambda to publish to topic

6. **Scheduled Processing**
   - EventBridge rule triggering evaluation Lambda every 5 minutes
   - Batch processing capability for periodic rule evaluation

7. **Security and Encryption**
   - Custom KMS key for encrypting Lambda environment variables
   - Least-privilege IAM roles for each Lambda (no wildcard permissions)
   - Proper key policies for KMS usage

8. **Monitoring and Observability**
   - X-Ray tracing active on all Lambda functions and API Gateway
   - Proper CloudWatch Logs integration
   - Error tracking through dead letter queue

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compute (ARM64 architecture for cost optimization)
- Use **Amazon DynamoDB** for data persistence (2 tables)
- Use **Amazon API Gateway** for webhook endpoints (REST API)
- Use **Amazon SQS** for message queuing (main queue + DLQ)
- Use **Amazon SNS** for push notifications with encryption
- Use **Amazon EventBridge** for scheduled triggers
- Use **AWS KMS** for encryption at rest
- Use **AWS X-Ray** for distributed tracing
- Use **AWS IAM** for access control (least-privilege roles)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Node.js 18 or higher for Lambda runtime

### Constraints

- Lambda functions MUST use ARM64 architecture
- DynamoDB tables MUST have point-in-time recovery enabled
- All Lambda functions MUST have X-Ray tracing active
- SNS topics MUST have server-side encryption enabled
- Dead letter queue MUST have maximum receive count of 3
- API Gateway MUST use request validation for all endpoints
- IAM policies MUST NOT use wildcard permissions
- All resources must be destroyable (no Retain policies)
- Lambda environment variables with sensitive data MUST use custom KMS encryption

## Success Criteria

- **Functionality**: Complete webhook ingestion pipeline from API Gateway through Lambda to SQS to evaluation Lambda
- **Performance**: ARM64 Lambda functions with appropriate memory allocation (256MB/512MB)
- **Reliability**: Dead letter queue captures failed messages after 3 attempts, EventBridge ensures periodic processing
- **Security**: Custom KMS encryption for Lambda environment variables, server-side encryption on SNS, least-privilege IAM roles
- **Observability**: X-Ray tracing enabled across API Gateway and all Lambda functions
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployments
- **Data Management**: DynamoDB tables with point-in-time recovery and TTL configuration where needed
- **Code Quality**: TypeScript implementation with proper type safety, well-documented, deployable

## Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter to ensure uniqueness across deployments
- Use naming pattern: `crypto-alert-{component}-${environmentSuffix}` for consistency
- All resources MUST be destroyable - use RemovalPolicy.DESTROY or equivalent (no RETAIN policies)
- DynamoDB tables must be removable (billingMode: PAY_PER_REQUEST for easy cleanup)
- KMS keys should allow deletion (enable key rotation but allow removal)

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- Two Lambda functions (ingestion and evaluation) in lib/lambda/ or lib/functions/
- DynamoDB tables for alert rules and price history
- API Gateway REST API with request validation
- SQS queue with dead letter queue configuration
- SNS topic with server-side encryption
- EventBridge rule for scheduled processing
- Custom KMS key for Lambda environment variable encryption
- IAM roles and policies with least-privilege access
- X-Ray tracing configuration across all services
- Documentation in README.md with deployment instructions
- Proper TypeScript types and error handling throughout
