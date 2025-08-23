# Serverless Infrastructure with AWS CDK Python

I need to create a serverless infrastructure on AWS using CDK with Python. The setup should include multiple Lambda functions triggered by S3 events and exposed through API Gateway.

## Requirements

1. **Region**: Deploy all resources in us-east-1 region
2. **Lambda Functions**: Create at least 3 Lambda functions with different purposes:
   - Image processing function (triggered by S3 upload)
   - Data transformation function (triggered by S3 upload) 
   - API handler function (exposed via API Gateway)
3. **S3 Integration**: Set up an S3 bucket that triggers Lambda functions on object uploads
4. **API Gateway**: Configure REST API that exposes Lambda functions with proper endpoints
5. **IAM Roles**: Create appropriate IAM roles with minimal required permissions for each service
6. **Environment Variables**: Configure Lambda functions with environment variables for runtime settings
7. **Fault Tolerance**: Implement retry mechanisms and dead letter queues for Lambda functions
8. **Monitoring**: Set up CloudWatch Logs for all functions with structured logging
9. **Tagging**: Apply consistent tags across all resources for cost tracking
10. **Outputs**: Provide clear outputs for API Gateway URL and Lambda function ARNs

## New AWS Features to Include

Please incorporate these recent AWS features in the solution:
- Use Lambda SnapStart for Java/Python functions where applicable to improve cold start performance
- Implement structured JSON logging for Lambda functions using the new native support
- Configure AWS Fault Injection Service integration for Lambda resilience testing

## Technical Specifications

- Use CDK Python constructs
- Follow AWS best practices for security and scalability
- Ensure resources are cost-effective
- Include proper error handling in Lambda functions
- Set up appropriate Lambda function memory and timeout configurations

Please provide the complete infrastructure code with one code block per file.