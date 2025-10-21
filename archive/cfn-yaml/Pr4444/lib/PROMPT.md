Your task is to create a comprehensive, production-ready AWS CloudFormation template in YAML format. This template will define a serverless infrastructure for a modern web application, incorporating best practices for high availability, security, and operational excellence.

Please generate a complete CloudFormation YAML template that fulfills all of the following requirements:

Core Architecture & Services:

Serverless Compute: The template must use the AWS::Serverless-2016-10-31 transform. Define at least one placeholder AWS::Serverless::Function (Lambda).

API Layer: Provision an AWS::Serverless::HttpApi (API Gateway V2) to serve as the front door for incoming requests to the Lambda function.

Networking:

Create a new VPC with both public and private subnets distributed across two Availability Zones.

Deploy NAT Gateways in the public subnets to grant internet access to resources located in the private subnets.

Ensure the Lambda functions are configured to operate within the private subnets.

DNS Management: Configure Amazon Route 53 with placeholder records for a custom domain, designed to support a multi-region failover routing policy.

Security & Compliance:

IAM Roles: Create all necessary IAM Roles with precision. Every role, especially the Lambda execution role, must strictly adhere to the principle of least privilege, granting only the permissions required for its specific tasks.

Data Encryption:

Provision an AWS S3 Bucket with versioning and server-side encryption (SSE-S3) enabled by default.

Create a customer-managed AWS KMS Key. Use this key to encrypt the environment variables of all Lambda functions.

Secrets Management: Integrate AWS Secrets Manager to handle sensitive information (e.g., API keys). The Lambda function's execution role must be granted secure access to a placeholder secret.

Web Application Firewall: Protect the API Gateway endpoint by associating it with an AWS WAF WebACL.

Operations & Resiliency:

Multi-Region Design: The entire stack must be designed to be deployable in a primary region and, without modification, in a secondary region to establish a failover environment.

Database Scalability: Provision an AWS::DynamoDB::Table and configure an auto-scaling policy for both its read and write capacity units.

Logging & Error Handling:

Ensure CloudWatch Log Groups are configured for the Lambda function(s) to capture all application and error logs.

Implement a Dead Letter Queue (DLQ) using an SQS queue for the Lambda function to handle failed invocations.

Resource Identification: All created resources must be tagged with Environment, Project, and Owner. Use CloudFormation Parameters to accept values for these tags.

Configuration Integrity: Note that after a successful deployment, CloudFormation drift detection will be run to ensure the deployed infrastructure matches the template's definition.

Naming Conventions: All resource names must conform to AWS best practices and be dynamically generated where possible to prevent conflicts.

The final output should be a single, complete CloudFormation YAML file. Do not provide explanations outside of the code block; instead, use comments within the YAML to clarify complex sections or resource configurations.