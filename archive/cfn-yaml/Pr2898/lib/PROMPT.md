Please help me create a comprehensive CloudFormation YAML template for deploying a serverless web application infrastructure. I need this template to be production-ready and follow AWS best practices.

Here are the specific requirements I need included:

Deploy everything in the us-east-1 region and make sure all components work together seamlessly. For the compute layer, I need AWS Lambda functions running on Node.js 16.x runtime that can handle my application processing needs. These functions should have proper execution timeouts configured and use environment variables for configuration management.

Set up an Amazon API Gateway that exposes my Lambda functions as HTTP endpoints. The API Gateway needs to have logging enabled with stage variables and CORS configured to support my web application domains. This is crucial for my frontend to communicate properly with the backend.

For storage, I need an Amazon S3 bucket configured for static website hosting. The bucket must have server-side encryption using AWS KMS for security compliance. Also enable versioning on this bucket as I need to track changes to my static assets.

Include a DynamoDB table for storing my application data with specific throughput capacity settings. This table should have DynamoDB Streams enabled that trigger a Lambda function whenever there are updates to the table data.

Security is important, so create IAM roles for the Lambda functions following the principle of least privilege. The functions should only have the minimum permissions they need to operate.

Tag all resources with 'Environment:Production' for proper resource management and cost tracking.

The final YAML template should pass validation checks with tools like AWS CloudFormation Linter and successfully deploy the entire infrastructure when executed. Make sure it follows CloudFormation best practices and includes proper resource dependencies.