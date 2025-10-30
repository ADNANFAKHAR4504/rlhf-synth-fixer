# Serverless Infrastructure

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **eu-west-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a serverless webhook processing system. The configuration must: 1. Create a DynamoDB table to store webhook events with partition key 'eventId' and sort key 'timestamp' 2. Deploy a Lambda function that processes incoming webhooks and stores them in DynamoDB 3. Set up an API Gateway REST API with a POST endpoint '/webhook' that triggers the Lambda 4. Configure Lambda environment variables for DynamoDB table name and AWS region 5. Implement SNS topic for failed webhook notifications with email subscription 6. Add CloudWatch alarms for Lambda errors exceeding 5% error rate in 5 minutes 7. Set Lambda timeout to 30 seconds and memory to 512MB 8. Enable API Gateway request validation for JSON payload with required 'source' and 'data' fields 9. Configure Lambda dead letter queue using SQS for failed executions 10. Add API Gateway usage plan with 1000 requests per day limit. Expected output: A fully deployed serverless infrastructure that accepts webhook POST requests, processes them through Lambda, stores events in DynamoDB, and handles failures through SNS notifications and SQS dead letter queue.

---

## Additional Context

### Background
A startup needs to build a serverless notification system that processes webhook events from multiple third-party services. The system must handle varying traffic patterns and provide reliable message delivery with retry capabilities.

### Constraints and Requirements
- Lambda function must use Node.js 18.x runtime
- DynamoDB table must have on-demand billing mode
- API Gateway must use edge-optimized endpoint configuration
- All Lambda logs must be retained for 7 days in CloudWatch
- SNS topic must have server-side encryption enabled
- Lambda function must have X-Ray tracing enabled
- API Gateway must return proper HTTP status codes (200 for success, 400 for validation errors)
- SQS dead letter queue must have message retention period of 14 days

### Environment Setup
Serverless infrastructure deployed in eu-west-1 using Lambda for webhook processing, DynamoDB for event storage, API Gateway for HTTP endpoints, SNS for notifications, and SQS for dead letter queue. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS CLI configured. No VPC required as all services are managed AWS serverless offerings.

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
All resources should be deployed to: **eu-west-1**
