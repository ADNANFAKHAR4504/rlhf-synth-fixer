# Serverless Infrastructure with CloudFormation

Create a serverless infrastructure using AWS CloudFormation with the following requirements:

## Core Infrastructure Components

1. **S3 Bucket Configuration**
   - Enable versioning on the S3 bucket
   - Configure Lambda triggers on object creation events
   - Implement proper security with public access blocked

2. **Lambda Function**
   - Process S3 events and perform DynamoDB operations
   - Handle API Gateway requests with proper error handling
   - Include environment variables for DynamoDB table name

3. **API Gateway Setup**
   - REST API that forwards requests to Lambda function
   - Support GET, POST, and OPTIONS methods for CORS
   - Regional endpoint configuration

4. **DynamoDB Table**
   - Composite primary key with partition key and sort key (both string type)
   - Pay-per-request billing mode
   - Point-in-time recovery enabled
   - DynamoDB streams enabled

5. **IAM Security**
   - Least-privilege IAM roles and policies
   - Lambda execution role with specific resource access
   - Proper S3 and DynamoDB permissions only

## Deployment Requirements

- Deploy all resources in us-west-2 region
- Tag all resources with 'Environment: Production'
- Use single CloudFormation stack for all resources
- Follow AWS security best practices
- Ensure production-ready configuration

## Technical Constraints

- Must use AWS CloudFormation (YAML format)
- No circular dependencies in resource creation
- Proper error handling and JSON serialization
- Custom resource pattern for S3 notifications if needed
- All resources must be properly tagged and secured