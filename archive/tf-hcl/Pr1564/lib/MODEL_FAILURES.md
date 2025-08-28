# Model Failures (Prompt vs Model Response)

- Single-file validity and deployability
  - Output is truncated/incomplete HCL (file ends mid-resource), so it cannot pass `terraform validate`.
  - Violates single-file guardrail by referencing external `user_data.sh` via `templatefile(...)`. A later inline `locals.user_data` exists but is not wired into the launch template.

- Missing required services/components from the prompt
  - AWS Config: no configuration recorder, delivery channel (S3 + KMS), or baseline config rules.
  - CloudWatch Alarms + SNS: no SNS topic/subscription and no alarms (e.g., unauthorized API calls, ALB/API errors).
  - EC2 not actually launched: no Auto Scaling Group or `aws_instance` using the launch template; thus no instances in private subnets.
  - RDS: no DB subnet group, parameter group, instance, SG wiring, encryption, or multi-AZ configuration.
  - Outputs: none of the required outputs (VPC/subnets, ALB DNS, RDS endpoint, S3 names, KMS ARNs, etc.) are defined.

- Security and compliance gaps
  - S3 hygiene incomplete: `aws_s3_bucket_logging` missing for the Config bucket; log bucket itself has no logging strategy (prompt requires logging for all buckets to a dedicated log bucket).
  - ALB access logging policy: S3 log bucket lacks a bucket policy permitting ALB log delivery (`logdelivery.elasticloadbalancing.amazonaws.com`) with `bucket-owner-full-control`.
  - Data retention: only VPC Flow Logs log group has retention; no broader retention strategy for other CloudWatch logs or services referenced in the prompt.

- Networking and availability
  - Multi-AZ only partially implemented: subnets created in 2 AZs, but there is no ASG spanning AZs and no RDS multi-AZ.
  - Target registration: ALB target group has no registered targets (missing ASG or attachments), so the ALB would be unhealthy.

- IAM and least privilege
  - Some IAM is present (Flow Logs, EC2 role), but there are no roles/policies for other components mentioned (e.g., alarms/metrics, Config) and no verification of least-privilege scope across services.

- API Gateway logging
  - No API Gateway is created. While not strictly required, the prompt mandates logging if API Gateway is included; current response does not address this either way.

- KMS and encryption
  - KMS keys created and used for S3/EBS/CloudWatch Logs; RDS encryption usage cannot be validated because RDS is missing.

- S3 lifecycle/provider constraints
  - Lifecycle rules do not include the required `filter { prefix = "" }` or `prefix` in `aws_s3_bucket_lifecycle_configuration`, which can cause provider validation errors.

- Tagging and cost hygiene
  - Inconsistent tagging: many resources have tags, but tags are not applied to all taggable resources.
  - Cost management enablement is incomplete: `cost_allocation_tag_keys` is declared but not used/activated; no CUR/billing constructs or usage-tracking logs where feasible.

- Variable usage and defaults
  - Unused variables: `desired_capacity`, `min_size`, `max_size`, `alarm_email`, `cost_allocation_tag_keys` are declared but not used.
  - `rds_engine_version` is defaulted to a specific version ("15.4") which may be invalid across regions; without RDS resources this cannot be validated and risks plan/apply failures.

- Acceptance criteria misses
  - Does not meet: single-file deployable HCL, required services (Config, RDS, alarms/SNS), multi-AZ where applicable, S3 hygiene for all buckets, comprehensive outputs, consistent tagging, and idempotent/valid configuration.
