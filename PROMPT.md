# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
>
> Platform: **cdk**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDK TypeScript program to implement an event-driven transaction processing pipeline. The configuration must:

1. Deploy a webhook receiver Lambda function that accepts POST requests and publishes to SNS.
2. Create an SNS topic for incoming transactions with fanout to multiple SQS queues.
3. Set up three SQS queues: high-value (>$10,000), standard ($1,000-$10,000), and low-value (<$1,000).
4. Deploy a transaction validator Lambda triggered by SNS that validates transaction format and publishes results.
5. Create an enrichment Lambda that reads from validation queue and adds customer data from DynamoDB.
6. Implement a routing Lambda that reads enriched transactions and routes to appropriate value-based queues.
7. Configure DynamoDB table for transaction state with partition key 'transactionId' and TTL enabled.
8. Set up dead letter queues for each processing queue with maximum receive count of 3.
9. Create CloudWatch alarms for queue depth exceeding 1000 messages and Lambda errors exceeding 1%.
10. Implement Lambda destinations for async invocations with separate queues for success and failure.

**Expected output:** A complete CDK stack that deploys all resources with proper IAM permissions, encryption, monitoring, and error handling. The stack should output the webhook endpoint URL, SNS topic ARN, and all queue URLs for integration testing.

---

## Background

A financial services company needs to process credit card transactions asynchronously. Transaction events arrive via webhooks and must be validated, enriched with customer data, and then routed to different processing queues based on transaction amount thresholds.

## Environment Setup

Serverless transaction processing system deployed in us-east-1 using Lambda functions for compute, SNS for event fanout, SQS for message queuing, and DynamoDB for transaction state storage. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. Architecture includes webhook receiver Lambda, transaction validator Lambda, enrichment Lambda, and routing Lambda. DynamoDB table stores transaction metadata with on-demand billing. CloudWatch Logs for all Lambda functions with custom retention policies.

## Constraints and Requirements

- Lambda functions must use Node.js 18.x runtime
- All Lambda functions must have X-Ray tracing enabled
- Dead letter queues must retain messages for exactly 14 days
- SNS topics must use server-side encryption with AWS managed keys
- SQS queues must have visibility timeout of 6 times the Lambda timeout
- Lambda functions must use reserved concurrent executions to prevent throttling
- All IAM roles must follow least privilege principle with explicit deny for unnecessary actions
- Lambda functions must use environment variables for configuration, not hardcoded values
- SQS queues must have message retention period of 4 days
- Lambda functions must have CloudWatch Logs retention set to 30 days

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-1**
