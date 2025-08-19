# tap_stack.tf
terraform {
  required_version = ">= 1.0"
}

####################
# Variables
####################
variable "aws_region" {
  description = "AWS region used by provider (consumed by provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "private_subnet1_cidr" {
  description = "CIDR for the first private subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet2_cidr" {
  description = "CIDR for the second private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to bastion (example: \"203.0.113.10/32\")"
  type        = string
}

variable "bastion_key_name" {
  description = "Name for bastion key pair. If provided with bastion_ssh_public_key this will create the key pair; if provided alone it will use an existing key by this name."
  type        = string
  default     = ""
}

variable "bastion_ssh_public_key" {
  description = "Optional SSH public key material to create the bastion key pair (PEM/authorized_keys format). If empty then no key pair resource is created."
  type        = string
  default     = ""
}

variable "owner" {
  description = "Resource owner tag"
  type        = string
  default     = "platform-team"
}

####################
# Locals
####################
locals {
  env         = "prod"
  name_prefix = local.env
  common_tags = {
    Name        = local.name_prefix
    Owner       = var.owner
    Environment = "Prod"
  }
  # naming helper
  join = { for k, v in {
    vpc          = "${local.name_prefix}-vpc"
    public_sub   = "${local.name_prefix}-public-subnet"
    private_sub1 = "${local.name_prefix}-private-subnet-1"
    private_sub2 = "${local.name_prefix}-private-subnet-2"
    igw          = "${local.name_prefix}-igw"
    nat_eip      = "${local.name_prefix}-nat-eip"
    nat_gw       = "${local.name_prefix}-nat-gw"
    bastion      = "${local.name_prefix}-bastion"
    private_ec2  = "${local.name_prefix}-app"
    app_bucket   = "${local.name_prefix}-app-bucket"
    kms_alias    = "alias/${local.name_prefix}-app-kms"
    app_role     = "${local.name_prefix}-app-role"
  } : k => v }
}

####################
# Data sources
####################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }
  owners = ["amazon"]
}

####################
# VPC & Subnets
####################
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = local.join.vpc
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = local.join.igw
  })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = local.join.public_sub
  })
}

resource "aws_subnet" "private1" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet1_cidr
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.common_tags, {
    Name = local.join.private_sub1
  })
}

resource "aws_subnet" "private2" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet2_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.common_tags, {
    Name = local.join.private_sub2
  })
}

####################
# NAT Gateway + EIP + Route Tables
####################
resource "aws_eip" "nat" {
  vpc = true

  tags = merge(local.common_tags, {
    Name = local.join.nat_eip
  })
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = merge(local.common_tags, {
    Name = local.join.nat_gw
  })
  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt"
  })
}

resource "aws_route_table_association" "private1_assoc" {
  subnet_id      = aws_subnet.private1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private2_assoc" {
  subnet_id      = aws_subnet.private2.id
  route_table_id = aws_route_table.private.id
}

####################
# Key pair handling for bastion
# Create key pair only when both name & public key provided
####################
resource "aws_key_pair" "bastion_key" {
  count      = var.bastion_key_name != "" && var.bastion_ssh_public_key != "" ? 1 : 0
  key_name   = var.bastion_key_name
  public_key = var.bastion_ssh_public_key
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-key"
  })
}

####################
# Security Groups
####################
resource "aws_security_group" "bastion_sg" {
  name        = "${local.name_prefix}-bastion-sg"
  description = "Bastion SG - allow SSH from management CIDR"
  vpc_id      = aws_vpc.this.id

  ingress {
    description      = "SSH from allowed management CIDR"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = [var.allowed_ssh_cidr]
    ipv6_cidr_blocks = []
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-sg"
  })
}

resource "aws_security_group" "private_app_sg" {
  name        = "${local.name_prefix}-private-app-sg"
  description = "Private app SG - allow SSH from bastion only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "SSH from bastion"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-app-sg"
  })
}

####################
# KMS Key for S3 (CMK)
####################
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

locals {
  account_arn_root = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
}

resource "aws_kms_key" "app" {
  description             = "CMK for ${local.name_prefix} application data (SSE-KMS)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "key-policy-${local.name_prefix}",
  "Statement": [
    {
      "Sid": "Allow administration of the key",
      "Effect": "Allow",
      "Principal": { "AWS": "${local.account_arn_root}" },
      "Action": [
        "kms:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow use by S3 for encryption/decryption",
      "Effect": "Allow",
      "Principal": { "Service": "s3.amazonaws.com" },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${data.aws_caller_identity.current.account_id}"
        }
      }
    },
    {
      "Sid": "Allow EC2 role to use the key",
      "Effect": "Allow",
      "Principal": { "AWS": "${aws_iam_role.app_role.arn}" },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
POLICY

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-kms-key"
  })
}

