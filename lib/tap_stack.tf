# tap_stack.tf - Multi-region Financial Services Payment Platform
# Terraform 1.5+ with AWS Provider ~> 5.0
# Supports workspaces: dev, staging, prod
# Works with provider.tf and variables.tf files

# Locals for computed values
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

  # For for_each resources, we need direct references
  db_subnet_group_main            = aws_db_subnet_group.main
  rds_cluster_main                = aws_rds_cluster.main
  rds_monitoring_main             = aws_iam_role.rds_monitoring
  s3_bucket_transaction_logs_main = aws_s3_bucket.transaction_logs
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

# KMS key lookup for for_each resources
locals {
  kms_keys = {
    "us-east-1"      = aws_kms_key.us_east_1
    "eu-west-1"      = aws_kms_key.eu_west_1
    "ap-southeast-1" = aws_kms_key.ap_southeast_1
  }
} # VPC resources per region (separate resources for proper provider assignment)
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

# VPC lookup for for_each resources
locals {
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
}

# Public subnets (3 per region, one per AZ)
resource "aws_subnet" "public" {
  for_each = {
    for subnet in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key        = "${region}-public-${az_index}"
          region     = region
          az_index   = az_index
          cidr_block = cidrsubnet(var.vpc_cidrs[region], 8, az_index)
        }
      ]
    ]) : subnet.key => subnet
  }

  provider                = aws.us-east-1
  vpc_id                  = local.vpcs[each.value.region].id
  cidr_block              = each.value.cidr_block
  availability_zone       = local.az_data_sources[each.value.region].names[each.value.az_index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-public-${each.value.az_index}"
    Type   = "public"
    Region = each.value.region
  })
}

# Private subnets (3 per region, one per AZ)
resource "aws_subnet" "private" {
  for_each = {
    for subnet in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key        = "${region}-private-${az_index}"
          region     = region
          az_index   = az_index
          cidr_block = cidrsubnet(var.vpc_cidrs[region], 8, az_index + 100)
        }
      ]
    ]) : subnet.key => subnet
  }

  provider          = aws.us-east-1
  vpc_id            = local.vpcs[each.value.region].id
  cidr_block        = each.value.cidr_block
  availability_zone = local.az_data_sources[each.value.region].names[each.value.az_index]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-private-${each.value.az_index}"
    Type   = "private"
    Region = each.value.region
  })
}

# Elastic IPs for NAT Gateways (one per AZ for HA)
resource "aws_eip" "nat" {
  for_each = {
    for item in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key      = "${region}-${az_index}"
          region   = region
          az_index = az_index
        }
      ]
    ]) : item.key => item
  }

  provider = aws.us-east-1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-nat-eip-${each.value.az_index}"
    Region = each.value.region
  })
}

# NAT Gateways (one per AZ for HA)
resource "aws_nat_gateway" "main" {
  for_each = {
    for item in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key      = "${region}-${az_index}"
          region   = region
          az_index = az_index
        }
      ]
    ]) : item.key => item
  }

  provider      = aws.us-east-1
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public["${each.value.region}-public-${each.value.az_index}"].id

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-nat-${each.value.az_index}"
    Region = each.value.region
  })
}

# Route table for public subnets
resource "aws_route_table" "public" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  vpc_id = local.vpcs[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = local.igw_main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-public-rt"
    Region = each.key
  })
}

# Route tables for private subnets (one per AZ for independent NAT routing)
resource "aws_route_table" "private" {
  for_each = {
    for item in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key      = "${region}-${az_index}"
          region   = region
          az_index = az_index
        }
      ]
    ]) : item.key => item
  }

  provider = aws.us-east-1
  vpc_id   = local.vpcs[each.value.region].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-private-rt-${each.value.az_index}"
    Region = each.value.region
  })
}

# Route table associations for public subnets
resource "aws_route_table_association" "public" {
  for_each = {
    for subnet in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key      = "${region}-public-${az_index}"
          region   = region
          az_index = az_index
        }
      ]
    ]) : subnet.key => subnet
  }

  provider       = aws.us-east-1
  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public[each.value.region].id
}

