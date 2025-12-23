# Infrastructure as Code Task - Serverless Transaction Processing Pipeline

## Platform and Language
Create infrastructure using **CDKTF (CDK for Terraform) with Python**.

## Problem Statement

Create a Terraform configuration to build a serverless transaction processing pipeline. The configuration must:

1. Define an API Gateway REST API with a POST endpoint at /upload that accepts multipart/form-data
2. Create a Lambda function that validates uploaded CSV files against a predefined schema and stores valid files in S3
3. Configure a Step Functions state machine with states for validation, processing, and notification that triggers on S3 object creation
4. Implement a Lambda function for data transformation that reads from S3 and writes results to DynamoDB
5. Create a notification Lambda that sends processing results to an SNS topic for downstream consumers
6. Set up DynamoDB tables for tracking processing status and storing transformed data with global secondary index on timestamp
7. Configure IAM roles with least privilege access for each Lambda function and Step Functions execution
8. Implement CloudWatch alarms for Lambda errors exceeding 5% error rate in 5-minute windows
9. Add API Gateway method request validators for required headers and body schema validation
10. Configure Step Functions with error handling states that route to a dead letter queue
11. Enable API Gateway access logging to CloudWatch with custom log format
12. Tag all resources with Environment, Application, and CostCenter tags

Expected output: A complete Terraform configuration with main.tf containing all resources, variables.tf for input parameters, and outputs.tf exposing the API endpoint URL, Step Functions ARN, and DynamoDB table names. The infrastructure should handle 10,000 daily file uploads with sub-second validation response times.

## Background

A financial analytics company needs to process daily transaction reports submitted by partner banks. The system must validate incoming CSV files, orchestrate multi-stage processing workflows, and handle error scenarios gracefully while maintaining audit trails for compliance.

## Environment

Serverless infrastructure deployed in us-east-1 using API Gateway REST API for file upload endpoints, Lambda functions using ZIP deployment for processing logic, Step Functions Express workflows for orchestration, DynamoDB for state tracking and audit logs, S3 for file storage. Requires Terraform 1.5+, AWS CLI configured with appropriate IAM permissions. All resources deployed within default VPC using AWS-managed networking. Lambda packages generated dynamically during synthesis. CloudWatch Logs retention set to 7 days.

## Constraints

- Lambda functions must use ARM64 architecture with 512MB memory allocation
- DynamoDB tables must use on-demand billing mode with point-in-time recovery
- Lambda functions must use ZIP deployment with packages generated dynamically
- Step Functions must use Express workflows for cost optimization
- API Gateway must use REST API type with request validation enabled
- Step Functions state machine must implement retry logic with exponential backoff
- All Lambda functions must have X-Ray tracing enabled
- API Gateway must implement usage plans with 1000 requests per day quota

## Critical Requirements for Synthetic Tasks

### Resource Naming
- ALL named resources MUST include the `environment_suffix` variable in their names
- Pattern: `resource-name-${environment_suffix}` or `resource-name-${var.environment_suffix}`
- This ensures unique resource names across parallel deployments

### Destroyability
- NO resources should have deletion protection enabled
- NO RetainPolicy or DeletionPolicy set to RETAIN
- All resources must be destroyable via `cdktf destroy`

### Lambda Functions
- If using Node.js 18+, use AWS SDK v3 (@aws-sdk/client-*) or extract data from event object
- For Python, use boto3 (always available in Lambda runtime)
- Keep Lambda code simple and focused on the task

### Testing
- Implement comprehensive unit tests with 90%+ code coverage
- Unit tests should validate resource configuration and infrastructure patterns
- Integration tests should verify deployed resources work correctly

### Security Best Practices
- Use IAM least privilege for all roles
- Enable encryption at rest where applicable
- Use AWS-managed KMS keys (alias/aws/s3) for simplicity