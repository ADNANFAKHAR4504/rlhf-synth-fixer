I need a CloudFormation template for a serverless data processing system. This is for a production environment so it needs to be robust and secure.

Main components I need:
- Lambda function to handle incoming HTTP requests and store data in DynamoDB
- API Gateway to expose HTTP endpoints
- DynamoDB table with encryption and streams
- Another Lambda function to process DynamoDB stream events
- Proper IAM roles for security

Lambda requirements:
- Use Python 3.12 runtime
- 512 MB memory, 30 second timeout
- Environment variables for table name and region
- Enable X-Ray tracing
- Set up versioning and alias for rollback capability
- Include response streaming support for performance

API Gateway setup:
- HTTP API (not REST API)  
- CORS enabled for web client access
- Integrate with the main Lambda function
- Handle all HTTP methods on default route

DynamoDB configuration:
- On-demand billing for variable workload
- KMS encryption using AWS managed key
- Enable streams with NEW_AND_OLD_IMAGES
- Point-in-time recovery enabled
- Set up proper attribute definitions and key schema

Security and access:
- Lambda execution roles with minimal required permissions
- DynamoDB read/write access scoped to specific table
- KMS decrypt permissions for encrypted data
- CloudWatch logging access
- X-Ray daemon write access

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
- Set up event source mapping for DynamoDB streams

Please generate the complete template in YAML format with all these components configured correctly.