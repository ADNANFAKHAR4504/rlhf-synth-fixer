Create a Terraform configuration to deploy a serverless currency exchange API.

MANDATORY REQUIREMENTS (Must complete):
1. Create a Lambda function with Node.js 18 runtime and 1GB memory for exchange rate calculations (CORE: Lambda)
2. Deploy REST API Gateway with /convert endpoint accepting POST requests (CORE: API Gateway)
3. Configure Lambda environment variables for API_VERSION and RATE_PRECISION
4. Implement request throttling at 5000 requests/minute per API key
5. Enable CORS with allowed origins from *.example.com domains
6. Create IAM execution role with CloudWatch Logs permissions only
7. Set Lambda timeout to 10 seconds and concurrent executions to 100
8. Configure API Gateway logging to CloudWatch with INFO level
9. Enable X-Ray tracing on both Lambda and API Gateway
10. Output the API invoke URL and API key for testing

OPTIONAL ENHANCEMENTS (If time permits):
- Add DynamoDB table for caching exchange rates (OPTIONAL: DynamoDB) - reduces external API calls
- Implement SQS queue for async rate updates (OPTIONAL: SQS) - improves reliability
- Add CloudWatch alarms for 4XX/5XX errors (OPTIONAL: CloudWatch) - enables proactive monitoring

Expected output: Complete Terraform configuration that deploys a production-ready serverless API with proper security, monitoring, and performance controls. The API should be immediately testable via curl with the provided API key.

BACKGROUND:
A fintech startup needs a serverless REST API for real-time currency exchange rate calculations. The system must handle 10,000+ requests per minute during peak trading hours while maintaining sub-second response times.

ENVIRONMENT:
AWS us-east-1 region deployment for serverless currency exchange API using Lambda and API Gateway REST. Requires Terraform 1.0+ with AWS provider 5.x configured. Architecture includes edge-optimized API Gateway with Lambda proxy integration, CloudWatch Logs for debugging, and X-Ray for distributed tracing. No VPC required as Lambda runs in AWS-managed environment. API key authentication enabled for client access control.

CONSTRAINTS:
- Lambda function code must be inline in Terraform (no S3 deployment)
- API Gateway must use Lambda proxy integration, not Lambda integration
- All resources must have consistent tags: Environment=production, Service=currency-api
- Use data sources for AWS managed policies instead of inline policy documents
- Lambda function name must follow pattern: currency-converter-{environment}-{random_id}
- API Gateway stage name must be 'v1' with stage variables for configuration
