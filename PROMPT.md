# Serverless Infrastructure

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a serverless payment webhook processing system. The configuration must: 1. Create a DynamoDB table for storing transaction records with partition key 'transactionId' and sort key 'timestamp'. 2. Deploy a Lambda function that processes incoming webhook payloads and stores them in DynamoDB. 3. Set up an API Gateway REST API with a POST endpoint '/webhook' that triggers the Lambda function. 4. Implement request validation on the API Gateway to ensure the payload contains required fields: 'amount', 'currency', and 'provider'. 5. Create an S3 bucket for storing daily transaction reports with server-side encryption enabled. 6. Deploy a scheduled Lambda function that runs daily at 2 AM UTC to generate CSV reports from DynamoDB data. 7. Configure CloudWatch Log Groups for both Lambda functions with 7-day retention. 8. Set up appropriate IAM roles and policies for Lambda functions to access DynamoDB and S3. 9. Enable API Gateway logging to CloudWatch. 10. Add resource tags including 'Environment: production' and 'Project: payment-processor'. Expected output: The program should create a fully functional serverless architecture where payment providers can POST transaction data to the API endpoint, data is stored in DynamoDB, and daily reports are automatically generated and stored in S3.

---

## Additional Context

### Background
A fintech startup needs to build a serverless transaction processing system that can handle payment webhooks from multiple providers. The system must process incoming transactions, store them in a database, and generate audit reports stored in S3.

### Constraints and Requirements
- [Lambda functions must use Node.js 18.x runtime, API Gateway must implement rate limiting of 1000 requests per minute, DynamoDB table must use on-demand billing mode, S3 bucket must have versioning enabled and lifecycle policy to move reports to Glacier after 90 days, All Lambda function memory must be set to 512 MB, API Gateway must return standardized JSON error responses with appropriate HTTP status codes]

### Environment Setup
Serverless infrastructure deployed in ap-southeast-2 using API Gateway for HTTP endpoints, Lambda functions for processing logic, DynamoDB for transaction storage, and S3 for report archival. Requires Pulumi CLI 3.x with TypeScript/Node.js 16+, AWS CLI configured with appropriate permissions. No VPC required as all services are fully managed. CloudWatch for monitoring and logging across all components.

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
All resources should be deployed to: **ap-southeast-1**
