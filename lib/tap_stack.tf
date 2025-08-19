############################################
# tap_stack.tf
# Production-grade Terraform (single file)
# - VPC (10.0.0.0/16), 1 public + 2 private subnets, IGW, NAT, routes
# - Bastion EC2 (public) with SSH allowed only from allowed_ssh_cidr
# - Private EC2 (no public IP) with SSH allowed only from Bastion SG
# - S3 app bucket (versioned, SSE-KMS with CMK alias/prod-app-kms, strict policy)
# - IAM role/profile for EC2 → S3 (least-privilege + KMS permissions)
# - Detailed monitoring on EC2
# - Uniform tagging with Environment=Prod
############################################

############################################
# Variables
############################################
variable "aws_region" {
  type        = string
  description = "AWS region used by provider.tf"
  default     = "us-east-1"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to bastion (e.g. 203.0.113.10/32)"
  type        = string

  validation {
    condition     = can(cidrnetmask(var.allowed_ssh_cidr)) && var.allowed_ssh_cidr != "0.0.0.0/0"
    error_message = "Provide a valid CIDR (e.g., 203.0.113.10/32). 0.0.0.0/0 is not allowed."
  }
}


variable "public_subnet_cidr" {
  type        = string
  description = "Public subnet CIDR"
  default     = "10.0.0.0/24"
  validation {
    condition     = can(cidrnetmask(var.public_subnet_cidr))
    error_message = "public_subnet_cidr must be a valid CIDR."
  }
}

variable "private_subnet1_cidr" {
  type        = string
  description = "Private subnet 1 CIDR"
  default     = "10.0.1.0/24"
  validation {
    condition     = can(cidrnetmask(var.private_subnet1_cidr))
    error_message = "private_subnet1_cidr must be a valid CIDR."
  }
}

variable "private_subnet2_cidr" {
  type        = string
  description = "Private subnet 2 CIDR"
  default     = "10.0.2.0/24"
  validation {
    condition     = can(cidrnetmask(var.private_subnet2_cidr))
    error_message = "private_subnet2_cidr must be a valid CIDR."
  }
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR allowed to SSH to bastion (e.g. 203.0.113.10/32)"
  validation {
    condition     = can(cidrnetmask(var.allowed_ssh_cidr))
    error_message = "allowed_ssh_cidr must be a valid CIDR string."
  }
}

variable "bastion_key_name" {
  type        = string
  description = "Key pair name for bastion. If bastion_ssh_public_key is set, a new key pair with this name is created; otherwise an existing key with this name is used."
  default     = "prod-bastion-key"
}

variable "bastion_ssh_public_key" {
  type        = string
  description = "SSH public key to create the bastion key pair. Leave empty to use an existing key pair by name."
  default     = ""
}

variable "owner" {
  type        = string
  description = "Owner tag value"
  default     = "platform-team"
}

############################################
# Locals & Data
############################################
locals {
  env         = "prod"
  name_prefix = local.env

  common_tags = {
    Environment = "Prod"
    Owner       = var.owner
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

############################################
# Networking
############################################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet"
  })
}

resource "aws_subnet" "private_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet1_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-1"
  })
}

resource "aws_subnet" "private_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet2_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-2"
  })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "nat" {
  subnet_id     = aws_subnet.public.id
  allocation_id = aws_eip.nat.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt"
  })
}

resource "aws_route" "private_default" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_assoc_1" {
  route_table_id = aws_route_table.private.id
  subnet_id      = aws_subnet.private_1.id
}

resource "aws_route_table_association" "private_assoc_2" {
  route_table_id = aws_route_table.private.id
  subnet_id      = aws_subnet.private_2.id
}

############################################
# KMS (App CMK)
############################################
resource "aws_kms_key" "app" {
  description         = "CMK for app S3 encryption"
  enable_key_rotation = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-kms-key"
  })
}

resource "aws_kms_alias" "app" {
  name          = "alias/prod-app-kms"
  target_key_id = aws_kms_key.app.key_id
}

############################################
# S3 Application Bucket (versioned, SSE-KMS, block public)
############################################
locals {
  app_bucket_name = lower("${local.name_prefix}-app-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}")
}

resource "aws_s3_bucket" "app" {
  bucket = local.app_bucket_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket                  = aws_s3_bucket.app.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.app.arn
    }
  }
}

