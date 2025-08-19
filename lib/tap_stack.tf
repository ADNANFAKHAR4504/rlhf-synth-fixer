############################################
# tap_stack.tf — Prod baseline, single file
############################################

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.40.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0.5"
    }
  }

  # STEP 2 (after first apply): Uncomment and `terraform init -migrate-state`
  # to enable remote state using the bucket/key created below.
  #
  # backend "s3" {
  #   bucket         = "prod-tfstate-<your-unique-suffix>"
  #   key            = "global/terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = "prod-tf-locks"
  #   encrypt        = true
  #   kms_key_id     = "alias/prod-tfstate-kms"
  # }
}

############################
# Variables & Validations
############################

variable "aws_region" {
  description = "AWS region (used by provider.tf)."
  type        = string
  default     = "us-east-1" # N. Virginia per proposal
}

variable "name_prefix" {
  description = "Naming prefix for all resources."
  type        = string
  default     = "prod"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.name_prefix))
    error_message = "name_prefix must be lowercase alphanumerics and dashes."
  }
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into bastion (use /32 for a single IP)."
  type        = string
  default     = "203.0.113.0/32" # replace with your IP
  validation {
    condition     = var.allowed_ssh_cidr != "0.0.0.0/0"
    error_message = "Do not allow 0.0.0.0/0 for SSH."
  }
}

variable "ssh_public_key" {
  description = "Your SSH public key (dummy default used for CI validation)."
  type        = string
  default     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDdummykeyfortests"
}


variable "instance_type_bastion" {
  description = "Instance type for bastion."
  type        = string
  default     = "t3.micro"
}

variable "instance_type_private" {
  description = "Instance type for private EC2."
  type        = string
  default     = "t3.micro"
}

variable "availability_zone_count" {
  description = "How many AZs to spread across (2 recommended)."
  type        = number
  default     = 2
  validation {
    condition     = var.availability_zone_count >= 2
    error_message = "Use at least 2 AZs for resilience."
  }
}

############################
# Locals
############################

locals {
  tags = {
    Environment = "Prod"
    ManagedBy   = "Terraform"
    Stack       = var.name_prefix
  }

  vpc_cidr        = "10.0.0.0/16"
  public_cidr     = "10.0.1.0/24"
  private1_cidr   = "10.0.2.0/24"
  private2_cidr   = "10.0.3.0/24"

  # Bucket names must be globally unique. Add a suffix if desired.
  data_bucket_name    = "${var.name_prefix}-data-bucket"
  tfstate_bucket_name = "prod-tfstate-<your-unique-suffix>" # <-- change this
}

############################
# Data Sources
############################

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

############################
# KMS Keys
############################

# General KMS key for application data (S3, EBS)
resource "aws_kms_key" "app" {
  description             = "KMS key for ${var.name_prefix} app data"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.tags
}

resource "aws_kms_alias" "app" {
  name          = "alias/${var.name_prefix}-app-kms"
  target_key_id = aws_kms_key.app.key_id
}

# Dedicated KMS key for Terraform state bucket
resource "aws_kms_key" "tfstate" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.tags
}

resource "aws_kms_alias" "tfstate" {
  name          = "alias/prod-tfstate-kms"
  target_key_id = aws_kms_key.tfstate.key_id
}

############################
# Networking — VPC & Subnets
############################

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-public-subnet"
  })
}

# Private subnets
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private1_cidr
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-private-subnet-a"
  })
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private2_cidr
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-private-subnet-b"
  })
}

# NAT in the public subnet
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-nat-gw"
  })
  depends_on = [aws_internet_gateway.igw]
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

resource "aws_route" "public_inet" {
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
  tags = merge(local.tags, {
    Name = "${var.name_prefix}-private-rt"
  })
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_a_assoc" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b_assoc" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

############################
# Security Groups
############################

# Bastion SG: SSH from a specific IP
resource "aws_security_group" "bastion_sg" {
  name        = "${var.name_prefix}-bastion-sg"
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
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.name_prefix}-bastion-sg" })
}

# Private EC2 SG: SSH only from bastion SG
resource "aws_security_group" "private_ec2_sg" {
  name        = "${var.name_prefix}-private-ec2-sg"
  description = "Restrict SSH to bastion; allow egress"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.name_prefix}-private-ec2-sg" })
}

############################
# Key Pair for SSH
############################

resource "aws_key_pair" "main" {
  key_name   = "${var.name_prefix}-key"
  public_key = var.ssh_public_key
  tags       = merge(local.tags, { Name = "${var.name_prefix}-key" })
}

