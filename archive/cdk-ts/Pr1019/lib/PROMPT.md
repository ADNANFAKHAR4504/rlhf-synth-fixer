# Serverless Infrastructure - CDK TypeScript Implementation

Create a CDK TypeScript application to provision a serverless application architecture using AWS services. The application involves setting up an AWS Lambda function triggered by events in an S3 bucket.

**Original Terraform/HCL task converted to CDK TypeScript per platform enforcement**

## Requirements

Create a CDK TypeScript application that implements a comprehensive serverless architecture with the following specifications:

### Core Requirements

1. **CDK TypeScript**: Use CDK TypeScript patterns to define all resources
2. **Lambda Function**: Provision a Lambda function that automatically executes in response to file uploads to an S3 bucket  
3. **S3 Event Trigger**: Configure S3 bucket to trigger Lambda function on object creation events
4. **IAM Permissions**: Configure IAM roles so that the Lambda function has permissions to access and modify objects in the S3 bucket
5. **Region**: Ensure all resources are created within the 'us-west-2' AWS region
6. **Resource Tagging**: Apply a 'Production' environment tag to all resources for identification purposes
7. **Lambda Runtime**: The Lambda function's runtime should be Python 3.11 (latest supported)
8. **S3 Versioning**: Enable versioning on the S3 bucket
9. **S3 Security**: Set an S3 bucket policy that blocks all public access

### Implementation Features

- **Lambda Function Configuration**:
  - Python 3.11 runtime
  - Proper event handling for S3 object creation
  - Error handling and logging
  - Resource optimization for serverless execution

- **S3 Bucket Setup**:
  - Versioning enabled
  - Public access blocked
  - Event notifications configured for Lambda triggers
  - Lifecycle policies for cost optimization

- **IAM Security**:
  - Least privilege access principles
  - Lambda execution role with S3 permissions
  - Proper resource-based policies

- **Infrastructure Best Practices**:
  - Resource naming conventions
  - Environment-specific configurations  
  - Cost optimization features
  - Monitoring and observability

### Lambda Function Logic

The Lambda function should:
- Process S3 object creation events
- Read object metadata and content
- Perform basic processing (e.g., logging, validation)
- Demonstrate S3 read/write operations
- Include proper error handling and logging

## Environment

- **Target Platform**: AWS CDK with TypeScript
- **Primary Region**: us-west-2
- **Runtime**: Python 3.11 for Lambda function
- **Environment**: Production-grade serverless architecture

## Expected Output

A complete CDK TypeScript application that:
- Deploys a fully functional serverless architecture
- Includes Lambda function with S3 event trigger
- Implements proper IAM roles and permissions
- Follows CDK TypeScript best practices
- Passes CDK synthesis without errors
- Includes comprehensive resource tagging
- Implements AWS security best practices

## Constraints

1. Use CDK TypeScript patterns and conventions for all infrastructure
2. Deploy a Lambda function triggered by S3 bucket events
3. Use AWS IAM roles to allow the Lambda function to read from and write to the S3 bucket
4. Ensure all resources are created in the 'us-west-2' region
5. Tag all resources with 'Environment=Production'
6. The Lambda function must use Python 3.11 runtime
7. The S3 bucket must have versioning enabled
8. Ensure that the S3 bucket policy denies public access
9. The deployment should handle resource naming and provide meaningful error messages

This implementation must demonstrate production-ready serverless architecture with comprehensive event-driven processing capabilities.