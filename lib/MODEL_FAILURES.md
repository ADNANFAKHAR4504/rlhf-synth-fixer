---

- **Output is incomplete/invalid HCL**: The file truncates at the `aws_iam_role_policy.ec2_ssm_policy` block (ends at `"ssm`), leaving unclosed braces and an unfinished policy. Terraform will not parse.

- **EC2 not implemented**: No `aws_instance`, no `aws_iam_instance_profile`, no `metadata_options { http_tokens = "required" }`, and no network settings to disable public IPs. Fails EC2 AMI + hardening requirement.

- **SSM Patch Manager not implemented**: No Maintenance Window, Patch Baseline/Association, or SSM Associations. Fails patch automation requirement.

- **Missing required outputs**: No `output` blocks for key resource ARNs/IDs. Deliverable requires outputs.

- **KMS key policy gaps vs usage**:
  - CloudWatch Log Groups and the SNS topic are configured to use the same CMK, but the KMS key policy does not allow `logs.${region}.amazonaws.com` nor `sns.amazonaws.com` to use the key. Will cause AccessDenied for log encryption and SNS.
  - Declared inputs `kms_key_administrators` / `kms_key_users` are not referenced in the key policy.
  - Key policy grants `kms:*` to account root, violating the “avoid \*” guidance under IAM least privilege.

- **S3 access logging coverage**: Server access logging is enabled for `cloudtrail` and `app_data` buckets, but not for the `access_logs` bucket itself, violating “every S3 bucket has logging to a central logging bucket.”

- **S3 access logs bucket policy likely incorrect**:
  - Uses `logging.s3.amazonaws.com` principal with `Condition` on `aws:SourceArn`. S3 server access log delivery typically does not include `aws:SourceArn`; this condition may block log delivery.
  - Policy does not explicitly require expected canned ACL for server access logs; configuration may be brittle.
  - The `access_logs` bucket enforces SSE-KMS via default encryption and DenyUnencryptedUploads; S3 server access log delivery does not use SSE-KMS. These denies will likely prevent delivery of access logs to the logging bucket.

- **Bucket policy public ACL protection missing**: Policies deny non-TLS and unencrypted uploads, but do not include explicit denies for public ACLs/policies as requested (relying only on Public Access Block).

- **CloudTrail bucket policy condition key typo**: Uses `"AWS:SourceArn"` instead of the correct `"aws:SourceArn"` in multiple statements.

- **IAM least-privilege issues**:
  - VPC Flow Logs role allows `logs:CreateLogGroup` scoped to a specific log group ARN, which is not the correct resource scope for that action and may fail. Either drop it or scope to `arn:aws:logs:${region}:${account}:*`.
  - EC2 SSM permissions are unfinished; the inline policy block is truncated and does not grant required SSM permissions (e.g., equivalent to `AmazonSSMManagedInstanceCore`).

- **CloudTrail event selector schema issue**: `exclude_management_event_sources = []` is not a valid attribute in the `event_selector` block and will fail validation.

- **“No manual steps” gap for alarms/subscriptions**: Uses email SNS subscriptions which require manual confirmation, and there are no outputs or notes acknowledging this exception.

- **EC2 AMI lookup unused**: `data.aws_ssm_parameter.amazon_linux_2023_ami` is defined but not used anywhere due to the absence of EC2 resources.

- **Unused inputs**: `public_subnet_ids`, KMS admin/user variables are declared but not consumed (KMS vars also not wired into key policy).

- **RDS secret and password exposure**: DB password is set directly on `aws_db_instance`, placing the secret in the Terraform state. Not strictly forbidden by the prompt, but contrary to security-first intent; better to source from Secrets Manager at creation time or use `manage_master_user_password`.

- **S3 CMK not enforced by key-id in policies**: Bucket policies only check `s3:x-amz-server-side-encryption = aws:kms` and do not constrain `s3:x-amz-server-side-encryption-aws-kms-key-id` to the configured CMK; uploads using other CMKs would pass.

- **Region pinning not explicit in code**: While the prompt allows an existing `provider.tf`, the Terraform code itself does not assert `us-west-2` anywhere; region-sensitive constructs rely entirely on provider configuration rather than validating the expected region.





