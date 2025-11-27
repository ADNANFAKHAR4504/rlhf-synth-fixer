# tap_stack.tf - Multi-region Financial Services Payment Platform
# Terraform 1.5+ with AWS Provider ~> 5.0
# Supports workspaces: dev, staging, prod
# Works with provider.tf and variables.tf files

# Consolidated locals for computed values
locals {
  environment = var.environment_suffix

  # Provider mapping for dynamic provider selection (can't reference providers in locals, will use conditionals in resources)
  provider_map = {
    "us-east-1"      = "us-east-1"
    "eu-west-1"      = "eu-west-1"
    "ap-southeast-1" = "ap-southeast-1"
  }

  # Generate all unique region pairs for VPC peering
  region_pairs = distinct(flatten([
    for i, region1 in var.regions : [
      for j, region2 in var.regions : {
        key     = "${region1}-${region2}"
        region1 = region1
        region2 = region2
      } if i < j
    ]
  ]))

  # Common tags
  common_tags = {
    Environment = local.environment
    ManagedBy   = "Terraform"
    Project     = "PaymentPlatform"
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
  }

  # AZ data source mapping for easier reference
  az_data_sources = {
    "us-east-1"      = data.aws_availability_zones.us_east_1
    "eu-west-1"      = data.aws_availability_zones.eu_west_1
    "ap-southeast-1" = data.aws_availability_zones.ap_southeast_1
  }

  # Resource reference locals for bridging individual regional resources to for_each patterns
  vpc_main = {
    "us-east-1"      = aws_vpc.us_east_1
    "eu-west-1"      = aws_vpc.eu_west_1
    "ap-southeast-1" = aws_vpc.ap_southeast_1
  }

  igw_main = {
    "us-east-1"      = aws_internet_gateway.us_east_1
    "eu-west-1"      = aws_internet_gateway.eu_west_1
    "ap-southeast-1" = aws_internet_gateway.ap_southeast_1
  }

  kms_main = {
    "us-east-1"      = aws_kms_key.us_east_1
    "eu-west-1"      = aws_kms_key.eu_west_1
    "ap-southeast-1" = aws_kms_key.ap_southeast_1
  }

  # Consolidated KMS key lookup (from multiple locals blocks)
  kms_keys = {
    "us-east-1"      = aws_kms_key.us_east_1
    "eu-west-1"      = aws_kms_key.eu_west_1
    "ap-southeast-1" = aws_kms_key.ap_southeast_1
  }

  # VPC lookup for for_each resources (from multiple locals blocks)
  vpcs = {
    "us-east-1"      = aws_vpc.us_east_1
    "eu-west-1"      = aws_vpc.eu_west_1
    "ap-southeast-1" = aws_vpc.ap_southeast_1
  }

  igws = {
    "us-east-1"      = aws_internet_gateway.us_east_1
    "eu-west-1"      = aws_internet_gateway.eu_west_1
    "ap-southeast-1" = aws_internet_gateway.ap_southeast_1
  }

  # RDS security groups mapping (from multiple locals blocks)
  rds_security_groups = {
    "us-east-1"      = aws_security_group.rds_us_east_1
    "eu-west-1"      = aws_security_group.rds_eu_west_1
    "ap-southeast-1" = aws_security_group.rds_ap_southeast_1
  }

  # Lambda security groups mapping
  lambda_security_groups = {
    "us-east-1"      = aws_security_group.lambda_us_east_1
    "eu-west-1"      = aws_security_group.lambda_eu_west_1
    "ap-southeast-1" = aws_security_group.lambda_ap_southeast_1
  }

  # Regional resource mappings for easy reference
  db_subnet_groups = {
    "us-east-1"      = aws_db_subnet_group.us_east_1
    "eu-west-1"      = aws_db_subnet_group.eu_west_1
    "ap-southeast-1" = aws_db_subnet_group.ap_southeast_1
  }

  rds_clusters = {
    "us-east-1"      = aws_rds_cluster.us_east_1
    "eu-west-1"      = aws_rds_cluster.eu_west_1
    "ap-southeast-1" = aws_rds_cluster.ap_southeast_1
  }

  rds_monitoring_roles = {
    "us-east-1"      = aws_iam_role.rds_monitoring_us_east_1
    "eu-west-1"      = aws_iam_role.rds_monitoring_eu_west_1
    "ap-southeast-1" = aws_iam_role.rds_monitoring_ap_southeast_1
  }

  s3_transaction_logs = {
    "us-east-1"      = aws_s3_bucket.transaction_logs_us_east_1
    "eu-west-1"      = aws_s3_bucket.transaction_logs_eu_west_1
    "ap-southeast-1" = aws_s3_bucket.transaction_logs_ap_southeast_1
  }

  api_gateways = {
    "us-east-1"      = aws_api_gateway_rest_api.us_east_1
    "eu-west-1"      = aws_api_gateway_rest_api.eu_west_1
    "ap-southeast-1" = aws_api_gateway_rest_api.ap_southeast_1
  }

  lambda_functions = {
    "us-east-1"      = aws_lambda_function.payment_validator_us_east_1
    "eu-west-1"      = aws_lambda_function.payment_validator_eu_west_1
    "ap-southeast-1" = aws_lambda_function.payment_validator_ap_southeast_1
  }
}

# Data sources for current account and availability zones
data "aws_caller_identity" "current" {}

# Data sources for availability zones per region
data "aws_availability_zones" "us_east_1" {
  provider = aws.us-east-1
  state    = "available"
}

data "aws_availability_zones" "eu_west_1" {
  provider = aws.eu-west-1
  state    = "available"
}

data "aws_availability_zones" "ap_southeast_1" {
  provider = aws.ap-southeast-1
  state    = "available"
}

# S3 bucket for Terraform state (create once in us-east-1)
resource "aws_s3_bucket" "terraform_state" {
  provider = aws.us-east-1
  bucket   = "finserv-terraform-state-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "Terraform State Bucket"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  provider = aws.us-east-1
  name     = "finserv-terraform-locks"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name = "Terraform State Locks"
  })
}

