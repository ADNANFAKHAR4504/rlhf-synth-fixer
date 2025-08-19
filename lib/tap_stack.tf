########################################
# TAP_STACK.TF - Production AWS Infrastructure (No EIP/NAT)
########################################

terraform {
  required_version = ">= 1.6.0"
}

########################################
# VARIABLES
########################################

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging and naming resources"
  type        = string
  default     = "prod"
}

variable "env" {
  description = "Environment tag"
  type        = string
  default     = "Prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "private_subnet_a_cidr" {
  type    = string
  default = "10.0.2.0/24"
}

variable "private_subnet_b_cidr" {
  type    = string
  default = "10.0.3.0/24"
}

variable "ssh_key_name" {
  description = "Name of an existing EC2 key pair in AWS. Leave empty to autogenerate."
  type        = string
  default     = ""
}

variable "private_key_path" {
  description = "Local path to save the generated private key (when ssh_key_name is empty)."
  type        = string
  default     = "./generated_bastion_key.pem"
}

variable "bastion_instance_type" {
  type    = string
  default = "t3.micro"
}

variable "app_instance_type" {
  type    = string
  default = "t3.small"
}

variable "tfstate_bucket_name" {
  type    = string
  default = "prod-terraform-state-unique"
}

variable "tfstate_key" {
  type    = string
  default = "prod/terraform.tfstate"
}

variable "tfstate_lock_table" {
  type    = string
  default = "prod-terraform-locks"
}

########################################
# LOCALS
########################################

locals {
  common_tags = {
    Environment = var.env
    Project     = var.project_name
  }
}

########################################
# DYNAMIC PUBLIC IP DETECTION
########################################

data "http" "my_ip" {
  url = "https://checkip.amazonaws.com/"
}

locals {
  bastion_allowed_cidr = "${chomp(data.http.my_ip.response_body)}/32"
}

########################################
# NETWORKING
########################################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${var.project_name}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-igw" })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-public-subnet" })
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_a_cidr
  availability_zone = "${var.aws_region}a"
  tags              = merge(local.common_tags, { Name = "${var.project_name}-private-subnet-a" })
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_b_cidr
  availability_zone = "${var.aws_region}b"
  tags              = merge(local.common_tags, { Name = "${var.project_name}-private-subnet-b" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route" "public_internet_access" {
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
  tags   = merge(local.common_tags, { Name = "${var.project_name}-private-rt" })
}

resource "aws_route_table_association" "private_a_assoc" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b_assoc" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

########################################
# VPC ENDPOINTS
########################################

resource "aws_security_group" "endpoints_sg" {
  name        = "${var.project_name}-endpoints-sg"
  description = "Allow HTTPS from VPC to Interface Endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-endpoints-sg" })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags              = merge(local.common_tags, { Name = "${var.project_name}-s3-endpoint" })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.endpoints_sg.id]
  private_dns_enabled = true
  tags                = merge(local.common_tags, { Name = "${var.project_name}-ssm-endpoint" })
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.endpoints_sg.id]
  private_dns_enabled = true
  tags                = merge(local.common_tags, { Name = "${var.project_name}-ec2messages-endpoint" })
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.endpoints_sg.id]
  private_dns_enabled = true
  tags                = merge(local.common_tags, { Name = "${var.project_name}-ssmmessages-endpoint" })
}

########################################
# SECURITY GROUPS
########################################

resource "aws_security_group" "bastion_sg" {
  name        = "${var.project_name}-bastion-sg"
  description = "Allow SSH from specific IP to bastion"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.bastion_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-bastion-sg" })
}

resource "aws_security_group" "private_sg" {
  name        = "${var.project_name}-private-sg"
  description = "Allow SSH from bastion"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion SG"
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

  tags = merge(local.common_tags, { Name = "${var.project_name}-private-sg" })
}

########################################
# KMS KEY
########################################

resource "aws_kms_key" "state_key" {
  description         = "KMS key for encrypting S3 and Terraform state"
  enable_key_rotation = true
  tags                = local.common_tags
}

resource "aws_kms_alias" "state_key_alias" {
  name          = "alias/${var.project_name}-state-key"
  target_key_id = aws_kms_key.state_key.id
}

########################################
# S3 BUCKET
########################################

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "app_bucket" {
  bucket        = "${var.project_name}-app-data-${random_id.bucket_suffix.hex}"
  force_destroy = false
  tags          = local.common_tags
}

resource "aws_s3_bucket_versioning" "app_versioning" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_encryption" {
  bucket = aws_s3_bucket.app_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.state_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_public_access" {
  bucket                  = aws_s3_bucket.app_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

########################################
# IAM ROLE & INSTANCE PROFILE
########################################

resource "aws_iam_role" "app_role" {
  name = "${var.project_name}-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "app_s3_policy" {
  name        = "${var.project_name}-app-s3-policy"
  description = "Allow EC2 to access app S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      Resource = [
        aws_s3_bucket.app_bucket.arn,
        "${aws_s3_bucket.app_bucket.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "app_attach_s3" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_attach_ssm" {
  role       = aws_iam_role.app_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "${var.project_name}-app-profile"
  role = aws_iam_role.app_role.name
}

resource "aws_iam_role" "bastion_role" {
  name = "${var.project_name}-bastion-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "bastion_attach_ssm" {
  role       = aws_iam_role.bastion_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "bastion_profile" {
  name = "${var.project_name}-bastion-profile"
  role = aws_iam_role.bastion_role.name
}

########################################
# SSH KEY MANAGEMENT
########################################

resource "tls_private_key" "generated" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  count      = var.ssh_key_name == "" ? 1 : 0
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.generated[0].public_key_openssh
  tags       = merge(local.common_tags, { Name = "${var.project_name}-key" })
}

resource "local_file" "generated_private_key" {
  count           = var.ssh_key_name == "" ? 1 : 0
  filename        = var.private_key_path
  content         = tls_private_key.generated[0].private_key_pem
  file_permission = "0600"
}

locals {
  effective_key_name = var.ssh_key_name != "" ? var.ssh_key_name : aws_key_pair.generated[0].key_name
}

########################################
# AMI
########################################

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

########################################
# EC2 INSTANCES
########################################

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.bastion_instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = local.effective_key_name
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.bastion_profile.name
  monitoring                  = true
  tags                        = merge(local.common_tags, { Name = "${var.project_name}-bastion" })
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.app_instance_type
  subnet_id                   = aws_subnet.private_a.id
  key_name                    = local.effective_key_name
  vpc_security_group_ids      = [aws_security_group.private_sg.id]
  associate_public_ip_address = false
  iam_instance_profile        = aws_iam_instance_profile.app_profile.name
  monitoring                  = true
  tags                        = merge(local.common_tags, { Name = "${var.project_name}-app" })
}

########################################
# DYNAMODB TABLE FOR STATE LOCKING
########################################

resource "aws_dynamodb_table" "tf_lock" {
  name         = var.tfstate_lock_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = local.common_tags
}

########################################
# OUTPUTS
########################################

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_ids" {
  value = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "bastion_public_ip" {
  value = aws_instance.bastion.public_ip
}

output "app_instance_id" {
  value = aws_instance.app.id
}

output "app_s3_bucket" {
  value = aws_s3_bucket.app_bucket.bucket
}

output "kms_key_arn" {
  value = aws_kms_key.state_key.arn
}

output "ssh_key_name_effective" {
  description = "Key pair actually used by instances"
  value       = local.effective_key_name
}

output "generated_private_key_path" {
  description = "Local path of the generated private key (only when ssh_key_name is empty)"
  value       = var.private_key_path
  sensitive   = true
}

