# Serverless Cryptocurrency Alert Processing System

Hey team,

We've got a financial services company dealing with a serious problem in their cryptocurrency alert system. During market volatility, their current monolithic system can't keep up with the volume of price alerts, which means their traders are getting delayed notifications. In crypto trading, even a few seconds can mean the difference between catching an opportunity and missing it completely.

I need to build them a serverless solution using **CloudFormation with JSON** that can handle sudden spikes in alert volumes while maintaining sub-second processing times. The business wants this to be production-ready and cost-optimized since they're processing potentially millions of alerts during high-volume periods.

The architecture needs to be event-driven with proper error handling, because missing a critical price alert could cost their clients real money. They've specifically asked for ARM-based Lambda functions to reduce costs, and they need complete visibility into what's happening with CloudWatch.

## What we need to build

Create a serverless cryptocurrency alert processing system using **CloudFormation with JSON** that handles real-time price alerts with sub-second latency.

### Core Requirements

1. **Lambda Functions**
   - Create two Lambda functions: one for alert ingestion and one for alert processing
   - Both functions must use ARM64 architecture (Graviton2) for cost optimization
   - Set reserved concurrent executions to 100 for each function to prevent throttling
   - Configure environment variables for DynamoDB table name and SNS topic ARN
   - Include proper error handling with dead letter queue integration

2. **DynamoDB Alert Storage**
   - Create DynamoDB table to store alert history
   - Set partition key to 'AlertId' (String)
   - Set sort key to 'Timestamp' (Number)
   - Enable point-in-time recovery for data protection
   - Enable encryption at rest for security compliance
   - Configure on-demand billing mode for variable workloads

3. **SNS Notifications**
   - Create SNS topic for critical price alerts
   - Configure email subscription for alerts above $1000 threshold
   - Set up proper IAM permissions for Lambda to publish messages
   - Include message filtering for high-value alerts

4. **Dead Letter Queues**
   - Create SQS dead letter queues for both Lambda functions
   - Configure 5 retry attempts before sending to DLQ
   - Set message retention period to 14 days
   - Enable proper IAM permissions for Lambda to send messages

5. **CloudWatch Logging**
   - Create CloudWatch Log Groups for all Lambda functions
   - Set retention period to exactly 3 days to minimize storage costs
   - Configure proper log stream naming conventions
   - Set up log group deletion policy

6. **IAM Roles and Permissions**
   - Implement least-privilege IAM roles for each Lambda function
   - NO wildcard permissions in any IAM policy
   - Grant specific permissions for DynamoDB read/write operations
   - Grant specific permissions for SNS publish operations
   - Grant permissions for SQS dead letter queue access
   - Include CloudWatch Logs permissions for each function

7. **CloudFormation Outputs**
   - Output both Lambda function ARNs
   - Output DynamoDB table name
   - Output SNS topic ARN
   - Output SQS dead letter queue URLs

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use ARM64 architecture (arm64) for Lambda functions
- Reserved concurrent executions set to 100 for both Lambda functions
- CloudWatch Logs retention must be exactly 3 days
- DynamoDB point-in-time recovery enabled
- DynamoDB encryption at rest enabled
- Dead letter queues configured with 5 retry attempts
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: !Sub "resource-name-${EnvironmentSuffix}"
- Deploy to **us-east-2** region
- Template must use AWSTemplateFormatVersion: 2010-09-09

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All named resources MUST use !Sub pattern with ${EnvironmentSuffix} to ensure uniqueness across parallel deployments
- **Destroyability**: All resources must be cleanly destroyable - NO DeletionPolicy: Retain except for DynamoDB table
- **DynamoDB DeletionPolicy**: DynamoDB table should use DeletionPolicy: Retain to preserve data
- **Lambda Runtime**: Use latest supported runtime (Node.js 18.x or Python 3.11)
- **Lambda Node.js 18+**: If using Node.js 18+, note that AWS SDK v3 should be used (aws-sdk v2 not included by default)
- **IAM Best Practices**: No wildcard permissions, use specific resource ARNs in policies

### Constraints

- Lambda functions must use ARM-based Graviton2 processors (arm64 architecture)
- DynamoDB must have point-in-time recovery and encryption at rest enabled
- Reserved concurrent executions required to prevent throttling during market volatility
- CloudWatch Logs retention must be exactly 3 days for cost optimization
- Dead letter queues required for all asynchronous Lambda invocations
- No VPC requirements - fully serverless architecture
- Sub-second latency requirement for alert processing
- Event-driven architecture with proper error handling

## Success Criteria

- **Functionality**: Two Lambda functions handling ingestion and processing with proper event flow
- **Performance**: Reserved concurrency of 100 for each function ensures no throttling
- **Reliability**: Dead letter queues configured with 5 retries for error handling
- **Security**: Least-privilege IAM roles with no wildcard permissions, DynamoDB encrypted at rest
- **Storage**: DynamoDB table with point-in-time recovery and proper key structure
- **Monitoring**: CloudWatch Log Groups with 3-day retention for cost optimization
- **Notifications**: SNS topic configured for critical alerts above $1000 threshold
- **Resource Naming**: All resources use environmentSuffix for uniqueness
- **Destroyability**: All resources cleanly destroyable except DynamoDB (Retain policy)
- **Code Quality**: Valid CloudFormation JSON template with proper outputs

## What to deliver

- Complete CloudFormation JSON template
- Lambda function implementations (alert ingestion and processing)
- IAM roles with least-privilege policies
- DynamoDB table with proper configuration
- SNS topic with email subscription
- SQS dead letter queues for both Lambda functions
- CloudWatch Log Groups with 3-day retention
- CloudFormation outputs for all key resources
- Documentation and deployment instructions
