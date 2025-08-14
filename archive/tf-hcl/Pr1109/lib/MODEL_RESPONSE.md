# Model Response Spec — AWS Terraform (Single-File `main.tf` + Provider Alias Snippet)

## Objective
Generate **one self-contained Terraform file `main.tf`** that provisions a fresh AWS stack for **dev, staging, prod** with environment-based feature toggles. A **separate** `provider.tf` already exists and contains the AWS provider and an **S3 backend with DynamoDB state locking**. Do **not** define any provider or backend in `main.tf`. Also provide a short **provider alias snippet** (changes to `provider.tf`) if multi-region aliases are needed.

## Hard Requirements
**File layout**
- Output **exactly two code blocks**:
  1) `main.tf`: includes **all** variables, locals, data sources, resources, and outputs.
  2) A concise **provider alias snippet** for `provider.tf` (only if/when aliases are needed).
- Do **not** reference external modules. Use only native `aws_*` resources.
- Do **not** include a backend block or provider config inside `main.tf`.

**Variables (declare in `main.tf`)**
- `project` (string; default "sample")
- `environment` (string; must be one of `dev|staging|prod`; include validation)
- `aws_region` (string; used by existing `provider.tf`)
- `vpc_cidr` (default `10.0.0.0/16`)
- `public_subnet_cidrs` (2 CIDRs; default)
- `private_subnet_cidrs` (2 CIDRs; default)
- `instance_type` (default `t3.micro`)
- `bucket_name` (optional override; if empty, derive name)
- `allowed_ssh_cidrs` (list(string); default `[]`)

**Environment toggles (derive via `locals`)**
- `enable_nat` = environment != `dev` (create EIP + NAT + private default route only in staging/prod)
- `enable_detailed_monitoring` = environment != `dev` (EC2 CloudWatch detailed monitoring only in staging/prod)
- `instance_in_public_subnet` = environment == `dev` (public subnet + public IP in dev; private subnet + no public IP in staging/prod)

**Networking**
- VPC `/16` with DNS hostnames/support enabled
- 2 public + 2 private subnets spread across the first two AZs
- Internet Gateway + public route table with default route
- Private route table
- **Conditional NAT**: EIP(domain `vpc`) + NAT Gateway (in first public subnet) + private default route to NAT only when `enable_nat = true`
- Route table associations for all subnets

**Security**
- One Security Group for the EC2 instance:
  - Egress: allow all
  - **Ingress SSH (22)**: create rule(s) **only** when `allowed_ssh_cidrs` is non-empty; one rule per CIDR
- No wide-open default SSH. If the list is empty, there must be **no** SSH ingress rule.

**Compute**
- Single EC2 instance:
  - AMI: Amazon Linux 2023 (most recent; owner `amazon`; name filter `al2023-ami-*-x86_64`)
  - Type: `var.instance_type`
  - Subnet: public[0] in dev; private[0] otherwise
  - `associate_public_ip_address` true in dev, false otherwise
  - `monitoring` per `enable_detailed_monitoring`
  - Depend on routing basics (public default route + associations; OK to include private route deps)

**S3**
- One S3 bucket:
  - Name: `var.bucket_name` if non-empty; else derive from `${project}-${environment}-app-bucket` (lowercase; replace `_` with `-` if needed)
  - Public access block: all four flags true
  - Default SSE: AES256
  - **Versioning**: `Enabled` in staging/prod; `Suspended` in dev

**Tags**
- At minimum: `Name`, `Project`, `Environment` on all resources

**Outputs**
- `vpc_id`
- `public_subnet_ids` (list)
- `private_subnet_ids` (list)
- `security_group_id`
- `instance_id`
- `instance_private_ip`
- `instance_public_ip` (null in staging/prod)
- `s3_bucket_name`
- `nat_gateway_id` (null in dev)

**Style & Quality**
- HCL must be `terraform fmt`-clean.
- Clear, concise comments.
- No extraneous prose between/around the two required code blocks.

## Provider Aliases (second code block)
- Show how to add optional provider **aliases** (e.g., `aws.staging`, `aws.prod`) in `provider.tf` if multi-region providers are needed.
- Show how a resource in `main.tf` **would** reference `provider = aws.staging` (commented example only).

## Evaluation Rubric (0–5)
- **5**: Fully meets requirements; correct toggles; safe security defaults; clean outputs; no provider/backend leakage; clean, maintainable HCL.
- **4**: Minor nits (naming/comments/deps) but functionally correct and complete.
- **3**: Works but misses 1–2 spec items (e.g., versioning toggle, SSH rule logic, or missing output).
- **2**: Multiple spec gaps or unsafe defaults (e.g., open SSH by default, NAT created in dev).
- **1**: Largely off-spec (providers in `main.tf`, external modules, missing toggles).
- **0**: Non-functional or ignores the single-file constraint.

## Quick Checks (what graders verify)
- No `provider`/`backend` blocks in `main.tf`.
- `environment` validation present.
- NAT/EIP/route only when not `dev`.
- EC2: public subnet + public IP in dev; private subnet + no public IP otherwise.
- Monitoring true in staging/prod only.
- S3 versioning Enabled in staging/prod, Suspended in dev.
- SSH ingress created only if `allowed_ssh_cidrs` non-empty.
- All required outputs exist and are correct types/values.
