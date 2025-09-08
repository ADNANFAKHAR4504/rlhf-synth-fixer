Problem statement

Create a small, production-ready serverless stack on AWS with a security-first mindset. Use Terraform HCL for the implementation and aim for secure defaults, clear variableization, and readable outputs. This document is the authoritative specification for `lib/tap_stack.tf`.

What to build

- Secure S3 storage
  - An S3 bucket with server-side encryption using AES-256.
  - Block all public access (public ACLs and public policies disabled).
  - Versioning enabled.

- Serverless compute
  - A Lambda function running Node.js 14.x.
  - Timeout must be configurable but must not exceed 30 seconds.
  - Configuration via environment variables; secrets must come from a secrets manager or be provided via secure inputs (no hardcoded credentials).

- Monitoring & logging
  - CloudWatch log groups encrypted with a KMS key.
  - A CloudWatch metric alarm for Lambda errors (threshold: 5 errors within 1 minute).

- Edge protection
  - CloudFront distribution using the S3 bucket as origin.
  - Enforce HTTPS for viewers (redirect-to-https).
  - Attach a WAF with basic IP/rate rules to the distribution.

- IAM & access control
  - A least-privilege IAM role for Lambda (only the permissions it needs for S3 and CloudWatch).
  - Optionally allow cross-account role assumption via a parameterized list of trusted account IDs.

Constraints and non-negotiables

- Use Terraform HCL for all resources in this stack (no external modules required).
- `provider.tf` already contains provider and backend configuration; do not add another provider block in `tap_stack.tf`.
- `tap_stack.tf` must declare `variable "aws_region"` (it is consumed by `provider.tf`).
- S3 bucket names must follow AWS DNS rules (lowercase). Logical names, tags and other identifiers should use the `secureApp-` prefix for clarity; for DNS-constrained resources (like S3) use a lowercased form of that prefix.
- No hardcoded secrets. Use environment variables, Terraform variables marked sensitive, or Secrets Manager for any credentials or secrets.
- All resources should be tagged and core values exported via `lib/outputs.tf`.

Reusability and configuration

- The stack must be parameterized: environment, name prefix, lambda timeout, trusted account IDs, alarm actions and similar settings should be variables with sensible defaults.
- Keep defaults safe: short Lambda timeout (<=30s), encrypted logs, restricted S3 access, and rate-limited WAF rules.

Testing and quality

- Terraform code should be formatted (`terraform fmt`) and validate (`terraform validate`).
- Unit and integration tests live under `test/` and should check the HCL for required constructs and optionally verify live resources when AWS credentials are available.
- Provide clear outputs for S3 bucket name/ARN, Lambda name/ARN, CloudFront ID/domain, WAF ARN, KMS key id, log group name and alarm name.

Deliverable

An implementation consisting of `tap_stack.tf` (core resources), `variables.tf` and `outputs.tf` that meets the above requirements. The stack should be documented via tags and readable variable names. If any constraint is impractical (for example, the `secureApp-` prefix vs S3 DNS case sensitivity), document the exception and rationale in the repository README.
