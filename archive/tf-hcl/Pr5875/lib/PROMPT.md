# Cloud App Infra — Single-File Terraform (`tap_stack.tf`)

## What we’re building
A practical, production-lean stack in one Terraform file. CI injects provders and the backend — **do not add any `provider` or backend blocks**. The stack is region-aware (discover the active region via data sources) and easy to create/destroy for tests.

Core pieces you must have (and wire together):

- **KMS (CMKs)**: one general-purpose key and one logs key (both with rotation).
- **Networking (VPC)**: 2 public + 2 private subnets, IGW, single NAT GW, proper routes.
- **SSM VPC interfae endpoints**: `ssm`, `ssmmessages`, `ec2messages`.
- **EC2 (private app tier via ASG)**: Launch Template + ASG (desired=3) behind an **ALB (HTTP)**. IMDSv2 required.
- **Public EC2 (web probe)**: a small instance in a public subnet for reachability checks.
- **S3 uploads bucket**: private, **versioned**, **SSE-KMS**, **PAB** on, TLS-only policy, ownership controls; **ObjectCreated** events → Lambda.
- **Lambda (2 functions)**:
  - `on_upload` handler for S3 events (Python 3.12).
  - `heartbeat` writer (Python 3.12) that writes to S3 and uses SSM for DB password.
  - Explicit KMS grant to Lambda role for the CMK.
- **API Gateway (HTTP API)**: IAM-signed proxy to the ALB for `/` and `/ec2`.
- **RDS (Postgres)**: private subnets, **SSE-KMS**, **not publicly accessible**; master password stored in **SSM SecureString**.
- **CloudFront**: default certificate, ALB as origin (http-only origin policy).
- **Bastion host**: small on-demand instance in public subnet with restrictive SG (administration entry point).
- **Patch Manager (SSM)**: baseline + association to keep instances patched.
- **CloudWatch Logs**: app log group encrypted with the logs CMK.
- **CloudWatch Alarm (CPU)**: ASG CPU > threshold alarm publishing to an SNS topic.
- **AWS Backup**: vault, daily plan, tag-based selection (covers EBS volumes, RDS, etc.).
- **SNS topic**: alarms topic.
- **Route53** (optional): ALIAS A record to ALB when `domain_name` and `hosted_zone_id` are provided.

Everything lives in **one file: `tap_stack.tf`**.

---

## Guardrails
- **Single file** only, no modules, no backends/providers in code.
- **Region-aware**: use `data.aws_region.current` for region strings; do not hardcode.
- **Secure defaults**:
  - IMDSv2 required on all instances.
  - S3 PAB on; TLS-only bucket policy; SSE-KMS where applicable.
  - Least-privilege IAM; explicit KMS grants where needed.
- **Destroy-friendly**: don’t use `prevent_destroy`. Buckets use `force_destroy = true` for CI.
- **Consistent tagging** via `locals.base_tags` (must include `Project`, `Environment`, `Owner`, `CostCenter` and a small do-not-nuke tag for safety).

---

## What to provision (checklist)

### Data & locals
- `data.aws_caller_identity.current`
- `data.aws_region.current`
- `data.aws_availability_zones.use2` (name aligns with our alias but must derive region dynamically)
- Determinstic names (VPC, subnets, buckets) including the `account_id`
- `locals.base_tags` with `Project`, `Environment`, `Owner`, `CostCenter`

### KMS
- Primary CMK (`enable_key_rotation = true`) + alias
- Logs CMK with policy permitting the **regional CloudWatch Logs service principal** and account root
- Explicit **KMS grant** for Lambda role on the primary CMK

### Networking (VPC)
- VPC with DNS features on
- 2 public + 2 private subnets across AZs
- IGW, one NAT GW in a public subnet, route tables:
  - Public 0.0.0.0/0 → IGW
  - Private 0.0.0.0/0 → NAT
