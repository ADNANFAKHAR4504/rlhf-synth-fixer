I need to create a comprehensive AWS serverless infrastructure using CDK JavaScript for a production environment. The infrastructure should implement modern serverless best practices and include the latest AWS features.

Requirements:

1. API Gateway Setup:
   - Create a REST API Gateway named 'prod-MyAPI' 
   - Configure proper routing to Lambda functions
   - Enable request validation
   - Implement throttling for production workloads

2. Lambda Functions:
   - Create multiple Lambda functions for different business logic
   - Use latest Python 3.12 or Node.js 20 runtimes
   - Configure proper memory allocation and timeout settings
   - Implement function versioning and aliases for blue-green deployments

3. Security Implementation:
   - Configure IAM roles with least privilege access
   - Implement API Gateway authorization mechanisms
   - Set up AWS WAF for API protection against common web exploits
   - Restrict API access via IP whitelisting for specific CIDR ranges

4. Environment Management:
   - Define separate configurations for production and development
   - Encrypt all environment variables using AWS KMS
   - Implement secure parameter management

5. Monitoring and Observability:
   - Enable AWS X-Ray tracing for both API Gateway and Lambda functions
   - Configure CloudWatch Logs with appropriate log levels (ERROR/WARN)
   - Set up CloudWatch Application Signals for enhanced monitoring
   - Implement detailed CloudWatch metrics and alarms

6. Configuration Management:
   - Use AWS Config to track Lambda function configuration changes
   - Implement configuration compliance rules
   - Enable configuration history tracking

7. Production Readiness:
   - Deploy to us-west-2 region
   - Use 'prod-' naming convention for all resources
   - Account ID: 123456789012
   - Ensure fast deployment times
   - Apply proper resource tagging strategy

Please provide the CDK JavaScript code that implements all these requirements. Create separate stack files for different components (API Gateway, Lambda, Security, Monitoring) and a main orchestrating stack. Include all necessary imports, proper error handling, and follow AWS CDK best practices. Use S3 as failed-event destination for Lambda functions and implement the latest CloudWatch Logs Live Tail capabilities where applicable.

The code should be production-ready and validate against AWS CloudFormation standards. Please structure the response with one code block per file, clearly labeled with file paths.