resource "aws_kms_alias" "app_alias" {
  name          = local.join.kms_alias
  target_key_id = aws_kms_key.app.key_id
}

####################
# S3 Bucket (app data) with versioning, block public access, SSE-KMS default, and bucket policy
####################
resource "aws_s3_bucket" "app_bucket" {
  bucket = "${local.name_prefix}-app-${data.aws_caller_identity.current.account_id}"
  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.app.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = local.join.app_bucket
  })
}

resource "aws_s3_bucket_public_access_block" "app_block_public" {
  bucket                  = aws_s3_bucket.app_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "app_bucket_policy" {
  bucket = aws_s3_bucket.app_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Deny any request that does not use secure transport (TLS)
      {
        Sid = "DenyNonTLS"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.app_bucket.arn}",
          "${aws_s3_bucket.app_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      # Deny uploads without SSE-KMS and specifically require the CMK
      {
        Sid = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.app_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
          StringNotEqualsIfExists = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.app.arn
          }
        }
      }
    ]
  })
}

####################
# IAM Role & Instance Profile for private EC2 (least-privilege S3 access)
####################
data "aws_iam_policy_document" "app_role_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "app_role" {
  name               = local.join.app_role
  assume_role_policy = data.aws_iam_policy_document.app_role_assume.json

  tags = merge(local.common_tags, {
    Name = local.join.app_role
  })
}

data "aws_iam_policy_document" "app_s3_policy" {
  statement {
    sid    = "AllowListBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [aws_s3_bucket.app_bucket.arn]
  }

  statement {
    sid    = "AllowObjectActionsOnPrefix"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = ["${aws_s3_bucket.app_bucket.arn}/app/*"]
  }

  # allow use of KMS key (generate data key etc.) for objects
  statement {
    sid = "AllowUseOfKmsForAppKey"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.app.arn]
  }
}

resource "aws_iam_policy" "app_s3_access" {
  name        = "${local.name_prefix}-app-s3-policy"
  description = "Least-privilege S3 access for app instances"
  policy      = data.aws_iam_policy_document.app_s3_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_app_s3" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_s3_access.arn
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "${local.name_prefix}-app-instance-profile"
  role = aws_iam_role.app_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-instance-profile"
  })
}

####################
# Bastion Host (public)
####################
resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true
  key_name                    = var.bastion_key_name != "" ? var.bastion_key_name : (length(aws_key_pair.bastion_key) > 0 ? aws_key_pair.bastion_key[0].key_name : null)
  monitoring                  = true
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]

  tags = merge(local.common_tags, {
    Name = local.join.bastion
  })

  # basic user data to harden (disable password auth)
  user_data = <<-EOF
              #!/bin/bash
              set -e
              # disable password authentication
              sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config || true
              systemctl restart sshd || true
              yum update -y
              # CloudWatch agent hint: install and configure amazon-cloudwatch-agent here
              # /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              EOF
}

####################
# Private EC2 (app host)
####################
resource "aws_instance" "private_app" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private1.id
  associate_public_ip_address = false
  monitoring             = true
  vpc_security_group_ids = [aws_security_group.private_app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.app_profile.name

  tags = merge(local.common_tags, {
    Name = local.join.private_ec2
  })

  user_data = <<-EOF
              #!/bin/bash
              set -e
              # basic hardening: disable password authentication and update packages
              sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config || true
              systemctl restart sshd || true
              yum update -y
              # CloudWatch agent hint (commented): place config at /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
              EOF
}

####################
# Outputs
####################
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.public.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = [aws_subnet.private1.id, aws_subnet.private2.id]
}

output "igw_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.this.id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.this.id
}

output "bastion_instance_id" {
  description = "Bastion EC2 instance ID"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Bastion public IP"
  value       = aws_instance.bastion.public_ip
}

output "private_instance_id" {
  description = "Private EC2 instance ID"
  value       = aws_instance.private_app.id
}

output "private_instance_profile_arn" {
  description = "Private EC2 instance profile ARN"
  value       = aws_iam_instance_profile.app_profile.arn
}

output "private_instance_role_arn" {
  description = "Private EC2 role ARN"
  value       = aws_iam_role.app_role.arn
}

output "s3_app_bucket_name" {
  description = "Application S3 bucket name"
  value       = aws_s3_bucket.app_bucket.bucket
}

output "s3_app_bucket_arn" {
  description = "Application S3 bucket ARN"
  value       = aws_s3_bucket.app_bucket.arn
}

output "kms_app_key_arn" {
  description = "KMS ARN used for S3 encryption"
  value       = aws_kms_key.app.arn
}
