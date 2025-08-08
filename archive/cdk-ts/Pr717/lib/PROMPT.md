I need help creating a simple serverless web service on AWS using CDK TypeScript. I want to build something with Lambda functions and API Gateway for handling HTTP requests.

The setup should include:
- A Lambda function that processes events from API Gateway
- API Gateway to route HTTP requests to the Lambda function
- CloudWatch monitoring for both services to track performance
- Response streaming capability for the Lambda function (since AWS supports up to 200MB responses now)
- Dynamic routing rules for the API Gateway to handle different request paths

All resources should use the 'projectX' naming prefix and be deployed to us-east-1. I want this to follow serverless best practices.

Can you provide the infrastructure code with separate files for each component?