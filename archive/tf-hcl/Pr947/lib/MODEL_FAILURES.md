### Model response failures relative to `lib/PROMPT.md`

- **Output format not satisfied**:
  - Expected a single Terraform HCL file named `tap_stack.tf` inside one fenced code block, followed by a section titled "Explanation & Mapping" only. The response is CDKTF (Python) code, not Terraform HCL, and the explanation section title differs and is incomplete.
  - Provider/backend config must not be defined in the produced file; the response initializes an AWS provider in code.

- **Single-file Terraform requirement violated**:
  - The prompt requires native Terraform HCL in one file; the response uses CDKTF (Python) with classes `SecureAwsInfraStack` and `SecureAwsInfraStackWithRandom` and calls `app.synth()`.

- **Variables and inputs missing/not implemented**:
  - Missing Terraform variables: `aws_region`, `project_name`, `allowed_cidrs`, `environment`, `multi_az`, `deletion_protection`, `vpc_cidr`, `nat_per_az`, `rds_engine`, `rds_engine_version`, `rds_instance_class`, `rds_allocated_storage`, `cw_log_retention_days`.
  - Region and many settings are hard-coded (e.g., `us-east-1`, instance class, engine version). `allowed_cidrs` is read from an environment variable rather than a Terraform variable.

- **S3 privacy and security controls incomplete/incorrect**:
  - No bucket policy denying public access and enforcing TLS-only (`aws:SecureTransport`).
  - No explicit private ACL.
  - No `aws_s3_bucket_ownership_controls`.
  - Default encryption uses SSE-KMS with AWS-managed key; prompt requires default SSE (SSE-S3).

- **VPC architecture incomplete**:
  - Required NAT Gateway(s) and private route tables are missing. Only a public route table is created; no NAT, EIP, or private routes to NAT are defined.

- **RDS requirements partially met**:
  - Encryption at rest enabled and placed in private subnets via a DB subnet group (good), but:
    - No `deletion_protection` toggle (prompt requires, default true).
    - No `multi_az` toggle.
    - Instance class, engine, version, and storage are not parameterized as variables.
    - Hard-coded weak password (`ChangeMe123!`) violates "avoid placeholders" and best practices.

- **Security groups partially aligned**:
  - Web SG allows only 80/443 from an allowed list (good), but `allowed_cidrs` is not a Terraform variable as required.
  - DB SG restricts port 5432 to the web SG (good).

- **VPC Flow Logs**:
  - Implemented to CloudWatch with retention (good). However, retention is hard-coded (should come from `cw_log_retention_days`).

- **Tags not compliant**:
  - Required tags missing: `Project = "IaC - AWS Nova Model Breaking"`, `ManagedBy = "Terraform"`, and consistent `Environment` across resources.

- **Outputs incomplete**:
  - Missing outputs for all required items: subnet IDs, both SG IDs (only web SG is output), IAM role ARNs. Some outputs are present (VPC ID, bucket name, RDS endpoint).

- **References to pre-existing infra**:
  - Uses data sources for AWS-managed KMS keys (`alias/aws/s3`, `alias/aws/rds`). The prompt requires creating brand-new resources and, specifically, SSE-S3 for buckets (so no KMS needed).

- **Implementation hints not followed**:
  - No `aws_s3_bucket_ownership_controls` as hinted.
  - "Use for_each"/`dynamic` pertains to Terraform HCL; response is Python and thus does not satisfy the HCL guidance.

- **Acceptance criteria not met**:
  - ❌ S3 public access blocked with private ACL, SSE-S3, and TLS-only policy.
  - ❌ Variables declared and used per prompt (incl. `aws_region`).
  - ❌ VPC with NAT Gateway(s) and proper routing for private subnets.
  - ❌ Outputs complete as specified (incl. IAM role ARNs and subnet IDs).
  - ❌ Single file `tap_stack.tf` with valid Terraform HCL.
  - ✅ VPC Flow Logs enabled (partial pass; retention not variable-driven).
  - ✅ Security groups conceptually restricted, but missing variable wiring.

- **Likely compile/synth issues in the CDKTF code (even aside from format mismatch)**:
  - `availability_zone=f"${{azs.names}[{i}]}"` uses HCL-style interpolation in Python and is invalid for CDKTF; should reference `azs.names[i]` tokens.
  - Two stacks defined; the first stack embeds `${random_id.bucket_suffix.hex}` without defining the resource in that stack (unused class, but misleading and would be invalid if instantiated).
  - `FlowLog.resource_type` value casing may not match provider expectations (should match the provider schema exactly).

---

If you want, I can rewrite the response to a compliant single-file `tap_stack.tf` that fully meets the prompt and acceptance criteria.
