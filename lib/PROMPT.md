I need to create AWS serverless infrastructure using AWS CDK TypeScript. I need help building the following components:

1. A Lambda function running Python 3.13 runtime that gets triggered by S3 object creation events
2. An S3 bucket that triggers the Lambda function whenever a new object is created
3. A DynamoDB table that logs Lambda invocations with unique request ID and timestamp
4. Proper IAM roles and permissions for all components
5. AWS EventBridge Custom Bus that receives events from the Lambda function and routes them based on event patterns
6. AWS X-Ray Tracing integration for the Lambda function to track performance metrics and enable distributed tracing

The EventBridge custom bus should include event rules and targets for routing processed events. The Lambda function should publish custom events to EventBridge after processing S3 events and include X-Ray tracing with annotations and subsegments for performance monitoring.

Please include the latest AWS features like DynamoDB configurable point-in-time recovery and ensure the Lambda function uses the newest Python 3.13 runtime for better performance. Configure X-Ray active tracing on the Lambda function and integrate it with DynamoDB operations for comprehensive observability.

All resources should be deployed in us-west-2 region. Please provide the infrastructure code with one code block per file.
