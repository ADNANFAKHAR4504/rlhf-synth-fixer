I need help building a serverless data processing pipeline on AWS. The system needs to handle incoming data files, process them through Lambda functions, and notify when processing is complete.

Here are the key requirements:

The infrastructure should be deployed in us-east-1 region. I want to use Lambda functions with a 5-minute timeout to process data that comes into an S3 bucket. The S3 bucket should have encryption enabled (AES-256) for security.

When processing completes, send a notification through SNS. The Lambda functions should be triggered via API Gateway endpoints. All function executions should be logged to CloudWatch for monitoring.

For security, everything should be locked down - no public access to S3 or Lambda. Use IAM roles to control who can invoke the functions. Consider using VPC endpoints for added security between services. Also, I'd like to take advantage of Lambda's new SnapStart feature for Java functions if applicable, or the new response streaming capability for better performance.

All resources should be tagged with Environment: Production for cost tracking. The system needs to handle at least 100,000 requests per month reliably.

Please provide the complete infrastructure code using AWS CDK with TypeScript.
