# AWS Serverless Infrastructure Setup Challenge

As an expert AWS cloud infrastructure engineer, create and deploy a complete serverless architecture that demonstrates enterprise-level best practices with aws-cdk python. You'll create a Python-based Lambda function that serves as the backbone of a data processing system, complete with API exposure, database integration, and comprehensive monitoring.

### Core Infrastructure Requirements

Your solution needs to include:

1. **A CDK-Python template** that defines your entire infrastructure as code. This should be the single source of truth for deploying all AWS resources.

2. **A Python Lambda function** that:
   - Handles incoming API requests through API Gateway
   - Performs CRUD operations on DynamoDB
   - Logs activities to both CloudWatch and S3
   - Retrieves sensitive configuration from Parameter Store
   - Operates within a VPC for network isolation

3. **API Gateway configuration** that:
   - Exposes your Lambda function through RESTful endpoints
   - Handles CORS headers correctly for browser-based clients
   - Implements caching to optimize performance
   - Routes different HTTP methods to appropriate Lambda handlers

4. **DynamoDB setup** with:
   - On-demand pricing model, no pre-provisioned capacity
   - Proper table schema design for your use case
   - Encryption at rest enabled
   - Integration with Lambda via Boto3

5. **Security and networking** including:
   - IAM roles following least privilege principle
   - VPC configuration with appropriate subnets for high availability
   - Security groups controlling network access
   - Encrypted storage for all data at rest

6. **Monitoring and observability** through:
   - CloudWatch logs for debugging
   - Custom metrics for business logic
   - Alarms that trigger when error thresholds are exceeded
   - S3 storage for long-term log retention

### Regional and Environmental Setup
- Deploy everything in the us-east-1 region
- Configure VPC with at least two subnets across availability zones
- Ensure Lambda can access both internet resources and AWS services

### Lambda Function Requirements
Your Lambda handler should:
- Accept API Gateway events and return properly formatted responses
- Use environment variables for configuration. DynamoDB table name, S3 bucket name.
- Implement retry logic and timeout handling for DynamoDB operations
- Include comprehensive error handling with meaningful error messages
- Log all operations with appropriate severity levels

### Data Storage and Security
- DynamoDB tables must use on-demand billing mode
- All data in DynamoDB and S3 must be encrypted using AWS-managed keys
- Sensitive values (API keys, credentials) stored in Parameter Store
- S3 bucket configured with versioning and lifecycle policies for logs

### API Gateway Configuration
- Set up REST API with proper resource paths
- Configure request/response models and validators
- Enable CORS with appropriate allowed origins, methods, and headers
- Implement caching with reasonable TTL values
- Set up usage plans and API keys if needed

### Monitoring and Alerts
- Create CloudWatch dashboard showing key metrics
- Set up alarm for Lambda errors exceeding threshold (you decide the threshold)
- Configure log groups with appropriate retention periods
- Implement custom metrics for business-specific monitoring

Ensure to output all resources created.