# Serverless Image Processing Infrastructure

I need help creating a serverless architecture for image processing using AWS services. The solution should handle image uploads and processing tasks efficiently.

## Requirements

### Core Infrastructure
- AWS Lambda function for image processing (use Python 3.9 runtime)
- API Gateway REST API with HTTP POST endpoint to trigger the Lambda function
- Integration with an existing S3 bucket that has versioning enabled
- SNS topic for sending completion notifications
- IAM role with minimal permissions for Lambda execution

### Architecture Flow
1. HTTP POST request to API Gateway endpoint
2. API Gateway triggers Lambda function
3. Lambda function reads images from existing S3 bucket
4. After processing, Lambda publishes success message to SNS topic
5. Proper error handling and logging throughout

### Technical Specifications
- Target region: us-east-1
- Lambda function should have appropriate timeout and memory configuration
- Use EventBridge Pipes for enhanced event routing between services
- Implement structured logging with CloudWatch integration
- IAM role should only allow read/write access to S3 bucket and publish to SNS topic

### Modern AWS Features to Include
- Use AWS Lambda with Graviton2 processors for better price-performance
- Leverage EventBridge for event-driven architecture patterns
- Implement API Gateway direct service integration where appropriate

### Security and Best Practices
- Follow principle of least privilege for IAM permissions
- Enable proper error handling and retry logic
- Use environment variables for configuration
- Implement proper API response codes and error messages

Please provide infrastructure code that creates this serverless image processing architecture. Each file should be in a separate code block with clear file paths and names.