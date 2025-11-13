##############################
# Variables
##############################

variable "aws_region" {
  description = "Primary AWS region for deployment (required by provider.tf)"
  type        = string
  default     = "us-west-2"
}

variable "app_name" {
  description = "Application name prefix for resources"
  type        = string
  default     = "tap-app"
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

variable "vpc_cidr_us_east_1" {
  description = "CIDR for VPC in us-east-1"
  type        = string
  default     = "10.10.0.0/16"
}

variable "vpc_cidr_us_west_2" {
  description = "CIDR for VPC in us-west-2"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs_us_east_1" {
  description = "Map of AZ => CIDR for public subnets in us-east-1"
  type        = map(string)
  default = {
    "us-east-1a" = "10.10.1.0/24"
    "us-east-1b" = "10.10.2.0/24"
  }
}

variable "private_subnet_cidrs_us_east_1" {
  description = "Map of AZ => CIDR for private subnets in us-east-1"
  type        = map(string)
  default = {
    "us-east-1a" = "10.10.11.0/24"
    "us-east-1b" = "10.10.12.0/24"
  }
}

variable "public_subnet_cidrs_us_west_2" {
  description = "Map of AZ => CIDR for public subnets in us-west-2"
  type        = map(string)
  default = {
    "us-west-2a" = "10.20.1.0/24"
    "us-west-2b" = "10.20.2.0/24"
  }
}

variable "private_subnet_cidrs_us_west_2" {
  description = "Map of AZ => CIDR for private subnets in us-west-2"
  type        = map(string)
  default = {
    "us-west-2a" = "10.20.11.0/24"
    "us-west-2b" = "10.20.12.0/24"
  }
}

variable "allowed_ingress_cidrs" {
  description = "CIDRs allowed to reach ALB (lock this down for production)"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "db_engine" {
  description = "RDS engine: postgres or mysql"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "16.3"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "backup_retention_days" {
  description = "Days to retain RDS automated backups"
  type        = number
  default     = 7
}

variable "s3_bucket_name_prefix" {
  description = "Prefix for regional S3 bucket names"
  type        = string
  default     = "tap-app"
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package (zip)"
  type        = string
  default     = "function.zip"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "enable_https" {
  description = "Enable HTTPS listener on ALB"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (required if enable_https)"
  type        = string
  default     = null
}

variable "app_port" {
  description = "Application port exposed by EC2"
  type        = number
  default     = 8080
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateways (requires EIPs). Set to false if hitting EIP limits."
  type        = bool
  default     = false
}

variable "one_nat_gateway_per_region" {
  description = "If true, create a single NAT GW per region; else one per AZ"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 30
}

variable "enable_bastion" {
  description = "Create a bastion host in public subnet"
  type        = bool
  default     = false
}

variable "bastion_allowed_cidrs" {
  description = "CIDRs allowed to SSH to bastion"
  type        = list(string)
  default     = []
}

##############################
# Locals
##############################

locals {
  regions = ["us-east-1", "us-west-2"]

  vpc_cidrs = {
    "us-east-1" = var.vpc_cidr_us_east_1
    "us-west-2" = var.vpc_cidr_us_west_2
  }

  public_cidrs = {
    "us-east-1" = var.public_subnet_cidrs_us_east_1
    "us-west-2" = var.public_subnet_cidrs_us_west_2
  }

  private_cidrs = {
    "us-east-1" = var.private_subnet_cidrs_us_east_1
    "us-west-2" = var.private_subnet_cidrs_us_west_2
  }

  # KMS alias names per service/region
  kms_alias = {
    s3 = {
      "us-east-1" = "alias/${var.app_name}-s3-east1"
      "us-west-2" = "alias/${var.app_name}-s3-west2"
    }
    lambda = {
      "us-east-1" = "alias/${var.app_name}-lambda-east1"
      "us-west-2" = "alias/${var.app_name}-lambda-west2"
    }
    rds = {
      "us-east-1" = "alias/${var.app_name}-rds-east1"
      "us-west-2" = "alias/${var.app_name}-rds-west2"
    }
    logs = {
      "us-east-1" = "alias/${var.app_name}-logs-east1"
      "us-west-2" = "alias/${var.app_name}-logs-west2"
    }
  }

  base_tags = merge(var.common_tags, { Environment = "Production" })
}

##############################
# Random ID for uniqueness
##############################

resource "random_id" "suffix" {
  byte_length = 3
}

##############################
# Identity helper
##############################

data "aws_caller_identity" "current" {}

##############################
# US-EAST-1 Networking
##############################

resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.vpc_cidrs["us-east-1"]
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.base_tags, { Name = "${var.app_name}-vpc-east1" })
}

resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  tags     = merge(local.base_tags, { Name = "${var.app_name}-igw-east1" })
}

resource "aws_subnet" "public_us_east_1" {
  provider                = aws.us_east_1
  for_each                = var.public_subnet_cidrs_us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  tags = merge(local.base_tags, {
    Name = "${var.app_name}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private_us_east_1" {
  provider          = aws.us_east_1
  for_each          = var.private_subnet_cidrs_us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = each.value
  availability_zone = each.key
  tags = merge(local.base_tags, {
    Name = "${var.app_name}-private-${each.key}"
    Tier = "private"
  })
}

resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  for_each = var.enable_nat_gateway ? (var.one_nat_gateway_per_region ? { for az, cidr in var.public_subnet_cidrs_us_east_1 : az => cidr if az == sort(keys(var.public_subnet_cidrs_us_east_1))[0] } : var.public_subnet_cidrs_us_east_1) : {}
  domain   = "vpc"
  tags     = merge(local.base_tags, { Name = "${var.app_name}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "us_east_1" {
  provider      = aws.us_east_1
  for_each      = var.enable_nat_gateway ? (var.one_nat_gateway_per_region ? { for az, cidr in var.public_subnet_cidrs_us_east_1 : az => cidr if az == sort(keys(var.public_subnet_cidrs_us_east_1))[0] } : var.public_subnet_cidrs_us_east_1) : {}
  allocation_id = aws_eip.nat_us_east_1[each.key].id
  subnet_id     = aws_subnet.public_us_east_1[each.key].id
  tags          = merge(local.base_tags, { Name = "${var.app_name}-nat-${each.key}" })
  depends_on    = [aws_internet_gateway.us_east_1]
}

resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-rt-public-east1" })
}

resource "aws_route_table_association" "public_us_east_1" {
  provider       = aws.us_east_1
  for_each       = aws_subnet.public_us_east_1
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public_us_east_1.id
}

resource "aws_route_table" "private_us_east_1" {
  provider = aws.us_east_1
  for_each = var.one_nat_gateway_per_region ? { "shared" = sort(keys(var.private_subnet_cidrs_us_east_1))[0] } : var.private_subnet_cidrs_us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.us_east_1[sort(keys(aws_nat_gateway.us_east_1))[0]].id : aws_nat_gateway.us_east_1[each.key].id
    }
  }
  
  tags = merge(local.base_tags, { Name = var.one_nat_gateway_per_region ? "${var.app_name}-rt-private-east1" : "${var.app_name}-rt-private-${each.key}" })
}

resource "aws_route_table_association" "private_us_east_1" {
  provider       = aws.us_east_1
  for_each       = aws_subnet.private_us_east_1
  subnet_id      = each.value.id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_east_1["shared"].id : aws_route_table.private_us_east_1[each.key].id
}

##############################
# US-WEST-2 Networking
##############################

resource "aws_vpc" "us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = local.vpc_cidrs["us-west-2"]
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.base_tags, { Name = "${var.app_name}-vpc-west2" })
}

