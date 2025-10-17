ROLE: You are an experienced cloud architect specializing in serverless APIs.

CONTEXT:
Our mobile app serves around 1 million users daily and needs a production-ready secure API backend. We need to build this infrastructure from scratch using Terraform with proper authentication, global scalability, and observability baked in.

CONSTRAINTS:
- Use API Gateway REST API (not HTTP API) for the main endpoint
- Implement Cognito User Pools for user authentication - no custom auth
- All Lambda functions must be properly secured with least-privilege IAM roles
- Write actual working Python code for the Lambda backend - this needs to be a real demo people can test
- DynamoDB needs to be configured as Global Tables for multi-region support
- CloudFront should sit in front of API Gateway for better global performance
- Route 53 must handle the custom domain with health checks
- CloudWatch dashboards and alarms are required for monitoring
- Enable X-Ray tracing across the entire request path
- Follow AWS best practices for production workloads

DELIVERABLES:
1) main.tf - core infrastructure setup and resource orchestration
2) variables.tf - all configurable parameters with sensible defaults
3) outputs.tf - important values like API endpoint, user pool ID, etc.
4) cognito.tf - user pool, client app, and auth configuration
5) api_gateway.tf - REST API, resources, methods, authorizers, and deployment
6) lambda.tf - function definitions with proper runtime and environment configs
7) dynamodb.tf - global table setup with appropriate indexes
8) cloudfront.tf - distribution config pointing to API Gateway
9) route53.tf - hosted zone and DNS records
10) monitoring.tf - CloudWatch dashboards, alarms, and X-Ray configuration
11) iam.tf - all roles and policies with proper trust relationships
12) lambda_function.py - actual Python code for the API backend with CRUD operations
13) requirements.txt - Python dependencies for the Lambda function
14) deployment-guide.md - step by step instructions to deploy this stack
15) testing-guide.md - how to test authentication flow and API endpoints

OUTPUT FORMAT (IMPORTANT):
- Each file should be in its own code block with the filename clearly marked at the top
- Use meaningful resource names that reflect what they do
- Add inline comments explaining complex configurations
- Keep it practical - this should actually work when deployed