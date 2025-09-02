# Terraform: Production AWS Baseline — Human-friendly brief

This document explains what to build and the exact constraints for a production-ready, security-first Terraform stack targeting AWS (region: us-west-2). The goal is complete, runnable HCL that a reviewer or CI pipeline can apply safely and repeatedly.

Keep the configuration minimal but secure, heavily commented, and idempotent. Prefer secure defaults over convenience when a choice is ambiguous.

## Core deliverable

Produce a set of Terraform HCL files (modular where appropriate) that together implement a secure AWS foundation with sensible defaults. The repository must contain all HCL needed to `terraform init`/`plan`/`apply` successfully in us-west-2.

## What to include

- VPC: single VPC (recommended /16), with at least two AZs, public and private subnets, NAT gateway(s), IGW, and separate route tables.
- Network ACLs (NACLs) configured to deny-by-default and only allow necessary traffic from `var.trusted_cidrs` plus intra-VPC traffic.
- Security Groups with no 0.0.0.0/0 inbound rules and constrained egress (prefer 443). Prefer SG-to-SG rules over CIDR-based allowances.
- EC2 launched via a Launch Template + Auto Scaling Group in private subnets. No public IPv4. Use SSM Session Manager for access. Disable IMDSv1.
- S3 buckets for application and logging: block public access, enable versioning, enable SSE-KMS with a customer-managed key, and send server access logs to a logging bucket.
- KMS: a CMK dedicated for S3/CloudTrail with a least-privilege key policy and automatic rotation.
- CloudTrail: deliver logs to encrypted S3 and send events to CloudWatch Logs.
- CloudWatch Alarm: a metric filter/alarm that triggers on root-account activity derived from CloudTrail logs and notifies via SNS.
- AWS Config: enabled recorder and a rule (managed or custom) that enforces EC2 instances are members of an Auto Scaling Group.
- IAM: least-privilege roles for EC2, CloudTrail, AWS Config, and any Lambda functions. No wildcard actions/resources unless strictly unavoidable.
- Tagging: `Environment = "Production"` and `Owner = "TeamX"` applied globally (provider default_tags + per-resource as needed).

## Non-negotiable constraints (short)

1. The existing `provider.tf` contains the AWS provider and S3 backend.
2. Declare the variable `aws_region` in `variables.tf`. `provider.tf` will consume it.
3. All resources must be in `us-west-2`. No cross-region resources.
4. Use least-privilege IAM (avoid `"*"` in actions/resources). Scope policies to ARNs whenever possible.
5. All S3 buckets must use SSE-KMS and have public access blocked and versioning enabled.
6. NACLs must reference `var.trusted_cidrs` for allowed inbound/outbound where appropriate.
7. Security Groups must not allow wide-open (0.0.0.0/0) ingress. Egress should be limited to required ports (prefer 443).
8. CloudTrail must be configured to write encrypted logs to S3 and forward to CloudWatch Logs.
9. Add a CloudWatch metric filter + alarm to detect root user usage and notify an SNS topic.
10. AWS Config recorder must be on and a rule must verify EC2 instances are in an ASG (use a managed rule if available).
11. No public-facing EC2 instances — use SSM Session Manager for administrative access.
12. Use provider `default_tags` for Environment/Owner and add tags explicitly where provider tagging doesn't apply.
13. Explain the security intent with concise comments above each resource block.
14. Do not include plaintext secrets — use variables and external secret management if needed.
15. The code must be idempotent: a second `terraform apply` should be a no-op.

## Output & structure guidance

- Produce complete HCL files.

## Validation checklist (what reviewers/CI will check)

- All resources are in `us-west-2`.
- S3: SSE-KMS enabled, versioning enabled, public access blocked, server access logs delivered to a logging bucket.
- KMS: CMK exists, rotation enabled, and key policy is least-privilege.
- EC2: launched in private subnets, no public IPs, IMDSv2 enforced, SSM access configured.
- SGs: no 0.0.0.0/0 inbound rules; egress limited appropriately.
- NACLs constrained to `var.trusted_cidrs` and minimal egress for service needs.
- CloudTrail: writing to encrypted S3 and CloudWatch Logs.
- CloudWatch Alarm: triggers on root-account activity and publishes to SNS.
- AWS Config: recorder on and EC2-in-ASG rule present.
- Tagging: every resource has `Environment = "Production"` and `Owner = "TeamX"`.

## Final notes for implementers

- If a managed AWS Config rule exists that enforces EC2 membership in an ASG, prefer it — it's easier to reason about and test.
- Choose secure defaults; document any exceptions clearly in comments.
- Keep variable defaults conservative and surface necessary configuration via variables (e.g., `trusted_cidrs`, `allowed_egress_ports`).

Deliver the HCL files ready for review; each file should include short comments explaining the why/security rationale for the main resources.