- Security groups:
  - ALB SG (ingress 80 only for tests; egress all)
  - App SG (ingress 80 **from ALB SG** only; egress all)
  - RDS SG (ingress 5432 **from App SG** only; egress all)
  - Web SG (ingress 80 from world for probe; egress all)
  - VPCe SG for SSM endpoints (443 from VPC CIDR)
  - Bastion SG (restrict SSH to a small, overridable CIDR)

### SSM VPC endpoints
- Interface endpoints for `ssm`, `ssmmessages`, `ec2messages` with private DNS enabled

### Compute (EC2 + ASG + ALB)
- **Launch Template** with:
  - AL2023 AMI via SSM public parameter
  - IMDSv2 enforced
  - Instance profile with:
    - `AmazonSSMManagedInstanceCore`
    - CloudWatch Agent policy
  - User-data that sets up a minimal HTTP page (`/alb.html`), and reads env
- **ASG**: desired=3, health check type ELB, spread across private subnets
- **ALB**: HTTP listener → Target Group (port 80) with health check on `/alb.html`
- **Public web instance** in a public subnet for probe tests (IMDSv2 enforced)

### Lambda
- Role with trust to `lambda.amazonaws.com`
- Inline/attached policies for:
  - CloudWatch Logs basic execution
  - S3 list/get/put on uploads bucket
  - KMS encrypt/decrypt/generate data key on primary CMK
- Two functions:
  - `on_upload` (prints S3 event)
  - `heartbeat` (writes JSON to `s3://uploads/heartbeats/…`, uses SSM param to read DB password)
- S3 → Lambda notification (ObjectCreated) and `aws_lambda_permission` to allow S3 invoke
- Warmup `data.aws_lambda_invocation` for both functions

### S3 (uploads bucket)
- Bucket with:
  - Ownership controls: `BucketOwnerEnforced`
  - Versioning enabled
  - SSE-KMS with primary CMK
  - Public Access Block (all four true)
  - TLS-only policy (`DenyInsecureTransport`)
- Bucket policy grants Lambda role bucket permissions

### API Gateway (HTTP API)
- HTTP API
- `GET /` and `GET /ec2` routes with **AWS_IAM** auth
- Proxy integration to ALB DNS
- `$default` stage auto-deploy

### RDS (Postgres)
- DB subnet group (private subnets)
- Random master password stored in **SSM SecureString** (encrypted with CMK)
- DB instance:
  - Engine `postgres`, KMS-encrypted, not public
  - SG allows 5432 only from App SG
  - Backups enabled (retention, window)
- Outputs: endpoint, port, user, SSM param name for password

### CloudFront
- Distribution with ALB origin
- Origin protocol policy `http-only`
- Default certificate; viewer protocol policy allow-all (kept simple for tests)

### Bastion host
- Small public instance with:
  - Restricted SSH ingress (variable-driven CIDR)
  - SSM agent, IMDSv2 enforced
  - No direct access to private resources beyond what admins need (kept minimal)

### Patch Manager (SSM)
- Patch baseline (Linux)
- Association targeting EC2 instances via tag (e.g., `PatchGroup=linux`)
- Schedule for scan/install

### CloudWatch alarm + SNS
- SNS topic for alarms
- ASG CPU > threshold alarm publishes to the SNS topic

### AWS Backup
- Backup vault
- Daily backup plan (`cron(0 2 * * ? *)`, 30 days retention)
- Tag-based selection (e.g., `Backup=true`) covering EC2 volumes, RDS, etc.

### Route53 (optional)
- ALIAS A record to ALB when `domain_name` and `hosted_zone_id` are provided

---

