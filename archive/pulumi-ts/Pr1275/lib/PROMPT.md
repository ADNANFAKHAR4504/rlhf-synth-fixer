I need to create a serverless application infrastructure in AWS using Lambda, API Gateway, and DynamoDB. The application should be deployed in the us-east-1 region.

Requirements:
- Use AWS Lambda functions for serverless computing with automatic scaling
- Set up an API Gateway to provide HTTP access to the Lambda function
- Use DynamoDB as a backend data store with encryption at rest using AWS KMS
- Establish IAM roles following the principle of least privilege for accessing resources  
- Enable CloudWatch for monitoring logs and setting up operational alarms
- Configure necessary environment variables for the Lambda function execution
- Ensure that all DynamoDB data at rest is encrypted
- Ensure the API Gateway includes input validation for requests
- Follow AWS best practices for serverless security, scaling, and deployment

Please use the latest AWS Lambda runtime features like Node.js 22 and include PartiQL query capabilities for DynamoDB interactions. The infrastructure code should be clean and production-ready.

Please provide infrastructure code with one code block per file.