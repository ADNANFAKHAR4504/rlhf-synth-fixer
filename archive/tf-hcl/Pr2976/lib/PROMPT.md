Here’s a clean, copy-pasteable **Claude Sonnet best-practices** prompt that converts the task to **Terraform** and asks for exactly **two files: `provider.tf` and `tap_stack.tf`**.

---

Role: You are Claude Sonnet. Produce production-grade Terraform code that implements the full stack below. Output ONLY two fenced code blocks, one for `provider.tf` and one for `tap_stack.tf`, with no extra commentary or markdown.

Goal:
Create a highly available, secure, auditable web application architecture on AWS using Terraform.

Hard constraints (must all be satisfied):

- Region: `us-west-2` only for regional resources. Use global services only where inherently global (e.g., CloudFront).
- High availability across multiple AZs.
- VPC with at least **2 public** and **2 private** subnets across distinct AZs.
- NAT Gateways in EACH public subnet to provide egress for private subnets.
- EC2 web tier: **Auto Scaling Group** behind an **Application Load Balancer** (ALB). Instances live in **private** subnets. HealthCheck via ALB. IMDSv2 required.
- Auto-scaling based on demand (target tracking on CPU or ALB requests).
- “Auto-recovery” via ASG replacement (do not rely on per-instance EC2 recovery alarms).
- **Amazon RDS** (MySQL or PostgreSQL) with KMS encryption, Multi-AZ primary recommended, and **at least one read replica** in a different AZ. Subnet group uses **private** subnets. SG allows from app tier only.
- **S3** bucket for logs with **versioning**, **lifecycle** rules, **SSE-KMS**, and **public access block**.
- **CloudFront** distribution in front of the ALB (viewer protocol: redirect to HTTPS; logging enabled to the logs bucket). To avoid cross-region ACM, use the **default CloudFront certificate** unless a parameterized ACM ARN in us-east-1 is explicitly provided.
- **AWS WAFv2 (REGIONAL)** attached to the **ALB**, using AWS managed rule groups (e.g., AWSManagedRulesCommonRuleSet + at least one more).
- Tag **every** taggable resource with `cost-center = "1234"`.
- Enable logging/monitoring everywhere applicable:
  - ALB access logs to S3 (ensure bucket policy for delivery principal).
  - CloudFront logs to S3 with prefix.
  - VPC Flow Logs to **CloudWatch Logs** (KMS-encrypted log group).
  - RDS Enhanced Monitoring or CloudWatch metrics/alarms.
  - CloudWatch alarms for ASG CPU, ALB 5XX, ALB target response time, RDS CPU/free storage, etc., all notifying an **SNS** topic.
  - Lambda logs to CloudWatch Logs.

- Encrypt **all data at rest** with **AWS KMS** (S3 SSE-KMS, RDS KMS, CloudTrail SSE-KMS, CloudWatch Logs KMS if supported). Where a service cannot use KMS for delivered logs, use the strongest available.
- **CloudTrail**: trail with management + (at least) S3/Lambda data events; log file validation on; SSE-KMS; deliver to logs bucket; CloudWatch Logs integration; optional SNS notifications.
- **AWS Config**: recorder + delivery channel to logs bucket (encrypted) and a baseline of managed rules (e.g., `cloudtrail-enabled`, `s3-bucket-server-side-encryption-enabled`, `encrypted-volumes`, `restricted-ssh`).
- **SNS**: a topic for alerts/changes; parameter for optional email subscription.
- **IAM least privilege** for EC2 (instance profile), Lambda, RDS monitoring, CloudTrail→CloudWatch, Config, and other integrations. Avoid `"*"`; scope by resource and condition.
- Include at least one sample **Lambda** function (Python 3.x) for a simple serverless task (e.g., processes SNS messages), with minimal handler, logging, and least-privilege role.
- Security Groups:
  - ALB: 80/443 from the internet (redirect 80→443).
  - Instances: allow from **ALB SG only**.
  - RDS: allow from **app tier SG only**.
  - Do **not** expose SSH/RDP publicly.

