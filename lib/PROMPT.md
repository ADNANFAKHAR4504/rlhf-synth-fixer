ROLE
You are a senior Terraform security engineer. Produce production-ready, valid HCL that passes `terraform validate` without edits.

OBJECTIVE
Improve AWS security posture using Terraform with a narrow, high-impact scope: S3 bucket security and IAM role/policy hardening. Generate ONE file named `tap_stack.tf` that is complete and self-contained (variables, locals, resources, outputs). The repository already contains `provider.tf`; do NOT define the provider again. You MUST declare a variable `aws_region` in `tap_stack.tf` and rely on it for region-specific values (even though provider config is in another file).

REQUIREMENTS:
S3 BUCKET ENCRYPTION & SETTINGS
• Create at least one S3 bucket (e.g., “secure-data-bucket”) with:
– Server-side encryption at rest using AES-256 (SSE-S3).
– Versioning enabled.
– Block Public Access enabled.
– A bucket policy that:
▸ Denies any non-TLS access (`aws:SecureTransport = false`).
▸ Denies `PutObject` if `s3:x-amz-server-side-encryption != AES256`.
▸ (Lockdown) Denies `s3:PutEncryptionConfiguration` to prevent disabling encryption (allow exceptions only if justified in comments).
• Avoid hardcoded ARNs; derive bucket ARNs from resource references.

IAM LEAST PRIVILEGE (NO WILDCARDS):
• Create two IAM roles with minimal trust and minimal permissions, no `"*"` in actions/resources unless strictly necessary and explicitly justified in comments:

1. Analytics Reader Role
   – Trust: EC2 (`ec2.amazonaws.com`) via `assume_role` policy.
   – Permissions: `s3:GetObject` ONLY for `arn:aws:s3:::secure-data-bucket/analytics/*`.
   – Enforce TLS via policy condition `aws:SecureTransport = true`.
2. Uploader Role
   – Trust: EC2 via `assume_role` policy.
   – Permissions: `s3:PutObject` ONLY for `arn:aws:s3:::secure-data-bucket/uploads/*`.
   – Enforce server-side encryption via `s3:x-amz-server-side-encryption = AES256`.
   • Attach inline policies to the roles or create distinct policies and attach them.
   • Create instance profiles for both roles (for testability/compliance scenarios).

SECURITY BEST PRACTICES
• Use explicit policy Conditions wherever possible (`aws:SecureTransport`, `s3:x-amz-server-side-encryption`).
• Include tags on all taggable resources: `Environment`, `Owner`, `SecurityLevel` (with sensible defaults).
• Inline comments explaining each material security decision.
• No external/proprietary modules; only first-party Terraform resources and data sources.
• Do not repeat provider configuration (assume `provider.tf` already exists).
• Do not hardcode ARNs; construct from resource attributes or variables.

TESTABILITY / COMPLIANCE OUTPUTS
• Output bucket name and ARN.
• Output role ARNs.
• Output policy JSON (via `jsonencode(...)`) for analytics reader, uploader, and bucket policy—so unit tests can parse/validate conditions and statements.
• Keep outputs minimal but sufficient for automated checks.

CONSTRAINTS (HARD)
• Single file only: `tap_stack.tf`.
• Include ALL variable declarations (with secure defaults where appropriate).
• Declare `variable "aws_region"` in this file and use it for any region-dependent references.
• No wildcards in IAM policy `Action` or `Resource` unless unavoidable; if used, add a short justification comment.
• No external modules; no provider block in this file.
• Follow Terraform best practices (clear naming, locals for repeated values, least privilege, deny-by-default mindset).

OUTPUT FORMAT (STRICT)
• Output exactly ONE fenced code block containing the full contents of `tap_stack.tf`.
• Do not include any prose before or after the code block.
• The file must be self-contained: variables, locals, resources, and outputs included.
• Prefer `locals` for common tags and ARNs; use `jsonencode` for inline policies.
• Ensure the configuration validates with `terraform validate`.

QUALITY & STYLE
• Production-grade, readable HCL with concise comments.
• Deterministic resource naming.
• Secure defaults (e.g., region default, non-empty tags, encryption on by default).
• No deprecated arguments.

VALIDATION CHECKLIST (SELF-VERIFY BEFORE PRINTING)
• File name in the code fence is `tap_stack.tf`.
• Variable `aws_region` declared and referenced where appropriate.
• S3: AES-256 SSE, versioning, BPA, TLS-only and encryption-required denies, encryption config lock.
• IAM: Two roles + instance profiles; least privilege to exact prefixes; TLS condition on reader; SSE condition on uploader; no `"*"` unless justified.
• Outputs: bucket name/arn, role ARNs, and all policies as JSON.
• All resources tagged with `Environment`, `Owner`, `SecurityLevel`.
• No provider block; no external modules; passes `terraform validate`.

DELIVER NOW
Produce the single `tap_stack.tf` file as a fenced code block—no extra commentary.
