############################################
# tap_stack.tf — Production-grade AWS stack
############################################

#################
# Variables
#################
variable "aws_region" {
  description = "AWS region to deploy resources in. Consumed by provider.tf."
  type        = string
  default     = "us-east-1"
}

variable "project_code" {
  description = "Short code for this project to help make names unique (e.g., 'tap')."
  type        = string
  default     = "tap"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet."
  type        = string
  default     = "10.0.0.0/24"
}

variable "private_subnet1_cidr" {
  description = "CIDR for the first private subnet."
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet2_cidr" {
  description = "CIDR for the second private subnet."
  type        = string
  default     = "10.0.2.0/24"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the bastion host. Example: \"203.0.113.10/32\"."
  type        = string
  default     = "203.0.113.10/32"
}

variable "bastion_key_name" {
  description = "Optional: existing EC2 key pair name to use for the bastion. If empty, a new key pair is created."
  type        = string
  default     = ""
}

variable "bastion_ssh_public_key" {
  description = "Optional: public key material for creating a new key pair. If empty, a key is generated."
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner tag for all resources."
  type        = string
  default     = "platform-team"
}

#################
# Data Sources
#################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux2" {
  owners      = ["amazon"]
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-2.0.*-x86_64-gp2"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

#################
# Random suffixes to guarantee uniqueness
#################
# Global suffix for most named resources (IAM, S3, SGs, KMS alias, etc.)
resource "random_id" "namer" {
  byte_length = 3
}

# Separate small suffix so the generated bastion keypair name still differs if needed
resource "random_id" "key_suffix" {
  byte_length = 2
}

#################
# Locals
#################
locals {
  env           = "prod"
  name_prefix   = local.env
  name_suffix   = random_id.namer.hex
  unique_prefix = "${local.name_prefix}-${var.project_code}-${local.name_suffix}"

  common_tags = {
    Environment = "Prod"
    Owner       = var.owner
  }

  az_a = data.aws_availability_zones.available.names[0]
  az_b = data.aws_availability_zones.available.names[1]

  # Final key name: use provided or create our own unique one
  bastion_key_name_final = var.bastion_key_name != "" ? var.bastion_key_name : "${local.unique_prefix}-bastion-key-${random_id.key_suffix.hex}"

  # Globally-unique S3 bucket name
  app_bucket_name = lower("${local.unique_prefix}-app-${data.aws_caller_identity.current.account_id}-${var.aws_region}")

  # App object prefix
  app_prefix = "app/"
}

#################
# Networking - VPC, Subnets, IGW, NAT, Routes
#################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

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

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = local.az_a
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet"
  })
}

resource "aws_subnet" "private1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet1_cidr
  availability_zone = local.az_a

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-a"
  })
}

resource "aws_subnet" "private2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet2_cidr
  availability_zone = local.az_b

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-b"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

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
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
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

resource "aws_route_table_association" "private_assoc_a" {
  subnet_id      = aws_subnet.private1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_assoc_b" {
  subnet_id      = aws_subnet.private2.id
  route_table_id = aws_route_table.private.id
}

#################
# Security Groups (names include unique suffix)
#################
resource "aws_security_group" "bastion_sg" {
  name        = "${local.unique_prefix}-bastion-sg"
  description = "Allow SSH from allowed CIDR"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-sg"
  })
}

resource "aws_security_group" "app_sg" {
  name        = "${local.unique_prefix}-app-sg"
  description = "Allow SSH from bastion only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion SG only"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

#################
# EC2 Key Pair (Create by default; supports existing if provided)
#################
resource "tls_private_key" "bastion" {
  count     = var.bastion_ssh_public_key == "" && var.bastion_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "bastion" {
  count      = var.bastion_key_name == "" ? 1 : 0
  key_name   = local.bastion_key_name_final
  public_key = var.bastion_ssh_public_key != "" ? var.bastion_ssh_public_key : tls_private_key.bastion[0].public_key_openssh

  tags = merge(local.common_tags, {
    Name = local.bastion_key_name_final
  })
}

#################
# Bastion Host (Public)
#################
resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  associate_public_ip_address = true
  monitoring                  = true
  key_name                    = local.bastion_key_name_final

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail
    yum update -y
    # Harden SSH: disable password auth
    sed -i 's/^#\\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl restart sshd
    # CloudWatch agent (optional):
    # amazon-linux-extras install -y collectd
    # yum install -y amazon-cloudwatch-agent
    # /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:YourParameterOrFile -s
  EOF

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion"
  })
}

#################
# IAM for Private EC2 -> S3 + KMS (all names include unique suffix)
#################
resource "aws_iam_role" "app_role" {
  name = "${local.unique_prefix}-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "EC2Trust",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-role"
  })
}

