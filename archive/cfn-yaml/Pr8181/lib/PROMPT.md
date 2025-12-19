You are an AWS CloudFormation expert.

Create a production-ready CloudFormation YAML template that provisions a highly available, secure, and observable serverless API stack with the following requirements:

Infrastructure Requirements
AWS Lambda:

Use Lambda for serverless compute.
Deploy Lambda functions with 512 MB memory and 15-second timeout.
Set environment variables for Lambda functions.
Enable AWS X-Ray tracing for Lambda.
Lambda functions must use IAM roles with least privilege for DynamoDB access.
Secure sensitive data via AWS Systems Manager Parameter Store.
Amazon API Gateway:

Expose RESTful APIs via API Gateway.
Configure API Gateway with a custom domain name.
Enable AWS X-Ray tracing for API Gateway.
Set up logging to CloudWatch Logs for API Gateway.
Amazon DynamoDB:

Store data in a DynamoDB table with on-demand (PAY_PER_REQUEST) capacity.
Table must have a partition key only schema.
Access must be controlled via least privilege IAM policy.
High Availability:

Deploy all resources in two AWS regions for HA (use AWS::StackSet or provide region parameterization).
Monitoring & Logging:

Configure CloudWatch Alarms to monitor Lambda function errors.
API Gateway and Lambda must log to CloudWatch Logs.
Tagging & Security:

All resources must be tagged with env, name, and team.
Use CloudFormation intrinsic functions for parameterization and environment-specific configuration.
Template Features
Use parameters for:
Environment name (env)
Application name (name)
Team name (team)
Custom domain name for API Gateway
Region (to support multi-region deployment)
Use CloudFormation intrinsic functions for dynamic resource naming and configuration.
All IAM policies must follow the principle of least privilege.
All resource names should be parameterized and include the environment, name, and team where appropriate.
Outputs
API Gateway endpoint and custom domain
Lambda function ARNs
DynamoDB table name and ARN
CloudWatch Log group names for Lambda and API Gateway
CloudWatch Alarm ARNs