# KMS keys for encryption per region (separate resources for proper provider assignment)
resource "aws_kms_key" "us_east_1" {
  provider = aws.us-east-1

  description             = "KMS key for us-east-1 payment platform encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-kms-key"
    Region = "us-east-1"
  })
}

resource "aws_kms_key" "eu_west_1" {
  provider = aws.eu-west-1

  description             = "KMS key for eu-west-1 payment platform encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-kms-key"
    Region = "eu-west-1"
  })
}

resource "aws_kms_key" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  description             = "KMS key for ap-southeast-1 payment platform encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-kms-key"
    Region = "ap-southeast-1"
  })
}

resource "aws_kms_alias" "us_east_1" {
  provider = aws.us-east-1

  name          = "alias/${local.environment}-us-east-1-payment-platform"
  target_key_id = aws_kms_key.us_east_1.key_id
}

resource "aws_kms_alias" "eu_west_1" {
  provider = aws.eu-west-1

  name          = "alias/${local.environment}-eu-west-1-payment-platform"
  target_key_id = aws_kms_key.eu_west_1.key_id
}

resource "aws_kms_alias" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  name          = "alias/${local.environment}-ap-southeast-1-payment-platform"
  target_key_id = aws_kms_key.ap_southeast_1.key_id
}

# VPC resources per region (separate resources for proper provider assignment)
resource "aws_vpc" "us_east_1" {
  provider = aws.us-east-1

  cidr_block           = var.vpc_cidrs["us-east-1"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-vpc"
    Region = "us-east-1"
  })
}

resource "aws_vpc" "eu_west_1" {
  provider = aws.eu-west-1

  cidr_block           = var.vpc_cidrs["eu-west-1"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-vpc"
    Region = "eu-west-1"
  })
}

resource "aws_vpc" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  cidr_block           = var.vpc_cidrs["ap-southeast-1"]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-vpc"
    Region = "ap-southeast-1"
  })
}

# Internet Gateway per region
resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us-east-1

  vpc_id = aws_vpc.us_east_1.id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-igw"
    Region = "us-east-1"
  })
}

resource "aws_internet_gateway" "eu_west_1" {
  provider = aws.eu-west-1

  vpc_id = aws_vpc.eu_west_1.id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-igw"
    Region = "eu-west-1"
  })
}

resource "aws_internet_gateway" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  vpc_id = aws_vpc.ap_southeast_1.id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-igw"
    Region = "ap-southeast-1"
  })
}


# Public subnets - us-east-1
resource "aws_subnet" "public_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["us-east-1"], 8, i)
    }
  }

  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = each.value.cidr_block
  availability_zone       = data.aws_availability_zones.us_east_1.names[each.value.az_index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-public-${each.value.az_index}"
    Type   = "public"
    Region = "us-east-1"
  })
}

# Public subnets - eu-west-1
resource "aws_subnet" "public_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["eu-west-1"], 8, i)
    }
  }

  vpc_id                  = aws_vpc.eu_west_1.id
  cidr_block              = each.value.cidr_block
  availability_zone       = data.aws_availability_zones.eu_west_1.names[each.value.az_index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-public-${each.value.az_index}"
    Type   = "public"
    Region = "eu-west-1"
  })
}

# Public subnets - ap-southeast-1
resource "aws_subnet" "public_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["ap-southeast-1"], 8, i)
    }
  }

  vpc_id                  = aws_vpc.ap_southeast_1.id
  cidr_block              = each.value.cidr_block
  availability_zone       = data.aws_availability_zones.ap_southeast_1.names[each.value.az_index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-public-${each.value.az_index}"
    Type   = "public"
    Region = "ap-southeast-1"
  })
}

# Private subnets - us-east-1
resource "aws_subnet" "private_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["us-east-1"], 8, i + 100)
    }
  }

  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = each.value.cidr_block
  availability_zone = data.aws_availability_zones.us_east_1.names[each.value.az_index]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-private-${each.value.az_index}"
    Type   = "private"
    Region = "us-east-1"
  })
}

# Private subnets - eu-west-1
resource "aws_subnet" "private_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["eu-west-1"], 8, i + 100)
    }
  }

  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = each.value.cidr_block
  availability_zone = data.aws_availability_zones.eu_west_1.names[each.value.az_index]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-private-${each.value.az_index}"
    Type   = "private"
    Region = "eu-west-1"
  })
}

# Private subnets - ap-southeast-1
resource "aws_subnet" "private_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => {
      az_index   = i
      cidr_block = cidrsubnet(var.vpc_cidrs["ap-southeast-1"], 8, i + 100)
    }
  }

  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = each.value.cidr_block
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[each.value.az_index]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-private-${each.value.az_index}"
    Type   = "private"
    Region = "ap-southeast-1"
  })
}

# Elastic IPs for NAT Gateways - us-east-1
resource "aws_eip" "nat_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-nat-eip-${each.value}"
    Region = "us-east-1"
  })
}

# Elastic IPs for NAT Gateways - eu-west-1
resource "aws_eip" "nat_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-nat-eip-${each.value}"
    Region = "eu-west-1"
  })
}

# Elastic IPs for NAT Gateways - ap-southeast-1
resource "aws_eip" "nat_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-nat-eip-${each.value}"
    Region = "ap-southeast-1"
  })
}

# NAT Gateways - us-east-1
resource "aws_nat_gateway" "us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  allocation_id = aws_eip.nat_us_east_1[each.value].id
  subnet_id     = aws_subnet.public_us_east_1[each.value].id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-nat-${each.value}"
    Region = "us-east-1"
  })
}

# NAT Gateways - eu-west-1
resource "aws_nat_gateway" "eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  allocation_id = aws_eip.nat_eu_west_1[each.value].id
  subnet_id     = aws_subnet.public_eu_west_1[each.value].id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-nat-${each.value}"
    Region = "eu-west-1"
  })
}

# NAT Gateways - ap-southeast-1
resource "aws_nat_gateway" "ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  allocation_id = aws_eip.nat_ap_southeast_1[each.value].id
  subnet_id     = aws_subnet.public_ap_southeast_1[each.value].id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-nat-${each.value}"
    Region = "ap-southeast-1"
  })
}

