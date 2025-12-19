# IDEAL_RESPONSE.md

This file describes what the model’s response should have been if it fully satisfied the prompt requirements in `PROMPT.md`.

---

## lib/tap-stack.ts

- Uses **Pulumi with TypeScript**.
- Declares constants for project metadata (`nova-web`, `prod`, owner email, etc.).
- Defines **providers for `us-east-1` and `us-west-2` only** (no extra regions).
- For each region:
  - Creates a **VPC** with:
    - 2 public + 2 private subnets
    - NAT Gateway for private subnets
    - IGW + route tables/associations
  - Creates **security groups**:
    - **ALB SG** → ingress 80/443 from `0.0.0.0/0`
    - **EC2 SG** → ingress 80/443 only from ALB SG; SSH only from `sshCidr`
    - **RDS SG** → ingress 5432 only from EC2 SG
  - Deploys an **ALB** (internet-facing) with:
    - Listener on 80 (optionally 443 for TLS)
    - Target group health checks
  - Deploys an **Auto Scaling Group** with:
    - minSize = 2, maxSize = 6
    - Instances running Amazon Linux 2
    - Encrypted EBS volumes
    - IAM role with least privilege (CloudWatch, S3 read, etc.)
  - Attaches **AWS WAF Web ACL** to ALB using **AWSManagedRulesOWASPTop10RuleSet**.
  - Provisions **RDS PostgreSQL**:
    - Instance class `db.t3.medium`
    - Multi-AZ enabled
    - Encrypted with KMS key alias `alias/nova-web-kms`
    - DB password sourced from Pulumi config (not hardcoded).
  - Deploys **Lambda log processor**:
    - Python runtime
    - Minimal IAM permissions (write to central log bucket, CloudWatch logs)
- Creates **one centralized S3 log bucket** (`nova-central-logs-prod`):
  - Encrypted with KMS
  - Lifecycle:
    - Transition to Glacier after 30 days
    - Expire after 365 days
  - Bucket policy blocks public access; only VPC endpoints allowed.
- Includes a **Pulumi dynamic provider or small customization** per region.
- Applies **tags** (`Environment`, `Application`, `Owner`) to all resources.

---

## test/tap-stack.unit.test.ts

- Uses Pulumi Mocks.
- Asserts:
  - All resources tagged correctly.
  - ASG has min=2, max=6.
  - RDS is Multi-AZ and storageEncrypted.
  - Log bucket has lifecycle (30-day Glacier, 365-day expire).
  - Lambda runtime is Python.

---

## test/tap-stack.int.test.ts

- Runs against preview/deploy.
- Validates:
  - ALB → TargetGroup → ASG connectivity chain exists.
  - RDS is **not publicly accessible**.
  - WAF attached to ALB.
  - Central S3 logging bucket has lifecycle rules.
  - Log-processing Lambda exists and is wired for S3/CloudWatch.
  - Both `us-east-1` and `us-west-2` regions are deployed.
