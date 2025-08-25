# tap_stack.tf
# Comprehensive multi-region infrastructure stack for TAP deployment
# This file contains all variables, locals, resources, and outputs for the complete stack

#==============================================================================
# VARIABLES
#==============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.m5.large"
}

variable "db_engine_version" {
  description = "RDS MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "enable_deletion_protection" {
  description = "Enable RDS deletion protection"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "TAP"
    ManagedBy = "Terraform"
  }
}

#==============================================================================
# LOCALS
#==============================================================================

locals {
  # Common naming convention
  primary_name_prefix   = "${var.project_name}-${var.environment}-primary"
  secondary_name_prefix = "${var.project_name}-${var.environment}-secondary"

  # Availability zones
  primary_azs   = ["${var.aws_region}a", "${var.aws_region}b"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}c"]

  # Subnet calculations for primary region
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

  # Subnet calculations for secondary region
  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnets = ["10.1.10.0/24", "10.1.11.0/24"]

  # Common tags with environment and region
  primary_tags = merge(var.common_tags, {
    Environment = var.environment
    Region      = var.aws_region
    Type        = "Primary"
  })

  secondary_tags = merge(var.common_tags, {
    Environment = var.environment
    Region      = var.secondary_region
    Type        = "Secondary"
  })
}

#==============================================================================
# DATA SOURCES
#==============================================================================

# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}

# Get current region
data "aws_region" "current" {}

# Generate random password for RDS
resource "random_password" "primary_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&()*+-=:?@^_"
}

resource "random_password" "secondary_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&()*+-=:?@^_"
}

#==============================================================================
# PRIMARY REGION INFRASTRUCTURE (us-east-2)
#==============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-vpc"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-igw"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  count = length(local.primary_public_subnets)

  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  count = length(local.primary_private_subnets)

  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Primary NAT Gateway Elastic IPs
resource "aws_eip" "primary_nat" {
  count = length(local.primary_public_subnets)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.primary]

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-nat-eip-${count.index + 1}"
  })
}

# Primary NAT Gateways
resource "aws_nat_gateway" "primary" {
  count = length(local.primary_public_subnets)

  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-public-rt"
  })
}

# Primary Private Route Tables
resource "aws_route_table" "primary_private" {
  count = length(local.primary_private_subnets)

  vpc_id = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-private-rt-${count.index + 1}"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  count = length(aws_subnet.primary_public)

  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  count = length(aws_subnet.primary_private)

  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

#==============================================================================
# SECONDARY REGION INFRASTRUCTURE (us-west-1)
#==============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider = aws.us_west_1

  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-vpc"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1

  vpc_id = aws_vpc.secondary.id

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-igw"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider = aws.us_west_1
  count    = length(local.secondary_public_subnets)

  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider = aws.us_west_1
  count    = length(local.secondary_private_subnets)

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Secondary NAT Gateway Elastic IPs
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  count    = length(local.secondary_public_subnets)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.secondary]

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-nat-eip-${count.index + 1}"
  })
}

# Secondary NAT Gateways
resource "aws_nat_gateway" "secondary" {
  provider = aws.us_west_1
  count    = length(local.secondary_public_subnets)

  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1

  vpc_id = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-public-rt"
  })
}

# Secondary Private Route Tables
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  count    = length(local.secondary_private_subnets)

  vpc_id = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-private-rt-${count.index + 1}"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider = aws.us_west_1
  count    = length(aws_subnet.secondary_public)

  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider = aws.us_west_1
  count    = length(aws_subnet.secondary_private)

  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

#==============================================================================
# SECURITY GROUPS
#==============================================================================

