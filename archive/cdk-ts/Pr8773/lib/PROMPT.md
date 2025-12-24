I need help creating infrastructure for a serverless web application using AWS CDK with TypeScript. The application should have a Python 3.8 Lambda function that serves as an API backend, accessible through API Gateway.

Here are the requirements:

1. Create an AWS Lambda function using Python 3.8 runtime that can handle HTTP requests
2. Set up API Gateway HTTP API v2 (not REST API) to trigger the Lambda function - I want to take advantage of the lower costs and better performance 
3. The Lambda function needs proper IAM role with CloudWatch Logs permissions for logging
4. Include an S3 bucket for storing Lambda deployment artifacts with server-side encryption enabled
5. Enable CloudWatch Lambda Insights for the function so I can monitor performance metrics and troubleshoot issues
6. Make sure the API Gateway uses TLS 1.3 for better security

The Lambda function should be a simple Hello World that returns a JSON response with a message and timestamp. I want to use CDK constructs to define everything and make sure it's properly structured for production use.

Can you provide the complete infrastructure code using CDK TypeScript? I need one code block per file so I can easily implement it.