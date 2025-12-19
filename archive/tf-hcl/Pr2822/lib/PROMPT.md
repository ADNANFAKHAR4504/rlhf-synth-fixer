Here’s a clean, copy-pasteable “Claude Sonnet best-practices” prompt that makes Claude output exactly two secure Terraform files—`provider.tf` and `tap_stack.tf`—with no extra text.

---

ROLE
You are a senior Terraform security engineer. Produce production-ready, valid HCL that passes `terraform validate` without edits.

OBJECTIVE
Improve AWS security posture using Terraform with a narrow, high-impact scope: S3 bucket security and IAM role/policy hardening. Generate EXACTLY TWO files—`provider.tf` and `tap_stack.tf`—that are complete and self-contained (variables, locals, resources, outputs). Use the variable `aws_region` declared in BOTH files; do not hardcode the region.

ENVIRONMENT INPUTS
• Cloud: AWS (production).
• Region: us-east-1 (supplied via `var.aws_region`).
• Existing VPC ID: `vpc-12345678` (declare a variable; S3/IAM are global but keep this for compliance metadata).
• Standard resource naming and tagging conventions.

REQUIREMENTS
S3 BUCKET ENCRYPTION & SETTINGS
• Create at least one S3 bucket (name via variable) with:
– Server-side encryption at rest using AES-256 (SSE-S3).
– Versioning enabled.
– Block Public Access enabled.
– Bucket policy MUST:
▸ Deny any non-TLS access (`aws:SecureTransport = false`).
▸ Deny `PutObject` when `s3:x-amz-server-side-encryption != "AES256"`.
▸ Prevent disabling encryption by denying `s3:PutBucketEncryption` and `s3:DeleteBucketEncryption` (justify exceptions in comments if any).
• Avoid hardcoded ARNs; derive from resource attributes.

IAM LEAST PRIVILEGE (NO WILDCARDS)
• Create two IAM roles with minimal trust and minimal permissions (no `"*"` in Actions or Resources unless strictly necessary and explicitly justified in comments):

1. Analytics Reader Role
   – Trust: EC2 (`ec2.amazonaws.com`).
   – Permissions: `s3:GetObject` ONLY for `arn:aws:s3:::<secure-bucket>/analytics/*`.
   – Enforce TLS via condition `aws:SecureTransport = true`.
2. Uploader Role
   – Trust: EC2 (`ec2.amazonaws.com`).
   – Permissions: `s3:PutObject` ONLY for `arn:aws:s3:::<secure-bucket>/uploads/*`.
   – Enforce SSE via condition `s3:x-amz-server-side-encryption = "AES256"`.
   • Attach inline policies or standalone policies then attach.
   • Create instance profiles for both roles (useful for compliance tests).

SECURITY BEST PRACTICES
• Use explicit policy Conditions (`aws:SecureTransport`, `s3:x-amz-server-side-encryption`).
• Deny insecure operations (unencrypted uploads, non-HTTPS, disabling encryption).
• Proper trust policy for assumable roles (EC2).
• Tag all taggable resources: `Environment`, `Owner`, `SecurityLevel` (defaults should be secure and non-empty).
• Inline comments explaining security choices.

TESTABILITY / COMPLIANCE OUTPUTS
• Output bucket name and ARN.
• Output role ARNs.
• Output policy JSON (use `jsonencode(...)` or `data "aws_iam_policy_document"` rendered to JSON) for: bucket policy, analytics reader policy, uploader policy.
• Keep outputs minimal but sufficient for automated checks.

CONSTRAINTS (HARD)
• Produce ONLY TWO FILES: `provider.tf` and `tap_stack.tf`. No modules, no extra files.
• Do not rely on external/proprietary modules.
• Avoid hardcoding ARNs; construct from resource references or variables.
• All variable declarations must be inside these files with secure defaults.
• Terraform logic must follow best practices (clear naming, locals for common tags/ARNs, least privilege, deny-by-default mindset).
• No deprecated arguments.

FILES TO PRODUCE (STRICT FORMAT)

1. `provider.tf`
   • `terraform` block with `required_version` and `required_providers` (AWS provider >= 3.0).
   • `variable "aws_region"` with secure default `us-east-1`.
   • `provider "aws"` using `region = var.aws_region`.
   • `default_tags` applying at least `Environment = "Production"`, `Owner`, `SecurityLevel`.
2. `tap_stack.tf`
   • Declare variables for: `aws_region` (used where needed), `bucket_name`, `owner`, `security_level`, `vpc_id` (for metadata), and any prefixes.
   • Define `locals` for common tags and computed ARNs.
   • S3 bucket resource with SSE-S3 (AES256), versioning, BPA, lifecycle (optional), plus bucket policy enforcing TLS and encryption and denying encryption removal.
   • IAM roles, trust policies, least-privilege policies (reader/uploader) with conditions, policy attachments, and instance profiles.
   • `outputs` exposing bucket name/ARN, role ARNs, and policy JSON documents.

QUALITY & STYLE
• Production-grade, readable HCL with concise comments.
• Deterministic names; no random suffixes unless necessary.
• No `"*"` in IAM Actions/Resources unless unavoidable—add a brief justification comment if used.
• No hardcoded ARNs; build from resource attributes.
• Ensure both files together validate with `terraform validate`.

VALIDATION CHECKLIST (SELF-VERIFY BEFORE PRINTING)
• Exactly two files: `provider.tf` and `tap_stack.tf`.
• `variable "aws_region"` exists in BOTH files and is used (no hardcoded region).
• S3 bucket: AES-256 SSE, versioning, BPA, TLS-only, encryption-required denies, deny changing/removing encryption.
• IAM: two roles + instance profiles; precise prefixes; TLS condition on reader; SSE condition on uploader; no unsafe wildcards.
• Outputs: bucket name/arn, role arns, and policy JSONs.
• All resources tagged with `Environment`, `Owner`, `SecurityLevel`.
• No external modules; passes `terraform validate`.

DELIVER NOW
Output exactly TWO fenced code blocks labeled with filenames `provider.tf` and `tap_stack.tf`. No prose, no explanations—just the two HCL files.