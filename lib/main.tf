#############################################
# Variables (provider.tf reads var.aws_region)
#############################################
variable "project" {
  description = "Project or system name used for tagging and resource names."
  type        = string
  default     = "sample"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region (used by provider.tf)."
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (2)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (2)."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "bucket_name" {
  description = "Optional explicit S3 bucket name. If empty, a name is derived from project and environment."
  type        = string
  default     = ""
}

variable "allowed_ssh_cidrs" {
  description = "CIDR ranges that can SSH to the instance. If empty, no SSH ingress rule is created."
  type        = list(string)
  default     = []
}

#################
# Data sources
#################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

############
# Locals
############
locals {
  name_prefix  = lower("${var.project}-${var.environment}")
  azs          = slice(data.aws_availability_zones.available.names, 0, 2)

  # Feature toggles by environment
  enable_nat                  = var.environment != "dev"
  enable_detailed_monitoring  = var.environment != "dev"
  instance_in_public_subnet   = var.environment == "dev"

  # Derived bucket name if none supplied
  effective_bucket_name = length(trim(var.bucket_name)) > 0
    ? var.bucket_name
    : replace("${local.name_prefix}-app-bucket", "_", "-")

  public_subnets = {
    for idx, cidr in var.public_subnet_cidrs :
    tostring(idx) => { cidr = cidr, az = local.azs[idx] }
  }

  private_subnets = {
    for idx, cidr in var.private_subnet_cidrs :
    tostring(idx) => { cidr = cidr, az = local.azs[idx] }
  }
}

########
# VPC
########
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.name_prefix}-vpc"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags = {
    Name        = "${local.name_prefix}-igw"
    Project     = var.project
    Environment = var.environment
  }
}

#####################
# Public subnets
#####################
resource "aws_subnet" "public" {
  for_each                = local.public_subnets
  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = {
    Name        = "${local.name_prefix}-public-${each.key}"
    Project     = var.project
    Environment = var.environment
    Tier        = "public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags = {
    Name        = "${local.name_prefix}-public-rt"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

#####################
# Private subnets
#####################
resource "aws_subnet" "private" {
  for_each          = local.private_subnets
  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name        = "${local.name_prefix}-private-${each.key}"
    Project     = var.project
    Environment = var.environment
    Tier        = "private"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags = {
    Name        = "${local.name_prefix}-private-rt"
    Project     = var.project
    Environment = var.environment
  }
}

# NAT (only for staging/prod)
resource "aws_eip" "nat" {
  count  = local.enable_nat ? 1 : 0
  domain = "vpc"

  tags = {
    Name        = "${local.name_prefix}-nat-eip"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "this" {
  count         = local.enable_nat ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public["0"].id    # place NAT in first public subnet

  tags = {
    Name        = "${local.name_prefix}-nat"
    Project     = var.project
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route" "private_default" {
  count                  = local.enable_nat ? 1 : 0
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[0].id
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

###########################
# Security Group for EC2
###########################
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "App SG"
  vpc_id      = aws_vpc.this.id

  # Egress: allow all
  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.name_prefix}-app-sg"
    Project     = var.project
    Environment = var.environment
  }
}

# Optional SSH ingress rules — created only when CIDRs are provided
resource "aws_security_group_rule" "ssh_ingress" {
  for_each          = toset(var.allowed_ssh_cidrs)
  type              = "ingress"
  description       = "SSH from allowed CIDRs"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [each.key]
  security_group_id = aws_security_group.app.id
}

#####################
# EC2 Instance
#####################
# dev: public subnet with public IP
# staging/prod: private subnet, no public IP, detailed monitoring enabled
resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = local.instance_in_public_subnet ? aws_subnet.public["0"].id : aws_subnet.private["0"].id
  associate_public_ip_address = local.instance_in_public_subnet
  vpc_security_group_ids      = [aws_security_group.app.id]
  monitoring                  = local.enable_detailed_monitoring

  tags = {
    Name        = "${local.name_prefix}-app-ec2"
    Project     = var.project
    Environment = var.environment
  }

  # Ensure routing infra exists first
  depends_on = [
    aws_route.public_default,
    aws_route_table_association.public,
    aws_route_table_association.private
  ]
}

#############
# S3 Bucket
#############
resource "aws_s3_bucket" "this" {
  bucket = local.effective_bucket_name

  tags = {
    Name        = local.effective_bucket_name
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable versioning only in staging/prod
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = var.environment == "dev" ? "Suspended" : "Enabled"
  }
}

##########
# Outputs
##########
output "vpc_id" {
  value       = aws_vpc.this.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = [for s in aws_subnet.public : s.id]
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = [for s in aws_subnet.private : s.id]
  description = "Private subnet IDs"
}

output "security_group_id" {
  value       = aws_security_group.app.id
  description = "App security group ID"
}

output "instance_id" {
  value       = aws_instance.app.id
  description = "EC2 instance ID"
}

output "instance_private_ip" {
  value       = aws_instance.app.private_ip
  description = "EC2 private IP"
}

output "instance_public_ip" {
  value       = local.instance_in_public_subnet ? aws_instance.app.public_ip : null
  description = "EC2 public IP (only in dev)"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.this.bucket
  description = "S3 bucket name"
}

output "nat_gateway_id" {
  value       = local.enable_nat ? aws_nat_gateway.this[0].id : null
  description = "NAT Gateway ID (null in dev)"
}
