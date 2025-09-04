Design a secure, minimal AWS foundation in **us-east-1** using **Terraform**. Keep it lean and fast to deploy.

**Scope**
- One VPC with 2 public and 2 private subnets spread across 2 AZs.
- Internet Gateway for public egress; a single NAT Gateway to serve private subnets.
- Security Groups: allow inbound 80/443 to public endpoints; restrict everything else; allow all egress.
- S3:
  - One general-purpose bucket (private by default) encrypted with a KMS key.
  - One logs bucket for server access & CloudTrail logs.
  - Enable server access logging from the data bucket to the logs bucket.
- CloudTrail (management events) writing to the logs bucket.
- AWS Config recorder + a couple of managed rules (keep it light to speed up deploy).
- IAM:
  - Example IAM user and a least-privilege inline policy.
  - Deny actions when MFA is not present (condition-based).
- Consistent naming with a prefix (default: `prod-sec`).

**Latest features to include (lightweight):**
- Use the modern S3 server-side encryption configuration and bucket ownership controls.
- Use Terraform AWS provider v5+ syntax.

**Deliverables**
Provide Terraform code with these files (one code block per file):
- `versions.tf`
- `providers.tf`
- `variables.tf`
- `main.tf` (all resources)
- `outputs.tf`

Please keep the configuration minimal while meeting the requirements. No external modules.