resource "aws_iam_policy" "app_s3_policy" {
  name        = "${local.unique_prefix}-s3-policy"
  description = "Least-privilege S3 access to application bucket prefix"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "ListBucketRestrictedToPrefix",
        Effect   = "Allow",
        Action   = ["s3:ListBucket"],
        Resource = "arn:aws:s3:::${local.app_bucket_name}",
        Condition = {
          StringLike = {
            "s3:prefix" = ["${local.app_prefix}*"]
          }
        }
      },
      {
        Sid    = "RWOnAppPrefix",
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Resource = "arn:aws:s3:::${local.app_bucket_name}/${local.app_prefix}*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-s3-policy"
  })
}

resource "aws_iam_policy" "app_kms_policy" {
  name        = "${local.unique_prefix}-kms-policy"
  description = "Allow app instance to use CMK for S3 encryption/decryption"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid    = "KMSUse",
      Effect = "Allow",
      Action = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      Resource = aws_kms_key.app.arn
    }]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-kms-policy"
  })
}

resource "aws_iam_role_policy_attachment" "attach_app_s3" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_app_kms" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_kms_policy.arn
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "${local.unique_prefix}-app-instance-profile"
  role = aws_iam_role.app_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-instance-profile"
  })
}

#################
# KMS CMK for S3 (alias includes unique suffix)
#################
resource "aws_kms_key" "app" {
  description             = "CMK for ${local.name_prefix} application data"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "EnableRootPermissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "AllowAppRoleUseOfKey",
        Effect = "Allow",
        Principal = {
          AWS = aws_iam_role.app_role.arn
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-kms-key"
  })
}

resource "aws_kms_alias" "app_alias" {
  name          = "alias/${local.unique_prefix}-app-kms"
  target_key_id = aws_kms_key.app.key_id
}

#################
# S3 Bucket (Versioning, Public Access Block, SSE-KMS, Policy)
#################
resource "aws_s3_bucket" "app" {
  bucket = local.app_bucket_name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-bucket"
  })
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = "Enabled"
  }
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
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "DenyInsecureTransport",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:*",
        Resource = [
          aws_s3_bucket.app.arn,
          "${aws_s3_bucket.app.arn}/*"
        ],
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      },
      {
        Sid       = "DenyIncorrectEncryptionHeader",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.app.arn}/*",
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyWrongKmsKey",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.app.arn}/*",
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.app.arn
          }
        }
      }
    ]
  })
}

#################
# Private EC2 (App Host)
#################
resource "aws_instance" "app" {
  ami                         = data.aws_ami.amazon_linux2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private1.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = false
  monitoring                  = true
  iam_instance_profile        = aws_iam_instance_profile.app_profile.name

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail
    yum update -y
    # Harden SSH: disable password auth
    sed -i 's/^#\\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    systemctl restart sshd
    # Placeholder for app bootstrap...
    # CloudWatch agent hints (optional)
    # yum install -y amazon-cloudwatch-agent
    # /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:YourParameterOrFile -s
  EOF

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-instance"
  })
}

#################
# Outputs
#################
output "vpc_id" {
  description = "The VPC ID."
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "The public subnet ID."
  value       = aws_subnet.public.id
}

output "private_subnet_ids" {
  description = "The private subnet IDs."
  value       = [aws_subnet.private1.id, aws_subnet.private2.id]
}

output "igw_id" {
  description = "The Internet Gateway ID."
  value       = aws_internet_gateway.igw.id
}

output "nat_gateway_id" {
  description = "The NAT Gateway ID."
  value       = aws_nat_gateway.nat.id
}

output "bastion_instance_id" {
  description = "The bastion EC2 instance ID."
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "The bastion public IP."
  value       = aws_instance.bastion.public_ip
}

output "private_instance_id" {
  description = "The private EC2 (app) instance ID."
  value       = aws_instance.app.id
}

output "private_instance_profile_arn" {
  description = "The IAM instance profile ARN for the private instance."
  value       = aws_iam_instance_profile.app_profile.arn
}

output "private_instance_role_arn" {
  description = "The IAM role ARN attached to the private instance."
  value       = aws_iam_role.app_role.arn
}

output "s3_app_bucket_name" {
  description = "The S3 application bucket name."
  value       = aws_s3_bucket.app.bucket
}

output "s3_app_bucket_arn" {
  description = "The S3 application bucket ARN."
  value       = aws_s3_bucket.app.arn
}

output "kms_app_key_arn" {
  description = "The KMS CMK ARN for application data."
  value       = aws_kms_key.app.arn
}

output "bastion_private_key_pem" {
  description = "Generated private key PEM for bastion (if Terraform generated it)."
  value       = try(tls_private_key.bastion[0].private_key_pem, null)
  sensitive   = true
}
