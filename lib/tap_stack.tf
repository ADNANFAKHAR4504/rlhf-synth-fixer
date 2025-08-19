############################################################
# TAP STACK: Secure, Scalable, Compliant Prod Infrastructure
# - Region: us-east-1 (overridable via var.aws_region; provider.tf reads it)
# - VPC 10.0.0.0/16, 1 public + 2 private subnets
# - IGW + NAT GW in public subnet; private subnets route via NAT
# - Bastion host in public subnet; App EC2 in private subnet
# - Security groups restrict SSH (bastion from allowed CIDR, app only from bastion)
# - S3 data bucket with versioning + KMS encryption; EC2 role grants S3 access
# - VPC Gateway Endpoint for S3 (private subnets can reach S3 without NAT)
# - Detailed monitoring enabled on EC2
# - KMS for sensitive data, including Terraform state
# - Global tagging: Environment = Prod
# - Backend (S3 + DynamoDB + KMS) bootstrapping included (see below)
#
# QUICK START
# 1) BOOTSTRAP BACKEND (one-time):
#    - Temporarily set: create_backend = true
#    - Comment out (or leave empty) your backend block in provider/terraform until after bootstrap,
#      OR run `terraform init` with local backend, then:
#      `terraform apply -target=aws_kms_key.backend -target=aws_kms_alias.backend_alias \
#                       -target=aws_s3_bucket.state -target=aws_dynamodb_table.state_locks`
#    - Fill the backend block (below) with the created names/ARN and run `terraform init -migrate-state`
#    - Set create_backend = false (recommended for normal operation)
#
# 2) NORMAL OPERATION:
#    - Ensure backend block is configured and create_backend = false
#    - `terraform init`, `terraform validate`, `terraform plan`, `terraform apply`
############################################################

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6"
    }
  }

  # Define the S3 backend here for production usage.
  # IMPORTANT: Terraform does not allow variables in this block.
  # Replace the values below after you run the one-time bootstrap (see header).
  backend "s3" {
    bucket         = "prod-tap-tfstate-us-east-1"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "prod-tap-tf-locks"
    encrypt        = true
    kms_key_id     = "alias/prod-tap-terraform" # Can be alias or full ARN
  }
}

#####################
# VARIABLES & LOCALS
#####################

variable "aws_region" {
  description = "AWS region used by provider.tf"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Name prefix for resources"
  type        = string
  default     = "prod-tap"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into bastion (e.g., your office IP/32)"
  type        = string
  default     = "203.0.113.10/32" # CHANGE THIS to your real IP/32
}

variable "key_name" {
  description = "EC2 key pair name for SSH (must exist in the target region)"
  type        = string
  default     = "prod-keypair" # CHANGE or create this key pair
}

variable "instance_type_bastion" {
  description = "Bastion instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_type_app" {
  description = "Private app EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "s3_data_bucket_name" {
  description = "S3 bucket name for application data"
  type        = string
  default     = "prod-tap-data-bucket-001" # must be globally unique; adjust if needed
}

# Backend bootstrap controls (optional one-time creation)
variable "create_backend" {
  description = "Create the Terraform state backend resources (S3/DynamoDB/KMS). Use only for bootstrap."
  type        = bool
  default     = false
}

variable "state_bucket_name" {
  description = "Backend state S3 bucket name (globally unique)"
  type        = string
  default     = "prod-tap-tfstate-us-east-1"
}

variable "state_lock_table_name" {
  description = "DynamoDB table name for Terraform state locking"
  type        = string
  default     = "prod-tap-tf-locks"
}

locals {
  # Global required tagging
  common_tags = {
    Environment = "Prod"
    Project     = var.project_prefix
    ManagedBy   = "Terraform"
  }
}

########################
# DATA (AZ DISCOVERY)
########################

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# KMS FOR ENCRYPTION
########################

# General-purpose CMK for data encryption (S3 data bucket, optional EBS, etc.)
resource "aws_kms_key" "general" {
  description             = "${var.project_prefix} general purpose CMK"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "general_alias" {
  name          = "alias/${var.project_prefix}-kms"
  target_key_id = aws_kms_key.general.key_id
}

# OPTIONAL: Backend CMK for Terraform state (created only if bootstrapping)
resource "aws_kms_key" "backend" {
  count                    = var.create_backend ? 1 : 0
  description              = "${var.project_prefix} terraform backend CMK"
  deletion_window_in_days  = 7
  enable_key_rotation      = true
  tags                     = local.common_tags
}

resource "aws_kms_alias" "backend_alias" {
  count        = var.create_backend ? 1 : 0
  name         = "alias/${var.project_prefix}-terraform"
  target_key_id = aws_kms_key.backend[0].key_id
}

########
# VPC
########

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-igw"
  })
}

# Subnets (1 public + 2 private) across multiple AZs
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-public-a"
    Tier = "public"
  })
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-a"
    Tier = "private"
  })
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-b"
    Tier = "private"
  })
}

# NAT in public subnet
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_a.id

  depends_on = [aws_internet_gateway.igw]

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat"
  })
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-rt-public"
  })
}

