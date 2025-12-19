Hey team,

We need to build a serverless data processing pipeline for a financial analytics startup that processes millions of stock market data points daily. The business is looking for a cost-effective solution that scales automatically during market hours and down to zero during off-hours. I've been asked to create this using TypeScript with Pulumi.

The startup processes variable loads of market data - thousands of concurrent streams during trading hours, but needs minimal costs outside of peak times. They need a robust event-driven architecture that handles ingestion, processing, aggregation, and serving through APIs, with comprehensive error handling and monitoring baked in.

## What we need to build

Create a serverless financial data processing pipeline using **Pulumi with TypeScript** for real-time market analytics. The system should handle data ingestion through S3, process it through Lambda functions connected via SQS and EventBridge, maintain state in DynamoDB, and expose results through API Gateway.

### Core Requirements

1. **Data Storage Layer**
   - S3 bucket for raw market data ingestion with server-side encryption using AWS-managed keys
   - S3 bucket versioning enabled for data integrity
   - Lifecycle policies configured for 30-day data retention
   - DynamoDB table named 'MarketDataState' with partition key 'symbol' (String) and sort key 'timestamp' (Number)
   - DynamoDB on-demand billing mode for automatic scaling
   - Point-in-time recovery enabled for DynamoDB

2. **Processing Functions**
   - Lambda function 'DataIngestion' triggered by S3 events for initial data capture
   - Lambda function 'DataProcessor' triggered by SQS for stream processing
   - Lambda function 'DataAggregator' triggered by EventBridge scheduled rule every 5 minutes
   - All Lambda functions using Node.js 18.x runtime with 3GB memory allocation
   - X-Ray tracing enabled on all Lambda functions for performance monitoring

3. **Message Queue System**
   - SQS queue named 'ProcessingQueue' for decoupling components
   - Dead letter queue configured for failed message handling
   - Message retention period of 4 days
   - Visibility timeout of 5 minutes

4. **Event Orchestration**
   - EventBridge rule capturing custom events from DataProcessor function
   - EventBridge routing events to DataAggregator Lambda
   - Scheduled rule triggering DataAggregator every 5 minutes
   - At least once delivery guarantee for event processing

5. **API Layer**
   - API Gateway REST API with POST endpoint '/ingest'
   - Synchronous invocation of DataIngestion Lambda from API Gateway
   - Request throttling configured at 10,000 requests per second

6. **Security and Access Control**
   - IAM roles for each Lambda function following least privilege principle
   - Explicit deny statements in IAM policies where appropriate
   - Permissions scoped only to required services for each function

7. **Monitoring and Logging**
   - CloudWatch Log Groups for each Lambda function
   - CloudWatch Logs retention set to 7 days
   - Metric filters configured for error tracking across all functions

8. **Resource Organization**
   - Resource tags 'Environment:Production' and 'Project:MarketAnalytics' on all resources
   - Resource names must include **environmentSuffix** for uniqueness
   - Follow naming convention: `{resource-type}-${environmentSuffix}`

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for raw data ingestion and storage
- Use **DynamoDB** for state management
- Use **Lambda** for serverless compute
- Use **SQS** for message queuing and decoupling
- Use **EventBridge** for event routing and scheduling
- Use **API Gateway** for REST API endpoints
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Constraints

- S3 buckets must have versioning enabled and lifecycle policies for 30-day retention
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Lambda functions must use Node.js 18.x runtime with 3GB memory allocation
- All Lambda functions must have X-Ray tracing enabled for performance monitoring
- CloudWatch Logs retention must be set to 7 days for all Lambda function logs
- API Gateway must implement request throttling at 10,000 requests per second
- SQS queues must have message retention period of 4 days and visibility timeout of 5 minutes
- IAM roles must follow least privilege principle with explicit deny statements
- EventBridge rules must trigger Lambda functions with at least once delivery guarantee
- Dead letter queues must be configured for all asynchronous Lambda invocations
- Implement encryption at rest and in transit
- All resources must be fully destroyable

## Success Criteria

- **Functionality**: Complete serverless pipeline where S3 uploads trigger processing through Lambda functions, state stored in DynamoDB, results accessible via API Gateway
- **Performance**: System handles thousands of concurrent data streams with automatic scaling
- **Reliability**: Comprehensive error handling through dead letter queues and retry mechanisms
- **Security**: Encryption at rest and in transit, IAM roles follow least privilege
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript implementation, well-documented, follows Pulumi best practices
- **Monitoring**: CloudWatch logs and metrics for all components with error tracking
- **Cost Optimization**: Serverless architecture scales to zero during off-hours

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with encryption, versioning, and lifecycle policies
- DynamoDB table with on-demand billing and point-in-time recovery
- Three Lambda functions (DataIngestion, DataProcessor, DataAggregator) with Node.js 18.x
- SQS queue with dead letter queue configuration
- EventBridge rules for scheduling and custom event routing
- API Gateway REST API with throttling and Lambda integration
- IAM roles with least privilege access for each Lambda function
- CloudWatch Log Groups with 7-day retention and metric filters
- Stack outputs: API Gateway URL, S3 bucket name, DynamoDB table ARN
- Lambda function code in lib/lambda/ directory
- Integration with cfn-outputs/flat-outputs.json for testing
