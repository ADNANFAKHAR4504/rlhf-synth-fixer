I need help creating a serverless application infrastructure using AWS CDK with Python. The application should be deployed in the us-west-2 region and needs to handle file processing workflows triggered by S3 uploads.

Here are the specific requirements:

1. **S3 Bucket Setup**: Create an S3 bucket that will serve as the entry point for file uploads. The bucket should have proper security configurations and versioning enabled.

2. **Lambda Function**: Deploy a Lambda function using the latest Python 3.13 runtime that gets triggered when files are uploaded to the S3 bucket. The function should be able to access sensitive configuration data securely.

3. **Secrets Manager Integration**: Use AWS Secrets Manager to store database credentials, API keys, and other sensitive information. The Lambda function should retrieve these secrets at runtime using environment variables for the secret ARNs.

4. **IAM Security**: Implement proper IAM roles and policies following the principle of least privilege. The Lambda execution role should only have the minimum permissions needed to read from S3, access Secrets Manager, and write to CloudWatch.

5. **Multi-AZ Deployment**: Ensure the infrastructure is deployed across multiple availability zones for high availability where applicable.

6. **CloudWatch Monitoring**: Set up comprehensive monitoring including custom metrics for Lambda invocation count, error rates, and duration. Include CloudWatch log groups with proper retention policies.

7. **Naming Convention**: All resources should follow a consistent naming pattern based on 'ServerlessApp' (for example: ServerlessAppBucket, ServerlesAppLambda, etc.).

The infrastructure should use AWS best practices and avoid any configurations that could cause deployment delays. Please provide the complete CDK Python code with proper error handling and resource dependencies. Each file should be in a separate code block so I can easily copy and implement them.

I'd like to use the latest AWS Lambda runtime features including the newest Python runtime version and modern S3 event notification capabilities that support reliable message delivery and proper sequencing.