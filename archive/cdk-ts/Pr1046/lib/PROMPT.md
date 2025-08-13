Create a serverless greeting API using AWS CDK TypeScript. I need the following AWS infrastructure:

1. An AWS Lambda function that returns a greeting message when invoked
2. Amazon API Gateway REST API with GET endpoint to trigger the Lambda function
3. IAM role for the Lambda function with CloudWatch Logs permissions
4. Environment variables for the Lambda function to customize greeting messages

Please deploy this in the us-west-2 region. The Lambda function should use Function URLs for direct HTTPS access and implement proper error handling. Also include Lambda SnapStart optimization to reduce cold start times.

Provide the complete infrastructure code with one code block per file.