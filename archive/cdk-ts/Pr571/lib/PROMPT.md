I need help creating a complete serverless infrastructure for a REST API using AWS CDK with TypeScript. The infrastructure should include:

- API Gateway REST API with multiple endpoints for CRUD operations
- Lambda functions to handle business logic for each endpoint  
- DynamoDB table for data storage with proper indexing
- Custom domain name with SSL certificate using AWS Certificate Manager
- CloudFront distribution for content delivery and security
- Proper IAM roles and policies following least privilege principle
- CloudWatch logging and monitoring for all components
- EventBridge Scheduler for scheduled tasks
- Lambda SnapStart for improved cold start performance

The solution should be fully serverless with no EC2 instances. Use the naming convention "serverlessApp-" as prefix for all resources. Target region is us-east-1 and use the predefined VPC ID vpc-12345678 where needed.

Please provide the infrastructure code with one code block per file, making sure each file can be created by simply copy-pasting the code.