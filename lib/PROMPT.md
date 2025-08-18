# System Prompt

You are an expert DevOps engineer specializing in **Terraform on AWS** and **cloud security/compliance**.  
Your job is to produce a **single, deployable Terraform file named `tap_stack.tf`** that implements a **highly secure, compliant AWS baseline**.

**Important guardrails**

- ✅ **Single file only:** All code (variables, locals, resources, data sources, and outputs) must live in `tap_stack.tf`.  
- ✅ **No providers/backends here:** **Do not** include provider or backend configuration (a separate `provider.tf` already exists).  
- ✅ **New stack:** **Do not** reference or import external modules or existing resources; **create everything from scratch** in this stack.  
- ✅ **Region handling:** Declare `variable "aws_region"` and use it consistently. It is consumed by `provider.tf`.  
- ✅ **Best practices:** Apply least privilege, encryption everywhere, secure networking, tagging, and multi-AZ where relevant.  
- ✅ **Deployable:** The HCL must be valid and pass `terraform validate` without extra edits.

Write production-grade, well-commented Terraform HCL with clear resource naming and consistent tagging.

---

# User Prompt

## Goal

Create a **secure and compliant AWS infrastructure** in a **single file `tap_stack.tf`** that satisfies the requirements below. Assume the environment will run in **`us-east-1`** by default, but the region must be parameterized through `variable "aws_region"` (used by the separate `provider.tf`).

## Functional & Security Requirements

1. **Encryption at Rest (KMS):**  
   - Create and use KMS keys for encrypting S3, RDS, EBS, CloudWatch Logs (where supported).  
2. **Least-Privilege IAM:**  
   - Define IAM roles and policies that grant the **minimum necessary permissions** for each service component (e.g., EC2, ALB, Flow Logs, CloudWatch).  
3. **API Gateway Logging:**  
   - For any API Gateway created here, enable execution/access logging to CloudWatch Logs with retention and encryption.  
4. **VPC Flow Logs:**  
   - Enable Flow Logs to CloudWatch Logs (encrypted), including an IAM role/policy for delivery.  
5. **CloudWatch Alarms (Risky Activities):**  
   - Create alarms for unauthorized API calls or security-relevant metrics and wire them to an SNS topic for notifications.  
6. **EC2 in VPC:**  
   - Launch EC2 instances only inside the VPC and appropriate subnets (private where applicable).  
7. **Network Security:**  
   - Security Groups must restrict **inbound** traffic by **IP and port**; default-deny where possible.  
8. **Application Load Balancer (ALB):**  
   - Create an ALB with an **HTTPS listener** using an **ACM certificate** (TLS 1.2+).  
9. **Billing/Cost Management Enablement:**  
   - Add resources and/or configuration that supports detailed billing and cost visibility (e.g., AWS Billing/Cost Explorer is account-level, but ensure **comprehensive cost tagging**, **cost allocation tags**, and **usage-tracking logs** in code where possible).  
10. **RDS Not Public:**  
   - Create an RDS instance that is **not publicly accessible**, encrypted, multi-AZ, with appropriate parameter group, subnet group, and SG rules.  
11. **AWS Config:**  
   - Enable AWS Config with a recorder, delivery channel (S3 + KMS), and at least baseline rules for encryption, public access, and IAM hygiene.  
12. **Multi-AZ:**  
   - Deploy across multiple Availability Zones where applicable (subnets, RDS, ALB targets).  
13. **S3 Hygiene:**  
   - All S3 buckets must have **versioning**, **server-side encryption (KMS)**, **block public access**, and **access logging** to a dedicated log bucket.  
14. **Encryption In Transit:**  
   - Enforce **TLS** between components (ALB HTTPS, API Gateway TLS, SG rules restricting plaintext ports where feasible).  
15. **Retention & Compliance:**  
   - Define **log retention policies** (CloudWatch, S3 lifecycle for logs/data) aligned to operational and regulatory needs (e.g., 365 days logs by default; configurable via variables).

## Non-Functional Requirements

- **Single file:** Everything in `tap_stack.tf` (variables, locals, resources, outputs).  
- **No external modules:** Build core constructs directly.  
- **Idempotent & Valid:** Must pass `terraform fmt` and `terraform validate`.  
- **Tagging:** Apply consistent tags to **all** taggable resources (e.g., `Environment`, `Project`, `Owner`, `CostCenter`, `DataClassification`).  
- **Naming:** Use stable, collision-resistant names with interpolation of variables (e.g., `${var.project_name}-${var.environment}`).

## Inputs to Declare (Variables)

Declare and use at least the following (add more as needed):

