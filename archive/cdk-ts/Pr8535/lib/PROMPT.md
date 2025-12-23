# Infrastructure Provisioning Task

## Objective
Create a basic AWS CDK TypeScript stack that provisions cloud infrastructure including S3 bucket, Lambda function, and IAM role with proper LocalStack compatibility.

## Requirements
- AWS CDK TypeScript implementation
- S3 bucket for data storage with encryption
- Lambda function for processing with inline code
- IAM role with appropriate permissions
- LocalStack compatibility for local development
- Proper error handling and outputs
- Unit tests with good coverage

## Key Features
- Environment detection (LocalStack vs AWS)
- Configurable removal policies based on environment
- S3 bucket with versioning and encryption
- Lambda function with environment variables
- IAM role with Lambda execution permissions
- CloudFormation outputs for integration

## Technical Specifications
- Runtime: Node.js 18.x for Lambda
- S3 encryption: S3-managed
- Block public access on S3 bucket
- Versioning enabled for production environments
- Auto-delete objects in LocalStack for testing

## Expected Deliverables
- CDK stack implementation
- Unit tests with coverage
- Integration with CI/CD pipeline
- LocalStack deployment support