# Primary RDS Security Group
resource "aws_security_group" "primary_rds" {
  name_prefix = "${local.primary_name_prefix}-rds-"
  vpc_id      = aws_vpc.primary.id
  description = "Security group for primary RDS instance"

  ingress {
    description = "MySQL/Aurora from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.primary_vpc_cidr]
  }

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Secondary RDS Security Group
resource "aws_security_group" "secondary_rds" {
  provider = aws.us_west_1

  name_prefix = "${local.secondary_name_prefix}-rds-"
  vpc_id      = aws_vpc.secondary.id
  description = "Security group for secondary RDS instance"

  ingress {
    description = "MySQL/Aurora from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.secondary_vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.secondary_vpc_cidr]
  }

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

#==============================================================================
# KMS KEYS FOR ENCRYPTION
#==============================================================================

# Primary KMS Key for RDS encryption
resource "aws_kms_key" "primary_rds" {
  description             = "KMS key for primary RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "primary_rds" {
  name          = "alias/${local.primary_name_prefix}-rds-key"
  target_key_id = aws_kms_key.primary_rds.key_id
}

# Secondary KMS Key for RDS encryption
resource "aws_kms_key" "secondary_rds" {
  provider = aws.us_west_1

  description             = "KMS key for secondary RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "secondary_rds" {
  provider = aws.us_west_1

  name          = "alias/${local.secondary_name_prefix}-rds-key"
  target_key_id = aws_kms_key.secondary_rds.key_id
}

#==============================================================================
# RDS SUBNET GROUPS
#==============================================================================

# Primary RDS Subnet Group
resource "aws_db_subnet_group" "primary" {
  name       = "${local.primary_name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-db-subnet-group"
  })
}

# Secondary RDS Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider = aws.us_west_1

  name       = "${local.secondary_name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-db-subnet-group"
  })
}

#==============================================================================
# RDS PARAMETER GROUPS
#==============================================================================

# Primary RDS Parameter Group
resource "aws_db_parameter_group" "primary" {
  family = "mysql8.0"
  name   = "${local.primary_name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "general_log"
    value = "1"
  }

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-db-params"
  })
}

# Secondary RDS Parameter Group
resource "aws_db_parameter_group" "secondary" {
  provider = aws.us_west_1

  family = "mysql8.0"
  name   = "${local.secondary_name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "general_log"
    value = "1"
  }

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-db-params"
  })
}

#==============================================================================
# RDS INSTANCES
#==============================================================================

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  identifier = "${local.primary_name_prefix}-database"

  # Engine configuration
  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.primary_rds.arn

  # Database configuration
  db_name  = "tapdb"
  username = "admin"
  password = random_password.primary_db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  publicly_accessible    = false
  port                   = 3306

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot   = true

  # Security configuration
  deletion_protection       = var.enable_deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.primary_name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring configuration
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Parameter group
  parameter_group_name = aws_db_parameter_group.primary.name

  # Performance Insights
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.primary_rds.arn

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-database"
  })

  depends_on = [
    aws_cloudwatch_log_group.primary_rds_error,
    aws_cloudwatch_log_group.primary_rds_general,
    aws_cloudwatch_log_group.primary_rds_slow_query
  ]
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1

  identifier = "${local.secondary_name_prefix}-database"

  # Engine configuration
  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.secondary_rds.arn

  # Database configuration
  db_name  = "tapdb"
  username = "admin"
  password = random_password.secondary_db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  publicly_accessible    = false
  port                   = 3306

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot   = true

  # Security configuration
  deletion_protection       = var.enable_deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.secondary_name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring configuration
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.secondary_rds_enhanced_monitoring.arn
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Parameter group
  parameter_group_name = aws_db_parameter_group.secondary.name

  # Performance Insights
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.secondary_rds.arn

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-database"
  })

  depends_on = [
    aws_cloudwatch_log_group.secondary_rds_error,
    aws_cloudwatch_log_group.secondary_rds_general,
    aws_cloudwatch_log_group.secondary_rds_slow_query
  ]
}

#==============================================================================
# SECRETS MANAGER FOR RDS PASSWORDS
#==============================================================================