# Route table for public subnets - us-east-1
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us-east-1

  vpc_id = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-public-rt"
    Region = "us-east-1"
  })
}

# Route table for public subnets - eu-west-1
resource "aws_route_table" "public_eu_west_1" {
  provider = aws.eu-west-1

  vpc_id = aws_vpc.eu_west_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eu_west_1.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-public-rt"
    Region = "eu-west-1"
  })
}

# Route table for public subnets - ap-southeast-1
resource "aws_route_table" "public_ap_southeast_1" {
  provider = aws.ap-southeast-1

  vpc_id = aws_vpc.ap_southeast_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ap_southeast_1.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-public-rt"
    Region = "ap-southeast-1"
  })
}

# Route tables for private subnets - us-east-1
resource "aws_route_table" "private_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  vpc_id = aws_vpc.us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_east_1[each.value].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-private-rt-${each.value}"
    Region = "us-east-1"
  })
}

# Route tables for private subnets - eu-west-1
resource "aws_route_table" "private_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  vpc_id = aws_vpc.eu_west_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eu_west_1[each.value].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-private-rt-${each.value}"
    Region = "eu-west-1"
  })
}

# Route tables for private subnets - ap-southeast-1
resource "aws_route_table" "private_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  vpc_id = aws_vpc.ap_southeast_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.ap_southeast_1[each.value].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-private-rt-${each.value}"
    Region = "ap-southeast-1"
  })
}

# Route table associations for public subnets - us-east-1
resource "aws_route_table_association" "public_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.public_us_east_1[each.value].id
  route_table_id = aws_route_table.public_us_east_1.id
}

# Route table associations for public subnets - eu-west-1
resource "aws_route_table_association" "public_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.public_eu_west_1[each.value].id
  route_table_id = aws_route_table.public_eu_west_1.id
}

# Route table associations for public subnets - ap-southeast-1
resource "aws_route_table_association" "public_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.public_ap_southeast_1[each.value].id
  route_table_id = aws_route_table.public_ap_southeast_1.id
}

# Route table associations for private subnets - us-east-1
resource "aws_route_table_association" "private_us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.private_us_east_1[each.value].id
  route_table_id = aws_route_table.private_us_east_1[each.value].id
}

# Route table associations for private subnets - eu-west-1
resource "aws_route_table_association" "private_eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.private_eu_west_1[each.value].id
  route_table_id = aws_route_table.private_eu_west_1[each.value].id
}

# Route table associations for private subnets - ap-southeast-1
resource "aws_route_table_association" "private_ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  subnet_id      = aws_subnet.private_ap_southeast_1[each.value].id
  route_table_id = aws_route_table.private_ap_southeast_1[each.value].id
}

# Security groups for RDS - Individual regional resources
resource "aws_security_group" "rds_us_east_1" {
  provider = aws.us-east-1

  name_prefix = "${local.environment}-us-east-1-rds-sg"
  vpc_id      = local.vpc_main["us-east-1"].id
  description = "Security group for RDS Aurora cluster"

  ingress {
    description = "MySQL from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["us-east-1"]]
  }

  # Allow traffic from peered VPCs
  ingress {
    description = "MySQL from peered VPC eu-west-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["eu-west-1"]]
  }

  ingress {
    description = "MySQL from peered VPC ap-southeast-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["ap-southeast-1"]]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-rds-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "rds_eu_west_1" {
  provider = aws.eu-west-1

  name_prefix = "${local.environment}-eu-west-1-rds-sg"
  vpc_id      = local.vpc_main["eu-west-1"].id
  description = "Security group for RDS Aurora cluster"

  ingress {
    description = "MySQL from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["eu-west-1"]]
  }

  # Allow traffic from peered VPCs
  ingress {
    description = "MySQL from peered VPC us-east-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["us-east-1"]]
  }

  ingress {
    description = "MySQL from peered VPC ap-southeast-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["ap-southeast-1"]]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-rds-sg"
    Region = "eu-west-1"
  })
}

resource "aws_security_group" "rds_ap_southeast_1" {
  provider = aws.ap-southeast-1

  name_prefix = "${local.environment}-ap-southeast-1-rds-sg"
  vpc_id      = local.vpc_main["ap-southeast-1"].id
  description = "Security group for RDS Aurora cluster"

  ingress {
    description = "MySQL from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["ap-southeast-1"]]
  }

  # Allow traffic from peered VPCs
  ingress {
    description = "MySQL from peered VPC us-east-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["us-east-1"]]
  }

  ingress {
    description = "MySQL from peered VPC eu-west-1"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidrs["eu-west-1"]]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-rds-sg"
    Region = "ap-southeast-1"
  })
}


# Security groups for Lambda (per region for correct provider assignment)
resource "aws_security_group" "lambda_us_east_1" {
  provider = aws.us-east-1

  name_prefix = "${local.environment}-us-east-1-lambda-sg"
  vpc_id      = aws_vpc.us_east_1.id
  description = "Security group for Lambda functions"

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-lambda-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "lambda_eu_west_1" {
  provider = aws.eu-west-1

  name_prefix = "${local.environment}-eu-west-1-lambda-sg"
  vpc_id      = aws_vpc.eu_west_1.id
  description = "Security group for Lambda functions"

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-lambda-sg"
    Region = "eu-west-1"
  })
}

resource "aws_security_group" "lambda_ap_southeast_1" {
  provider = aws.ap-southeast-1

  name_prefix = "${local.environment}-ap-southeast-1-lambda-sg"
  vpc_id      = aws_vpc.ap_southeast_1.id
  description = "Security group for Lambda functions"

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-lambda-sg"
    Region = "ap-southeast-1"
  })
}

# Random password for RDS master password
resource "random_password" "rds_master_us_east_1" {
  length  = 16
  special = true
}

resource "random_password" "rds_master_eu_west_1" {
  length  = 16
  special = true
}

resource "random_password" "rds_master_ap_southeast_1" {
  length  = 16
  special = true
}

