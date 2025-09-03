## ProjectX — Serverless Terraform spec

This document describes a concise, production-ready serverless baseline for ProjectX. The goal is a readable, secure Terraform layout the team can deploy and maintain.

### Important constraints (please follow these)

- `provider.tf` already exists and contains the AWS provider + backend. Do not add or modify provider blocks in this module.
- Declare `variable "aws_region"` in `main.tf` (default: `us-west-2`) and use it in locals/references.
- Default region for resources should be `us-west-2` (respect the variable default).
- Follow security best practices: no public S3 buckets, use KMS for sensitive data, and minimum-privilege IAM.

### What to provision

- Lambda functions (Node.js) — runtime set to `nodejs22.x` (checked as of 2025-09-03).
- API Gateway front-end protected by AWS WAF.
- Private S3 bucket for application assets, prefixed with `projectX-<unique>`.
- DynamoDB table (on-demand / `PAY_PER_REQUEST`).
- IAM roles and policies with clear comments.
- CloudWatch logging and X-Ray tracing for Lambdas.
- A customer-managed KMS key for Lambda environment variables.
- An SNS topic for Lambda failure handling and subscriptions.

### Key requirements

1. Lambda

- `timeout = 30` seconds; X-Ray tracing enabled.
- Build artifacts using `data "archive_file"` (or similar) so Terraform can push function code.
- Reference the KMS key ARN on Lambda so environment variables are encrypted at rest.
- Create CloudWatch log groups with 30-day retention.

2. API Gateway & WAF

- Create a `aws_wafv2_web_acl` and associate it with the API Gateway stage.
- Include rules for common injection attacks and basic rate limiting.

3. S3

- Bucket names must use a predictable prefix `projectX-` and include a random suffix to avoid collisions.
- Block all public access via the S3 public access block.
- Enable server-side encryption (KMS) and versioning; add lifecycle rules where sensible.

4. DynamoDB

- Use `PAY_PER_REQUEST` for on-demand scaling. Primary key `id (S)` is fine for examples.
- Optionally include a TTL attribute and a GSI if the access pattern benefits from it; document why you chose to add or omit indices.

5. IAM & least privilege

- Every Lambda gets a dedicated IAM role (no inline policies directly on the function).
- Policies should be minimal: CloudWatch Logs, KMS decrypt for env vars, DynamoDB CRUD limited to the specific table, and S3 read for the assets bucket (if needed).
- Add `description` and inline comments explaining why permissions are required.

6. KMS

- Create a customer-managed key and an alias.
- The key policy must allow account administrators, Lambda service, and the specific IAM roles to use the key.

7. Observability & errors

- CloudWatch log groups (30d) and X-Ray tracing for Lambdas.
- SNS topic for errors; configure `aws_lambda_event_invoke_config` to send `on_failure` to SNS.

If any constraint cannot be followed exactly, call it out with a brief explanation.

Thank you, please keep the implementation clear, well-documented, and secure.
