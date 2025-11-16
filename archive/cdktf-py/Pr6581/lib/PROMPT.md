# Infrastructure Request: Serverless Payment Processing System

Hey there! I need your help setting up a serverless payment processing system using **CDKTF with Python**. This is for a financial technology startup that needs to handle millions of real-time payment transactions with an event-driven architecture.

## The Business Context

We're building a payment processing platform that needs to:
- Handle variable load patterns with automatic scaling
- Maintain PCI compliance requirements
- Process transactions in real-time
- Scale seamlessly as transaction volumes grow

## What I Need Built

I need a complete serverless payment processing infrastructure deployed to **ap-southeast-1** region using **Terraform CDK (CDKTF) with Python**. Here's what the system should include:

### 1. Lambda Functions (ZIP-based, NOT Container Images)

I need three Lambda functions for payment processing:
- **payment-validator**: Validates incoming payment requests
- **payment-processor**: Processes the actual payment transaction
- **payment-notifier**: Sends notifications after payment completion

**IMPORTANT**: Please use ZIP-based deployments with Python 3.11 runtime, NOT container images. Create actual Lambda handler code in the lib/lambda/ directory and package them as ZIP files.

Each function should:
- Use ARM64 architecture for cost optimization
- Have proper timeout configurations
- Include X-Ray tracing enabled with sampling rate of 0.1
- Use customer-managed KMS keys for environment variable encryption
- Have CloudWatch Log Groups with 7-day retention
- Include metric filters for error tracking
- Have dead letter queues configured for failed invocations with max 3 retry attempts
- Have reserved concurrent executions configured (reasonable values)

### 2. API Gateway REST API

Set up an API Gateway REST API with:
- POST endpoint at /payments that triggers payment-validator synchronously
- Proper integration with Lambda
- Request/response logging enabled
- Throttling configured appropriately

### 3. Message Queuing with SQS

Create SQS queues for communication between functions:
- Queue between validator and processor
- Queue between processor and notifier
- Visibility timeout should be 6x the Lambda timeout
- Dead letter queues for failed messages
- Encryption using customer-managed KMS keys

### 4. DynamoDB for Transaction Storage

Set up a DynamoDB table named 'payment-transactions' with:
- Partition key: 'transaction_id' (String)
- Global secondary index on 'customer_id' attribute
- Point-in-time recovery enabled for data protection
- Stream enabled for EventBridge integration
- Encryption using customer-managed KMS keys
- On-demand billing mode (no provisioned capacity)

### 5. Lambda Layers

Implement Lambda layers for shared code with:
- Versioning support
- Shared dependencies that all functions can use
- Proper permissions for functions to access layers

### 6. EventBridge Integration

Configure EventBridge rules to:
- Trigger payment-notifier on specific DynamoDB stream events
- Filter for completed transactions
- Route events to the notifier function

### 7. IAM Roles and Security

Implement proper IAM roles with least privilege access:
- Separate role for each Lambda function
- Only the permissions each function actually needs
- Roles for API Gateway to invoke Lambda
- Roles for EventBridge to trigger functions

### 8. KMS Encryption

Set up customer-managed KMS keys for:
- Lambda environment variables encryption
- SQS queue encryption
- DynamoDB table encryption
- CloudWatch Logs encryption
- Proper key policies allowing AWS services to use the keys

### 9. Monitoring and Observability

Configure comprehensive monitoring:
- CloudWatch Log Groups with 7-day retention for all Lambda functions
- Metric filters for tracking errors in logs
- X-Ray tracing across all components with 0.1 sampling rate
- CloudWatch alarms for function errors and queue depths

### 10. VPC Configuration

Set up VPC infrastructure:
- VPC with private subnets across 3 availability zones
- NAT instances (not NAT Gateways to save costs) for outbound connectivity
- Security groups with appropriate ingress/egress rules
- VPC endpoints for AWS services (DynamoDB, SQS, Lambda) to reduce NAT costs
- Lambda functions deployed in VPC private subnets

## Important Constraints

Please make sure to follow these specific requirements:

1. CloudWatch Logs retention MUST be 7 days for all function logs
2. Lambda layers MUST be used for shared dependencies
3. Functions MUST use ZIP-based deployments with Python 3.11 runtime (NOT container images)
4. Dead letter queues MUST be configured for all asynchronous invocations
5. Environment variables MUST be encrypted using customer-managed KMS keys
6. X-Ray tracing MUST be enabled for all functions
7. VPC configuration is required with Lambda functions in private subnets
8. Lambda functions MUST use ARM64 architecture
9. All functions MUST have reserved concurrent executions configured (use reasonable values like 5-10)
10. Use NAT instances instead of NAT Gateways for cost savings

## Code Organization

Please organize the code in a modular way:
- Separate constructs/classes for Lambda functions, API Gateway, DynamoDB, SQS, and monitoring
- Main stack file (tap_stack.py) that orchestrates everything
- Lambda handler code in lib/lambda/ directory
- Clear separation of concerns

## Tagging

All resources should be tagged with:
- Environment: (use the environment_suffix parameter)
- Project: "payment-processing"
- CostCenter: "engineering"

## Resource Naming

All resource names must include the environment_suffix to avoid conflicts. Use a pattern like:
- `payment-validator-{environment_suffix}`
- `payment-queue-{environment_suffix}`
- etc.

## Outputs

The stack should output useful values like:
- API Gateway endpoint URL
- DynamoDB table name
- SQS queue URLs
- Lambda function ARNs
- VPC ID and subnet IDs

These outputs will be used in integration tests.

## What I'm Looking For

I want a production-ready, PCI-compliant serverless payment processing system that:
- Follows AWS best practices
- Implements proper security with encryption and IAM
- Provides comprehensive observability
- Scales automatically with load
- Is cost-optimized (using ARM64, on-demand billing, NAT instances)
- Uses ZIP-based Lambda deployments with actual Python handler code

Can you help me build this using CDKTF with Python? Please provide complete, working code that I can deploy to AWS.
