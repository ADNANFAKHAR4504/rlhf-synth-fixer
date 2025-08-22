# lib/PROMPT.md

## Context

We’re building a production-grade, multi-region AWS setup for a business-critical web app. The stack is written in Pulumi with TypeScript. This document is the working brief for the implementation and tests.

Please keep everything in a single infra file and two test files, as noted below. No CloudFront in this design.

---

## Project details

- **Project name:** IaC - AWS Nova Model Breaking  
- **Application:** `nova-web`  
- **Environment:** `prod`  
- **Regions to cover:** `us-east-1` and `us-west-2` (equivalent resources in each, using region-specific providers inside one stack)  
- **Owner:** `infra-team@example.com`  
- **Operational inputs:**
  - `sshCidr`: `1.2.3.4/32`
  - `minASG`: `2`
  - `maxASG`: `6`
  - `rdsClass`: `db.t3.medium`
  - `dbEngine`: `postgres`
  - `kmsAlias`: `alias/nova-web-kms`
  - **Central log bucket name:** `nova-central-logs-prod`

---

## What to build

The same app footprint should be deployed in each of the two regions via explicit providers. Here’s the shape of that footprint and the key rules that go with it.

### Networking (per region)

- A VPC with:
  - 2 public subnets and 2 private subnets
  - NAT gateway for private subnets
  - Appropriate route tables and associations
- Security groups:
  - **ALB SG:** allow TCP 80 and 443 from `0.0.0.0/0`
  - **EC2 SG:** allow TCP 80/443 **from the ALB SG only**; allow SSH **only** from `sshCidr`

### Compute & load balancing (per region)

- Auto Scaling Group behind an internet-facing Application Load Balancer
- Desired scaling bounds:
  - **min:** 2
  - **max:** 6
- Attach an AWS WAF web ACL to each ALB
  - Use AWS managed OWASP rules

### Database (per region)

- Amazon RDS for **PostgreSQL**
- Instance class: `db.t3.medium`
- **Multi-AZ enabled**
- Encrypted at rest with the KMS key identified by `alias/nova-web-kms`
- Store the DB password via Pulumi config / (or AWS Secrets Manager), but **do not** hardcode it

### Centralized logging (single, global)

- One S3 bucket named `nova-central-logs-prod` for logs from all regions
- KMS-encrypted
- Lifecycle:
  - Transition to Glacier after 30 days
  - Expire after 365 days
- Bucket policy should restrict access to traffic coming from VPC endpoints (i.e., block public access)

### Log processing Lambda (global or region-specific as needed)

- A small Lambda (Python runtime) that preprocesses logs before writing to the S3 log bucket
- Keep permissions tight and minimal (see IAM below)

### IAM (least privilege)

- Roles and policies for:
  - EC2 instances (only what the app needs—S3 read for artifacts if applicable, CloudWatch logging, etc.)
  - Lambda log processor (write to the log bucket, CloudWatch logs)
  - Any S3/CloudWatch access required by ALB/WAF logging
- Aim for least privilege across the board

### Security expectations

- Encrypt everything at rest:
  - EBS volumes on EC2
  - RDS
  - S3
- Use TLS on the ALB listeners (443) in addition to 80 if needed for redirects
- DB password via Pulumi config/secret (no plaintext)

### Tagging

Apply the following tags to **all** resources:

- `Environment`: `prod`
- `Application`: `nova-web`
- `Owner`: `infra-team@example.com`

### Customization requirement

Include at least one Pulumi **dynamic provider** or a small region-specific customization so that the stack demonstrates non-trivial orchestration beyond base resources.

### Out of scope

- No CloudFront in this solution.

---

## What to deliver (files only)

Keep everything in these three files and don’t add new ones:

1. `lib/tap-stack.ts` — the entire stack implementation (all regions, all components)
2. `test/tap-stack.unit.test.ts` — unit tests with Pulumi mocks
3. `test/tap-stack.int.test.ts` — integration tests that run against a preview/deployed stack

Please keep the infra in a single TypeScript file (`lib/tap-stack.ts`) but structure it cleanly with helper functions and clear section comments (VPC, ALB, ASG, RDS, S3, Lambda, IAM, WAF, etc.). Use explicit region providers.

---

## Testing notes

### Unit tests (no real deploy)

Use Pulumi testing with mocks to assert:

- Resources are created with the expected names and tags
- ASG min/max values are set to 2 and 6
- RDS is Multi-AZ and encrypted
- The log S3 bucket has the lifecycle rules (30-day Glacier transition, 365-day expiration)
- The Lambda uses a Python runtime

### Integration tests (preview/deploy)

Validate:

- The connectivity chain exists: ALB → target group → ASG EC2
- RDS is **not** publicly accessible
- WAF is attached to each ALB
- Central S3 logging bucket has lifecycle configuration in place
- The log-processing Lambda exists and is wired for S3/CloudWatch as intended
- Region handling: both regions (`us-east-1`, `us-west-2`) are covered via providers

---

