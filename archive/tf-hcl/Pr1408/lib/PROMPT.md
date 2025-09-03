You are an expert Terraform engineer building **highly secure, highly available** infrastructure for a **financial services** company. Generate **Terraform HCL** that meets the requirements below. **Do not include CloudTrail** (explicitly out of scope).

## Requirements
1. **Terraform HCL only** code must be valid, `terraform fmt` clean, and pass `terraform validate`.
2. **Multi-region high availability** deploy the stack in **two AWS regions** (variables: `primary_region`, `secondary_region`).
3. **Encryption at rest everywhere** using **AWS KMS (CMK)** with **rotation enabled**.
4. **Least-privilege IAM** only the exact permissions each component needs.
5. **VPC design** per region:
- One VPC CIDR (variables: `vpc_cidr_primary`, `vpc_cidr_secondary`).
- **3 public** + **3 private** subnets across **3 AZs**.
- IGW for public subnets, **1 NAT per AZ** for private egress (HA).
- Route tables: public routes to IGW; private routes to **same-AZ NAT**.
- **No direct Internet** from private subnets.
6. **Logging & Monitoring** via **CloudWatch** only (no CloudTrail):
- Region-scoped **CloudWatch Log Groups** (90-day retention, **KMS-encrypted**).
- **VPC Flow Logs** CloudWatch (use a minimal IAM role).
7. **Data storage encryption**:
- Example **S3 buckets** (one per region) using **SSE-KMS** with the CMKs above.
8. **Tagging & naming**:
- `locals.name_prefix = "${var.company}-${var.environment}"` (defaults: `company="finco"`, `environment="dev"`).
- Merge `var.tags` into all resources (include `Project`, `Owner`, `CostCenter`, `Compliance`, `Company`, `Environment`).
9. **Provider constraints**:
- `terraform >= 1.6.0`, `hashicorp/aws >= 5.50`.
- **Avoid deprecated or invalid patterns** (e.g., no `dynamic "kms_key_id"` blocks; use the `kms_key_id` attribute on resources that support it).