- Outputs must expose key endpoints/IDs (ALB DNS name, CloudFront domain, VPC ID, Subnet IDs, RDS endpoint, Logs bucket, SNS topic ARN, KMS key ARNs, etc.).
- Use SSM Parameter Store to resolve a current Amazon Linux 2023 AMI for `us-west-2`.
- No placeholders like `<YOUR_VALUE>`. Use **variables** with sensible defaults and `sensitive = true` where appropriate.
- Keep everything self-contained in **two files only**: `provider.tf` and `tap_stack.tf`.

Implementation details & guardrails:

- Terraform `required_version` ≥ 1.5; AWS provider `~> 5.0`. Include `hashicorp/archive` if you use `archive_file`.
- `provider.tf` must contain:
  - `terraform` block with `required_version` and `required_providers`.
  - `provider "aws"` pinned to `us-west-2`.
  - (Optional) **commented** S3 backend stanza with notes (default to local for immediate use).

- `tap_stack.tf` must contain **everything else**:
  - Variables (VPC CIDR, subnet CIDRs (lists), instance types, ASG sizes, DB params, lifecycle days, notification email, scaling targets, etc.). Mark secrets `sensitive = true`.
  - Locals with common tags including `cost-center = "1234"`.
  - **KMS keys** (e.g., one for logs, one for data) with least-privilege key policies and rotation enabled.
  - VPC, IGW, route tables, associations; **public** and **private** subnets across at least 2 AZs; **EIPs** and **NAT gateways** in each public subnet; private route tables with NAT.
  - Security groups for ALB, app, and DB tier as specified.
  - Launch Template (IMDSv2 required), ASG across private subnets, ALB in public subnets (HTTP→HTTPS redirect), target group, listeners, listener rules, **ALB access logging** to S3 with necessary bucket policy.
  - S3 logs bucket with versioning, lifecycle rules (transition/expiration), SSE-KMS, public access block, and bucket policies for CloudFront/ALB/CloudTrail/Config delivery principals and `aws:SecureTransport` enforcement.
  - **CloudFront** distribution with ALB origin, HTTPS-only, logging to S3; default CloudFront cert unless parameterized ACM in us-east-1 is provided.
  - **WAFv2 REGIONAL** WebACL associated to the ALB with AWS managed rule groups.
  - **RDS** primary (Multi-AZ recommended) + at least one read replica (different AZ), parameter group, subnet group, SG wiring, KMS at rest.
  - **CloudTrail** (management + S3/Lambda data events), SSE-KMS, log file validation, delivery to logs bucket, CloudWatch Logs integration.
  - **AWS Config** recorder + delivery channel to logs bucket and a baseline of managed rules.
  - **VPC Flow Logs** to a KMS-encrypted CloudWatch Log Group.
  - **CloudWatch alarms** (ASG CPU, ALB 5XX, ALB latency, RDS CPU/free storage) wired to **SNS** topic (with optional email subscription via variable).
  - **Lambda** (Python 3.x) sample with `archive_file` (or inline zip) and least-privilege IAM role/policy.
  - Data sources for SSM AMI and AZ selection with `data.aws_availability_zones`.
  - `outputs` for all key identifiers/endpoints.
  - Apply the common **tags** (including `cost-center = "1234"`) to all resources that support tags.

Formatting & delivery:

- Return EXACTLY two fenced code blocks:
  1. `hcl title="provider.tf"` …code…
  2. `hcl title="tap_stack.tf"` …code…

- No prose outside the two code blocks. No extra files. Ensure `terraform validate` passes.

Self-check before finalizing:

- All constraints satisfied (HA, multi-AZ, VPC w/ 2+ public & 2+ private, NAT per public subnet, ASG+ALB, RDS with read replica, S3 logs+KMS+lifecycle, CloudFront, WAF REGIONAL on ALB, CloudTrail+Config, SNS, Lambda, logging everywhere, least-privilege IAM, `cost-center="1234"` tags).
- No unresolved references; property names correct; resources depend correctly (e.g., NAT before routes).
- ALB/CloudFront logging permissions present; S3 policies deny insecure transport.
- Variables sensibly defaulted; sensitive values marked; outputs included.
