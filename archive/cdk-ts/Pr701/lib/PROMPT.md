I need to build an enhanced serverless API backend using AWS CDK with TypeScript. The infrastructure should include:

1. A Lambda function using Node.js 14.x runtime that handles HTTP requests through API Gateway
2. An API Gateway REST API that requires an API key for access and has logging enabled
3. A DynamoDB table with the Lambda function having proper read and write permissions
4. X-Ray tracing enabled for both API Gateway and Lambda for better observability
5. Environment variables configured on the Lambda function for the DynamoDB table name and AWS region
6. CloudWatch Logs for the Lambda function with a 7-day retention policy
7. Security group configuration allowing only HTTPS traffic on port 443
8. All resources tagged with "Project: ServerlessApp" for cost tracking
9. IAM roles and policies following least privilege principles

Additionally, I need to integrate 4 recent AWS services:

10. AWS EventBridge with a custom event bus for event-driven architecture. When data is created via the API, publish events to the custom event bus for decoupled processing
11. AWS Secrets Manager to securely store and manage sensitive configuration data like API keys or database connection strings, with proper IAM permissions for Lambda access
12. AWS Step Functions for serverless workflow orchestration with JSONATA transformation support. Create a workflow that processes data creation events from EventBridge and performs multi-step operations including validation, transformation, and notification
13. Amazon SNS FIFO topic for reliable message queuing and ordered notifications. Integrate with the Step Functions workflow to send notifications when data processing is completed

The EventBridge integration should include custom event patterns and rules, while Secrets Manager should demonstrate secure secret retrieval in the Lambda function code. The Step Functions workflow should utilize JSONATA for data transformation and include error handling with retry logic. The SNS FIFO topic should ensure message ordering and deduplication.

Please provide the complete CDK TypeScript infrastructure code that meets these requirements. Each file should be in a separate code block so I can easily copy and paste them.