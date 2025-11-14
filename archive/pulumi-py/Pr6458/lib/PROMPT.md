Hey team,

We need to build a serverless currency exchange API for a fintech startup. They're expecting to handle serious traffic during peak trading hours - we're talking 10,000+ requests per minute - and they need response times under a second. This is a production system that traders will rely on for real-time exchange rate calculations.

The business requirements are pretty straightforward but demanding. They want a REST API that can calculate currency exchange rates on the fly, with proper throttling to prevent abuse, full observability with X-Ray tracing, and the security locked down following least privilege principles. The system needs to scale automatically during peak hours but stay cost-effective during quiet periods.

I've been asked to create this using **Pulumi with Python**. We'll be deploying to the us-east-1 region and need to make sure everything is production-ready with proper monitoring and logging.

## What we need to build

Create a serverless currency exchange API using **Pulumi with Python** for handling real-time currency exchange rate calculations at scale.

### Core Requirements

1. **Lambda Function**
   - Create Lambda function with Node.js 18 runtime
   - Configure with 1GB memory for exchange rate calculations
   - Set timeout to 10 seconds
   - Limit concurrent executions to 100
   - Function code must be inline (no S3 deployment)
   - Function name must follow pattern: currency-converter-{environment}-{random_id}

2. **API Gateway**
   - Deploy REST API Gateway with /convert endpoint
   - Configure to accept POST requests
   - Use Lambda proxy integration
   - Deploy to stage named 'v1' with stage variables for configuration

3. **Environment Variables**
   - Configure Lambda with API_VERSION environment variable
   - Configure Lambda with RATE_PRECISION environment variable

4. **Request Throttling**
   - Implement throttling at 5000 requests/minute per API key

5. **CORS Configuration**
   - Enable CORS on API Gateway
   - Allow origins from *.example.com domains only

6. **IAM Role**
   - Create IAM execution role for Lambda
   - Grant CloudWatch Logs permissions only (least privilege principle)
   - Use AWS managed policies where possible instead of inline policy documents

7. **API Logging**
   - Configure API Gateway logging to CloudWatch
   - Set logging level to INFO

8. **X-Ray Tracing**
   - Enable X-Ray tracing on Lambda function
   - Enable X-Ray tracing on API Gateway

9. **Resource Tagging**
   - All resources must include tags: Environment=production, Service=currency-api

10. **Outputs**
    - Export the API invoke URL for testing
    - Export the API key for authentication

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Lambda** with Node.js 18 runtime for exchange rate calculations
- Use **API Gateway** (REST API) for HTTP endpoint
- Use **IAM** for access control and execution roles
- Use **CloudWatch Logs** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region

### Constraints

- Lambda function code must be inline (no S3 deployment packages)
- API Gateway must use Lambda proxy integration
- All resources must have tags: Environment=production, Service=currency-api
- Use AWS managed policies where possible instead of inline policy documents
- Lambda function name pattern must be: currency-converter-{environment}-{random_id}
- API Gateway stage name must be 'v1' with stage variables
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging throughout
- Follow least privilege principle for all IAM permissions

### Optional Enhancements

If time permits, consider adding:
- DynamoDB table for caching exchange rates to reduce external API calls
- SQS queue for async rate updates to improve reliability
- CloudWatch alarms for 4XX/5XX errors to enable proactive monitoring

## Success Criteria

- **Functionality**: API successfully handles currency conversion requests via POST to /convert endpoint
- **Performance**: Response times under 1 second for currency calculations
- **Scalability**: System handles 10,000+ requests per minute during peak hours
- **Reliability**: Proper error handling and logging for all operations
- **Security**: IAM role follows least privilege with only necessary CloudWatch Logs permissions
- **Observability**: X-Ray tracing enabled on both Lambda and API Gateway
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, properly documented

## What to deliver

- Complete Pulumi Python implementation for serverless currency exchange API
- Lambda function with Node.js 18 runtime and inline code
- REST API Gateway with /convert POST endpoint
- IAM execution role with CloudWatch Logs permissions
- X-Ray tracing configuration for Lambda and API Gateway
- CloudWatch Logs integration for API Gateway
- Request throttling configuration (5000 req/min per API key)
- CORS configuration for *.example.com domains
- Unit tests for all infrastructure components
- Documentation and deployment instructions
- Exported outputs for API URL and API key
