############################################################
# main.tf — Single-file AWS stack (brand new, no external modules)
# All variables, locals, data sources, resources, and outputs live here.
# NOTE: provider.tf should exist separately and use var.aws_region.
############################################################

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region used by provider.tf"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = length(trimspace(var.aws_region)) > 0
    error_message = "aws_region must be a non-empty string."
  }
}

variable "project" {
  description = "Project name (used for namespacing)."
  type        = string
  default     = "sre-stack"

  validation {
    condition     = length(trimspace(var.project)) > 0
    error_message = "project must be a non-empty string."
  }
}

variable "environment" {
  description = "Deployment environment (dev|staging|prod)."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], lower(var.environment))
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR for the new VPC."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR."
  }
}

variable "public_subnet_cidrs" {
  description = "Two /24 CIDRs for public subnets (AZ1, AZ2)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2 && alltrue([for c in var.public_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "public_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "private_subnet_cidrs" {
  description = "Two /24 CIDRs for private subnets (AZ1, AZ2)."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2 && alltrue([for c in var.private_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "private_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "bucket_name" {
  description = "Optional override for the S3 bucket name. If empty, one will be generated."
  type        = string
  default     = ""

  validation {
    condition     = length(trimspace(var.bucket_name)) == 0 || (length(trimspace(var.bucket_name)) >= 3 && length(trimspace(var.bucket_name)) <= 63)
    error_message = "bucket_name must be empty or 3–63 characters."
  }
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH to the instance. If empty, no SSH ingress rule is created."
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for c in var.allowed_ssh_cidrs : can(cidrhost(c, 0))])
    error_message = "Every item in allowed_ssh_cidrs must be a valid CIDR."
  }
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

# Amazon Linux 2023 AMI (x86_64)
data "aws_ami" "al2023" {
  owners      = ["amazon"]
  most_recent = true

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

########################
# Locals (naming, AZs, toggles, tags)
########################

locals {
  env       = lower(var.environment)
  is_dev    = local.env == "dev"
  is_nondev = !local.is_dev

  # Feature toggles
  enable_nat                 = local.is_nondev
  enable_detailed_monitoring = local.is_nondev
  enable_bucket_versioning   = local.is_nondev
  associate_public_ip        = local.is_dev

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # Sanitize for DNS-style names (avoid underscores/spaces)
  project_sanitized = replace(replace(lower(trimspace(var.project)), "_", "-"), " ", "-")
  env_sanitized     = replace(replace(lower(trimspace(local.env)), "_", "-"), " ", "-")

  name_prefix = "${local.project_sanitized}-${local.env_sanitized}"

  # Bucket naming without regex functions (broadly safe):
  # - lowercase
  # - replace underscores/spaces with hyphens
  # - truncate to 63 chars
  bucket_name_raw       = lower(trimspace(var.bucket_name))
  bucket_name_step1     = replace(replace(local.bucket_name_raw, "_", "-"), " ", "-")
  bucket_base_name      = length(local.bucket_name_step1) > 0 ? local.bucket_name_step1 : "${local.name_prefix}-app-bucket"
  effective_bucket_name = substr(local.bucket_base_name, 0, 63)

  common_tags = {
    Project     = var.project
    Environment = local.env
    ManagedBy   = "terraform"
  }
}

########################
# Networking
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public subnets (2)
resource "aws_subnet" "public" {
  for_each = {
    "0" = { cidr = var.public_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.public_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${each.key}"
    Tier = "public"
  })
}

# Private subnets (2)
resource "aws_subnet" "private" {
  for_each = {
    "0" = { cidr = var.private_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.private_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${each.key}"
    Tier = "private"
  })
}

# Public route table with default route to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public"
  })
}

# Associate public subnets to public RT
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# NAT resources (staging/prod only)
resource "aws_eip" "nat" {
  count  = local.enable_nat ? 1 : 0
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "ngw" {
  count         = local.enable_nat ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  # First public subnet
  subnet_id = element([for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id], 0)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat"
  })

  depends_on = [aws_internet_gateway.igw]
}

# Private route tables (one per private subnet). If NAT enabled, add 0.0.0.0/0 via NAT.
resource "aws_route_table" "private" {
  for_each = aws_subnet.private
  vpc_id   = aws_vpc.main.id

  dynamic "route" {
    for_each = local.enable_nat ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.ngw[0].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${each.key}"
  })
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

########################
# Security Group
########################

resource "aws_security_group" "instance" {
  name        = "${local.name_prefix}-sg"
  description = "Instance SG: SSH from allowed CIDRs (if any); all egress."
  vpc_id      = aws_vpc.main.id

  # SSH ingress only when allowed_ssh_cidrs is not empty
  dynamic "ingress" {
    for_each = var.allowed_ssh_cidrs
    content {
      description = "SSH access"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg"
  })
}

########################
# EC2 Instance
########################

# Choose subnet based on environment:
# - dev   -> first PUBLIC subnet, public IP
# - nondev-> first PRIVATE subnet, NO public IP (egress via NAT)
locals {
  public_subnet_ids  = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
  private_subnet_ids = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]
  instance_subnet_id = local.is_dev ? element(local.public_subnet_ids, 0) : element(local.private_subnet_ids, 0)
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = local.instance_subnet_id
  vpc_security_group_ids      = [aws_security_group.instance.id]
  associate_public_ip_address = local.associate_public_ip
  monitoring                  = local.enable_detailed_monitoring

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2"
  })

  depends_on = [
    aws_route_table_association.public,
    aws_route_table_association.private
  ]
}

########################
# S3 Bucket (SSE-S3, block public; versioning only in staging/prod)
########################

resource "aws_s3_bucket" "app" {
  bucket = local.effective_bucket_name
  tags = merge(local.common_tags, {
    Name = local.effective_bucket_name
  })
}

resource "aws_s3_bucket_ownership_controls" "app" {
  bucket = aws_s3_bucket.app.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket = aws_s3_bucket.app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id

  versioning_configuration {
    status = local.enable_bucket_versioning ? "Enabled" : "Suspended"
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (ordered by AZ index)"
  value       = local.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ordered by AZ index)"
  value       = local.private_subnet_ids
}

output "security_group_id" {
  description = "Security Group ID for the instance"
  value       = aws_security_group.instance.id
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "instance_private_ip" {
  description = "EC2 private IP address"
  value       = aws_instance.app.private_ip
}

output "instance_public_ip" {
  description = "EC2 public IP address (only in dev)"
  value       = local.is_dev ? aws_instance.app.public_ip : ""
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app.bucket
}

output "nat_gateway_id" {
  description = "NAT Gateway ID (empty in dev)"
  value       = try(aws_nat_gateway.ngw[0].id, "")
}
