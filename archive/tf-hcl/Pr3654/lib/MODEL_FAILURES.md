## 1) Eliminate Manual Secrets & Reduce Inputs
- **Removed manual DB password variable**; the DB master password is now **generated automatically** with a strong policy.
- Kept only essential variables; added a sensible default for `unique_id = "prod"`.

**Why:** Avoid hard-coded secrets and improve out-of-the-box deployment.

---

## 2) Availability Zones & Region Awareness
- Replaced hardcoded AZ names with **provider-driven AZ discovery** and selected the first two automatically.

**Why:** Prevents failures in regions with nonstandard AZ suffixes.

---

## 3) VPC & Routing Hygiene
- Split the **public route** into a dedicated `aws_route` resource.
- Maintained subnet associations but structured for clarity.

**Why:** Clearer dependencies and fewer diffs.

---

## 4) Security Groups (Principle of Least Access)
- **Web SG**: HTTPS **only from ALB SG** (not the Internet).
- **DB SG**: PostgreSQL **only from Web SG**.
- **ALB SG**: HTTPS from Internet.

**Why:** Locks down east-west traffic properly and scopes ingress paths.

---

## 5) S3 & CloudTrail Hardening
- Still blocking public access and enforcing SSE.
- **Added bucket policy** so CloudTrail can write logs safely.
- **CloudTrail resource depends on bucket policy**.

**Why:** Ensures CloudTrail can write logs securely and consistently.

---

## 6) IAM Refinements
- **EC2 role**: attached a **scoped S3 policy** for app bucket access.
- **Lambda role**: narrowed S3 permissions to app bucket + logging.
- **AWS Config role**: corrected to use the proper managed policy `AWS_ConfigRole`.

**Why:** Tightened permissions and ensured correctness.

---

## 7) RDS (Security, Cost, Operability)
- Dedicated **KMS key** with alias for encryption.
- **Randomly generated master password**.
- **Parameter group** added (e.g., `log_statement`).
- **Storage** upgraded to **gp3**.
- **Multi-AZ enabled**, **deletion protection**, **Performance Insights**.

**Why:** Production-grade posture (HA, encryption, diagnostics, safety).

---

## 8) ALB, Target Group & ASG Improvements
- **ALB**: deletion protection and invalid header drops enabled.
- **Target Group**: HTTP health checks to `/health`.
- **Listener**: clean TLS termination forwarding to target group.
- **Launch Template**: IMDSv2 required, gp3 encrypted volumes, detailed monitoring, idempotent user data.

**Why:** Safer edge, predictable health checks, and improved observability.

---

## 9) Lambda Packaging, Runtime & S3 Notifications
- **Runtime updated** to Node.js 18 (LTS).
- Packaging via `archive_file` (inline handler).
- **S3→Lambda notifications** with explicit permissions and dependencies.

**Why:** Modern runtime, quick iteration, deterministic event wiring.

---

## 10) API Gateway Wiring & Deployment
- Resources, methods, and integrations preserved.
- **Added `aws_api_gateway_deployment`** with `create_before_destroy`.

**Why:** Guarantees stable deployments and avoids “no deployment found” issues.

---

## 11) AWS Config Recorder
- Recorder, delivery channel, and status flow preserved.
- IAM policy corrected to `AWS_ConfigRole`.

**Why:** Correct permissions and working recorder lifecycle.

---

## 12) Observability (CloudWatch)
- **Added Log Group** for Lambda with retention.
- **Added CPU alarms** for ASG tied to scaling policies.

**Why:** Baseline visibility and autoscaling feedback loop.

---

## 13) Outputs & Splat Syntax
- Updated to splat syntax (e.g., `aws_subnet.public[*].id`).
- Removed invalid/unnecessary outputs (like REST API endpoint that doesn’t exist).

**Why:** Cleaner plans and fewer invalid references.

---

## 14) Tagging & Defaults
- Common tags merged with `ManagedBy = "Terraform"`.
- `unique_id` now has a default (`prod`).

**Why:** Governance and zero-touch bootstrap.

---

## 15) Ordering & Dependencies
- Added explicit **depends_on** (e.g., CloudTrail after bucket policy).
- Split routes from route tables for deterministic apply.

**Why:** Prevents intermittent apply errors.

---

## 16) Optional Items to Reintroduce Later
- **NAT Gateway** logic (if private subnets need Internet).
- **ACM certificate** wiring for ALB HTTPS.

**Why:** Kept minimal for baseline, can be layered in when required.

---
