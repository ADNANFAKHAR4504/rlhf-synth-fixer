# Event-Driven Transaction Processing Pipeline

Hey team,

We need to build an event-driven transaction processing system for a financial services company that processes credit card transactions asynchronously. I've been asked to create this using **CDK with TypeScript**. The business wants a robust pipeline that can handle webhook events, validate transactions, enrich them with customer data, and route them to different processing queues based on transaction amounts.

The current challenge is that transaction events arrive via webhooks and need to be processed through multiple stages - validation, enrichment with customer data from DynamoDB, and then routing to appropriate queues based on dollar amount thresholds. The architecture needs to handle failures gracefully with dead letter queues and provide comprehensive monitoring through CloudWatch.

We're deploying this to us-east-1 and need everything to be serverless to optimize costs. The system must be fully observable with X-Ray tracing, CloudWatch alarms, and proper logging at every stage.

## What we need to build

Create a complete transaction processing pipeline using **CDK with TypeScript** that handles webhook events, validates transactions, enriches them with customer data, and routes them based on transaction value.

### Core Requirements

1. **Webhook Receiver Infrastructure**
   - Deploy a Lambda function that accepts POST requests for incoming transactions
   - Configure the Lambda to publish received transactions to an SNS topic
   - Output the webhook endpoint URL for integration testing

2. **Event Distribution Layer**
   - Create an SNS topic for incoming transactions with server-side encryption
   - Enable fanout to multiple SQS queues for parallel processing
   - Publish the SNS topic ARN for reference

3. **Value-Based Queue System**
   - Set up three SQS queues for different transaction value tiers
   - High-value queue for transactions over $10,000
   - Standard queue for transactions between $1,000 and $10,000
   - Low-value queue for transactions under $1,000
   - Output all queue URLs for integration testing

4. **Transaction Validation Processing**
   - Deploy a validator Lambda triggered by SNS
   - Validate transaction format and required fields
   - Publish validation results to a dedicated queue

5. **Data Enrichment Processing**
   - Create an enrichment Lambda that reads from validation queue
   - Fetch and add customer data from DynamoDB table
   - Pass enriched transactions to routing stage

6. **Intelligent Transaction Routing**
   - Implement a routing Lambda that reads enriched transactions
   - Route transactions to appropriate value-based queues
   - Apply business rules based on transaction amount thresholds

7. **Transaction State Management**
   - Configure DynamoDB table with partition key 'transactionId'
   - Enable TTL for automatic cleanup of old transaction records
   - Use on-demand billing for cost optimization

8. **Error Handling Infrastructure**
   - Set up dead letter queues for each processing queue
   - Configure maximum receive count of 3 before moving to DLQ
   - Set DLQ message retention to exactly 14 days

9. **Monitoring and Alerting**
   - Create CloudWatch alarms for queue depth exceeding 1000 messages
   - Alert on Lambda error rates exceeding 1%
   - Set CloudWatch Logs retention to 30 days for all Lambda functions

10. **Async Invocation Handling**
    - Implement Lambda destinations for async invocations
    - Create separate queues for success and failure destinations
    - Ensure proper routing of invocation results

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **Lambda** for all compute operations with Node.js 18.x runtime
- Use **SNS** for event fanout with AWS managed key encryption
- Use **SQS** for message queuing with appropriate visibility timeouts
- Use **DynamoDB** for transaction state storage with on-demand billing
- Use **CloudWatch** for alarms, metrics, and log aggregation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Enable X-Ray tracing for all Lambda functions
- Set SQS visibility timeout to 6 times the Lambda timeout
- Configure message retention period of 4 days for all SQS queues
- Use reserved concurrent executions to prevent Lambda throttling

### Constraints

- Lambda functions must use Node.js 18.x runtime exclusively
- All Lambda functions must have X-Ray tracing enabled
- Dead letter queues must retain messages for exactly 14 days
- SNS topics must use server-side encryption with AWS managed keys
- SQS queues visibility timeout must be 6 times Lambda timeout
- Lambda functions must use reserved concurrent executions
- All IAM roles must follow least privilege principle
- Lambda functions must use environment variables for configuration
- SQS queues must have message retention period of 4 days
- Lambda CloudWatch Logs retention must be 30 days
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging at every stage
- Use encryption at rest and in transit for all data

### Success Criteria

- **Functionality**: All 10 requirements from problem statement implemented
- **Performance**: Reserved concurrency configured to prevent throttling
- **Reliability**: Dead letter queues configured with proper retention
- **Security**: Encryption enabled, least privilege IAM, no hardcoded credentials
- **Resource Naming**: All resources include environmentSuffix variable
- **Observability**: X-Ray tracing, CloudWatch alarms, comprehensive logging
- **Code Quality**: TypeScript with proper types, well-structured CDK constructs

## What to deliver

- Complete CDK TypeScript implementation in lib/ directory
- Lambda function code for webhook receiver
- Lambda function code for transaction validator
- Lambda function code for enrichment processor
- Lambda function code for routing logic
- DynamoDB table with TTL enabled
- SNS topic with encryption
- Three value-based SQS queues (high, standard, low)
- Dead letter queues for error handling
- Lambda destinations for async invocations
- CloudWatch alarms for monitoring
- IAM roles and policies following least privilege
- Stack outputs including webhook URL, SNS ARN, queue URLs
- All resources using environmentSuffix for naming
- Proper error handling and logging throughout