Use AWS CDK in TypeScript to create a serverless application consisting of an AWS Lambda function, a DynamoDB table, and an API Gateway. Use AWS Lambda to run serverless functions with a memory size of at least 256 MB and a timeout of 10 seconds, implementing DynamoDB with a provisioned read capacity of 5 and write capacity of 5.

Create an API Gateway with a REST API that triggers the Lambda function, ensuring the Lambda function and DynamoDB table are in the same AWS region (us-west-2). Use IAM roles to ensure the Lambda function has permission to write to the DynamoDB table with the principle of least privilege. Enable X-Ray tracing on both Lambda and API Gateway for monitoring purposes and set up logging for both components to CloudWatch Logs.

Implement DynamoDB with a primary key consisting of 'UserId' as the Partition Key and enable Auto Scaling based on consumed read and write capacity. Use TypeScript for defining the function logic of AWS Lambda with environment variables for configurable parameters. Configure CORS for the API Gateway to allow requests from a specific origin and implement a dead-letter queue for the Lambda function using an SQS queue.

Ensure the API Gateway stage is deployed and points to the correct Lambda function with an HTTP method (GET). Validate the JSON passed to the Lambda function using API Gateway models and create a Lambda function error metric in CloudWatch for alerting purposes. Tag all resources with 'Project:ServerlessInfra'.

Design:
The solution should be implemented using modular constructs for reusability, organizing components into separate files within the lib directory. Create separate construct files for Lambda, DynamoDB, API Gateway, and monitoring components. All resources must use the environmentSuffix parameter for consistent naming and tagging. If the environmentSuffix does not contain "prod", every resource should be configured for destruction to ensure proper cleanup of non-production environments. Everything input parameter except for environmentSuffix should be optional and use an appropriate default value. The design should emphasize clean separation of components, reusable constructs, and compliance with the stated constraints. Follow AWS CDK best practices for TypeScript development and ensure the infrastructure is production-ready with proper error handling.

File Structure:
bin/tap.ts - entrypoint
lib/tap-stack.ts (placeholder with environmentSuffix and will import all modules)
