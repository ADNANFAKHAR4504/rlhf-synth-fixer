# Cryptocurrency Price Alert System

Hey team,

We need to build a serverless cryptocurrency price alert system for a fintech startup. The business wants to process real-time price alerts from multiple crypto exchanges and notify users via SMS when their price targets are hit. This needs to handle webhook events from exchanges, validate user-defined thresholds, and scale instantly during market volatility without costing us a fortune during quiet periods.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The system needs to handle both event-driven webhooks from exchanges and scheduled price checks every 5 minutes, with full tracing and monitoring to track alert accuracy.

The architecture needs to be cost-effective when volumes are low but scale automatically when markets go crazy. We're targeting users who want to be notified immediately when Bitcoin hits their target price, or when their favorite altcoin spikes.

## What we need to build

Create a serverless cryptocurrency price alert system using **Pulumi with TypeScript** that processes webhook events from crypto exchanges, evaluates user-defined price thresholds, and sends SMS notifications when conditions are met.

### Core Requirements

1. **Webhook Processing**
   - Lambda function with ARM64 architecture to receive webhook events from exchanges
   - Function must use ARM-based Graviton2 processors for cost optimization
   - Set Lambda memory to 1024MB and timeout to 30 seconds
   - Enable X-Ray tracing on the function with custom subsegments

2. **Alert Storage**
   - DynamoDB table to store user alerts
   - Partition key: 'userId'
   - Sort key: 'alertId'
   - Use on-demand billing mode
   - Enable point-in-time recovery with 7-day backup retention

3. **Scheduled Price Checks**
   - EventBridge rule to trigger price check Lambda every 5 minutes
   - Lambda function to evaluate alerts against current market prices
   - Function must also use ARM64 architecture with tracing enabled

4. **Notification System**
   - SNS topic for SMS notifications
   - Support SMS subscription
   - AWS managed encryption (server-side encryption with AWS managed keys)

5. **Monitoring and Tracing**
   - Enable tracing on all Lambda functions
   - Custom X-Ray subsegments for detailed tracing
   - CloudWatch metrics and logs for monitoring

6. **Infrastructure Outputs**
   - Export Lambda function ARNs via Pulumi stack outputs
   - Export DynamoDB table name
   - Export SNS topic ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** region
- Use **Lambda** with ARM64 architecture for webhook processor and alert evaluator
- Use **DynamoDB** for alert storage with on-demand billing
- Use **EventBridge** for scheduling price checks every 5 minutes
- Use **SNS** for SMS notifications with AWS managed encryption
- Use **IAM** for permissions (Lambda execution roles)
- Use **CloudWatch** for monitoring and logging
- All Lambda functions must have X-Ray tracing enabled
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- Resource names MUST include environmentSuffix to avoid conflicts
- Example: `webhook-processor-${environmentSuffix}`
- All resources MUST be destroyable (RemovalPolicy.DESTROY or equivalent)
- FORBIDDEN: DeletionPolicy: Retain, deletion_protection: true
- Lambda environment variables containing API keys MUST use KMS encryption

### Resource Tagging

Apply these tags to all resources:
- Environment: production
- Service: price-alerts

### Constraints

- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- DynamoDB tables must use point-in-time recovery with automated backups
- All Lambda functions must have tracing enabled with custom segments
- SNS topics must use server-side encryption with AWS managed keys
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Lambda environment variables with sensitive data must use KMS encryption

## Success Criteria

- **Functionality**: Webhook Lambda receives and processes exchange events, scheduled Lambda evaluates alerts, SNS sends SMS notifications
- **Performance**: Lambda memory 1024MB, timeout 30 seconds for webhook processor
- **Reliability**: Point-in-time recovery enabled on DynamoDB with 7-day retention
- **Security**: SNS topics encrypted with AWS managed keys, Lambda environment variables with KMS encryption
- **Tracing**: All Lambda functions have X-Ray tracing enabled
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-tested, documented
- **Cost Optimization**: ARM64 architecture, on-demand DynamoDB billing, serverless architecture

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function with ARM64 architecture for webhook processing
- Lambda function with ARM64 architecture for alert evaluation
- DynamoDB table with point-in-time recovery
- EventBridge rule for 5-minute scheduling
- SNS topic with SMS support and encryption
- IAM roles with least privilege permissions
- CloudWatch logging and monitoring
- X-Ray tracing configuration
- Unit tests for all components
- Documentation and deployment instructions