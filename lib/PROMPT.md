You are a Principal Cloud Security Architect. Generate Terraform HCL for a secure AWS environment in us-east-1 for a data-sensitive app.

Hard Limits

Maximum total lines (all files): 913.

Exactly two files: provider.tf and tap_stack.tf.

No extra files, modules, or prose. Only Terraform code.

Minimize lines: compact blocks, minimal comments, no blank-line padding.

Line-Budget Rules (enforce)

Keep comments to section headers only (≤6 words each).

Prefer locals, for_each, count, dynamic blocks, and data.aws_iam_policy_document to avoid repetition.

Collapse attributes to single lines where readable.

Use short, consistent names. Avoid long descriptions.

Inline Lambda code must be minimal (short handler; no libs).

No duplicated policy JSON—compose with multiple statements in one data document and reuse across roles.

Avoid output descriptions; just value.

File 1 — provider.tf

Pin Terraform + AWS provider (stable versions).

Region us-east-1.

(Optional) commented S3 backend scaffold (≤6 lines).

File 2 — tap_stack.tf

Implement everything else, compactly.

Variables

project_name (string)

environment_name (string)

notification_email (string)

allowed_ssh_cidrs (list(string), default [])

instance_type (string, default "t3.micro")

enable_vpc_flow_logs (bool, default true)

tags (map(string), default {})

Add validation only where short (e.g., email regex skipped to save lines).

Locals

common_tags map: Project, Environment, ManagedBy="Terraform", merged with var.tags.

Small helpers: AZ list via data.aws_availability_zones, cidrsubnet() loops for subnets, names, ARNs.

VPC (HA, compact)

aws_vpc with DNS hostnames/support.

4 subnets: 2 public, 2 private across 2 AZs using for_each.

aws_internet_gateway.

NAT per AZ (2) with EIPs; routes via for_each.

Route tables + associations using maps and for_each.

No public IPs on private subnets.

EC2 (private only)

aws_launch_template using var.instance_type, latest AL2 via data.aws_ssm_parameter (/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 or AL2).

Instance profile/role for SSM only (minimal perms).

aws_autoscaling_group (desired/min/max=1/1/2) in private subnets, health check EC2.

Security group: SSH allowed only from var.allowed_ssh_cidrs; if empty, no SSH rule (use count).

Egress 0.0.0.0/0 allowed (comment: required for updates/SSM).

S3 (encrypted + versioned)

Logging bucket (separate): SSE-S3, versioning, public-access-block; lifecycle prevent_destroy=true.

Data bucket: SSE-S3, versioning, public-access-block; access logging → logging bucket; bucket policy enforcing TLS.

Centralized Logging

CloudTrail → logging bucket + CloudWatch Logs (log group with retention ~90d). Minimal role/policy docs via data.aws_iam_policy_document.

VPC Flow Logs (if enabled): to CW Logs with minimal role.

CloudWatch Alarm (unauthorized)

Metric filter on CloudTrail log group for UnauthorizedOperation and AccessDenied*.

Alarm >=1 in 5m.

SNS topic + email subscription (var.notification_email).

Lambda Auto-Remediation (SG)

Tiny inline function (Python or Node) that:

Detects SG rules allowing 0.0.0.0/0 on 22/3389.

Removes offending ingress; logs actions.

EventBridge rule on CloudTrail events: AuthorizeSecurityGroupIngress, RevokeSecurityGroupIngress, UpdateSecurityGroupRuleDescriptions*.

Role with least privileges: ec2:Describe*, AuthorizeSecurityGroupIngress, RevokeSecurityGroupIngress limited to target SG; log write.

IAM (least privilege)

Compose policies with data.aws_iam_policy_document and reuse.

Deny public S3 via bucket policy + public access block.

Minimal trust policies for EC2/Lambda/CloudTrail.

Outputs (compact)

VPC ID

Public/private subnet IDs

NAT GW IDs

ASG name

Data/logging bucket names

CloudTrail name

Log group ARNs

SNS topic ARN

Lambda name/ARN

Additional Compression Tips (apply)

Reuse tag map: tags = local.common_tags.

Prefer for_each with small maps to create multiple like-resources (subnets, RTs, NATs).

Keep heredocs short; no comments inside heredocs.

No overly verbose description/name_prefix strings.

Use depends_on only when necessary (e.g., Trail → buckets).

Acceptance

Must satisfy: IAM least-privilege; encrypted + versioned S3; CloudWatch alarm on unauthorized; Lambda SG remediation; EC2 only in private subnets; VPC with 2 public + 2 private across 2 AZs; SSH restricted to allowed CIDRs; central logging.

Must pass terraform init/validate/plan with placeholder inputs.

Stay within 913 total lines across both files.

Pro Tip 🚀
Use for_each with small local maps for AZ-indexed resources (subnets, RT/assoc, NAT) and data.aws_iam_policy_document to keep policies short and reusable. Keep Lambda to ~25–35 lines.