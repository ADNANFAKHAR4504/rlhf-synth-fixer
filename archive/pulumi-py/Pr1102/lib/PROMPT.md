You are an expert in AWS security and Pulumi with Python. Write a single Pulumi Python program named security_config.py that configures and enforces security controls across an existing AWS environment for the project IaC - AWS Nova Model Breaking.

Do not generate pulumi.yaml or any entrypoint; return only the full contents of security_config.py.

The script must be idempotent, environment-aware, and safe-by-default (least privilege, no destructive defaults). It should rely on Pulumi Config() and environment variables for all parameters that could differ across environments. Naming must follow prod-<service>-<region> for any new resources you create.

Scope and Requirements
Your script must address the following services and controls. Where resources already exist, update them in place; where they do not exist but are required for compliance, create them. Use comments to explain each control and its rationale.

S3 Security

For all public S3 buckets, enable access logging to a configurable centralized logging bucket.

Ensure server-side encryption SSE-S3 (AES256) is enabled on all S3 buckets.

Block public access on logging bucket; logging bucket name must be provided via config.

IAM Least Privilege

Define or update IAM roles/policies for target services with minimum required actions only.

Parameterize which roles to validate/update via config (e.g., a list of role names or ARNs).

Inline or managed policies are acceptable, but justify choice in comments and keep policies scoped.

RDS Backups

Ensure RDS instances have automated backups enabled with backup retention >= 7 days.

Enforce Multi-AZ where set via config; do not force replacement if unset.

Make the retention period configurable, defaulting to 7.

EC2 SSH Restrictions

Ensure EC2 instances are in security groups that allow SSH (22) only from a configurable allowed CIDR list.

Remove overly-broad inbound rules (e.g., 0.0.0.0/0 for port 22).

Keep HTTP/HTTPS or other ports as-is unless specified.

CloudTrail Auditing

Ensure CloudTrail is enabled and logging to the centralized S3 logging bucket, with:

Management events on

Data events for S3 and Lambda configurable (default on)

Log file validation on

Use KMS encryption for CloudTrail if a key ARN is provided via config.

Network ACLs

Implement or update Network ACLs (NACLs) for EC2 subnets to match a restrictive baseline:

Inbound: allow SSH only from allowed CIDRs; allow established/ephemeral return traffic as needed.

Outbound: allow required egress (80/443) and ephemeral responses.

Subnet IDs to target provided via config (list). If none provided, no-ops with warnings.

Lambda Environment Encryption

Ensure that Lambda function environment variables are encrypted with AWS KMS.

Take a KMS key ARN from config; if not provided, use AWS-managed key for Lambda.

Update each functions configuration to enforce encryption helpers.

CloudFront + WAF

For each CloudFront distribution, ensure AWS WAF is enabled using a basic protection ruleset (rate limiting, SQLi/XSS managed rules).

Attach managed rule groups via WAFv2 WebACL in the appropriate scope (CLOUDFRONT).

DynamoDB Encryption

Ensure all DynamoDB tables have server-side encryption enabled (AWS owned keys are acceptable).

If a table already has SSE disabled, update to enable SSE.

GuardDuty

Enable GuardDuty in every AWS region used by the account.

Support multi-account/centralized administration if detector admin account and member IDs are provided via config; otherwise enable a standalone detector in all regions.

VPC Flow Logs

Enable VPC Flow Logs for all specified VPCs (config list of VPC IDs), with:

Destination to CloudWatch Logs log groups (or S3 if configured)

Appropriate IAM role for publishing logs

Retention configurable

Configuration Conventions
Use pulumi.Config() for all environment-specific inputs:

env: environment suffix (e.g., dev, staging, prod) default prod

region: default region for resource creation where needed

tags: object of default tags applied to created resources

logging.bucketName: centralized S3 access logging bucket

ssh.allowedCidrs: list of CIDRs allowed for SSH (e.g., ["203.0.113.0/24"])

cloudtrail.kmsKeyArn: optional KMS key ARN for CloudTrail encryption

cloudtrail.enableDataEvents: boolean, default true

nacl.subnetIds: list of subnet IDs to enforce NACL rules

lambda.kmsKeyArn: optional KMS key ARN to encrypt Lambda env vars

waf.rateLimit: integer, default 1000 requests per 5 min (example)

guardduty.regions: list of regions to enable; if not set, discover from AWS partition metadata or default to a safe set

vpcFlowLogs.vpcIds: list of VPC IDs to enable flow logs

vpcFlowLogs.logRetentionDays: integer, default 90

iam.roles: list of IAM role names/ARNs to validate/update with least privilege

Any other needed flags to toggle strictness without forcing destructive updates

All secrets (e.g., KMS ARNs if sensitive) must be read via config.get_secret.

Implementation Guidance
Use pulumi_aws provider and Python SDK.

Discover existing resources where feasible using aws.*.get_* data-source helpers and update them safely.

For bulk updates (e.g., all S3 buckets), either:

Accept an explicit allowlist from config, or

Discover buckets via aws.s3.get_buckets() then filter for public buckets by reading bucket ACL/policy/public-access-block and update only those.

Apply tags consistently to any new resources you create, following naming prod-<service>-<region> and the provided tags.

Use helper functions to keep the file maintainable and testable:

_ensure_s3_encryption_and_logging()

_ensure_iam_least_privilege()

_ensure_rds_backups()

_restrict_ec2_ssh_and_sg()

_ensure_cloudtrail()

_enforce_nacls()

_encrypt_lambda_env()

_protect_cloudfront_with_waf()

_encrypt_dynamodb()

_enable_guardduty_all_regions()

_enable_vpc_flow_logs()

In main() or a top-level orchestrator, call these helpers in a logical order.

Use ResourceOptions(protect=True) or non-destructive defaults where accidental replacement could occur (CloudTrail, WAF associations).

Include inline comments and docstrings clarifying why each control exists and how it is applied.

Expected Output
Return only the complete content of security_config.py, containing:

Imports and constants

A small configuration loader using pulumi.Config()

Helper functions per control above

A central orchestration block creating/updating resources idempotently

Consistent tagging and naming

pulumi.export() of key outputs (e.g., cloudtrail name, guardduty detectors by region, flow log group ARNs, logging bucket name)

The program must run with pulumi up and meet these acceptance criteria:

All public S3 buckets have access logging to the configured logging bucket and SSE-S3 enabled.

IAM roles are least-privilege per their function set from config.

RDS backups retention >= 7 days.

EC2 SSH access restricted to configured CIDR ranges via SGs.

CloudTrail captures management and (configurable) data events with validation.

NACLs restrict traffic per policy for target subnets.

Lambda environment variables are encrypted with KMS.

CloudFront distributions are protected by WAF with basic managed rules.

DynamoDB tables are server-side encrypted.

GuardDuty is enabled in all configured regions.

VPC Flow Logs are enabled for all configured VPCs.

Add careful comments and ensure the code is clear, maintainable, and adheres to Pulumi best practices.