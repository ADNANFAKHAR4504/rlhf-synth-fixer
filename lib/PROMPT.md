# Prompt: Single-File Secure AWS Infra with Terraform (`tap_stack.tf`)

**Role (System)**  
You are an expert DevOps engineer specializing in Terraform and AWS security best practices. Produce **syntactically-valid Terraform HCL** that can be applied as-is in a new AWS account with minimal edits.

---

## What to Produce

Deliver a **single Terraform file named `tap_stack.tf`** that:

1. **Contains everything**: all variables (with types, sensible defaults, and descriptions), locals, data sources, resources, and outputs in this one file.  
2. **Does *not* define provider/backend config** (a separate `provider.tf` already exists).  
3. **Declares** the variable `aws_region` (used by my existing `provider.tf`) and uses it where appropriate in naming and resource settings.  
4. **Creates brand-new resources** (no references to pre-existing infra or third-party modules).  
5. **Implements the exact security controls** listed below using AWS/Terraform best practices.  
6. **Includes an explanation section after the code** mapping each requirement to the corresponding resource blocks (use concise Markdown headings and bullet points).

---

## Project Context

- **projectName**: `IaC - AWS Nova Model Breaking`  
- Greenfield stack: stand up everything needed **from scratch** in a secure, minimal-but-real layout.

---

## Security Requirements (Non-Negotiable)

1. **S3 Privacy**: All S3 buckets must **block public access** (no public read/write).  
   - Use `aws_s3_bucket_public_access_block` with all four flags set to `true`.  
   - Use **private ACL** and **bucket policy** to deny any public access.  
   - Enforce **TLS-only** via policy (`aws:SecureTransport`), and enable **default SSE** (SSE-S3).

2. **IAM Least Privilege**:  
   - Create one or two **example IAM roles** (e.g., `app_role`) with **minimal, scoped policies**.  
   - Separate **assume role policy** (principals limited to specific services) and **inline policies** with least-privilege statements.

3. **RDS Encryption at Rest**:  
   - Create a **PostgreSQL** or **MySQL** RDS instance with `storage_encrypted = true`.  
   - Place RDS in **private subnets** via a **DB subnet group**; **no public accessibility**.  
   - Set secure defaults: backup retention, deletion protection, parameterized instance class, multi-AZ as a toggle.

4. **VPC Flow Logs**:  
   - Create a new **VPC** and **enable VPC Flow Logs** to **CloudWatch Logs**.  
   - Ensure every VPC **defined in this file** has flow logs enabled.

5. **Strict Security Groups**:  
   - Create a **web-tier security group** that **only allows inbound 80 and 443** from **specific IP CIDR ranges** provided via a `variable "allowed_cidrs"`.  
   - Create a **DB security group** that **only allows the DB port** from the **web-tier SG**.

---

## Required Architecture (Minimal but Real)

- **VPC** with:
  - 2 public subnets and 2 private subnets across two AZs.  
  - Internet Gateway, NAT Gateway(s), route tables.  
- **RDS** in private subnets.  
- At least one **S3 bucket**, fully private with SSE.  
- **IAM roles/policies** for VPC Flow Logs and app.  
- **Tags**: `Project = "IaC - AWS Nova Model Breaking"`, `ManagedBy = "Terraform"`, `Environment`.

---

## Implementation Details & Constraints

- Use only `hashicorp/aws` and optionally `hashicorp/random`.  
- Declare variable `aws_region`.  
- Provide **sane defaults** (e.g., `t3.micro` for RDS).  
- Avoid placeholders.  
- Use `for_each`/`dynamic` blocks where appropriate.  
- Use CloudWatch with log retention.  
- Outputs should include: VPC ID, subnets, SGs, bucket name, RDS endpoint, IAM role ARNs.

---

## Inputs to Define (at minimum)

- `variable "aws_region"` (string).  
- `variable "project_name"` (default: `"iac-nova"`).  
- `variable "allowed_cidrs"` (list(string)): no default.  
- `variable "environment"` (default: `"dev"`).  
- `variable "multi_az"` (bool, default: `false`).  
- `variable "deletion_protection"` (bool, default: `true`).  
- `variable "vpc_cidr"` (default: `"10.0.0.0/16"`).  
- `variable "nat_per_az"` (bool, default: `false`).  
- `variable "rds_engine"` (default: `"postgres"`), `rds_engine_version`, `rds_instance_class`, `rds_allocated_storage`.  
- `variable "cw_log_retention_days"` (number, default: `30`).

---

## Acceptance Criteria

- ✅ S3 public access blocked, private ACL, SSE, TLS-only.  
- ✅ IAM least-privilege policies.  
- ✅ RDS encrypted, private, SG restricted.  
- ✅ VPC flow logs enabled.  
- ✅ Security groups restricted to ports 80/443 from CIDRs.  
- ✅ Single file (`tap_stack.tf`).  
- ✅ `terraform validate` passes.  

---

## Output Format

1. A **single fenced code block** with the full contents of `tap_stack.tf`.  
2. A section **“Explanation & Mapping”** mapping requirements to resources.  
3. No extra commentary outside those sections.

---

## Hints

- Use `random_id` for S3 uniqueness.  
- Use `aws_s3_bucket_ownership_controls`.  
- Use `for_each` for SG ingress rules.  
- Use `data "aws_availability_zones"`.  
- Keep IAM policies scoped.

---
