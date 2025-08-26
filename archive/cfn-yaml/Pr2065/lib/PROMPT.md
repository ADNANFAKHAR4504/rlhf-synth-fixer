I need to build a serverless application infrastructure on AWS using CloudFormation. Here are my requirements:

I want to create a task management application where users can create, read, update, and delete tasks through an API. The application should be fully serverless and scalable.

Core Requirements:
1. Create Lambda functions to handle CRUD operations for tasks
2. Set up API Gateway to expose HTTP endpoints that trigger the Lambda functions
3. Use DynamoDB as the database to store task information
4. Implement proper IAM roles and policies with least privilege access
5. Enable CloudWatch logging for monitoring and debugging
6. Use S3 to store task attachments or static content that Lambda functions need to access

Technical Requirements:
- Deploy everything in the us-east-1 region
- Use Lambda response streaming for better performance when returning large task datasets
- Implement Lambda function URLs as backup endpoints alongside API Gateway
- Make sure DynamoDB table has proper indexes for efficient querying
- Set up CloudWatch alarms for monitoring Lambda function errors and duration
- Configure S3 bucket with appropriate access policies for Lambda functions
- Use environment variables in Lambda for configuration
- Ensure all resources are properly tagged for cost tracking

Security Requirements:
- Follow AWS security best practices
- Use IAM roles instead of access keys
- Enable encryption for DynamoDB and S3
- Configure proper CORS for API Gateway if needed
- Set up resource-based policies where appropriate

The infrastructure should be cost-effective and avoid resources that take a long time to deploy. I prefer using serverless services over provisioned ones where possible.

Please provide the complete CloudFormation YAML template that creates this infrastructure. Include all necessary resources, outputs, and proper resource naming conventions.