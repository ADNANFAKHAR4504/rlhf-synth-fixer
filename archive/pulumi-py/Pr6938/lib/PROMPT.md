# Serverless Webhook Processor for Payment Notifications

Hey team,

We need to build a serverless event processing system for a fintech startup that handles payment notifications from multiple payment providers. The business wants a scalable, cost-effective solution that can process webhook events in real-time, validate signatures for security, and store transaction data while maintaining PCI compliance standards. I've been asked to create this using **Pulumi with Python**.

The system needs to handle webhook events from various payment providers like Stripe, PayPal, and Square. Each provider sends notifications when transactions are completed, refunded, or disputed. We need to validate these webhooks to ensure they're legitimate, process the event data, store transaction records, and distribute events to downstream services that handle notifications, analytics, and fraud detection.

## What we need to build

Create a serverless webhook processing system using **Pulumi with Python** for payment notification handling.

### Core Requirements

1. **Lambda Webhook Processor**
   - Create a Lambda function with 1GB memory and 60-second timeout to process incoming webhooks
   - Use ARM64 architecture for cost optimization
   - Enable X-Ray tracing for debugging
   - Set reserved concurrent executions to 100 to prevent throttling

2. **Transaction Storage**
   - Configure DynamoDB table 'payment-transactions' with partition key 'transaction_id' and sort key 'timestamp'
   - Use point-in-time recovery for data protection
   - Use on-demand billing mode for cost optimization
   - Enable encryption at rest using customer-managed KMS key

3. **Event Distribution**
   - Create SNS topic 'payment-events' for distributing processed events to downstream services
   - Encrypt SNS topic using customer-managed KMS key

4. **Error Handling**
   - Implement Lambda Dead Letter Queue using SQS
   - Configure 5 retry attempts for failed events
   - Encrypt SQS queue using customer-managed KMS key

5. **Security and Secrets Management**
   - Create customer-managed KMS key for encrypting DynamoDB, SQS, and SNS
   - Configure Lambda environment variables for API keys using AWS Systems Manager Parameter Store
   - Implement IAM roles with least-privilege policies for each service

6. **Monitoring and Logging**
   - Set up CloudWatch Log Groups with 30-day retention for all Lambda functions
   - Enable X-Ray tracing on Lambda functions

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Lambda** for webhook processing (ARM64, 1GB memory, 60s timeout)
- Use **DynamoDB** for transaction storage (on-demand billing, PITR enabled)
- Use **SNS** for event distribution
- Use **SQS** for dead letter queue
- Use **KMS** for encryption at rest
- Use **Systems Manager Parameter Store** for secrets management
- Use **CloudWatch Logs** for monitoring (30-day retention)
- Use **X-Ray** for tracing
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${environment_suffix}`
- All resources must be destroyable (no Retain policies, no DeletionProtection)

### Constraints

- Lambda functions must use ARM64 architecture for cost optimization
- All sensitive data must be encrypted at rest using customer-managed KMS keys
- DynamoDB tables must use point-in-time recovery and on-demand billing mode
- Lambda functions must have reserved concurrent executions set to 100
- All resources must be tagged with Environment, CostCenter, and Owner tags
- IAM roles must implement least-privilege access policies
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: ALL resource names MUST include the `environment_suffix` parameter to ensure uniqueness across parallel deployments
- **Destroyability Requirement**: ALL resources MUST be destroyable - no RemovalPolicy.RETAIN, no DeletionProtection enabled, no retention policies that prevent cleanup
- **Lambda Runtime**: Use Python 3.9 or later runtime for Lambda functions
- **KMS Key Deletion**: Configure KMS key deletion window (7-30 days) to allow cleanup

## Success Criteria

- **Functionality**: Lambda processes webhooks and stores data in DynamoDB, failed events go to DLQ
- **Performance**: Lambda executes within 60 seconds, DynamoDB on-demand scales automatically
- **Reliability**: Dead letter queue captures failed events, point-in-time recovery protects data
- **Security**: All data encrypted with customer-managed KMS keys, IAM least privilege enforced
- **Cost Optimization**: ARM64 Lambda reduces costs, on-demand DynamoDB scales with usage
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: Python code following best practices, well-tested, documented
- **Monitoring**: CloudWatch logs with 30-day retention, X-Ray tracing enabled
- **Compliance**: Meets PCI compliance standards for payment data handling

## What to deliver

- Complete Pulumi Python implementation
- Lambda function for webhook processing with ARM64 architecture
- DynamoDB table with PITR and KMS encryption
- SNS topic for event distribution with KMS encryption
- SQS dead letter queue with KMS encryption
- Customer-managed KMS key for encryption
- IAM roles with least-privilege policies
- CloudWatch Log Groups with 30-day retention
- X-Ray tracing configuration
- Systems Manager Parameter Store integration for secrets
- Unit tests for all components
- Documentation and deployment instructions in README.md
