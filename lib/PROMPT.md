I need help setting up AWS IAM with Terraform for a multi-account setup. We're running in us-east-1 and eu-west-1, and need secure cross-account access that passes SOC 2 audits.

Here's how everything connects:
- IAM roles in our main account will assume roles in target accounts using trust policies with external IDs
- A security auditor role will read from CloudTrail logs stored in S3, pull IAM metadata, and query AWS Config for compliance checks
- A CI deployer role will write to specific S3 buckets and invoke Lambda functions for deployments
- A breakglass role will have elevated access to EC2 and RDS but only when MFA is present
- All roles are restricted by a permission boundary that blocks wildcard admin actions and enforces regional limits

Put everything in two files: provider.tf and tap_stack.tf. Use Terraform 1.0+ with the AWS provider.

In provider.tf:
- Pin the AWS provider version
- Set default region to us-east-1 and add an eu alias for eu-west-1
- Configure assume_role for cross-account access with variables for account ID and role name
- Use default_tags so owner, purpose, and env tags get applied everywhere

In tap_stack.tf:
- Create a permission boundary policy that denies wildcard admin access, restricts actions to us-east-1 and eu-west-1 only, and blocks sensitive console actions unless MFA is used
- Build three IAM roles with least privilege inline policies, each using the permission boundary:
  1. corp-security-auditor-ENV: reads CloudTrail logs from S3, pulls IAM details, queries Config
  2. corp-ci-deployer-ENV: writes to specific S3 paths, invokes Lambda functions for CI/CD
  3. corp-breakglass-ENV: manages EC2 instances and RDS databases but requires MFA and has short session duration
- Each role should have a trust policy that handles cross-account assume role with optional external ID
- Tag everything with owner, purpose, and env for audit tracking

Add variables for env, owner, purpose, target_account_id, and external_id. Output the role ARNs and permission boundary ARN.

Keep it clean and commented. Show how the permission boundary blocks dangerous patterns and how roles connect to actual AWS services.
