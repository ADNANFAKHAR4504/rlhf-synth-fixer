You are an AWS CloudFormation expert tasked with designing a serverless infrastructure for a highly scalable web application. Generate a CloudFormation YAML template that implements the following architecture and meets all security and operational best practices:

1. API Gateway:
   • Provide HTTP endpoints for the web application.
   • Enable detailed logging and send logs to CloudWatch Logs.
   • Include necessary permissions for integration with Lambda functions.

2. AWS Lambda:
   • Implement backend processing logic using Lambda functions.
   • Configure IAM roles with least-privilege access, granting only the permissions required to interact with other resources (S3, DynamoDB, CloudWatch).
   • Support environment variables for multi-environment deployments (e.g., dev, staging, prod).

3. S3 Bucket:
   • Use an S3 bucket for static content storage.
   • Enable server-side encryption (SSE-S3).
   • Ensure secure bucket policies (block public access).

4. DynamoDB Table:
   • Create a DynamoDB table for persistent storage.
   • Use on-demand capacity mode to handle unpredictable workloads.
   • Include IAM permissions for Lambda functions to read/write to the table.

5. CloudWatch Monitoring:
   • Configure CloudWatch alarms for key metrics such as Lambda function error rates and duration.
   • Ensure alarms notify appropriately if thresholds are breached.

6. Template Requirements:
   • Include all necessary IAM roles, policies, and permissions.
   • Use parameters for environment-specific configuration (e.g., environment name, memory size).
   • Use outputs for key resources (e.g., API Gateway URL, DynamoDB table name).
   • Ensure the template passes AWS CloudFormation validation and is ready for deployment.

7. Operational Constraints:
   • Do not use wildcard \* in IAM policies; follow least-privilege principle.
   • All resources must follow AWS security best practices.
   • Template should be fully deployable in a single stack.

Expected Output:
• A complete CloudFormation YAML template that implements the above architecture.
• All resources must be interconnected correctly and ready for production-grade deployment.
