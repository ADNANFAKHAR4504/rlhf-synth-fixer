# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi **TypeScript** program to deploy a serverless transaction processing system. The configuration must:

1. Create an S3 bucket for storing audit logs with lifecycle rules to transition objects to Glacier after 90 days
2. Set up a DynamoDB table named 'transactions' with partition key 'transactionId' (string) and sort key 'timestamp' (number)
3. Deploy three Lambda functions: 'validator' for input validation, 'processor' for transaction processing, and 'notifier' for sending alerts
   - **Note**: Lambda functions should use **Go 1.x runtime** (this is the application code runtime, not the IaC language)
4. Configure an API Gateway with POST endpoint '/transaction' that triggers the validator Lambda
5. Set up Lambda destinations where successful validations trigger the processor function
6. Configure the processor Lambda to write to DynamoDB and S3
7. Implement dead letter queues for all Lambda functions using SQS
8. Create CloudWatch log groups with 7-day retention for all Lambda functions
9. Set up IAM roles with least-privilege permissions for each Lambda function
10. Configure API Gateway to return proper HTTP status codes and error messages

**Expected output**: A complete Pulumi TypeScript program that creates all resources with proper dependencies, exports the API Gateway invoke URL, DynamoDB table name, and S3 bucket name.

---

## Additional Context

### Background
A financial technology startup needs to process real-time transaction data from multiple payment providers. They require a serverless architecture that can handle variable loads, perform data validation, and store results for compliance auditing.

### Constraints and Requirements
- [Lambda functions must have 512MB memory and 60-second timeout, DynamoDB tables must use on-demand billing mode, API Gateway must use REST API type with request validation enabled, Lambda functions must use Go 1.x runtime, All functions must have X-Ray tracing enabled, DynamoDB must have point-in-time recovery enabled, API Gateway must implement usage plans with API keys, Lambda functions must have reserved concurrent executions set to 100, S3 bucket must have versioning and server-side encryption enabled]

### Environment Setup
Serverless infrastructure deployed in us-east-2 region using AWS Lambda for compute, API Gateway for REST endpoints, DynamoDB for transaction storage, and S3 for audit logs. Architecture includes three Lambda functions for validation, processing, and notification. Requires Go 1.19+, Pulumi CLI 3.x, and AWS CLI configured with appropriate permissions. All resources deployed in a single AWS account with CloudWatch Logs for monitoring.

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