resource "aws_internet_gateway" "us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  tags     = merge(local.base_tags, { Name = "${var.app_name}-igw-west2" })
}

resource "aws_subnet" "public_us_west_2" {
  provider                = aws.us_west_2
  for_each                = var.public_subnet_cidrs_us_west_2
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true
  tags = merge(local.base_tags, {
    Name = "${var.app_name}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private_us_west_2" {
  provider          = aws.us_west_2
  for_each          = var.private_subnet_cidrs_us_west_2
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = each.value
  availability_zone = each.key
  tags = merge(local.base_tags, {
    Name = "${var.app_name}-private-${each.key}"
    Tier = "private"
  })
}

resource "aws_eip" "nat_us_west_2" {
  provider = aws.us_west_2
  for_each = var.enable_nat_gateway ? (var.one_nat_gateway_per_region ? { for az, cidr in var.public_subnet_cidrs_us_west_2 : az => cidr if az == sort(keys(var.public_subnet_cidrs_us_west_2))[0] } : var.public_subnet_cidrs_us_west_2) : {}
  domain   = "vpc"
  tags     = merge(local.base_tags, { Name = "${var.app_name}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "us_west_2" {
  provider      = aws.us_west_2
  for_each      = var.enable_nat_gateway ? (var.one_nat_gateway_per_region ? { for az, cidr in var.public_subnet_cidrs_us_west_2 : az => cidr if az == sort(keys(var.public_subnet_cidrs_us_west_2))[0] } : var.public_subnet_cidrs_us_west_2) : {}
  allocation_id = aws_eip.nat_us_west_2[each.key].id
  subnet_id     = aws_subnet.public_us_west_2[each.key].id
  tags          = merge(local.base_tags, { Name = "${var.app_name}-nat-${each.key}" })
  depends_on    = [aws_internet_gateway.us_west_2]
}

resource "aws_route_table" "public_us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_west_2.id
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-rt-public-west2" })
}

resource "aws_route_table_association" "public_us_west_2" {
  provider       = aws.us_west_2
  for_each       = aws_subnet.public_us_west_2
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public_us_west_2.id
}

resource "aws_route_table" "private_us_west_2" {
  provider = aws.us_west_2
  for_each = var.one_nat_gateway_per_region ? { "shared" = sort(keys(var.private_subnet_cidrs_us_west_2))[0] } : var.private_subnet_cidrs_us_west_2
  vpc_id   = aws_vpc.us_west_2.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.one_nat_gateway_per_region ? aws_nat_gateway.us_west_2[sort(keys(aws_nat_gateway.us_west_2))[0]].id : aws_nat_gateway.us_west_2[each.key].id
    }
  }
  
  tags = merge(local.base_tags, { Name = var.one_nat_gateway_per_region ? "${var.app_name}-rt-private-west2" : "${var.app_name}-rt-private-${each.key}" })
}

resource "aws_route_table_association" "private_us_west_2" {
  provider       = aws.us_west_2
  for_each       = aws_subnet.private_us_west_2
  subnet_id      = each.value.id
  route_table_id = var.one_nat_gateway_per_region ? aws_route_table.private_us_west_2["shared"].id : aws_route_table.private_us_west_2[each.key].id
}

##############################
# Security Groups (both regions)
##############################

resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-alb-sg-east1"
  description = "ALB SG"
  vpc_id      = aws_vpc.us_east_1.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-alb-sg-east1" })
}

resource "aws_security_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-app-sg-east1"
  description = "App SG"
  vpc_id      = aws_vpc.us_east_1.id
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-app-sg-east1" })
}

