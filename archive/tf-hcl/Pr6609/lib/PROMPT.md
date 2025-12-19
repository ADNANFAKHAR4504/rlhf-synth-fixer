Hey team,

We need a production-grade Terraform config for our new financial data processing environment in us-east-1. The compliance team is breathing down our necks about PCI-DSS Level 1 and SOC2 Type II, so we need to get this right. Everything needs to be in a single main.tf file but keep it clean and well-organized.

What we need to build:

KMS setup - spin up a customer-managed key with auto-rotation turned on. Lock down the key policy so only specific IAM roles can use it - we'll pass those in via var.allowed_kms_role_arns. No exceptions on who can encrypt/decrypt with this thing.

S3 buckets - we need at least three: one for CloudTrail logs, one for application data, and one for audit logs. All of them need to use that KMS key we just made. Turn on versioning and block all public access. The CloudTrail bucket needs to be extra locked down.

IAM roles - create least privilege roles that require MFA for anything sensitive. Also need IP restrictions based on var.allowed_admin_ips. Super important: absolutely no wildcard actions in policies. Use proper conditions for MFA checks and source IP verification.

VPC stuff - if there's no existing VPC, create one with private subnets spanning 3 AZs. No public subnets, no IGW for this workload. Set up VPC endpoints for S3, DynamoDB, and Secrets Manager so nothing has to touch the internet.

Security Hub - enable it with the CIS AWS Foundations Benchmark. If you can add a custom standard or at least stub it out in comments, that would be great for future proofing.

GuardDuty - turn it on, add threat intel feeds if supported, and wire up EventBridge to trigger some basic automated remediation via Lambda. Make sure findings flow into Security Hub.

CloudWatch setup - create log groups for VPC Flow Logs and app logs, encrypt them with our KMS key. Turn on VPC Flow Logs and send everything there.

AWS Config - get the recorder going with continuous monitoring. Add managed rules for the usual suspects: S3 public access checks, CloudTrail enabled, root MFA, IMDSv2 on EC2, stuff like that.

Secrets Manager - create a secret for database creds with 30-day rotation. You'll need a Lambda function to handle the rotation logic, even if it's just a stub for now.

SCPs - write org policies that prevent anyone from disabling Security Hub, GuardDuty, CloudTrail, or Config. Make them attachable to whatever OU we specify via var.target_organization_unit_id.

Monitoring - set up CloudWatch alarms for unauthorized API calls and any root account usage. Hook them up to SNS so we actually get notified.

WAF - deploy a Web ACL with OWASP Top 10 protections and rate limiting. Use the managed rule groups to make life easier.

A few other things to remember:

Only use IMDSv2 for EC2 instances, enforce TLS 1.2 minimum everywhere, no security group rules with 0.0.0.0/0 inbound, tag everything with var.tags and var.data_classification, and make sure GuardDuty findings actually make it to Security Hub.

Technical requirements:

Use Terraform 1.5 or newer with AWS provider version 5.x. Put common stuff in locals and use data sources for any existing resources like VPCs or subnets - but have fallbacks if they don't exist. Every S3 bucket gets KMS encryption, no exceptions. IAM policies need to be least privilege without wildcards. Security groups can't allow inbound from anywhere. Store CloudTrail logs in their own locked bucket. EC2 instances must use IMDSv2 only. Secrets rotate every 30 days. VPC flow logs go to encrypted CloudWatch. And really important: don't set prevent_destroy on anything - we need to be able to tear this down for testing. Actually add prevent_destroy = false explicitly on critical stuff.

For variables, set up var.region defaulting to us-east-1, var.allowed_kms_role_arns, var.allowed_admin_ips, var.vpc_id and var.subnet_ids as optional with fallback creation, var.target_organization_unit_id for SCPs, plus var.tags and var.data_classification for resource tagging.

What I need back:

Just give me the complete main.tf file contents. No explanations, no summaries, just the actual Terraform code. Make sure it has the terraform and provider blocks set up right, all the variables defined, locals for anything repeated, data sources where needed, and all the resources organized into clear sections with comments. Output all the important ARNs and IDs we'll need like the KMS key, bucket ARNs, Security Hub, GuardDuty detector, secrets, VPC endpoints, Config recorder, WAF ACL, and org policies.

Keep the code clean with good comments explaining the security decisions, especially around policy conditions. Everything should be declarative - no manual console steps required. If something can't be automated, document it clearly in comments.

Just send over the single Terraform file when you're done.