# AWS Secrets Manager secrets for RDS passwords per region
resource "aws_secretsmanager_secret" "rds_master_us_east_1" {
  provider                = aws.us-east-1
  name                    = "${local.environment}-us-east-1-rds-master-password"
  description             = "RDS Master Password for us-east-1"
  recovery_window_in_days = 0 # Immediate deletion for dev/testing

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-rds-master-secret"
    Region = "us-east-1"
  })
}

resource "aws_secretsmanager_secret" "rds_master_eu_west_1" {
  provider                = aws.eu-west-1
  name                    = "${local.environment}-eu-west-1-rds-master-password"
  description             = "RDS Master Password for eu-west-1"
  recovery_window_in_days = 0 # Immediate deletion for dev/testing

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-rds-master-secret"
    Region = "eu-west-1"
  })
}

resource "aws_secretsmanager_secret" "rds_master_ap_southeast_1" {
  provider                = aws.ap-southeast-1
  name                    = "${local.environment}-ap-southeast-1-rds-master-password"
  description             = "RDS Master Password for ap-southeast-1"
  recovery_window_in_days = 0 # Immediate deletion for dev/testing

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-rds-master-secret"
    Region = "ap-southeast-1"
  })
}

# Store random passwords in secrets manager
resource "aws_secretsmanager_secret_version" "rds_master_us_east_1" {
  provider  = aws.us-east-1
  secret_id = aws_secretsmanager_secret.rds_master_us_east_1.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master_us_east_1.result
  })
}

resource "aws_secretsmanager_secret_version" "rds_master_eu_west_1" {
  provider  = aws.eu-west-1
  secret_id = aws_secretsmanager_secret.rds_master_eu_west_1.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master_eu_west_1.result
  })
}

resource "aws_secretsmanager_secret_version" "rds_master_ap_southeast_1" {
  provider  = aws.ap-southeast-1
  secret_id = aws_secretsmanager_secret.rds_master_ap_southeast_1.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master_ap_southeast_1.result
  })
}

# DB subnet group for RDS - us-east-1
resource "aws_db_subnet_group" "us_east_1" {
  provider = aws.us-east-1

  name = "${local.environment}-us-east-1-db-subnet-group"
  subnet_ids = [
    for az_index in range(var.az_count) :
    aws_subnet.private_us_east_1[az_index].id
  ]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-db-subnet-group"
    Region = "us-east-1"
  })
}

# DB subnet group for RDS - eu-west-1
resource "aws_db_subnet_group" "eu_west_1" {
  provider = aws.eu-west-1

  name = "${local.environment}-eu-west-1-db-subnet-group"
  subnet_ids = [
    for az_index in range(var.az_count) :
    aws_subnet.private_eu_west_1[az_index].id
  ]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-db-subnet-group"
    Region = "eu-west-1"
  })
}

# DB subnet group for RDS - ap-southeast-1
resource "aws_db_subnet_group" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  name = "${local.environment}-ap-southeast-1-db-subnet-group"
  subnet_ids = [
    for az_index in range(var.az_count) :
    aws_subnet.private_ap_southeast_1[az_index].id
  ]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-db-subnet-group"
    Region = "ap-southeast-1"
  })
}

# RDS Aurora cluster - us-east-1
resource "aws_rds_cluster" "us_east_1" {
  provider = aws.us-east-1

  cluster_identifier              = "${local.environment}-us-east-1-aurora-cluster"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  database_name                   = "payment_db"
  master_username                 = "admin"
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.us_east_1.arn
  db_subnet_group_name            = aws_db_subnet_group.us_east_1.name
  vpc_security_group_ids          = [aws_security_group.rds_us_east_1.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.us_east_1.arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  skip_final_snapshot             = true
  deletion_protection             = false # Explicitly set to false as required

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-aurora-cluster"
    Region = "us-east-1"
  })
}

# RDS Aurora cluster - eu-west-1
resource "aws_rds_cluster" "eu_west_1" {
  provider = aws.eu-west-1

  cluster_identifier              = "${local.environment}-eu-west-1-aurora-cluster"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  database_name                   = "payment_db"
  master_username                 = "admin"
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.eu_west_1.arn
  db_subnet_group_name            = aws_db_subnet_group.eu_west_1.name
  vpc_security_group_ids          = [aws_security_group.rds_eu_west_1.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.eu_west_1.arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  skip_final_snapshot             = true
  deletion_protection             = false # Explicitly set to false as required

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-aurora-cluster"
    Region = "eu-west-1"
  })
}

# RDS Aurora cluster - ap-southeast-1
resource "aws_rds_cluster" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  cluster_identifier              = "${local.environment}-ap-southeast-1-aurora-cluster"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  database_name                   = "payment_db"
  master_username                 = "admin"
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.ap_southeast_1.arn
  db_subnet_group_name            = aws_db_subnet_group.ap_southeast_1.name
  vpc_security_group_ids          = [aws_security_group.rds_ap_southeast_1.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.ap_southeast_1.arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  skip_final_snapshot             = true
  deletion_protection             = false # Explicitly set to false as required

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-aurora-cluster"
    Region = "ap-southeast-1"
  })
}

# RDS Aurora cluster instances - us-east-1
resource "aws_rds_cluster_instance" "us_east_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(2) : i => i # 2 instances per cluster for HA
  }

  identifier                   = "${local.environment}-us-east-1-aurora-instance-${each.value}"
  cluster_identifier           = aws_rds_cluster.us_east_1.id
  instance_class               = var.rds_instance_class[local.environment]
  engine                       = aws_rds_cluster.us_east_1.engine
  engine_version               = aws_rds_cluster.us_east_1.engine_version
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_us_east_1.arn

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-aurora-instance-${each.value}"
    Region = "us-east-1"
  })
}

# RDS Aurora cluster instances - eu-west-1
resource "aws_rds_cluster_instance" "eu_west_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(2) : i => i # 2 instances per cluster for HA
  }

  identifier                   = "${local.environment}-eu-west-1-aurora-instance-${each.value}"
  cluster_identifier           = aws_rds_cluster.eu_west_1.id
  instance_class               = var.rds_instance_class[local.environment]
  engine                       = aws_rds_cluster.eu_west_1.engine
  engine_version               = aws_rds_cluster.eu_west_1.engine_version
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_eu_west_1.arn

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-aurora-instance-${each.value}"
    Region = "eu-west-1"
  })
}