# Primary RDS Password Secret
resource "aws_secretsmanager_secret" "primary_db_password" {
  name        = "${local.primary_name_prefix}-db-password"
  description = "Password for primary RDS instance"
  kms_key_id  = aws_kms_key.primary_rds.arn

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "primary_db_password" {
  secret_id = aws_secretsmanager_secret.primary_db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.primary.username
    password = random_password.primary_db_password.result
    endpoint = aws_db_instance.primary.endpoint
    port     = aws_db_instance.primary.port
    dbname   = aws_db_instance.primary.db_name
  })
}

# Secondary RDS Password Secret
resource "aws_secretsmanager_secret" "secondary_db_password" {
  provider = aws.us_west_1

  name        = "${local.secondary_name_prefix}-db-password"
  description = "Password for secondary RDS instance"
  kms_key_id  = aws_kms_key.secondary_rds.arn

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "secondary_db_password" {
  provider = aws.us_west_1

  secret_id = aws_secretsmanager_secret.secondary_db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.secondary.username
    password = random_password.secondary_db_password.result
    endpoint = aws_db_instance.secondary.endpoint
    port     = aws_db_instance.secondary.port
    dbname   = aws_db_instance.secondary.db_name
  })
}

#==============================================================================
# IAM ROLES AND POLICIES
#==============================================================================

# RDS Enhanced Monitoring Role (Primary Region)
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.primary_name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.primary_tags, {
    Name = "${local.primary_name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Enhanced Monitoring Role (Secondary Region)
resource "aws_iam_role" "secondary_rds_enhanced_monitoring" {
  provider = aws.us_west_1

  name = "${local.secondary_name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.secondary_tags, {
    Name = "${local.secondary_name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "secondary_rds_enhanced_monitoring" {
  provider = aws.us_west_1

  role       = aws_iam_role.secondary_rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Group for TAP Users with MFA requirement
resource "aws_iam_group" "tap_users" {
  name = "${var.project_name}-${var.environment}-users"
}

# MFA Policy for TAP Users
resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-${var.environment}-mfa-policy"
  description = "Policy requiring MFA for all actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-mfa-policy"
  })
}

# Attach MFA policy to TAP users group
resource "aws_iam_group_policy_attachment" "tap_users_mfa" {
  group      = aws_iam_group.tap_users.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

# CloudWatch Logs access policy for TAP users
resource "aws_iam_policy" "cloudwatch_logs_access" {
  name        = "${var.project_name}-${var.environment}-cloudwatch-logs-access"
  description = "Policy for accessing CloudWatch logs"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ],
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
        ]
      }
    ]
  })
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-cloudwatch-logs-access"
  })
}

#####################################################
# CLOUDWATCH LOG GROUPS (for RDS)
#####################################################

# Primary Region RDS Log Groups
resource "aws_cloudwatch_log_group" "primary_rds_error" {
  name              = "/aws/rds/instance/${local.primary_name_prefix}-database/error"
  retention_in_days = 30
  tags              = local.primary_tags
}
resource "aws_cloudwatch_log_group" "primary_rds_general" {
  name              = "/aws/rds/instance/${local.primary_name_prefix}-database/general"
  retention_in_days = 30
  tags              = local.primary_tags
}
resource "aws_cloudwatch_log_group" "primary_rds_slow_query" {
  name              = "/aws/rds/instance/${local.primary_name_prefix}-database/slowquery"
  retention_in_days = 30
  tags              = local.primary_tags
}

# Secondary Region RDS Log Groups
resource "aws_cloudwatch_log_group" "secondary_rds_error" {
  provider          = aws.us_west_1
  name              = "/aws/rds/instance/${local.secondary_name_prefix}-database/error"
  retention_in_days = 30
  tags              = local.secondary_tags
}
resource "aws_cloudwatch_log_group" "secondary_rds_general" {
  provider          = aws.us_west_1
  name              = "/aws/rds/instance/${local.secondary_name_prefix}-database/general"
  retention_in_days = 30
  tags              = local.secondary_tags
}
resource "aws_cloudwatch_log_group" "secondary_rds_slow_query" {
  provider          = aws.us_west_1
  name              = "/aws/rds/instance/${local.secondary_name_prefix}-database/slowquery"
  retention_in_days = 30
  tags              = local.secondary_tags
}

