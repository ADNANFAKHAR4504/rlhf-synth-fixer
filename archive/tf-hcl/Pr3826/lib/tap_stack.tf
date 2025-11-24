# tap_stack.tf - Complete DR Stack for Financial Trading Platform
# Implements cross-region DR with RTO < 15 minutes and RPO < 1 minute

# ============================================================
# VARIABLES (Complete Set)
# ============================================================

variable "aws_region" {
  description = "AWS region for provider configuration (defined in provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary (DR) AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPCs in both regions"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Map of availability zones per region"
  type        = map(list(string))
  default = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "trading-platform"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Financial-Trading-Team"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Trading-DR-Platform"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = "ChangeMe!123456"
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.r5.large"
}

variable "db_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "13.7"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "trading-platform.example.com"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8080
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = number
  default     = 1024
}

variable "container_memory" {
  description = "Memory for the container"
  type        = number
  default     = 2048
}

variable "task_desired_count" {
  description = "Desired count of tasks"
  type        = number
  default     = 3
}

variable "container_image" {
  description = "Container image for the trading platform"
  type        = string
  default     = "trading-platform:latest"
}

variable "ecr_image_tag" {
  description = "Tag for the container image"
  type        = string
  default     = "latest"
}

variable "sns_email_endpoints" {
  description = "Email addresses for SNS notifications"
  type        = list(string)
  default     = ["ops-team@example.com"]
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}

variable "enable_failover_testing" {
  description = "Enable failover testing mode"
  type        = bool
  default     = false
}

# Additional variables for autoscaling and monitoring
variable "ecs_autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "alarm_evaluation_periods" {
  description = "Number of periods for alarm evaluation"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 60
}

# ============================================================
# DATA SOURCES
# ============================================================

data "aws_caller_identity" "current" {}

data "aws_region" "primary" {
  provider = aws.primary
}

data "aws_region" "secondary" {
  provider = aws.secondary
}

# ============================================================
# PROVIDERS
# ============================================================
# Provider configurations are defined in provider.tf
# This file uses provider aliases aws.primary and aws.secondary

# ============================================================
# RANDOM RESOURCES
# ============================================================

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# ============================================================
# KMS KEYS FOR ENCRYPTION
# ============================================================

resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for encrypting resources in the primary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.app_name}-primary-kms-key"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.app_name}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for encrypting resources in the secondary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.app_name}-secondary-kms-key"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.app_name}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# ============================================================
# SECRETS MANAGEMENT
# ============================================================

