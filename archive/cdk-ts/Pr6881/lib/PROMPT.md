# Serverless Stock Pattern Detection System

Hey team,

We need to build a real-time stock pattern detection and alerting system for a financial services company. They're dealing with variable market data feeds during trading hours and want to minimize costs by scaling down to zero when markets are closed. I've been asked to create this using TypeScript with AWS CDK.

The business wants a fully serverless architecture that can handle high-volume market data during trading hours, automatically detect trading patterns, and send alerts when specific thresholds are met. The system needs to be cost-effective, highly available, and properly monitored.

This is a production-grade system that requires careful attention to scalability, error handling, and operational monitoring. We'll be using multiple AWS services including API Gateway for data ingestion, Lambda for processing, DynamoDB for pattern storage, SQS for reliable message queuing, and EventBridge for scheduled pattern checks.

## What we need to build

Create a serverless stock pattern detection system using **AWS CDK with TypeScript** for real-time market data processing and alerting.

### Core Requirements

1. **API Gateway REST API**
   - Create REST API with /patterns and /alerts endpoints
   - Implement request validation for incoming data
   - Configure request throttling at 1000 requests per second with burst capacity of 2000
   - Output the API Gateway URL for integration testing

2. **Lambda Functions for Processing**
   - Create PatternDetector function with 512MB memory to process incoming market data
   - Create AlertProcessor function that reads from SQS queue with batch size of 10
   - Create ThresholdChecker function triggered by EventBridge with environment variables for thresholds
   - All functions must use ARM-based Graviton2 processors (Architecture.ARM_64)
   - PatternDetector must have reserved concurrency of exactly 50
   - All functions must have X-Ray tracing enabled with custom segments
   - All functions must use Lambda Layers for shared dependencies with versioning
   - All functions must have CloudWatch Logs retention of 7 days

3. **Data Storage and Queuing**
   - Deploy DynamoDB table 'TradingPatterns' with partition key 'patternId' and sort key 'timestamp'
   - Use on-demand billing mode with point-in-time recovery enabled
   - Configure SQS queue 'AlertQueue' with visibility timeout of 300 seconds
   - Set message retention period to exactly 4 days for SQS queue
   - Output the SQS queue URL for integration testing

4. **Event-Driven Pattern Checking**
   - Create EventBridge rule that triggers ThresholdChecker every 5 minutes
   - Use custom event patterns with at least 3 matching conditions

5. **Error Handling and Dead Letter Queues**
   - Implement Lambda DLQ for AlertProcessor with maximum receive count of 3
   - Configure proper error handling for all Lambda functions

6. **Monitoring and Alerting**
   - Create SNS topic 'TradingAlerts' with email subscription for critical alerts
   - Configure CloudWatch alarms for Lambda errors exceeding 1% error rate
   - Implement CloudWatch Logs retention of 7 days for all Lambda functions

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **API Gateway** for REST API endpoints with request validation
- Use **Lambda** for all compute (PatternDetector, AlertProcessor, ThresholdChecker)
- Use **DynamoDB** for pattern storage with on-demand billing
- Use **SQS** for message queuing with 4-day retention
- Use **SNS** for critical alert notifications
- Use **EventBridge** for scheduled pattern threshold checks
- Use **CloudWatch** for logging and monitoring
- Use **IAM** roles and policies following least-privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Use CDK 2.x with TypeScript
- Node.js 18+ runtime for Lambda functions

### Deployment Requirements (CRITICAL)

- All Lambda functions MUST use ARM-based Graviton2 processors (Architecture.ARM_64)
- SQS queues MUST have message retention period of exactly 4 days
- EventBridge rules MUST use custom event patterns with at least 3 matching conditions
- ALL Lambda functions MUST have X-Ray tracing enabled with custom segments
- Lambda functions MUST use Lambda Layers for shared dependencies with versioning
- PatternDetector Lambda MUST have reserved concurrency of exactly 50
- API Gateway MUST implement request throttling at 1000 requests per second with burst of 2000
- DynamoDB tables MUST use on-demand billing mode with point-in-time recovery enabled
- All resources must be destroyable (no Retain policies or DeletionPolicy.RETAIN)
- RemovalPolicy must be set to DESTROY for all resources to enable proper cleanup
- Include proper error handling and logging for all components

### Constraints

- Lambda functions must use ARM-based Graviton2 processors for cost efficiency
- SQS message retention must be exactly 4 days
- EventBridge rules must use custom event patterns with minimum 3 matching conditions
- X-Ray tracing must be enabled on all Lambda functions
- Lambda Layers must be used for shared dependencies
- Reserved concurrency of 50 for PatternDetector function
- API Gateway throttling limits must be exactly 1000 rps with 2000 burst
- DynamoDB must use on-demand billing with point-in-time recovery
- SQS visibility timeout must be 300 seconds
- AlertProcessor batch size must be 10
- DLQ maximum receive count must be 3
- CloudWatch alarm threshold must be 1% error rate
- CloudWatch Logs retention must be 7 days
- All resources must be destroyable for testing and cleanup
- No VPC required (fully managed services)
- IAM roles must follow least-privilege principle

## Success Criteria

- Functionality: All API endpoints functional, Lambda functions process data correctly, alerts sent properly
- Performance: System scales automatically during market hours, handles throttling limits
- Reliability: Proper error handling with DLQs, retry mechanisms, monitoring alarms
- Security: IAM roles follow least-privilege, API Gateway has request validation
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: TypeScript, well-tested with 100% coverage, comprehensive documentation
- Deployability: All resources can be created and destroyed cleanly
- Monitoring: CloudWatch alarms configured, X-Ray tracing enabled, logs retained properly

## What to deliver

- Complete AWS CDK TypeScript implementation
- API Gateway REST API with /patterns and /alerts endpoints
- Three Lambda functions: PatternDetector, AlertProcessor, ThresholdChecker
- DynamoDB table for pattern storage
- SQS queue with DLQ configuration
- SNS topic for critical alerts
- EventBridge rule for scheduled checks
- CloudWatch alarms and log groups
- IAM roles and policies
- Unit tests with 100% coverage for all components
- Integration tests for the complete stack
- Documentation and deployment instructions
- CloudFormation outputs for API Gateway URL and SQS queue URL
