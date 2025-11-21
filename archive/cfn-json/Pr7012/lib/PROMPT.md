Hey team,

We need to build a serverless crypto price alert system for a fintech startup that's dealing with volatile cryptocurrency markets. The business wants to process real-time price alerts efficiently while keeping costs low during quiet periods. I've been asked to create this using **CloudFormation with JSON** to define all the infrastructure.

The challenge here is handling spikes during market volatility when thousands of users are setting price alerts simultaneously. The architecture needs to scale instantly when crypto markets go wild, but shouldn't break the bank during normal trading hours.

## What we need to build

Create a serverless crypto price alert system using **CloudFormation with JSON** for real-time cryptocurrency price monitoring and user notifications.

### Core Requirements

1. **Webhook Processing Lambda**
   - Create Lambda function 'PriceWebhookProcessor' with 1GB memory
   - Receives price updates from cryptocurrency exchanges
   - Set reserved concurrent executions to 100
   - Must use ARM-based Graviton2 processors for cost optimization

2. **Alert Storage**
   - Create DynamoDB table 'CryptoAlerts' for storing user alerts
   - Partition key 'userId' and sort key 'alertId'
   - Use on-demand billing with point-in-time recovery enabled

3. **Alert Matching Lambda**
   - Create Lambda function 'AlertMatcher' with 2GB memory
   - Compares incoming prices against user-defined thresholds
   - Set reserved concurrent executions to 50
   - Must use ARM-based Graviton2 processors

4. **Scheduled Processing**
   - Create EventBridge rule triggering AlertMatcher every 60 seconds
   - Must use rate expressions, not cron expressions

5. **Success Routing**
   - Create Lambda function 'ProcessedAlerts' for handling successful matches
   - Configure Lambda destinations to route successful alerts from AlertMatcher to ProcessedAlerts
   - Use Lambda destinations instead of Dead Letter Queues

6. **IAM Security**
   - Create IAM execution roles with least privilege
   - DynamoDB read/write permissions only for specific tables
   - CloudWatch Logs permissions for logging
   - No wildcard actions allowed

7. **CloudWatch Logging**
   - Log retention must be exactly 3 days to minimize costs
   - Do NOT use KMS encryption on CloudWatch LogGroups (use default encryption)

8. **Stack Outputs**
   - Output all three Lambda function ARNs for integration

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Lambda functions must use ARM-based Graviton2 processors (arm64 architecture)
- DynamoDB table must use on-demand billing mode
- All Lambda functions must have reserved concurrent executions set
- Lambda timeout must not exceed 5 minutes for any function
- Use Lambda destinations for success/failure routing, not DLQ
- CloudWatch Logs retention exactly 3 days
- All IAM policies must follow least privilege with no wildcard actions
- Lambda functions must use environment variables for configuration, not hardcoded values
- Resource names must include **environmentSuffix** for uniqueness across parallel deployments
- Follow naming convention: resourceType-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no DeletionProtection)

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter to avoid naming conflicts
- Pattern: PriceWebhookProcessor-${EnvironmentSuffix}, CryptoAlerts-${EnvironmentSuffix}, etc.
- No RemovalPolicy: Retain or DeletionPolicy: Retain allowed
- No DeletionProtection: true on any resource
- Lambda inline code should be minimal placeholder code for testing (actual implementation would be deployed separately)

### Constraints

- Lambda functions require environment variables for DynamoDB table names
- Reserved concurrent executions prevent throttling during market spikes
- Must handle thousands of simultaneous alerts during volatility
- Cost-effective during quiet periods (serverless architecture)
- All resources must be destroyable for testing and cleanup
- Use default encryption for CloudWatch Logs (no KMS keys needed)

## Success Criteria

- Functionality: All three Lambda functions with correct memory allocations and concurrency limits
- Performance: EventBridge rule triggers every 60 seconds reliably
- Reliability: Lambda destinations properly route successful alerts
- Security: IAM roles with least privilege, no wildcard permissions
- Resource Naming: All resources include environmentSuffix parameter
- Observability: CloudWatch Logs with 3-day retention
- Code Quality: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template
- Three Lambda functions: PriceWebhookProcessor, AlertMatcher, ProcessedAlerts
- DynamoDB table: CryptoAlerts with on-demand billing
- EventBridge rule with rate expression
- IAM roles with least privilege permissions
- Lambda destinations configuration
- CloudWatch Logs groups with 3-day retention
- CloudFormation Outputs for all Lambda ARNs
- README with deployment instructions
