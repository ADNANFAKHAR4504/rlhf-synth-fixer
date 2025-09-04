You are an experienced AWS DevOps engineer and CloudFormation expert. Your task is to create a comprehensive CloudFormation YAML template that sets up a secure, production-ready AWS environment.

**Context:** This template will be used to deploy a complete serverless architecture with secure storage, content delivery, and API capabilities in a production AWS environment.

**Requirements:**
Create a CloudFormation YAML template named `cloud_environment_setup.yaml` that implements the following infrastructure components:

**Core Infrastructure:**

1. Deploy to us-east-1 region using AWS CloudFormation YAML format
2. S3 bucket with versioning enabled and KMS server-side encryption
3. IAM role with least-privilege permissions (S3 bucket access only)
4. CloudFront distribution serving S3 content with ACM SSL certificate
5. HTTP to HTTPS redirection in CloudFront
6. DynamoDB table with standard capacities (5 read/5 write) and on-demand backup
7. Python-based Lambda function triggered by S3 events
8. KMS encryption for Lambda environment variables
9. API Gateway REST endpoint to invoke Lambda
10. CloudWatch logging for API Gateway and Lambda

**Technical Specifications:**

- Use proper CloudFormation intrinsic functions and references
- Implement cross-stack dependencies correctly
- Include appropriate resource properties and configurations
- Follow AWS naming conventions with consistent tagging strategy
- Ensure security best practices throughout

**Output Format:**

- Valid CloudFormation YAML syntax
- Proper indentation and formatting
- Include Comments explaining key configurations
- Add Parameters section for customization
- Include Outputs section with key resource ARNs and endpoints
- Organize resources logically by service type

**Validation Criteria:**
The template must be deployable without errors and create a fully functional environment where:

- S3 bucket is secure and properly encrypted
- CloudFront serves content over HTTPS only
- Lambda function can be triggered by S3 events and API Gateway
- All logging is properly configured
- IAM permissions follow principle of least privilege

Please provide the complete YAML template with all necessary configurations to meet these requirements.
