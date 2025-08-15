I need to deploy a serverless infrastructure on AWS that can handle high-traffic workloads across multiple regions. The solution should include AWS Lambda functions for processing requests, API Gateway for RESTful endpoints, and CloudWatch for monitoring.

Here are the requirements:

1. Create Lambda functions that can scale efficiently using the new enhanced scaling capabilities
2. Set up API Gateway with TLS 1.3 support for secure communication
3. Deploy the infrastructure across at least two AWS regions (us-east-1 and us-west-2) for high availability
4. Implement CloudWatch logging and monitoring for all components
5. Use response streaming for Lambda functions to handle large payloads up to 200MB
6. Configure the solution to be cost-effective while maintaining good performance

The Lambda functions should handle basic HTTP requests and return JSON responses. Make sure to use recent AWS features where appropriate and follow serverless best practices.

Please provide the infrastructure code with one code block per file.