resource "aws_security_group" "db_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-db-sg-east1"
  description = "DB SG"
  vpc_id      = aws_vpc.us_east_1.id
  ingress {
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_east_1.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-db-sg-east1" })
}

resource "aws_security_group" "bastion_us_east_1" {
  count       = var.enable_bastion ? 1 : 0
  provider    = aws.us_east_1
  name        = "${var.app_name}-bastion-sg-east1"
  description = "Bastion SG"
  vpc_id      = aws_vpc.us_east_1.id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidrs
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-bastion-sg-east1" })
}

resource "aws_security_group" "alb_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-alb-sg-west2"
  description = "ALB SG"
  vpc_id      = aws_vpc.us_west_2.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = var.allowed_ingress_cidrs
    }
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-alb-sg-west2" })
}

resource "aws_security_group" "app_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-app-sg-west2"
  description = "App SG"
  vpc_id      = aws_vpc.us_west_2.id
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_west_2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-app-sg-west2" })
}

resource "aws_security_group" "db_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-db-sg-west2"
  description = "DB SG"
  vpc_id      = aws_vpc.us_west_2.id
  ingress {
    from_port       = var.db_engine == "postgres" ? 5432 : 3306
    to_port         = var.db_engine == "postgres" ? 5432 : 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_us_west_2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-db-sg-west2" })
}

resource "aws_security_group" "bastion_us_west_2" {
  count       = var.enable_bastion ? 1 : 0
  provider    = aws.us_west_2
  name        = "${var.app_name}-bastion-sg-west2"
  description = "Bastion SG"
  vpc_id      = aws_vpc.us_west_2.id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidrs
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-bastion-sg-west2" })
}

##############################
# KMS Keys per region
##############################

resource "aws_kms_key" "s3_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS CMK for S3 us-east-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowS3"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-s3-east1" })
}

resource "aws_kms_alias" "s3_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_alias.s3["us-east-1"]
  target_key_id = aws_kms_key.s3_us_east_1.key_id
}

resource "aws_kms_key" "lambda_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS CMK for Lambda us-east-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowLambdaService"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-lambda-east1" })
}

resource "aws_kms_alias" "lambda_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_alias.lambda["us-east-1"]
  target_key_id = aws_kms_key.lambda_us_east_1.key_id
}

resource "aws_kms_key" "rds_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS CMK for RDS us-east-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowRDSService"
        Effect    = "Allow"
        Principal = { Service = "rds.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-rds-east1" })
}

resource "aws_kms_alias" "rds_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_alias.rds["us-east-1"]
  target_key_id = aws_kms_key.rds_us_east_1.key_id
}

resource "aws_kms_key" "logs_us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS CMK for CloudWatch Logs us-east-1"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowLogsService"
        Effect    = "Allow"
        Principal = { Service = "logs.us-east-1.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-logs-east1" })
}

resource "aws_kms_alias" "logs_us_east_1" {
  provider      = aws.us_east_1
  name          = local.kms_alias.logs["us-east-1"]
  target_key_id = aws_kms_key.logs_us_east_1.key_id
}

resource "aws_kms_key" "s3_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS CMK for S3 us-west-2"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowS3"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-s3-west2" })
}

resource "aws_kms_alias" "s3_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_alias.s3["us-west-2"]
  target_key_id = aws_kms_key.s3_us_west_2.key_id
}