############################
# IAM for EC2 -> S3 access
############################

resource "aws_iam_role" "ec2_role" {
  name = "${var.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action   = "sts:AssumeRole"
    }]
  })
  tags = local.tags
}

resource "aws_iam_policy" "s3_access" {
  name = "${var.name_prefix}-s3-access"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "S3AccessBucketObjects",
        Effect   = "Allow",
        Action   = ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
      }
    ]
  })
  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "attach_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  tags = local.tags
}

############################
# S3 Buckets (Data & TF State)
############################

# Application data bucket with versioning + KMS
resource "aws_s3_bucket" "data" {
  bucket = local.data_bucket_name
  tags   = merge(local.tags, { Name = "${var.name_prefix}-data-bucket" })
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # Enforce TLS
      {
        Sid:    "DenyInsecureTransport",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ],
        Condition: { Bool: { "aws:SecureTransport": "false" } }
      },
      # Enforce KMS
      {
        Sid: "DenyUnEncryptedObjectUploads",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:PutObject",
        Resource: "${aws_s3_bucket.data.arn}/*",
        Condition: {
          StringNotEquals: { "s3:x-amz-server-side-encryption": "aws:kms" }
        }
      }
    ]
  })
}

# Terraform state bucket with versioning + KMS
resource "aws_s3_bucket" "tfstate" {
  bucket = local.tfstate_bucket_name
  tags   = merge(local.tags, { Name = "tfstate-bucket" })
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tfstate.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "DenyInsecureTransport",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: [
          aws_s3_bucket.tfstate.arn,
          "${aws_s3_bucket.tfstate.arn}/*"
        ],
        Condition: { Bool: { "aws:SecureTransport": "false" } }
      }
    ]
  })
}

# DynamoDB table for state locking (best practice)
resource "aws_dynamodb_table" "tf_locks" {
  name         = "prod-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.tags, { Name = "prod-tf-locks" })
}

############################
# Bastion Host (Public)
############################

# Latest Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type_bastion
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  key_name                    = aws_key_pair.main.key_name
  associate_public_ip_address = true
  monitoring                  = true # Detailed monitoring

  root_block_device {
    encrypted   = true
    kms_key_id  = aws_kms_key.app.arn
    volume_type = "gp3"
  }

  tags = merge(local.tags, { Name = "${var.name_prefix}-bastion" })
}

############################
# Private EC2 Instance
############################

resource "aws_instance" "private_ec2" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type_private
  subnet_id              = aws_subnet.private_a.id
  vpc_security_group_ids = [aws_security_group.private_ec2_sg.id]
  key_name               = aws_key_pair.main.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false
  monitoring                  = true # Detailed monitoring

  root_block_device {
    encrypted   = true
    kms_key_id  = aws_kms_key.app.arn
    volume_type = "gp3"
  }

  # Optional: small user_data to harden SSH
  user_data = <<-EOF
              #!/bin/bash
              set -eux
              echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config
              systemctl restart sshd
              EOF

  tags = merge(local.tags, { Name = "${var.name_prefix}-private-ec2" })

  # Sanity preconditions
  lifecycle {
    precondition {
      condition     = !can(regex("\\.\\d+/0$", var.allowed_ssh_cidr))
      error_message = "allowed_ssh_cidr must not be /0."
    }
  }
}

############################
# Outputs
############################

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_id" {
  value       = aws_subnet.public.id
  description = "Public subnet ID"
}

output "private_subnet_ids" {
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  description = "Private subnet IDs"
}

output "nat_gateway_id" {
  value       = aws_nat_gateway.nat.id
  description = "NAT gateway id"
}

output "bastion_public_ip" {
  value       = aws_instance.bastion.public_ip
  description = "Use this to SSH to bastion, then hop to the private instance."
}

output "private_instance_id" {
  value       = aws_instance.private_ec2.id
  description = "EC2 instance in private subnet"
}

output "data_bucket_name" {
  value       = aws_s3_bucket.data.bucket
  description = "S3 data bucket with versioning + KMS"
}

output "tfstate_bucket_name" {
  value       = aws_s3_bucket.tfstate.bucket
  description = "S3 bucket to be used for Terraform remote state"
}

output "kms_app_key_arn" {
  value       = aws_kms_key.app.arn
  description = "KMS key for app data (S3, EBS)"
}

output "kms_tfstate_key_arn" {
  value       = aws_kms_key.tfstate.arn
  description = "KMS key for Terraform state"
}