# RDS Aurora cluster instances - ap-southeast-1
resource "aws_rds_cluster_instance" "ap_southeast_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(2) : i => i # 2 instances per cluster for HA
  }

  identifier                   = "${local.environment}-ap-southeast-1-aurora-instance-${each.value}"
  cluster_identifier           = aws_rds_cluster.ap_southeast_1.id
  instance_class               = var.rds_instance_class[local.environment]
  engine                       = aws_rds_cluster.ap_southeast_1.engine
  engine_version               = aws_rds_cluster.ap_southeast_1.engine_version
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_ap_southeast_1.arn

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-aurora-instance-${each.value}"
    Region = "ap-southeast-1"
  })
}

# IAM role for RDS enhanced monitoring - us-east-1
resource "aws_iam_role" "rds_monitoring_us_east_1" {
  provider = aws.us-east-1

  name = "${local.environment}-us-east-1-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-rds-monitoring-role"
    Region = "us-east-1"
  })
}

# IAM role for RDS enhanced monitoring - eu-west-1
resource "aws_iam_role" "rds_monitoring_eu_west_1" {
  provider = aws.eu-west-1

  name = "${local.environment}-eu-west-1-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-rds-monitoring-role"
    Region = "eu-west-1"
  })
}

# IAM role for RDS enhanced monitoring - ap-southeast-1
resource "aws_iam_role" "rds_monitoring_ap_southeast_1" {
  provider = aws.ap-southeast-1

  name = "${local.environment}-ap-southeast-1-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-rds-monitoring-role"
    Region = "ap-southeast-1"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_us_east_1" {
  provider = aws.us-east-1

  role       = aws_iam_role.rds_monitoring_us_east_1.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_eu_west_1" {
  provider = aws.eu-west-1

  role       = aws_iam_role.rds_monitoring_eu_west_1.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_ap_southeast_1" {
  provider = aws.ap-southeast-1

  role       = aws_iam_role.rds_monitoring_ap_southeast_1.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# S3 buckets for transaction logs - us-east-1
resource "aws_s3_bucket" "transaction_logs_us_east_1" {
  provider = aws.us-east-1

  bucket = "${local.environment}-us-east-1-transaction-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-transaction-logs"
    Region = "us-east-1"
  })
}

# S3 buckets for transaction logs - eu-west-1
resource "aws_s3_bucket" "transaction_logs_eu_west_1" {
  provider = aws.eu-west-1

  bucket = "${local.environment}-eu-west-1-transaction-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-transaction-logs"
    Region = "eu-west-1"
  })
}

# S3 buckets for transaction logs - ap-southeast-1
resource "aws_s3_bucket" "transaction_logs_ap_southeast_1" {
  provider = aws.ap-southeast-1

  bucket = "${local.environment}-ap-southeast-1-transaction-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-transaction-logs"
    Region = "ap-southeast-1"
  })
}

resource "aws_s3_bucket_versioning" "transaction_logs_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "transaction_logs_eu_west_1" {
  provider = aws.eu-west-1

  bucket = aws_s3_bucket.transaction_logs_eu_west_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "transaction_logs_ap_southeast_1" {
  provider = aws.ap-southeast-1

  bucket = aws_s3_bucket.transaction_logs_ap_southeast_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.us_east_1.arn
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_eu_west_1" {
  provider = aws.eu-west-1

  bucket = aws_s3_bucket.transaction_logs_eu_west_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.eu_west_1.arn
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_ap_southeast_1" {
  provider = aws.ap-southeast-1

  bucket = aws_s3_bucket.transaction_logs_ap_southeast_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.ap_southeast_1.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs_us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "transaction_logs_eu_west_1" {
  provider = aws.eu-west-1

  bucket = aws_s3_bucket.transaction_logs_eu_west_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "transaction_logs_ap_southeast_1" {
  provider = aws.ap-southeast-1

  bucket = aws_s3_bucket.transaction_logs_ap_southeast_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs_us_east_1" {
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs_us_east_1.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR" # Glacier Instant Retrieval
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs_eu_west_1" {
  provider = aws.eu-west-1

  bucket = aws_s3_bucket.transaction_logs_eu_west_1.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR" # Glacier Instant Retrieval
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs_ap_southeast_1" {
  provider = aws.ap-southeast-1

  bucket = aws_s3_bucket.transaction_logs_ap_southeast_1.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR" # Glacier Instant Retrieval
    }
  }
}

# IAM role for Lambda functions - us-east-1
resource "aws_iam_role" "lambda_us_east_1" {
  provider = aws.us-east-1

  name = "${local.environment}-us-east-1-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-lambda-role"
    Region = "us-east-1"
  })
}

# IAM role for Lambda functions - eu-west-1
resource "aws_iam_role" "lambda_eu_west_1" {
  provider = aws.eu-west-1

  name = "${local.environment}-eu-west-1-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-lambda-role"
    Region = "eu-west-1"
  })
}

# IAM role for Lambda functions - ap-southeast-1
resource "aws_iam_role" "lambda_ap_southeast_1" {
  provider = aws.ap-southeast-1

  name = "${local.environment}-ap-southeast-1-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-lambda-role"
    Region = "ap-southeast-1"
  })
}

# Lambda execution policy with least privilege - us-east-1
resource "aws_iam_role_policy" "lambda_us_east_1" {
  provider = aws.us-east-1

  name = "${local.environment}-us-east-1-lambda-policy"
  role = aws_iam_role.lambda_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.transaction_logs_us_east_1.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.us_east_1.arn
      }
    ]
  })
}

# Lambda execution policy with least privilege - eu-west-1
resource "aws_iam_role_policy" "lambda_eu_west_1" {
  provider = aws.eu-west-1

  name = "${local.environment}-eu-west-1-lambda-policy"
  role = aws_iam_role.lambda_eu_west_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:eu-west-1:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.transaction_logs_eu_west_1.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.eu_west_1.arn
      }
    ]
  })
}

