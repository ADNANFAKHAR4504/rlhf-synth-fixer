# Payment Webhook Processing System

Hey team,

We need to build a serverless payment webhook processing system for a fintech startup that handles webhooks from multiple payment providers like Stripe, PayPal, and Square. The business is experiencing rapid growth and needs infrastructure that can handle variable traffic spikes during peak shopping seasons while maintaining PCI DSS compliance for payment data handling.

The current challenge is that payment webhooks come in bursts during high-traffic events like Black Friday or flash sales, and we need to process them reliably without losing any data. Payment providers expect quick acknowledgments of webhook deliveries, so we need to decouple the acknowledgment from the actual processing. Additionally, we need comprehensive audit trails for compliance and the ability to quickly identify and handle failed webhook processing.

I've been asked to create this infrastructure using **AWS CDK with Python** to take advantage of serverless architecture and AWS managed services for scalability and reliability.

## What we need to build

Create a serverless payment webhook processing system using **AWS CDK with Python** that can handle payment webhooks from multiple providers with high reliability and security.

### Core Requirements

1. **API Gateway REST API**
   - Create REST API with `/webhook/{provider}` endpoint accepting POST requests
   - Path parameter `provider` should support multiple payment providers
   - Integrate with webhook receiver Lambda function
   - Apply AWS WAF with rate limiting (10 requests per second per IP)
   - Enable X-Ray tracing for observability
   - Configure throttling settings (1000 requests per second burst)

2. **Lambda Functions**
   - **Webhook Receiver**: Python 3.11 runtime on ARM64 architecture with 30-second timeout and 100 reserved concurrent executions
   - **Payment Processor**: Python 3.11 runtime on ARM64 architecture with 5-minute timeout and 50 reserved concurrent executions
   - **Audit Logger**: Python 3.11 runtime on ARM64 architecture triggered by DynamoDB streams
   - All Lambda functions must have X-Ray tracing enabled

3. **Lambda Layers**
   - Create shared Lambda layers for common dependencies (boto3 and cryptography libraries)
   - Attach layers to all Lambda functions for code reusability

4. **DynamoDB Table**
   - Table name: `PaymentWebhooks` (must include environmentSuffix)
   - Partition key: `webhookId` (String)
   - Sort key: `timestamp` (String)
   - Use on-demand billing mode for unpredictable traffic patterns
   - Enable DynamoDB Streams with NEW_AND_OLD_IMAGES stream view type
   - All data must be encrypted using customer-managed KMS key

5. **Dead Letter Queue**
   - Create SQS Dead Letter Queue for failed webhook processing
   - Configure 14-day message retention period
   - Subscribe SNS topic to DLQ for critical alerts
   - Encrypt queue using customer-managed KMS key

6. **SNS Topic**
   - Create SNS topic for critical alerts when messages appear in DLQ
   - Configure CloudWatch alarm to monitor DLQ message count
   - Encrypt topic using customer-managed KMS key

7. **Customer-Managed KMS Key**
   - Create single KMS key for all encryption needs (DynamoDB, SQS, SNS, Lambda environment variables)
   - Enable key rotation
   - Configure key policy for service access

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- Use **API Gateway** for webhook endpoint
- Use **AWS Lambda** with Python 3.11 runtime and ARM64 architecture
- Use **DynamoDB** with on-demand billing and streams enabled
- Use **SQS** for dead letter queue with 14-day retention
- Use **SNS** for critical alerting
- Use **AWS WAF** for API Gateway rate limiting
- Use **AWS KMS** customer-managed key for all encryption
- Use **X-Ray** for distributed tracing across all services
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environmentSuffix`
- All resources must be destroyable (RemovalPolicy.DESTROY, no deletion protection)

### Constraints

- Lambda functions must use ARM64 architecture for cost efficiency
- Reserved concurrent executions: 100 for webhook receiver, 50 for payment processor
- API Gateway must have rate limiting at 10 requests per second per IP address
- API Gateway burst limit: 1000 requests per second
- DynamoDB must use on-demand billing mode (no provisioned capacity)
- All encryption must use single customer-managed KMS key
- Dead letter queue retention must be exactly 14 days
- X-Ray tracing must be enabled on all Lambda functions and API Gateway
- All resources must support clean teardown (no retention policies)
- Include proper error handling and logging in all Lambda functions

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All named resources must include environmentSuffix parameter in their names to prevent collision during parallel deployments
- **Destroyability Requirement**: All resources must use RemovalPolicy.DESTROY and must NOT have deletion protection enabled
- **Lambda Runtime**: Use Python 3.11 runtime (Node.js 18+ has aws-sdk compatibility issues)
- **Resource Dependencies**: Ensure proper dependency chains (KMS key created before resources that use it)

## Success Criteria

- **Functionality**: Complete webhook processing pipeline from API Gateway through Lambda to DynamoDB with audit logging
- **Performance**: Can handle burst traffic of 1000 requests per second with decoupled processing
- **Reliability**: Failed webhooks captured in DLQ with SNS alerting, DynamoDB streams trigger audit logging
- **Security**: All data encrypted with customer-managed KMS key, WAF rate limiting protecting API, X-Ray tracing enabled
- **Compliance**: Audit trail via DynamoDB streams and dedicated audit logger Lambda function
- **Resource Naming**: All resources include environmentSuffix in their names
- **Cost Efficiency**: ARM64 Lambda functions, on-demand DynamoDB billing, no unnecessary resource over-provisioning
- **Code Quality**: Python code following best practices, well-structured, documented

## What to deliver

- Complete **AWS CDK with Python** implementation
- API Gateway REST API with WAF and throttling
- Three Lambda functions (webhook receiver, payment processor, audit logger) with Python 3.11 ARM64 runtime
- Lambda layers for shared dependencies (boto3, cryptography)
- DynamoDB table with streams enabled
- SQS Dead Letter Queue with 14-day retention
- SNS topic for critical alerts
- Customer-managed KMS key for all encryption
- CloudWatch alarms for DLQ monitoring
- X-Ray tracing configuration across all services
- IAM roles and policies with least privilege access
- Unit tests for all infrastructure components
- Documentation including architecture overview and deployment instructions
