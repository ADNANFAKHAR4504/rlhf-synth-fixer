# Task: Deploy Secure Serverless Data Processing Pipeline

## Background
A financial services company needs to implement a secure data processing pipeline for customer transaction analysis. The pipeline must meet strict compliance requirements including encryption at rest, in transit, and comprehensive audit logging. All resources must be deployed with least-privilege access controls and automated security scanning.

## Problem Statement
Create a CloudFormation template to deploy a secure serverless data processing pipeline for financial transactions.

## MANDATORY REQUIREMENTS (Must complete)
1. Create an S3 bucket with SSE-KMS encryption using a customer-managed CMK (CORE: S3)
2. Deploy a Lambda function that processes files uploaded to S3 (CORE: Lambda)
3. Configure bucket versioning and lifecycle policies (30-day transition to IA)
4. Create DynamoDB table for transaction metadata with point-in-time recovery
5. Implement least-privilege IAM roles for Lambda with specific S3 and DynamoDB permissions
6. Set up VPC with private subnets and VPC endpoints for S3 and DynamoDB
7. Configure CloudTrail to log S3 data events with log file validation
8. Store Lambda environment variables in Secrets Manager
9. Enable CloudWatch Logs with 90-day retention for Lambda
10. Apply DeletionPolicy: Retain to all resources except CloudWatch Log Groups

## OPTIONAL ENHANCEMENTS (If time permits)
- Add SNS topic for security alerts on failed Lambda executions (OPTIONAL: SNS) - improves incident response
- Implement AWS Config rules for compliance checking (OPTIONAL: Config) - adds continuous compliance monitoring
- Add GuardDuty for threat detection (OPTIONAL: GuardDuty) - enhances security posture

## Environment
Secure multi-AZ deployment in us-east-1 region for financial data processing. Infrastructure includes S3 for encrypted data storage, Lambda for serverless processing, DynamoDB for transaction metadata, and comprehensive security monitoring via CloudTrail and CloudWatch. VPC with private subnets across 2 AZs, VPC endpoints for AWS services. Requires AWS CLI configured with appropriate permissions. KMS customer-managed keys for encryption. Secrets Manager for sensitive configuration management.

## Constraints
- All S3 buckets must have versioning enabled and use SSE-KMS encryption with customer-managed keys
- Lambda functions must use environment variables stored in Secrets Manager for any sensitive configuration
- All IAM roles must follow least-privilege principles with no wildcard (*) permissions on actions
- VPC endpoints must be used for S3 and DynamoDB to avoid internet-based traffic
- CloudTrail must be configured to log all data events for the S3 buckets with log file validation enabled
- All resources must have DeletionPolicy set to Retain except for CloudWatch Log Groups

## Expected Output
A CloudFormation YAML template that deploys a fully secure data processing pipeline with encryption at all layers, comprehensive audit logging, and least-privilege access controls meeting financial industry compliance standards.
