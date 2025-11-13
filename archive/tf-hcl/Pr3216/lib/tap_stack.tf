# main.tf
# Data source for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Conditionally create VPC if not provided
resource "aws_vpc" "main" {
  count                = var.vpc_id == "" ? 1 : 0
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "healthcare-vpc"
  })
}

# Get VPC ID (either provided or created)
locals {
  vpc_id = var.vpc_id != "" ? var.vpc_id : aws_vpc.main[0].id
}

# Conditionally create private subnets if not provided
resource "aws_subnet" "private_a" {
  count             = length(var.private_subnet_ids) == 0 ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"
  
  tags = merge(var.tags, {
    Name = "healthcare-private-subnet-1a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_b" {
  count             = length(var.private_subnet_ids) == 0 ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "us-east-1b"
  
  tags = merge(var.tags, {
    Name = "healthcare-private-subnet-1b"
    Type = "Private"
  })
}

# Get subnet IDs (either provided or created)
locals {
  subnet_ids = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids : [
    aws_subnet.private_a[0].id,
    aws_subnet.private_b[0].id
  ]
}

# KMS key for RDS encryption at rest
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - Healthcare PHI data"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  # Key policy allows root account full access and enables IAM policies
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/healthcare-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Security group for RDS - only allows MySQL traffic from VPC CIDR
resource "aws_security_group" "rds" {
  name_prefix = "healthcare-rds-"
  description = "Security group for Healthcare RDS MySQL - PHI data"
  vpc_id      = local.vpc_id
  
  # Ingress: MySQL port only from VPC CIDR (10.0.0.0/16)
  ingress {
    description = "MySQL from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Egress: Allow HTTPS for AWS API calls (backups, monitoring)
  egress {
    description = "HTTPS for AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Egress: Allow DNS resolution
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(var.tags, {
    Name = "healthcare-rds-sg"
  })
}

# RDS subnet group spanning private subnets
resource "aws_db_subnet_group" "main" {
  name       = "healthcare-db-subnet-group"
  subnet_ids = local.subnet_ids
  
  description = "Subnet group for Healthcare RDS - spans 2 private subnets"
  
  tags = merge(var.tags, {
    Name = "healthcare-db-subnet-group"
  })
}

# DB parameter group enforcing TLS/SSL connections
resource "aws_db_parameter_group" "mysql8" {
  name_prefix = "healthcare-mysql8-tls-"
  family      = "mysql8.0"
  description = "MySQL 8.0 parameter group enforcing TLS connections for PHI data"
  
  # Enforce TLS - clients must connect using SSL/TLS
  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = var.tags
}

# IAM role for Enhanced Monitoring (if enabled)
resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.enhanced_monitoring_enabled ? 1 : 0
  
  name_prefix = "healthcare-rds-monitoring-"
  
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
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.enhanced_monitoring_enabled ? 1 : 0
  
  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS MySQL instance - core database for healthcare application
resource "aws_db_instance" "main" {
  identifier = var.db_identifier
  
  # Engine configuration
  engine         = "mysql"
  engine_version = var.db_engine_version
  
  # Instance specs
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true # Encryption at rest with KMS
  kms_key_id            = aws_kms_key.rds.arn
  
  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password # Use AWS Secrets Manager in production
  
  # Network & Security
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Critical: no public access for PHI
  
  # High availability
  multi_az = var.multi_az
  
  # Parameter group enforcing TLS
  parameter_group_name = aws_db_parameter_group.mysql8.name
  
  # IAM authentication for additional security
  iam_database_authentication_enabled = true
  
  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  
  # Monitoring
  enabled_cloudwatch_logs_exports       = ["error", "general", "slowquery"]
  performance_insights_enabled          = var.performance_insights_enabled && var.db_instance_class != "db.t3.micro"
  performance_insights_kms_key_id       = (var.performance_insights_enabled && var.db_instance_class != "db.t3.micro") ? aws_kms_key.rds.arn : null
  performance_insights_retention_period = (var.performance_insights_enabled && var.db_instance_class != "db.t3.micro") ? var.performance_insights_retention_period : null
  
  monitoring_interval = var.enhanced_monitoring_enabled ? var.enhanced_monitoring_interval : 0
  monitoring_role_arn = var.enhanced_monitoring_enabled ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  
  # Other settings
  auto_minor_version_upgrade = true
  deletion_protection        = true # Prevent accidental deletion
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${var.db_identifier}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = merge(var.tags, {
    Name = var.db_identifier
  })
}

# S3 bucket for RDS snapshot exports
resource "aws_s3_bucket" "snapshots" {
  bucket_prefix = var.s3_bucket_prefix
  
  tags = merge(var.tags, {
    Name        = "${var.s3_bucket_prefix}-bucket"
    Description = "RDS snapshot exports for Healthcare DB"
  })
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "snapshots" {
  bucket = aws_s3_bucket.snapshots.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "snapshots" {
  bucket = aws_s3_bucket.snapshots.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "snapshots" {
  bucket = aws_s3_bucket.snapshots.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.rds.arn
    }
  }
}

# IAM role for RDS snapshot export to S3
resource "aws_iam_role" "snapshot_export" {
  name_prefix = "healthcare-rds-snapshot-export-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "export.rds.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# IAM policy for snapshot export - least privilege access
resource "aws_iam_policy" "snapshot_export" {
  name_prefix = "healthcare-rds-snapshot-export-"
  description = "Policy for RDS to export snapshots to S3"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.snapshots.arn,
          "${aws_s3_bucket.snapshots.arn}/*"
        ]
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.rds.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "snapshot_export" {
  role       = aws_iam_role.snapshot_export.name
  policy_arn = aws_iam_policy.snapshot_export.arn
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.db_identifier}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "RDS CPU utilization is too high"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "storage_low" {
  alarm_name          = "${var.db_identifier}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_storage_threshold
  alarm_description   = "RDS free storage space is low"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  alarm_name          = "${var.db_identifier}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_connections_threshold
  alarm_description   = "RDS connection count is high"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  
  tags = var.tags
}

# Outputs
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "db_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.rds.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for snapshot exports"
  value       = aws_s3_bucket.snapshots.id
}

output "cloudwatch_alarm_cpu_arn" {
  description = "CloudWatch alarm ARN for CPU"
  value       = aws_cloudwatch_metric_alarm.cpu_high.arn
}

output "cloudwatch_alarm_storage_arn" {
  description = "CloudWatch alarm ARN for storage"
  value       = aws_cloudwatch_metric_alarm.storage_low.arn
}

output "cloudwatch_alarm_connections_arn" {
  description = "CloudWatch alarm ARN for connections"
  value       = aws_cloudwatch_metric_alarm.connections_high.arn
}