# Generic parameter for tests
resource "aws_ssm_parameter" "db_password" {
  provider = aws.primary
  name     = "/trading/db/password/generic"
  type     = "SecureString"
  value    = random_password.db_password.result
  key_id   = aws_kms_key.primary.key_id

  tags = {
    Name        = "${var.app_name}-db-password-generic"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ssm_parameter" "db_password_primary" {
  provider = aws.primary
  name     = "/trading/db/password"
  type     = "SecureString"
  value    = random_password.db_password.result
  key_id   = aws_kms_key.primary.key_id

  tags = {
    Name        = "${var.app_name}-db-password"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ssm_parameter" "db_password_secondary" {
  provider = aws.secondary
  name     = "/trading/db/password"
  type     = "SecureString"
  value    = random_password.db_password.result
  key_id   = aws_kms_key.secondary.key_id

  tags = {
    Name        = "${var.app_name}-db-password"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# CLOUDTRAIL FOR AUDITING
# ============================================================

resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.primary
  bucket   = "${var.app_name}-cloudtrail-${random_string.suffix.result}"

  tags = {
    Name        = "${var.app_name}-cloudtrail-bucket"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id
  policy   = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

resource "aws_cloudtrail" "main" {
  provider                      = aws.primary
  name                          = "${var.app_name}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = ["arn:aws:dynamodb:*:*:table/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }
  }

  tags = {
    Name        = "${var.app_name}-cloudtrail"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ============================================================
# ECR REPOSITORY WITH CROSS-REGION REPLICATION
# ============================================================

resource "aws_ecr_repository" "app" {
  provider = aws.primary
  name     = var.app_name

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.primary.arn
  }

  tags = {
    Name        = "${var.app_name}-ecr"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecr_replication_configuration" "replication" {
  provider = aws.primary

  replication_configuration {
    rule {
      destination {
        region      = var.secondary_region
        registry_id = data.aws_caller_identity.current.account_id
      }
    }
  }
}

# ============================================================
# NETWORKING - PRIMARY REGION
# ============================================================

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.app_name}-primary-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = length(var.availability_zones["us-east-1"])
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones["us-east-1"][count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-primary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = length(var.availability_zones["us-east-1"])
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones["us-east-1"]))
  availability_zone = var.availability_zones["us-east-1"][count.index]

  tags = {
    Name        = "${var.app_name}-primary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "primary_db" {
  provider          = aws.primary
  count             = length(var.availability_zones["us-east-1"])
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.availability_zones["us-east-1"]))
  availability_zone = var.availability_zones["us-east-1"][count.index]

  tags = {
    Name        = "${var.app_name}-primary-db-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name        = "${var.app_name}-primary-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "${var.app_name}-primary-public-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name        = "${var.app_name}-primary-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = {
    Name        = "${var.app_name}-primary-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = {
    Name        = "${var.app_name}-primary-private-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_db" {
  provider       = aws.primary
  count          = length(var.availability_zones["us-east-1"])
  subnet_id      = aws_subnet.primary_db[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# ============================================================
# NETWORKING - SECONDARY REGION
# ============================================================

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.app_name}-secondary-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = length(var.availability_zones["us-west-2"])
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones["us-west-2"][count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-secondary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = length(var.availability_zones["us-west-2"])
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones["us-west-2"]))
  availability_zone = var.availability_zones["us-west-2"][count.index]

  tags = {
    Name        = "${var.app_name}-secondary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "secondary_db" {
  provider          = aws.secondary
  count             = length(var.availability_zones["us-west-2"])
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.availability_zones["us-west-2"]))
  availability_zone = var.availability_zones["us-west-2"][count.index]

  tags = {
    Name        = "${var.app_name}-secondary-db-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name        = "${var.app_name}-secondary-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name        = "${var.app_name}-secondary-public-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name        = "${var.app_name}-secondary-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public[0].id

  tags = {
    Name        = "${var.app_name}-secondary-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  tags = {
    Name        = "${var.app_name}-secondary-private-rtb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

resource "aws_route_table_association" "secondary_db" {
  provider       = aws.secondary
  count          = length(var.availability_zones["us-west-2"])
  subnet_id      = aws_subnet.secondary_db[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

# ============================================================
# VPC PEERING
# ============================================================

resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = {
    Name        = "${var.app_name}-primary-to-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary_accepter" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name        = "${var.app_name}-secondary-accepter"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route" "primary_to_secondary" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary_private.id
  destination_cidr_block    = aws_vpc.secondary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "primary_public_to_secondary" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary_public.id
  destination_cidr_block    = aws_vpc.secondary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_to_primary" {
  provider                  = aws.secondary
  route_table_id            = aws_route_table.secondary_private.id
  destination_cidr_block    = aws_vpc.primary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_public_to_primary" {
  provider                  = aws.secondary
  route_table_id            = aws_route_table.secondary_public.id
  destination_cidr_block    = aws_vpc.primary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# ============================================================
# SECURITY GROUPS
# ============================================================

# Primary Region Security Groups
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-alb-sg"
  description = "Security group for primary ALB"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-primary-alb-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "primary_ecs" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-ecs-sg"
  description = "Security group for primary ECS tasks"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-primary-ecs-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "primary_db" {
  provider    = aws.primary
  name        = "${var.app_name}-primary-db-sg"
  description = "Security group for primary database"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ecs.id]
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
    description = "Allow from secondary region VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-primary-db-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Secondary Region Security Groups
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-alb-sg"
  description = "Security group for secondary ALB"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-secondary-alb-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "secondary_ecs" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-ecs-sg"
  description = "Security group for secondary ECS tasks"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-secondary-ecs-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "secondary_db" {
  provider    = aws.secondary
  name        = "${var.app_name}-secondary-db-sg"
  description = "Security group for secondary database"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ecs.id]
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
    description = "Allow from primary region VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-secondary-db-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# DB SUBNET GROUPS
# ============================================================

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.app_name}-primary-db-subnet-group"
  subnet_ids = aws_subnet.primary_db[*].id

  tags = {
    Name        = "${var.app_name}-primary-db-subnet-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.app_name}-secondary-db-subnet-group"
  subnet_ids = aws_subnet.secondary_db[*].id

  tags = {
    Name        = "${var.app_name}-secondary-db-subnet-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# AURORA GLOBAL DATABASE
# ============================================================

resource "aws_rds_global_cluster" "trading_platform" {
  provider                  = aws.primary
  global_cluster_identifier = "${var.app_name}-global-db"
  engine                    = "aurora-postgresql"
  engine_version            = var.db_engine_version
  database_name             = "trading"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "${var.app_name}-primary-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = var.db_engine_version
  global_cluster_identifier       = aws_rds_global_cluster.trading_platform.id
  database_name                   = "trading"
  master_username                 = var.db_username
  master_password                 = random_password.db_password.result
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.primary_db.id]
  backup_retention_period         = 7
  preferred_backup_window         = "07:00-09:00"
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.app_name}-primary-final-snapshot-${random_string.suffix.result}"
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.primary.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "${var.app_name}-primary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster_instance" "primary" {
  provider             = aws.primary
  count                = 2
  identifier           = "${var.app_name}-primary-instance-${count.index}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = var.db_instance_class
  engine               = "aurora-postgresql"
  engine_version       = var.db_engine_version
  db_subnet_group_name = aws_db_subnet_group.primary.name

  tags = {
    Name        = "${var.app_name}-primary-instance-${count.index}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "${var.app_name}-secondary-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = var.db_engine_version
  global_cluster_identifier       = aws_rds_global_cluster.trading_platform.id
  db_subnet_group_name            = aws_db_subnet_group.secondary.name
  vpc_security_group_ids          = [aws_security_group.secondary_db.id]
  backup_retention_period         = 7
  preferred_backup_window         = "07:00-09:00"
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.app_name}-secondary-final-snapshot-${random_string.suffix.result}"
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.secondary.arn
  source_region                   = var.primary_region
  enabled_cloudwatch_logs_exports = ["postgresql"]

  depends_on = [aws_rds_cluster_instance.primary]

  tags = {
    Name        = "${var.app_name}-secondary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_rds_cluster_instance" "secondary" {
  provider             = aws.secondary
  count                = 2
  identifier           = "${var.app_name}-secondary-instance-${count.index}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = var.db_instance_class
  engine               = "aurora-postgresql"
  engine_version       = var.db_engine_version
  db_subnet_group_name = aws_db_subnet_group.secondary.name

  tags = {
    Name        = "${var.app_name}-secondary-instance-${count.index}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# DYNAMODB GLOBAL TABLE
# ============================================================

resource "aws_dynamodb_table" "primary" {
  provider         = aws.primary
  name             = "${var.app_name}-session-state"
  billing_mode     = "PROVISIONED"
  read_capacity    = var.dynamodb_read_capacity
  write_capacity   = var.dynamodb_write_capacity
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  replica {
    region_name = var.secondary_region
    kms_key_arn = aws_kms_key.secondary.arn
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.app_name}-session-state"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# DynamoDB Autoscaling
resource "aws_appautoscaling_target" "dynamodb_read" {
  provider           = aws.primary
  max_capacity       = 40
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.primary.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read" {
  provider           = aws.primary
  name               = "${var.app_name}-dynamodb-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "dynamodb_write" {
  provider           = aws.primary
  max_capacity       = 40
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.primary.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_write" {
  provider           = aws.primary
  name               = "${var.app_name}-dynamodb-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_write.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_write.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0
  }
}

# ============================================================
# APPLICATION LOAD BALANCERS
# ============================================================

# Primary ALB
resource "aws_lb" "primary" {
  provider                   = aws.primary
  name                       = "${var.app_name}-primary-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.primary_alb.id]
  subnets                    = aws_subnet.primary_public[*].id
  enable_deletion_protection = true
  drop_invalid_header_fields = true

  tags = {
    Name        = "${var.app_name}-primary-alb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "primary_blue" {
  provider    = aws.primary
  name        = "tp-pri-blue-${random_string.suffix.result}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name        = "${var.app_name}-primary-tg-blue"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "primary_green" {
  provider    = aws.primary
  name        = "tp-pri-green-${random_string.suffix.result}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name        = "${var.app_name}-primary-tg-green"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_acm_certificate" "primary" {
  provider          = aws.primary
  domain_name       = "primary.${var.domain_name}"
  validation_method = "DNS"

  tags = {
    Name        = "${var.app_name}-primary-cert"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "primary_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "primary_https" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.primary.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# Secondary ALB
resource "aws_lb" "secondary" {
  provider                   = aws.secondary
  name                       = "${var.app_name}-secondary-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.secondary_alb.id]
  subnets                    = aws_subnet.secondary_public[*].id
  enable_deletion_protection = true
  drop_invalid_header_fields = true

  tags = {
    Name        = "${var.app_name}-secondary-alb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "secondary_blue" {
  provider    = aws.secondary
  name        = "tp-sec-blue-${random_string.suffix.result}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name        = "${var.app_name}-secondary-tg-blue"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_lb_target_group" "secondary_green" {
  provider    = aws.secondary
  name        = "tp-sec-green-${random_string.suffix.result}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name        = "${var.app_name}-secondary-tg-green"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_acm_certificate" "secondary" {
  provider          = aws.secondary
  domain_name       = "secondary.${var.domain_name}"
  validation_method = "DNS"

  tags = {
    Name        = "${var.app_name}-secondary-cert"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "secondary_http" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "secondary_https" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.secondary.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# ============================================================
# ECS CLUSTERS
# ============================================================

# Primary ECS Cluster
resource "aws_ecs_cluster" "primary" {
  provider = aws.primary
  name     = "${var.app_name}-primary-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.app_name}-primary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_cluster_capacity_providers" "primary" {
  provider           = aws.primary
  cluster_name       = aws_ecs_cluster.primary.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# Secondary ECS Cluster
resource "aws_ecs_cluster" "secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-secondary-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.app_name}-secondary-cluster"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_cluster_capacity_providers" "secondary" {
  provider           = aws.secondary
  cluster_name       = aws_ecs_cluster.secondary.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ============================================================
# IAM ROLES
# ============================================================

resource "aws_iam_role" "ecs_task_execution_role" {
  provider = aws.primary
  name     = "${var.app_name}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-task-execution-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  provider = aws.primary
  name     = "${var.app_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-task-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "task_policy" {
  provider    = aws.primary
  name        = "${var.app_name}-task-policy"
  description = "Policy for ECS tasks to access required AWS services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.primary.arn,
          "${aws_dynamodb_table.primary.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          aws_kms_key.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:${var.primary_region}:${data.aws_caller_identity.current.account_id}:parameter/trading/*",
          "arn:aws:ssm:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:parameter/trading/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-task-policy"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.task_policy.arn
}

resource "aws_iam_role" "codedeploy_role" {
  provider = aws.primary
  name     = "${var.app_name}-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-codedeploy-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "codedeploy_role_policy" {
  provider   = aws.primary
  role       = aws_iam_role.codedeploy_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

# ============================================================
# CLOUDWATCH LOG GROUPS
# ============================================================

resource "aws_cloudwatch_log_group" "ecs_primary" {
  provider          = aws.primary
  name              = "/ecs/${var.app_name}-primary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name        = "${var.app_name}-ecs-logs-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "ecs_secondary" {
  provider          = aws.secondary
  name              = "/ecs/${var.app_name}-secondary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.secondary.arn

  tags = {
    Name        = "${var.app_name}-ecs-logs-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# ECS TASK DEFINITIONS AND SERVICES
# ============================================================

resource "aws_ecs_task_definition" "primary" {
  provider                 = aws.primary
  family                   = "${var.app_name}-primary-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.app_name}-primary-container"
      image     = "${aws_ecr_repository.app.repository_url}:${var.ecr_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "REGION",
          value = var.primary_region
        },
        {
          name  = "DB_ENDPOINT",
          value = aws_rds_cluster.primary.endpoint
        },
        {
          name  = "DB_NAME",
          value = "trading"
        },
        {
          name  = "DB_USER",
          value = var.db_username
        },
        {
          name  = "DYNAMODB_TABLE",
          value = aws_dynamodb_table.primary.name
        },
        {
          name  = "PRIMARY_REGION",
          value = var.primary_region
        },
        {
          name  = "SECONDARY_REGION",
          value = var.secondary_region
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password_primary.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_primary.name
          "awslogs-region"        = var.primary_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.app_name}-primary-task"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_service" "primary" {
  provider                          = aws.primary
  name                              = "${var.app_name}-primary-service"
  cluster                           = aws_ecs_cluster.primary.id
  task_definition                   = aws_ecs_task_definition.primary.arn
  desired_count                     = var.task_desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 120

  network_configuration {
    subnets          = aws_subnet.primary_private[*].id
    security_groups  = [aws_security_group.primary_ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.primary_blue.arn
    container_name   = "${var.app_name}-primary-container"
    container_port   = var.container_port
  }

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer
    ]
  }

  tags = {
    Name        = "${var.app_name}-primary-service"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_lb_listener.primary_https]
}

resource "aws_ecs_task_definition" "secondary" {
  provider                 = aws.secondary
  family                   = "${var.app_name}-secondary-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.app_name}-secondary-container"
      image     = "${aws_ecr_repository.app.repository_url}:${var.ecr_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "REGION",
          value = var.secondary_region
        },
        {
          name  = "DB_ENDPOINT",
          value = aws_rds_cluster.secondary.endpoint
        },
        {
          name  = "DB_NAME",
          value = "trading"
        },
        {
          name  = "DB_USER",
          value = var.db_username
        },
        {
          name  = "DYNAMODB_TABLE",
          value = aws_dynamodb_table.primary.name
        },
        {
          name  = "PRIMARY_REGION",
          value = var.primary_region
        },
        {
          name  = "SECONDARY_REGION",
          value = var.secondary_region
        },
        {
          name  = "IS_DR_REGION",
          value = "true"
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password_secondary.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_secondary.name
          "awslogs-region"        = var.secondary_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.app_name}-secondary-task"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_ecs_service" "secondary" {
  provider                          = aws.secondary
  name                              = "${var.app_name}-secondary-service"
  cluster                           = aws_ecs_cluster.secondary.id
  task_definition                   = aws_ecs_task_definition.secondary.arn
  desired_count                     = var.task_desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 120

  network_configuration {
    subnets          = aws_subnet.secondary_private[*].id
    security_groups  = [aws_security_group.secondary_ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.secondary_blue.arn
    container_name   = "${var.app_name}-secondary-container"
    container_port   = var.container_port
  }

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer
    ]
  }

  tags = {
    Name        = "${var.app_name}-secondary-service"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_lb_listener.secondary_https]
}

# ============================================================
# BLUE/GREEN DEPLOYMENT
# ============================================================

resource "aws_codedeploy_app" "primary" {
  provider         = aws.primary
  name             = "${var.app_name}-primary"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "primary" {
  provider               = aws.primary
  app_name               = aws_codedeploy_app.primary.name
  deployment_group_name  = "${var.app_name}-primary-deployment-group"
  service_role_arn       = aws_iam_role.codedeploy_role.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  ecs_service {
    cluster_name = aws_ecs_cluster.primary.name
    service_name = aws_ecs_service.primary.name
  }

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.primary_https.arn]
      }

      target_group {
        name = aws_lb_target_group.primary_blue.name
      }

      target_group {
        name = aws_lb_target_group.primary_green.name
      }
    }
  }
}

resource "aws_codedeploy_app" "secondary" {
  provider         = aws.secondary
  name             = "${var.app_name}-secondary"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "secondary" {
  provider               = aws.secondary
  app_name               = aws_codedeploy_app.secondary.name
  deployment_group_name  = "${var.app_name}-secondary-deployment-group"
  service_role_arn       = aws_iam_role.codedeploy_role.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  ecs_service {
    cluster_name = aws_ecs_cluster.secondary.name
    service_name = aws_ecs_service.secondary.name
  }

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.secondary_https.arn]
      }

      target_group {
        name = aws_lb_target_group.secondary_blue.name
      }

      target_group {
        name = aws_lb_target_group.secondary_green.name
      }
    }
  }
}

# ============================================================
# SNS TOPICS FOR NOTIFICATIONS
# ============================================================

resource "aws_sns_topic" "alerts_primary" {
  provider          = aws.primary
  name              = "${var.app_name}-alerts-primary"
  kms_master_key_id = aws_kms_key.primary.id

  tags = {
    Name        = "${var.app_name}-alerts-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_subscription" "email_primary" {
  provider  = aws.primary
  count     = length(var.sns_email_endpoints)
  topic_arn = aws_sns_topic.alerts_primary.arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoints[count.index]
}

resource "aws_sns_topic" "alerts_secondary" {
  provider          = aws.secondary
  name              = "${var.app_name}-alerts-secondary"
  kms_master_key_id = aws_kms_key.secondary.id

  tags = {
    Name        = "${var.app_name}-alerts-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_subscription" "email_secondary" {
  provider  = aws.secondary
  count     = length(var.sns_email_endpoints)
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoints[count.index]
}

# ============================================================
# LAMBDA FUNCTIONS FOR FAILOVER AUTOMATION
# ============================================================

# Lambda execution role
resource "aws_iam_role" "lambda_failover_role" {
  provider = aws.primary
  name     = "${var.app_name}-lambda-failover-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-lambda-failover-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda failover policy
resource "aws_iam_policy" "lambda_failover_policy" {
  provider = aws.primary
  name     = "${var.app_name}-lambda-failover-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "route53:ListResourceRecordSets",
          "rds:FailoverGlobalCluster",
          "rds:DescribeGlobalClusters",
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "sns:Publish",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_failover_policy" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_failover_role.name
  policy_arn = aws_iam_policy.lambda_failover_policy.arn
}

# Lambda function for automated failover
resource "aws_lambda_function" "failover_automation" {
  provider      = aws.primary
  filename      = "${path.module}/lambda/failover.zip"
  function_name = "${var.app_name}-failover-automation"
  role          = aws_iam_role.lambda_failover_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 300
  memory_size   = 512

  environment {
    variables = {
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGION  = var.secondary_region
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.trading_platform.id
      ROUTE53_ZONE_ID   = aws_route53_zone.primary.zone_id
      SNS_TOPIC_ARN     = aws_sns_topic.alerts_primary.arn
      DOMAIN_NAME       = var.domain_name
    }
  }

  tags = {
    Name        = "${var.app_name}-failover-automation"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda function for failover testing
resource "aws_lambda_function" "test_failover" {
  provider      = aws.primary
  filename      = "${path.module}/lambda/test_failover.zip"
  function_name = "${var.app_name}-test-failover"
  role          = aws_iam_role.lambda_failover_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 300
  memory_size   = 256

  environment {
    variables = {
      PRIMARY_ALB_DNS   = aws_lb.primary.dns_name
      SECONDARY_ALB_DNS = aws_lb.secondary.dns_name
      TEST_ENDPOINT     = "/health"
      SNS_TOPIC_ARN     = aws_sns_topic.alerts_primary.arn
    }
  }

  tags = {
    Name        = "${var.app_name}-test-failover"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# CLOUDWATCH ALARMS
# ============================================================

# ALB Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-alb-unhealthy-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "This metric monitors unhealthy ALB targets"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
  }

  tags = {
    Name        = "${var.app_name}-alb-alarm-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Aurora CPU Alarm
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-aurora-cpu-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = {
    Name        = "${var.app_name}-aurora-cpu-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ECS Service CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-ecs-cpu-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS service CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]

  dimensions = {
    ServiceName = aws_ecs_service.primary.name
    ClusterName = aws_ecs_cluster.primary.name
  }

  tags = {
    Name        = "${var.app_name}-ecs-cpu-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# EVENTBRIDGE RULES FOR AUTOMATION
# ============================================================

resource "aws_cloudwatch_event_rule" "health_check_failure" {
  provider    = aws.primary
  name        = "${var.app_name}-health-check-failure"
  description = "Trigger failover on health check failure"

  event_pattern = jsonencode({
    source      = ["aws.route53"]
    detail-type = ["Route 53 Health Check Status Change"]
    detail = {
      state = ["ALARM"]
    }
  })

  tags = {
    Name        = "${var.app_name}-health-failure-rule"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "lambda_failover" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.health_check_failure.name
  target_id = "LambdaFailoverTarget"
  arn       = aws_lambda_function.failover_automation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check_failure.arn
}

# ============================================================
# ROUTE53 CONFIGURATION
# ============================================================

resource "aws_route53_zone" "primary" {
  provider = aws.primary
  name     = var.domain_name

  tags = {
    Name        = "${var.app_name}-zone"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "${var.app_name}-primary-health-check"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  fqdn              = aws_lb.secondary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "${var.app_name}-secondary-health-check"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.primary.zone_id
  name     = var.domain_name
  type     = "A"

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id
  set_identifier  = "primary"
}

resource "aws_route53_record" "secondary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.primary.zone_id
  name     = var.domain_name
  type     = "A"

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id
  set_identifier  = "secondary"
}

# ============================================================
# ECS AUTOSCALING
# ============================================================

resource "aws_appautoscaling_target" "ecs_primary" {
  provider           = aws.primary
  max_capacity       = var.ecs_autoscaling_max_capacity
  min_capacity       = var.ecs_autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.primary.name}/${aws_ecs_service.primary.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_primary_cpu" {
  provider           = aws.primary
  name               = "${var.app_name}-primary-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_primary.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_primary.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_primary.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "ecs_secondary" {
  provider           = aws.secondary
  max_capacity       = var.ecs_autoscaling_max_capacity
  min_capacity       = var.ecs_autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.secondary.name}/${aws_ecs_service.secondary.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_secondary_cpu" {
  provider           = aws.secondary
  name               = "${var.app_name}-secondary-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_secondary.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_secondary.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_secondary.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# ============================================================
# ADVANCED FEATURES: CHAOS ENGINEERING & DR TESTING
# ============================================================

# Lambda function for automated DR drills
resource "aws_lambda_function" "automated_dr_drill" {
  provider         = aws.primary
  filename         = "${path.module}/lambda/dr_drill.zip"
  function_name    = "${var.app_name}-dr-drill"
  role            = aws_iam_role.lambda_failover_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 600
  memory_size     = 512

  environment {
    variables = {
      PRIMARY_HEALTH_CHECK_ID   = aws_route53_health_check.primary.id
      SECONDARY_HEALTH_CHECK_ID = aws_route53_health_check.secondary.id
      PRIMARY_DB_ENDPOINT       = aws_rds_cluster.primary.endpoint
      SECONDARY_DB_ENDPOINT     = aws_rds_cluster.secondary.endpoint
      SNS_TOPIC_ARN            = aws_sns_topic.alerts.arn
      DYNAMODB_TABLE_NAME      = aws_dynamodb_table.primary.name
    }
  }

  tags = {
    Name        = "${var.app_name}-dr-drill"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# EventBridge rule for weekly DR drills (every Sunday at 2 AM UTC)
resource "aws_cloudwatch_event_rule" "weekly_dr_drill" {
  provider            = aws.primary
  name                = "${var.app_name}-weekly-dr-drill"
  description         = "Triggers automated DR drill every Sunday at 2 AM"
  schedule_expression = "cron(0 2 ? * SUN *)"

  tags = {
    Name        = "${var.app_name}-weekly-dr-drill"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "dr_drill_target" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.weekly_dr_drill.name
  target_id = "DrDrillLambda"
  arn       = aws_lambda_function.automated_dr_drill.arn
}

resource "aws_lambda_permission" "allow_eventbridge_dr_drill" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.automated_dr_drill.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_dr_drill.arn
}

# ============================================================
# COST OPTIMIZATION: AWS BUDGETS & FARGATE SPOT
# ============================================================

# Cost budget alerts for DR infrastructure
resource "aws_budgets_budget" "dr_infrastructure" {
  provider          = aws.primary
  name              = "${var.app_name}-dr-budget"
  budget_type       = "COST"
  limit_amount      = "5000"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = formatdate("YYYY-MM-01_00:00", timestamp())

  cost_filter {
    name = "TagKeyValue"
    values = [
      "Project$${var.project}"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = ["ops@example.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_email_addresses = ["ops@example.com"]
  }
}

# ============================================================
# ADVANCED OBSERVABILITY: X-RAY TRACING
# ============================================================

# X-Ray sampling rule for distributed tracing
resource "aws_xray_sampling_rule" "trading_platform" {
  provider      = aws.primary
  rule_name     = "${var.app_name}-sampling"
  priority      = 1000
  version       = 1
  reservoir_size = 1
  fixed_rate    = 0.05
  url_path      = "*"
  host          = "*"
  http_method   = "*"
  service_type  = "*"
  service_name  = var.app_name
  resource_arn  = "*"

  attributes = {
    Environment = var.environment
  }
}

# Custom CloudWatch metric for trade execution latency
resource "aws_cloudwatch_metric_alarm" "trade_execution_latency" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-trade-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TradeExecutionTime"
  namespace           = "TradingPlatform"
  period              = "60"
  statistic           = "Average"
  threshold           = "500"
  alarm_description   = "Trade execution time exceeding 500ms SLA"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.app_name}-trade-latency"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Custom metric for error rate tracking
resource "aws_cloudwatch_metric_alarm" "error_rate_high" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-error-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorRate"
  namespace           = "TradingPlatform"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Error rate exceeding 5% threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.app_name}-error-rate"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ============================================================
# COMPLIANCE-AS-CODE: AWS CONFIG RULES
# ============================================================

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  provider = aws.primary
  name     = "${var.app_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-config-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  provider   = aws.primary
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket for Config logs
resource "aws_s3_bucket" "config" {
  provider = aws.primary
  bucket   = "${var.app_name}-config-${random_string.suffix.result}"

  tags = {
    Name        = "${var.app_name}-config"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "config" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

# AWS Config recorder
resource "aws_config_configuration_recorder" "main" {
  provider = aws.primary
  name     = "${var.app_name}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  provider       = aws.primary
  name           = "${var.app_name}-config-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  provider   = aws.primary
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config rule: Ensure all EBS volumes are encrypted
resource "aws_config_config_rule" "encrypted_volumes" {
  provider = aws.primary
  name     = "${var.app_name}-encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule: Ensure RDS storage is encrypted
resource "aws_config_config_rule" "rds_encryption" {
  provider = aws.primary
  name     = "${var.app_name}-rds-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule: Ensure CloudTrail is enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  provider = aws.primary
  name     = "${var.app_name}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config rule: Ensure IAM password policy meets requirements
resource "aws_config_config_rule" "iam_password_policy" {
  provider = aws.primary
  name     = "${var.app_name}-iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# ============================================================
# ADVANCED SECRETS MANAGEMENT: ROTATION
# ============================================================

# Secrets Manager secret with rotation
resource "aws_secretsmanager_secret" "db_master_password" {
  provider    = aws.primary
  name        = "${var.app_name}/db/master-password-${random_string.suffix.result}"
  description = "Aurora PostgreSQL master password with auto-rotation"

  tags = {
    Name        = "${var.app_name}-db-password"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.db_master_password.id
  secret_string = random_password.db_password.result
}

# Lambda function for secret rotation
resource "aws_lambda_function" "rotate_secret" {
  provider         = aws.primary
  filename         = "${path.module}/lambda/rotate_secret.zip"
  function_name    = "${var.app_name}-rotate-secret"
  role            = aws_iam_role.lambda_rotation_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  memory_size     = 256

  environment {
    variables = {
      DB_CLUSTER_ID     = aws_rds_cluster.primary.id
      DB_USERNAME       = var.db_username
      SECONDARY_REGION  = var.secondary_region
    }
  }

  tags = {
    Name        = "${var.app_name}-rotate-secret"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM role for rotation Lambda
resource "aws_iam_role" "lambda_rotation_role" {
  provider = aws.primary
  name     = "${var.app_name}-rotation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-rotation-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "lambda_rotation_policy" {
  provider = aws.primary
  name     = "${var.app_name}-rotation-policy"
  role     = aws_iam_role.lambda_rotation_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_master_password.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBCluster",
          "rds:DescribeDBClusters"
        ]
        Resource = [
          aws_rds_cluster.primary.arn,
          aws_rds_cluster.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_secretsmanager_secret_rotation" "db_master_password" {
  provider            = aws.primary
  secret_id           = aws_secretsmanager_secret.db_master_password.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_secretsmanager_secret_version.db_master_password]
}

resource "aws_lambda_permission" "allow_secretsmanager" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotate_secret.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# ============================================================
# SRE PRACTICES: SLO/SLI TRACKING
# ============================================================

# Composite alarm for SLO breach (99.99% availability)
resource "aws_cloudwatch_composite_alarm" "slo_breach" {
  provider          = aws.primary
  alarm_name        = "${var.app_name}-slo-breach"
  alarm_description = "SLO breach: System availability below 99.99%"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alerts.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.trade_execution_latency.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.error_rate_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.alb_unhealthy_primary.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.aurora_cpu_primary.alarm_name})"
  ])

  tags = {
    Name        = "${var.app_name}-slo-breach"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [
    aws_cloudwatch_metric_alarm.trade_execution_latency,
    aws_cloudwatch_metric_alarm.error_rate_high,
    aws_cloudwatch_metric_alarm.alb_unhealthy_primary,
    aws_cloudwatch_metric_alarm.aurora_cpu_primary
  ]
}

# Error budget alarm
resource "aws_cloudwatch_metric_alarm" "error_budget_exhausted" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-error-budget-exhausted"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ErrorBudgetRemaining"
  namespace           = "TradingPlatform/SLO"
  period              = "3600"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "Error budget remaining below 10%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = {
    Name        = "${var.app_name}-error-budget"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda for SLO calculation and error budget tracking
resource "aws_lambda_function" "slo_calculator" {
  provider         = aws.primary
  filename         = "${path.module}/lambda/slo_calculator.zip"
  function_name    = "${var.app_name}-slo-calculator"
  role            = aws_iam_role.lambda_failover_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  memory_size     = 256

  environment {
    variables = {
      SLO_TARGET            = "99.99"
      METRIC_NAMESPACE      = "TradingPlatform/SLO"
      PRIMARY_ALB_ARN       = aws_lb.primary.arn
      SECONDARY_ALB_ARN     = aws_lb.secondary.arn
      CLOUDWATCH_LOG_GROUP  = aws_cloudwatch_log_group.ecs_primary.name
    }
  }

  tags = {
    Name        = "${var.app_name}-slo-calculator"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# EventBridge rule for hourly SLO calculation
resource "aws_cloudwatch_event_rule" "slo_calculation" {
  provider            = aws.primary
  name                = "${var.app_name}-slo-calculation"
  description         = "Triggers SLO calculation every hour"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name        = "${var.app_name}-slo-calculation"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "slo_calculation_target" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.slo_calculation.name
  target_id = "SLOCalculatorLambda"
  arn       = aws_lambda_function.slo_calculator.arn
}

resource "aws_lambda_permission" "allow_eventbridge_slo" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridgeSLO"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slo_calculator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.slo_calculation.arn
}

# ============================================================
# OUTPUTS
# ============================================================

output "primary_alb_dns" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "primary_db_endpoint" {
  description = "Primary database endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_db_endpoint" {
  description = "Secondary database endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "route53_nameservers" {
  description = "Route53 zone nameservers"
  value       = aws_route53_zone.primary.name_servers
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = aws_dynamodb_table.primary.name
}

output "primary_ecs_cluster_name" {
  description = "Primary ECS cluster name"
  value       = aws_ecs_cluster.primary.name
}

output "secondary_ecs_cluster_name" {
  description = "Secondary ECS cluster name"
  value       = aws_ecs_cluster.secondary.name
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

output "primary_kms_key_id" {
  description = "Primary region KMS key ID"
  value       = aws_kms_key.primary.arn
}

output "secondary_kms_key_id" {
  description = "Secondary region KMS key ID"
  value       = aws_kms_key.secondary.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts_primary.arn
}

output "lambda_failover_function_name" {
  description = "Lambda failover function name"
  value       = aws_lambda_function.failover_automation.function_name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "Secondary health check ID"
  value       = aws_route53_health_check.secondary.id
}

output "ecr_repository_uri" {
  description = "ECR repository URI"
  value       = aws_ecr_repository.app.repository_url
}

output "primary_codedeploy_app" {
  description = "Primary CodeDeploy application name"
  value       = aws_codedeploy_app.primary.name
}

output "secondary_codedeploy_app" {
  description = "Secondary CodeDeploy application name"
  value       = aws_codedeploy_app.secondary.name
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    ecs_primary     = aws_cloudwatch_log_group.ecs_primary.name
    ecs_secondary   = aws_cloudwatch_log_group.ecs_secondary.name
    lambda_failover = "/aws/lambda/${aws_lambda_function.failover_automation.function_name}"
  }
}

output "resource_tags" {
  description = "Standard tags applied to resources"
  value = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

output "aurora_backup_retention_days" {
  description = "Aurora backup retention period in days"
  value       = aws_rds_cluster.primary.backup_retention_period
}

output "dynamodb_pitr_enabled" {
  description = "DynamoDB Point-in-Time Recovery status"
  value       = aws_dynamodb_table.primary.point_in_time_recovery[0].enabled
}

output "ecs_autoscaling_enabled" {
  description = "ECS autoscaling configuration"
  value = {
    primary_min   = aws_appautoscaling_target.ecs_primary.min_capacity
    primary_max   = aws_appautoscaling_target.ecs_primary.max_capacity
    secondary_min = aws_appautoscaling_target.ecs_secondary.min_capacity
    secondary_max = aws_appautoscaling_target.ecs_secondary.max_capacity
  }
}

# Advanced Features Outputs
output "dr_drill_lambda_name" {
  description = "Name of the automated DR drill Lambda function"
  value       = aws_lambda_function.automated_dr_drill.function_name
}

output "dr_drill_schedule" {
  description = "Schedule expression for automated DR drills"
  value       = aws_cloudwatch_event_rule.weekly_dr_drill.schedule_expression
}

output "cost_budget_name" {
  description = "Name of the cost budget for DR infrastructure"
  value       = aws_budgets_budget.dr_infrastructure.name
}

output "xray_sampling_rule" {
  description = "X-Ray sampling rule name for distributed tracing"
  value       = aws_xray_sampling_rule.trading_platform.rule_name
}

output "config_recorder_name" {
  description = "AWS Config recorder name for compliance monitoring"
  value       = aws_config_configuration_recorder.main.name
}

output "config_rules" {
  description = "AWS Config rules for compliance validation"
  value = {
    encrypted_volumes = aws_config_config_rule.encrypted_volumes.name
    rds_encryption   = aws_config_config_rule.rds_encryption.name
    cloudtrail       = aws_config_config_rule.cloudtrail_enabled.name
    iam_password     = aws_config_config_rule.iam_password_policy.name
  }
}

output "secrets_manager_secret_arn" {
  description = "ARN of Secrets Manager secret with auto-rotation"
  value       = aws_secretsmanager_secret.db_master_password.arn
  sensitive   = true
}

output "secrets_rotation_enabled" {
  description = "Secret rotation configuration"
  value = {
    enabled               = true
    rotation_days         = 30
    rotation_lambda_arn   = aws_lambda_function.rotate_secret.arn
  }
}

output "slo_breach_alarm" {
  description = "Composite alarm for SLO breach detection"
  value       = aws_cloudwatch_composite_alarm.slo_breach.arn
}

output "slo_calculator_lambda" {
  description = "Lambda function for SLO calculation and error budget tracking"
  value       = aws_lambda_function.slo_calculator.function_name
}

output "slo_target" {
  description = "Service Level Objective target percentage"
  value       = "99.99%"
}

output "custom_metrics" {
  description = "Custom CloudWatch metrics for business KPIs"
  value = {
    trade_execution_latency = "TradingPlatform/TradeExecutionTime"
    error_rate             = "TradingPlatform/ErrorRate"
    error_budget           = "TradingPlatform/SLO/ErrorBudgetRemaining"
  }
}