#####################################################
# CLOUDWATCH ALERTS (Security Monitoring)
#####################################################

# Unauthorized IAM access attempts (global events via CloudTrail -> CloudWatch)
resource "aws_cloudwatch_log_group" "security" {
  name              = "/aws/security/unauthorized"
  retention_in_days = 90
  tags              = merge(var.common_tags, { Type = "Security" })
}

resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-${var.environment}-security-alerts"
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_attempts" {
  alarm_name          = "${var.project_name}-${var.environment}-unauthorized-access"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAttempts"
  namespace           = "AWS/CloudTrail"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Triggers if unauthorized API calls detected"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  ok_actions          = [aws_sns_topic.security_alerts.arn]
}

#####################################################
# OUTPUTS
#####################################################

# VPC IDs
output "primary_vpc_id" {
  value       = aws_vpc.primary.id
  description = "Primary VPC ID"
}
output "secondary_vpc_id" {
  value       = aws_vpc.secondary.id
  description = "Secondary VPC ID"
}

# Subnet IDs (all)
output "primary_public_subnet_ids" {
  value       = aws_subnet.primary_public[*].id
  description = "Primary region public subnet IDs"
}
output "primary_private_subnet_ids" {
  value       = aws_subnet.primary_private[*].id
  description = "Primary region private subnet IDs"
}
output "secondary_public_subnet_ids" {
  value       = aws_subnet.secondary_public[*].id
  description = "Secondary region public subnet IDs"
}
output "secondary_private_subnet_ids" {
  value       = aws_subnet.secondary_private[*].id
  description = "Secondary region private subnet IDs"
}

# RDS Details (non-sensitive)
output "primary_rds_endpoint" {
  value       = aws_db_instance.primary.address
  description = "Primary RDS endpoint"
}
output "primary_rds_port" {
  value       = aws_db_instance.primary.port
  description = "Primary RDS port"
}
output "secondary_rds_endpoint" {
  value       = aws_db_instance.secondary.address
  description = "Secondary RDS endpoint"
}
output "secondary_rds_port" {
  value       = aws_db_instance.secondary.port
  description = "Secondary RDS port"
}

# IAM / MFA Details
output "tap_users_group" {
  value       = aws_iam_group.tap_users.name
  description = "IAM group for TAP users"
}
output "mfa_policy_arn" {
  value       = aws_iam_policy.mfa_policy.arn
  description = "ARN of the MFA enforcement policy"
}
output "cloudwatch_logs_policy_arn" {
  value       = aws_iam_policy.cloudwatch_logs_access.arn
  description = "ARN of CloudWatch logs access policy"
}

# Security Alerts
output "security_sns_topic" {
  value       = aws_sns_topic.security_alerts.arn
  description = "SNS topic for security alerts"
}

# KMS Keys
output "primary_rds_kms_key_arn" {
  value       = aws_kms_key.primary_rds.arn
  description = "Primary RDS KMS key ARN"
}
output "secondary_rds_kms_key_arn" {
  value       = aws_kms_key.secondary_rds.arn
  description = "Secondary RDS KMS key ARN"
}
# Output Public and Private Subnets CIDR blocks as lists (for each region)
output "primary_public_subnet_cidrs" {
  value       = aws_subnet.primary_public[*].cidr_block
  description = "CIDR blocks for primary region public subnets"
}

output "primary_private_subnet_cidrs" {
  value       = aws_subnet.primary_private[*].cidr_block
  description = "CIDR blocks for primary region private subnets"
}

