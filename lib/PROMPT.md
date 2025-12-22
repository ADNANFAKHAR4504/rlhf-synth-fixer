## Serverless Application Requirements

Create a CloudFormation template in YAML for a serverless application that implements a complete request-response flow through interconnected AWS services.

### Service Integration and Data Flow

Design a serverless API where **API Gateway acts as the entry point** and routes incoming HTTP requests to Lambda functions, which then perform CRUD operations on DynamoDB:

1. **API Gateway → Lambda Invocation**: API Gateway receives HTTP requests on specific routes and directly invokes Lambda functions:
   - POST `/user` request triggers CreateUserFunction
   - GET `/user/{id}` request triggers GetUserFunction

2. **Lambda → DynamoDB Read/Write Operations**: Lambda functions interact with DynamoDB to persist and retrieve user data:
   - CreateUserFunction receives user data from API Gateway, writes it to the Users DynamoDB table
   - GetUserFunction queries the Users DynamoDB table by user ID and returns the data

3. **IAM Permission Model**: Configure IAM roles that enable the Lambda→DynamoDB connection:
   - CreateUserFunction requires `dynamodb:PutItem` permission on the Users table
   - GetUserFunction requires `dynamodb:GetItem` permission on the Users table
   - Lambda execution role trusts the Lambda service to assume these permissions

4. **Monitoring and Logging Integration**: CloudWatch captures the complete request-response flow:
   - API Gateway logs all incoming requests and responses
   - Lambda functions emit logs to CloudWatch Logs during execution
   - DynamoDB logs all read/write operations for audit and debugging

### Core Requirements

Use AWS SAM to define:

- **Lambda functions** with execution roles that grant DynamoDB access
- **API Gateway** with routes that integrate directly with Lambda functions
- **DynamoDB table** (Users) configured for on-demand billing
- **IAM roles and policies** that enable Lambda to read/write to DynamoDB
- **CloudWatch integration** for logging across all services

Set up API Gateway with these routes and data flow:

- POST `/user` → CreateUserFunction → Writes user data to DynamoDB Users table
- GET `/user/{id}` → GetUserFunction → Queries DynamoDB Users table and returns user data

### Infrastructure Details

Deploy to us-east-1 region with environment-specific configurations. Include monitoring and logging for all components:

- CloudWatch Logs for API Gateway request/response logging
- CloudWatch Logs for Lambda function execution logs
- CloudWatch Log insights for querying request flow and troubleshooting

Tag all resources with `Project:ServerlessApp` and implement versioning support for rollbacks and CodePipeline deployment.

The template must validate successfully as a CloudFormation YAML file.
