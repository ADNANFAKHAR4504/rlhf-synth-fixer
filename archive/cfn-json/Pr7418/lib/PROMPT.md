Hey team,

We need to build a real-time cryptocurrency price alert system for a fintech startup. The business problem is interesting - crypto markets are incredibly volatile, and users need instant notifications when prices hit their thresholds. During major market events, we could see thousands of alerts triggering simultaneously, but most of the time, the system sits relatively quiet. The architecture needs to scale instantly when markets go crazy but stay cost-effective during normal periods.

The challenge here is designing for those explosive spikes in activity. When Bitcoin suddenly drops 10% or Ethereum surges, every user who set alerts around those price points needs to be notified immediately.  Traditional infrastructure would be expensive to maintain during the 95% of time when markets are calm.

I've been asked to create this infrastructure using CloudFormation with JSON templates. The solution needs to be fully serverless to handle the scaling requirements and cost optimization goals.

## What we need to build

Create a serverless cryptocurrency price alert processing system using **CloudFormation with JSON** for infrastructure definition.

### Core Requirements

1. **Price Webhook Processing**
   - Lambda function named 'PriceWebhookProcessor' with 1GB memory
   - Receives real-time price updates from cryptocurrency exchanges

2. **Alert Storage**
   - DynamoDB table named 'CryptoAlerts' with on-demand billing
   - Partition key: 'userId', Sort key: 'alertId'
   - Must have point-in-time recovery enabled
   - Stores user-defined price thresholds and alert configurations

3. **Alert Matching Logic**
   - Lambda function named 'AlertMatcher' with 2GB memory
   - Compares incoming prices against user thresholds in DynamoDB
   - Triggered automatically every 60 seconds by EventBridge

4. **Scheduled Trigger**
   - EventBridge rule using rate expression (not cron)
   - Triggers AlertMatcher every 60 seconds for continuous monitoring

5. **Success Routing**
   - Lambda function named 'ProcessedAlerts' for handling matched alerts
   - Configure Lambda destinations on AlertMatcher to route successful invocations
   - Use destinations instead of Dead Letter Queues

6. **IAM Security**
   - Execution roles for each Lambda function
   - DynamoDB read/write permissions only (no wildcard actions)
   - Follow least privilege principle strictly

7. **Observability**
   - CloudWatch Logs with exactly 3-day retention to minimize costs
   - All Lambda functions must log to CloudWatch

8. **Infrastructure Outputs**
   - Export ARNs for all three Lambda functions
   - Use CloudFormation Outputs section

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Lambda** for serverless compute (ARM-based Graviton2 processors)
- Use **DynamoDB** for alert storage with on-demand billing
- Use **EventBridge** for scheduled invocations
- Use **IAM** for security and access control
- Use **CloudWatch Logs** for logging with 3-day retention
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda timeout must not exceed 5 minutes for any function
- Lambda functions must use environment variables for configuration

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - use DeletionPolicy: Delete
- FORBIDDEN: Retain policies on any resource
- Lambda functions must specify ARM64 architecture (Graviton2)
- EventBridge rules must use rate expressions, not cron
- Lambda destinations required for routing (not DLQ)

### Constraints

- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- DynamoDB tables must use on-demand billing with point-in-time recovery enabled
- Use Lambda destinations instead of DLQ for failed invocations
- CloudWatch Logs retention must be exactly 3 days to minimize costs
- Lambda functions must use environment variables for configuration, not hardcoded values
- EventBridge rules must use rate expressions, not cron expressions
- All IAM policies must follow least privilege with no wildcard actions
- Lambda timeout must not exceed 5 minutes for any function
- Use CloudFormation Outputs to expose all Lambda function ARNs

## Success Criteria

- **Functionality**: All three Lambda functions created with correct memory
- **Performance**: System handles burst traffic during market
- **Reliability**: EventBridge triggers AlertMatcher every 60 seconds reliably
- **Security**: IAM roles follow least privilege with no wildcard permissions
- **Resource Naming**: All resources include environmentSuffix parameter for multi-environment support
- **Code Quality**: CloudFormation JSON template, well-structured, ready for production deployment
- **Observability**: CloudWatch Logs configured with 3-day retention for cost optimization

## What to deliver

- Complete CloudFormation JSON template implementing the serverless alert system
- Lambda function 'PriceWebhookProcessor' with 1GB memory
- Lambda function 'AlertMatcher' with 2GB memory
- Lambda function 'ProcessedAlerts' as destination target
- DynamoDB table 'CryptoAlerts' with userId/alertId keys and point-in-time recovery
- EventBridge rule triggering AlertMatcher every 60 seconds
- IAM execution roles with DynamoDB and CloudWatch Logs permissions
- CloudWatch Logs groups with 3-day retention
- CloudFormation Outputs for all Lambda function ARNs
- Lambda destination configuration routing AlertMatcher success to ProcessedAlerts
- Documentation explaining the architecture and deployment process
