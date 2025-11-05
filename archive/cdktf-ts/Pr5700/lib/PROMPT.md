# Application Deployment

CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts

Platform: cdktf
Language: ts
Region: ap-southeast-1

Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF program to build a serverless webhook processing system. The configuration must:

1. Deploy a REST API using API Gateway with POST and GET endpoints for webhook reception and status queries.

2. Create a Lambda function to validate incoming webhooks and store them in a DynamoDB table with TTL enabled for 7 days.

3. Set up an SQS queue with a dead letter queue for failed messages after 3 retries.

4. Deploy a Lambda function that processes messages from the SQS queue and stores results in S3.

5. Configure Lambda functions with appropriate IAM roles and environment variables.

6. Set up DynamoDB with on-demand billing and partition key 'webhookId'.

7. Enable X-Ray tracing on all Lambda functions for debugging.

8. Configure API Gateway with throttling limits of 100 requests per second.

9. Create CloudWatch alarms for Lambda errors exceeding 1% error rate.

10. Tag all resources with 'Environment: Production' and 'Team: Platform'.

Expected output: A fully deployed serverless infrastructure with API endpoints returning webhook IDs on POST requests and processing status on GET requests. All webhook data should flow through the queue for async processing with results stored in S3.

---

## Additional Context

### Background

A startup needs to build a serverless event processing system that receives webhooks from various third-party services. The system must process events asynchronously while maintaining high reliability and providing real-time status updates through a REST API.

### Constraints and Requirements

- Lambda functions must have 512MB memory and 30-second timeout
- DynamoDB table must use on-demand pricing mode
- SQS visibility timeout must be 6 times the Lambda timeout
- API Gateway must use Regional endpoint type
- S3 bucket must have versioning enabled
- All Lambda functions must use Node.js 18 runtime
- Dead letter queue must retain messages for 14 days
- API responses must include CORS headers for browser compatibility

### Environment Setup

Serverless webhook processing system deployed in ap-southeast-1 using API Gateway for HTTP endpoints, Lambda functions for compute, DynamoDB for webhook metadata storage, SQS for message queuing, and S3 for processed results. Requires CDKTF with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. Architecture includes async processing with dead letter queue support and monitoring through CloudWatch and X-Ray.

## Project-Specific Conventions

### Resource Naming

All resources must use the `environmentSuffix` variable in their names to support multiple PR environments. Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix.

### Testing Integration

Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`. Tests should validate actual deployed resources.

### Resource Management

Infrastructure should be fully destroyable for CI/CD workflows. Exception: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack. Avoid using DeletionPolicy: Retain unless absolutely necessary.

### Security Baseline

- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region

All resources should be deployed to: ap-southeast-1
