I need to build a secure web application infrastructure on AWS using CDK TypeScript. The architecture needs to show how services connect and interact with proper security at every layer.

Here's what I need:

Create an API Gateway REST API that serves as the main entry point for HTTP requests. This API should be protected by WAF rules to block common web attacks like SQL injection and XSS. The API Gateway needs to integrate with Lambda functions for backend processing, passing requests through to the Lambda handlers.

The Lambda functions should connect to a DynamoDB table for storing and retrieving application data. These functions need IAM roles that grant only the specific DynamoDB permissions they require - no wildcard access. The Lambda functions should also be able to read from and write to an S3 bucket for handling file uploads and serving static content.

All data at rest must be encrypted using KMS keys. The DynamoDB table should use a KMS key for encryption, the S3 bucket should use the same or a separate KMS key for server-side encryption, and Lambda environment variables containing sensitive data should also be encrypted with KMS.

The S3 bucket needs versioning enabled and should be configured to send access logs to CloudWatch Logs. The API Gateway should also stream execution logs and access logs to CloudWatch so we can monitor the request flow from API Gateway through Lambda to DynamoDB.

IAM policies must follow least-privilege principles - Lambda functions should only have the specific permissions they need to access particular DynamoDB tables and S3 bucket paths, not broad wildcard access.

Tag everything with 'Environment: Production' for resource tracking.

Deploy this in us-east-1. Give me the full CDK TypeScript code that shows these service integrations with proper security controls at each connection point.