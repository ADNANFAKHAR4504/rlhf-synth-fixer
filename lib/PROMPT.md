Create a complete CloudFormation YAML template for a serverless infrastructure that includes the following components:

**Requirements:**

1. **AWS Lambda Function**
   - Runtime: Python 3.12 or Node.js 20.x
   - Process HTTP requests from API Gateway
   - Environment variables for table name and region
   - CloudWatch logging permissions
   - DynamoDB read/write access permissions
   - Lambda versioning enabled for rollbacks
   - Enable Lambda response streaming for better performance

2. **API Gateway HTTP API**
   - Trigger the Lambda function
   - Proper Lambda integration configuration
   - CORS enabled for web applications

3. **DynamoDB Table**
   - Store processed request data
   - KMS encryption at rest using AWS managed key
   - DynamoDB streams enabled to trigger Lambda on data changes
   - Point-in-time recovery enabled with custom 7-day retention period
   - On-demand billing mode for automatic scaling

4. **IAM Roles and Policies**
   - Lambda execution role with least privilege permissions
   - CloudWatch Logs access for Lambda
   - DynamoDB read/write permissions for Lambda
   - KMS decrypt permissions for DynamoDB encryption

5. **Configuration Requirements**
   - Deploy in us-east-1 region
   - Add Environment=dev and Project=trainr929 tags to all taggable resources
   - CloudFormation outputs for API Gateway URL, Lambda function ARN, and DynamoDB table name
   - Lambda environment variables for DynamoDB table name and AWS region
   - Lambda function versioning with alias pointing to latest version

**Additional Constraints:**
1. Use descriptive resource names with consistent naming convention
2. Include proper dependencies between resources using DependsOn where needed
3. Set appropriate timeout values for Lambda function (30 seconds)
4. Configure DynamoDB table with appropriate read/write capacity if needed
5. Ensure all resources are properly tagged
6. Use AWS managed KMS key for DynamoDB encryption
7. Enable X-Ray tracing for Lambda function
8. Set Lambda memory size to 512 MB
9. Configure proper error handling and retry policies
10. Use latest CloudFormation features where applicable
11. Include proper descriptions for all resources
12. Ensure template passes CloudFormation validation

Generate the infrastructure code as a complete CloudFormation YAML template. Provide the template in a single code block.