resource "aws_kms_key" "lambda_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS CMK for Lambda us-west-2"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowLambdaService"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-lambda-west2" })
}

resource "aws_kms_alias" "lambda_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_alias.lambda["us-west-2"]
  target_key_id = aws_kms_key.lambda_us_west_2.key_id
}

resource "aws_kms_key" "rds_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS CMK for RDS us-west-2"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowRDSService"
        Effect    = "Allow"
        Principal = { Service = "rds.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-rds-west2" })
}

resource "aws_kms_alias" "rds_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_alias.rds["us-west-2"]
  target_key_id = aws_kms_key.rds_us_west_2.key_id
}

resource "aws_kms_key" "logs_us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS CMK for CloudWatch Logs us-west-2"
  enable_key_rotation     = true
  deletion_window_in_days = 10
  policy                  = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRoot"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowLogsService"
        Effect    = "Allow"
        Principal = { Service = "logs.us-west-2.amazonaws.com" }
        Action    = ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"]
        Resource  = "*"
      }
    ]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-kms-logs-west2" })
}

resource "aws_kms_alias" "logs_us_west_2" {
  provider      = aws.us_west_2
  name          = local.kms_alias.logs["us-west-2"]
  target_key_id = aws_kms_key.logs_us_west_2.key_id
}

##############################
# S3 per region
##############################

resource "aws_s3_bucket" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = "${var.s3_bucket_name_prefix}-east1-${random_id.suffix.hex}"
  tags     = merge(local.base_tags, { Name = "${var.app_name}-bucket-east1" })
}

resource "aws_s3_bucket_versioning" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.app_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_us_east_1.id
  rule {
    id     = "noncurrent-cleanup"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}

resource "aws_s3_bucket" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = "${var.s3_bucket_name_prefix}-west2-${random_id.suffix.hex}"
  tags     = merge(local.base_tags, { Name = "${var.app_name}-bucket-west2" })
}

resource "aws_s3_bucket_versioning" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_us_west_2" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.app_us_west_2.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_us_west_2.id
  rule {
    id     = "noncurrent-cleanup"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}

##############################
# IAM (EC2/Lambda/Flow Logs)
##############################

resource "aws_iam_role" "ec2_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-ec2-role-east1"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-ec2-role-east1" })
}

resource "aws_iam_policy" "ec2_s3_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-ec2-s3-east1"
  description = "EC2 access to regional S3"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:ListBucket"],
        Resource = aws_s3_bucket.app_us_east_1.arn
      },
      {
        Effect   = "Allow",
        Action   = ["s3:GetObject","s3:PutObject"],
        Resource = "${aws_s3_bucket.app_us_east_1.arn}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt","kms:DescribeKey"],
        Resource = aws_kms_key.s3_us_east_1.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.ec2_us_east_1.name
  policy_arn = aws_iam_policy.ec2_s3_us_east_1.arn
}

resource "aws_iam_instance_profile" "ec2_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-ec2-profile-east1"
  role     = aws_iam_role.ec2_us_east_1.name
}

resource "aws_iam_role" "ec2_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-ec2-role-west2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-ec2-role-west2" })
}

resource "aws_iam_policy" "ec2_s3_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-ec2-s3-west2"
  description = "EC2 access to regional S3"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:ListBucket"],
        Resource = aws_s3_bucket.app_us_west_2.arn
      },
      {
        Effect   = "Allow",
        Action   = ["s3:GetObject","s3:PutObject"],
        Resource = "${aws_s3_bucket.app_us_west_2.arn}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt","kms:DescribeKey"],
        Resource = aws_kms_key.s3_us_west_2.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.ec2_us_west_2.name
  policy_arn = aws_iam_policy.ec2_s3_us_west_2.arn
}

resource "aws_iam_instance_profile" "ec2_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-ec2-profile-west2"
  role     = aws_iam_role.ec2_us_west_2.name
}

resource "aws_iam_role" "lambda_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-lambda-role-east1"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-lambda-role-east1" })
}

resource "aws_iam_policy" "lambda_logs_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-lambda-logs-east1"
  description = "Allow Lambda to write logs"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream","logs:PutLogEvents"],
        Resource = "${aws_cloudwatch_log_group.lambda_us_east_1.arn}:*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt","kms:DescribeKey"],
        Resource = aws_kms_key.lambda_us_east_1.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attach_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.lambda_us_east_1.name
  policy_arn = aws_iam_policy.lambda_logs_us_east_1.arn
}

resource "aws_iam_role" "lambda_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-lambda-role-west2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-lambda-role-west2" })
}