data "aws_iam_policy_document" "s3_app_policy" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_s3_bucket.app.arn,
      "${aws_s3_bucket.app.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid     = "DenyUnencryptedObjectUploads"
    effect  = "Deny"
    actions = ["s3:PutObject"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = ["${aws_s3_bucket.app.arn}/*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }

  statement {
    sid     = "DenyIncorrectKMSKey"
    effect  = "Deny"
    actions = ["s3:PutObject"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = ["${aws_s3_bucket.app.arn}/*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
      values   = [aws_kms_key.app.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id
  policy = data.aws_iam_policy_document.s3_app_policy.json
}

############################################
# IAM for EC2 → S3 (least privilege + KMS)
############################################
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "private_ec2" {
  name               = "${local.name_prefix}-private-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-ec2-role"
  })
}

data "aws_iam_policy_document" "private_ec2_s3_kms" {
  statement {
    sid     = "ListBucket"
    effect  = "Allow"
    actions = ["s3:ListBucket"]
    resources = [
      aws_s3_bucket.app.arn
    ]
  }

  statement {
    sid     = "ObjectCrudInPrefix"
    effect  = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts"
    ]
    resources = ["${aws_s3_bucket.app.arn}/app/*"]
  }

  # KMS permissions required for SSE-KMS object operations
  statement {
    sid     = "KmsUseKeyForS3Objects"
    effect  = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.app.arn]
  }
}

resource "aws_iam_role_policy" "private_ec2" {
  name   = "${local.name_prefix}-private-ec2-s3-policy"
  role   = aws_iam_role.private_ec2.id
  policy = data.aws_iam_policy_document.private_ec2_s3_kms.json
}

resource "aws_iam_instance_profile" "private_ec2" {
  name = "${local.name_prefix}-private-ec2-profile"
  role = aws_iam_role.private_ec2.name
}

############################################
# Security Groups
############################################
resource "aws_security_group" "bastion" {
  name        = "${local.name_prefix}-bastion-sg"
  description = "Allow SSH from allowed CIDR to bastion"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-sg"
  })
}

resource "aws_security_group" "private" {
  name        = "${local.name_prefix}-private-sg"
  description = "Allow SSH only from bastion"
  vpc_id      = aws_vpc.main.id

  # Use source_security_group_id to restrict SSH to bastion SG
  ingress {
    description              = "SSH from bastion SG"
    from_port                = 22
    to_port                  = 22
    protocol                 = "tcp"
    source_security_group_id = aws_security_group.bastion.id
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-sg"
  })
}

############################################
# AMI (Amazon Linux 2)
############################################
data "aws_ami" "al2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

############################################
# Bastion Key Pair (optional create)
############################################
resource "aws_key_pair" "bastion" {
  count      = var.bastion_ssh_public_key != "" ? 1 : 0
  key_name   = var.bastion_key_name
  public_key = var.bastion_ssh_public_key

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-key"
  })
}

locals {
  bastion_key_name_effective = var.bastion_ssh_public_key != "" ? aws_key_pair.bastion[0].key_name : var.bastion_key_name
}

############################################
# Bastion Instance (Public)
############################################
locals {
  bastion_user_data = <<-EOT
    #!/bin/bash
    set -euo pipefail
    yum update -y
    # Harden SSH (disable password auth)
    sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true
    sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true
    systemctl restart sshd
    # (Optional) Install CloudWatch Agent - placeholder
    # yum install -y amazon-cloudwatch-agent
    # /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
  EOT
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.al2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true
  key_name                    = local.bastion_key_name_effective
  monitoring                  = true
  user_data                   = local.bastion_user_data

  root_block_device {
    encrypted = true
    volume_size = 8
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion"
  })
}

############################################
# Private Instance (No public IP)
############################################
locals {
  private_user_data = <<-EOT
    #!/bin/bash
    set -euo pipefail
    yum update -y
    # Harden SSH (disable password auth)
    sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true
    sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true
    systemctl restart sshd
    # (Optional) CloudWatch Agent - placeholder
    # yum install -y amazon-cloudwatch-agent
  EOT
}

resource "aws_instance" "private" {
  ami                         = data.aws_ami.al2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private_1.id
  vpc_security_group_ids      = [aws_security_group.private.id]
  associate_public_ip_address = false
  iam_instance_profile        = aws_iam_instance_profile.private_ec2.name
  monitoring                  = true
  user_data                   = local.private_user_data

  root_block_device {
    encrypted = true
    volume_size = 8
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-ec2"
  })
}

############################################
# Outputs
############################################
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_ids" {
  value = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "igw_id" {
  value = aws_internet_gateway.igw.id
}

output "nat_gateway_id" {
  value = aws_nat_gateway.nat.id
}

output "bastion_instance_id" {
  value = aws_instance.bastion.id
}

output "bastion_public_ip" {
  value = aws_instance.bastion.public_ip
}

output "private_instance_id" {
  value = aws_instance.private.id
}

output "private_instance_profile_arn" {
  value = aws_iam_instance_profile.private_ec2.arn
}

output "private_instance_role_arn" {
  value = aws_iam_role.private_ec2.arn
}

output "s3_app_bucket_name" {
  value = aws_s3_bucket.app.bucket
}

output "s3_app_bucket_arn" {
  value = aws_s3_bucket.app.arn
}

output "kms_app_key_arn" {
  value = aws_kms_key.app.arn
}

