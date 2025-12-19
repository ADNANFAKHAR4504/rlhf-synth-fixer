Hey there! I need your help designing and implementing a serverless infrastructure using AWS CDK with Python (main.py- single stack). The goal is to create a fully operational environment that meets the following requirements:

We need to use AWS Lambda functions to handle serverless operations, and these functions should be exposed as APIs using API Gateway. The entire setup must operate within a VPC that includes both public and private subnets. For security, each service should have its own least privilege IAM role.

Logging is important, so we need to enable CloudWatch Logs for both the Lambda functions and API Gateway. The Lambda functions should use environment variables for configuration, and these variables must be encrypted. Each Lambda function should have a maximum timeout of 5 minutes and a memory limit of 512 MB. The function code should be deployed from an S3 bucket.

Additionally, we need to configure an SNS topic for error notifications and link it with the Lambda functions to handle errors. Sensitive information should be managed using AWS Parameter Store. Finally, the deployment must be region-specific to `us-west-2`.

The output should be a valid AWS CDK Python implementation that meets all these requirements. Let me know if you need more details!