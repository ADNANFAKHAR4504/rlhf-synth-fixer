# USER PROMPT — Generate `tap_stack.tf` (Single file) for a secure, multi-region, production-grade deployment on AWS

You are an expert Terraform engineer. Generate a **single Terraform file named `tap_stack.tf`** that contains **everything** needed (variables, locals, resources, data sources, and outputs) to deploy a secure, highly available application stack that **meets every requirement below**. **Do not create or reference any external modules** and **do not modify `provider.tf`** (it already exists). Your code must be **idempotent**, **lintable**, and follow **Terraform + AWS best practices**.

---

## Critical context

- I already have a `provider.tf` where the AWS provider is configured and it **uses a variable `aws_region`**. You must **declare** `variable "aws_region"` in `tap_stack.tf` so `provider.tf` can read it.  
- The solution must **deploy across two AWS regions** for redundancy: **`us-east-1`** and **`us-west-2`**.
- Assume `provider.tf` defines the default provider and also (optionally) **two aliased providers** named `aws.us_east_1` and `aws.us_west_2`.  
  - **In your resources**, explicitly set `provider = aws.us_east_1` or `provider = aws.us_west_2` to place resources in the intended region.  
  - If you reference the default provider, do so **only when appropriate** and still allow full operation when aliases are present.

> If an alias is missing in `provider.tf`, your file should still be valid Terraform; the only requirement here is that **every resource in `tap_stack.tf` clearly indicates the target region via `provider =`** so the multi-region intent is unambiguous.

---

## Functional requirements (must all be implemented)

1. **Multi-region HA**: Deploy the full stack **in both `us-east-1` and `us-west-2`**.
2. **Global tagging**: **All resources** must include tags with at least `Environment = "Production"` (allow additional common tags via a `var.common_tags` map merged everywhere).
3. **S3 encryption**: All S3 buckets must enable **SSE-KMS** with **customer-managed KMS keys**.  
   - Block public access, enable versioning, and add a minimal lifecycle rule (e.g., noncurrent versions).
4. **Least privilege IAM**: Create IAM roles/policies with **only** the permissions required. No wildcards unless strictly necessary. Inline policies are acceptable if minimal and explicit.
5. **Security groups**: **Default inbound = deny all** (no 0.0.0.0/0 unless explicitly required). Open **only necessary ports** between tiers (e.g., ALB → EC2, specific DB port from app subnets, etc.). Restrict **egress** to what’s required when possible.
6. **RDS backups**: RDS instances must have **automated backups** with **`backup_retention_period >= 7`**, **storage encryption**, **deletion_protection = true**, and a **separate subnet group** in private subnets.
7. **Lambda env vars via KMS**: All Lambda functions must define environment variables and have them **encrypted by KMS** (use a CMK and `kms_key_arn` in the function).
8. **EC2 instance profiles**: EC2 access to S3 must be via an **instance profile / role** (no static credentials, no secrets in user data).
9. **CloudWatch logs for Lambda**: Create (or manage) dedicated **CloudWatch Log Groups** for each Lambda with a sensible retention (e.g., 14–30 days).
10. **VPC Flow Logs**: Enable Flow Logs for **all VPCs** capturing **all traffic**, delivered to **CloudWatch Logs** (encrypted with KMS). Create the required IAM role/policy for VPC Flow Logs.

---

## Architecture scope per region (implement in **both** regions)

- **Networking**
  - 1 VPC (CIDR via variables) with **public and private subnets across at least 2 AZs**.
  - **NAT Gateway(s)** for private subnets egress (cost-aware option to toggle 1 per region vs 1 per AZ).
  - Route tables, IGW, NATGW, EIPs, and associations.
  - **VPC Flow Logs** → CloudWatch Logs (KMS-encrypted).
- **Compute**
  - Example **EC2** (small, Linux) in **private** subnets behind an **ALB** in public subnets.
  - ALB Target Group + Listener (80/443). If you expose 443, include an ACM certificate placeholder input variable and wire it (no need to create the cert).
  - **EC2 instance profile** with **least-privilege** access to the region’s application S3 bucket.
  - Optionally include a **bastion** toggle (off by default). If enabled, strictly locked down by CIDR.
- **Data**
  - **RDS** (engine via variable, default postgres or mysql). Private subnets only. Storage encrypted, backups retained ≥ 7 days, deletion protection on.  
  - **DB credentials** via sensitive variables; **do not** hardcode passwords.
- **Storage**
  - One **S3 bucket** per region for app data or artifacts (unique names). **SSE-KMS** using a **per-region CMK** (you create the keys). Block public access, versioning on, lifecycle noncurrent cleanup.
- **Serverless**
  - One **Lambda** per region (simple placeholder zip from `filename` variable).  
    - Environment variables (e.g., `APP_ENV`, `BUCKET_NAME`) **encrypted with KMS**.  
    - CloudWatch Log Group with retention; Lambda permission to write logs.
