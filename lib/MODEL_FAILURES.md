```
# Model Failures & Fixes — Terraform Stack

This document records what went wrong in the original `MODEL_RESPONSE.md` Terraform snippet and how we fixed each issue to produce a working `tap_stack.tf` that passes unit tests, live integration checks, and CI deploys.

---

## 1. Default VPC used instead of a custom VPC

### Symptoms
- Used `data "aws_vpc" "default"` and `data "aws_subnets" "default"`.
- No custom VPC, subnets, Internet Gateway, route tables, or associations created.

### Fix
- Create a custom VPC `10.0.0.0/16`, two public subnets across AZs, an Internet Gateway, a public route table with `0.0.0.0/0 → IGW`, and associations to both public subnets.
- Enable public IP assignment on public subnets.

### Example
```hcl
resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(aws_vpc.this.cidr_block, 8, count.index)
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

---

## 2. Missing IMDSv2 enforcement on EC2

### Symptoms
- Instance had no `metadata_options`; integration expects IMDSv2.

### Fix
```hcl
metadata_options {
  http_tokens = "required"
}
```

### Why it matters
- Hardens instance metadata access.
- Explicitly validated in tests.

---

## 3. Wrong security-group rule resources (shape mismatch with unit tests)

### Symptoms
- Used `aws_security_group_rule` or inline ingress.
- Unit tests look for specific SG resources.

### Fix
```hcl
resource "aws_security_group" "web" {
  vpc_id = aws_vpc.this.id
  egress { 
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.web.id
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each          = toset(var.ssh_cidrs)
  security_group_id = aws_security_group.web.id
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  cidr_ipv4         = each.value
}
```

---

## 4. SSH gating implemented with count (not for_each)

### Symptoms
- Prior version gated SSH with `count`.

### Fix
- Use `for_each = toset(var.ssh_cidrs)` on the SSH ingress rule to match tests and make SSH truly optional per CIDR.

---

## 5. Inline IAM policy and overbroad permissions

### Symptoms
- Used `aws_iam_role_policy` inline.
- Permissions too broad.

### Fix (split model + least-privilege)
```hcl
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"
    principals { 
      type        = "Service" 
      identifiers = ["ec2.amazonaws.com"] 
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ec2_role" {
  name_prefix        = "tap-ec2-role-"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

data "aws_iam_policy_document" "ec2_s3_rw" {
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.app.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.app.arn}/*"]
  }
}

resource "aws_iam_policy" "ec2_s3_rw" {
  name_prefix = "tap-ec2-s3-rw-"
  policy      = data.aws_iam_policy_document.ec2_s3_rw.json
}

resource "aws_iam_role_policy_attachment" "attach_rw" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_s3_rw.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "tap-ec2-profile-"
  role        = aws_iam_role.ec2_role.name
}
```

---

## 6. IAM name collisions in CI (EntityAlreadyExists)

### Symptoms
- Fixed names like `tap-ec2-role` collided across concurrent or repeated runs.

### Fix
- Use `name_prefix` for IAM role, policy, and instance profile (see above).
- S3 bucket already uses a random suffix for uniqueness.

---

## 7. S3 posture incomplete

### Symptoms
- Missing versioning, SSE AES256, public-access block, or force_destroy.

