Hey team,

We need to build a serverless webhook processing system for a startup that's integrating with multiple third-party services. They're seeing varying traffic patterns and need something that can scale automatically without managing servers. I've been asked to create this using **Pulumi with TypeScript** for infrastructure as code, deploying everything to the eu-west-1 region.

The business challenge here is that they're receiving webhook events from various external platforms, and they need a reliable way to capture, process, and store these events. The system needs to handle failures gracefully and provide visibility when things go wrong. They want to avoid the operational overhead of managing servers, so we're going full serverless with AWS managed services.

The key pain point they're facing is ensuring reliable message delivery with proper retry mechanisms. When webhook processing fails, they need immediate notifications and a way to recover those failed events. They also need to prevent abuse by limiting API usage to reasonable thresholds.

## What we need to build

Create a serverless webhook processing infrastructure using **Pulumi with TypeScript** that handles incoming webhook events, processes them through Lambda, stores them in DynamoDB, and provides comprehensive error handling and monitoring.

### Core Requirements

1. **Webhook Storage**
   - DynamoDB table with partition key 'eventId' and sort key 'timestamp'
   - On-demand billing mode for cost efficiency
   - Store all incoming webhook events with metadata

2. **Lambda Processing Function**
   - Node.js 18.x runtime
   - Process incoming webhooks and store in DynamoDB
   - 30 seconds timeout and 512MB memory allocation
   - Environment variables for DynamoDB table name and AWS region
   - X-Ray tracing enabled for request monitoring

3. **API Gateway Configuration**
   - REST API with edge-optimized endpoint
   - POST endpoint '/webhook' triggering the Lambda
   - Request validation for JSON payload requiring 'source' and 'data' fields
   - Status codes: 200 for success, 400 for validation errors
   - Usage plan limiting to 1000 requests per day

4. **Error Handling and Dead Letter Queue**
   - SQS dead letter queue for failed Lambda executions
   - 14-day message retention period for recovery
   - SNS topic for failed webhook notifications with email subscription
   - Server-side encryption enabled on SNS topic

5. **Monitoring and Alarms**
   - CloudWatch alarm for Lambda errors exceeding 5% error rate in 5 minutes
   - CloudWatch Logs with 7-day retention for Lambda function
   - Comprehensive logging of webhook processing events

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** for webhook processing with Node.js 18.x runtime
- Use **DynamoDB** for event storage with on-demand billing
- Use **API Gateway** for REST API with edge-optimized endpoints
- Use **SNS** for failure notifications with encryption
- Use **SQS** for dead letter queue with 14-day retention
- Use **CloudWatch** for alarms and log retention
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `webhook-{resource-type}-${environmentSuffix}`
- Deploy to **eu-west-1** region
- Enable encryption at rest and in transit for all services
- Implement least privilege IAM roles for Lambda execution

### Constraints

- No VPC required - all managed AWS serverless services
- All resources must be destroyable (no Retain policies) for CI/CD
- Include proper error handling and retry logic
- Enable encryption on all services that support it
- CloudWatch Logs retention set to exactly 7 days
- API Gateway usage plan hard limit at 1000 requests/day
- Lambda dead letter queue messages retained for 14 days
- CloudWatch alarm triggers at 5% error rate within 5-minute period
- Fetch secrets from existing AWS Secrets Manager (do NOT create new secrets)

## Success Criteria

- **Functionality**: POST requests to /webhook endpoint successfully process and store events in DynamoDB
- **Performance**: Lambda executes within 30-second timeout with 512MB memory allocation
- **Reliability**: Failed executions route to DLQ and trigger SNS notifications
- **Security**: Encryption enabled, least privilege IAM, comprehensive logging
- **Monitoring**: CloudWatch alarms detect error rates above 5% threshold
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: TypeScript, well-structured Pulumi program, proper resource dependencies
- **Validation**: API Gateway validates JSON payloads with required 'source' and 'data' fields
- **Cost Optimization**: DynamoDB on-demand billing, serverless architecture, no NAT gateways

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function processing webhooks (Node.js 18.x)
- DynamoDB table for event storage
- API Gateway REST API with POST /webhook endpoint
- SNS topic for failure notifications
- SQS dead letter queue for failed executions
- CloudWatch alarms for error rate monitoring
- IAM roles and policies with least privilege
- Proper resource naming with environmentSuffix
- Documentation and deployment instructions
