Platform: terraform
Language: hcl

Prompt (human-written):

I need a single-file Terraform stack at `./lib/main.tf` that builds a secure web application environment in AWS (us-east-1). Provider/backend lives in `provider.tf` already, so **do not add any provider blocks** in `main.tf`. This must be a brand-new stack: no external modules, everything declared in `lib/main.tf` (variables, locals, data sources, resources, and outputs).

High-level goal
- Host static content in S3, expose a dynamic backend using API Gateway → Lambda, and add an encrypted RDS database for persistent data.
- All resources must be created in **us-east-1** and use the default VPC unless the template explicitly creates a VPC.
- Follow AWS best practices: encryption everywhere possible, least-privilege IAM, secure security groups, and consistent tagging.

Requirements (must-follow)
1. File scope
   - Put **all** `variable` declarations (including `aws_region`), `locals`, data sources, resources, IAM policies/roles, and `outputs` inside `./lib/main.tf`.
   - No `provider` block in `main.tf`. Assume `provider.tf` consumes `var.aws_region`.
   - No external modules — build resources directly in the file.
   - Use Terraform >= 0.15.0 compatible HCL.

2. Naming & uniqueness
   - Use `data.aws_caller_identity` for account-aware names (no hard-coded account IDs).
   - Add a **random suffix** (e.g., `random_id`) and append it to resource names where global uniqueness is required (S3, RDS identifier) to avoid “already exists” errors in CI.
   - Use a clear naming convention (e.g., `prodapp-<resource>-<account>-<suffix>`).

3. S3 (static hosting)
   - Create an S3 bucket for static files:
     - Enforce server-side encryption (SSE-KMS with AWS managed key `alias/aws/s3` or a CMK — prefer AWS-managed unless CMK is explicitly requested).
     - Enable versioning.
     - Block all public access (S3 Public Access Block).
     - Enable access logging to a dedicated logging bucket (create that bucket here, also encrypted + versioned).
     - Add a lifecycle rule to expire objects after 365 days.
   - Bucket name must be unique and follow the pattern described above.

4. Lambda + API Gateway (dynamic backend)
   - Create a Lambda function (Python runtime — choose a recent supported version) triggered by an API Gateway HTTP endpoint.
   - Lambda must have an execution role with **least-privilege** policies (CloudWatch logs, read access to its S3 prefix if needed, RDS access via VPC if RDS is in private subnets).
   - Store Lambda environment variables in a secure way (do not output secrets).
   - Configure API Gateway as regional (not edge-optimized) and integrate it with the Lambda using proper permissions (`aws_lambda_permission`).

5. RDS (database)
   - Create an RDS instance (Postgres or MySQL) with:
     - Storage and instance encrypted at rest (use AWS-managed encryption by default, or CMK if requested).
     - Multi-AZ is optional — if enabling, document cost/availability tradeoffs in a comment.
     - Do **not** hardcode credentials in the file. Use variables for admin username and accept that password will be provided via CI/secret manager (do not output it).
     - Place RDS in the default VPC (or create a VPC/subnets if required), and secure it with a security group that restricts inbound only from necessary sources (for example, the Lambda security group).

6. Networking & security
   - If you create a new VPC or use default, ensure Lambda (if needed) and RDS are in subnets that allow private access.
   - Security groups must deny all inbound traffic by default and only open minimal ports:
     - API Gateway does not need direct SG ingress; Lambda and RDS must have tight SG rules.
     - No `0.0.0.0/0` for SSH or DB ports by default; make allowed CIDRs configurable via variables.
   - Attach an IAM instance profile only if EC2 is used (this task is serverless-first, EC2 is optional).

7. IAM & least privilege
   - Create only the IAM roles/policies necessary:
     - Lambda execution role: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`, and any specific S3/RDS call scopes with explicit ARNs.
     - RDS access: avoid attaching broad policies — prefer resource-level restrictions where possible.
   - Include an example policy that enforces MFA for destructive operations (illustrative; do not attach to root).
   - Avoid wildcard principals and overly-broad actions; document any unavoidable wildcard usage and why it’s necessary.

8. Tags & cost allocation
   - Apply these tags to **every** resource that supports tags: `Owner` (variable), `Environment` (variable), `Project = "ProdApp"`, and `ManagedBy = "terraform"`.

9. Outputs (non-sensitive)
   - Produce the CI/CD/test friendly outputs in `cfn-outputs/all-outputs.json` shape (the integration tests will read this file). Include:
     - `s3_static_bucket_name`
     - `s3_logging_bucket_name`
     - `api_gateway_url` (invoke URL)
     - `lambda_function_name`
     - `rds_instance_identifier`
     - `aws_region`
   - Do **not** output any sensitive values (no DB passwords, no private keys).

10. Test friendliness & CI notes
    - Ensure outputs exist even if optional resources are toggled (for example, if RDS creation is optional via `var.create_rds`, output an empty string or explicit marker rather than `null` so tests can branch).
    - Make any feature toggles explicit via variables (e.g., `create_rds = true|false`) so CI can run minimal or full deployments.
    - Use `random_id` suffix so repeated CI runs don’t conflict.

Extra quality checks (please comment inline in the generated HCL about these):
- Explain encryption choices (AWS-managed vs CMK) and any additional KMS permissions required for cross-region or replication scenarios.
- Document any IAM permissions that are intentionally broad and why.
- Validate resources will pass `terraform validate`.

Deliverable:
- One file: `./lib/main.tf` containing the complete Terraform HCL implementing all of the above, ready to be used with an existing `provider.tf`. Include helpful comments and default variable values suitable for development, and make production-sensitive defaults conservative.

If anything is ambiguous, choose **security**, **least privilege**, and **test friendliness** and document your choices in the `main.tf` comments.
