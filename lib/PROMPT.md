You are an expert Terraform author and cloud architect. Produce a complete, runnable Terraform HCL codebase (module + root files) that provisions a **serverless stack** for a project named **ProjectX** in AWS `us-west-2`. The output must be ready-to-run (i.e., well-structured files, comments). Format all code as file-labeled code blocks.

Important ground rules (non-negotiable):

- **A provider.tf already exists** in this repository and contains the AWS provider and S3 backend. **Do not** add or modify any provider block anywhere. Assume provider.tf will supply credentials and backend configuration.
- The module/root must declare the variable `aws_region` **in `main.tf`** and that variable must be consumed by provider.tf (do not modify provider.tf but declare the variable here).
- Use `us-west-2` region for all resource creation (enforce via default variable value and locals).
- All resources must adhere to the security constraints below (no public S3 buckets, KMS encryption for environment variables, etc.).

High-level objective:
Generate Terraform code that provisions the following serverless stack for **ProjectX**:

- AWS Lambda functions (Node.js) — use the _latest Node.js runtime available as of 2025-09-03_: **`nodejs22.x`**. :contentReference[oaicite:0]{index=0}
- API Gateway (front-end) protected with AWS WAF
- S3 bucket for application assets — private and prefixed with `projectX-`
- DynamoDB table in **on-demand** capacity mode
- IAM roles and policies (documented inline)
- CloudWatch logging for Lambda executions
- KMS key for encrypting Lambda environment variables at rest
- SNS topic for error handling (Lambda failure notifications)
- AWS X-Ray tracing enabled for all Lambda functions
- Lambda event invoke configuration to send failures to SNS

Detailed requirements & constraints (must be strictly followed):

1. **Lambda**
   - All Lambda functions must have `timeout = 30` seconds.
   - Tracing must be enabled (`tracing_config { mode = "Active" }`) for X-Ray.
   - Use the **Node.js runtime** `nodejs22.x` (latest supported as of 2025-09-03). :contentReference[oaicite:1]{index=1}
   - Use `data "archive_file"` (or similar) to build a local ZIP for each Lambda so Terraform can deploy the function artifact.
   - Each Lambda must reference `kms_key_arn` so environment variables are encrypted at rest.
   - Create `aws_cloudwatch_log_group` resources for each function with a sensible retention (e.g., 30 days) and ensure log group names match `/aws/lambda/<function_name>`.
   - Create `aws_lambda_event_invoke_config` for each function and route `on_failure` to an SNS topic.

2. **API Gateway + WAF**
   - Provision an API Gateway (HTTP API or REST API — choose the option that allows a clear WAF association).
   - Create a `aws_wafv2_web_acl` with rules to block common exploits (SQLi, XSS, common bot traffic, rate limiting). Associate that Web ACL with the API Gateway stage using `aws_wafv2_web_acl_association`.

3. **S3**
   - Create an S3 bucket named with prefix `projectX-<unique-suffix>` (use Terraform `random_id` or `random_pet` to guarantee uniqueness).
   - Enforce **no public access**: `block_public_acls`, `block_public_policy`, `ignore_public_acls`, and `restrict_public_buckets` = true.
   - Enable server-side encryption. You may use the same KMS key created for Lambda env encryption (document reasoning).
   - Add a lifecycle and versioning policy if it makes sense — but **do not** enable public read access.

4. **DynamoDB**
   - Create a DynamoDB table using **on-demand** billing mode (`PAY_PER_REQUEST`), with a sensible partition key (e.g., `id` string). Add a TTL attribute example and a sample Global/Local Secondary Index if appropriate (document why it’s optional).

5. **IAM roles and policies**
   - Each Lambda must use an IAM role (not an inline policy attached directly to the function). Use separate role resources.
   - Create least-privilege policies for Lambda functions: allow logging to CloudWatch, read/write to the DynamoDB table (or limited to required actions), read access to S3 object(s) if required, and use of the KMS key.
   - Embed **clear, inline comments and `description` attributes** in IAM resources explaining why each permission exists and any security trade-offs.

6. **KMS**
   - Provision a Customer Managed KMS key (`aws_kms_key`) for encrypting Lambda environment variables (`kms_key_arn`).
   - Create an alias for the key.
   - Add a key policy that allows:
     - the account root principal to administer the key,
     - Lambda service to use the key for encrypt/decrypt of environment variables,
     - the IAM roles you created to use the key.
   - Document the key policy inside the Terraform file (comments).

7. **CloudWatch & Observability**
   - Ensure CloudWatch Logs are enabled (log groups) and set retention.
   - Enable X-Ray tracing for Lambda functions.
   - Add a sample CloudWatch metric filter or alarm for errors (e.g., Lambda error rate > threshold) — optional but preferred.

8. **Error Handling**
   - Create an SNS topic for handling Lambda invocation errors.
   - Subscribe an email (document placeholder) and allow other subscribers.
   - Configure `aws_lambda_event_invoke_config` with `destination_config.on_failure.destination` pointing to the SNS topic ARN.

9. **Naming / Variables / Locals**
   - Centralize naming conventions in `locals` (e.g., `locals.project = "projectX"`, `locals.env = var.environment`).
   - Use `random_id` or `random_pet` to create unique suffixes where required.
   - Declare `variable "aws_region"` in **`main.tf`** (non-negotiable). Set default to `us-west-2`.
   - Provide variables with sensible defaults and `description` fields for: project name, environment, tags map, lambda memory, etc.

10. **Output & Documentation**
    - Produce a complete, runnable Terraform HCL modules.
    - Every resource block should include comments / `description` fields describing purpose and any non-obvious design choices.
    - Include `outputs.tf` that exports important ARNs (Lambda, API Gateway endpoint, DynamoDB table name, S3 bucket name, SNS topic ARN, KMS key ARN).

11. **Style & output requirements for the model**
    - The provider.tf already exists and holds the **AWS provider + S3 backend**.
    - Use Terraform native resources only (no external templates). If you use a provider like `archive` or `random`, declare them in a `required_providers` block or `terraform` block — but **do not** add AWS provider blocks.

Extra notes for the generator:

- Keep security best practices front and center: KMS for env vars, no public S3, least privilege IAM roles, CloudWatch logging, and X-Ray enabled.
- If there are optional trade-offs (for example, using API Gateway REST vs HTTP API), explain briefly in comments and pick the option that makes WAF association straightforward.
- Where a value depends on a runtime or service change (e.g., the "latest Node runtime"), prefer to set a clear static value in the generated code and mention in a top-of-file comment why that specific runtime string was chosen (including the date checked).
- When referencing AWS ARNs for associations (e.g., WAF to API Gateway stage), show working interpolation that will evaluate at `apply` time.

Be strict: if any of the above non-negotiable constraints or numbered constraints are violated, explicitly state which one was missed.
