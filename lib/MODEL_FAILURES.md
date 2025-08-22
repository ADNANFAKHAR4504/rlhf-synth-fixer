# Resource Tagging
## Issue
Required tags (`environment`, `owner`, `project`) are present on most resources, but coverage may be inconsistent across all taggable resources. Some resources lack a `Name` tag (helpful for ops even if not strictly required).
## Fix
Apply `tags = local.common_tags` to every resource that supports tags and add `Name` where available (e.g., KMS keys, VPC Flow Logs, CloudWatch Log Groups, S3 buckets, Security Groups).

# S3 Server-Side Encryption
## Issue
Application and Config buckets use KMS correctly, but the **CloudTrail logs bucket** is set to `AES256` and omits `bucket_key_enabled`.
## Fix
Use KMS on the CloudTrail logs bucket:
- Set `sse_algorithm = "aws:kms"`
- Set `kms_master_key_id = aws_kms_key.<region>.arn`
- Set `bucket_key_enabled = true`

# IAM Least-Privilege
## Issue
Several policies are overly broad (e.g., KMS keys allow `kms:*` to the account root; Flow Logs policy uses `Resource="*"`). CloudTrail S3 bucket policy lacks tighter conditions (e.g., `aws:SourceArn`/`aws:SourceAccount`).
## Fix
Tighten policies:
- Scope KMS key policies to necessary actions and principals (include CloudWatch Logs service principals `logs.<region>.amazonaws.com` explicitly).
- Limit Flow Logs IAM policy to the specific log group ARN(s).
- Add `aws:SourceAccount`/`aws:SourceArn` conditions to the CloudTrail bucket policy.

# CloudTrail Centralized Multi-Region Logging
## Issue
- Uses an undeclared provider alias `aws.logging` (centralized account not configured).
- CloudTrail creation is unconditional (may hit the 5-trail account limit).
- CloudTrail data events are overly broad (`arn:aws:s3:::*/*`).
- CloudTrail destination bucket uses `AES256` instead of KMS and lacks strong bucket policy conditions.
## Fix
- Properly configure a cross-account provider/assume-role for the logging account **or** use an existing regional provider as in the reference.
- Gate creation with `variable "create_cloudtrail"` and `count`.
- Restrict data events to the specific trail bucket (or required targets).
- Use KMS on the destination bucket with appropriate policy and conditions.

# Restricted Security Group Ingress
## Issue
Ingress uses very broad private CIDRs (`10.0.0.0/8`, `172.16.0.0/12`), which are not “known IP addresses only”.
## Fix
Replace with a tightly scoped allowlist (office/static egress IPs, VPN ranges, or load balancer SGs). Validate via variables but keep defaults empty or minimal.

# MFA Enforcement
## Issue
Compliant: an MFA enforcement policy is defined. Effectiveness depends on attaching it to all user principals and having an account password policy.
## Fix
Attach the policy to all users/groups (or enforce via SCPs/OUs if using Organizations). Configure an account password policy and verify console/CLI behavior.

# EBS Volume Encryption
## Issue
No control enforces encryption by default for EBS (there are no EC2 resources, but the requirement asks to ensure *all* EBS volumes are encrypted).
## Fix
Enable account-wide default encryption:
```hcl
resource "aws_ebs_encryption_by_default" "this" {
  enabled = true
}
```
Optionally set a default KMS key via `aws_ebs_default_kms_key`.

# VPC Flow Logs
## Issue
Compliant: Flow Logs are enabled in both regions and delivered to KMS-encrypted CloudWatch Log Groups. Minor: missing consistent `Name` tags.
## Fix
Add `Name` tags to Flow Logs and Log Groups (if not present) and ensure IAM policy scopes to those log group ARNs.

# Private API Gateway Endpoints
## Issue
Only VPC Interface Endpoints to `execute-api` are created. API Gateway itself is not configured as **PRIVATE**, nor is a resource policy attached to restrict access to specified VPC endpoints.
## Fix
When creating APIs, set:
- REST: `endpoint_configuration { types = ["PRIVATE"] }`
- HTTP API (v2): `disable_execute_api_endpoint = true`, set `vpc_endpoint_ids = [ ... ]`
Attach a resource policy allowing access only via the created VPC Endpoint IDs.

# AWS Config Continuous Compliance
## Issue
AWS Config is created in multiple regions without guardrails; the S3 bucket policies for Config delivery are missing; delivery channel lacks a key prefix.
## Fix
- Gate with `variable "create_config"` and create in a single region (or add an aggregator if multi-region is required).
- Add an S3 bucket policy allowing `config.amazonaws.com` (`GetBucketAcl`, `ListBucket`, `PutObject`) with `aws:SourceAccount` conditions.
- Set `s3_key_prefix` (e.g., `"config"`).

# Customer-Managed KMS Everywhere
## Issue
CloudTrail bucket not using KMS; KMS key policies don’t include CloudWatch Logs service principals; naming/`Name` tags inconsistent.
## Fix
- Use KMS for the CloudTrail bucket and enable bucket keys.
- Add statements for `logs.<region>.amazonaws.com` in KMS key policies.
- Standardize descriptions and `Name` tags to use `${local.naming_prefix}`.