# Lambda execution policy with least privilege - ap-southeast-1
resource "aws_iam_role_policy" "lambda_ap_southeast_1" {
  provider = aws.ap-southeast-1

  name = "${local.environment}-ap-southeast-1-lambda-policy"
  role = aws_iam_role.lambda_ap_southeast_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:ap-southeast-1:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.transaction_logs_ap_southeast_1.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.ap_southeast_1.arn
      }
    ]
  })
}

# Lambda function for payment validation - us-east-1
resource "aws_lambda_function" "payment_validator_us_east_1" {
  provider = aws.us-east-1

  filename                       = "lambda_payload.zip"
  function_name                  = "${local.environment}-us-east-1-payment-validator"
  role                           = aws_iam_role.lambda_us_east_1.arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("lambda_payload.zip")
  runtime                        = "python3.9"
  timeout                        = 30
  memory_size                    = var.lambda_memory_size[local.environment]
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions[local.environment]

  vpc_config {
    subnet_ids = [
      for az_index in range(var.az_count) :
      aws_subnet.private_us_east_1[az_index].id
    ]
    security_group_ids = [aws_security_group.lambda_us_east_1.id]
  }

  environment {
    variables = {
      ENVIRONMENT = local.environment
      REGION      = "us-east-1"
      S3_BUCKET   = aws_s3_bucket.transaction_logs_us_east_1.id
      DB_ENDPOINT = aws_rds_cluster.us_east_1.endpoint
      KMS_KEY_ID  = aws_kms_key.us_east_1.id
    }
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-payment-validator"
    Region = "us-east-1"
  })
}

# Lambda function for payment validation - eu-west-1
resource "aws_lambda_function" "payment_validator_eu_west_1" {
  provider = aws.eu-west-1

  filename                       = "lambda_payload.zip"
  function_name                  = "${local.environment}-eu-west-1-payment-validator"
  role                           = aws_iam_role.lambda_eu_west_1.arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("lambda_payload.zip")
  runtime                        = "python3.9"
  timeout                        = 30
  memory_size                    = var.lambda_memory_size[local.environment]
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions[local.environment]

  vpc_config {
    subnet_ids = [
      for az_index in range(var.az_count) :
      aws_subnet.private_eu_west_1[az_index].id
    ]
    security_group_ids = [aws_security_group.lambda_eu_west_1.id]
  }

  environment {
    variables = {
      ENVIRONMENT = local.environment
      REGION      = "eu-west-1"
      S3_BUCKET   = aws_s3_bucket.transaction_logs_eu_west_1.id
      DB_ENDPOINT = aws_rds_cluster.eu_west_1.endpoint
      KMS_KEY_ID  = aws_kms_key.eu_west_1.id
    }
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-payment-validator"
    Region = "eu-west-1"
  })
}

# Lambda function for payment validation - ap-southeast-1
resource "aws_lambda_function" "payment_validator_ap_southeast_1" {
  provider = aws.ap-southeast-1

  filename                       = "lambda_payload.zip"
  function_name                  = "${local.environment}-ap-southeast-1-payment-validator"
  role                           = aws_iam_role.lambda_ap_southeast_1.arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("lambda_payload.zip")
  runtime                        = "python3.9"
  timeout                        = 30
  memory_size                    = var.lambda_memory_size[local.environment]
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions[local.environment]

  vpc_config {
    subnet_ids = [
      for az_index in range(var.az_count) :
      aws_subnet.private_ap_southeast_1[az_index].id
    ]
    security_group_ids = [aws_security_group.lambda_ap_southeast_1.id]
  }

  environment {
    variables = {
      ENVIRONMENT = local.environment
      REGION      = "ap-southeast-1"
      S3_BUCKET   = aws_s3_bucket.transaction_logs_ap_southeast_1.id
      DB_ENDPOINT = aws_rds_cluster.ap_southeast_1.endpoint
      KMS_KEY_ID  = aws_kms_key.ap_southeast_1.id
    }
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-payment-validator"
    Region = "ap-southeast-1"
  })
}

# Note: Create a dummy lambda_payload.zip file with minimal Python code before running
# Example: echo "def handler(event, context): return {'statusCode': 200}" > index.py && zip lambda_payload.zip index.py

# API Gateway REST API - us-east-1
resource "aws_api_gateway_rest_api" "us_east_1" {
  provider = aws.us-east-1

  name        = "${local.environment}-us-east-1-payment-api"
  description = "Payment processing API for us-east-1"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-us-east-1-payment-api"
    Region = "us-east-1"
  })
}

# API Gateway REST API - eu-west-1
resource "aws_api_gateway_rest_api" "eu_west_1" {
  provider = aws.eu-west-1

  name        = "${local.environment}-eu-west-1-payment-api"
  description = "Payment processing API for eu-west-1"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-eu-west-1-payment-api"
    Region = "eu-west-1"
  })
}

# API Gateway REST API - ap-southeast-1
resource "aws_api_gateway_rest_api" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  name        = "${local.environment}-ap-southeast-1-payment-api"
  description = "Payment processing API for ap-southeast-1"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-ap-southeast-1-payment-api"
    Region = "ap-southeast-1"
  })
}

# API Gateway resource - us-east-1
resource "aws_api_gateway_resource" "payment_us_east_1" {
  provider = aws.us-east-1

  rest_api_id = aws_api_gateway_rest_api.us_east_1.id
  parent_id   = aws_api_gateway_rest_api.us_east_1.root_resource_id
  path_part   = "payment"
}

# API Gateway resource - eu-west-1
resource "aws_api_gateway_resource" "payment_eu_west_1" {
  provider = aws.eu-west-1

  rest_api_id = aws_api_gateway_rest_api.eu_west_1.id
  parent_id   = aws_api_gateway_rest_api.eu_west_1.root_resource_id
  path_part   = "payment"
}

# API Gateway resource - ap-southeast-1
resource "aws_api_gateway_resource" "payment_ap_southeast_1" {
  provider = aws.ap-southeast-1

  rest_api_id = aws_api_gateway_rest_api.ap_southeast_1.id
  parent_id   = aws_api_gateway_rest_api.ap_southeast_1.root_resource_id
  path_part   = "payment"
}

