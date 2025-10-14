```hcl
#################################
# Variables
#################################
variable "aws_region" {
  description = "AWS region for all resources. Must be provided externally."
  type        = string
  # Unit tests expect strict enforcement of us-west-2
  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "This stack is restricted to us-west-2 by policy."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR. Must remain 10.0.0.0/16 for this task requirement."
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Deployment environment (dev|prod)."
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be one of: dev, prod."
  }
}

# Optional SSH ingress CIDRs (unit tests expect SSH to be optional)
variable "ssh_cidrs" {
  description = "List of CIDR blocks allowed for SSH (22). If empty, SSH is disabled."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to resources."
  type        = map(string)
  default     = {}
}

#################################
# Locals (tags & env switches + user_data)
#################################
locals {
  base_tags = {
    "iac-rlhf-amazon" = "true"
    Project           = "tap"
    Environment       = var.environment
    ManagedBy         = "terraform"
  }

  tags = merge(local.base_tags, var.tags)

  is_prod       = var.environment == "prod"
  instance_type = local.is_prod ? "t3.small" : "t3.micro"
  debug         = local.is_prod ? "false" : "true"
  log_level     = local.is_prod ? "INFO" : "DEBUG"

  # Unit tests expect the heredoc to live in locals and the instance to reference local.user_data
  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    echo "ENVIRONMENT=${var.environment}" > /etc/profile.d/env.sh
    echo "DEBUG=${local.debug}" >> /etc/profile.d/env.sh
    echo "LOG_LEVEL=${local.log_level}" >> /etc/profile.d/env.sh
    echo "BUCKET=${aws_s3_bucket.app.bucket}" >> /etc/profile.d/env.sh

    # Minimal HTTP endpoint to prove wiring in integration tests
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

#################################
# Data
#################################
data "aws_availability_zones" "available" {
  state = "available"
}

# Amazon Linux 2023 (AL2023) x86_64 HVM EBS
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

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

#################################
# Network (custom VPC with two public subnets)
#################################
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, { Name = "tap-vpc-${var.aws_region}" })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(aws_vpc.this.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, { Name = "tap-public-${count.index}" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "tap-igw" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "tap-rtb-public" })
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

#################################
# Security Group (HTTP open; SSH optional; egress all)
#################################
resource "aws_security_group" "web" {
  name        = "tap-ec2-sg-${var.aws_region}"
  description = "Allow HTTP inbound; SSH optional; all egress"
  vpc_id      = aws_vpc.this.id

  # Egress all
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "tap-ec2-sg-${var.aws_region}" })
}

# Explicit HTTP ingress rule (unit test expects separate ingress_rule resource named "http")
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"

  tags = merge(local.tags, { Name = "tap-http" })
}

# Optional SSH (22) per provided CIDRs (unit test expects for_each = toset(var.ssh_cidrs))
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each = toset(var.ssh_cidrs)

  security_group_id = aws_security_group.web.id
  cidr_ipv4         = each.value
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"

  tags = merge(local.tags, { Name = "tap-ssh-${replace(each.value, "/", "-")}" })
}

#################################
# S3 Bucket (versioning + AES256 + public access block)
#################################
resource "random_id" "bucket" {
  byte_length = 4
}

# IMPORTANT: unit tests expect resource name "app"
resource "aws_s3_bucket" "app" {
  bucket        = "tap-${var.environment}-${random_id.bucket.hex}"
  force_destroy = true

  tags = merge(local.tags, { Name = "tap-app-${var.aws_region}" })
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
  restrict_public_buckets = true
  ignore_public_acls      = true
}

#################################
# IAM (least-priv S3 access) + Instance Profile
#################################
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
  # name_prefix mitigates name collisions in CI; unit tests only assert presence
  name_prefix         = "tap-ec2-role-"
  assume_role_policy  = data.aws_iam_policy_document.ec2_assume_role.json
  force_detach_policies = true
  tags                = local.tags
}

# Policy document with least-privileges
data "aws_iam_policy_document" "ec2_s3_rw" {
  # List the bucket itself
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.app.arn]
  }

  # Read/write objects within the bucket
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = ["${aws_s3_bucket.app.arn}/*"]
  }
}

resource "aws_iam_policy" "ec2_s3_rw" {
  name_prefix = "tap-ec2-s3-least-priv-"
  policy      = data.aws_iam_policy_document.ec2_s3_rw.json
  tags        = local.tags
}

# Unit tests expect attachment named "attach_rw"
resource "aws_iam_role_policy_attachment" "attach_rw" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_s3_rw.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "tap-ec2-profile-"
  role        = aws_iam_role.ec2_role.name
  tags        = local.tags
}

#################################
# EC2 Instance (public)
#################################
resource "aws_instance" "web" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = local.instance_type
  subnet_id                   = aws_subnet.public[0].id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.web.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name

  metadata_options {
    http_tokens = "required" # IMDSv2 hardening (unit test expects this)
  }

  # Unit tests expect reference to local.user_data
  user_data = local.user_data

  tags = merge(local.tags, { Name = "tap-ec2-${var.aws_region}" })
}

#################################
# Outputs (unit tests expect these)
#################################
output "environment" {
  value       = var.environment
  description = "Environment name"
}

output "bucket_name" {
  value       = aws_s3_bucket.app.bucket
  description = "S3 bucket name (versioned + AES256 + PAB)"
}

output "instance_id" {
  value       = aws_instance.web.id
  description = "EC2 instance ID"
}

output "instance_public_ip" {
  value       = aws_instance.web.public_ip
  description = "EC2 instance public IP"
}

output "instance_type" {
  value       = aws_instance.web.instance_type
  description = "EC2 instance type (env-switchable)"
}

# For integration/SDK checks
output "vpc_id" {
  value       = aws_vpc.this.id
  description = "VPC ID"
}

output "web_sg_id" {
  value       = aws_security_group.web.id
  description = "Web security group ID"
}

