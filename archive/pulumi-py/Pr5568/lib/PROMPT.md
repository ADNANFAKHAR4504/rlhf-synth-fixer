Hey man, we’d like you to create a Pulumi Python solution that automates a secure and scalable serverless infrastructure on AWS. The setup should include:

- Core components
  - Lambda functions that interact with DynamoDB tables, each with a least-privilege IAM role.
  - API Gateway with Lambda proxy integration, HTTPS-only access, detailed logging, and a usage plan for rate limiting.
  - S3 bucket for static content served via CloudFront with Geo Restriction and KMS encryption.
  - Step Functions to orchestrate multi-Lambda workflows.
  - DynamoDB using on-demand capacity mode.

- Security and compliance
  - Manage secrets through AWS Secrets Manager, securely inject them into Lambda environment variables.
  - Enforce encryption at rest with KMS across all services and configure key rotation.
  - Add a VPC endpoint for DynamoDB to prevent public data access.
  - Ensure all API endpoints enforce HTTPS.

- Reliability and monitoring
  - Set up CloudWatch Logs and Alarms for Lambda, API Gateway, and Step Functions.
  - Implement DLQs (SQS) for all Lambdas to handle failed invocations.
  - Create alarms for Lambda errors and abnormal API traffic.

- Operations and automation
  - Use modular Pulumi Python constructs for IAM roles, policies, Lambda functions, alarms, and DLQs.
  - Tag all resources with `Environment`, `Application`, and `CostCenter`.
  - Include basic verification steps to confirm API responses, Step Function runs, and DynamoDB writes.

Below is our expected output:  
A modular Pulumi Python project that provisions this infrastructure with secure defaults, clear monitoring, and least-privilege IAM. The deployment should be repeatable and meet all compliance and performance requirements.
