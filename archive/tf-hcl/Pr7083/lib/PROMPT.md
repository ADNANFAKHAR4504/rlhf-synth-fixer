Project brief

We need a deployable, modular Terraform configuration that provisions a serverless webhook-processing pipeline. Keep the implementation straightforward and split the code into logical files (provider, variables, lambda, api_gateway, s3, sqs, dynamodb, iam, cloudwatch, outputs).

Required capabilities

- Three Lambda functions: webhook receiver, payload validator, and transaction processor. Use Python 3.11 and the arm64 architecture. Choose sensible memory and timeout settings per function.
- An API Gateway REST API with request validation, API key authentication, and a usage plan that enforces rate and burst limits per key.
- A DynamoDB table for transactions (on-demand billing, point-in-time recovery, and AWS-managed KMS encryption).
- S3 buckets for raw webhook payloads and failed message archives. Enable versioning and block public access; provide reasonable lifecycle rules.
- SQS queues for processing and validation with a dead-letter queue. Set visibility timeout to 300 seconds and dead-letter after 3 receives.
- CloudWatch log groups with 7-day retention, alarms for Lambda error percentage and for DLQ message counts, and X-Ray tracing enabled for the API and Lambdas.
- IAM roles and policies scoped to least privilege for all Lambdas.
- Add tags for Environment, Project, CostCenter and other useful metadata.

Implementation constraints

- Target Terraform version 1.5 or later and AWS provider 5.x.
- Do not hard-code account IDs or regions. Accept `aws_region` and `environment` via variables or environment variables (TF_VAR_*).
 - Append a short random suffix to names that must be globally unique (for example, via Terraform's `random_string` resource).
 - Store sensitive configuration (API keys, DB credentials, validation rules) in SSM Parameter Store and pass parameter names to Lambda environment variables; Lambdas should fetch those values at runtime.

Outputs and structure

Produce modular `.tf` files and include outputs for the API endpoint, API key id, Lambda ARNs, bucket names, queue URLs, and the DynamoDB table name. Use data sources when integrating with existing account-level resources.
