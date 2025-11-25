# Cryptocurrency Price Alert System

Hey team,

We need to build a serverless cryptocurrency price alert system for a fintech startup. The business wants to notify users via SMS when crypto prices hit their configured thresholds. This needs to handle webhook notifications from external exchanges, validate price data against user alerts, and send SMS notifications when conditions are met.

The startup is experiencing variable traffic patterns ranging from 100 to 50,000 webhooks per hour, so we need a cost-effective serverless solution that scales automatically. They want this infrastructure defined using CloudFormation with JSON for consistency with their existing systems.

The system will receive price updates from cryptocurrency exchanges via webhooks, store both user alert configurations and historical price data, evaluate alert conditions in real-time, and notify users via SMS when thresholds are crossed. We also need to clean up old price history automatically to keep storage costs down.

## What we need to build

Create a serverless cryptocurrency price alert system using **CloudFormation with JSON** that processes webhook notifications, evaluates price thresholds, and sends SMS alerts to users.

### Core Requirements

1. **API Gateway and Webhook Processing**
   - REST API with POST endpoint at /webhooks for receiving price updates
   - API key authentication required for webhook requests
   - Usage plans to control and monitor API usage
   - Integration with Lambda function to process incoming webhooks

2. **Lambda Functions**
   - ProcessWebhook function with 1GB memory to validate and process price data
   - CheckAlerts function triggered by DynamoDB streams to evaluate thresholds
   - SendNotification function as SNS topic subscriber for SMS delivery
   - CleanupHistory function to remove old price data periodically
   - All functions must use ARM-based Graviton2 processors (arm64 architecture)
   - Reserved concurrent executions to prevent throttling
   - Environment variables encrypted with KMS

3. **Data Storage**
   - PriceAlerts table with userId as partition key and alertId as sort key
   - PriceHistory table with cryptocurrency symbol as partition key
   - Both tables using on-demand billing mode
   - Point-in-time recovery enabled on both tables
   - DynamoDB streams enabled for CheckAlerts trigger
   - Global secondary indexes projecting only required attributes

4. **Notification System**
   - SNS topic configured for SMS notifications
   - Lambda function subscription to SNS topic
   - Integration with CheckAlerts function to publish messages

5. **Monitoring and Cleanup**
   - CloudWatch alarms for Lambda error rates exceeding 1 percent
   - CloudWatch alarms for DynamoDB throttling events
   - EventBridge rule triggering cleanup function every hour
   - CloudWatch Logs retention set to 30 days

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Lambda** for serverless compute with arm64 architecture
- Use **API Gateway** for REST API with API key authentication
- Use **DynamoDB** for storing alerts and price history with on-demand billing
- Use **SNS** for SMS notifications
- Use **CloudWatch** for monitoring and alarms
- Use **EventBridge** for scheduled cleanup tasks
- Use **KMS** for encrypting Lambda environment variables
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-EnvironmentSuffix
- Deploy to **us-east-1** region

### Constraints

- Lambda functions must use ARM-based Graviton2 (arm64) not x86
- DynamoDB tables must use on-demand billing mode not provisioned
- All Lambda functions must have reserved concurrent executions configured
- API Gateway must implement usage plans with API keys for authentication
- CloudWatch alarms must trigger on Lambda errors exceeding 1 percent error rate
- All IAM roles must follow least privilege with no wildcard resource permissions
- Lambda environment variables must be encrypted with KMS
- DynamoDB global secondary indexes must project only required attributes not all
- All resources must be destroyable with no Retain policies
- CloudWatch Logs retention must be 30 days
- CleanupHistory function must run every hour to remove data older than 24 hours

## Success Criteria

- Functionality: API Gateway accepts webhooks with API key authentication and triggers Lambda processing
- Functionality: ProcessWebhook stores price data and CheckAlerts evaluates thresholds correctly
- Functionality: SendNotification delivers SMS messages via SNS when alerts triggered
- Functionality: CleanupHistory removes price data older than 24 hours automatically
- Performance: Lambda functions use arm64 architecture for cost optimization
- Performance: DynamoDB tables use on-demand billing to handle variable traffic
- Reliability: Reserved concurrent executions prevent Lambda throttling
- Reliability: Point-in-time recovery enabled for data protection
- Security: API Gateway requires API keys for webhook authentication
- Security: Lambda environment variables encrypted with KMS
- Security: IAM roles follow least privilege with specific resource permissions
- Monitoring: CloudWatch alarms configured for Lambda errors and DynamoDB throttling
- Resource Naming: All resources include EnvironmentSuffix parameter
- Code Quality: Clean JSON CloudFormation template, well-organized, documented

## What to deliver

- Complete CloudFormation JSON template implementing all resources
- Lambda function code for ProcessWebhook, CheckAlerts, SendNotification, and CleanupHistory
- IAM roles with least privilege permissions
- API Gateway configuration with usage plans and API keys
- DynamoDB table definitions with streams and indexes
- CloudWatch alarms for monitoring
- EventBridge rule for scheduled cleanup
- Unit tests for all Lambda functions
- Documentation and deployment instructions in README.
