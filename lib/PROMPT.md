You are an expert in Terraform HCL. Your task is to generate a **modular Terraform configuration** that builds a serverless webhook processing pipeline with multi-stage validation and dead letter queue handling.  
**All provided configuration data must remain unchanged.**  
**Where resource names require a suffix, ensure a String suffix is appended using the Terraform `random` provider for globally unique resource names.**

```markdown
Overview

Produce a modular Terraform configuration that implements a serverless webhook-processing pipeline. The configuration should be clear, deployable, and split across logical `.tf` files (for example: provider, variables, lambda, api_gateway, s3, sqs, dynamodb, iam, cloudwatch, outputs).

Summary of requirements

- Three Lambda functions: webhook receiver, payload validator, and transaction processor. Each must have reasonable memory/timeout settings.
- An API Gateway REST API with request validation and API key authentication, plus a usage plan for rate limiting.
- DynamoDB for transaction storage (on-demand billing / PITR), S3 buckets for raw payloads and failed message archives, and SQS queues with a dead-letter queue.
- CloudWatch log groups (7-day retention), metric alarms (Lambda error % and DLQ message count), and X-Ray tracing enabled for Lambdas and API Gateway.
- IAM roles and policies following least-privilege principles.
- Tagging: Environment, Project, CostCenter (and other useful tags such as CreatedBy and a project-specific tag).

Environment and versions

- Target Terraform >= 1.5.
- AWS provider v5.x.
- Lambda runtime: Python 3.11, architecture: arm64.

Naming and secrets

- Use the Terraform random provider to append a short string suffix to names that must be globally unique.
- Sensitive configuration (API keys, DB credentials, validation rules) should be passed as SSM Parameter Store parameter names in Lambda environment variables; Lambdas should read the values at runtime.

Constraints (important)

- S3: versioning enabled and public access blocked.
- DynamoDB: server-side encryption with AWS-managed keys and point-in-time recovery enabled.
- SQS: processing queue visibility timeout 300s, DLQ after 3 receives.
- API Gateway: enforce throttling and usage-plan limits per API key.

Deliverable

Modular Terraform files that are deployable and emit outputs for critical ARNs and endpoints (for example, api_endpoint, api_key_id, lambda ARNs, bucket names, queue URLs, dynamodb table name). Use data sources where integration with existing account-level resources is required.

Notes

- Do not hard-code account IDs or regions; accept `aws_region` and `environment` via variables or TF_VAR_* environment variables.
- Ensure resources can be destroyed (where appropriate) during teardown, and include tags for cost allocation and auditing.

```