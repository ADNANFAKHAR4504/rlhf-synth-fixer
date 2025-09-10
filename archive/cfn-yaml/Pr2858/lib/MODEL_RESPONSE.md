# model\_response.md

## What the model should output to the user

A **single** CloudFormation document (**TapStack.yml** in YAML) that:

* Creates **everything** listed in the prompt (with AWS Config explicitly **omitted** per the updated instructions that removed the delivery channel and related Config components).
* Contains **no commentary, no prose**, only the YAML template.
* Validates cleanly with both `aws cloudformation validate-template` and `cfn-lint` for **us-east-1**.

## Expected characteristics of that YAML (described, not shown)

* Parameters for environment, sizing, ports, CIDRs, log retention, GuardDuty toggle.
* KMS CMK + alias with tight key policy (account root, CloudTrail, CloudWatch Logs).
* S3 buckets: **trail-logs** (with correct CloudTrail bucket policy and access logging to **access-logs**), **access-logs**, **lambda-artifacts** — all SSE-KMS and TLS-only.
* VPC with 2 public + 2 private subnets, IGW, single NAT, proper route tables.
* VPC endpoints: S3 (Gateway) + KMS/Logs/SSM/EC2Messages (Interface) with minimal policies.
* Security groups: ALB (80 from the world, minimal egress), EC2 (only from ALB on app port; no SSH), Lambda (egress-only).
* ALB with HTTP:80 listener → Target Group (instance targets, health checks).
* WAFv2 WebACL with four AWS managed rule groups + association to ALB.
* EC2 Launch Template (encrypted EBS, no `KmsKeyId`, SSM managed, minimal user data HTTP app) + ASG in private subnets.
* Lambda example (least-priv role, KMS-encrypted env, CW Logs retention, optional VPC).
* CloudTrail (multi-region, validation on) writing to trail-logs and CloudWatch Logs with a dedicated logs role.
* GuardDuty detector created only when the toggle is `true`.
* Outputs enumerating IDs/ARNs for all major resources.

## Why this is “correct”

* Fully self-contained stack; no imports of existing KMS keys, buckets, or trails.
* Least-privilege IAM and endpoint policies; TLS enforced for S3.
* Avoids known pitfalls (e.g., **no** `AWS::EC2::EBSEncryptionByDefault` which isn’t a CFN resource; **no** explicit EBS `KmsKeyId` which can cause ASG stabilization failures).
* Adheres to the “no HTTPS listener / no ACM” exclusion while still enforcing encryption in transit where applicable (S3, endpoints).
