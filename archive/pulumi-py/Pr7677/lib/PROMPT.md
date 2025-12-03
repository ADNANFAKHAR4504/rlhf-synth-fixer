# Infrastructure as Code Task

## Platform and Language
**CRITICAL**: This task MUST be implemented using **Pulumi with Python**.

## Task ID
101000957

## Difficulty
hard

## Subtask Category
Serverless Infrastructure

## Background
A financial services startup needs a serverless event processing system to handle real-time transaction notifications. The system must process incoming webhook events from payment providers, validate them, and route them to different processing queues based on transaction type.

## Problem Statement
Create a Pulumi Python program to deploy a serverless event processing pipeline for financial transactions. The configuration must: 1. Set up an API Gateway REST API with a single POST endpoint /webhook that accepts JSON payloads. 2. Create a Lambda function that validates incoming webhook events and extracts transaction metadata. 3. Implement three SQS queues: payments-queue, refunds-queue, and disputes-queue for different transaction types. 4. Deploy a router Lambda function that reads validated events and sends them to appropriate SQS queues based on transaction_type field. 5. Create a DynamoDB table named transaction-events to store processed event IDs for deduplication. 6. Configure dead letter queues for each primary SQS queue with max receive count of 3. 7. Set up CloudWatch Log groups for all Lambda functions with 30-day retention. 8. Implement IAM roles and policies following least privilege principle for all resources. 9. Add API Gateway request validation to ensure webhook payload contains required fields: event_id, transaction_type, amount, and timestamp. 10. Configure Lambda environment variables for queue URLs and table names. 11. Enable X-Ray tracing on all Lambda functions and API Gateway. Expected output: A complete Pulumi Python program that creates all resources with proper configurations, exports the API Gateway endpoint URL, and returns ARNs of all created Lambda functions and SQS queue URLs.

## Environment
Serverless infrastructure deployed in us-east-1 using API Gateway REST API for webhook ingestion, Lambda functions for event processing, DynamoDB for transaction state storage, and SQS for message queuing. Requires Pulumi 3.x with Python 3.8+, AWS CLI configured with appropriate credentials. Architecture includes dead letter queues for failed processing, CloudWatch Logs for monitoring, and IAM roles with least privilege access. VPC endpoints not required as all services are AWS-managed.

## Constraints
1. All Lambda functions must use Python 3.11 runtime with arm64 architecture for cost optimization
2. API Gateway must implement request throttling with 1000 requests per second burst limit
3. DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
4. SQS queues must have message retention period of exactly 7 days
5. Lambda functions must have reserved concurrent executions set to prevent cold starts

## Additional Requirements

### Resource Naming
- ALL resource names MUST include the environmentSuffix parameter
- Format: `resourceName-{{environmentSuffix}}`
- Example: `webhook-api-{{environmentSuffix}}`

### Destroyability
- NO retention policies on any resources
- All resources must be fully destroyable
- Set appropriate deletion/removal policies for testing environments

### Region
- Deploy to: us-east-1

### Security Best Practices
- Implement least privilege IAM policies
- Enable encryption at rest where applicable
- Use AWS managed encryption keys (AWS KMS) when encryption is required
- Enable logging and monitoring via CloudWatch

### Testing Requirements
- Include comprehensive unit tests
- Achieve 100% test coverage
- All tests must pass before deployment

## Expected Deliverables
1. Complete infrastructure code following {platform} {language} best practices
2. Comprehensive unit tests with full coverage
3. Clear documentation of architecture and design decisions
4. Deployment validation and integration tests
