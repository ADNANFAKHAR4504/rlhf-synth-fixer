Build a serverless infrastructure in AWS using CDK TypeScript that creates a RESTful API.

It should create a REST API with AWS API Gateway that triggers an AWS Lambda function using HTTP POST. Implement the Lambda function in TypeScript ensuring it logs activity to CloudWatch and uses AWS SDK for JavaScript v3. Design an AWS DynamoDB table for data persistence with a primary key called `RequestId` and a Global Secondary Index (GSI) on `Timestamp`.

Set up an S3 bucket with AES-256 encryption and versioning enabled to store media files. Incorporate security and operational best practices such as least privilege for the Lambda IAM role, enabling CORS for GET and POST methods, and setting up AWS WAF to block SQL injections. Throttle API Gateway requests to 100 requests per second and handle Lambda retries for transient errors.

Ensure all resources support both staging and production environments controlled via stack parameters. All resources should have tags for `ProjectName` and `Environment`. Include options to enable data encryption at rest and in transit for DynamoDB. The CloudFormation stack should have a description and metadata for each resource with outputs for API Endpoint and DynamoDB Table ARN.

Design:
All resources must use the environmentSuffix parameter for consistent naming and tagging. If the environmentSuffix does not contain "prod", every resource should be configured for destruction to ensure proper cleanup of non-production environments. Everything input parameter except for environmentSuffix should be optional. Do not create separate stacks or files outside the lib directory. The design should emphasize clean separation of components, reusable constructs, and compliance with the stated constraints. Follow AWS CDK best practices for TypeScript development and ensure the infrastructure is production-ready with proper error handling.
