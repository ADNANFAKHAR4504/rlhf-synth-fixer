# Task: Serverless Infrastructure Deployment

## Task ID: trainr155

## Platform Transformation
**Original**: CloudFormation + YAML  
**Transformed**: CDK + TypeScript (per platform enforcement)

## Task Description
You are tasked with deploying a serverless infrastructure using AWS CDK with TypeScript. Your deployment must include the following components:

1) A Lambda function that can handle HTTP requests routed through an API Gateway.
2) Ensure the Lambda function has minimal IAM permissions necessary to function securely, including logging all invocation details.
3) Create a secure S3 bucket for any data processed by the Lambda function and ensure that all data is encrypted using AWS KMS.
4) Use CloudWatch to track all requests to the Lambda function.
5) The stack must provide outputs for easy retrieval of the API Gateway's invocation URL, the Lambda function's Amazon Resource Name (ARN), and the S3 bucket name.

## Environment
- **Region**: us-east-1
- **Platform**: AWS CDK
- **Language**: TypeScript
- **Infrastructure Type**: Serverless

## Requirements
1. Deploy a Lambda function that responds to HTTP requests via an API Gateway.
2. Use AWS IAM roles to provide the necessary permissions for the Lambda function.
3. Ensure the Lambda function logs all requests and responses to CloudWatch.
4. Automate the creation of an S3 bucket to store any data processed by the Lambda function.
5. The Lambda function should be deployed to the 'us-east-1' region.
6. Encrypt all data stored in the S3 bucket using AWS KMS keys.
7. Provide outputs for the API Gateway URL, Lambda function ARN, and S3 bucket name.

## Expected Output
Your solution should provide CDK TypeScript code that meets all the constraints and requirements. The outputs should be verifiable by deploying the stack into an AWS account.

## Security & Best Practices
- All resources must adhere to security best practices, including proper IAM permissions and data encryption.
- Follow the principle of least privilege for IAM roles.
- Ensure all sensitive data is properly encrypted at rest and in transit.