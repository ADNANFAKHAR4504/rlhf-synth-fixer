I want to build a simple but production-ready serverless setup using the AWS CDK in Python. The goal is to create an API that lets users send and retrieve data through HTTP requests, which will be handled by a Lambda function and stored in DynamoDB.

The API should be built with API Gateway and configured as an HTTP API that supports CORS so it can accept requests from other domains. The Lambda function will use the Python runtime and should log everything important to CloudWatch Logs for monitoring. It also needs to run under an IAM role that only allows the minimal permissions required — following the least privilege principle.

The DynamoDB table should be set up with `id` as the primary key and `createdAt` as the sort key. Make sure it’s encrypted at rest, since this stack is meant for production use. The Lambda will use environment variables to securely handle sensitive configuration values — like database details or secret keys.

The API Gateway should also be configured to log all request and response details to a specific CloudWatch Logs ARN for visibility. The final setup should result in a working end-to-end pipeline: API Gateway receives the HTTP requests, the Lambda function processes them, and DynamoDB stores the resulting data — all securely and efficiently.

When the stack is complete, include a README file that clearly explains how to deploy it, what configuration values are required, and any steps needed to test the API or check logs.