You are an AWS CloudFormation expert.

Create a production-ready CloudFormation YAML template that provisions a serverless API stack with the following requirements:

Infrastructure Requirements
AWS Lambda: Use Lambda for serverless compute. Provide two Lambda functions, each with environment-specific configuration using parameters and intrinsic functions.
API Gateway: Deploy an API Gateway (HTTP or REST) to expose these Lambda functions as HTTP endpoints.
IAM Roles: Define IAM roles with least privilege for Lambda execution (e.g., only allow DynamoDB access if needed, CloudWatch Logs, and SSM Parameter Store if required).
DynamoDB: Include a DynamoDB table for storing incoming request data from the Lambda/API.
Parameterization: Use CloudFormation parameters for:
Environment name/suffix (e.g., dev, staging, prod)
Lambda runtime (e.g., nodejs20.x, python3.12)
DynamoDB table name
Intrinsic Functions: Use !Sub, !Ref, and other intrinsic functions for resource naming and configuration.
Region Compatibility: The template must be deployable in any region that supports Lambda and API Gateway.
Template Features
All resource names should be parameterized and include the environment suffix.
Lambda functions should use environment variables for configuration, set via parameters.
DynamoDB table should use on-demand (PAY_PER_REQUEST) billing mode.
API Gateway should be configured to invoke the Lambda functions using Lambda proxy integration.
Outputs should include:
API endpoint URL
Lambda function ARNs
DynamoDB table name and ARN
IAM role names
