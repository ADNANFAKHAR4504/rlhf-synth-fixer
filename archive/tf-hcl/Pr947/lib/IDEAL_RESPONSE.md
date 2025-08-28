```hcl
# tap_stack.tf

########################
# Variables
########################
variable "aws_region" {
  description = "AWS region to deploy resources (used by existing provider.tf)."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix used for resource naming."
  type        = string
  default     = "iac-nova"
}

variable "allowed_cidrs" {
  description = "List of CIDR ranges allowed to access web-tier on ports 80/443."
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Deployment environment tag (e.g., dev, prod)."
  type        = string
  default     = "dev"
}

variable "multi_az" {
  description = "Whether to enable Multi-AZ for RDS."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection on RDS."
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "nat_per_az" {
  description = "If true, create one NAT Gateway per AZ; otherwise a single shared NAT."
  type        = bool
  default     = false
}

variable "rds_engine" {
  description = "RDS engine to use (postgres or mysql)."
  type        = string
  default     = "postgres"
}

variable "rds_engine_version" {
  description = "RDS engine version."
  type        = string
  default     = null
}

variable "rds_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Allocated storage size (GiB) for RDS."
  type        = number
  default     = 20
}

variable "cw_log_retention_days" {
  description = "CloudWatch Log retention for VPC flow logs."
  type        = number
  default     = 30
}

########################
# Locals & Data Sources
########################
locals {
  name_prefix = "${var.project_name}-${var.environment}-${var.aws_region}"

  tags = {
    Project     = "IaC - AWS Nova Model Breaking"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnet_config = {
    for idx, az in local.azs : tostring(idx) => {
      az   = az
      cidr = cidrsubnet(var.vpc_cidr, 8, idx)
    }
  }

  private_subnet_config = {
    for idx, az in local.azs : tostring(idx) => {
      az   = az
      cidr = cidrsubnet(var.vpc_cidr, 8, idx + 10)
    }
  }

  db_port = var.rds_engine == "postgres" ? 5432 : 3306
}
########################
# Random (for S3 uniqueness and DB password)
########################
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "random_password" "db" {
  length           = 20
  special          = true
  override_special = "!#-%@_+"
}
########################
# Networking - VPC, Routes, NAT
########################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  for_each                = local.public_subnet_config
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  tags = merge(local.tags, { Name = "${local.name_prefix}-public-${each.key}", Tier = "public" })
}

resource "aws_subnet" "private" {
  for_each          = local.private_subnet_config
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags = merge(local.tags, { Name = "${local.name_prefix}-private-${each.key}", Tier = "private" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

locals { nat_keys = var.nat_per_az ? keys(aws_subnet.public) : ["0"] }

resource "aws_eip" "nat" {
  for_each = { for k in local.nat_keys : k => true }
  domain   = "vpc"
  tags     = merge(local.tags, { Name = "${local.name_prefix}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "this" {
  for_each      = aws_eip.nat
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  depends_on    = [aws_internet_gateway.igw]
  tags          = merge(local.tags, { Name = "${local.name_prefix}-nat-${each.key}" })
}

resource "aws_route_table" "private" {
  for_each = var.nat_per_az ? local.private_subnet_config : { "all" = {} }
  vpc_id   = aws_vpc.main.id
  tags     = merge(local.tags, { Name = "${local.name_prefix}-private-rt${var.nat_per_az ? "-${each.key}" : ""}" })
}

resource "aws_route" "private_to_nat" {
  for_each               = var.nat_per_az ? local.private_subnet_config : { "all" = {} }
  route_table_id         = var.nat_per_az ? aws_route_table.private[each.key].id : aws_route_table.private["all"].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.nat_per_az ? aws_nat_gateway.this[each.key].id : aws_nat_gateway.this["0"].id
}

resource "aws_route_table_association" "private" {
  for_each       = local.private_subnet_config
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = var.nat_per_az ? aws_route_table.private[each.key].id : aws_route_table.private["all"].id
}
########################
# CloudWatch & VPC Flow Logs
########################
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.name_prefix}-flow-logs"
  retention_in_days = var.cw_log_retention_days
  tags              = merge(local.tags, { Name = "${local.name_prefix}-vpc-flow-logs" })
}

data "aws_iam_policy_document" "flow_logs_assume" {
  statement {
    effect = "Allow"
    principals { type = "Service", identifiers = ["vpc-flow-logs.amazonaws.com"] }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  name               = "${local.name_prefix}-vpc-flow-logs-role"
  assume_role_policy = data.aws_iam_policy_document.flow_logs_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "flow_logs" {
  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"]
  }
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name   = "${local.name_prefix}-vpc-flow-logs-policy"
  role   = aws_iam_role.vpc_flow_logs.id
  policy = data.aws_iam_policy_document.flow_logs.json
}

resource "aws_flow_log" "vpc" {
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  tags                 = local.tags
}
########################
# Security Groups
########################
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Web-tier security group (80/443 only from allowed CIDRs)"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-web-sg" })
}

resource "aws_security_group_rule" "web_http" {
  for_each          = toset(var.allowed_cidrs)
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = [each.value]
  security_group_id = aws_security_group.web.id
  description       = "HTTP from ${each.value}"
}

resource "aws_security_group_rule" "web_https" {
  for_each          = toset(var.allowed_cidrs)
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [each.value]
  security_group_id = aws_security_group.web.id
  description       = "HTTPS from ${each.value}"
}

resource "aws_security_group" "db" {
  name        = "${local.name_prefix}-db-sg"
  description = "DB security group (db port only from web SG)"
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.tags, { Name = "${local.name_prefix}-db-sg" })
}

resource "aws_security_group_rule" "db_from_web" {
  type                     = "ingress"
  from_port                = local.db_port
  to_port                  = local.db_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  security_group_id        = aws_security_group.db.id
  description              = "DB access from web SG"
}
########################
# S3 (Private, TLS-only, SSE-S3)
########################
resource "aws_s3_bucket" "app" {
  bucket = "${local.name_prefix}-app-${random_id.bucket_suffix.hex}"
  tags   = merge(local.tags, { Name = "${local.name_prefix}-app" })
}

resource "aws_s3_bucket_ownership_controls" "app" {
  bucket = aws_s3_bucket.app.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

resource "aws_s3_bucket_acl" "app" {
  bucket     = aws_s3_bucket.app.id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.app]
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket                  = aws_s3_bucket.app.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
    bucket_key_enabled = true
  }
}

data "aws_iam_policy_document" "app_bucket_policy" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals { type = "*", identifiers = ["*"] }
    resources = [aws_s3_bucket.app.arn, "${aws_s3_bucket.app.arn}/*"]
    condition {
      bool { variable = "aws:SecureTransport", values = ["false"] }
    }
  }

  statement {
    sid     = "DenyAnonymousRequests"
    effect  = "Deny"
    actions = ["s3:*"]
    principals { type = "*", identifiers = ["*"] }
    resources = [aws_s3_bucket.app.arn, "${aws_s3_bucket.app.arn}/*"]
    condition {
      string_equals { variable = "aws:PrincipalType", values = ["Anonymous"] }
    }
  }
}

resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id
  policy = data.aws_iam_policy_document.app_bucket_policy.json
}
########################
# IAM - Application Role (Least Privilege)
########################
data "aws_iam_policy_document" "app_assume" {
  statement {
    effect = "Allow"
    principals { type = "Service", identifiers = ["ec2.amazonaws.com"] }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "app" {
  name               = "${local.name_prefix}-app-role"
  assume_role_policy = data.aws_iam_policy_document.app_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "app_policy" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.app.arn}/app-data/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "${local.name_prefix}-app-policy"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app_policy.json
}
########################
# RDS - Private, Encrypted
########################
resource "aws_db_subnet_group" "db" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [for k, s in aws_subnet.private : s.id]
  tags       = merge(local.tags, { Name = "${local.name_prefix}-db-subnet-group" })
}

resource "aws_security_group_rule" "db_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.db.id
  description       = "All outbound traffic from DB SG"
}

resource "aws_db_instance" "db" {
  identifier              = "${local.name_prefix}-db"
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  storage_encrypted       = true
  db_name                 = "appdb"
  username                = "dbadmin"
  password                = random_password.db.result
  vpc_security_group_ids  = [aws_security_group.db.id]
  db_subnet_group_name    = aws_db_subnet_group.db.name
  publicly_accessible     = false
  multi_az                = var.multi_az
  deletion_protection     = var.deletion_protection
  backup_retention_period = 7
  maintenance_window      = "sun:04:00-sun:05:00"
  backup_window           = "03:00-04:00"
  skip_final_snapshot     = true
  tags                    = merge(local.tags, { Name = "${local.name_prefix}-db" })
}
########################
# Outputs
########################
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]
  description = "Private subnet IDs"
}

output "web_sg_id" {
  value       = aws_security_group.web.id
  description = "Web security group ID"
}

output "db_sg_id" {
  value       = aws_security_group.db.id
  description = "DB security group ID"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.app.bucket
  description = "S3 bucket name"
}

output "rds_endpoint" {
  value       = aws_db_instance.db.endpoint
  description = "RDS instance endpoint"
}

output "iam_flow_logs_role_arn" {
  value       = aws_iam_role.vpc_flow_logs.arn
  description = "VPC Flow Logs IAM role ARN"
}

output "iam_app_role_arn" {
  value       = aws_iam_role.app.arn
  description = "Application IAM role ARN"
}
```

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Backend configured externally during init
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