## Variables
At minimum:
- `env` (default `dev`)
- `owner` (default `platform-team`)
- `cost_center` (default `cc-0001`)
- `domain_name` (default `""`)
- `hosted_zone_id` (default `""`)
- `web_instance_type` (default `t3.micro`)
- `rds_engine` (default `postgres`)
- `rds_engine_version` (default `""`, optional)
- `rds_instance_class` (default `db.t3.micro`)
- `rds_allocated_storage` (default `20`)
- `s3_upload_bucket_name` (optional override, else deterministic)
- `s3_upload_prefix` (optional)
- `use2_cidr` (default `10.10.0.0/16`) — still used for subnet math; region name is data-driven

Add a variable for bastion SSH CIDR (e.g., `bastion_ssh_cidr`, default `0.0.0.0/32` to force explicit override).

---

## Security defaults
- IMDSv2 required on all instances and launch templates
- S3 PAB + TLS-only bucket policy
- SSE-KMS for bucket and RDS
- KMS rotation enabled
- RDS not public, SG boundaries enforced
- Least-privilege IAM for Lambda/EC2; explicit **KMS grant** for Lambda
- CloudWatch Logs encrypted with logs CMK

---

## Naming
Use `locals.name.use2 = "cloud-setup-${var.env}-use2"` as a base and suffix resources clearly:
- `...-vpc`, `...-public-a`, `...-private-a`, `...-alb`, `...-tg`, `...-asg`, `...-db`, `...-uploads`, `...-logs-kms`, etc.
Include `account_id` in bucket names to avoid collisions.

---

## Required outputs (for tests)
- **VPC/Subnets**: `use2_vpc_id`, `use2_public_subnet_ids`, `use2_private_subnet_ids`, `use2_cidr`
- **KMS**: `use2_kms_key_arn`
- **S3**: `upload_bucket_name` (plus aliases `app_bucket_name`)
- **Lambda**: `lambda_on_upload_name`, `lambda_on_upload_arn`, `lambda_heartbeat_name`, `lambda_function_name`
- **ALB/API/CF**: `alb_arn`, `alb_dns_name`, `alb_target_group_arn`, `api_invoke_url`, `cloudfront_domain_name`
- **RDS**: `rds_endpoint`, `rds_port`, `rds_password_param_name`, `rds_username`
- **IAM**: `app_role_name`, `app_role_arn`
- **SNS/Logs**: `sns_alarms_topic_arn`, `cw_log_group_use2`
- **Aliases for tests**: `vpc_id`, `public_subnet_ids`, `private_subnet_ids`, `security_group_web_id`, `trail_bucket_name` (omit if not using CloudTrail)

---

## What success looks like

### Static/unit checks
- No provider/backend blocks
- Tags exist in `locals.base_tags` with required keys
- Region strings come from `data.aws_region.current`
- S3 uploads bucket: versioned, SSE-KMS, PAB, TLS-only, ownership controls
- RDS: encrypted, private, password in SSM SecureString
- ASG + LT + TG + ALB wired; IMDSv2 enforced
- SSM VPC endpoints exist
- Lambda + S3 event + permissions wired; KMS grant present
- CloudFront points to ALB
- Bastion host & Patch Manager association present
- CloudWatch alarm referencing the ASG publishes to SNS
- Backup vault/plan/selection present
- All required outputs present

### Integration/E2E expectations
- **ALB** serves `/alb.html` over HTTP
- **EC2 (private)** can curl ALB (egress/NAT works)
- **IMDSv2** required on instances
- **S3 → Lambda**: uploading a test object produces log evidence
- **KMS**: primary CMK exists, rotation enabled
- **RDS**: private + encrypted, CRUD from an EC2 via SSM/psql works; not reachable from the Internet
- **HTTP API → ALB** works with IAM-signed request
- **ASG Target Group** has at least one healthy target
- **Bastion** reachable only from allowed CIDR (configuration validated)
- **Patch Manager** association exists for instances
- **Backup** artifacts (jobs/recovery points) appear after the window (tests may only validate configuration and recent job listing)

---

**Delivery**: a single `tap_stack.tf` implementing everything above with secure defaults and clean tagging. The config must be region-aware, environment-agnostic, and friendly to CI unit/E2E tests.
