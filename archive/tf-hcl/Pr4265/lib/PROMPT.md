# Prompt: Build an AWS sandbox in Terraform (NAT Instance version)

You’re an **AWS/Terraform specialist**. I need a single Terraform file named **`tap_stack.tf`** that stands up a realistic sandbox VPC with **one public EC2**, **one private canary EC2**, **VPC Flow Logs to S3**, and an **app S3 bucket**. This runs in CI with **live end-to-end tests**, so prioritize clarity, correctness, and **connectivity reliability**.

Write **plain HCL only** — **no provider** and **no backend** blocks (CI supplies those). **No external modules.** Keep everything in **this one file**.

> **Important:** **Do not** add CloudFormation-style DeletionPolicy (not applicable to Terraform) and **do not** use `lifecycle.prevent_destroy`. The stack must be easy to destroy in CI.

---

## Scenario & intent

Stand up a small, production-like network:
- **VPC (10.0.0.0/16)** with **two public** and **two private subnets** across **two AZs**.
- **Internet Gateway** and a **public route table** with `0.0.0.0/0 → IGW` associated to both public subnets.
- **NAT Instance**  in one public subnet; **private route tables** default `0.0.0.0/0 → NAT Instance` and associations to private subnets.
- **S3 Gateway VPC Endpoint** (`com.amazonaws.${var.aws_region}.s3`) attached to **both** public and private route tables.
- A **public EC2** (Amazon Linux 2023) that serves a tiny web page echoing env values; a **private “canary” EC2** (no public IP) to prove NAT egress and S3 access from private subnets.
- **VPC Flow Logs** delivered to a dedicated **logs S3 bucket**.
- Configuration values published to **SSM Parameter Store**.
- **Default EBS encryption** enabled (AWS-managed key).

Even if some pieces look “optional” in a toy stack, include **EC2s, security groups, subnets, route tables + IGW/NAT instance, IAM role/policy/profile, S3 buckets, VPC endpoint, Flow Logs**, as our integration tests depend on them.

---

## Inputs & behavior

- `variable "aws_region"` — **no default**; add a **validation** that **enforces `"us-west-2"`** with a clear error (CI expects this exact check).
- `variable "environment"` — default `"dev"`, allowed only `["dev","prod"]`. Use it to switch:
  - EC2 type: `"t3.micro"` (dev) vs `"t3.small"` (prod)
  - `DEBUG`: `"true"` (dev) vs `"false"` (prod)
  - `LOG_LEVEL`: `"DEBUG"` (dev) vs `"INFO"` (prod)
- `variable "ssh_cidrs"` — default `[]`. When empty, **no SSH ingress rule exists**. When non-empty, allow `22/tcp` from each provided CIDR.
- `variable "environment_suffix"` — optional `""`. Use only in **Name** tags (e.g., to hint PR numbers), not in IDs that must remain stable.
- `variable "tags"` — optional `map(string)` to allow extra user tags merged into a base tag set.

---

## Required resources & implementation notes

### Networking
- **VPC**: CIDR `10.0.0.0/16`; **enableDnsSupport = true** and **enableDnsHostnames = true**.
- **Two public subnets** and **two private subnets** in distinct AZs.
  - Public subnets: `map_public_ip_on_launch = true`.
  - Private subnets: `map_public_ip_on_launch = false`.
- **Internet Gateway**, **public route table** with `0.0.0.0/0 → IGW`, **associations** to both public subnets.
- **NAT Instance** (in place of NAT Gateway):
  - One Amazon Linux 2023 instance with IP forwarding and masquerade enabled.
  - Security group allowing **all ingress from VPC** and **all egress**.
  - Private route tables’ default route should point to the **NAT instance’s network interface ID**.
- **S3 Gateway VPC Endpoint** attached to both public and private route tables.
  - Endpoint policy may restrict access to the project’s **app bucket** only (least privilege).

