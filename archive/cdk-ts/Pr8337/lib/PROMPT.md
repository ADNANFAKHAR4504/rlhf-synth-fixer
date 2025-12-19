# AWS Serverless Infrastructure with Lambda, S3, and DynamoDB

I need to create AWS infrastructure using CDK TypeScript that includes:

1. An AWS Lambda function using Python 3.8 runtime
2. An S3 bucket that triggers the Lambda function when objects are created
3. A DynamoDB table to log Lambda invocations with unique request ID and timestamp
4. Deploy everything in the us-west-2 region
5. Proper IAM roles and permissions following security best practices

The Lambda function should process S3 object creation events and store invocation logs in DynamoDB. Use DynamoDB's latest cost-optimized on-demand billing mode and consider DynamoDB local version 3.0.0 compatibility for development. 

Please provide the complete infrastructure code with one code block per file. Include proper error handling and follow AWS security best practices for IAM permissions.