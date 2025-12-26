# Serverless Infrastructure Design Challenge

We need to create a complete serverless infrastructure in AWS using CloudFormation YAML format with API Gateway and Lambda functions. This requires enterprise-grade security, monitoring, and scalability.

## The Requirements

### Core Infrastructure
- **API Gateway**: Integrates with Lambda functions to route requests based on business logic. API Gateway triggers Lambda functions when HTTP requests arrive at specific endpoints.
- **Lambda Functions**: Each function connects to DynamoDB tables to read and write data. Lambda functions use KMS keys to decrypt environment variables and encrypt data at rest.
- **IAM Security**: Lambda functions assume IAM roles that grant access to DynamoDB, KMS, and CloudWatch. Each IAM policy must specify exact actions such as GetItem PutItem Query for DynamoDB operations. Policy statements must reference specific table names and key identifiers.

### Environment Management
- **Multi-environment support**: Different configurations for prod and dev environments using parameters
- **Environment Variables**: Lambda functions retrieve sensitive data from environment variables encrypted with KMS keys
- **Version Control**: Lambda functions use versioning and aliases for deployment management

### Security & Protection
- **WAF Integration**: API Gateway connects to WAF for protection against common web attacks
- **Authorization**: API Gateway authorizer Lambda function validates every API call before routing to business logic functions
- **IP Whitelisting**: WAF rules restrict access to specific CIDR ranges
- **Least Privilege**: IAM policies grant only specific actions needed for each service. Use exact DynamoDB actions like GetItem PutItem Query. Policy statements must reference specific table names and key identifiers.

### Monitoring & Observability
- **CloudWatch**: Lambda functions send logs to CloudWatch Logs groups. CloudWatch alarms monitor Lambda invocation metrics and error rates.
- **X-Ray Tracing**: X-Ray traces requests from API Gateway through Lambda functions to DynamoDB, providing performance monitoring
- **AWS Config**: Config tracks all infrastructure configuration changes
- **Monitoring Configuration**: Lambda functions have proper memory and execution time allocation configured

## Technical Constraints

1. **Region**: us-west-2
2. **Account**: prod account ID 123456789012
3. **Naming**: All infrastructure components must use prod- prefix
4. **API Gateway Name**: prod-MyAPI
5. **Runtime**: Latest Lambda runtime versions for security
6. **Validation**: Must pass AWS CloudFormation linter and validation using standard CloudFormation template syntax
