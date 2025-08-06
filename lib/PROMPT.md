Create a CDK for Terraform (CDKTF) project using TypeScript or Python to deploy a highly scalable serverless web application infrastructure on AWS. The entire implementation must be written in a single file named main.ts or main.py. Follow best practices for security, scalability, and maintainability.

Environment and Context:
Region: us-east-1

Project Name: IaC – AWS Nova Model Breaking

Resource Naming Convention: Use prefix prod-service- for all resources (e.g., prod-service-lambda, prod-service-table).

Architecture Type: Fully serverless infrastructure using AWS-managed services.

Requirements:
Compute Layer – AWS Lambda:

Deploy Lambda functions to handle backend logic and processing.

Configure log retention and enable detailed monitoring (e.g., CloudWatch).

Set appropriate IAM roles with least privilege for Lambda execution.

API Layer – API Gateway:

Deploy API Gateway to expose HTTP endpoints and route requests to Lambda.

Configure stages, logging, throttling, and security settings (e.g., API keys or IAM-based access).

Ensure low latency and scalability for handling large request volumes.

Data Layer – DynamoDB:

Deploy DynamoDB tables for application data storage.

Configure provisioned throughput or on-demand capacity for performance.

Apply encryption at rest, auto-scaling, and read/write optimization.

Ensure data persistence validation can be performed post-deployment.

Scalability and Performance:

Design infrastructure to scale automatically with minimal latency.

Ensure inter-service communication is secure, efficient, and serverless-native.

Best Practices – CDKTF and Terraform:

Follow Terraform and CDKTF best practices for modularization and resource reusability, but implement everything in a single file (main.ts or main.py) for this exercise.

Use logical code structure (functions, helper methods) to mimic modularity within the single file.

Use at least two different AWS managed services (besides Lambda) to fulfill serverless constraints.

Expected Output:
A single-file CDKTF implementation (main.ts or main.py) that:

Deploys AWS Lambda, API Gateway, and DynamoDB as a scalable serverless stack.

Includes CloudWatch monitoring, secure IAM roles, and performance-optimized resources.

Successfully passes cdktf synth and cdktf deploy.

Validates deployment via successful API calls and DynamoDB data persistence.