# Route table associations for private subnets
resource "aws_route_table_association" "private" {
  for_each = {
    for subnet in flatten([
      for region in var.regions : [
        for az_index in range(var.az_count) : {
          key      = "${region}-private-${az_index}"
          region   = region
          az_index = az_index
        }
      ]
    ]) : subnet.key => subnet
  }

  provider       = aws.us-east-1
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private["${each.value.region}-${each.value.az_index}"].id
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

# Create a local map for backwards compatibility
locals {
  rds_security_groups = {
    "us-east-1"      = aws_security_group.rds_us_east_1
    "eu-west-1"      = aws_security_group.rds_eu_west_1
    "ap-southeast-1" = aws_security_group.rds_ap_southeast_1
  }
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name_prefix = "${local.environment}-${each.key}-lambda-sg"
  vpc_id      = local.vpc_main[each.key].id
  description = "Security group for Lambda functions"

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-lambda-sg"
    Region = each.key
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

# DB subnet group for RDS
resource "aws_db_subnet_group" "main" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name = "${local.environment}-${each.key}-db-subnet-group"
  subnet_ids = [
    for az_index in range(var.az_count) :
    aws_subnet.private["${each.key}-private-${az_index}"].id
  ]

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-db-subnet-group"
    Region = each.key
  })
}

# RDS Aurora cluster per region
resource "aws_rds_cluster" "main" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  cluster_identifier              = "${local.environment}-${each.key}-aurora-cluster"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  database_name                   = "payment_db"
  master_username                 = "admin"
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = local.kms_main[each.key].arn
  db_subnet_group_name            = local.db_subnet_group_main[each.key].name
  vpc_security_group_ids          = [local.rds_security_groups[each.key].id]
  storage_encrypted               = true
  kms_key_id                      = local.kms_main[each.key].arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  skip_final_snapshot             = true
  deletion_protection             = false # Explicitly set to false as required

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-aurora-cluster"
    Region = each.key
  })
}

# RDS Aurora cluster instances
resource "aws_rds_cluster_instance" "main" {
  for_each = {
    for instance in flatten([
      for region in var.regions : [
        for i in range(2) : { # 2 instances per cluster for HA
          key    = "${region}-${i}"
          region = region
          index  = i
        }
      ]
    ]) : instance.key => instance
  }

  provider                     = aws.us-east-1
  identifier                   = "${local.environment}-${each.value.region}-aurora-instance-${each.value.index}"
  cluster_identifier           = local.rds_cluster_main[each.value.region].id
  instance_class               = var.rds_instance_class[local.environment]
  engine                       = local.rds_cluster_main[each.value.region].engine
  engine_version               = local.rds_cluster_main[each.value.region].engine_version
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = local.rds_monitoring_main[each.value.region].arn

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.value.region}-aurora-instance-${each.value.index}"
    Region = each.value.region
  })
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name = "${local.environment}-${each.key}-rds-monitoring-role"

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
    Name   = "${local.environment}-${each.key}-rds-monitoring-role"
    Region = each.key
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  role       = local.rds_monitoring_main[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# S3 buckets for transaction logs
resource "aws_s3_bucket" "transaction_logs" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  bucket = "${local.environment}-${each.key}-transaction-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-transaction-logs"
    Region = each.key
  })
}

resource "aws_s3_bucket_versioning" "transaction_logs" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  bucket = local.s3_bucket_transaction_logs_main[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  bucket = local.s3_bucket_transaction_logs_main[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = local.kms_main[each.key].arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  bucket = aws_s3_bucket.transaction_logs[each.key].id

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

# IAM role for Lambda functions
resource "aws_iam_role" "lambda" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name = "${local.environment}-${each.key}-lambda-role"

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
    Name   = "${local.environment}-${each.key}-lambda-role"
    Region = each.key
  })
}

# Lambda execution policy with least privilege
resource "aws_iam_role_policy" "lambda" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name = "${local.environment}-${each.key}-lambda-policy"
  role = aws_iam_role.lambda[each.key].id

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
        Resource = "arn:aws:logs:${each.key}:${data.aws_caller_identity.current.account_id}:*"
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
        Resource = "${aws_s3_bucket.transaction_logs[each.key].arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = local.kms_main[each.key].arn
      }
    ]
  })
}

# Lambda function for payment validation
resource "aws_lambda_function" "payment_validator" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  filename                       = "lambda_payload.zip"
  function_name                  = "${local.environment}-${each.key}-payment-validator"
  role                           = aws_iam_role.lambda[each.key].arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("lambda_payload.zip")
  runtime                        = "python3.9"
  timeout                        = 30
  memory_size                    = var.lambda_memory_size[local.environment]
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions[local.environment]

  vpc_config {
    subnet_ids = [
      for az_index in range(var.az_count) :
      aws_subnet.private["${each.key}-private-${az_index}"].id
    ]
    security_group_ids = [aws_security_group.lambda[each.key].id]
  }

  environment {
    variables = {
      ENVIRONMENT = local.environment
      REGION      = each.key
      S3_BUCKET   = aws_s3_bucket.transaction_logs[each.key].id
      DB_ENDPOINT = aws_rds_cluster.main[each.key].endpoint
      KMS_KEY_ID  = local.kms_main[each.key].id
    }
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-payment-validator"
    Region = each.key
  })
}

