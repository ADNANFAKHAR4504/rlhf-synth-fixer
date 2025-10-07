# Serverless API for Mobile Gaming Score Management

Build a serverless API infrastructure using AWS CDK with TypeScript to manage player scores for a mobile gaming application supporting 3,000 daily active users.

## Requirements

Create the infrastructure code to deploy:

1. REST API Gateway with endpoints for score CRUD operations (create, read, update, delete)
2. Lambda functions using Node.js 20 runtime to handle the API operations
3. DynamoDB table with on-demand billing for storing player scores
4. IAM roles with least privilege access for Lambda execution
5. CloudWatch metrics monitoring for the API Gateway
6. Systems Manager Parameter Store for storing API configuration values
7. AWS X-Ray distributed tracing for monitoring request flows across Lambda and API Gateway
8. API Gateway Usage Plans with API Keys for rate limiting client access

## Technical Specifications

- Platform: AWS CDK with TypeScript
- Region: us-east-1
- Lambda Runtime: Node.js 20.x
- DynamoDB: On-demand scaling mode
- API Gateway: REST API with dual-stack IPv4/IPv6 support
- X-Ray: Active tracing mode for distributed request monitoring
- Usage Plans: Rate limiting at 100 requests/second with 200 burst limit per API key
- Environment: Development (use RemovalPolicy.DESTROY for all resources)

## API Endpoints

Design REST endpoints:
- POST /scores - Create new player score
- GET /scores/{playerId} - Retrieve player score
- PUT /scores/{playerId} - Update player score
- DELETE /scores/{playerId} - Delete player score

## DynamoDB Table Schema

- Table name: PlayerScores-{environment}
- Partition key: playerId (String)
- Attributes: score (Number), timestamp (String), gameId (String)

## Lambda Functions

Create separate Lambda functions for each operation:
- createScore - Handle POST requests
- getScore - Handle GET requests
- updateScore - Handle PUT requests
- deleteScore - Handle DELETE requests

Include proper error handling and input validation in each function.

## Configuration

Store the following in Parameter Store:
- API endpoint URL
- Table name
- Environment name

## Monitoring

Set up CloudWatch metrics for:
- API Gateway request count
- API Gateway 4xx and 5xx errors
- Lambda function invocations and errors
- X-Ray service map for visualizing request flows

## Security Requirements

- Lambda functions should only have permissions to access the specific DynamoDB operations they need
- API Gateway should have logging enabled
- Use environment variables for Lambda configuration
- API Keys required for all API endpoints with usage plan enforcement

## X-Ray Tracing Requirements

- Enable active tracing for all Lambda functions
- Enable X-Ray tracing on API Gateway
- Capture subsegments for DynamoDB operations
- Include trace correlation IDs in CloudWatch logs

## API Rate Limiting

- Create a default usage plan with 100 requests per second rate limit
- Set burst limit to 200 concurrent requests
- Generate one API key for testing purposes
- Apply usage plan to all API methods

Please provide the complete CDK infrastructure code including the stack definition, Lambda function code, and all necessary configurations.