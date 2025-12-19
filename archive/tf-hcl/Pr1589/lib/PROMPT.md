Hey there,

I need your help writing Terraform HCL for a secure AWS environment in us-east-1. This setup is for a data-sensitive app, so it needs to be locked down but still scalable. There are a couple of constraints we have to follow:

Only two files: provider.tf and tap_stack.tf.

No extra modules or helper files.

Max total size is 913 lines across both files.

Keep things compact: minimal comments, compact blocks, and no extra whitespace.

Providers

Terraform + AWS provider pinned to stable versions.

Region fixed to us-east-1.

Optionally, add a short S3 backend scaffold in provider.tf (commented out, ≤6 lines).

Variables

project_name (string)

environment_name (string)

notification_email (string)

allowed_ssh_cidrs (list of strings, default [])

instance_type (string, default "t3.micro")

enable_vpc_flow_logs (bool, default true)

tags (map, default {})

Use only short validations (skip email regex to save lines).

Locals

common_tags that include Project, Environment, and ManagedBy="Terraform", merged with var.tags.

Small helpers for AZs, subnet CIDRs (cidrsubnet()), resource names, and ARNs.

Networking (High Availability)

A VPC with DNS enabled.

4 subnets (2 public, 2 private) across 2 AZs, created with for_each.

Internet Gateway.

NAT gateways (2, one per AZ) with EIPs and routing handled via for_each.

Route tables and associations via maps.

Private subnets should not auto-assign public IPs.

Compute (Private EC2 Only)

Launch Template using var.instance_type.

Use Amazon Linux 2023 (or latest AL2) from SSM.

Instance profile/role with only SSM permissions.

Auto Scaling Group in private subnets: min=1, max=2, desired=1.

Security Group: allow SSH only from var.allowed_ssh_cidrs. If empty, no SSH rule.

Outbound egress open to 0.0.0.0/0 (needed for updates/SSM).

Storage (S3)

Logging bucket: SSE-S3, versioning, public access block, prevent_destroy.

Data bucket: SSE-S3, versioning, public access block. Enable access logging to the logging bucket. Add TLS-only bucket policy.

Centralized Logging

CloudTrail sending logs to the logging bucket and CloudWatch Logs (log group with ~90d retention).

Minimal IAM role/policy using data.aws_iam_policy_document.

VPC Flow Logs (if enabled) to CloudWatch Logs, with minimal IAM role.

Monitoring & Alerts

CloudWatch metric filter on the CloudTrail log group for UnauthorizedOperation and AccessDenied\*.

Alarm triggers if ≥1 event in 5 minutes.

SNS topic with email subscription (using var.notification_email).

Auto-Remediation Lambda

Tiny inline Lambda function (Python or Node).

Function checks for SG rules that allow 0.0.0.0/0 on ports 22 or 3389.

If found, removes the rule and logs the action.

Triggered by EventBridge rules on CloudTrail events for security group changes.

IAM role for Lambda with only the permissions it needs: ec2:Describe\*, AuthorizeSecurityGroupIngress, RevokeSecurityGroupIngress, and logging.

IAM (Least Privilege)

Use data.aws_iam_policy_document to compose minimal inline policies and reuse them.

Deny public S3 access via bucket policy and public access block.

Minimal trust policies for EC2, Lambda, and CloudTrail roles.

Outputs

Keep outputs short and compact (just the values):

VPC ID

Public and private subnet IDs

NAT Gateway IDs

Auto Scaling Group name

Data and logging bucket names

CloudTrail name

Log group ARNs

SNS topic ARN

Lambda name and ARN

Acceptance Criteria

VPC with 2 public + 2 private subnets across 2 AZs.

EC2 runs only in private subnets.

SSH restricted to allowed CIDRs.

Encrypted + versioned S3 buckets.

CloudTrail and Flow Logs enabled.

CloudWatch alarm for unauthorized activity.

Auto-remediation Lambda for SG misconfigurations.

IAM roles least-privilege only.

Must pass terraform init, terraform validate, and terraform plan.

Stay within the 913 line budget
