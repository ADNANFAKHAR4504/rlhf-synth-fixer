You are a senior cloud infrastructure engineer. Produce **complete, runnable Terraform HCL** for a **production** AWS environment, with security-first defaults and extensive inline comments. Follow the instructions and constraints precisely.

---

## What to Build (Scope)

Provision a minimal-yet-secure AWS foundation that includes:

- **VPC** (1 VPC, public/private subnets across at least 2 AZs, NAT, IGW, route tables)
- **Network ACLs (NACLs)** tightly restricting traffic to **trusted CIDR ranges**
- **Security Groups** with **no 0.0.0.0/0** inbound and **restricted egress**
- **EC2** instances in private subnets, behind appropriate SGs, using SSM for access (no SSH over the internet)
- **S3** buckets for application and logging data, with **SSE-KMS** and **versioning**
- **KMS CMK** used by S3 (key policy least-privilege)
- **CloudTrail** delivering to encrypted S3 and to **CloudWatch Logs**
- **CloudWatch Alarm** that triggers on **root account usage** via a metric filter on CloudTrail logs
- **AWS Config** enabled with rules to enforce **EC2 instances are members of an Auto Scaling Group**
- **IAM** roles and policies with **least privilege** (EC2 instance role, CloudTrail role, AWS Config role, Lambda execution role, etc.)
- **Tagging**: **Environment=Production** and **Owner=TeamX** on all resources via provider `default_tags` and per-resource fallbacks
- **Region** to `us-west-2`

---

## Non‑Negotiable Constraints

1. The provider.tf already exists and holds the **AWS provider + S3 backend**.
2. **Do not** put a provider block in tap_stack.tf. That stays in provider.tf.
3. The variable "aws_region" must be declared in tap_stack.tf and is consumed by provider.tf.
4. **Least privilege** IAM everywhere. Avoid `*` actions/resources. Scope to ARNs and required APIs only.
5. **S3 SSE-KMS** for all buckets. Block public access. Enable **versioning**, and (optionally) lifecycle rules for non-current versions.
6. **NACLs**: inbound/outbound restricted to **`var.trusted_cidrs`** + essential egress (e.g., 443) and intra‑VPC traffic as needed.
7. **Security Groups**: no wide‑open ingress; egress restricted to needed ports. Prefer allowing from ALB/instance SGs, not CIDRs.
8. **CloudTrail**: multi‑AZ, logs to encrypted S3 with access logging and KMS; send to CloudWatch Logs.
9. **CloudWatch Alarm**: detect **root account usage** with a **metric filter** from CloudTrail logs.
10. **AWS Config**: enable in region; implement **EC2-in-ASG** rule
11. **No public EC2**. Use **SSM Session Manager** (attach required IAM policy) and disable SSH inbound entirely.
12. **All resources in `us-west-2`** only. Do not create cross‑region artifacts.
13. **Tagging**: apply `Environment=Production` and `Owner=TeamX` everywhere.
14. **Explain everything** with concise comments above each resource explaining the security intent and relationships.
15. **No placeholders for secrets**. Use variables and secure references; do not commit secret values.
16. **Idempotent**: a fresh `terraform apply` must succeed with defaults, and a second apply must be a **no‑op**.
17. **Ensure you generate ALL the necessary Terraform HCL files with the complete codes in them**.

---

## Output Requirements (Exact Format)

A series of Terraform HCL configuration files structured in a modular format, stored in a Git-managed repository.

---

## Specific Implementation Details

- **VPC**: /16 CIDR; 2+ public subnets (ALB/NAT EIPs) and 2+ private subnets (EC2); NAT gateways in each AZ; route tables clearly separated.
- **NACLs**: Deny by default; explicitly allow required ports for egress 443 and intra‑subnet traffic. Comment rules to justify necessity.
- **Security Groups**:
  - ALB SG (if you include an ALB) may allow 80/443 **only** from `trusted_cidrs`.
  - EC2 SG should allow only from ALB SG on app ports; egress only 443.
- **EC2**: Launch template + Auto Scaling Group spanning private subnets; attach **SSM managed policy** for Session Manager; disable IMDSv1; enable detailed monitoring.
- **S3**:
  - Application bucket + logging bucket.
  - **Block Public Access** (account + bucket level).
  - **SSE-KMS** with a **customer-managed key** (CMK) defined in `kms.tf`.
  - **Versioning** enabled; lifecycle policy for noncurrent versions (e.g., 90 days) with comments.
  - Server access logging goes to the logging bucket.
- **KMS**: Key policy minimally grants usage to required principals (S3, CloudTrail, your account). Avoid wildcards.
- **CloudTrail + CloudWatch**:
  - Organization trail not required; single‑account is fine.
  - Deliver to encrypted S3 and to CloudWatch Logs.
- **AWS Config**:
  - **If a managed rule exists for EC2-in-ASG**, use it.
- **IAM**:
  - EC2 instance role: minimal SSM + CloudWatch logs; **no S3 "+\*"**—scope to the application bucket only if needed.
  - Service roles for CloudTrail/Config/Lambda with least privilege, scoped to required resources and log groups only.
- **Tagging**: Use provider `default_tags { tags = { Environment = "Production", Owner = "TeamX" } }` plus explicit tags on resources where the provider cannot apply.
- **Validations**: Use variable validations and resource `precondition`/`postcondition` where helpful (e.g., reject if any SG has `0.0.0.0/0` ingress).

---

## Security Validation Checklist

- [ ] `terraform validate` passes; second `apply` is a no‑op.
- [ ] All resources created in **us-west-2**.
- [ ] **S3**: KMS encryption enabled; versioning on; public access blocked; access logs to logging bucket.
- [ ] **KMS**: CMK with least‑privilege key policy; rotation enabled.
- [ ] **EC2**: in **private subnets**; **no public IPs**; IMDSv2 only; SSM Session Manager works.
- [ ] **SGs**: no `0.0.0.0/0` ingress; egress limited to 443; ALB (if present) restricted to `trusted_cidrs` or service SGs.
- [ ] **NACLs**: only required ports allowed; limited to `trusted_cidrs`.
- [ ] **CloudTrail**: writing to encrypted S3 & CW Logs.
- [ ] **CloudWatch Alarm** for **root user activity** is **ALARM** when simulated and sends to SNS subscription.
- [ ] **AWS Config**: recorder ON; **EC2-in-ASG** rule COMPLIANT; non‑compliant resources listed if any deviation.
- [ ] **Tags**: every resource has `Environment=Production` and `Owner=TeamX`.

---

## Deliverable Philosophy

- Every resource block must explain **why** it exists and **how** it secures the system.
- Do **not** generate scaffolding you cannot secure (e.g., bastion hosts). Use SSM instead.
- If a capability is ambiguous, choose the **more secure** default and explain it in comments.
