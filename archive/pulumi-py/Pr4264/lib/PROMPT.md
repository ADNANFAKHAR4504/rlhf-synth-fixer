Please design a secure, modular, and scalable serverless infrastructure using Pulumi with Python, based on the following specifications:

- Deploy an API Gateway as the primary interaction point to trigger AWS Lambda functions.
- Implement the AWS Lambda functions using the latest available runtime (e.g., Python 3.11).
- Use DynamoDB with on-demand capacity mode as the primary data store, encrypted using AWS-managed keys.
- Configure an SNS topic for critical alert notifications.
- Store static assets in an S3 bucket with versioning enabled, and block all public read access.
- Integrate AWS X-Ray for tracing requests on all Lambda functions.
- Pass configuration settings to the Lambda function via environment variables.
- Restrict API Gateway access to specific IP addresses.
- Ensure Lambda functions log errors to CloudWatch Logs and configure alarms that trigger when errors exceed 10 within 5 minutes.
- Secure API Gateway endpoints using AWS WAF.
- Use AWS Config to enforce compliance, particularly on IAM role usage.
- Attach least privilege IAM policies to Lambda functions for accessing DynamoDB.
- Implement an AWS Step Function to orchestrate serverless workflows involving Lambda invocations.
- Deploy all resources strictly in the 'us-west-2' region.
- Apply tagging consistently across all resources with the tag 'Project: ServerlessApp'.

Keep your code clean.
