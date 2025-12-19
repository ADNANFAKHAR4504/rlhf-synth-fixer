I need to create AWS serverless infrastructure using CDK TypeScript for a production environment. The infrastructure should include:

1. An AWS Lambda function that responds to HTTP requests from API Gateway
2. IAM roles for the Lambda function following least privilege principle
3. API Gateway with proper CORS configuration for security
4. CloudWatch monitoring for the Lambda function to capture execution time and error metrics
5. All resources tagged with 'Environment: Production'

The infrastructure should be deployed in the us-west-2 region. Please use Lambda Function URLs as an alternative to traditional API Gateway for simpler endpoint creation, and implement CloudWatch Logs with the new tiered pricing model for cost optimization. The Lambda function should have proper monitoring using CloudWatch Lambda Insights for performance tracking.

Generate complete infrastructure code with one code block per file.