resource "aws_route" "public_igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

# Private route tables (each private subnet gets its own)
resource "aws_route_table" "private_a" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-rt-private-a"
  })
}

resource "aws_route" "private_a_nat" {
  route_table_id         = aws_route_table.private_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_a_assoc" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private_a.id
}

resource "aws_route_table" "private_b" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-rt-private-b"
  })
}

resource "aws_route" "private_b_nat" {
  route_table_id         = aws_route_table.private_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_b_assoc" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private_b.id
}

###############################################
# VPC GATEWAY ENDPOINT FOR S3 (cost & security)
###############################################
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.private_a.id,
    aws_route_table.private_b.id
  ]

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpce-s3"
  })
}

#####################
# SECURITY GROUPS
#####################

# Bastion: SSH from allowed CIDR, egress all
resource "aws_security_group" "bastion_sg" {
  name        = "${var.project_prefix}-bastion-sg"
  description = "Allow SSH from trusted CIDR"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-bastion-sg"
  })
}

# App instance: allow SSH only from bastion SG; egress all
resource "aws_security_group" "app_sg" {
  name        = "${var.project_prefix}-app-sg"
  description = "App SG - SSH only from bastion"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-app-sg"
  })
}

##################################
# S3 DATA BUCKET (versioned, KMS)
##################################

resource "aws_s3_bucket" "data" {
  bucket = var.s3_data_bucket_name

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-data"
  })
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
      kms_master_key_id = aws_kms_key.general.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Require TLS for S3 access
resource "aws_s3_bucket_policy" "data_tls" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

#############################################
# OPTIONAL: BACKEND (STATE) INFRA BOOTSTRAP
#############################################

resource "aws_s3_bucket" "state" {
  count  = var.create_backend ? 1 : 0
  bucket = var.state_bucket_name
  tags   = merge(local.common_tags, { Name = "${var.project_prefix}-tfstate" })
}

resource "aws_s3_bucket_versioning" "state" {
  count  = var.create_backend ? 1 : 0
  bucket = aws_s3_bucket.state[0].id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  count  = var.create_backend ? 1 : 0
  bucket = aws_s3_bucket.state[0].id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backend[0].arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  count                    = var.create_backend ? 1 : 0
  bucket                   = aws_s3_bucket.state[0].id
  block_public_acls        = true
  block_public_policy      = true
  ignore_public_acls       = true
  restrict_public_buckets  = true
}

resource "aws_dynamodb_table" "state_locks" {
  count          = var.create_backend ? 1 : 0
  name           = var.state_lock_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-tf-locks"
  })
}

#############################################
# IAM: EC2 ROLE + POLICY FOR S3 DATA ACCESS
#############################################

resource "aws_iam_role" "ec2_role" {
  name = "${var.project_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "s3_access" {
  name = "${var.project_prefix}-s3-access"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "ListAndGetDataBucket",
        Effect: "Allow",
        Action: [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ],
        Resource: [
          aws_s3_bucket.data.arn
        ]
      },
      {
        Sid: "ObjectRWDataBucket",
        Effect: "Allow",
        Action: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Resource: [
          "${aws_s3_bucket.data.arn}/*"
        ]
      },
      {
        Sid: "UseKMSForS3",
        Effect: "Allow",
        Action: [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource: [
          aws_kms_key.general.arn
        ]
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "attach_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  tags = local.common_tags
}

#########################
# BASTION HOST (PUBLIC)
#########################

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux2.id
  instance_type               = var.instance_type_bastion
  subnet_id                   = aws_subnet.public_a.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  key_name                    = var.key_name
  monitoring                  = true # Detailed monitoring

  metadata_options {
    http_tokens = "required"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-bastion"
  })
}

##############################
# APP INSTANCE (PRIVATE SUBNET)
##############################

resource "aws_instance" "app" {
  ami                         = data.aws_ami.amazon_linux2.id
  instance_type               = var.instance_type_app
  subnet_id                   = aws_subnet.private_a.id
  associate_public_ip_address = false
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  monitoring                  = true # Detailed monitoring

  ebs_optimized = true
  root_block_device {
    encrypted   = true
    kms_key_id  = aws_kms_key.general.arn
    volume_type = "gp3"
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-app"
  })
}

########################
# AMI (Amazon Linux 2)
########################

data "aws_ami" "amazon_linux2" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

############
# OUTPUTS
############

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  value       = aws_subnet.public_a.id
  description = "Public subnet ID"
}

output "private_subnet_ids" {
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  description = "Private subnet IDs"
}

output "bastion_public_ip" {
  value       = aws_instance.bastion.public_ip
  description = "Bastion public IP (use to SSH from allowed CIDR)"
}

output "app_instance_id" {
  value       = aws_instance.app.id
  description = "Private app instance ID"
}

output "s3_data_bucket" {
  value       = aws_s3_bucket.data.bucket
  description = "Application data bucket"
}

output "kms_general_arn" {
  value       = aws_kms_key.general.arn
  description = "General-purpose KMS key ARN"
}
