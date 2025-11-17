Hey team,

We need to build a serverless fraud detection pipeline for a fintech startup that processes millions of transaction records daily. The business wants a fully automated system that can handle variable loads, detect suspicious patterns in near real-time, and alert the security team immediately when potential fraud is detected. The key challenge here is building something that scales automatically while keeping operational costs minimal.

The current manual review process is causing delays in fraud detection, and the business is losing money. We need to move fast but also build this right the first time. The system needs to be deployable quickly and maintainable by our small ops team.

## What we need to build

Create a serverless fraud detection pipeline using **Pulumi with Python** that processes financial transactions through an event-driven architecture with real-time analysis and alerting capabilities.

### Core Requirements

1. **API Gateway REST API**
   - Endpoint: POST /transactions that accepts transaction data
   - Triggers Lambda function for transaction validation and processing
   - Request throttling at 1000 requests per second to prevent abuse
   - X-Ray tracing enabled for request tracking

2. **Transaction Storage with DynamoDB**
   - Table name: transactions
   - Partition key: transaction_id (string)
   - Sort key: timestamp (number)
   - On-demand billing mode for cost optimization
   - Streams enabled to capture all insert events

3. **API Lambda Function**
   - Validates incoming transaction data
   - Writes validated records to DynamoDB table
   - Python 3.11 runtime
   - Must run inside VPC for data security
   - Reserved concurrent executions of at least 100
   - Environment variables encrypted with customer-managed KMS key

4. **Event-Driven Processing with EventBridge**
   - Rule captures DynamoDB stream records when items are inserted
   - Uses event pattern matching (not scheduled expressions)
   - Routes events to fraud detection Lambda

5. **Fraud Detection Lambda**
   - Triggered by EventBridge for each new transaction
   - Analyzes transaction patterns for suspicious activity
   - Python 3.11 runtime
   - Must run inside VPC for secure processing
   - Reserved concurrent executions of at least 100
   - Sends suspicious transactions to SQS queue
   - Environment variables encrypted with customer-managed KMS key

6. **Message Queuing with SQS**
   - Queue for suspicious transactions
   - Dead letter queue for failed message processing with 14-day retention
   - Visibility timeout of exactly 6 minutes (360 seconds)
   - Messages retained for compliance requirements

7. **Notification Processing Lambda**
   - Polls SQS queue for suspicious transactions
   - Sends formatted alerts via SNS topic
   - Python 3.11 runtime
   - Reserved concurrent executions of at least 100
   - Environment variables encrypted with customer-managed KMS key

8. **Alert Distribution via SNS**
   - Topic for fraud alerts
   - Email subscription endpoint for security team notifications
   - Integration with notification Lambda

9. **Security and IAM**
   - Separate IAM roles for each Lambda function
   - Principle of least privilege (no wildcard permissions)
   - Minimal required permissions for each function
   - Customer-managed KMS keys for encryption at rest

10. **Monitoring and Observability**
    - CloudWatch log groups for all Lambda functions
    - 7-day log retention for cost optimization
    - X-Ray tracing for all Lambda functions and API Gateway
    - Distributed tracing across the entire pipeline

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** for REST endpoints with throttling
- Use **Lambda** for all compute (Python 3.11 runtime, VPC integration for data processing)
- Use **DynamoDB** for transaction storage with on-demand billing
- Use **EventBridge** for event routing with pattern matching
- Use **SQS** for message queuing with dead letter queue
- Use **SNS** for notifications with email subscriptions
- Use **KMS** for customer-managed encryption keys
- Use **CloudWatch** for logging with 7-day retention
- Use **X-Ray** for distributed tracing
- Resource names must include **environment_suffix** for uniqueness across deployments
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region for GDPR compliance

### Critical Constraints

These constraints are mandatory and must be implemented exactly as specified:

- Lambda functions must use Python 3.11 runtime (no other version)
- Lambda functions processing sensitive data must run inside a VPC with private subnet access
- Lambda functions must have reserved concurrent executions of at least 100
- Lambda environment variables must be encrypted with a customer-managed KMS key
- All IAM roles must follow principle of least privilege with no wildcard permissions on resources
- API Gateway must implement request throttling at exactly 1000 requests per second
- DynamoDB tables must use on-demand billing mode (no provisioned capacity)
- EventBridge rules must use event pattern matching (not scheduled expressions)
- SQS queues must have visibility timeout of exactly 6 minutes (360 seconds)
- Dead letter queues must retain messages for 14 days
- CloudWatch log groups must have 7-day retention period
- X-Ray tracing must be enabled for all Lambda functions and API Gateway
- All resources must be destroyable (no Retain policies or deletion protection)

### Use Case Context

This system serves a fintech startup processing millions of daily transaction records. The infrastructure must handle variable loads efficiently, support GDPR compliance requirements for data processing in us-east-1, and maintain strict security standards for financial data. The serverless approach ensures operational costs remain minimal while providing automatic scaling capabilities.

## Success Criteria

- **Functionality**: Complete event-driven pipeline from API ingestion through fraud detection to notification
- **Performance**: Sub-second transaction processing latency with automatic scaling
- **Reliability**: Message queuing ensures no fraud alerts are lost, dead letter queue captures failures
- **Security**: VPC isolation for sensitive processing, KMS encryption, least-privilege IAM, no wildcard permissions
- **Observability**: Full X-Ray tracing and CloudWatch logging across all components
- **Resource Naming**: All resources include environment_suffix for multi-environment deployments
- **Compliance**: GDPR-compliant deployment in us-east-1, encryption at rest and in transit
- **Cost Optimization**: Serverless architecture with on-demand billing and 7-day log retention
- **Code Quality**: Clean Pulumi Python code, well-documented, follows best practices

## What to deliver

- Complete Pulumi Python implementation with all 12 components integrated
- API Gateway REST API with /transactions POST endpoint and throttling
- Three Lambda functions (API handler, fraud detector, notification sender) with VPC and KMS
- DynamoDB table with streams enabled
- EventBridge rule with event pattern matching
- SQS queue with dead letter queue
- SNS topic with email subscription
- IAM roles and policies with least privilege
- CloudWatch log groups with 7-day retention
- X-Ray tracing enabled across all components
- Documentation with deployment instructions
- All resources properly named with environment_suffix
