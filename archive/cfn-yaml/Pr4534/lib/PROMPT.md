We need a lightweight, scalable, and secure serverless API for a fitness app that records approximately 2,000 workout logs per day. The system must prioritize cost efficiency, scalability, and maintainability. Please produce one self-contained CloudFormation YAML template file that provisions the following resources with sensible defaults and parameters for customization:

Core Requirements

    •	API Gateway (REST API) with endpoints for basic CRUD operations on workout logs.
    •	AWS Lambda functions (Python 3.9) for handling requests and processing logic.
    •	DynamoDB table for storing workout logs, configured with on-demand capacity (auto-scaling).
    •	IAM roles and policies to securely allow Lambda access to DynamoDB, CloudWatch, and Parameter Store.
    •	AWS Systems Manager Parameter Store for configuration values (e.g., table name, environment).
    •	Amazon CloudWatch for metrics, basic monitoring, and alarms on error rates or latency.
    •	EnvironmentSuffix parameter (e.g., dev, staging, prod) to prefix resource names and tags.
    •	Outputs for API endpoint URL, DynamoDB table name, and Lambda function names.
    •	Tags applied consistently across all resources for cost tracking and environment identification.