- **Observability & IAM**
  - **CloudWatch Log Groups** for Lambda + VPC Flow Logs (KMS-encrypted).  
  - **IAM roles/policies**:  
    - EC2 role → scoped S3 access (bucket ARN-scoped `GetObject/PutObject/ListBucket`).  
    - Lambda role → CloudWatch Logs write + scoped S3 (if needed).  
    - VPC Flow Logs service role → logs:CreateLogStream/PutLogEvents on designated log group.  
    - KMS key policies that allow these principals to use encryption appropriately (strict principals, no `*` on resources where avoidable).

---

## Security hardening defaults

- **No plaintext secrets** in user data or env. Use variables marked `sensitive = true`.  
- **Block public access** on all S3 buckets; **no ACLs** (use bucket policies).  
- **Restrictive SGs**:  
  - ALB ingress 80/443 from `var.allowed_ingress_cidrs` only.  
  - EC2 ingress only from ALB SG on app port (e.g., 8080) or as variable.  
  - RDS ingress only from app subnets / app SG on DB port.  
- **KMS CMKs**: separate per region, key rotation enabled, alias names configurable.

---

## File output requirements

Produce **one code block** containing **only** the full contents of `tap_stack.tf`:
- **At the top**: `terraform` block version constraint (e.g., `>= 1.7`) and AWS provider constraints (but do **not** redefine providers; keep constraints only if needed).  
- **`variable` declarations** for everything the stack needs, with **sensible defaults** and `description`, `type`, `sensitive` where applicable:
  - `aws_region` (string) — required by existing `provider.tf`.
  - `app_name`, `common_tags` (map(string), merged everywhere; must include `Environment = "Production"` by default).  
  - VPC + subnets: `vpc_cidr`, `public_subnet_cidrs`, `private_subnet_cidrs` **per region** (maps keyed by AZ or a list).  
  - `allowed_ingress_cidrs` (list of CIDRs).  
  - RDS: `db_engine`, `db_engine_version`, `db_instance_class`, `db_username` (sensitive false), `db_password` (sensitive true), `backup_retention_days` (default ≥ 7).  
  - S3: `s3_bucket_name_prefix`.  
  - Lambda: `lambda_zip_path`, `lambda_handler`, `lambda_runtime`.  
  - ALB: `enable_https`, `certificate_arn` (optional), `app_port`.  
  - NAT toggle: `one_nat_gateway_per_region` (bool).  
  - Log retention days, etc.
- **`locals`** section to build common tag maps and name conventions per region (e.g., `${var.app_name}-${region}`).
- **Resources**: everything defined **twice** (once per region) or via iteration across a `local.regions = ["us-east-1","us-west-2"]` with **per-region provider selection**. If you iterate, show a clean pattern that still sets the **`provider =`** correctly (e.g., using `for_each` with two module-like resource groups or conditional provider assignment blocks).
- **Outputs** for key artifacts **per region**: VPC IDs, subnet IDs, ALB DNS name, EC2 role name, S3 bucket names, KMS key ARNs, RDS endpoint, Lambda ARN, CloudWatch log group names, Flow Log IDs.

> **Important**: Do **not** reference external modules or files (other than the existing `provider.tf`). Everything must be in `tap_stack.tf`.

---

## Acceptance checks (bake these into comments near the end)

- All resources carry `merge(var.common_tags, { Environment = "Production" })`.  
- S3 buckets: SSE-KMS enabled with **CMK you created**, versioning on, block public access, lifecycle present.  
- IAM policies are **scoped to resource ARNs** (no broad `*` unless required for logs delivery).  
- SGs deny by default; only necessary ingress allowed (ALB 80/443 from `allowed_ingress_cidrs`; app from ALB SG; DB from app SG).  
- RDS: encrypted + backups ≥ 7 days + deletion protection.  
- Lambda: env vars present and encrypted by KMS; log group managed with retention; execution role has minimal permissions.  
- EC2 accesses S3 **only** via instance profile.  
- VPC Flow Logs enabled to KMS-encrypted CloudWatch log group with proper role.  
- Two fully functional, logically identical stacks in **`us-east-1`** and **`us-west-2`**.

---

## Style & quality

- Use clear naming, comments, and **explicit `provider =`** on every regional resource.  
- Prefer `for_each` and maps where it reduces duplication **without** sacrificing clarity.  
- Validate types; mark secrets `sensitive = true`.  
- Pass `depends_on` only where necessary (avoid overuse).  
- Ensure `terraform validate` and `tflint` would pass (assume standard rules).

---

## Deliverable

Return **one fenced Terraform code block** containing the **entire `tap_stack.tf`** file content. No extra prose outside the code block.