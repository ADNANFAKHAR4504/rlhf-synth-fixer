# Serverless Infrastructure Design Challenge

We need to create a complete serverless infrastructure in AWS using CloudFormation (YAML format) with API Gateway and Lambda functions. This isn't just a simple setup - we need enterprise-grade security, monitoring, and scalability.

## The Requirements (and they're pretty specific!)

### Core Infrastructure
- **API Gateway**: Needs to route requests to different Lambda functions based on business logic
- **Lambda Functions**: Each function handles specific business operations with proper resource allocation
- **IAM Security**: Everything needs proper roles and policies - no over-permissive access allowed!

### Environment Management
- **Multi-environment support**: We need different configs for prod and dev environments
- **Environment Variables**: All sensitive data should be encrypted with KMS
- **Version Control**: Proper versioning and aliases for Lambda functions

### Security & Protection
- **WAF Integration**: API Gateway needs protection against common web attacks
- **Authorization**: Every API call must go through proper authorization
- **IP Whitelisting**: Restrict access to specific CIDR ranges
- **Least Privilege**: IAM policies should follow the principle of least privilege

### Monitoring & Observability
- **CloudWatch**: Detailed logging with ERROR/WARN levels only
- **X-Ray Tracing**: Performance monitoring for both API Gateway and Lambda
- **AWS Config**: Track all configuration changes
- **Resource Monitoring**: Proper memory and execution time allocation

## Technical Constraints (Non-negotiable!)

1. **Region**: us-west-2
2. **Account**: prod account (ID: 123456789012)
3. **Naming**: All resources must use 'prod-*' prefix
4. **API Gateway Name**: 'prod-MyAPI'
5. **Runtime**: Latest Lambda runtime versions for security
6. **Validation**: Must pass AWS CloudFormation linter and SAM CLI validation