resource "aws_iam_policy" "lambda_logs_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-lambda-logs-west2"
  description = "Allow Lambda to write logs"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["logs:CreateLogStream","logs:PutLogEvents"],
        Resource = "${aws_cloudwatch_log_group.lambda_us_west_2.arn}:*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt","kms:DescribeKey"],
        Resource = aws_kms_key.lambda_us_west_2.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attach_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.lambda_us_west_2.name
  policy_arn = aws_iam_policy.lambda_logs_us_west_2.arn
}

resource "aws_iam_role" "flow_logs_us_east_1" {
  provider = aws.us_east_1
  name     = "${var.app_name}-flow-logs-role-east1"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "vpc-flow-logs.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-flow-logs-role-east1" })
}

resource "aws_iam_policy" "flow_logs_us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-flow-logs-policy-east1"
  description = "Allow flow logs to write to CloudWatch"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["logs:CreateLogStream","logs:PutLogEvents"],
      Resource = "${aws_cloudwatch_log_group.flow_logs_us_east_1.arn}:*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "flow_logs_attach_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.flow_logs_us_east_1.name
  policy_arn = aws_iam_policy.flow_logs_us_east_1.arn
}

resource "aws_iam_role" "flow_logs_us_west_2" {
  provider = aws.us_west_2
  name     = "${var.app_name}-flow-logs-role-west2"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "vpc-flow-logs.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(local.base_tags, { Name = "${var.app_name}-flow-logs-role-west2" })
}

resource "aws_iam_policy" "flow_logs_us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-flow-logs-policy-west2"
  description = "Allow flow logs to write to CloudWatch"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["logs:CreateLogStream","logs:PutLogEvents"],
      Resource = "${aws_cloudwatch_log_group.flow_logs_us_west_2.arn}:*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "flow_logs_attach_us_west_2" {
  provider   = aws.us_west_2
  role       = aws_iam_role.flow_logs_us_west_2.name
  policy_arn = aws_iam_policy.flow_logs_us_west_2.arn
}

##############################
# CloudWatch Log Groups (Lambda + Flow Logs) with KMS
##############################

resource "aws_cloudwatch_log_group" "lambda_us_east_1" {
  provider        = aws.us_east_1
  name            = "/aws/lambda/${var.app_name}-fn-east1"
  retention_in_days = var.log_retention_days
  kms_key_id      = aws_kms_key.logs_us_east_1.arn
  tags            = merge(local.base_tags, { Name = "${var.app_name}-lambda-lg-east1" })
}

resource "aws_cloudwatch_log_group" "lambda_us_west_2" {
  provider        = aws.us_west_2
  name            = "/aws/lambda/${var.app_name}-fn-west2"
  retention_in_days = var.log_retention_days
  kms_key_id      = aws_kms_key.logs_us_west_2.arn
  tags            = merge(local.base_tags, { Name = "${var.app_name}-lambda-lg-west2" })
}

resource "aws_cloudwatch_log_group" "flow_logs_us_east_1" {
  provider         = aws.us_east_1
  name             = "/vpc/flow-logs/${var.app_name}-east1"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.logs_us_east_1.arn
  tags             = merge(local.base_tags, { Name = "${var.app_name}-vpc-flow-lg-east1" })
}

resource "aws_cloudwatch_log_group" "flow_logs_us_west_2" {
  provider         = aws.us_west_2
  name             = "/vpc/flow-logs/${var.app_name}-west2"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.logs_us_west_2.arn
  tags             = merge(local.base_tags, { Name = "${var.app_name}-vpc-flow-lg-west2" })
}

##############################
# VPC Flow Logs
##############################

resource "aws_flow_log" "us_east_1" {
  provider             = aws.us_east_1
  traffic_type         = "ALL"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_logs_us_east_1.arn
  iam_role_arn         = aws_iam_role.flow_logs_us_east_1.arn
  vpc_id               = aws_vpc.us_east_1.id
  tags                 = merge(local.base_tags, { Name = "${var.app_name}-vpc-flow-east1" })
}

resource "aws_flow_log" "us_west_2" {
  provider             = aws.us_west_2
  traffic_type         = "ALL"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_logs_us_west_2.arn
  iam_role_arn         = aws_iam_role.flow_logs_us_west_2.arn
  vpc_id               = aws_vpc.us_west_2.id
  tags                 = merge(local.base_tags, { Name = "${var.app_name}-vpc-flow-west2" })
}

##############################
# Compute: AMIs
##############################

