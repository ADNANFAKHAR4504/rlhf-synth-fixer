# Fraud Detection System Infrastructure

Hey team,

We need to build a serverless fraud detection system for processing credit card transactions. A financial services company has asked us to create this infrastructure that can handle real-time fraud detection while managing variable loads during peak shopping seasons and minimizing costs during off-hours. I've been asked to create this using TypeScript with CDK.

The business wants a fully serverless architecture that complies with PCI DSS requirements, processes transactions in real-time, and provides comprehensive monitoring and alerting capabilities. They need the system to handle thousands of requests per second during peak times, with proper fault tolerance and dead letter queues for failed processing.

This is a mission-critical system that needs to be production-ready with proper security, monitoring, and error handling from day one. The architecture leverages AWS Graviton2 processors for cost efficiency and performance, with X-Ray tracing enabled throughout for observability.

## What we need to build

Create a serverless fraud detection system using **CDK with TypeScript** for processing credit card transactions in real-time.

### Core Requirements

1. **API Gateway Configuration**
   - REST API with POST endpoint at /transactions
   - API key authentication for security
   - Request throttling at 1000 requests per second
   - CloudWatch logging enabled at INFO level for request/response tracking

2. **Transaction Validation Lambda**
   - Validates incoming transactions against fraud patterns
   - ARM64 architecture using AWS Graviton2 processors
   - 1GB memory allocation
   - 5-minute timeout maximum
   - Reserved concurrent executions set to 100
   - Environment variables sourced from Systems Manager Parameter Store
   - X-Ray tracing enabled
   - Dead letter queue configured for failed invocations

3. **Data Storage**
   - DynamoDB table named TransactionHistory
   - Partition key: transactionId (String type)
   - Sort key: timestamp (Number type)
   - On-demand billing mode for variable workloads
   - Point-in-time recovery enabled
   - Encryption enabled for PCI DSS compliance

4. **Queue Processing**
   - SQS FIFO queue named TransactionQueue.fifo for ordered processing
   - Content-based deduplication enabled
   - FIFO queue processor Lambda with ARM64 architecture
   - Processor stores validated transactions in DynamoDB
   - 5-minute timeout with reserved concurrent executions of 100
   - X-Ray tracing and dead letter queue configured

5. **Fraud Alert System**
   - SNS topic named FraudAlerts for suspicious transaction notifications
   - Fraud alert handler Lambda subscribed to SNS topic
   - ARM64 architecture with 5-minute timeout
   - X-Ray tracing and dead letter queue configured
   - Environment variables from Parameter Store

6. **Batch Analytics**
   - Batch processing Lambda for hourly transaction pattern analysis
   - EventBridge scheduled rule with cron expression for hourly execution
   - ARM64 architecture with 5-minute timeout
   - Reserved concurrent executions of 100
   - X-Ray tracing and dead letter queue configured

7. **Security and IAM**
   - Least privilege IAM roles for each Lambda function
   - API Gateway invoke permissions
   - DynamoDB read/write permissions
   - SQS send/receive permissions
   - SNS publish permissions
   - Parameter Store read permissions
   - X-Ray tracing permissions

8. **Monitoring and Alerting**
   - CloudWatch alarms for each Lambda function
   - Alert when error rate exceeds 1% over 5-minute period
   - Separate SQS standard dead letter queue for each Lambda
   - X-Ray distributed tracing for API Gateway and all Lambda functions

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Deploy to **us-east-1** region
- Use **Lambda** with Node.js 18.x runtime and arm64 architecture
- Use **API Gateway** REST API for transaction ingestion
- Use **DynamoDB** for transaction storage with encryption
- Use **SQS** FIFO queue for ordered processing
- Use **SNS** for fraud alert notifications
- Use **EventBridge** for scheduled batch processing
- Use **CloudWatch** for logging and monitoring
- Use **Systems Manager Parameter Store** for configuration
- Use **X-Ray** for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies

### Constraints

- PCI DSS compliance required - encryption at rest and in transit
- Least privilege IAM policies for all resources
- API key authentication mandatory for API Gateway
- Reserved concurrent executions of 100 for critical Lambda functions
- 5-minute maximum timeout for all Lambda functions
- All asynchronous Lambda invocations must have dead letter queues
- X-Ray tracing enabled for observability
- CloudWatch alarms for proactive monitoring
- All resources must support clean teardown

## Success Criteria

- **Functionality**: Complete serverless fraud detection pipeline from API ingestion to batch analytics
- **Performance**: Handle 1000 requests per second with reserved concurrency for critical functions
- **Reliability**: Dead letter queues configured for all async processing with CloudWatch alarms
- **Security**: PCI DSS compliant with encryption, least privilege IAM, and API key authentication
- **Observability**: X-Ray tracing enabled throughout with CloudWatch logging at INFO level
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: TypeScript with comprehensive error handling, well-documented, and testable

## What to deliver

- Complete CDK TypeScript implementation with proper construct hierarchy
- Lambda functions: Transaction validator, FIFO processor, fraud alert handler, batch processor
- API Gateway REST API with /transactions endpoint and API key authentication
- DynamoDB table with encryption and point-in-time recovery
- SQS FIFO queue with content-based deduplication
- Dead letter queues for all Lambda functions
- SNS topic for fraud alerts
- EventBridge scheduled rule for hourly batch processing
- IAM roles and policies following least privilege principle
- CloudWatch alarms for Lambda error rates
- Systems Manager Parameter Store integration
- X-Ray tracing configuration
- Stack outputs: API endpoint URL, DynamoDB table name, SNS topic ARN
- Unit tests for all components
- Documentation and deployment instructions in README
