Please design a modular, secure serverless application architecture using Pulumi with Python (not CloudFormation), based on the following requirements:

- Deploy AWS Lambda functions to handle processing tasks, with IAM roles granting appropriate permissions to interact with a DynamoDB table.
- Set up an API Gateway as the RESTful entry point to the Lambda functions.
- Create a DynamoDB table as the primary data store, ensuring the Lambda functions have the necessary IAM roles for access.
- Provision an S3 bucket for hosting static assets, strictly disabling public access to maintain security.
- Enable CloudWatch logging and monitoring for both Lambda function execution and API Gateway traffic.
- Deploy all resources in the us-east-1 AWS region.
- Structure the Pulumi Python code to be modular, reusable, and well-organized with clear naming conventions and resource tagging.
- Ensure the entire infrastructure is defined and deployed as a cohesive stack using Pulumi’s native capabilities.
- Follow AWS best practices for security, least privilege access, and operational monitoring.

Aim to build a clean, maintainable serverless architecture using Pulumi Python, emphasizing secure data access, logging, and efficient API integration.
