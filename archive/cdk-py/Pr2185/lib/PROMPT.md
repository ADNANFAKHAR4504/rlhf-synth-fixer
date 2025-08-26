I need to build a comprehensive serverless API infrastructure using AWS CDK with Python for the us-west-2 region. The API needs to be production-ready with proper security, monitoring, and scalability features.

Here are the core requirements:

**API Gateway Setup:**
- Create a REST API Gateway that can route requests to multiple Lambda functions
- Set up proper integration between API Gateway and Lambda functions
- Configure CORS settings and request/response mappings
- Name the API Gateway as 'prod-MyAPI'

**Lambda Functions:**
- Build multiple Lambda functions to handle different API endpoints
- Use the latest Python runtime versions for security patches
- Configure proper memory allocation and execution timeout settings
- Implement Lambda versioning and aliases for deployment management

**Security Implementation:**
- Set up IAM roles and policies with least privilege access
- Create customer-managed KMS key for encrypting environment variables
- Implement AWS WAF v2 protection for the API Gateway with rules against common web exploits
- Configure IP whitelisting in WAF to restrict access to specific CIDR ranges
- Enable authorization mechanisms for API access

**Monitoring and Observability:**
- Configure CloudWatch log groups with appropriate retention periods
- Set up detailed logging for both API Gateway and Lambda functions
- Enable X-Ray tracing for performance monitoring and debugging
- Set Lambda function logging levels to 'ERROR' or 'WARN' only
- Create CloudWatch alarms for monitoring API performance

**Configuration Management:**
- Define environment variables for production and development environments
- Encrypt all environment variables using the KMS key
- Use AWS Config to track Lambda function configuration changes
- Implement proper resource tagging with 'prod-*' naming convention

**Advanced Features:**
- Integrate AWS SAM-compatible patterns for efficient deployment
- Set up API Gateway throttling and request validation
- Configure proper error handling and response codes
- Implement resource allocation optimization for cost efficiency

The infrastructure should follow AWS best practices and be fully deployable through CDK. Please provide the complete implementation with proper construct usage and ensure all components work together seamlessly.

Also, could you incorporate some of the newer AWS CDK v2 features like the improved L2 constructs and the enhanced Application Performance Monitoring capabilities that were introduced recently? I'd like to use the latest WAF v2 managed rules as well.