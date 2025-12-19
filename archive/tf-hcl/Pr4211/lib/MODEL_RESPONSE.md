```hcl
# main.tf
terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

# Random ID for unique resource naming
resource "random_id" "unique_suffix" {
  byte_length = 8
}

# Data sources for AWS account info and availability zones
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS encryption for all services
resource "aws_kms_key" "SecCFN_multi_purpose_key" {
  description             = "SecCFN Multi-purpose KMS key for encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "SecCFN-multi-purpose-key"
    Environment = "production"
    Purpose     = "multi-service-encryption"
    Project     = "SecCFN"
  }
}

resource "aws_kms_alias" "SecCFN_multi_purpose_key_alias" {
  name          = "alias/SecCFN-multi-purpose-key-${random_id.unique_suffix.hex}"
  target_key_id = aws_kms_key.SecCFN_multi_purpose_key.key_id
}

# S3 bucket for secure storage with comprehensive security
resource "aws_s3_bucket" "SecCFN_secure_bucket" {
  bucket = "seccfn-secure-bucket-${random_id.unique_suffix.hex}"

  tags = {
    Name        = "SecCFN-secure-bucket"
    Environment = "production"
    Purpose     = "secure-storage"
    Project     = "SecCFN"
  }
}

resource "aws_s3_bucket_encryption" "SecCFN_secure_bucket_encryption" {
  bucket = aws_s3_bucket.SecCFN_secure_bucket.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.SecCFN_multi_purpose_key.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_versioning" "SecCFN_secure_bucket_versioning" {
  bucket = aws_s3_bucket.SecCFN_secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "SecCFN_secure_bucket_pab" {
  bucket = aws_s3_bucket.SecCFN_secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "SecCFN_secure_bucket_logging" {
  bucket = aws_s3_bucket.SecCFN_secure_bucket.id

  target_bucket = aws_s3_bucket.SecCFN_access_logs_bucket.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "SecCFN_secure_bucket_lifecycle" {
  bucket = aws_s3_bucket.SecCFN_secure_bucket.id

  rule {
    id     = "lifecycle_rule"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket for access logs
resource "aws_s3_bucket" "SecCFN_access_logs_bucket" {
  bucket = "seccfn-access-logs-bucket-${random_id.unique_suffix.hex}"

  tags = {
    Name        = "SecCFN-access-logs-bucket"
    Environment = "production"
    Purpose     = "access-logging"
    Project     = "SecCFN"
  }
}

resource "aws_s3_bucket_encryption" "SecCFN_access_logs_bucket_encryption" {
  bucket = aws_s3_bucket.SecCFN_access_logs_bucket.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.SecCFN_multi_purpose_key.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_public_access_block" "SecCFN_access_logs_bucket_pab" {
  bucket = aws_s3_bucket.SecCFN_access_logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# VPC for secure networking
resource "aws_vpc" "SecCFN_secure_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "SecCFN-secure-vpc"
    Environment = "production"
    Purpose     = "secure-networking"
    Project     = "SecCFN"
  }
}

resource "aws_subnet" "SecCFN_private_subnet_a" {
  vpc_id            = aws_vpc.SecCFN_secure_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "SecCFN-private-subnet-a"
    Environment = "production"
    Type        = "private"
    Project     = "SecCFN"
  }
}

resource "aws_subnet" "SecCFN_private_subnet_b" {
  vpc_id            = aws_vpc.SecCFN_secure_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "SecCFN-private-subnet-b"
    Environment = "production"
    Type        = "private"
    Project     = "SecCFN"
  }
}

resource "aws_internet_gateway" "SecCFN_igw" {
  vpc_id = aws_vpc.SecCFN_secure_vpc.id

  tags = {
    Name        = "SecCFN-internet-gateway"
    Environment = "production"
    Purpose     = "internet-access"
    Project     = "SecCFN"
  }
}

resource "aws_route_table" "SecCFN_private_route_table" {
  vpc_id = aws_vpc.SecCFN_secure_vpc.id

  tags = {
    Name        = "SecCFN-private-route-table"
    Environment = "production"
    Type        = "private"
    Project     = "SecCFN"
  }
}

resource "aws_route_table_association" "SecCFN_private_rta_a" {
  subnet_id      = aws_subnet.SecCFN_private_subnet_a.id
  route_table_id = aws_route_table.SecCFN_private_route_table.id
}

resource "aws_route_table_association" "SecCFN_private_rta_b" {
  subnet_id      = aws_subnet.SecCFN_private_subnet_b.id
  route_table_id = aws_route_table.SecCFN_private_route_table.id
}

# Security groups
resource "aws_security_group" "SecCFN_rds_security_group" {
  name_prefix = "SecCFN-rds-sg-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.SecCFN_secure_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.SecCFN_app_security_group.id]
    description     = "MySQL/Aurora access from application security group"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "SecCFN-rds-security-group"
    Environment = "production"
    Purpose     = "database-security"
    Project     = "SecCFN"
  }
}

resource "aws_security_group" "SecCFN_app_security_group" {
  name_prefix = "SecCFN-app-sg-"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.SecCFN_secure_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "HTTPS within VPC"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "HTTP within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "SecCFN-app-security-group"
    Environment = "production"
    Purpose     = "application-security"
    Project     = "SecCFN"
  }
}

# RDS subnet group
resource "aws_db_subnet_group" "SecCFN_rds_subnet_group" {
  name       = "seccfn-rds-subnet-group-${random_id.unique_suffix.hex}"
  subnet_ids = [aws_subnet.SecCFN_private_subnet_a.id, aws_subnet.SecCFN_private_subnet_b.id]

  tags = {
    Name        = "SecCFN-rds-subnet-group"
    Environment = "production"
    Purpose     = "database-networking"
    Project     = "SecCFN"
  }
}

# RDS parameter group
resource "aws_db_parameter_group" "SecCFN_rds_parameter_group" {
  family = "mysql8.0"
  name   = "seccfn-rds-parameter-group-${random_id.unique_suffix.hex}"

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

  tags = {
    Name        = "SecCFN-rds-parameter-group"
    Environment = "production"
    Purpose     = "database-configuration"
    Project     = "SecCFN"
  }
}

# Secrets Manager for RDS credentials
resource "aws_secretsmanager_secret" "SecCFN_rds_credentials" {
  name        = "SecCFN-rds-credentials-${random_id.unique_suffix.hex}"
  description = "RDS database credentials"
  kms_key_id  = aws_kms_key.SecCFN_multi_purpose_key.arn

  tags = {
    Name        = "SecCFN-rds-credentials"
    Environment = "production"
    Purpose     = "database-credentials"
    Project     = "SecCFN"
  }
}

resource "aws_secretsmanager_secret_version" "SecCFN_rds_credentials_version" {
  secret_id = aws_secretsmanager_secret.SecCFN_rds_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = "SecurePassword123!"
  })
}

# RDS instance with encryption and backups
resource "aws_db_instance" "SecCFN_rds_instance" {
  identifier = "seccfn-rds-instance-${random_id.unique_suffix.hex}"

  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.SecCFN_multi_purpose_key.arn

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  db_name  = "seccfndb"
  username = "admin"
  password = "SecurePassword123!"

  vpc_security_group_ids = [aws_security_group.SecCFN_rds_security_group.id]
  db_subnet_group_name   = aws_db_subnet_group.SecCFN_rds_subnet_group.name
  parameter_group_name   = aws_db_parameter_group.SecCFN_rds_parameter_group.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.SecCFN_rds_enhanced_monitoring_role.arn

  skip_final_snapshot       = true
  copy_tags_to_snapshot    = true
  delete_automated_backups = false

  tags = {
    Name        = "SecCFN-rds-instance"
    Environment = "production"
    Purpose     = "database"
    Project     = "SecCFN"
  }
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "SecCFN_rds_enhanced_monitoring_role" {
  name = "SecCFN-rds-enhanced-monitoring-role-${random_id.unique_suffix.hex}"

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

  tags = {
    Name        = "SecCFN-rds-enhanced-monitoring-role"
    Environment = "production"
    Purpose     = "rds-monitoring"
    Project     = "SecCFN"
  }
}

resource "aws_iam_role_policy_attachment" "SecCFN_rds_enhanced_monitoring_policy" {
  role       = aws_iam_role.SecCFN_rds_enhanced_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "SecCFN_cloudtrail" {
  name           = "SecCFN-cloudtrail-${random_id.unique_suffix.hex}"
  s3_bucket_name = aws_s3_bucket.SecCFN_secure_bucket.bucket
  s3_key_prefix  = "cloudtrail-logs/"

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true

  kms_key_id = aws_kms_key.SecCFN_multi_purpose_key.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.SecCFN_secure_bucket.arn}/*"]
    }

    data_resource {
      type   = "AWS::S3::Bucket"
      values = [aws_s3_bucket.SecCFN_secure_bucket.arn]
    }
  }

  tags = {
    Name        = "SecCFN-cloudtrail"
    Environment = "production"
    Purpose     = "audit-logging"
    Project     = "SecCFN"
  }
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "SecCFN_app_log_group" {
  name              = "/aws/seccfn/application-${random_id.unique_suffix.hex}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.SecCFN_multi_purpose_key.arn

  tags = {
    Name        = "SecCFN-app-log-group"
    Environment = "production"
    Purpose     = "application-logging"
    Project     = "SecCFN"
  }
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "SecCFN_config_recorder" {
  name     = "SecCFN-config-recorder-${random_id.unique_suffix.hex}"
  role_arn = aws_iam_role.SecCFN_config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "SecCFN_config_delivery_channel" {
  name           = "SecCFN-config-delivery-channel-${random_id.unique_suffix.hex}"
  s3_bucket_name = aws_s3_bucket.SecCFN_secure_bucket.bucket
  s3_key_prefix  = "config-logs/"
}

resource "aws_iam_role" "SecCFN_config_role" {
  name = "SecCFN-config-role-${random_id.unique_suffix.hex}"

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
    Name        = "SecCFN-config-role"
    Environment = "production"
    Purpose     = "config-service"
    Project     = "SecCFN"
  }
}

resource "aws_iam_role_policy_attachment" "SecCFN_config_role_policy" {
  role       = aws_iam_role.SecCFN_config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "SecCFN_config_s3_policy" {
  name = "SecCFN-config-s3-policy"
  role = aws_iam_role.SecCFN_config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.SecCFN_secure_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.SecCFN_secure_bucket.arn}/config-logs/*"
      }
    ]
  })
}

# CloudWatch dashboard for monitoring
resource "aws_cloudwatch_dashboard" "SecCFN_dashboard" {
  dashboard_name = "SecCFN-dashboard-${random_id.unique_suffix.hex}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.SecCFN_rds_instance.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", "BucketName", aws_s3_bucket.SecCFN_secure_bucket.bucket, "StorageType", "StandardStorage"],
            [".", "NumberOfObjects", ".", ".", ".", "AllStorageTypes"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "S3 Metrics"
        }
      }
    ]
  })
}

# Outputs for important resource information
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.SecCFN_multi_purpose_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.SecCFN_multi_purpose_key.arn
}

output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.SecCFN_secure_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.SecCFN_secure_bucket.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.SecCFN_secure_vpc.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.SecCFN_private_subnet_a.id, aws_subnet.SecCFN_private_subnet_b.id]
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.SecCFN_rds_instance.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.SecCFN_rds_instance.port
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for RDS credentials"
  value       = aws_secretsmanager_secret.SecCFN_rds_credentials.arn
  sensitive   = true
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.SecCFN_cloudtrail.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.SecCFN_app_log_group.name
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.SecCFN_config_recorder.name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.SecCFN_dashboard.dashboard_name}"
}
```
