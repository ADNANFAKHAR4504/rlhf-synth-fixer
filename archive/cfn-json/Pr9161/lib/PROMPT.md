# Cryptocurrency Price Alert System

Hey team,

We've got a financial technology startup that's working on cryptocurrency price alerts and they need something that can handle serious volume - we're talking thousands of price threshold checks every minute while keeping latency tight for notifications. They're in the fintech space so reliability and performance are non-negotiable.

I've been asked to build this out using **CloudFormation with JSON** to define all the infrastructure. The business wants a serverless architecture that can scale automatically without us having to manage servers or worry about capacity planning during crypto market volatility.

The core idea is pretty straightforward - users set price alerts for different cryptocurrencies, and when prices hit their thresholds, they get notified immediately. But at scale with real-time data, we need to make sure the architecture can handle the load and stay cost-effective. They specifically want ARM-based Lambda functions to optimize costs and are very particular about security around encryption and IAM access control.

## What we need to build

Create a serverless cryptocurrency price alert processing system using **CloudFormation with JSON** for a financial technology startup requiring real-time price monitoring and notification capabilities.

### Core Requirements

1. **Data Storage**
   - DynamoDB table named 'PriceAlerts' with partition key 'userId' as String and sort key 'alertId' as String
   - Enable point-in-time recovery for data protection
   - Use pay-per-request billing mode for cost optimization
   - Include environmentSuffix in table name for uniqueness

2. **Compute Layer that processes price data from DynamoDB**
   - Lambda function 'ProcessPriceChecks' using Node.js 18 runtime that reads from DynamoDB and publishes to SNS
   - Deploy on ARM architecture arm64 using Graviton2 processors
   - Configure 512MB memory allocation
   - Set 100 reserved concurrent executions to prevent throttling
   - Resource name must include environmentSuffix
   - Lambda connects to DynamoDB table for reading alert configurations and writes notification events to SNS topic

3. **Notification System connected to Lambda**
   - SNS topic 'PriceAlertNotifications' for alert delivery that receives messages from Lambda function
   - Enable server-side encryption on the topic
   - Resource name must include environmentSuffix

4. **Security and Encryption**
   - Create customer-managed KMS key for Lambda environment variable encryption
   - Encrypt all Lambda environment variables with this KMS key
   - SNS topic must use server-side encryption
   - IAM roles must follow least privilege with explicit resource ARNs, avoiding wildcards

5. **Logging and Monitoring**
   - CloudWatch Logs group for Lambda function that captures execution logs
   - Set log retention to exactly 30 days
   - Resource name must include environmentSuffix

6. **Outputs and Tagging**
   - Output Lambda function ARN, DynamoDB table name, and SNS topic ARN
   - Tag resources with 'Environment': 'Production' and 'Service': 'PriceAlerts'

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **DynamoDB** for alert storage with PAY_PER_REQUEST billing
- Use **Lambda** with ARM architecture for compute
- Use **SNS** for notifications with encryption
- Use **CloudWatch Logs** for logging with 30-day retention
- Use KMS for encryption key management
- Use IAM for access control with explicit resource ARNs
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to us-east-1 region

### Deployment Requirements - CRITICAL

- All resources must be destroyable using DeletionPolicy: Delete, no Retain policies allowed
- Lambda environment variables must be encrypted with customer-managed KMS keys
- Lambda functions must use ARM-based Graviton2 processors with arm64 architecture
- Lambda must have reserved concurrent executions set to 100
- DynamoDB must have point-in-time recovery enabled
- CloudWatch Logs retention must be exactly 30 days
- All IAM policies must use explicit resource ARNs, avoiding wildcards
- SNS topics must have server-side encryption enabled
- All resources must include environmentSuffix in their names

### Constraints

- Lambda functions require reserved concurrent executions to prevent throttling during high-volume periods
- DynamoDB tables must use pay-per-request billing mode for unpredictable workloads
- All Lambda environment variables encrypted with customer-managed KMS keys, not AWS managed
- SNS topics require server-side encryption enabled
- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- CloudWatch Logs retention set to exactly 30 days for compliance
- DynamoDB point-in-time recovery must be enabled for data protection
- All IAM roles must follow least privilege principle with explicit resource ARNs only

## Success Criteria

- Functionality: Complete serverless architecture with DynamoDB storage, Lambda processing, and SNS notifications
- Performance: ARM-based Lambda with 512MB memory and 100 reserved concurrent executions
- Reliability: Point-in-time recovery enabled, proper error handling, CloudWatch logging
- Security: Customer-managed KMS encryption, server-side encryption on SNS, least-privilege IAM with explicit ARNs
- Resource Naming: All resources include environmentSuffix for deployment uniqueness
- Code Quality: Valid CloudFormation JSON, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON implementation in lib/TapStack.json
- DynamoDB table with partition key userId and sort key alertId
- Lambda function with Node.js 18, ARM architecture, 512MB memory, 100 reserved concurrency that integrates with DynamoDB and SNS
- SNS topic with server-side encryption that receives notifications from Lambda
- Customer-managed KMS key for Lambda environment variable encryption
- CloudWatch Logs group with 30-day retention that captures Lambda execution logs
- IAM roles with explicit resource ARNs only
- CloudFormation outputs for Lambda ARN, DynamoDB table name, SNS topic ARN
- All resources tagged with Environment: Production and Service: PriceAlerts
- Documentation in lib/MODEL_RESPONSE.md and lib/README.md
