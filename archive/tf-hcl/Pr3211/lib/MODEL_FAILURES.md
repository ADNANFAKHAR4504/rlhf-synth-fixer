Model response issues vs PROMPT requirements

## Issue 1: Format & Completeness Violations

- **Deliverable format broken**: Response contains prose/outlines instead of a single fenced Terraform code block with complete content
- **Truncated/invalid code**: File ends mid-resource with stray "### Answer ---" line; not valid Terraform
- **Missing all Outputs**: No per-region outputs (VPC IDs, subnets, ALB DNS, EC2 role, S3 buckets, KMS ARNs, RDS endpoint, Lambda ARN, Flow Log IDs) despite explicit requirement
- **Acceptance checks absent**: Required validation comments at end of file not included

## Issue 2: Missing Core Resources Per Region

- **Compute layer absent**: No ALB, Target Groups, Listeners (80/443), EC2 instances in private subnets, Launch Templates, or ALB attachments
- **Data layer absent**: No RDS instance, DB subnet group, or encryption/backup/deletion_protection configuration
- **Serverless layer absent**: No Lambda functions (roles exist but unused); no CloudWatch Log Groups with retention/KMS encryption for Lambda
- **Observability incomplete**: VPC Flow Logs partially configured but missing CloudWatch Log Groups (KMS-encrypted) and `aws_flow_log` resources for both VPCs

## Issue 3: Security & Configuration Flaws

- **Provider alias fallback violated**: All resources hardcode `provider = aws.us_east_1/us_west_2`; configuration fails when aliases missing (prompt requires graceful fallback)
- **Inadequate security hardening**: Security groups allow unrestricted `0.0.0.0/0` egress; ingress defaults to `0.0.0.0/0`; S3 lacks bucket policy enforcing TLS/KMS; tagging doesn't guarantee `Environment = "Production"`
- **Broken references & validation**: IAM policies reference non-existent CloudWatch Log Groups; undefined variables (`db_*`, `log_retention_days`); `random` provider undeclared; would fail `terraform validate`