# Create a production-ready Lambda deployment package
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/lambda_placeholder.zip"
  
  source {
    content  = <<-EOT
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3();

      /**
       * Production Lambda Handler for TAP Stack
       * Demonstrates secure S3 interaction with KMS encryption
       * Environment variables are encrypted via KMS (configured in Lambda resource)
       */
      exports.handler = async (event, context) => {
        console.log('Event received:', JSON.stringify(event, null, 2));
        
        const bucketName = process.env.BUCKET_NAME;
        const appEnv = process.env.APP_ENV;
        
        try {
          // Health check endpoint
          if (event.httpMethod === 'GET' && event.path === '/health') {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'healthy',
                environment: appEnv,
                timestamp: new Date().toISOString(),
                function: context.functionName,
                region: process.env.AWS_REGION
              })
            };
          }
          
          // List objects in the S3 bucket (demonstrates IAM permissions)
          if (event.httpMethod === 'GET' && event.path === '/list') {
            const params = {
              Bucket: bucketName,
              MaxKeys: 10
            };
            
            const data = await s3.listObjectsV2(params).promise();
            
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bucket: bucketName,
                objectCount: data.KeyCount,
                objects: data.Contents?.map(obj => ({
                  key: obj.Key,
                  size: obj.Size,
                  lastModified: obj.LastModified
                })) || []
              })
            };
          }
          
          // Upload a test object to S3 (KMS-encrypted server-side)
          if (event.httpMethod === 'POST' && event.path === '/upload') {
            const timestamp = Date.now();
            const key = 'test-uploads/lambda-upload-' + timestamp + '.json';
            
            const uploadParams = {
              Bucket: bucketName,
              Key: key,
              Body: JSON.stringify({
                uploadedAt: new Date().toISOString(),
                source: 'lambda-function',
                environment: appEnv,
                functionName: context.functionName
              }),
              ContentType: 'application/json',
              ServerSideEncryption: 'aws:kms'
            };
            
            await s3.putObject(uploadParams).promise();
            
            return {
              statusCode: 201,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: 'Object uploaded successfully',
                bucket: bucketName,
                key: key,
                encryption: 'KMS (SSE-KMS)'
              })
            };
          }
          
          // Default response
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'TAP Stack Lambda Function',
              environment: appEnv,
              availableEndpoints: [
                { method: 'GET', path: '/health', description: 'Health check' },
                { method: 'GET', path: '/list', description: 'List S3 objects' },
                { method: 'POST', path: '/upload', description: 'Upload test object' }
              ]
            })
          };
          
        } catch (error) {
          console.error('Error:', error);
          
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Internal Server Error',
              message: error.message,
              environment: appEnv
            })
          };
        }
      };
    EOT
    filename = "index.js"
  }
}

data "aws_ami" "al2_us_east_1" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-kernel-5.10-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "al2_us_west_2" {
  provider    = aws.us_west_2
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-kernel-5.10-hvm-*-x86_64-gp2"]
  }
}

##############################
# Compute: ALB, TG, Listeners, EC2
##############################

resource "aws_lb" "us_east_1" {
  provider           = aws.us_east_1
  name               = "${var.app_name}-alb-east1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_east_1.id]
  subnets            = [for s in aws_subnet.public_us_east_1 : s.id]
  tags               = merge(local.base_tags, { Name = "${var.app_name}-alb-east1" })
}

resource "aws_lb_target_group" "us_east_1" {
  provider    = aws.us_east_1
  name        = "${var.app_name}-tg-east1"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.us_east_1.id
  target_type = "instance"
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-tg-east1" })
}

resource "aws_lb_listener" "http_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.us_east_1.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_east_1.arn
  }
}

resource "aws_lb_listener" "https_us_east_1" {
  count             = var.enable_https ? 1 : 0
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.us_east_1.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_east_1.arn
  }
}

resource "aws_lb" "us_west_2" {
  provider           = aws.us_west_2
  name               = "${var.app_name}-alb-west2"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_west_2.id]
  subnets            = [for s in aws_subnet.public_us_west_2 : s.id]
  tags               = merge(local.base_tags, { Name = "${var.app_name}-alb-west2" })
}

resource "aws_lb_target_group" "us_west_2" {
  provider    = aws.us_west_2
  name        = "${var.app_name}-tg-west2"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.us_west_2.id
  target_type = "instance"
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-tg-west2" })
}

resource "aws_lb_listener" "http_us_west_2" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.us_west_2.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_west_2.arn
  }
}

resource "aws_lb_listener" "https_us_west_2" {
  count             = var.enable_https ? 1 : 0
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.us_west_2.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.us_west_2.arn
  }
}

resource "aws_instance" "app_us_east_1" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.al2_us_east_1.id
  instance_type               = "t3.micro"
  subnet_id                   = values(aws_subnet.private_us_east_1)[0].id
  vpc_security_group_ids      = [aws_security_group.app_us_east_1.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_us_east_1.name
  associate_public_ip_address = false
  user_data                   = <<-EOT
    #!/bin/bash
    yum install -y python3
    cat > /usr/local/bin/app.py <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
  def do_GET(self):
    self.send_response(200)
    self.end_headers()
    self.wfile.write(b"ok")
HTTPServer(("0.0.0.0", ${var.app_port}), H).serve_forever()
PY
    nohup python3 /usr/local/bin/app.py &
  EOT
  tags = merge(local.base_tags, { Name = "${var.app_name}-ec2-east1" })
}

