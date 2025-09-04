I need help creating a serverless application infrastructure using AWS CDK with JavaScript. The application should handle file processing triggered by S3 uploads and needs to be secure and highly available.

Here are my requirements:

1. **Core Components**:
   - AWS Lambda function that gets triggered when files are uploaded to a specific S3 bucket
   - S3 bucket for file storage with proper event notifications
   - AWS Secrets Manager to store API keys, database credentials, and other sensitive data
   - CloudWatch monitoring for Lambda performance metrics like invocation count and error rates

2. **Architecture Requirements**:
   - Deploy across multiple availability zones in us-west-2 region for high availability
   - Use IAM roles and policies following least privilege principle
   - All resources should use 'ServerlessApp' as naming convention prefix
   - The Lambda function should be able to securely access secrets from Secrets Manager

3. **Modern AWS Features**:
   - Use the new AWS Secrets Manager Parameters and Secrets Lambda Extension for better secret retrieval performance
   - Implement CloudWatch Application Signals for enhanced Lambda monitoring and observability
   
4. **Code Structure**:
   - Use AWS CDK v2 with JavaScript ES modules (.mjs files)
   - Create separate stack files for organization
   - Include proper error handling and logging

5. **Security and Best Practices**:
   - Enable S3 bucket encryption
   - Lambda function should have minimal required permissions
   - Use environment variables for configuration
   - Enable CloudWatch Logs for Lambda function

Please provide the infrastructure code with one code block per file. I need the main stack file and any supporting construct files organized properly.