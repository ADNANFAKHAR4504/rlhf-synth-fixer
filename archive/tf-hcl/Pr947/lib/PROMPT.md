Terraform request: single-file secure AWS baseline (tap_stack.tf)

Context: project “IaC - AWS Nova Model Breaking”. Stand up a fresh, minimal-but-real stack in a new AWS account. Provider and backend are configured elsewhere.

Deliverable: one file named tap_stack.tf that contains variables, locals, data sources, resources, and outputs. Use only the AWS provider (and random if needed). Do not include provider or backend blocks. The code should be ready to apply after setting inputs.

Requirements:

- VPC across two AZs with two public and two private subnets, internet gateway, route tables, and NAT gateway(s).
- Enable VPC flow logs to CloudWatch Logs with a configurable retention period.
- Security groups: a web-tier SG that allows inbound 80 and 443 only from a list of CIDR blocks provided via variable allowed_cidrs; a DB SG that allows only the DB port from the web SG.
- RDS (PostgreSQL or MySQL): encrypted at rest, in private subnets, not publicly accessible, backup retention, maintenance window, deletion protection toggle, and optional multi‑AZ.
- S3 bucket for the app: block public access in all four ways, private ACL, default SSE with AES256, and a policy that denies non‑TLS access and anonymous requests.
- IAM: minimal role for VPC flow logs, plus a small example app role limited to reading a specific S3 prefix and writing to the log group.
- Tags on all resources: Project = “IaC - AWS Nova Model Breaking”, ManagedBy = “Terraform”, Environment.

Inputs to define:

- aws_region, project_name, environment, allowed_cidrs (list of CIDR strings), vpc_cidr.
- rds_engine, rds_engine_version, rds_instance_class, rds_allocated_storage, multi_az, deletion_protection.
- cw_log_retention_days.

Outputs:

- VPC ID; public and private subnet IDs; web and DB SG IDs; S3 bucket name; RDS endpoint; IAM role ARNs for flow logs and the app.

Notes:

- Keep everything in a single file named tap_stack.tf.
- Avoid placeholders; use sensible defaults.
- The configuration should pass terraform validate.