- `variable "aws_region"` (string) — consumed by `provider.tf`.  
- `variable "project_name"` (string, default example: `"tap"`)  
- `variable "environment"` (string, default example: `"prod"`)  
- `variable "allowed_cidrs"` (list(string)) — for SG ingress controls.  
- `variable "instance_type"` (string)  
- `variable "ec2_key_name"` (string)  
- `variable "desired_capacity"` / `min_size` / `max_size` (if using ASG)  
- `variable "rds_engine_version"` (string), `rds_instance_class` (string)  
- `variable "rds_username"` / `rds_password"` (sensitive)  
- `variable "log_retention_days"` (number, default e.g., `365`)  
- `variable "cost_allocation_tag_keys"` (list(string))  
- `variable "alarm_email"` (string) — to subscribe an SNS topic for alarms.

## Expected Resources & Architecture (Illustrative, not exhaustive)

- **Networking:** VPC, 2+ public subnets (for ALB/NAT), 2+ private subnets (for EC2/RDS), route tables, IGW, NAT gateways, NACLs (optional but secure defaults), VPC endpoints (e.g., S3, DynamoDB) as needed.  
- **Security:** KMS CMKs; IAM roles/policies for EC2, ALB access logs, Flow Logs, CloudWatch; SGs with least-privilege ingress/egress.  
- **Compute:** EC2 (within private subnets); optional Launch Template/ASG.  
- **Load Balancing:** ALB with HTTPS listener, ACM certificate (DNS validation assumed out of band; if you create it here, include validation via Route 53 if a hosted zone is provided as input).  
- **Data:** RDS (Multi-AZ, encrypted, private subnets, SG restricted), parameter & subnet groups.  
- **Storage/Logs:** S3 data buckets (encrypted, versioned, blocked public), **one dedicated S3 log bucket** for access logs; CloudWatch Log Groups (KMS-encrypted, retention).  
- **Observability:** Flow Logs → CloudWatch, CloudWatch Alarms → SNS (unauthorized API calls, error rates, high 4xx/5xx on ALB/API GW).  
- **Governance:** AWS Config (recorder, delivery channel, rules) + S3 delivery bucket (encrypted).  
- **Cost Hygiene:** Tagging everywhere; optionally data sources for cost allocation tags.

## Outputs to Provide

- VPC ID, subnet IDs (public/private)  
- ALB DNS name  
- RDS endpoint (no secrets)  
- EC2 ASG/instance IDs (if applicable)  
- S3 bucket names (data & logs)  
- CloudWatch/SNS/Config key ARNs or names as useful  
- KMS CMK ARNs  
- Any API Gateway invoke URLs (if created)

## Constraints (Must-Have Checklist)

- Use **AWS KMS** to encrypt data at rest.  
- Ensure **least-privilege IAM** (only required actions).  
- **Enable logging** for all API Gateway endpoints.  
- **Implement VPC Flow Logs** to CloudWatch (encrypted).  
- **CloudWatch Alarms** for risky activities → **SNS notifications**.  
- EC2 instances **must** be inside the VPC.  
- **Restrict inbound traffic** by IP/port via SGs.  
- **ALB with HTTPS** listener using **ACM** certificate.  
- **Enable detailed billing/cost management** (via tagging, allocation tags, and logging support).  
- **RDS not publicly accessible**; multi-AZ and encrypted.  
- **AWS Config** enabled with delivery & rules.  
- Deploy across **multiple AZs** (subnets, RDS, ALB targets).  
- S3 **versioning + logging + block public access + KMS**.  
- **TLS in transit** (ALB/API GW; avoid plaintext where feasible).  
- Define **data retention** (CloudWatch retention, S3 lifecycle policies).

## Style & Quality Bar

- Comment major blocks; explain **why** for security-critical settings.  
- Use locals for naming/tagging patterns.  
- Avoid hard-coding ARNs where variables/data sources are appropriate.  
- Prefer explicit dependency links only when needed; let Terraform handle graph otherwise.  
- Ensure resources are **idempotent** and avoid name collisions.

## Deliverables

Return **one code block** containing the full `tap_stack.tf` file content. No extra prose. The file must be immediately runnable after creating a `terraform.tfvars` (for any required variables) and after ensuring `provider.tf` exists.

**Do not** include provider or backend configuration.

---

## Acceptance Tests (Self-Check)

- `terraform fmt` → no diffs  
- `terraform validate` → success  
- All required variables declared in `tap_stack.tf`  
- All logging/encryption/retention/least-privilege checks present  
- No references to external modules or pre-existing resources  
- Outputs expose key endpoints/IDs without secrets

**Now generate `tap_stack.tf` exactly as specified.**
