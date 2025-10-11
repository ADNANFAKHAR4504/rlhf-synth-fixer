# tap_stack.tf - Complete Multi-Region Infrastructure Stack

```hcl

# ========================================
# VARIABLES
# ========================================

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "tap"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# ========================================
# DATA SOURCES
# ========================================

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.us_west_2
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.eu_west_1
  state    = "available"
}

# Get current caller identity
data "aws_caller_identity" "current" {
  provider = aws.us_west_2
}

# ========================================
# RANDOM RESOURCES
# ========================================

# Random suffix for resource naming
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
  numeric = false
}

# Random master username for RDS (starts with letter, 8 chars)
resource "random_string" "db_username" {
  length  = 7
  special = false
  numeric = true
  upper   = false
}

# Random master password for RDS (16 chars with special characters)
resource "random_password" "db_password" {
  length  = 16
  special = true
  # AWS RDS allowed special characters
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ========================================
# LOCALS
# ========================================

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CreatedAt   = timestamp()
  }
  
  # Resource naming
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Network configuration
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"
  
  # Subnet calculations for primary region
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  
  # Subnet calculations for secondary region
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
  
  # Database configuration
  db_username = "a${random_string.db_username.result}"
  db_password = random_password.db_password.result
  db_name     = "${var.project_name}db"
}

# ========================================
# PRIMARY REGION RESOURCES (us-west-2)
# ========================================

# --- VPC for Primary Region ---
resource "aws_vpc" "primary" {
  provider             = aws.us_west_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-primary-${random_string.suffix.result}"
    Region = var.primary_region
  })
}

# --- Internet Gateway for Primary Region ---
resource "aws_internet_gateway" "primary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-primary-${random_string.suffix.result}"
  })
}

# --- Public Subnets for Primary Region ---
resource "aws_subnet" "primary_public" {
  count                   = 2
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-subnet-public-${count.index + 1}-primary-${random_string.suffix.result}"
    Type = "public"
  })
}

# --- Private Subnets for Primary Region ---
resource "aws_subnet" "primary_private" {
  count             = 2
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-subnet-private-${count.index + 1}-primary-${random_string.suffix.result}"
    Type = "private"
  })
}

# --- Elastic IPs for NAT Gateways in Primary Region ---
resource "aws_eip" "primary_nat" {
  count    = 2
  provider = aws.us_west_2
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-primary-${random_string.suffix.result}"
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# --- NAT Gateways for Primary Region ---
resource "aws_nat_gateway" "primary" {
  count         = 2
  provider      = aws.us_west_2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-primary-${random_string.suffix.result}"
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# --- Route Table for Public Subnets in Primary Region ---
resource "aws_route_table" "primary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-primary-${random_string.suffix.result}"
  })
}

# --- Route Tables for Private Subnets in Primary Region ---
resource "aws_route_table" "primary_private" {
  count    = 2
  provider = aws.us_west_2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-primary-${random_string.suffix.result}"
  })
}

# --- Route Table Associations for Public Subnets in Primary Region ---
resource "aws_route_table_association" "primary_public" {
  count          = 2
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# --- Route Table Associations for Private Subnets in Primary Region ---
resource "aws_route_table_association" "primary_private" {
  count          = 2
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# --- Security Group for RDS in Primary Region ---
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_west_2
  name_prefix = "${local.name_prefix}-rds-sg-primary-"
  description = "Security group for RDS database in primary region"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    description = "MySQL/Aurora from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [local.primary_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg-primary-${random_string.suffix.result}"
  })
}

# --- DB Subnet Group for Primary Region ---
resource "aws_db_subnet_group" "primary" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-db-subnet-primary-${random_string.suffix.result}"
  description = "DB subnet group for RDS in primary region"
  subnet_ids  = aws_subnet.primary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-primary-${random_string.suffix.result}"
  })
}

# --- RDS Instance for Primary Region ---
resource "aws_db_instance" "primary" {
  provider                    = aws.us_west_2
  identifier                  = "${local.name_prefix}-rds-primary-${random_string.suffix.result}"
  allocated_storage           = var.db_allocated_storage
  storage_type                = "gp3"
  storage_encrypted           = true
  engine                      = "mysql"
  engine_version              = var.db_engine_version
  instance_class              = var.db_instance_class
  db_name                     = local.db_name
  username                    = local.db_username
  password                    = local.db_password
  db_subnet_group_name        = aws_db_subnet_group.primary.name
  vpc_security_group_ids      = [aws_security_group.primary_rds.id]
  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window               = "03:00-04:00"
  maintenance_window          = "sun:04:00-sun:05:00"
  skip_final_snapshot         = true
  deletion_protection         = false
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-primary-${random_string.suffix.result}"
  })
}

# --- Secrets Manager for RDS Credentials in Primary Region ---
resource "aws_secretsmanager_secret" "primary_rds" {
  provider                = aws.us_west_2
  name                    = "${local.name_prefix}-rds-credentials-primary-${random_string.suffix.result}"
  description             = "RDS credentials for primary region"
  recovery_window_in_days = 0
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secret-primary-${random_string.suffix.result}"
  })
}

resource "aws_secretsmanager_secret_version" "primary_rds" {
  provider  = aws.us_west_2
  secret_id = aws_secretsmanager_secret.primary_rds.id
  secret_string = jsonencode({
    username = local.db_username
    password = local.db_password
    endpoint = aws_db_instance.primary.endpoint
    port     = aws_db_instance.primary.port
    dbname   = local.db_name
  })
}

# --- S3 Bucket for Primary Region ---
resource "aws_s3_bucket" "primary" {
  provider = aws.us_west_2
  bucket   = "${local.name_prefix}-bucket-primary-${random_string.suffix.result}"
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  } 
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bucket-primary-${random_string.suffix.result}"
  })
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.primary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_bucket_public_access_block" "primary" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- CloudWatch Alarms for Primary RDS ---
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_west_2
  alarm_name          = "${local.name_prefix}-rds-cpu-primary-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-cpu-alarm-primary-${random_string.suffix.result}"
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_rds_storage" {
  provider            = aws.us_west_2
  alarm_name          = "${local.name_prefix}-rds-storage-primary-${random_string.suffix.result}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-storage-alarm-primary-${random_string.suffix.result}"
  })
}

# ========================================
# SECONDARY REGION RESOURCES (eu-west-1)
# ========================================

# --- VPC for Secondary Region ---
resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-secondary-${random_string.suffix.result}"
    Region = var.secondary_region
  })
}

# --- Internet Gateway for Secondary Region ---
resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-secondary-${random_string.suffix.result}"
  })
}

# --- Public Subnets for Secondary Region ---
resource "aws_subnet" "secondary_public" {
  count                   = 2
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-subnet-public-${count.index + 1}-secondary-${random_string.suffix.result}"
    Type = "public"
  })
}

# --- Private Subnets for Secondary Region ---
resource "aws_subnet" "secondary_private" {
  count             = 2
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-subnet-private-${count.index + 1}-secondary-${random_string.suffix.result}"
    Type = "private"
  })
}

# --- Elastic IPs for NAT Gateways in Secondary Region ---
resource "aws_eip" "secondary_nat" {
  count    = 2
  provider = aws.eu_west_1
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-secondary-${random_string.suffix.result}"
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# --- NAT Gateways for Secondary Region ---
resource "aws_nat_gateway" "secondary" {
  count         = 2
  provider      = aws.eu_west_1
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-secondary-${random_string.suffix.result}"
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# --- Route Table for Public Subnets in Secondary Region ---
resource "aws_route_table" "secondary_public" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-secondary-${random_string.suffix.result}"
  })
}

# --- Route Tables for Private Subnets in Secondary Region ---
resource "aws_route_table" "secondary_private" {
  count    = 2
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-secondary-${random_string.suffix.result}"
  })
}

# --- Route Table Associations for Public Subnets in Secondary Region ---
resource "aws_route_table_association" "secondary_public" {
  count          = 2
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# --- Route Table Associations for Private Subnets in Secondary Region ---
resource "aws_route_table_association" "secondary_private" {
  count          = 2
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# --- Security Group for RDS in Secondary Region ---
resource "aws_security_group" "secondary_rds" {
  provider    = aws.eu_west_1
  name_prefix = "${local.name_prefix}-rds-sg-secondary-"
  description = "Security group for RDS database in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description = "MySQL/Aurora from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [local.secondary_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg-secondary-${random_string.suffix.result}"
  })
}

# --- DB Subnet Group for Secondary Region ---
resource "aws_db_subnet_group" "secondary" {
  provider    = aws.eu_west_1
  name        = "${local.name_prefix}-db-subnet-secondary-${random_string.suffix.result}"
  description = "DB subnet group for RDS in secondary region"
  subnet_ids  = aws_subnet.secondary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-secondary-${random_string.suffix.result}"
  })
}

# --- RDS Instance for Secondary Region ---
resource "aws_db_instance" "secondary" {
  provider                    = aws.eu_west_1
  identifier                  = "${local.name_prefix}-rds-secondary-${random_string.suffix.result}"
  allocated_storage           = var.db_allocated_storage
  storage_type                = "gp3"
  storage_encrypted           = true
  engine                      = "mysql"
  engine_version              = var.db_engine_version
  instance_class              = var.db_instance_class
  db_name                     = local.db_name
  username                    = local.db_username
  password                    = local.db_password
  db_subnet_group_name        = aws_db_subnet_group.secondary.name
  vpc_security_group_ids      = [aws_security_group.secondary_rds.id]
  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window               = "03:00-04:00"
  maintenance_window          = "sun:04:00-sun:05:00"
  skip_final_snapshot         = true
  deletion_protection         = false
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secondary-${random_string.suffix.result}"
  })
}

# --- Secrets Manager for RDS Credentials in Secondary Region ---
resource "aws_secretsmanager_secret" "secondary_rds" {
  provider                = aws.eu_west_1
  name                    = "${local.name_prefix}-rds-credentials-secondary-${random_string.suffix.result}"
  description             = "RDS credentials for secondary region"
  recovery_window_in_days = 0
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-secret-secondary-${random_string.suffix.result}"
  })
}

resource "aws_secretsmanager_secret_version" "secondary_rds" {
  provider  = aws.eu_west_1
  secret_id = aws_secretsmanager_secret.secondary_rds.id
  secret_string = jsonencode({
    username = local.db_username
    password = local.db_password
    endpoint = aws_db_instance.secondary.endpoint
    port     = aws_db_instance.secondary.port
    dbname   = local.db_name
  })
}

# --- S3 Bucket for Secondary Region ---
resource "aws_s3_bucket" "secondary" {
  provider = aws.eu_west_1
  bucket   = "${local.name_prefix}-bucket-secondary-${random_string.suffix.result}"
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  } 
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bucket-secondary-${random_string.suffix.result}"
  })
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_bucket_public_access_block" "secondary" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- CloudWatch Alarms for Secondary RDS ---
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.eu_west_1
  alarm_name          = "${local.name_prefix}-rds-cpu-secondary-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-cpu-alarm-secondary-${random_string.suffix.result}"
  })
}

resource "aws_cloudwatch_metric_alarm" "secondary_rds_storage" {
  provider            = aws.eu_west_1
  alarm_name          = "${local.name_prefix}-rds-storage-secondary-${random_string.suffix.result}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-storage-alarm-secondary-${random_string.suffix.result}"
  })
}

# ========================================
# IAM RESOURCES (Global)
# ========================================

# --- IAM Role for RDS Enhanced Monitoring ---
resource "aws_iam_role" "rds_monitoring" {
  provider = aws.us_west_2
  name     = "${local.name_prefix}-rds-monitoring-role-${random_string.suffix.result}"
  
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role-${random_string.suffix.result}"
  })
}

# --- Attach AWS managed policy for RDS Enhanced Monitoring ---
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  provider   = aws.us_west_2
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# --- IAM Role for Application ---
resource "aws_iam_role" "application" {
  provider = aws.us_west_2
  name     = "${local.name_prefix}-application-role-${random_string.suffix.result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-application-role-${random_string.suffix.result}"
  })
}

# --- IAM Policy for S3 Access ---
resource "aws_iam_policy" "s3_access" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-s3-access-policy-${random_string.suffix.result}"
  description = "Policy for S3 bucket access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.secondary.arn
        ]
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-access-policy-${random_string.suffix.result}"
  })
}

# --- IAM Policy for Secrets Manager Access ---
resource "aws_iam_policy" "secrets_access" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-secrets-access-policy-${random_string.suffix.result}"
  description = "Policy for Secrets Manager access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.primary_rds.arn,
          aws_secretsmanager_secret.secondary_rds.arn
        ]
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-access-policy-${random_string.suffix.result}"
  })
}

# --- Attach policies to Application Role ---
resource "aws_iam_role_policy_attachment" "application_s3" {
  provider   = aws.us_west_2
  role       = aws_iam_role.application.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "application_secrets" {
  provider   = aws.us_west_2
  role       = aws_iam_role.application.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

# --- IAM Instance Profile for EC2 ---
resource "aws_iam_instance_profile" "application" {
  provider = aws.us_west_2
  name     = "${local.name_prefix}-application-profile-${random_string.suffix.result}"
  role     = aws_iam_role.application.name
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-application-profile-${random_string.suffix.result}"
  })
}

# ========================================
# OUTPUTS
# ========================================

# --- Primary Region Outputs ---
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "primary_vpc_cidr" {
  description = "Primary VPC CIDR block"
  value       = aws_vpc.primary.cidr_block
}

output "primary_public_subnet_ids" {
  description = "Primary public subnet IDs"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "Primary private subnet IDs"
  value       = aws_subnet.primary_private[*].id
}

output "primary_nat_gateway_ids" {
  description = "Primary NAT Gateway IDs"
  value       = aws_nat_gateway.primary[*].id
}

output "primary_internet_gateway_id" {
  description = "Primary Internet Gateway ID"
  value       = aws_internet_gateway.primary.id
}

output "primary_rds_endpoint" {
  description = "Primary RDS endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "primary_rds_id" {
  description = "Primary RDS instance ID"
  value       = aws_db_instance.primary.id
}

output "primary_rds_arn" {
  description = "Primary RDS instance ARN"
  value       = aws_db_instance.primary.arn
}

output "primary_rds_security_group_id" {
  description = "Primary RDS security group ID"
  value       = aws_security_group.primary_rds.id
}

output "primary_s3_bucket_name" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "primary_s3_bucket_arn" {
  description = "Primary S3 bucket ARN"
  value       = aws_s3_bucket.primary.arn
}

output "primary_secrets_manager_arn" {
  description = "Primary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.primary_rds.arn
}

output "primary_cloudwatch_cpu_alarm_arn" {
  description = "Primary RDS CPU CloudWatch alarm ARN"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.arn
}

output "primary_cloudwatch_storage_alarm_arn" {
  description = "Primary RDS storage CloudWatch alarm ARN"
  value       = aws_cloudwatch_metric_alarm.primary_rds_storage.arn
}

# --- Secondary Region Outputs ---
output "secondary_vpc_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "secondary_vpc_cidr" {
  description = "Secondary VPC CIDR block"
  value       = aws_vpc.secondary.cidr_block
}

output "secondary_public_subnet_ids" {
  description = "Secondary public subnet IDs"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "Secondary private subnet IDs"
  value       = aws_subnet.secondary_private[*].id
}

output "secondary_nat_gateway_ids" {
  description = "Secondary NAT Gateway IDs"
  value       = aws_nat_gateway.secondary[*].id
}

output "secondary_internet_gateway_id" {
  description = "Secondary Internet Gateway ID"
  value       = aws_internet_gateway.secondary.id
}

output "secondary_rds_endpoint" {
  description = "Secondary RDS endpoint"
  value       = aws_db_instance.secondary.endpoint
}

output "secondary_rds_id" {
  description = "Secondary RDS instance ID"
  value       = aws_db_instance.secondary.id
}

output "secondary_rds_arn" {
  description = "Secondary RDS instance ARN"
  value       = aws_db_instance.secondary.arn
}

output "secondary_rds_security_group_id" {
  description = "Secondary RDS security group ID"
  value       = aws_security_group.secondary_rds.id
}

output "secondary_s3_bucket_name" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

output "secondary_s3_bucket_arn" {
  description = "Secondary S3 bucket ARN"
  value       = aws_s3_bucket.secondary.arn
}

output "secondary_secrets_manager_arn" {
  description = "Secondary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.secondary_rds.arn
}

output "secondary_cloudwatch_cpu_alarm_arn" {
  description = "Secondary RDS CPU CloudWatch alarm ARN"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.arn
}

output "secondary_cloudwatch_storage_alarm_arn" {
  description = "Secondary RDS storage CloudWatch alarm ARN"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_storage.arn
}

# --- IAM Outputs ---
output "application_role_arn" {
  description = "Application IAM role ARN"
  value       = aws_iam_role.application.arn
}

output "application_role_name" {
  description = "Application IAM role name"
  value       = aws_iam_role.application.name
}

output "application_instance_profile_arn" {
  description = "Application IAM instance profile ARN"
  value       = aws_iam_instance_profile.application.arn
}

output "application_instance_profile_name" {
  description = "Application IAM instance profile name"
  value       = aws_iam_instance_profile.application.name
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring IAM role ARN"
  value       = aws_iam_role.rds_monitoring.arn
}

output "s3_access_policy_arn" {
  description = "S3 access IAM policy ARN"
  value       = aws_iam_policy.s3_access.arn
}

output "secrets_access_policy_arn" {
  description = "Secrets Manager access IAM policy ARN"
  value       = aws_iam_policy.secrets_access.arn
}

# --- Database Configuration Outputs ---
output "db_name" {
  description = "Database name"
  value       = local.db_name
}

output "db_username" {
  description = "Database master username"
  value       = local.db_username
}

# --- General Outputs ---
output "resource_suffix" {
  description = "Random suffix used for resource naming"
  value       = random_string.suffix.result
}

output "deployment_timestamp" {
  description = "Timestamp when infrastructure was deployed"
  value       = timestamp()
}

```

# provider.tf

```hcl

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_west_2"
  region = var.primary_region
}

provider "aws" {
  alias  = "eu_west_1"
  region = var.secondary_region
}

```