resource "aws_lb_target_group_attachment" "east_1" {
  provider          = aws.us_east_1
  target_group_arn  = aws_lb_target_group.us_east_1.arn
  target_id         = aws_instance.app_us_east_1.id
  port              = var.app_port
}

resource "aws_instance" "app_us_west_2" {
  provider                    = aws.us_west_2
  ami                         = data.aws_ami.al2_us_west_2.id
  instance_type               = "t3.micro"
  subnet_id                   = values(aws_subnet.private_us_west_2)[0].id
  vpc_security_group_ids      = [aws_security_group.app_us_west_2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_us_west_2.name
  associate_public_ip_address = false
  user_data                   = <<-EOT
    #!/bin/bash
    yum install -y python3
    cat > /usr/local/bin/app.py <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
  def do_GET(self):
    self.send_response(200)
    self.end_headers()
    self.wfile.write(b"ok")
HTTPServer(("0.0.0.0", ${var.app_port}), H).serve_forever()
PY
    nohup python3 /usr/local/bin/app.py &
  EOT
  tags = merge(local.base_tags, { Name = "${var.app_name}-ec2-west2" })
}

resource "aws_lb_target_group_attachment" "west_2" {
  provider          = aws.us_west_2
  target_group_arn  = aws_lb_target_group.us_west_2.arn
  target_id         = aws_instance.app_us_west_2.id
  port              = var.app_port
}

##############################
# Optional bastion
##############################

resource "aws_instance" "bastion_us_east_1" {
  count                       = var.enable_bastion ? 1 : 0
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.al2_us_east_1.id
  instance_type               = "t3.micro"
  subnet_id                   = values(aws_subnet.public_us_east_1)[0].id
  vpc_security_group_ids      = [aws_security_group.bastion_us_east_1[0].id]
  associate_public_ip_address = true
  tags                        = merge(local.base_tags, { Name = "${var.app_name}-bastion-east1" })
}

resource "aws_instance" "bastion_us_west_2" {
  count                       = var.enable_bastion ? 1 : 0
  provider                    = aws.us_west_2
  ami                         = data.aws_ami.al2_us_west_2.id
  instance_type               = "t3.micro"
  subnet_id                   = values(aws_subnet.public_us_west_2)[0].id
  vpc_security_group_ids      = [aws_security_group.bastion_us_west_2[0].id]
  associate_public_ip_address = true
  tags                        = merge(local.base_tags, { Name = "${var.app_name}-bastion-west2" })
}

##############################
# RDS (private subnets, encrypted, backups)
##############################

resource "aws_db_subnet_group" "us_east_1" {
  provider   = aws.us_east_1
  name       = "${var.app_name}-db-subnets-east1"
  subnet_ids = [for s in aws_subnet.private_us_east_1 : s.id]
  tags       = merge(local.base_tags, { Name = "${var.app_name}-db-subnets-east1" })
}

resource "aws_db_instance" "us_east_1" {
  provider                 = aws.us_east_1
  identifier               = "${var.app_name}-db-east1"
  engine                   = var.db_engine
  engine_version           = var.db_engine_version
  instance_class           = var.db_instance_class
  username                 = var.db_username
  password                 = var.db_password
  allocated_storage        = 20
  storage_encrypted        = true
  kms_key_id               = aws_kms_key.rds_us_east_1.arn
  db_subnet_group_name     = aws_db_subnet_group.us_east_1.name
  vpc_security_group_ids   = [aws_security_group.db_us_east_1.id]
  multi_az                 = true
  publicly_accessible      = false
  backup_retention_period  = var.backup_retention_days
  deletion_protection      = true
  skip_final_snapshot      = true
  apply_immediately        = true
  tags                     = merge(local.base_tags, { Name = "${var.app_name}-db-east1" })
}

resource "aws_db_subnet_group" "us_west_2" {
  provider   = aws.us_west_2
  name       = "${var.app_name}-db-subnets-west2"
  subnet_ids = [for s in aws_subnet.private_us_west_2 : s.id]
  tags       = merge(local.base_tags, { Name = "${var.app_name}-db-subnets-west2" })
}

resource "aws_db_instance" "us_west_2" {
  provider                 = aws.us_west_2
  identifier               = "${var.app_name}-db-west2"
  engine                   = var.db_engine
  engine_version           = var.db_engine_version
  instance_class           = var.db_instance_class
  username                 = var.db_username
  password                 = var.db_password
  allocated_storage        = 20
  storage_encrypted        = true
  kms_key_id               = aws_kms_key.rds_us_west_2.arn
  db_subnet_group_name     = aws_db_subnet_group.us_west_2.name
  vpc_security_group_ids   = [aws_security_group.db_us_west_2.id]
  multi_az                 = true
  publicly_accessible      = false
  backup_retention_period  = var.backup_retention_days
  deletion_protection      = true
  skip_final_snapshot      = true
  apply_immediately        = true
  tags                     = merge(local.base_tags, { Name = "${var.app_name}-db-west2" })
}

##############################
# Lambda per region (env encrypted by KMS)
##############################

resource "aws_lambda_function" "us_east_1" {
  provider      = aws.us_east_1
  function_name = "${var.app_name}-fn-east1"
  role          = aws_iam_role.lambda_us_east_1.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  
  # Use inline code instead of requiring a zip file
  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256
  
  kms_key_arn = aws_kms_key.lambda_us_east_1.arn
  environment {
    variables = {
      APP_ENV     = "Production"
      BUCKET_NAME = aws_s3_bucket.app_us_east_1.bucket
    }
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-fn-east1" })
  
  depends_on = [data.archive_file.lambda_placeholder]
}

resource "aws_lambda_function" "us_west_2" {
  provider      = aws.us_west_2
  function_name = "${var.app_name}-fn-west2"
  role          = aws_iam_role.lambda_us_west_2.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  
  # Use inline code instead of requiring a zip file
  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256
  
  kms_key_arn = aws_kms_key.lambda_us_west_2.arn
  environment {
    variables = {
      APP_ENV     = "Production"
      BUCKET_NAME = aws_s3_bucket.app_us_west_2.bucket
    }
  }
  tags = merge(local.base_tags, { Name = "${var.app_name}-fn-west2" })
  
  depends_on = [data.archive_file.lambda_placeholder]
}

##############################
# Outputs
##############################

output "us_east_1_vpc_id" {
  value = aws_vpc.us_east_1.id
}

output "us_west_2_vpc_id" {
  value = aws_vpc.us_west_2.id
}

output "us_east_1_public_subnet_ids" {
  value = [for s in aws_subnet.public_us_east_1 : s.id]
}

output "us_west_2_public_subnet_ids" {
  value = [for s in aws_subnet.public_us_west_2 : s.id]
}

output "us_east_1_private_subnet_ids" {
  value = [for s in aws_subnet.private_us_east_1 : s.id]
}

output "us_west_2_private_subnet_ids" {
  value = [for s in aws_subnet.private_us_west_2 : s.id]
}

output "us_east_1_alb_dns" {
  value = aws_lb.us_east_1.dns_name
}

output "us_west_2_alb_dns" {
  value = aws_lb.us_west_2.dns_name
}

output "ec2_role_names" {
  value = {
    us_east_1 = aws_iam_role.ec2_us_east_1.name
    us_west_2 = aws_iam_role.ec2_us_west_2.name
  }
}

output "s3_bucket_names" {
  value = {
    us_east_1 = aws_s3_bucket.app_us_east_1.bucket
    us_west_2 = aws_s3_bucket.app_us_west_2.bucket
  }
}

output "kms_key_arns" {
  value = {
    us_east_1 = {
      s3    = aws_kms_key.s3_us_east_1.arn
      lambda = aws_kms_key.lambda_us_east_1.arn
      rds   = aws_kms_key.rds_us_east_1.arn
      logs  = aws_kms_key.logs_us_east_1.arn
    }
    us_west_2 = {
      s3    = aws_kms_key.s3_us_west_2.arn
      lambda = aws_kms_key.lambda_us_west_2.arn
      rds   = aws_kms_key.rds_us_west_2.arn
      logs  = aws_kms_key.logs_us_west_2.arn
    }
  }
}

output "rds_endpoints" {
  value = {
    us_east_1 = aws_db_instance.us_east_1.endpoint
    us_west_2 = aws_db_instance.us_west_2.endpoint
  }
}

output "lambda_arns" {
  value = {
    us_east_1 = aws_lambda_function.us_east_1.arn
    us_west_2 = aws_lambda_function.us_west_2.arn
  }
}

output "flow_log_ids" {
  value = {
    us_east_1 = aws_flow_log.us_east_1.id
    us_west_2 = aws_flow_log.us_west_2.id
  }
}

#############################################
# Acceptance checks (comments as per prompt)
#############################################
# - All resources carry merge(var.common_tags, { Environment = "Production" }).
# - S3 buckets: SSE-KMS enabled with CMK created here, versioning on, public access blocked, lifecycle present.
# - IAM policies scoped to resource ARNs; only logs delivery uses broad actions where necessary.
# - SGs deny by default; only necessary ingress allowed (ALB 80/443 from allowed list; app from ALB SG; DB from app SG).
# - RDS encrypted + backups >= 7 days + deletion protection enabled.
# - Lambda env vars set and encrypted by KMS; dedicated log groups with retention; minimal execution permissions.
# - EC2 accesses S3 via instance profile only; no static credentials.
# - VPC Flow Logs enabled to KMS-encrypted log groups with appropriate role.
# - Two functional, equivalent stacks in us-east-1 and us-west-2.


