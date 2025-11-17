# Serverless Transaction Processing Pipeline

Hey team,

We're building a real-time transaction processing system for a financial services startup that needs to handle webhook-based fraud detection. The business team wants something that can scale automatically during peak market hours but won't cost us a fortune during quiet overnight periods. I've been asked to implement this using **Pulumi with TypeScript** on AWS.

The core challenge here is creating a reliable event-driven pipeline that can process customer transaction webhooks in real-time while gracefully handling failures. We need to validate incoming data, enrich it with additional context, store it durably, and make sure nothing gets lost even when things go wrong.

## What we need to build

Create a serverless transaction processing pipeline using **Pulumi with TypeScript** that handles webhook-based transaction data from ingestion through validation, enrichment, and storage.

### Core Requirements

1. **API Gateway Setup**
   - REST API with /webhook endpoint accepting POST requests
   - Request throttling configured at 10,000 requests per second
   - Connected to validation Lambda function

2. **Lambda Functions**
   - Validation Lambda that processes incoming webhook payloads and publishes to SNS topic
   - Processing Lambda subscribed to SNS that enriches transaction data
   - Both functions must use Node.js 18.x runtime
   - Concurrent execution limit of 1000 per function
   - X-Ray tracing enabled for distributed tracing
   - Environment variables configured for DynamoDB table name and SNS topic ARN

3. **Data Storage**
   - DynamoDB table with on-demand billing mode
   - Partition key: transactionId
   - Sort key: timestamp
   - Stores enriched transaction data

4. **Event Handling**
   - SNS topic connecting validation and processing Lambdas
   - SQS dead letter queue for failed processing attempts
   - DLQ message retention: 14 days
   - SQS visibility timeout: 5 minutes

5. **Monitoring and Alarms**
   - CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes
   - CloudWatch log retention set to exactly 30 days for all functions

6. **Resource Naming and Tagging**
   - All resource names must include **environmentSuffix** for uniqueness
   - Follow naming convention: {resource-type}-{environmentSuffix}
   - Apply tags to all resources: Environment=production, Service=transaction-processor

7. **Stack Outputs**
   - Export API Gateway invoke URL
   - Export DynamoDB table name

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use API Gateway for REST endpoints
- Use Lambda for serverless compute
- Use DynamoDB for transaction storage with on-demand billing
- Use SQS for dead letter queue pattern
- Use SNS for event notifications between functions
- Use CloudWatch for monitoring and alarms
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for environment isolation
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling in Lambda functions
- Enable X-Ray tracing for observability

### Constraints

- Lambda functions: Node.js 18.x runtime only
- DynamoDB: on-demand billing mode required
- API Gateway: 10,000 req/sec throttling limit
- Dead letter queue: 14-day message retention
- Lambda: 1000 concurrent execution limit per function
- X-Ray: enabled on all Lambda functions
- SQS: 5-minute visibility timeout
- CloudWatch: exactly 30 days log retention
- All resources must be fully destroyable (no lifecycle prevent_destroy)

## Success Criteria

- **Functionality**: Complete webhook-to-database pipeline with validation, enrichment, and storage
- **Reliability**: Dead letter queue captures all failed messages for retry
- **Observability**: CloudWatch alarms notify on error rate threshold breaches
- **Resource Naming**: All resources include environmentSuffix parameter
- **Performance**: API Gateway handles up to 10,000 req/sec with automatic Lambda scaling
- **Cost Optimization**: Serverless architecture with on-demand billing scales to zero during idle periods
- **Code Quality**: TypeScript implementation with proper typing, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code files for validation and processing in lib/lambda/
- API Gateway REST API configuration with /webhook POST endpoint
- DynamoDB table with correct partition and sort keys
- SNS topic connecting the Lambda functions
- SQS dead letter queue with proper configuration
- CloudWatch alarms and log groups with 30-day retention
- Unit tests for all Pulumi components
- Integration tests verifying the complete pipeline
- Documentation with deployment instructions