### Explanation & Mapping

- **S3 Privacy**: `aws_s3_bucket_public_access_block.app` blocks public access; `aws_s3_bucket_acl.app` sets private ACL; `aws_s3_bucket_server_side_encryption_configuration.app` enforces SSE-S3 (`AES256`); `aws_s3_bucket_policy.app` denies non-TLS and anonymous requests.
- **IAM Least Privilege**: `aws_iam_role.vpc_flow_logs` + `aws_iam_role_policy.vpc_flow_logs` limited to specific log group; `aws_iam_role.app` + `aws_iam_role_policy.app` scoped to `s3:GetObject` on `app-data/*` and CloudWatch logs actions.
- **RDS Encryption at Rest**: `aws_db_instance.db` with `storage_encrypted = true`, `publicly_accessible = false`, `multi_az` and `deletion_protection` driven by variables; placed in private subnets via `aws_db_subnet_group.db`.
- **VPC Flow Logs**: `aws_flow_log.vpc` delivers to `aws_cloudwatch_log_group.vpc_flow_logs` (retention via `cw_log_retention_days`).
- **Strict Security Groups**: `aws_security_group.web` with rules `web_http` and `web_https` only from `var.allowed_cidrs`; `aws_security_group.db` rule `db_from_web` allows only DB port from web SG.
- **Required Architecture**: `aws_vpc.main`, two public and two private subnets (`aws_subnet.public/private`), IGW (`aws_internet_gateway.igw`), NAT GW(s) (`aws_nat_gateway.this`) with per-AZ toggle `nat_per_az`, route tables for public/private, RDS in private subnets, IAM roles, S3 bucket.
- **Tags**: All resources include `Project`, `ManagedBy`, and `Environment` via `local.tags`.
- **Outputs**: VPC ID, subnet IDs, SG IDs, S3 bucket name, RDS endpoint, and IAM role ARNs.
