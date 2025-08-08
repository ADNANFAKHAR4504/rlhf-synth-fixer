I need help creating a CDK TypeScript infrastructure for a serverless application. The solution should deploy to us-west-2 region and include the following components:

1. AWS Lambda functions to process HTTP requests (GET, POST, DELETE methods)
2. API Gateway to trigger the Lambda functions with proper endpoint routing  
3. DynamoDB table named 'UserData' with read/write capacity of 5 units each
4. S3 bucket named 'lambda-source-bucket' for Lambda deployment packages
5. IAM role for Lambda execution with DynamoDB access permissions
6. CloudWatch Logs integration for API Gateway logging
7. Environment variables in Lambda functions for database access
8. All resources tagged with 'Environment': 'Production'

Additional requirements:
- Use DynamoDB on-demand pricing for better cost efficiency (this is a newer feature with 50% cost reduction)
- Enable CloudWatch Logs Live Tail for real-time Lambda function log monitoring
- Ensure proper error handling and resource cleanup
- Follow CDK best practices for TypeScript

Please provide the complete CDK TypeScript code. Each file should be in its own code block.