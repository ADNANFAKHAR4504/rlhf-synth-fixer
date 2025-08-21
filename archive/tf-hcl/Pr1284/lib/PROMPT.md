# Prompt: Secure AWS Terraform in One File (`lib/main.tf`)

**You are an expert Terraform engineer.** 
Generate a **complete, production-grade Terraform configuration** for AWS that lives **entirely in a single file named `lib/main.tf`**. **Do not include any provider configuration** (a separate `provider.tf` already exists). The code must be valid HCL, apply cleanly, and meet every requirement below.

---

## Objectives & Scope

Build a **secure AWS environment** that satisfies all items, using AWS best practices:

1. **IAM tag-based access control for S3**
- Create an S3 bucket.
- Use **IAM roles and policies** to restrict access **based on specific resource tags** on S3 objects/bucket (e.g., `data:classification = confidential`).
- Include at least:
- One IAM role with an inline policy that **allows** `s3:GetObject/ListBucket` **only** when required tags match (use `aws:ResourceTag/*` and/or `s3:ExistingObjectTag/*` conditions).
- One IAM policy or statement that **denies** access if TLS is not used (`aws:SecureTransport = false`).

2. **EC2 in pre-defined network**
- Launch **one EC2 instance** that is **confined to a specified VPC and subnet** (IDs are provided as variables).
- Attach a **security group** that **only allows HTTPS (443) and SSH (22)** inbound **from a provided CIDR range**; all other inbound blocked; all outbound allowed.

3. **S3 encryption at rest and in transit**
- Bucket encrypted with a **specified KMS key** (provided as variable).
- **Bucket policy** must:
- Require **TLS in transit** (Deny if `aws:SecureTransport` is `false`).
- Require **SSE-KMS** with the provided key (deny if headers dont match).

4. **CloudTrail auditing**
- Enable **CloudTrail** to log **all API calls** (management events at minimum).
- Deliver logs to an S3 bucket (may reuse the data bucket or create a separate logs bucket).
- Ensure required bucket policies for CloudTrail delivery are present.

5. **Least-privilege IAM user for deployment**
- Create an **IAM user** intended for deployment tasks with **minimal permissions** (e.g., limited to `terraform apply` operations relevant to the resources defined).
- Attach a **customer-managed policy** granting the **smallest set** of actions needed to manage **only** the resources in this file (S3, EC2, IAM role/policy attachments for the role you create, CloudTrail).
- Output **access guidance** as comments (credentials not created in code).

6. **Strict tagging**
- **All resources** must have the tag `Environment = "Production"`.
- Prefer using `default_tags` via resources or explicit `tags` blocks on every resource.

7. **Region & Inputs**
- All resources operate in **`us-west-2`**.
- **Inputs provided as Terraform variables** (no hardcoding):
- `vpc_id` (string)
- `subnet_id` (string)
- `allowed_cidr` (string)
- `s3_kms_key_arn` (string)
- `data_bucket_name` (string)
- `trail_bucket_name` (string) if you choose a separate logs bucket
- `instance_ami` (string) public Amazon Linux 2/AL2023 AMI ID or data source lookup allowed
- `instance_type` (string, default a small type)
- Any other minimal variables you need

---

## File & Output Rules

- **Output exactly one file**: `lib/main.tf`.
- **No provider blocks** (already in `provider.tf`).
- Use **only AWS** resources and data sources.
- **No external modules**; keep everything self-contained in this single file.
- Include **helpful top-of-file comments** that **map each requirement** to the specific resources/policies used (a short checklist).
- Add **Terraform `outputs`** to help verification:
- S3 bucket name
- CloudTrail ARN / status
- EC2 instance ID and security group ID(s)
- IAM role name(s) and IAM user name

---

## Compliance Details (must implement)

- **S3 tag-based access control** using condition keys such as:
- `StringEquals` on `aws:ResourceTag/<Key>` and/or `s3:ExistingObjectTag/<Key>`
- **In-transit enforcement**: Deny if `aws:SecureTransport` = `false`.
- **At-rest encryption**: Require `s3:x-amz-server-side-encryption = aws:kms` and `s3:x-amz-server-side-encryption-aws-kms-key-id = var.s3_kms_key_arn`.
- **Security Group rules**: only `22` and `443` from `var.allowed_cidr`.
- **CloudTrail**:
- Management events enabled.
- S3 bucket policy allows CloudTrail delivery (`cloudtrail.amazonaws.com`).
- Optional: enable log file validation.
- **IAM user (deployment)**:
- Minimal, resource-scoped actions (e.g., specific ARNs for bucket, trail, instance, role).
- Use least-privilege statements; avoid `"*"` where possible.

---

## Quality Bar & Acceptance Criteria

- `terraform fmt` and `terraform validate` pass.
- Plan/apply in **`us-west-2`** succeeds assuming valid variable values.
- Every requirement is **enforced via policy or configuration**, not just documented.
- Tag `Environment = Production` present on **every** resource.
- Clear comments explaining **why** each sensitive policy/condition exists.

---

## Deliverable Format

Return **only** a single fenced code block with the complete HCL for `lib/main.tf`. No prose outside the code block.

\```hcl
# lib/main.tf
# (Your complete solution here)
\```

Make sure the code is ready to paste into `lib/main.tf` and run with `terraform apply -var-file=...` using the variables described above.