### Goal

Create a single, easy-to-run Terraform file that bootstraps basic, secure AWS infrastructure—no drama, no extra prompts.

### Where to put things

- Put everything in `lib/tap_stack.tf`.
- Do not add provider blocks there (they already live in `provider.tf`).

### Usability

- Must work with a plain `terraform plan` with no interactive input.
- Provide sensible defaults for variables.
- Use the existing `aws_region` variable (default `us-west-2`).
- Auto-discover where reasonable (e.g., VPC) or fall back to sane defaults.
- S3 bucket names must be globally unique—use an obvious placeholder pattern if needed.

### Security baseline

- Enforce TLS-only access to S3.
- Encrypt everything by default.
- Keep IAM permissions minimal and scoped.
- Use tight, minimal security groups.

### What to build

- **S3**
  - Two buckets: one for logs, one for data.
  - Versioning enabled on both.
  - Block all public access.
  - TLS-only bucket policies.
  - Data bucket uses SSE with KMS; default to AWS-managed `aws/s3` unless a custom key is provided.
  - Route data bucket access logs to the logs bucket.

- **IAM**
  - A role for EC2 instances that can read/write S3 objects based on tags (keep policy minimal).
  - An IAM user for deployments.
  - An account-level MFA policy attached via a group; the user belongs to that group.

- **EC2 (toggleable)**
  - When enabled, create a security group that allows only SSH (22) and HTTPS (443) from a provided CIDR.
  - Instance must enforce IMDSv2 and use an encrypted root volume.

- **CloudTrail (toggleable)**
  - When enabled, create a regional trail with its own bucket and the standard delivery policy.
  - Provide an option to reuse an existing trail/bucket instead of always creating new ones.

- **AWS Config (toggleable)**
  - When enabled, create a recorder and delivery channel that writes to the logs bucket.
  - Include a few standard AWS managed rules.
  - Make it easy to disable entirely if there’s already a recorder in the account.

- **GuardDuty (toggleable)**
  - Create the detector only.

### Required outputs

Expose these outputs for tests (empty strings are fine when features are disabled):

- `data_bucket_name`
- `trail_bucket_name`
- `cloudtrail_arn`
- `ec2_instance_id`
- `security_group_id`
- `iam_role_name`
- `iam_user_name`

### Misc

- Keep the code readable, with brief comments where non-obvious.
- Default CloudTrail and AWS Config to disabled so we don’t disrupt shared accounts.
