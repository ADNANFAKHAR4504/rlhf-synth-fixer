# MODEL_FAILURES.md

## Common and Observed Model Failures (Terraform AWS)

This checklist compares your `MODEL_RESPONSE.md` against the **ideal** implementation and flags likely gaps. Items marked **FAIL** were not detected in the model output.

---

### VPC & Networking
- Multi-AZ subnets
- Internet Gateway present
- NAT Gateway per AZ (HA)
- Route tables & associations
- Private + Public subnets
- VPC resource exists

### Security Groups
- **FAIL:** Restrictive inbound (80/443 only)
- **FAIL:** Explicit egress rules
- **FAIL:** SG attached to resources

### IAM (Least Privilege)
- IAM roles defined
- Scoped policies (no wildcards where avoidable)
- CloudWatch permissions present where needed

### Encryption (KMS)
- KMS CMK created
- Key rotation enabled
- **FAIL:** CloudWatch logs encrypted
- S3 SSE-KMS enabled

### CloudWatch & Logging
- Log groups defined
- Retention set
- VPC Flow Logs enabled

### S3 Hardening
- Block Public Access
- Versioning enabled
- **FAIL:** Bucket policy restricts public

### Outputs & Tagging
- Useful outputs present
- Consistent tagging

### Multi-Region Readiness
- Secondary provider alias or region

---

**Approximate code overlap with ideal (line match): 45%**

## How to Avoid These Failures

- Define VPC with public and private subnets across **multiple AZs**, attach **IGW**, and create **one NAT Gateway per AZ** with proper route tables.

- Encrypt **CloudWatch Logs** and **S3** with **KMS CMK**; enable **key rotation**.

- Use **least-privilege IAM** roles and scoped policies (avoid `*` actions/resources where possible).

- Enable **VPC Flow Logs** and set **log retention**.

- Apply **S3 Block Public Access** and enable **versioning**.

- Emit useful **outputs** and apply consistent **tags**.

- Consider **secondary provider alias/region** for multi-region readiness.
