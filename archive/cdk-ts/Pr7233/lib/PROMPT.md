Hey team,

We need to build a serverless stock pattern detection system for a financial services company. I've been asked to create this in TypeScript using AWS CDK. The business wants a system that can process real-time stock market data feeds and generate alerts when specific trading patterns are detected.

The system needs to handle variable load patterns during market hours and scale down to zero during off-hours to minimize costs. We're deploying this in the us-east-1 region for proximity to financial markets. Make sure to add a unique suffix to all resource names so we don't have conflicts when deploying multiple environments.

## What we need to build

Create a serverless stock pattern detection system using **AWS CDK with TypeScript** for real-time market data processing.

### Core Requirements

1. **API Gateway Interface**
   - REST API with /patterns and /alerts endpoints
   - Request validation enabled
   - Request throttling at 1000 requests per second with burst of 2000

2. **Pattern Detection Processing**
   - Lambda function 'PatternDetector' with 512MB memory
   - Processes incoming market data from API
   - Uses ARM-based Graviton2 processors for cost optimization
   - Note: Reserved concurrency removed to avoid AWS account limit issues (AWS requires at least 100 unreserved concurrent executions)

3. **Data Storage**
   - DynamoDB table 'TradingPatterns' for storing detected patterns
   - Partition key: patternId
   - Sort key: timestamp
   - On-demand billing mode with point-in-time recovery enabled

4. **Alert Processing Pipeline**
   - SQS queue 'AlertQueue' with visibility timeout of 300 seconds
   - Message retention period of exactly 4 days
   - Lambda function 'AlertProcessor' reading from queue with batch size of 10
   - Dead Letter Queue for AlertProcessor with maximum receive count of 3

5. **Scheduled Pattern Checking**
   - EventBridge rule triggering every 5 minutes
   - Lambda function 'ThresholdChecker' triggered by EventBridge
   - Custom event patterns with at least 3 matching conditions
   - Environment variables for configurable thresholds

6. **Alerting and Notifications**
   - SNS topic 'TradingAlerts' for critical alerts
   - Email subscription configuration
   - Integration with alert processing pipeline

7. **Monitoring and Observability**
   - CloudWatch Logs retention of 7 days for all Lambda functions
   - X-Ray tracing enabled with custom segments for all Lambda functions
   - CloudWatch alarms for Lambda errors exceeding 1% error rate

8. **Shared Dependencies**
   - Lambda Layers for shared dependencies with versioning
   - Reusable code across multiple functions

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** functions with ARM-based Graviton2 processors
- Use **DynamoDB** for pattern storage
- Use **SQS** for message queuing
- Use **EventBridge** for scheduled event routing
- Use **SNS** for critical alert notifications
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Use **IAM** roles following least-privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Requires CDK 2.x with TypeScript, Node.js 18+

### Constraints

- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- SQS queues must have message retention period of exactly 4 days
- EventBridge rules must use custom event patterns with at least 3 matching conditions
- All Lambda functions must have X-Ray tracing enabled with custom segments
- Lambda functions must use Lambda Layers for shared dependencies with versioning
- PatternDetector function does not use reserved concurrency (removed to avoid AWS account limit issues - AWS requires at least 100 unreserved concurrent executions)
- API Gateway must implement request throttling at 1000 requests per second with burst of 2000
- DynamoDB tables must use on-demand billing mode with point-in-point recovery enabled
- AlertProcessor must have DLQ with maximum receive count of 3
- CloudWatch Logs retention must be 7 days for all Lambda functions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: API endpoints accept pattern submissions, automated detection and alerting work correctly
- **Performance**: Handle variable load patterns during market hours
- **Scalability**: Scale down to zero during off-hours for cost optimization
- **Reliability**: Proper error handling with DLQs, retry mechanisms in place
- **Cost Efficiency**: Use Graviton2 processors, on-demand billing, and serverless architecture
- **Monitoring**: CloudWatch alarms and X-Ray tracing provide operational visibility
- **Security**: IAM roles follow least-privilege principle with boundary policies
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- API Gateway REST API with request validation
- Lambda functions: PatternDetector, AlertProcessor, ThresholdChecker
- DynamoDB table for pattern storage
- SQS queue with DLQ for alert processing
- EventBridge rule for scheduled checks
- SNS topic for critical alerts
- Lambda Layers for shared dependencies
- CloudWatch Logs, alarms, and X-Ray tracing configuration
- Stack outputs: API Gateway URL and SQS queue URL
- Unit tests for all components
- Documentation and deployment instructions
