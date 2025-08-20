I am a senior DevOps engineer and expert Terraform author. 
Need to write infrastructure for a real production system.

---

## Objective

Write a **single Terraform HCL file**, `main.tf`, that **fully implements** this infrastructure in **AWS us‑west‑2**, without using any modules or splitting into sub‑files**everything must live in one `main.tf`**. The infrastructure must satisfy:

1. VPC in us‑west‑2 with at least two AZs, each with one **public** and one **private subnet**.
2. An RDS instance (MySQL), using **multi‑AZ**, **encrypted at rest**, **configuration** restricted by CIDR list (allow only certain IPs), with **IAM roles** (not inline policies) for any access.
3. An **Application Load Balancer** in public subnets distributing HTTP traffic to compute resources in private subnets (e.g. EC2 Auto Scaling Group or ECS), configured for **horizontal scaling** across AZs.
4. An **S3 bucket** (or buckets) for application data and/or logs, with **encryption at rest enabled** (SSE‑S3 or SSE‑KMS) and **access logging configured** (e.g. ELB or S3 access logs stored in dedicated bucket).
5. All data‑at‑rest encrypted: S3, RDS, any EBS volumes attached.
6. **IAM roles** for EC2/ECS and RDS: use IAM role and role policy attachment (no inline policies); assume least‑privilege.
7. RDS security group only allows inbound from specified IP CIDRs.
8. **Tags**: every AWS resource created must be tagged with `Environment`, `Owner`, `Project`.
9. Support **application deployment across AZs** and horizontal **auto‑scaling** across private subnets.
10. Use an **ALB** with listeners and target group(s), cross‑AZ healthy‑target balancing.
11. Enable **multi‑AZ deployment** for RDS for failover.
12. (Optional but recommended) Configure **Terraform backend** (e.g. S3 + DynamoDB lock) in us‑west‑2 in root `terraform` block.
13. Use **Terraform 1.x features**, proper DRY via locals where helpful, but do **not** use any `module` blocks or folder structure**one file only**.

---

## Key requirements for the output

- File starts with `terraform { backend "s3" { ... } }` block .
- `provider "aws"` configuration refers explicitly to `us‑west‑2`.
- Use `resource`, `data`, `variable`, `locals`, `output` blocksall inside **main.tf**.
- Use IAM **role** and **aws_iam_role_policy_attachment** (or separate aws_iam_policy + aws_iam_role) to implement roles.
- Comments to clearly separate and label sections (e.g. `### VPC `, `### IAM`, `### RDS`, `### ALB + ASG`, etc.).
- Use Terraform best practices: variables with sensible defaults, locals for reuse, interpolation with `${}`, no inline JSON in `user_data` without proper escaping, etc.
- Include meaningful variable definitions for IP allow list, sizing, tags.
- Provide default tags as locals so they automatically apply to all resources (e.g. with `default_tags = local.common_tags` when supported).
- At the top, include a short header comment listing assumptions (e.g. IP CIDRs, AMI IDs, DB engine, sizes).

---

## Validation expectations

After generating **main.tf**:

1. Run `terraform fmt` should pass with no style issues.
2. Run `terraform validate` no errors, plan shows correct resource creation in us‑west‑2.
3. Review security configuration:
- RDS has `storage_encrypted = true`
- ALB logs are enabled and point to an encrypted logging bucket
- VPC security groups restrict access as intended
- IAM policies reference least‑privilege permissions, linking to IAM rolenot inline JSON
4. Review HA/scale design:
- ALB spreads targets across two AZs
- Autoscaling group in both private subnets
- RDS marked `multi_az = true`

---

Do **not** refactor into modulesone self‑contained `main.tf` only. Make it production‑grade, documented with comments, and AWS‑best‑practice compliant. Label your response clearly that the output is the full contents of `main.tf`.

---

**Deliverable:** Provide **only** the contents of `main.tf` as plain text, starting from the first line to the last, implementing all above requirements **without** any modules or folder structure.
