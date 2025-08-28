Project brief: Terraform secure AWS baseline (single file)

Context
We need a repeatable Terraform configuration that stands up a secure AWS baseline for a small web workload. Keep it simple, readable, and practical for day-to-day infrastructure work. The provider/backends are handled elsewhere.


What to build (in one file named `tap_stack.tf`)

- VPC with two public subnets (ALB/NAT) and two private subnets (EC2/RDS), routed appropriately. Include an S3 VPC endpoint.
- Application Load Balancer with HTTPS (ACM cert), HTTP to HTTPS redirect, and access logs to a dedicated S3 log bucket.
- EC2 behind the ALB in private subnets (launch template and ASG are fine). EBS volumes encrypted.
- RDS (PostgreSQL) in private subnets, multi-AZ, encrypted, not publicly accessible.
- S3 buckets: one for logs (target for ALB and other access logs) and one for application data. Versioning on, public access blocked, server-side encryption, and basic lifecycle for retention. Data bucket should log to the log bucket.
- VPC Flow Logs to CloudWatch Logs, encrypted via KMS.
- CloudWatch alarms for risky/error conditions, with notifications via SNS (email subscription is sufficient).
- AWS Config enabled (recorder, delivery channel to the config S3 bucket, and a small set of managed rules for encryption/public access/IAM hygiene).

Guardrails

- Everything (variables, locals, resources, outputs) goes into `tap_stack.tf`. Do not use external modules or pre-existing resources.
- Do not add provider or backend config to `tap_stack.tf` (there is already a `provider.tf`).
- Use KMS for encryption at rest wherever supported (S3, EBS, CloudWatch Logs, RDS). Enforce TLS in transit where practical.
- Keep least-privilege IAM for any roles you add (EC2 instance role, flow logs, etc.).
- Apply consistent tagging and sensible names. Aim for multi‑AZ where it matters.

Inputs
Declare and use (add others if needed):

- aws_region (string; `provider.tf` will consume it)
- project_name (string)
- environment (string)
- allowed_cidrs (list(string))
- instance_type, ec2_key_name
- desired_capacity, min_size, max_size (if you use ASG)
- rds_engine_version, rds_instance_class, rds_username, rds_password (mark secrets sensitive)
- log_retention_days (number)
- cost_allocation_tag_keys (list(string))
- alarm_email (string)

Outputs
Expose IDs/endpoints for the VPC and subnets, ALB DNS, RDS endpoint (no secrets), S3 bucket names, KMS ARNs, SNS topic, and useful CloudWatch/Config names.

Expectations

- Code must format and validate cleanly with Terraform.
- No external files (e.g., no templatefile for user data). Keep user data inline if needed.
- Keep the configuration deployable without manual edits.
