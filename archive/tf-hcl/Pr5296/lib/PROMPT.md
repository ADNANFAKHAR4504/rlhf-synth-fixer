# Role
You are a senior Terraform engineer. Produce production-grade, readable, and *self-contained* Terraform files that strictly follow the instructions below. Do any internal reasoning silently; **do not** include explanations—only the requested files as code blocks.

# Goal
Create a **brand-new** AWS stack that enforces **multi-environment consistency** across **dev, staging, prod** with an identical topology (VPC, ALB, ASG, RDS). Only approved diffs per environment are allowed:
- Allowed diffs: `instance_type`, `allocated_storage`, and the `Environment` tag value.
- Everything else (resource counts/types/topology) must be identical across environments.

# Files to output (exactly four)
Output **only** these four files as separate fenced code blocks, in this order:
1) `tap_stack.tf` — single file containing **all variable declarations, locals, resources, and outputs**. No external modules.
2) `tap_stack.tfvars` — shared defaults/common values for all envs.
3) `dev.tfvars`
4) `staging.tfvars`
5) `prod.tfvars`

> Note: **Do not output `provider.tf`** (I already have it). It uses `var.aws_region`. You must still **declare** `variable "aws_region"` in `tap_stack.tf` so the `*.tfvars` files can set it.

# Constraints & best practices
- **No `module` blocks** and no registry modules; define all resources directly in `tap_stack.tf`.
- Terraform: `required_version >= 1.5`; AWS provider `~> 5.0`.
- Use **two AZs** via `data "aws_availability_zones"`; create: 1 VPC, 2 public subnets, 2 private subnets, 1 Internet Gateway, **1 NAT Gateway** (shared), route tables & associations.
- ALB in public subnets; Target Group (HTTP:80) + Listener (HTTP:80).
- Launch Template + Auto Scaling Group in **private** subnets (desired=2, min=2, max=4; constant across envs).
- RDS PostgreSQL (same engine/version across envs), private subnets, not publicly accessible, Multi-AZ **disabled** (constant).
- Security groups:
  - ALB SG: allow 80 from `0.0.0.0/0`.
  - App SG: allow 80 **from ALB SG** only.
  - DB SG: allow 5432 **from App SG** only.
- Tagging: merge `common_tags` with `{ Environment = title(var.env) }`; apply to all resources.
- Naming: `${var.name}-${var.env}-<component>`.
- Keep AMIs region-portable with a data source for Amazon Linux 2023 (latest HVM x86_64).
- Validate `var.env` ∈ `{dev, staging, prod}`; surface helpful errors.
- Keep topology identical; **only** `instance_type`, `allocated_storage`, and `tags.Environment` may vary by env.

# Variables & I/O requirements
Include **all** variable declarations in `tap_stack.tf`, including:
- `env` (string; validation for dev/staging/prod)
- `aws_region` (string; used by existing `provider.tf`)
- `name` (service/project name)
- `vpc_cidr`, `public_subnet_cidrs` (list(string)), `private_subnet_cidrs` (list(string))
- `instance_type_per_env` (map(string)) — t3 family defaults ok
- `db_allocated_storage_per_env` (map(number))
- `db_engine_version` (string; pin exact version)
- `common_tags` (map(string), default `{}`)
Emit **useful outputs**: VPC ID, public/private subnet IDs, ALB ARN & DNS name, Target Group ARN, ASG name, RDS endpoint & ARN, Security Group IDs.

# Consistency guardrails (encode in code)
- Use locals to derive `local.instance_type = var.instance_type_per_env[var.env]` and `local.db_allocated = var.db_allocated_storage_per_env[var.env]`.
- Keep constant counts for subnets, route tables, NAT, ASG capacity bounds, RDS multi_az flag, etc.





Content details to implement
tap_stack.tf (single-file stack)



variable blocks for all inputs listed above (with validations & sensible defaults).

provider "aws" is not in this file (exists in my provider.tf), but you may reference var.aws_region where needed (e.g., AZ data).

data "aws_availability_zones" "this" — pick first two AZs.

data "aws_ami" "al2023" — latest Amazon Linux 2023 (owners amazon, filters for al2023-ami-*, HVM, x86_64).

Networking:

aws_vpc (DNS hostnames on).

2 x aws_subnet public, 2 x private.

aws_internet_gateway.

1 x aws_eip (for NAT), aws_nat_gateway in public subnet[0].

aws_route_table public + assoc to both public subnets (0.0.0.0/0 → IGW).

aws_route_table private + assoc to both private subnets (0.0.0.0/0 → NAT).

Security groups as specified.

ALB: aws_lb, aws_lb_target_group (HTTP 80, health_check /), aws_lb_listener (forward to TG).

Compute:

aws_launch_template with image_id = data.aws_ami.al2023.id, instance_type = local.instance_type, and the App SG.

aws_autoscaling_group in private subnets, attach TG; capacity constants identical across envs.

Database:

aws_db_subnet_group referencing private subnets.

aws_db_instance Postgres with engine_version = var.db_engine_version, allocated_storage = local.db_allocated, instance_class fixed (e.g., db.t3.medium), publicly_accessible = false, multi_az = false, skip_final_snapshot = true.

Tags: apply merge(var.common_tags, { Environment = title(var.env) }) to all resources.

Outputs as listed.

tap_stack.tfvars (shared defaults)

Provide sane defaults:

name = "gaming-platform"

vpc_cidr = "10.10.0.0/16"

public_subnet_cidrs = ["10.10.0.0/24","10.10.1.0/24"]

private_subnet_cidrs = ["10.10.10.0/24","10.10.11.0/24"]

db_engine_version = "16.3" (pin exact)

common_tags = { Owner = "platform-team", CostCenter = "core" }

Maps for per-env values (used by all envs):

instance_type_per_env = { dev = "t3.small", staging = "t3.medium", prod = "t3.large" }

db_allocated_storage_per_env = { dev = 20, staging = 50, prod = 100 }

dev.tfvars / staging.tfvars / prod.tfvars

Each must only set:

env (one of dev|staging|prod)

aws_region (per environment, e.g., us-east-1, us-east-2, us-west-2)

Acceptance checks (implicit)

Running terraform plan -var-file=tap_stack.tfvars -var-file=dev.tfvars vs staging/prod should show identical resource counts/types, with diffs only in:

aws_launch_template.instance_type

aws_db_instance.allocated_storage

tags.Environment