# Note: Create a dummy lambda_payload.zip file with minimal Python code before running
# Example: echo "def handler(event, context): return {'statusCode': 200}" > index.py && zip lambda_payload.zip index.py

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  name        = "${local.environment}-${each.key}-payment-api"
  description = "Payment processing API for ${each.key}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.environment}-${each.key}-payment-api"
    Region = each.key
  })
}

# API Gateway resource
resource "aws_api_gateway_resource" "payment" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  rest_api_id = aws_api_gateway_rest_api.main[each.key].id
  parent_id   = aws_api_gateway_rest_api.main[each.key].root_resource_id
  path_part   = "payment"
}

# API Gateway method
resource "aws_api_gateway_method" "payment_post" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  rest_api_id   = aws_api_gateway_rest_api.main[each.key].id
  resource_id   = aws_api_gateway_resource.payment[each.key].id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Lambda integration
resource "aws_api_gateway_integration" "lambda" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  rest_api_id = aws_api_gateway_rest_api.main[each.key].id
  resource_id = aws_api_gateway_resource.payment[each.key].id
  http_method = aws_api_gateway_method.payment_post[each.key].http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validator[each.key].invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validator[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main[each.key].execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  depends_on = [
    aws_api_gateway_integration.lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.main[each.key].id
  stage_name  = local.environment
}

# VPC Peering connections between all region pairs
resource "aws_vpc_peering_connection" "peers" {
  for_each = {
    for pair in local.region_pairs : pair.key => pair
  }

  provider = aws.us-east-1

  vpc_id      = local.vpc_main[each.value.region1].id
  peer_vpc_id = local.vpc_main[each.value.region2].id
  peer_region = each.value.region2
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-${each.value.region1}-to-${each.value.region2}"
  })
}

# Accept VPC peering connections
resource "aws_vpc_peering_connection_accepter" "peers" {
  for_each = {
    for pair in local.region_pairs : pair.key => pair
  }

  provider = aws.us-east-1

  vpc_peering_connection_id = aws_vpc_peering_connection.peers[each.key].id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name = "${local.environment}-peering-accepter-${each.value.region1}-to-${each.value.region2}"
  })
}

# Routes for VPC peering in private route tables
resource "aws_route" "peering" {
  for_each = {
    for route in flatten([
      for pair in local.region_pairs : [
        for az_index in range(var.az_count) : [
          {
            key                       = "${pair.region1}-${az_index}-to-${pair.region2}"
            route_table_id            = aws_route_table.private["${pair.region1}-${az_index}"].id
            destination_cidr_block    = var.vpc_cidrs[pair.region2]
            vpc_peering_connection_id = aws_vpc_peering_connection.peers[pair.key].id
          },
          {
            key                       = "${pair.region2}-${az_index}-to-${pair.region1}"
            route_table_id            = aws_route_table.private["${pair.region2}-${az_index}"].id
            destination_cidr_block    = var.vpc_cidrs[pair.region1]
            vpc_peering_connection_id = aws_vpc_peering_connection.peers[pair.key].id
          }
        ]
      ]
    ]) : route.key => route
  }

  provider                  = aws.us-east-1
  route_table_id            = each.value.route_table_id
  destination_cidr_block    = each.value.destination_cidr_block
  vpc_peering_connection_id = each.value.vpc_peering_connection_id
}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "main" {
  for_each = toset(var.regions)
  provider = aws.us-east-1

  dashboard_name = "${local.environment}-${each.key}-payment-dashboard"

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
          region = each.key
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
          region = each.key
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
    for region in var.regions : region => {
      url = "https://${aws_api_gateway_rest_api.main[region].id}.execute-api.${region}.amazonaws.com/${local.environment}"
    }
  }
}

output "rds_cluster_endpoints" {
  description = "RDS cluster writer endpoints by region"
  value = {
    for region in var.regions : region => aws_rds_cluster.main[region].endpoint
  }
  sensitive = true
}

output "s3_bucket_names" {
  description = "S3 transaction log bucket names by region"
  value = {
    for region in var.regions : region => aws_s3_bucket.transaction_logs[region].id
  }
}

output "kms_key_arns" {
  description = "KMS key ARNs by region"
  value = {
    for region in var.regions : region => local.kms_main[region].arn
  }
}

output "vpc_ids" {
  description = "VPC IDs by region"
  value = {
    for region in var.regions : region => local.vpc_main[region].id
  }
}

output "vpc_peering_connections" {
  description = "VPC peering connection IDs"
  value = {
    for pair in local.region_pairs :
    "${pair.region1}-to-${pair.region2}" => aws_vpc_peering_connection.peers[pair.key].id
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