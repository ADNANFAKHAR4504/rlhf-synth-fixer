# =====================================================
# HEALTHCARE APPLICATION DATABASE MONITORING SYSTEM
# =====================================================
# This Terraform script creates a fully compliant
# PostgreSQL RDS monitoring system for healthcare apps
# =====================================================

# -----------------------------------------------------
# VARIABLES
# -----------------------------------------------------

# FIXED: Added aws_region variable declaration (was missing)
variable "aws_region" {
  description = "AWS region for all resources (referenced from provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnet deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to RDS (application subnets)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "healthcare_db"
}

variable "db_username" {
  description = "Master username for RDS instance"
  type        = string
  sensitive   = true
  default     = "dbadmin"
}

variable "db_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.m5.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "sns_email_endpoints" {
  description = "Email addresses to receive SNS alerts"
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Environment tag (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "Healthcare IT Team"
}

variable "project" {
  description = "Project tag for all resources"
  type        = string
  default     = "Healthcare Database Monitoring"
}

# -----------------------------------------------------
# DATA SOURCES
# -----------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# -----------------------------------------------------
# VPC AND NETWORKING RESOURCES
# -----------------------------------------------------

resource "aws_vpc" "healthcare_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "healthcare-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Internet Gateway for NAT Gateways
resource "aws_internet_gateway" "healthcare_igw" {
  vpc_id = aws_vpc.healthcare_vpc.id

  tags = {
    Name        = "healthcare-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.healthcare_vpc.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "healthcare-public-subnet-1"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.healthcare_vpc.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "healthcare-public-subnet-2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Private Subnets for RDS
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.healthcare_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = var.availability_zones[0]

  tags = {
    Name        = "healthcare-private-subnet-1"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.healthcare_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = var.availability_zones[1]

  tags = {
    Name        = "healthcare-private-subnet-2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_eip_1" {
  domain = "vpc"

  tags = {
    Name        = "healthcare-nat-eip-1"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.healthcare_igw]
}

resource "aws_eip" "nat_eip_2" {
  domain = "vpc"

  tags = {
    Name        = "healthcare-nat-eip-2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.healthcare_igw]
}

# NAT Gateways for High Availability
resource "aws_nat_gateway" "nat_gateway_1" {
  allocation_id = aws_eip.nat_eip_1.id
  subnet_id     = aws_subnet.public_subnet_1.id

  tags = {
    Name        = "healthcare-nat-gateway-1"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.healthcare_igw]
}

resource "aws_nat_gateway" "nat_gateway_2" {
  allocation_id = aws_eip.nat_eip_2.id
  subnet_id     = aws_subnet.public_subnet_2.id

  tags = {
    Name        = "healthcare-nat-gateway-2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.healthcare_igw]
}

# Route Table for Public Subnets
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.healthcare_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.healthcare_igw.id
  }

  tags = {
    Name        = "healthcare-public-route-table"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route Tables for Private Subnets
resource "aws_route_table" "private_route_table_1" {
  vpc_id = aws_vpc.healthcare_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway_1.id
  }

  tags = {
    Name        = "healthcare-private-route-table-1"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "private_route_table_2" {
  vpc_id = aws_vpc.healthcare_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway_2.id
  }

  tags = {
    Name        = "healthcare-private-route-table-2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public_association_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_route_table.id
}

resource "aws_route_table_association" "public_association_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_route_table.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private_association_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_route_table_1.id
}

resource "aws_route_table_association" "private_association_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_route_table_2.id
}

# -----------------------------------------------------
# KMS ENCRYPTION RESOURCES
# -----------------------------------------------------

resource "aws_kms_key" "healthcare_kms_key" {
  description             = "KMS key for healthcare app encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "healthcare_kms_alias" {
  name          = "alias/healthcare-app-kms-key"
  target_key_id = aws_kms_key.healthcare_kms_key.key_id
}

# -----------------------------------------------------
# RDS POSTGRESQL DATABASE RESOURCES
# -----------------------------------------------------

resource "aws_db_parameter_group" "healthcare_postgres_params" {
  name        = "healthcare-postgres-params"
  family      = "postgres14"
  description = "Parameter group for healthcare app PostgreSQL database"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_subnet_group" "healthcare_db_subnet_group" {
  name        = "healthcare-db-subnet-group"
  description = "Subnet group for healthcare app RDS instance"
  subnet_ids  = [
    aws_subnet.private_subnet_1.id,
    aws_subnet.private_subnet_2.id
  ]

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# FIXED: Removed permissive egress rule (was allowing 0.0.0.0/0)
resource "aws_security_group" "healthcare_db_sg" {
  name        = "healthcare-db-sg"
  description = "Security group for healthcare app RDS instance"
  vpc_id      = aws_vpc.healthcare_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "Allow PostgreSQL traffic from specified CIDR blocks"
  }

  # No egress rules defined - implements "default deny" per prompt requirements
  # AWS security groups deny all outbound traffic by default when no egress rules are specified

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------
# IAM ROLES FOR MONITORING
# -----------------------------------------------------

resource "aws_iam_role" "rds_enhanced_monitoring_role" {
  name = "rds-enhanced-monitoring-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "monitoring.rds.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_attachment" {
  role       = aws_iam_role.rds_enhanced_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# -----------------------------------------------------
# CLOUDWATCH LOG GROUPS
# -----------------------------------------------------

resource "aws_cloudwatch_log_group" "healthcare_db_log_group" {
  name              = "/aws/rds/instance/healthcare-postgres/postgresql"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.healthcare_kms_key.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "healthcare_db_upgrade_log_group" {
  name              = "/aws/rds/instance/healthcare-postgres/upgrade"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.healthcare_kms_key.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------
# RDS POSTGRESQL INSTANCE
# -----------------------------------------------------

resource "aws_db_instance" "healthcare_postgres" {
  identifier                            = "healthcare-postgres"
  engine                                = "postgres"
  engine_version                        = "14.5"
  instance_class                        = var.db_instance_class
  allocated_storage                     = var.db_allocated_storage
  storage_type                          = "gp3"
  storage_encrypted                     = true
  kms_key_id                            = aws_kms_key.healthcare_kms_key.arn
  db_name                               = var.db_name
  username                              = var.db_username
  password                              = var.db_password
  port                                  = 5432
  vpc_security_group_ids                = [aws_security_group.healthcare_db_sg.id]
  db_subnet_group_name                  = aws_db_subnet_group.healthcare_db_subnet_group.name
  parameter_group_name                  = aws_db_parameter_group.healthcare_postgres_params.name
  multi_az                              = true
  backup_retention_period               = var.db_backup_retention_period
  backup_window                         = "03:00-05:00"
  maintenance_window                    = "sun:05:00-sun:07:00"
  auto_minor_version_upgrade            = true
  copy_tags_to_snapshot                 = true
  deletion_protection                   = true
  skip_final_snapshot                   = false
  final_snapshot_identifier             = "healthcare-postgres-final-snapshot"
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.healthcare_kms_key.arn
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring_role.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [
    aws_cloudwatch_log_group.healthcare_db_log_group
  ]
}

# -----------------------------------------------------
# SNS TOPIC FOR ALERTS
# -----------------------------------------------------

resource "aws_sns_topic" "healthcare_db_alerts" {
  name              = "healthcare-db-alerts"
  kms_master_key_id = aws_kms_key.healthcare_kms_key.id

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_policy" "healthcare_db_alerts_policy" {
  arn = aws_sns_topic.healthcare_db_alerts.arn

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Id": "healthcare-db-alerts-policy",
  "Statement": [
    {
      "Sid": "AllowCloudWatchAlarms",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudwatch.amazonaws.com"
      },
      "Action": "SNS:Publish",
      "Resource": "${aws_sns_topic.healthcare_db_alerts.arn}"
    }
  ]
}
EOF
}

resource "aws_sns_topic_subscription" "healthcare_db_alerts_email" {
  count     = length(var.sns_email_endpoints)
  topic_arn = aws_sns_topic.healthcare_db_alerts.arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoints[count.index]
}

# -----------------------------------------------------
# CLOUDWATCH ALARMS
# -----------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "healthcare_db_cpu" {
  alarm_name          = "healthcare-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This alarm monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "healthcare_db_connections" {
  alarm_name          = "healthcare-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This alarm monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# FIXED: Corrected threshold from 20480 (incorrect MB) to 21474836480 bytes (20GB)
resource "aws_cloudwatch_metric_alarm" "healthcare_db_storage" {
  alarm_name          = "healthcare-db-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 21474836480  # 20GB in bytes (20 * 1024 * 1024 * 1024)
  alarm_description   = "This alarm monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "healthcare_db_memory" {
  alarm_name          = "healthcare-db-low-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 1073741824
  alarm_description   = "This alarm monitors RDS freeable memory"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "healthcare_db_read_latency" {
  alarm_name          = "healthcare-db-high-read-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05
  alarm_description   = "This alarm monitors RDS read latency"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "healthcare_db_write_latency" {
  alarm_name          = "healthcare-db-high-write-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05
  alarm_description   = "This alarm monitors RDS write latency"
  alarm_actions       = [aws_sns_topic.healthcare_db_alerts.arn]
  ok_actions          = [aws_sns_topic.healthcare_db_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.healthcare_postgres.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------
# S3 BUCKET FOR CLOUDTRAIL LOGS
# -----------------------------------------------------

resource "aws_s3_bucket" "healthcare_cloudtrail_bucket" {
  bucket        = "healthcare-app-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = false

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_public_access_block" {
  bucket = aws_s3_bucket.healthcare_cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_encryption" {
  bucket = aws_s3_bucket.healthcare_cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.healthcare_kms_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.healthcare_cloudtrail_bucket.id
  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "${aws_s3_bucket.healthcare_cloudtrail_bucket.arn}"
        },
        {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "${aws_s3_bucket.healthcare_cloudtrail_bucket.arn}/cloudtrail/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
            "Condition": {
                "StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        }
    ]
}
POLICY
}

# -----------------------------------------------------
# CLOUDTRAIL FOR AUDITING
# -----------------------------------------------------

resource "aws_cloudtrail" "healthcare_cloudtrail" {
  name                          = "healthcare-app-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.healthcare_cloudtrail_bucket.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.healthcare_kms_key.arn
  is_multi_region_trail         = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::RDS::DBInstance"
      values = ["arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:db:healthcare-postgres"]
    }
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------
# OUTPUTS
# -----------------------------------------------------

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.healthcare_postgres.endpoint
}

output "rds_instance_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.healthcare_postgres.id
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.healthcare_db_sg.id
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for database alerts"
  value       = aws_sns_topic.healthcare_db_alerts.arn
}

output "cloudtrail_bucket_name" {
  description = "The name of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.healthcare_cloudtrail_bucket.id
}

output "cloudtrail_name" {
  description = "The name of the CloudTrail"
  value       = aws_cloudtrail.healthcare_cloudtrail.name
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = aws_kms_key.healthcare_kms_key.arn
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.healthcare_vpc.id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

output "nat_gateway_ips" {
  description = "The public IPs of the NAT Gateways"
  value       = [aws_eip.nat_eip_1.public_ip, aws_eip.nat_eip_2.public_ip]
}