# API Gateway method - us-east-1
resource "aws_api_gateway_method" "payment_post_us_east_1" {
  provider = aws.us-east-1

  rest_api_id   = aws_api_gateway_rest_api.us_east_1.id
  resource_id   = aws_api_gateway_resource.payment_us_east_1.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway method - eu-west-1
resource "aws_api_gateway_method" "payment_post_eu_west_1" {
  provider = aws.eu-west-1

  rest_api_id   = aws_api_gateway_rest_api.eu_west_1.id
  resource_id   = aws_api_gateway_resource.payment_eu_west_1.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway method - ap-southeast-1
resource "aws_api_gateway_method" "payment_post_ap_southeast_1" {
  provider = aws.ap-southeast-1

  rest_api_id   = aws_api_gateway_rest_api.ap_southeast_1.id
  resource_id   = aws_api_gateway_resource.payment_ap_southeast_1.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Lambda integration - us-east-1
resource "aws_api_gateway_integration" "lambda_us_east_1" {
  provider = aws.us-east-1

  rest_api_id = aws_api_gateway_rest_api.us_east_1.id
  resource_id = aws_api_gateway_resource.payment_us_east_1.id
  http_method = aws_api_gateway_method.payment_post_us_east_1.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validator_us_east_1.invoke_arn
}

# API Gateway Lambda integration - eu-west-1
resource "aws_api_gateway_integration" "lambda_eu_west_1" {
  provider = aws.eu-west-1

  rest_api_id = aws_api_gateway_rest_api.eu_west_1.id
  resource_id = aws_api_gateway_resource.payment_eu_west_1.id
  http_method = aws_api_gateway_method.payment_post_eu_west_1.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validator_eu_west_1.invoke_arn
}

# API Gateway Lambda integration - ap-southeast-1
resource "aws_api_gateway_integration" "lambda_ap_southeast_1" {
  provider = aws.ap-southeast-1

  rest_api_id = aws_api_gateway_rest_api.ap_southeast_1.id
  resource_id = aws_api_gateway_resource.payment_ap_southeast_1.id
  http_method = aws_api_gateway_method.payment_post_ap_southeast_1.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validator_ap_southeast_1.invoke_arn
}

# Lambda permission for API Gateway - us-east-1
resource "aws_lambda_permission" "api_gateway_us_east_1" {
  provider = aws.us-east-1

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validator_us_east_1.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.us_east_1.execution_arn}/*/*"
}

# Lambda permission for API Gateway - eu-west-1
resource "aws_lambda_permission" "api_gateway_eu_west_1" {
  provider = aws.eu-west-1

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validator_eu_west_1.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.eu_west_1.execution_arn}/*/*"
}

# Lambda permission for API Gateway - ap-southeast-1
resource "aws_lambda_permission" "api_gateway_ap_southeast_1" {
  provider = aws.ap-southeast-1

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validator_ap_southeast_1.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.ap_southeast_1.execution_arn}/*/*"
}

# API Gateway deployment - us-east-1
resource "aws_api_gateway_deployment" "us_east_1" {
  provider = aws.us-east-1

  depends_on = [
    aws_api_gateway_integration.lambda_us_east_1
  ]

  rest_api_id = aws_api_gateway_rest_api.us_east_1.id
  stage_name  = local.environment
}

# API Gateway deployment - eu-west-1
resource "aws_api_gateway_deployment" "eu_west_1" {
  provider = aws.eu-west-1

  depends_on = [
    aws_api_gateway_integration.lambda_eu_west_1
  ]

  rest_api_id = aws_api_gateway_rest_api.eu_west_1.id
  stage_name  = local.environment
}

# API Gateway deployment - ap-southeast-1
resource "aws_api_gateway_deployment" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  depends_on = [
    aws_api_gateway_integration.lambda_ap_southeast_1
  ]

  rest_api_id = aws_api_gateway_rest_api.ap_southeast_1.id
  stage_name  = local.environment
}

# VPC Peering connection: us-east-1 to eu-west-1
resource "aws_vpc_peering_connection" "us_east_1_to_eu_west_1" {
  provider = aws.us-east-1

  vpc_id      = aws_vpc.us_east_1.id
  peer_vpc_id = aws_vpc.eu_west_1.id
  peer_region = "eu-west-1"
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-us-east-1-to-eu-west-1"
  })
}

# VPC Peering connection: us-east-1 to ap-southeast-1
resource "aws_vpc_peering_connection" "us_east_1_to_ap_southeast_1" {
  provider = aws.us-east-1

  vpc_id      = aws_vpc.us_east_1.id
  peer_vpc_id = aws_vpc.ap_southeast_1.id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-us-east-1-to-ap-southeast-1"
  })
}

# VPC Peering connection: eu-west-1 to ap-southeast-1
resource "aws_vpc_peering_connection" "eu_west_1_to_ap_southeast_1" {
  provider = aws.eu-west-1

  vpc_id      = aws_vpc.eu_west_1.id
  peer_vpc_id = aws_vpc.ap_southeast_1.id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-eu-west-1-to-ap-southeast-1"
  })
}

# Accept VPC peering connection: us-east-1 to eu-west-1 (accept in eu-west-1)
resource "aws_vpc_peering_connection_accepter" "us_east_1_to_eu_west_1" {
  provider = aws.eu-west-1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-accepter-us-east-1-to-eu-west-1"
  })
}

# Accept VPC peering connection: us-east-1 to ap-southeast-1 (accept in ap-southeast-1)
resource "aws_vpc_peering_connection_accepter" "us_east_1_to_ap_southeast_1" {
  provider = aws.ap-southeast-1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-accepter-us-east-1-to-ap-southeast-1"
  })
}

# Accept VPC peering connection: eu-west-1 to ap-southeast-1 (accept in ap-southeast-1)
resource "aws_vpc_peering_connection_accepter" "eu_west_1_to_ap_southeast_1" {
  provider = aws.ap-southeast-1

  vpc_peering_connection_id = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-accepter-eu-west-1-to-ap-southeast-1"
  })
}

# Routes for VPC peering - us-east-1 to eu-west-1
resource "aws_route" "us_east_1_to_eu_west_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_us_east_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["eu-west-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
}

# Routes for VPC peering - eu-west-1 to us-east-1
resource "aws_route" "eu_west_1_to_us_east_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_eu_west_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["us-east-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
}

# Routes for VPC peering - us-east-1 to ap-southeast-1
resource "aws_route" "us_east_1_to_ap_southeast_1" {
  provider = aws.us-east-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_us_east_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["ap-southeast-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
}

# Routes for VPC peering - ap-southeast-1 to us-east-1
resource "aws_route" "ap_southeast_1_to_us_east_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_ap_southeast_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["us-east-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
}

# Routes for VPC peering - eu-west-1 to ap-southeast-1
resource "aws_route" "eu_west_1_to_ap_southeast_1" {
  provider = aws.eu-west-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_eu_west_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["ap-southeast-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
}

# Routes for VPC peering - ap-southeast-1 to eu-west-1
resource "aws_route" "ap_southeast_1_to_eu_west_1" {
  provider = aws.ap-southeast-1
  for_each = {
    for i in range(var.az_count) : i => i
  }

  route_table_id            = aws_route_table.private_ap_southeast_1[each.value].id
  destination_cidr_block    = var.vpc_cidrs["eu-west-1"]
  vpc_peering_connection_id = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
}

# CloudWatch Dashboard for monitoring - us-east-1
resource "aws_cloudwatch_dashboard" "us_east_1" {
  provider = aws.us-east-1

  dashboard_name = "${local.environment}-us-east-1-payment-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "AuroraReplicaLag", { stat = "Average", label = "Replica Lag" }],
            [".", "DiskQueueDepth", { stat = "Average", label = "Disk Queue" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration" }],
            [".", "ConcurrentExecutions", { stat = "Maximum", label = "Concurrent Executions" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}

# CloudWatch Dashboard for monitoring - eu-west-1
resource "aws_cloudwatch_dashboard" "eu_west_1" {
  provider = aws.eu-west-1

  dashboard_name = "${local.environment}-eu-west-1-payment-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "AuroraReplicaLag", { stat = "Average", label = "Replica Lag" }],
            [".", "DiskQueueDepth", { stat = "Average", label = "Disk Queue" }]
          ]
          period = 300
          stat   = "Average"
          region = "eu-west-1"
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration" }],
            [".", "ConcurrentExecutions", { stat = "Maximum", label = "Concurrent Executions" }]
          ]
          period = 300
          stat   = "Average"
          region = "eu-west-1"
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}

# CloudWatch Dashboard for monitoring - ap-southeast-1
resource "aws_cloudwatch_dashboard" "ap_southeast_1" {
  provider = aws.ap-southeast-1

  dashboard_name = "${local.environment}-ap-southeast-1-payment-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "AuroraReplicaLag", { stat = "Average", label = "Replica Lag" }],
            [".", "DiskQueueDepth", { stat = "Average", label = "Disk Queue" }]
          ]
          period = 300
          stat   = "Average"
          region = "ap-southeast-1"
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration" }],
            [".", "ConcurrentExecutions", { stat = "Maximum", label = "Concurrent Executions" }]
          ]
          period = 300
          stat   = "Average"
          region = "ap-southeast-1"
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}

# Outputs grouped by region
output "api_gateway_endpoints" {
  description = "API Gateway endpoints by region"
  value = {
    "us-east-1"      = "https://${local.api_gateways["us-east-1"].id}.execute-api.us-east-1.amazonaws.com/${local.environment}"
    "eu-west-1"      = "https://${local.api_gateways["eu-west-1"].id}.execute-api.eu-west-1.amazonaws.com/${local.environment}"
    "ap-southeast-1" = "https://${local.api_gateways["ap-southeast-1"].id}.execute-api.ap-southeast-1.amazonaws.com/${local.environment}"
  }
}

output "rds_cluster_endpoints" {
  description = "RDS cluster writer endpoints by region"
  value = {
    "us-east-1"      = local.rds_clusters["us-east-1"].endpoint
    "eu-west-1"      = local.rds_clusters["eu-west-1"].endpoint
    "ap-southeast-1" = local.rds_clusters["ap-southeast-1"].endpoint
  }
  sensitive = true
}

output "s3_bucket_names" {
  description = "S3 transaction log bucket names by region"
  value = {
    "us-east-1"      = local.s3_transaction_logs["us-east-1"].id
    "eu-west-1"      = local.s3_transaction_logs["eu-west-1"].id
    "ap-southeast-1" = local.s3_transaction_logs["ap-southeast-1"].id
  }
}

output "kms_key_arns" {
  description = "KMS key ARNs by region"
  value = {
    "us-east-1"      = local.kms_main["us-east-1"].arn
    "eu-west-1"      = local.kms_main["eu-west-1"].arn
    "ap-southeast-1" = local.kms_main["ap-southeast-1"].arn
  }
}

output "vpc_ids" {
  description = "VPC IDs by region"
  value = {
    "us-east-1"      = local.vpc_main["us-east-1"].id
    "eu-west-1"      = local.vpc_main["eu-west-1"].id
    "ap-southeast-1" = local.vpc_main["ap-southeast-1"].id
  }
}

output "vpc_peering_connections" {
  description = "VPC peering connection IDs"
  value = {
    "us-east-1-to-eu-west-1"      = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
    "us-east-1-to-ap-southeast-1" = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
    "eu-west-1-to-ap-southeast-1" = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
  }
}

# Initialize instructions:
# 1. Create lambda_payload.zip: echo "def handler(event, context): return {'statusCode': 200, 'body': 'OK'}" > index.py && zip lambda_payload.zip index.py
# 2. Initialize Terraform: terraform init
# 3. Create workspace: terraform workspace new dev (or staging/prod)
# 4. Plan: terraform plan
# 5. Apply: terraform apply
# 
# After initial apply, uncomment backend configuration and re-init:
# terraform init -backend-config="bucket=finserv-terraform-state-${ACCOUNT_ID}" \
#                -backend-config="key=payment-platform/${WORKSPACE}/terraform.tfstate" \
#                -backend-config="region=us-east-1" \
#                -backend-config="dynamodb_table=finserv-terraform-locks" \
#                -backend-config="encrypt=true"