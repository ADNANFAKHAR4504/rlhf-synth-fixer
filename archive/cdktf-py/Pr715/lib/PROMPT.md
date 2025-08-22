You are responsible for improving the security posture of an AWS environment by implementing infrastructure-as-code using CDK for Terraform in Python, with a narrow, high-impact scope: S3 bucket security and IAM role/policy hardening. Your deliverable is a single Python file that, when synthesized/applied, creates the necessary AWS resources and enforces the following security constraints and best practices.

Goals & Requirements
S3 Bucket Encryption

Every S3 bucket created must have server-side encryption at rest enabled using AES-256 (i.e., the AWS-managed AES256 encryption algorithm).

Bucket policies and settings should not allow disabling/encryption bypass.

Versioning should be enabled to assist with recovery (optional but preferred for security posture).

IAM Least Privilege

Define IAM roles and policies that follow the principle of least privilege: access to S3 must be limited to exactly what is needed.

No wildcard (*) permissions on actions or resources unless explicitly justified in code comments.

Example scenario to implement: a role that can read objects from a specific bucket and another role that can write objects to a different prefix, with minimal other privileges.

IAM policies must explicitly scope resources (e.g., bucket ARNs, object prefixes).

Security Best Practices

Use policy conditions where applicable (e.g., restricting access to encrypted objects, forcing SSL/TLS via aws:SecureTransport).

Attach an IAM policy that denies unencrypted uploads or access if not using HTTPS.

Ensure that any role meant to be assumable by services has proper trust relationships (e.g., limited to specific principals).

Testability / Compliance

Structure the code so it can be consumed by organization security unit tests (e.g., expose outputs or tags that tests can assert against).

Include meaningful resource tagging (Environment, Owner, SecurityLevel, etc.) to aid auditability.

Provide in-code comments or helper functions that could be used by tests to validate:

That server_side_encryption_configuration is present and uses AES256.

That IAM policies have no over-permissive wildcards and are scoped to specific ARNs.

That transport security and encryption-at-rest constraints are enforced via policy statements or bucket settings.

Constraints
Must be a single .py file using CDKTF (Python), not raw HCL or multiple modules/files.

Do not rely on external proprietary modules; use official cdktf_cdktf_provider_aws constructs.

Avoid hard-coding ARNs where input flexibility is reasonable accept inputs (via variables/stack parameters) for bucket names and role identifiers, but default to secure sane values for standalone execution.

Expected Output
A single Python CDKTF stack defining:

At least one S3 bucket with AES-256 encryption enforced.

IAM role(s) with scoped policies demonstrating least-privilege access patterns (e.g., read-only role, write-only role with prefix restriction).

Policy statements denying insecure operations (unencrypted uploads, non-HTTPS access).

Outputs that expose bucket name(s), role ARNs, and possibly policy ARNs/JSON for downstream test validation.

Comments explaining security decisions (especially any deviations or explicit scoping logic).

Example Scenarios to Cover (can be encoded as separate roles/policies)
Analytics Reader Role: Can only s3:GetObject on arn:aws:s3:::secure-data-bucket/analytics/* and only over TLS.

Uploader Role: Can s3:PutObject to arn:aws:s3:::secure-data-bucket/uploads/*, but uploads must be encrypted server-side (enforced via bucket policy or IAM condition).

Validation Checklist (for automated/security unit tests)
S3 buckets have server_side_encryption_configuration with AES256.

Bucket policies or IAM deny access if aws:SecureTransport is false.

IAM policies do not contain "Resource": "*" unless the justification is commented and scoped elsewhere.

Permissions are split to reflect least privilege (read vs write, per-prefix).

All resources have appropriate tags for auditability.

Outputs expose enough information for test harness to introspect policies and encryption settings.

Delivery Instructions
Provide the Python file as the primary artifact.

Include inline documentation/comments; no separate README is required (but comments should make the intent and security enforcement obvious).

Assume this will be run with valid AWS credentials in a default region unless overridden via environment or CDKTF configuration.