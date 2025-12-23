# Serverless Infrastructure - CDK TypeScript Implementation

I need a CDK TypeScript application that sets up a serverless architecture using AWS services. The main component is an AWS Lambda function that gets triggered when files are uploaded to an S3 bucket.

This was originally going to be done with Terraform/HCL but needs to be CDK TypeScript instead.

## What I Need

Build a CDK TypeScript application with these specs:

### Basic Setup

1. Use CDK TypeScript for all resource definitions
2. Create a Lambda function that runs when files get uploaded to an S3 bucket  
3. Set up the S3 bucket to trigger the Lambda on object creation
4. Configure IAM so the Lambda can read and modify S3 objects
5. Deploy everything in us-west-2
6. Tag all resources with Environment=Production
7. Use Python 3.11 for the Lambda runtime
8. Turn on S3 versioning
9. Block all public access to the S3 bucket

### Implementation Details

Lambda Function:
- Python 3.11 runtime
- Handle S3 object creation events
- Include error handling and logging
- Optimize for serverless execution

S3 Bucket:
- Versioning enabled
- Public access blocked
- Event notifications for Lambda triggers
- Lifecycle policies for cost savings

IAM Security:
- Minimal required permissions
- Lambda execution role with S3 access
- Proper resource policies

Infrastructure:
- Good naming conventions
- Environment-specific config  
- Cost optimization
- Monitoring setup

### Lambda Function Code

The Lambda should:
- Process S3 object creation events
- Read object metadata and content
- Do basic processing like logging and validation
- Show S3 read/write operations
- Handle errors properly with logging

## Environment Details

- Platform: AWS CDK with TypeScript
- Region: us-west-2
- Lambda Runtime: Python 3.11
- Environment: Production serverless architecture

## What I Expect

A working CDK TypeScript application that:
- Deploys a functional serverless architecture
- Has Lambda function with S3 event trigger
- Sets up proper IAM roles and permissions
- Follows CDK TypeScript best practices
- Passes CDK synthesis checks
- Tags all resources properly
- Implements AWS security best practices

## Requirements

1. Use CDK TypeScript patterns for all infrastructure
2. Deploy Lambda triggered by S3 bucket events
3. Use IAM roles for Lambda S3 read/write access
4. Create all resources in us-west-2
5. Tag everything with Environment=Production
6. Lambda must use Python 3.11
7. S3 bucket must have versioning enabled
8. S3 bucket policy must deny public access
9. Handle resource naming and provide useful error messages

This needs to be production-ready serverless architecture with event-driven processing.