output "secondary_public_subnet_cidrs" {
  value       = aws_subnet.secondary_public[*].cidr_block
  description = "CIDR blocks for secondary region public subnets"
}

output "secondary_private_subnet_cidrs" {
  value       = aws_subnet.secondary_private[*].cidr_block
  description = "CIDR blocks for secondary region private subnets"
}

# Output Security Group IDs (e.g. for RDS and NAT gateways)
output "primary_rds_security_group_id" {
  value       = aws_security_group.primary_rds.id
  description = "Security Group ID of RDS instance in primary region"
}

output "secondary_rds_security_group_id" {
  value       = aws_security_group.secondary_rds.id
  description = "Security Group ID of RDS instance in secondary region"
}

# Output NAT Gateway IDs for both regions
output "primary_nat_gateway_ids" {
  value       = aws_nat_gateway.primary[*].id
  description = "NAT Gateway IDs in primary region"
}

output "secondary_nat_gateway_ids" {
  value       = aws_nat_gateway.secondary[*].id
  description = "NAT Gateway IDs in secondary region"
}

# Output Internet Gateway IDs for both regions
output "primary_internet_gateway_id" {
  value       = aws_internet_gateway.primary.id
  description = "Internet Gateway ID for primary region VPC"
}

output "secondary_internet_gateway_id" {
  value       = aws_internet_gateway.secondary.id
  description = "Internet Gateway ID for secondary region VPC"
}

# Output DB Subnet Group names
output "primary_db_subnet_group_name" {
  value       = aws_db_subnet_group.primary.name
  description = "DB subnet group name for primary region"
}

output "secondary_db_subnet_group_name" {
  value       = aws_db_subnet_group.secondary.name
  description = "DB subnet group name for secondary region"
}

# Output IAM group ARN for TAP users
output "tap_users_group_arn" {
  value       = aws_iam_group.tap_users.arn
  description = "IAM Group ARN managing TAP users"
}

# Output RDS Parameter Group names
output "primary_db_parameter_group_name" {
  value       = aws_db_parameter_group.primary.name
  description = "DB parameter group name for primary region"
}

output "secondary_db_parameter_group_name" {
  value       = aws_db_parameter_group.secondary.name
  description = "DB parameter group name for secondary region"
}

# Performance Insights role ARNs for RDS monitoring
output "primary_rds_monitoring_role_arn" {
  value       = aws_iam_role.rds_enhanced_monitoring.arn
  description = "IAM role ARN for Primary RDS Enhanced Monitoring"
}

output "secondary_rds_monitoring_role_arn" {
  value       = aws_iam_role.secondary_rds_enhanced_monitoring.arn
  description = "IAM role ARN for Secondary RDS Enhanced Monitoring"
}

# Outputs for CloudWatch log groups (names)
output "primary_rds_log_group_names" {
  value = [
    aws_cloudwatch_log_group.primary_rds_error.name,
    aws_cloudwatch_log_group.primary_rds_general.name,
    aws_cloudwatch_log_group.primary_rds_slow_query.name
  ]
  description = "CloudWatch Log Group names for Primary RDS logs"
}

output "secondary_rds_log_group_names" {
  value = [
    aws_cloudwatch_log_group.secondary_rds_error.name,
    aws_cloudwatch_log_group.secondary_rds_general.name,
    aws_cloudwatch_log_group.secondary_rds_slow_query.name
  ]
  description = "CloudWatch Log Group names for Secondary RDS logs"
}

# Miscellaneous useful outputs
output "tap_project_environment" {
  value       = var.environment
  description = "Deployment environment name"
}

output "all_primary_subnets" {
  value       = concat(aws_subnet.primary_public[*].id, aws_subnet.primary_private[*].id)
  description = "All subnet IDs in primary region"
}

output "all_secondary_subnets" {
  value       = concat(aws_subnet.secondary_public[*].id, aws_subnet.secondary_private[*].id)
  description = "All subnet IDs in secondary region"
}