### Fix
```hcl
resource "random_id" "bucket" { byte_length = 4 }

resource "aws_s3_bucket" "app" {
  bucket        = "tap-${var.environment}-${random_id.bucket.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id
  rule { 
    apply_server_side_encryption_by_default { 
      sse_algorithm = "AES256" 
    } 
  }
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket                  = aws_s3_bucket.app.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

---

## 8. User data embedded directly in the instance

### Symptoms
- `user_data` inline on the instance; unit tests expect a `locals.user_data` heredoc referenced by the instance.

### Fix
```hcl
locals {
  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    echo "ENVIRONMENT=${var.environment}" > /etc/profile.d/env.sh
    echo "DEBUG=${local.debug}" >> /etc/profile.d/env.sh
    echo "LOG_LEVEL=${local.log_level}" >> /etc/profile.d/env.sh
    echo "BUCKET=${aws_s3_bucket.app.bucket}" >> /etc/profile.d/env.sh
    dnf install -y python3 || yum install -y python3
    mkdir -p /var/www/html
    {
      echo "ENVIRONMENT=${var.environment}"
      echo "DEBUG=${local.debug}"
      echo "LOG_LEVEL=${local.log_level}"
      echo "BUCKET=${aws_s3_bucket.app.bucket}"
    } > /var/www/html/index.html
    nohup python3 -m http.server 80 --directory /var/www/html >/var/log/http.log 2>&1 &
  EOT
}

resource "aws_instance" "web" {
  # ...
  user_data = local.user_data
}
```

---

## 9. Region handling drift

### Symptoms
- Early drafts hardcoded or defaulted the region.

### Fix
```hcl
variable "aws_region" {
  type        = string
  description = "AWS region for all resources. Must be provided externally."
  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "This stack is restricted to us-west-2 by policy."
  }
}
```

---

## 10. Tags missing or inconsistent

### Symptoms
- Required tag `"iac-rlhf-amazon" = "true"` missing or not merged everywhere.

### Fix
```hcl
variable "tags" { 
  type    = map(string)
  default = {} 
}

locals {
  base_tags = {
    "iac-rlhf-amazon" = "true"
    Project           = "tap"
    Environment       = var.environment
    ManagedBy         = "terraform"
  }
  tags = merge(local.base_tags, var.tags)
}
# Use `tags = merge(local.tags, { Name = "..." })` on all taggable resources.
```

---

## 11. Missing outputs required by tooling

### Symptoms
- Omitted instance_id, instance_public_ip, vpc_id, web_sg_id, etc.

### Fix
```hcl
output "environment"        { value = var.environment }
output "bucket_name"        { value = aws_s3_bucket.app.bucket }
output "instance_id"        { value = aws_instance.web.id }
output "instance_public_ip" { value = aws_instance.web.public_ip }
output "instance_type"      { value = aws_instance.web.instance_type }
output "vpc_id"             { value = aws_vpc.this.id }
output "web_sg_id"          { value = aws_security_group.web.id }
```

---

## Summary of Improvements

| Area | Before (Problem) | After (Fix) |
|------|------------------|-------------|
| VPC & networking | Default VPC; no IGW/RT/assoc | Custom VPC (10.0.0.0/16), 2 public subnets, IGW, RT, associations |
| EC2 IMDS | Not enforced | `metadata_options.http_tokens = "required"` |
| SG rules | Wrong resource types | `aws_vpc_security_group_ingress_rule` for HTTP & SSH |
| SSH ingress | `count` on list | `for_each = toset(var.ssh_cidrs)` |
| IAM policy | Inline and broad | Split doc/policy/attachment; least-privilege on bucket and bucket/* |
| IAM names | Fixed → collisions | `name_prefix` on IAM resources; random S3 suffix |
| S3 posture | Incomplete | Versioning, AES256 SSE, Public Access Block, `force_destroy` |
| User data | Inline | `locals.user_data` + `user_data = local.user_data` |
| Region | Hardcoded/defaulted | `var.aws_region` (no default); CI sets it; optional validation |
| Tags | Inconsistent | Global `local.tags` merge; includes `iac-rlhf-amazon` |
| Outputs | Missing | All required outputs present |

---

## Verification

- Run `terraform fmt` and `terraform validate`
- Unit tests: regex checks for SG/IAM/S3/user_data/tags/outputs
- Integration tests: live checks (IMDSv2 required, HTTP served from user data, S3 posture)
- CI Deploy: backend/provider supplied externally; IAM collisions avoided via `name_prefix`

---

## Final Note

All changes are surgical to align the implementation with the prompt and tests, keeping the stack portable, secure, and CI-friendly.
