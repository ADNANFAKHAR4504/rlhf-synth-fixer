# Serverless Webhook Processing System

Hey team,

We need to build a serverless webhook processing system for a financial services company that handles payment webhooks. They're experiencing sudden traffic spikes during peak shopping seasons and need infrastructure that can scale automatically while meeting strict PCI compliance requirements. I've been asked to create this in HCL using Terraform.

The business needs a reliable way to receive webhooks from payment processors, validate them, store them temporarily, and process them in batches. They also need dead letter queues to handle failures gracefully and notifications when webhooks are processed. The system has to be fast, secure, and fully auditable.

The challenge here is that we're dealing with financial data, so we need KMS encryption everywhere, X-Ray tracing for debugging, and proper IAM policies that follow least privilege. We also need to make sure the API has a custom domain with an SSL certificate so it looks professional to their payment partners.

## What we need to build

Create a serverless webhook processing system using **Terraform with HCL** for a payment processing API. The infrastructure should handle high-traffic spikes, provide message ordering guarantees, and meet PCI compliance requirements.

### Core Requirements

1. **API Gateway REST API**
   - REST API (not HTTP API) with `/webhooks` POST endpoint
   - Custom domain using existing ACM certificate (provided via variable)
   - Integrate with Lambda for webhook validation
   - CloudWatch Logs with 7-day retention

2. **Webhook Validation Lambda**
   - Python 3.9 runtime with 512MB memory
   - Validates webhook signatures
   - Stores valid payloads in DynamoDB
   - Sends validated webhooks to SQS FIFO queue
   - AWS X-Ray tracing enabled
   - Max concurrent executions: 100

3. **DynamoDB Storage**
   - Partition key: `webhook_id`
   - TTL attribute: `expiry_time` (30 days)
   - KMS encryption at rest
   - Point-in-time recovery enabled

4. **SQS FIFO Queue**
   - Guaranteed message ordering
   - 5-minute visibility timeout
   - KMS encryption
   - Dead letter queue with max receive count: 3

5. **Batch Processing Lambda**
   - Python 3.9 runtime with 512MB memory
   - Polls SQS queue
   - Processes messages in batches of 10
   - Publishes results to SNS topic
   - AWS X-Ray tracing enabled
   - Max concurrent executions: 100
   - Dead letter queue for failed processing

6. **SNS Notifications**
   - Topic for downstream notifications
   - Publishes processed webhook metadata
   - KMS encryption for messages

7. **Monitoring and Logging**
   - CloudWatch Log Groups for all Lambda functions (7-day retention)
   - AWS X-Ray tracing enabled on all functions
   - CloudWatch alarms for dead letter queues

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **API Gateway REST API** for the webhook endpoint
- Use **Lambda** with Python 3.9 for processing
- Use **DynamoDB** for temporary storage with TTL
- Use **SQS FIFO** for guaranteed message ordering
- Use **SNS** for event notifications
- Use **KMS customer-managed keys** for encryption at rest
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${var.environment_suffix}`
- Deploy to **us-east-1** region

### Constraints

- API Gateway must be REST API (not HTTP API) for compatibility
- Lambda runtime: Python 3.9 with 512MB memory allocation
- Lambda concurrent executions: maximum 100 per function
- X-Ray tracing required on all Lambda functions for compliance
- DynamoDB TTL: 30 days for webhook data retention
- SQS visibility timeout: 5 minutes for batch processing
- Batch size: 10 messages per Lambda invocation
- Dead letter queues: max receive count of 3
- CloudWatch Logs: 7-day retention for cost optimization
- KMS encryption: customer-managed keys for DynamoDB and SQS
- Custom domain: use existing ACM certificate ARN (via variable)
- All resources must be destroyable (no Retain policies)
- IAM roles must follow least-privilege principle

## Success Criteria

- **Functionality**: Webhook endpoint accepts POST requests, validates signatures, stores in DynamoDB, queues for processing
- **Performance**: System scales automatically during traffic spikes, processes batches of 10 messages
- **Reliability**: Dead letter queues capture failed messages, X-Ray tracing enables debugging
- **Security**: KMS encryption at rest, IAM least privilege, signatures validated
- **Compliance**: CloudWatch logging, X-Ray tracing, encryption meets PCI requirements
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Code Quality**: HCL syntax, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation
- API Gateway REST API with custom domain
- Two Lambda functions (validation and batch processing) with Python 3.9 code
- DynamoDB table with TTL configuration
- SQS FIFO queue with dead letter queue
- SNS topic for notifications
- KMS keys for encryption
- IAM roles and policies with least privilege
- CloudWatch Log Groups with 7-day retention
- X-Ray tracing configuration
- Terraform outputs for API Gateway URL and custom domain
- Lambda function source code (Python 3.9)
- Documentation for deployment and testing
