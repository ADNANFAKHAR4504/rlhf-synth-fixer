I need a CloudFormation template for a serverless data processing system. This is for a production environment so it needs to be robust and secure.

Main components I need:
- Lambda function that receives HTTP requests from API Gateway and connects to DynamoDB to store data
- API Gateway integrated with the Lambda function to expose HTTP endpoints
- DynamoDB table with encryption and streams that triggers downstream processing
- Another Lambda function triggered by DynamoDB stream events to process changes
- Proper IAM roles to secure access between services

Lambda requirements:
- Use Python 3.12 runtime
- 512 MB memory, 30 second timeout
- Environment variables for table name and region
- Enable X-Ray tracing
- Set up versioning and alias for rollback capability
- Include response streaming support for performance

API Gateway setup:
- HTTP API (not REST API) that routes requests to Lambda
- CORS enabled for web client access
- Integrated with the main Lambda function as the target
- Handle all HTTP methods on default route and forward to Lambda backend

DynamoDB configuration:
- On-demand billing for variable workload
- KMS encryption using AWS managed key to protect data at rest
- Enable streams with NEW_AND_OLD_IMAGES that connect to stream processor Lambda
- Point-in-time recovery enabled
- Set up proper attribute definitions and key schema

Security and access:
- Lambda execution roles that grant access to downstream AWS services
- DynamoDB read/write permissions allowing Lambda to access the specific table
- KMS decrypt permissions enabling Lambda to work with encrypted data
- CloudWatch logging permissions for Lambda to send logs to CloudWatch
- X-Ray daemon write access allowing Lambda to publish traces to X-Ray

Deployment specifications:
- Target region: us-east-1
- Tag all resources with Environment=dev and Project=trainr929
- Include CloudFormation outputs for integration
- Use EnvironmentSuffix parameter for multi-environment deployments
- Follow consistent naming convention across resources

Additional requirements:
- All resources should have deletion policies for cleanup
- Export values should use stack name for uniqueness
- Include descriptions for all resources
- Template must pass CloudFormation validation
- Set up event source mapping that connects DynamoDB streams to the stream processor Lambda

Please generate the complete template in YAML format with all these components configured correctly.