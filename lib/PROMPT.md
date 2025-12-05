Hey team,

We need to build a serverless REST API for real-time currency exchange rate calculations. A fintech startup has been seeing tremendous growth and needs an API that can handle over 10,000 requests per minute during peak trading hours while maintaining sub-second response times. They want this deployed on AWS using a fully serverless architecture to minimize operational overhead and optimize costs.

I've been asked to create this using **Terraform with HCL**. The business wants a production-ready API with proper security controls, comprehensive monitoring, and performance throttling to prevent abuse.

The system needs to be immediately testable after deployment, so we'll provide an API key and the invoke URL as outputs. The team emphasized that this should be ready for production traffic from day one, which means we need CloudWatch logging for debugging issues and X-Ray tracing for performance analysis across the distributed components.

## What we need to build

Create a serverless currency exchange API using **Terraform with HCL** that provides real-time exchange rate calculations through a REST API.

### Core Requirements

1. **Lambda Function**:
   - Node.js 18 runtime for the exchange rate calculation logic
   - 1GB memory allocation for optimal performance
   - Timeout of 10 seconds to handle external API calls
   - Concurrent execution limit of 100 to control costs
   - Environment variables for API_VERSION and RATE_PRECISION
   - Lambda function code must be inline in Terraform (no S3 deployment)

2. **API Gateway**:
   - REST API (not HTTP API) with edge-optimized endpoint
   - POST endpoint at /convert for currency conversion requests
   - Lambda proxy integration (not Lambda integration)
   - API key authentication for client access control
   - Request throttling at 5000 requests/minute per API key
   - CORS enabled with allowed origins from *.example.com domains
   - Stage name must be 'v1' with stage variables for configuration

3. **IAM and Security**:
   - Lambda execution role with CloudWatch Logs permissions only
   - Use data sources for AWS managed policies instead of inline policy documents
   - Proper resource-based permissions for API Gateway to invoke Lambda
   - No VPC required (Lambda runs in AWS-managed environment)

4. **Monitoring and Observability**:
   - CloudWatch Logs for Lambda with INFO level logging
   - CloudWatch Logs for API Gateway with INFO level logging
   - X-Ray tracing enabled on both Lambda and API Gateway
   - Proper log group retention policies

5. **Resource Naming and Tags**:
   - Lambda function name must follow pattern: currency-converter-{environment}-{random_id}
   - All resources must include **environmentSuffix** variable for uniqueness
   - Consistent tags on all resources: Environment=production, Service=currency-api
   - All resources must be destroyable (no Retain policies)

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to **us-east-1** region
- Terraform 1.0+ with AWS provider 5.x
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}

### Optional Enhancements

If implementation time permits, consider adding:
- DynamoDB table for caching exchange rates to reduce external API calls
- SQS queue for async rate updates to improve reliability
- CloudWatch alarms for 4XX/5XX errors for proactive monitoring

### Success Criteria

- Functionality: API accepts POST requests at /convert endpoint and returns exchange rate calculations
- Performance: Sub-second response times with proper throttling controls
- Security: API key authentication enforced, proper IAM permissions with least privilege
- Monitoring: CloudWatch Logs and X-Ray tracing operational
- Resource Naming: All resources include environmentSuffix for environment isolation
- Code Quality: Clean HCL code, proper resource dependencies, well-documented

## What to deliver

- Complete Terraform HCL implementation with all configuration files
- Lambda function with inline Node.js 18 code for exchange rate calculations
- REST API Gateway with /convert endpoint and Lambda proxy integration
- IAM roles and policies using AWS managed policy data sources
- CloudWatch Logs configuration for both Lambda and API Gateway
- X-Ray tracing enabled on Lambda and API Gateway
- Output values for API invoke URL and API key for immediate testing
- Proper variable definitions including environmentSuffix
- Tags on all resources (Environment=production, Service=currency-api)
