# AWS Serverless Infrastructure with CDK Python

I need help building a serverless application architecture using AWS CDK with Python. The application should handle file processing through S3 events and expose APIs for different business functions.

## Core Requirements

Create a serverless infrastructure that includes:

1. **S3 bucket for file uploads** - Users will upload files here that need processing
2. **Multiple Lambda functions** triggered by S3 events to handle different file types:
   - Image processing function for .jpg/.png files  
   - Document processing function for .pdf/.txt files
   - Data processing function for .csv/.json files
3. **REST API using API Gateway** that provides endpoints to:
   - Get processing status for uploaded files
   - Retrieve processed file metadata
   - List all processed files
4. **IAM roles and policies** with least privilege access for all services
5. **Environment variables** for Lambda functions to configure processing parameters
6. **CloudWatch logging** for monitoring and debugging
7. **Cost optimization** through proper resource sizing and configurations

## Technical Specifications

- Deploy everything in us-east-1 region
- Use latest Python runtime for Lambda functions (Python 3.12)
- Implement retry logic and error handling for Lambda functions
- Tag all resources with Environment, Project, and Owner tags for cost tracking
- Configure S3 bucket notifications to trigger appropriate Lambda functions based on file extensions
- Set up API Gateway with proper CORS configuration
- Use Amazon Bedrock Intelligent Prompt Routing for any AI-powered processing features
- Implement S3 presigned URLs for secure file access following latest security best practices

## Deliverables

Provide the complete CDK Python code organized in separate files:
- Main stack implementation
- Lambda function source code files
- Infrastructure configuration
- Resource outputs including API Gateway URL and Lambda function ARNs

The solution should be production-ready with proper error handling, logging, and security configurations.