I need to build a secure web application infrastructure on AWS using CDK TypeScript. The setup needs to be production-ready with all security best practices. Here are the components I need:

1. API Gateway for handling HTTP requests with API key authentication and CloudWatch logging enabled
2. Lambda functions for backend processing with proper IAM roles following least privilege
3. DynamoDB table with on-demand capacity for scalability  
4. S3 buckets with versioning and server-side encryption
5. KMS keys for encrypting sensitive data
6. WAF protection for the API Gateway against common web attacks
7. All resources should be tagged with 'Environment: Production'

I want to use some of the newer AWS features for enhanced security and performance.

The infrastructure should be deployed in us-east-1 region. Please provide the CDK TypeScript code with proper security configurations and monitoring setup.