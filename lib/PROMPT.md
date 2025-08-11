CDKTF Secure AWS Infra (Single Python File)
You are an expert DevOps engineer and CDK for Terraform (CDKTF) in Python practitioner. Follow the instructions below exactly to produce a secure, production-ready baseline. Think step-by-step, validate each requirement, and include brief explanations after the code.

Role & Goal
Act as a senior DevOps engineer tasked with building a tightly secured AWS foundation using CDKTF (Python).

Primary goal: deliver a single Python file that implements the infrastructure and meets every security requirement below, plus a concise walkthrough/explanation of each part.

Hard Requirements (Security)
S3 privacy

All S3 buckets must block public access (no public read/write).

Add bucket SSE with AWS-managed KMS (alias/aws/s3) by default.

IAM least privilege

Create at least one IAM role and inline policy that grants only the minimal actions needed (e.g., read-only to a specific bucket path and write to a specific CloudWatch Logs group for flow logs).

Use a trust policy restricted to the intended AWS service principal(s).

RDS encryption at rest

All RDS DB instances must have storage_encrypted = True and use KMS (prefer AWS-managed key alias/aws/rds).

VPC Flow Logs

Enable flow logs for each VPC with destination CloudWatch Logs.

Provision a Log Group and an IAM role with just-enough permissions for flow logs to write.

Security Groups (ingress restrictions)

Create a web/application security group that allows only HTTP(80) and HTTPS(443) inbound, and only from specified CIDR ranges.

Deny all other inbound (default behavior). Egress can remain open.

Constraints (Do not deviate)
Deliver one syntactically correct Python file that CDKTF can synth and apply.

Use official cdktf_cdktf_provider_aws constructs (no raw JSON HCL).

Keep it self-contained: provider, VPC, subnets (as needed), S3, IAM, RDS, security groups, flow logs, outputs.

Keep resource names deterministic and tag sensibly (e.g., Environment = "Production").

No public S3 ACLs, no wildcard * IAM actions unless strictly scoped by resource and condition (avoid if possible).

Inputs & Assumptions
Region: default to us-east-1 (make it easy to change).

Allowed CIDRs for HTTP/HTTPS: read from an environment variable ALLOWED_CIDRS (comma-separated). If not provided, default to ["203.0.113.0/24"] as a placeholder.

Use AWS-managed KMS keys (alias/aws/s3 and alias/aws/rds) via DataAwsKmsKey. Do not create CMKs.

For RDS, you may deploy a small Postgres instance in private subnets with a subnet group (no public accessibility).

What to Produce
A single Python file in one fenced code block. It must:

Import and configure the AWS provider and S3 backend (if you choose to add a backend, keep it local by default or comment a backend example).

Create a VPC (with at least 2 AZs), subnets (public/private), and VPC Flow Logs to CloudWatch Logs using a least-privileged IAM role.

Create an S3 bucket (or two) demonstrating public access block + SSE KMS (alias/aws/s3).

Define IAM role(s) + inline policy showing least privilege (e.g., s3:GetObject only on a specific bucket path, logs:CreateLogStream/logs:PutLogEvents only on the flow-logs log group).

Create an RDS Postgres instance in private subnets, with storage_encrypted=True, kms_key_id set to AWS managed key, and publicly_accessible=False.

Create a Security Group that only allows inbound 80/443 from the allowed CIDRs and nothing else inbound.

Include a few TerraformOutput values for verification (e.g., VPC ID, Flow Log ID, S3 bucket name, RDS endpoint).

Be syntactically valid CDKTF Python and runnable: cdktf synth should work.

Explanation section (after the code) in plain English:

Briefly explain how each block satisfies the 5 hard requirements.

Call out least-privilege decisions in IAM and flow-logs permissions.

Mention how to set ALLOWED_CIDRS and the region.

Implementation Notes (Follow precisely)
Use these constructs (or equivalents) from cdktf_cdktf_provider_aws:

AwsProvider, Vpc, Subnet, SecurityGroup, SecurityGroupRule, FlowLog,
IamRole, IamPolicy, IamRolePolicy, IamRolePolicyAttachment,
S3Bucket, S3BucketPublicAccessBlock, S3BucketServerSideEncryptionConfiguration*,
DataAwsKmsKey, DbSubnetGroup, DbInstance, logs.LogGroup (CloudWatch).

S3 privacy: set S3BucketPublicAccessBlock with all four block_* and restrict_public_buckets=True. Do not set public ACLs or policies. Add SSE with "aws:kms" using alias/aws/s3.

IAM: show at least one inline policy with resource-level scoping (no * resource unless strictly necessary) and a minimal action set.

Flow Logs:

Create logs.LogGroup with a retention (e.g., 30 days).

Create an IAM role trusted by vpc-flow-logs.amazonaws.com.

Grant only the logs:CreateLogStream and logs:PutLogEvents on that log group ARN.

Create FlowLog targeting the VPC, with traffic_type="ALL" and log_destination_type="cloud-watch-logs".

RDS:

Create DbSubnetGroup referencing private subnets.

DbInstance with engine="postgres", publicly_accessible=False, storage_encrypted=True, and kms_key_id from alias/aws/rds.

Keep instance class minimal (e.g., db.t3.micro) and enable backup window or at least nonzero backup_retention_period.

Output Format (Strict)
First, a single fenced Python code block.

Second, a short Explanation section (subheadings welcome).

No extra commentary before or after. No placeholders like “TODO”.

Quality Bar & Self-Check
Before finalizing, verify:

S3 buckets have Public Access Block and SSE KMS (alias/aws/s3).

IAM policies do not grant wildcard * actions broadly; they are scoped.

RDS has storage_encrypted=True and KMS set (AWS-managed key).

VPC Flow Logs are enabled with CloudWatch Logs + least-privileged role.

Security group allows only 80/443 from ALLOWED_CIDRS.

Code synthesizes (imports correct, types valid) and uses CDKTF constructs.

If a trade-off is necessary to keep the file self-contained and synthesizable, choose the most secure option and note it briefly in the explanation.

Proposed Statement (for the header comment)
You are tasked with setting up a secure infrastructure in AWS using Terraform CDKTF, and it should be in a single Python file. The infrastructure should adhere to the best security practices and ensure tight security controls are in place.