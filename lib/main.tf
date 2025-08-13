# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-${var.organization_name}-vpc"
  }

  # lifecycle {
  #   prevent_destroy = true
  # }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-${var.organization_name}-igw"
  }

  # lifecycle {
  #   prevent_destroy = true
  # }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-${var.organization_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-${var.organization_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Module
module "kms" {
  source = "./modules/kms"

  environment       = var.environment
  organization_name = var.organization_name
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  environment       = var.environment
  organization_name = var.organization_name
  kms_key_arn       = module.kms.key_arn
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  environment         = var.environment
  organization_name   = var.organization_name
  vpc_id              = aws_vpc.main.id
  allowed_cidr_blocks = var.allowed_cidr_blocks
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment       = var.environment
  organization_name = var.organization_name
  kms_key_arn       = module.kms.key_arn
}

# CloudTrail Module
module "cloudtrail" {
  source = "./modules/cloudtrail"

  environment       = var.environment
  organization_name = var.organization_name
  s3_bucket_name    = module.s3.cloudtrail_bucket_name
  kms_key_arn       = module.kms.key_arn
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