### Security Groups
- **Web SG** attached to the public instance with **egress all** to `0.0.0.0/0` **on the SG itself**.
- - Ingress: **HTTP 80** from anywhere via a dedicated `aws_vpc_security_group_ingress_rule "http"`.
- **SSH (22/tcp)** as **another separate** `aws_vpc_security_group_ingress_rule` resource named **`ssh`**, with `for_each = toset(var.ssh_cidrs)`. If `ssh_cidrs` is empty, no SSH rule exists.
  - _Do not_ inline these into the SG — tests expect distinct rule resources.

### S3
- **App bucket** (resource name **`aws_s3_bucket.app`**):
  - `force_destroy = true`
  - Versioning enabled
  - Server-side encryption = AES256
  - Public access block: all four booleans `true`
  - Stable-per-run but unique name via `random_id`, e.g. `tap-${var.environment}-${random_id.bucket.hex}`.
  - Strict bucket policy:
    - Deny insecure transport (`DenyInsecureTransport`)
    - Deny unencrypted uploads (`DenyUnEncryptedObjectUploads`)
- **Logs bucket** for **VPC Flow Logs**:
  - Same posture: `force_destroy = true`, versioning, AES256 SSE, public access block.
  - Bucket policy allowing `delivery.logs.amazonaws.com` to write with `bucket-owner-full-control` ACL.

### EC2 (Amazon Linux 2023)
- Discover AL2023 via `data "aws_ami"` filtered to `al2023-ami-*-x86_64` (HVM, EBS), owner `amazon`, `most_recent = true`.
- **Public instance** in a public subnet; **associate public IP**.
- **Private canary** in a private subnet; **no public IP**.
- **IMDSv2 required** on both:
  ```hcl
  metadata_options { http_tokens = "required" }
  ```
- **IAM (least privilege)** for EC2 → S3 (reuse one role/policy/profile for both instances):
  - Role with EC2 trust policy.
  - Customer-managed policy granting only:
    - `s3:ListBucket` on the app bucket ARN
    - `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `app-bucket/*`
  - Instance profile for the role.


### VPC Flow Logs
- Enable **VPC Flow Logs** (`traffic-type=ALL`) on the VPC to the **logs bucket**.
- Ensure the bucket policy allows delivery.

### SSM Parameters
- `/tap/environment` → the selected environment
- `/tap/bucket` → the app bucket name

### Default EBS Encryption
- Enable **default EBS encryption** (AWS-managed key).

### Tags
Define:
```hcl
locals {
  base_tags = {
    "iac-rlhf-amazon" = "true"
    Project           = "tap"
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
  }
  tags = merge(local.base_tags, var.tags)
}
```
Apply with `merge(local.tags, { Name = "..." })` everywhere.

---

## Outputs (exact names preferred; include extras for tests)

**Primary:**
- `environment`
- `bucket_name`
- `instance_id`
- `instance_public_ip`
- `instance_type`
- `vpc_id`
- `web_sg_id`

**Extras:**
- `public_instance_eni_id`, `private_instance_eni_id`
- `public_route_table_id`, `private_route_table_ids`
- `internet_gateway_id`, `nat_instance_id`, `s3_vpc_endpoint_id`
- `logs_bucket_name`

---

## Constraints
- One VPC, 2 public and 2 private subnets across AZs.
- IGW → public route table (0.0.0.0/0).
- NAT instance → private route tables (0.0.0.0/0).
- DNS support and hostnames enabled.
- Web SG allows HTTP from internet; SSH only via `ssh_cidrs`.
- Buckets encrypted, versioned, and public-blocked.
- IMDSv2 required on EC2s.
- S3 VPC endpoint attached to both route tables.
- VPC Flow Logs to S3.
- Default EBS encryption enabled.

---

## House rules
- **Single file** (`tap_stack.tf`)
- **No provider/backend** blocks.
- AWS provider ≥ 5.
- No hardcoded ARNs/account IDs.
- Only region literal allowed is in validation for `aws_region`.
- Idempotent, CI-friendly, and fully destroyable.
- **No `prevent_destroy`** anywhere.

**Deliverable:** `tap_stack.tf` implementing the above.




