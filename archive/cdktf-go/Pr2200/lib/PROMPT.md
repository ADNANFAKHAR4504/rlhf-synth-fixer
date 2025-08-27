# Task: Serverless Infrastructure - trainr963

## Problem Statement
You are tasked with setting up a serverless infrastructure on AWS using CloudFormation. The goal is to design a solution that includes multiple AWS services interacting seamlessly while meeting the following requirements:

1. Implement AWS Lambda functions triggered by API Gateway endpoints.
2. Configure the functions to log to CloudWatch with specified retention policies.
3. Use IAM roles for security, ensuring minimal permissions are assigned.
4. Leverage DynamoDB for session management with on-demand capacity.
5. Ensure the infrastructure is robust, cost-effective, and follows best security practices (e.g., running within a VPC, using encryption at rest).

## Environment
- **Region**: us-east-1
- **Focus**: Serverless architecture using AWS services
- **Priority**: Security, scalability, and cost-effectiveness within a VPC configuration

## Constraints (15 total)
1. Ensure all Lambda functions are using the latest runtime version available.
2. Configure a CloudWatch Log Group with a retention period of 30 days for each Lambda function.
3. Create IAM roles specific to each Lambda function with the minimum permissions required.
4. Include environment variables for Lambda functions to configure logging levels (e.g., DEBUG, INFO).
5. Use S3 buckets for Lambda deployment packages with proper access control.
6. Implement an API Gateway to handle HTTP requests and integrate it with Lambda functions.
7. Enable X-Ray tracing for all Lambda functions integrated with the API Gateway.
8. Create DynamoDB tables with on-demand capacity mode to store session data.
9. Configure alarms in CloudWatch for Lambda function errors exceeding 5 in 5 minutes.
10. Utilize AWS Parameter Store to secure sensitive data (e.g., API keys) used by Lambda functions.
11. Adopt a naming convention throughout the stack for resources (e.g., myapp-component-name-stage).
12. Deploy the infrastructure in a VPC with at least two subnets across different Availability Zones.
13. Ensure Lambda functions run inside the VPC and have necessary VPC endpoint access.
14. Set up S3 bucket policies to allow only HTTPS requests.
15. Enable encryption at rest for all S3 buckets and DynamoDB tables.

## Platform Requirements
- **Platform**: CDKTF (Terraform CDK)
- **Language**: Go
- **Note**: As per platform enforcement requirements, this must be implemented using CDKTF with Go

## Expected Output
Create a CDKTF configuration in Go that meets all the requirements. The stack should be deployable in us-east-1 and pass validation tests according to the specified constraints.

## Task Details
- **Task ID**: trainr963
- **Difficulty**: Hard
- **Team**: synth
- **Status**: In Progress