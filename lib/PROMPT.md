You are a Principal Cloud Security Architect. Generate Terraform HCL that implements a multi-region AWS security baseline aligned with the following requirements. The source brief mentions CloudFormation/YAML, but your task is to deliver the equivalent in Terraform HCL with the same security intent and controls.

Objectives

Build two independent VPC stacks in two AWS regions (e.g., us-east-1 primary, eu-west-1 secondary).

Enforce least-privilege IAM, full data-at-rest encryption using AWS-managed keys, VPC Flow Logs in both regions, and restrictive security groups that allow only necessary traffic.

Follow organization naming and CIDR policies, and tag every resource consistently.

Output Requirements

Language: Terraform HCL (no prose in the output).

Structure: Exactly two files is preferred (provider.tf, sec_stack.tf). If your generator needs more, keep it minimal (variables.tf, outputs.tf).

Providers: Only hashicorp/aws. Pin a stable ~> 5.x.

Code must pass terraform init, terraform validate, and a dry-run terraform plan with reasonable default inputs.

Providers & Regions

Configure two AWS providers with aliases:

Default: us-east-1

Alias eu_west_1: eu-west-1

All region-specific resources must reference the correct provider alias.

Variables (keep concise, add validation where short)

org_prefix (string) — short org slug used in names.

environment (string) — prod|staging|dev.

vpc_cidr_primary (string), vpc_cidr_secondary (string).

allowed_ingress_cidrs (list(string)) — organization-approved CIDRs.

allowed_ports (list(number)) — default [22, 443] (adjustable).

flow_logs_retention_days (number, default 90).

tags (map(string), default {}).

Locals

common_tags = { Project = "IaC - AWS Nova Model Breaking", Environment = var.environment, ManagedBy = "Terraform" } merged with var.tags.

Short name helper for consistent prefixes: ${var.org_prefix}-${var.environment}.

Global Security Defaults (per region)

EBS default encryption ON using AWS-managed key (alias/aws/ebs).

CloudWatch Logs encryption uses AWS-managed key (alias/aws/logs).

S3 uses SSE-S3 (AWS managed) or KMS AWS-managed alias (alias/aws/s3) as applicable.

RDS storage encryption ON with AWS-managed key (alias/aws/rds).

DynamoDB (if used) with SSE enabled (KMS_MANAGED).

Pro Tip 🚀 Keep policies resource-scoped; never use "Action": "\*". Use data "aws_iam_policy_document" to compose minimal statements.

Regional Stack (replicate for both regions)

For each region (primary and secondary), create the following resources. Use for_each patterns to avoid duplication.

1. Networking (VPC + Flow Logs)

aws_vpc with DNS support; CIDR from region-specific variable.

At least two subnets (you can model private-only or 1 public/1 private if you prefer, but security groups must still remain restrictive).

VPC Flow Logs:

aws_cloudwatch_log_group (retention = var.flow_logs_retention_days).

aws_iam_role + policy allowing VPC Flow Logs to write to CWL (least privilege).

aws_flow_log targeting the log group, traffic type = ALL.

2. Security Groups (necessary traffic only)

Create dedicated security groups with descriptive names and descriptions:

bastion/app SG (ingress only from var.allowed_ingress_cidrs on var.allowed_ports; no 0.0.0.0/0).

Outbound egress: restrict to necessary egress or allow all with justification comment.

No wide ports; use the allowed_ports list to drive explicit rules.

3. IAM (least privilege)

Delivery roles for Flow Logs → CloudWatch Logs.

Example workload role scaffold (if needed) granting minimal service actions (no wildcards; scope to ARNs).

Deny policies to prevent public S3 ACLs/policies where applicable.

4. Encryption at Rest (AWS-managed)

Ensure encryption defaults are applied:

EBS default encryption (aws_ebs_encryption_by_default).

S3 bucket encryption (SSE-S3 or AWS-managed KMS).

RDS storage_encrypted = true with KMS AWS-managed key alias.

CloudWatch Logs encrypted (implicitly with AWS managed).

5. (Optional scaffolds that align with security intent)

S3 logging bucket for audit artifacts with block public access + TLS-only bucket policy.

KMS key usage not required for CMK, but you may surface variables to switch to CMKs later.

Naming & Tagging

All resources must use the org_prefix + environment naming pattern (e.g., acme-prod-vpc-primary).

Apply local.common_tags to every taggable resource. Include Environment and Owner if provided.

Outputs (per region)

VPC ID, subnet IDs.

Flow Log ID and Log Group ARN.

Security Group IDs.

(If scaffolded) S3 bucket names for logs.

IAM Policy Composition (examples to include)

Flow Logs role policy: allow logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents on the specific log group ARN.

S3 TLS-only bucket policy (if you include a bucket): deny aws:SecureTransport = false.

No "Action": "_", no "Resource": "_". Use specific ARNs and conditions.

Acceptance Criteria

Implements IAM least privilege, VPC Flow Logs in BOTH regions, encryption at rest via AWS-managed keys, and SGs that only allow necessary traffic.

Multi-region: two regions, two VPCs, each with its own Flow Logs and controls.

Uses Terraform HCL (not CloudFormation), pinned AWS provider, and passes terraform validate.

Clear, consistent naming and tagging aligned to org policy and CIDR constraints.

Minimal file layout you should produce

provider.tf

Terraform + provider blocks pinned (aws ~> 5.x), default in us-east-1, alias eu_west_1 in eu-west-1.

tap_stack.tf

Variables, locals, data sources, both regional stacks (using provider aliases), IAM docs/roles, VPCs, subnets, SGs, Flow Logs, outputs.
