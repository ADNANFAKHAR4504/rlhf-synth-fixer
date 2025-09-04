You are an expert Terraform engineer. Generate **production-grade Terraform for AWS** that meets the spec below. **Return ONLY code files** (no extra prose):
1. `tap_stack.tf` (everything in one file)
2. `tests/terraform.int.test.ts` (offline output checks)
---
### Context
* `provider.tf` already exists and configures the AWS provider + optional S3 backend. It **reads `var.aws_region`**. **Do not** redefine provider/backends in `tap_stack.tf`.
* Region: **us-east-1 (N. Virginia)**. Declare `variable "aws_region"` in `tap_stack.tf` with default `"us-east-1"` so `provider.tf` can consume it.
* **One-file approach:** Put **all variables, locals, data sources, resources, IAM policies, and outputs** in `tap_stack.tf`. **No external modules**.
* Naming: `env-resource-type` (e.g., `prod-web-server`). Use `locals { env = "prod"; name_prefix = local.env }`.
* Tags: Every resource must include `Environment = "Prod"` and a common set via `local.common_tags` (include `Name` and `Owner`).
* Best practices: explicit CIDRs, least-privilege IAM, S3 block public access, enforce TLS and SSE-KMS, detailed EC2 monitoring.
---
### Required Infrastructure
**1) Network (VPC & Routing)**
* VPC CIDR: `10.0.0.0/16`
* Subnets:
  * **1 public**: `10.0.0.0/24`
  * **2 private**: `10.0.1.0/24`, `10.0.2.0/24` (distinct AZs via `data.aws_availability_zones`)
* IGW attached to VPC.
* **NAT Gateway** in the **public** subnet with an Elastic IP.
* Route tables:
  * Public RT → default route to IGW; associated to public subnet.
  * Private RT(s) → default route to NAT; associated to both private subnets.
**2) Bastion Host (public subnet)**
* Amazon Linux 2 EC2 in the **public** subnet.
* **Security Group:** Inbound **SSH 22** **only from** `var.allowed_ssh_cidr`; egress all.
* SSH key:
  * Support **creating a new key pair** when `var.bastion_key_name` and (optionally) a `var.bastion_ssh_public_key` are provided; otherwise allow using an existing key by name.
* **monitoring = true**; proper `Name` + common tags.
**3) Private EC2 (app host, private subnet)**
* Amazon Linux 2 EC2 in the **first private subnet**, **no public IP**.
* **monitoring = true**.
* **Security Group:** Inbound **SSH 22** from **bastion’s SG only**; egress all.
* IAM Role + Instance Profile for S3 access (see #4).
* Least-privilege policy: `s3:ListBucket` on the bucket and `s3:GetObject/PutObject/DeleteObject` on a restricted prefix (e.g., `app/*`).
* Basic `user_data` hardening (disable password auth, update packages; add commented CloudWatch agent hints).
**4) S3 (application data)**
* One **S3 bucket** for application data.
* **Versioning enabled**, **Block Public Access = true**.
* Default encryption: **SSE-KMS** with a **CMK created in this stack**.
* Bucket policy:
  * Deny unencrypted (non-TLS) requests.
  * Enforce bucket objects use the created **CMK**.
* Output bucket name & ARN.
**6) KMS**
* CMK for app data: alias **`alias/prod-app-kms`**.
* Key policies: root/admin allowed; S3 usage allowed; least-privilege principals for resources created here.
**7) Security Groups (summary)**
* Bastion SG: SSH from `var.allowed_ssh_cidr` only.
* Private EC2 SG: SSH from **Bastion SG** only; no public ingress anywhere else.
* Egress open as needed.
**8) IAM (EC2 → S3)**
* Role (trust: EC2), inline/attached least-privilege policy to the app bucket prefix.
* Instance Profile attached to the private EC2.
* Output role and instance profile ARNs.
**9) Monitoring & Compliance**
* `monitoring = true` on both EC2s.
* S3 at-rest encryption via CMKs; TLS enforced in bucket policies.
* All resources tagged with `Environment = "Prod"` + `local.common_tags`.
---
### Variables, Locals, Outputs (in `tap_stack.tf`)
**Variables** (type, description, sane defaults):
* `aws_region` (default `"us-east-1"`) — consumed by `provider.tf`.
* `vpc_cidr` (default `"10.0.0.0/16"`).
* `public_subnet_cidr` (default `"10.0.0.0/24"`).
* `private_subnet1_cidr` (default `"10.0.1.0/24"`).
* `private_subnet2_cidr` (default `"10.0.2.0/24"`).
* `allowed_ssh_cidr` (no default; document example like `"203.0.113.10/32"`).
* `bastion_key_name` (optional; supports create/use).
* `bastion_ssh_public_key` (optional; for new key pair).
* `owner` (default `"platform-team"`; used in tags).
**Locals**
* `env = "prod"`, `name_prefix = local.env`,
* `common_tags = { Environment = "Prod", Owner = var.owner }`.
**Outputs**
* `vpc_id`
* `public_subnet_id`
* `private_subnet_ids`
* `igw_id`
* `nat_gateway_id`
* `bastion_instance_id`
* `bastion_public_ip`
* `private_instance_id`
* `private_instance_profile_arn`
* `private_instance_role_arn`
* `s3_app_bucket_name`
* `s3_app_bucket_arn`
* `kms_app_key_arn`