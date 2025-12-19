We need to build a serverless application using AWS CDK with TypeScript that handles data processing and monitoring. The application should include Lambda functions for processing incoming data, an S3 bucket for storage, and DynamoDB for metadata tracking.

The solution needs to incorporate some recent AWS features like Lambda Fault Injection Service for testing resilience and CloudWatch Application Signals for monitoring. Security is important so all resources should be properly encrypted and follow least privilege access patterns.

For the Lambda functions, keep timeouts reasonable around 30 seconds and make sure to use environment variables for configuration. Include proper error handling and logging throughout. The application should be deployable to us-west-2 region.

Please provide the infrastructure code as separate files - one for the main stack, one for the Lambda construct, and one for the storage construct. Each construct should be modular and reusable.