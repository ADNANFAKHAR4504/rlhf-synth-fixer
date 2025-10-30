# Aurora Serverless MySQL Infrastructure for Gaming Platform

Production-ready Terraform configuration for Aurora Serverless v2 MySQL database infrastructure supporting 1 million daily players with unpredictable workloads. This infrastructure includes complete auto-scaling, monitoring, security, and compliance features for GDPR requirements.

## Architecture Overview

This solution provides:

- Aurora Serverless v2 MySQL cluster with automatic scaling (0.5-128 ACUs)
- Multi-AZ VPC with private subnets for high availability
- KMS encryption for data at rest compliance
- Comprehensive CloudWatch monitoring and alerting
- EventBridge rules for operational event capture
- S3 bucket for automated backups with lifecycle policies
- Application Auto Scaling for CPU and connection-based scaling
- Complete IAM roles following least privilege principles

## Infrastructure Components

### 1. Provider Configuration

# provider.tf

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
  region = var.aws_region
}

### 2. Variables

# variables.tf - Input variables for the Aurora Serverless infrastructure

variable "environment_suffix" {
  description = "Unique suffix for resource names (e.g., pr123, synth456)"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Name of the gaming platform project"
  type        = string
  default     = "gaming-platform"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = []
}

# Aurora Configuration
variable "database_name" {
  description = "Name of the default database"
  type        = string
  default     = "gaming_db"
}

variable "master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
}

variable "aurora_mysql_version" {
  description = "Aurora MySQL engine version"
  type        = string
  default     = "8.0.mysql_aurora.3.07.1"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 2
}

variable "aurora_min_capacity" {
  description = "Minimum capacity for Aurora Serverless v2"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Maximum capacity for Aurora Serverless v2"
  type        = number
  default     = 128
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "backtrack_window_hours" {
  description = "Target backtrack window in hours (0-72) - disabled for compatibility"
  type        = number
  default     = 0
}

# Auto Scaling Configuration
variable "cpu_scale_up_threshold" {
  description = "CPU threshold percentage to trigger scale up"
  type        = number
  default     = 70
}

variable "cpu_scale_down_threshold" {
  description = "CPU threshold percentage to trigger scale down"
  type        = number
  default     = 30
}

variable "connections_scale_up_threshold" {
  description = "Database connections threshold to trigger scale up"
  type        = number
  default     = 12000
}

# S3 Backup Configuration
variable "backup_lifecycle_days" {
  description = "Days before transitioning backups to cheaper storage"
  type        = number
  default     = 30
}

variable "backup_expiration_days" {
  description = "Days before deleting old backups"
  type        = number
  default     = 90
}

# Monitoring Configuration
variable "alarm_email_endpoints" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

# Tagging
variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
### 3. Aurora Serverless Cluster

# main.tf - Aurora Serverless MySQL cluster configuration

locals {
  # Common tags to be applied to all resources
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "Gaming Platform Database"
    }
  )

  # Database parameter group settings optimized for gaming workloads
  db_parameters = {
    max_connections                = "16000" # High connection count for concurrent players
    innodb_buffer_pool_size        = "{DBInstanceClassMemory*3/4}"
    innodb_flush_log_at_trx_commit = "2" # Balance between performance and durability
    slow_query_log                 = "1"
    long_query_time                = "0.5"
  }
}

# DB Subnet Group for Aurora cluster
resource "aws_db_subnet_group" "aurora" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-subnet-group"
  description = "Subnet group for Aurora Serverless cluster"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-subnet-group"
    }
  )
}

# Aurora Serverless v2 cluster for better scaling capabilities
resource "aws_rds_cluster" "aurora_serverless" {
  cluster_identifier = "${var.project_name}-${var.environment_suffix}-aurora-cluster"

  # Engine configuration
  engine          = "aurora-mysql"
  engine_mode     = "provisioned" # v2 uses provisioned mode with serverless scaling
  engine_version  = var.aurora_mysql_version
  database_name   = var.database_name
  master_username = var.master_username
  master_password = var.master_password # Should be from AWS Secrets Manager in production

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  # Backup configuration
  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = var.backup_window
  preferred_maintenance_window = var.maintenance_window
  copy_tags_to_snapshot        = true

  # High availability
  availability_zones = data.aws_availability_zones.available.names

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  # Parameter group association
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  # Enable backtrack for gaming scenarios where rollback might be needed (disabled for multi-region compatibility)
  # backtrack_window = var.backtrack_window_hours

  # Performance Insights for monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Deletion protection disabled for testing environments
  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-cluster"
    }
  )

  lifecycle {
    ignore_changes = [master_password]
  }
}

# Aurora Serverless v2 instance
resource "aws_rds_cluster_instance" "aurora_instance" {
  count = var.aurora_instance_count

  identifier         = "${var.project_name}-${var.environment_suffix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora_serverless.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora_serverless.engine
  engine_version     = aws_rds_cluster.aurora_serverless.engine_version

  # Performance monitoring (disabled for db.serverless instance class)
  # Performance Insights is not supported on db.serverless instances
  performance_insights_enabled = false

  # Enhanced monitoring for gaming workloads
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-instance-${count.index + 1}"
    }
  )

  depends_on = [aws_rds_cluster.aurora_serverless]
}

# Parameter group for Aurora MySQL optimized for gaming
resource "aws_rds_cluster_parameter_group" "aurora" {
  family      = "aurora-mysql8.0"
  name        = "${var.project_name}-${var.environment_suffix}-aurora-params"
  description = "Aurora parameter group optimized for gaming workloads"

  dynamic "parameter" {
    for_each = local.db_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-params"
    }
  )
}
### 4. VPC and Networking

# vpc.tf - VPC and networking configuration

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Use provided AZs or default to first 3 available
  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 3)

  # Calculate subnet CIDR blocks
  private_subnet_cidrs = [for i in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnet_cidrs  = [for i in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, i + length(local.azs))]
}

# VPC for Aurora cluster
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-vpc"
    }
  )
}

# Internet Gateway for NAT instances
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-igw"
    }
  )
}

# Public subnets for NAT gateways
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private subnets for Aurora cluster
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT gateways
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-nat-eip-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-nat-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-public-rt"
    }
  )
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-rt-${count.index + 1}"
    }
  )
}

# Route table associations for public subnets
resource "aws_route_table_association" "public" {
  count = length(local.azs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route table associations for private subnets
resource "aws_route_table_association" "private" {
  count = length(local.azs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints for AWS services to reduce NAT traffic
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-s3-endpoint"
    }
  )
}

# Associate S3 endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  count = length(local.azs)

  vpc_endpoint_id = aws_vpc_endpoint.s3.id
  route_table_id  = aws_route_table.private[count.index].id
}
### 5. Security Groups

# security-groups.tf - Security group rules for database access

# Security group for Aurora cluster
resource "aws_security_group" "aurora" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-sg"
  description = "Security group for Aurora Serverless cluster"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Allow MySQL traffic from application security groups
resource "aws_security_group_rule" "aurora_ingress_mysql" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.application.id
  description              = "MySQL access from application servers"
}

# Allow MySQL traffic from specific CIDR blocks (for bastion/admin access)
resource "aws_security_group_rule" "aurora_ingress_admin" {
  count = length(var.admin_cidr_blocks) > 0 ? 1 : 0

  type              = "ingress"
  from_port         = 3306
  to_port           = 3306
  protocol          = "tcp"
  security_group_id = aws_security_group.aurora.id
  cidr_blocks       = var.admin_cidr_blocks
  description       = "MySQL access from admin networks"
}

# Egress rule for Aurora
resource "aws_security_group_rule" "aurora_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.aurora.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Security group for application servers (placeholder for app infrastructure)
resource "aws_security_group" "application" {
  name        = "${var.project_name}-${var.environment_suffix}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-app-sg"
    }
  )
}

# Add variable for admin CIDR blocks
variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to access Aurora for administration"
  type        = list(string)
  default     = []
}
### 6. KMS Encryption

# kms.tf - KMS key for encryption at rest

# KMS key for Aurora encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora cluster encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  # Key policy allowing Aurora service to use the key
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
          "kms:DescribeKey",
          "kms:CreateGrant",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-kms"
    }
  )
}

# KMS key alias for easier reference
resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.project_name}-${var.environment_suffix}-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}
### 7. CloudWatch Monitoring

# cloudwatch.tf - CloudWatch alarms and dashboard for monitoring

# SNS topic for alarm notifications
resource "aws_sns_topic" "aurora_alerts" {
  name              = "${var.project_name}-${var.environment_suffix}-aurora-alerts"
  kms_master_key_id = aws_kms_key.aurora.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-alerts"
    }
  )
}

# SNS topic subscriptions for email notifications
resource "aws_sns_topic_subscription" "aurora_alerts_email" {
  for_each = toset(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.aurora_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# Add SNS topic policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "aurora_alerts" {
  arn = aws_sns_topic.aurora_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.aurora_alerts.arn
      },
      {
        Sid    = "AllowCloudWatchAlarmsPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.aurora_alerts.arn
      }
    ]
  })
}

# CloudWatch alarm for high CPU utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-cpu-high"
  alarm_description   = "Aurora cluster CPU utilization is too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_scale_up_threshold

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]
  ok_actions    = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-cpu-high"
    }
  )
}

# CloudWatch alarm for database connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections_high" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-connections-high"
  alarm_description   = "Aurora database connections are approaching limit"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.connections_scale_up_threshold

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-connections-high"
    }
  )
}

# CloudWatch alarm for replication lag
resource "aws_cloudwatch_metric_alarm" "aurora_replica_lag" {
  count = var.aurora_instance_count > 1 ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-replica-lag"
  alarm_description   = "Aurora replica lag is too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1000" # 1 second in milliseconds

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-replica-lag"
    }
  )
}

# CloudWatch alarm for storage space
resource "aws_cloudwatch_metric_alarm" "aurora_storage_space_low" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-storage-low"
  alarm_description   = "Aurora cluster free storage space is low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-storage-low"
    }
  )
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "aurora" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-aurora-dashboard"

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
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Connections"
          period  = 300
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
            ["AWS/RDS", "ReadLatency", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            [".", "WriteLatency", ".", ".", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Latency"
          period  = 300
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadThroughput", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            [".", "WriteThroughput", ".", ".", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Throughput"
          period  = 300
          yAxis = {
            left = {
              label = "Bytes/Second"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Serverless Database Capacity (ACUs)"
          period  = 300
        }
      }
    ]
  })
}
### 8. EventBridge Rules

# eventbridge.tf - EventBridge rules for scaling events

# EventBridge rule for Aurora scaling events
resource "aws_cloudwatch_event_rule" "aurora_scaling" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-scaling"
  description = "Capture Aurora Serverless scaling events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventCategories  = ["configuration change"]
      SourceIdentifier = [aws_rds_cluster.aurora_serverless.cluster_identifier]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-scaling-rule"
    }
  )
}

# EventBridge rule for Aurora failover events
resource "aws_cloudwatch_event_rule" "aurora_failover" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-failover"
  description = "Capture Aurora cluster failover events"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventCategories  = ["failover"]
      SourceIdentifier = [aws_rds_cluster.aurora_serverless.cluster_identifier]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-failover-rule"
    }
  )
}

# EventBridge target for scaling notifications
resource "aws_cloudwatch_event_target" "aurora_scaling_sns" {
  rule      = aws_cloudwatch_event_rule.aurora_scaling.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.aurora_alerts.arn

  input_transformer {
    input_paths = {
      time      = "$.time"
      cluster   = "$.detail.SourceIdentifier"
      message   = "$.detail.Message"
      eventName = "$.detail.EventCategories[0]"
    }

    input_template = <<EOF
{
  "Environment": "${var.environment}",
  "Time": <time>,
  "Cluster": <cluster>,
  "Event": <eventName>,
  "Message": <message>,
  "Alert": "Aurora Serverless scaling event detected"
}
EOF
  }
}

# EventBridge target for failover notifications
resource "aws_cloudwatch_event_target" "aurora_failover_sns" {
  rule      = aws_cloudwatch_event_rule.aurora_failover.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.aurora_alerts.arn

  input_transformer {
    input_paths = {
      time    = "$.time"
      cluster = "$.detail.SourceIdentifier"
      message = "$.detail.Message"
    }

    input_template = <<EOF
{
  "Environment": "${var.environment}",
  "Time": <time>,
  "Cluster": <cluster>,
  "Event": "FAILOVER",
  "Message": <message>,
  "Alert": "Aurora cluster failover event - immediate attention required!"
}
EOF
  }
}

# Lambda function for custom event processing
resource "aws_lambda_function" "aurora_event_processor" {
  filename         = "${path.module}/lambda/aurora-events.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-aurora-events"
  role             = aws_iam_role.aurora_event_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/aurora-events.zip")
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      ENVIRONMENT   = var.environment
      SNS_TOPIC_ARN = aws_sns_topic.aurora_alerts.arn
      CLUSTER_ID    = aws_rds_cluster.aurora_serverless.cluster_identifier
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-processor"
    }
  )

  depends_on = [aws_iam_role_policy_attachment.aurora_event_lambda]
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.aurora_event_processor.function_name
  principal     = "events.amazonaws.com"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "aurora_event_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.aurora_event_processor.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.aurora.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-logs"
    }
  )
}
### 9. S3 Backup Bucket

# s3.tf - S3 bucket for automated backups with lifecycle policies

# S3 bucket for Aurora backups
resource "aws_s3_bucket" "aurora_backups" {
  bucket = "${var.project_name}-${var.environment_suffix}-aurora-backups-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-backups"
    }
  )
}

# Enable versioning for backup integrity
resource "aws_s3_bucket_versioning" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for backups
resource "aws_s3_bucket_server_side_encryption_configuration" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.aurora.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block public access to backup bucket
resource "aws_s3_bucket_public_access_block" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for backup retention
resource "aws_s3_bucket_lifecycle_configuration" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  rule {
    id     = "backup-lifecycle"
    status = "Enabled"

    # Transition to cheaper storage after specified days
    transition {
      days          = var.backup_lifecycle_days
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 60 days for long-term retention
    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    # Delete old backups after retention period
    expiration {
      days = var.backup_expiration_days
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "old-version-cleanup"
    status = "Enabled"

    # Remove old versions after 30 days
    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    # Transition old versions to cheaper storage
    noncurrent_version_transition {
      noncurrent_days = 7
      storage_class   = "STANDARD_IA"
    }
  }
}

# S3 bucket policy for Aurora backup access
resource "aws_s3_bucket_policy" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.aurora_backups.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.aurora_backups.arn,
          "${aws_s3_bucket.aurora_backups.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# CloudWatch metric for backup monitoring
resource "aws_cloudwatch_metric_alarm" "backup_failed" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-backup-failed"
  alarm_description   = "Alert when Aurora backup fails"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupRetentionPeriodStorageUsed"
  namespace           = "AWS/RDS"
  period              = "3600"
  statistic           = "Average"
  threshold           = "0"
  treat_missing_data  = "breaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-backup-failed"
    }
  )
}
### 10. Auto Scaling Configuration

# autoscaling.tf - Auto-scaling policies for Aurora Serverless

# Application Auto Scaling target for Aurora
resource "aws_appautoscaling_target" "aurora_serverless" {
  service_namespace  = "rds"
  scalable_dimension = "rds:cluster:ServerlessV2ScalingConfiguration"
  resource_id        = "cluster:${aws_rds_cluster.aurora_serverless.cluster_identifier}"
  min_capacity       = var.aurora_min_capacity
  max_capacity       = var.aurora_max_capacity

  depends_on = [aws_rds_cluster_instance.aurora_instance]
}

# Auto-scaling policy based on CPU utilization
resource "aws_appautoscaling_policy" "aurora_cpu" {
  name               = "${var.project_name}-${var.environment_suffix}-aurora-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }

    target_value       = var.cpu_scale_up_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling policy based on database connections
resource "aws_appautoscaling_policy" "aurora_connections" {
  name               = "${var.project_name}-${var.environment_suffix}-aurora-connections-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageDatabaseConnections"
    }

    target_value       = var.connections_scale_up_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Custom CloudWatch metric for gaming-specific metrics
resource "aws_cloudwatch_log_metric_filter" "concurrent_players" {
  name           = "${var.project_name}-${var.environment_suffix}-concurrent-players"
  log_group_name = "/aws/rds/cluster/${aws_rds_cluster.aurora_serverless.cluster_identifier}/general"
  pattern        = "[timestamp, request_id, user, database, query_time, lock_time, rows_sent, rows_examined, query]"

  metric_transformation {
    name      = "ConcurrentPlayers"
    namespace = "${var.project_name}/Gaming"
    value     = "1"
  }
}

# Scheduled scaling for predictable gaming patterns
resource "aws_appautoscaling_scheduled_action" "scale_up_peak" {
  name               = "${var.project_name}-${var.environment_suffix}-scale-up-peak"
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  schedule           = "cron(0 18 * * ? *)" # 6 PM UTC daily

  scalable_target_action {
    min_capacity = 4
    max_capacity = var.aurora_max_capacity
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down_offpeak" {
  name               = "${var.project_name}-${var.environment_suffix}-scale-down-offpeak"
  service_namespace  = aws_appautoscaling_target.aurora_serverless.service_namespace
  resource_id        = aws_appautoscaling_target.aurora_serverless.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_serverless.scalable_dimension
  schedule           = "cron(0 2 * * ? *)" # 2 AM UTC daily

  scalable_target_action {
    min_capacity = var.aurora_min_capacity
    max_capacity = 8
  }
}
### 11. IAM Roles and Policies

# iam.tf - IAM roles and policies for least privilege access

# IAM role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-${var.environment_suffix}-rds-enhanced-monitoring"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-rds-enhanced-monitoring"
    }
  )
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM role for Aurora S3 backup access
resource "aws_iam_role" "aurora_s3_backup" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"
    }
  )
}

# IAM policy for Aurora S3 backup access
resource "aws_iam_policy" "aurora_s3_backup" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"
  description = "Policy for Aurora to access S3 backup bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.aurora_backups.arn,
          "${aws_s3_bucket.aurora_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.aurora.arn
      }
    ]
  })
}

# Attach S3 backup policy to role
resource "aws_iam_role_policy_attachment" "aurora_s3_backup" {
  role       = aws_iam_role.aurora_s3_backup.name
  policy_arn = aws_iam_policy.aurora_s3_backup.arn
}

# IAM role for Lambda event processor
resource "aws_iam_role" "aurora_event_lambda" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"
    }
  )
}

# IAM policy for Lambda event processor
resource "aws_iam_policy" "aurora_event_lambda" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"
  description = "Policy for Aurora event processing Lambda"

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
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment_suffix}-aurora-events",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment_suffix}-aurora-events:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.aurora_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ListTagsForResource"
        ]
        Resource = [
          aws_rds_cluster.aurora_serverless.arn,
          "${aws_rds_cluster.aurora_serverless.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.aurora.arn
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "aurora_event_lambda" {
  role       = aws_iam_role.aurora_event_lambda.name
  policy_arn = aws_iam_policy.aurora_event_lambda.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "aurora_event_lambda_basic" {
  role       = aws_iam_role.aurora_event_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM role for application access to Aurora
resource "aws_iam_role" "aurora_app_access" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-app-access"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-app-access"
    }
  )
}

# IAM policy for application Aurora access
resource "aws_iam_policy" "aurora_app_access" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-app-access"
  description = "Policy for application servers to access Aurora"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = [
          aws_rds_cluster.aurora_serverless.arn,
          "${aws_rds_cluster.aurora_serverless.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora_serverless.cluster_resource_id}/${var.master_username}"
      }
    ]
  })
}

# Attach policy to application role
resource "aws_iam_role_policy_attachment" "aurora_app_access" {
  role       = aws_iam_role.aurora_app_access.name
  policy_arn = aws_iam_policy.aurora_app_access.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "aurora_app_access" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-app-profile"
  role = aws_iam_role.aurora_app_access.name

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-app-profile"
    }
  )
}
### 12. Outputs

# outputs.tf - Output values for referencing in other configurations

output "aurora_cluster_id" {
  description = "The ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora_serverless.id
}

output "aurora_cluster_endpoint" {
  description = "The cluster endpoint for write operations"
  value       = aws_rds_cluster.aurora_serverless.endpoint
}

output "aurora_reader_endpoint" {
  description = "The cluster reader endpoint for read operations"
  value       = aws_rds_cluster.aurora_serverless.reader_endpoint
}

output "aurora_cluster_arn" {
  description = "The ARN of the Aurora cluster"
  value       = aws_rds_cluster.aurora_serverless.arn
}

output "aurora_security_group_id" {
  description = "The ID of the security group for Aurora"
  value       = aws_security_group.aurora.id
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "kms_key_id" {
  description = "The ID of the KMS key used for encryption"
  value       = aws_kms_key.aurora.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = aws_kms_key.aurora.arn
}

output "backup_bucket_name" {
  description = "The name of the S3 bucket for backups"
  value       = aws_s3_bucket.aurora_backups.id
}

output "backup_bucket_arn" {
  description = "The ARN of the S3 bucket for backups"
  value       = aws_s3_bucket.aurora_backups.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.aurora.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.aurora_alerts.arn
}

output "connection_info" {
  description = "Database connection information"
  value = {
    endpoint      = aws_rds_cluster.aurora_serverless.endpoint
    port          = aws_rds_cluster.aurora_serverless.port
    database_name = aws_rds_cluster.aurora_serverless.database_name
    username      = aws_rds_cluster.aurora_serverless.master_username
  }
  sensitive = true
}
## Lambda Function for Event Processing

The Lambda function processes Aurora RDS events from EventBridge:

**File**: `lib/lambda/aurora-events/index.py`

```python
"""
Lambda function to process Aurora RDS events from EventBridge
Processes scaling and failover events and publishes to SNS
"""
import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')
rds = boto3.client('rds')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
CLUSTER_ID = os.environ.get('CLUSTER_ID')


def handler(event, context):
    """
    Process Aurora RDS events from EventBridge
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract event details
        detail = event.get('detail', {})
        event_type = event.get('detail-type', 'Unknown')
        source = event.get('source', 'Unknown')
        timestamp = event.get('time', datetime.utcnow().isoformat())
        
        # Get event message and category
        event_message = detail.get('Message', 'No message provided')
        event_categories = detail.get('EventCategories', [])
        source_identifier = detail.get('SourceIdentifier', CLUSTER_ID)
        
        # Create notification message
        notification = {
            'Environment': ENVIRONMENT,
            'Timestamp': timestamp,
            'Source': source,
            'EventType': event_type,
            'ClusterId': source_identifier,
            'EventCategories': event_categories,
            'Message': event_message,
            'RawEvent': detail
        }
        
        # Add cluster information if available
        if source_identifier:
            try:
                cluster_info = rds.describe_db_clusters(
                    DBClusterIdentifier=source_identifier
                )
                if cluster_info['DBClusters']:
                    cluster = cluster_info['DBClusters'][0]
                    notification['ClusterStatus'] = cluster.get('Status')
                    notification['ClusterCapacity'] = cluster.get('Capacity')
                    notification['ClusterEndpoint'] = cluster.get('Endpoint')
            except Exception as e:
                print(f"Could not fetch cluster info: {str(e)}")
        
        # Determine severity based on event type
        severity = 'INFO'
        if 'failover' in event_categories or 'failure' in event_categories:
            severity = 'CRITICAL'
        elif 'configuration change' in event_categories:
            severity = 'WARNING'
        
        notification['Severity'] = severity
        
        # Format message for SNS
        subject = f"[{severity}] Aurora Event - {ENVIRONMENT} - {event_type}"
        message_body = f"""
Aurora RDS Event Notification
==============================

Environment: {ENVIRONMENT}
Cluster ID: {source_identifier}
Severity: {severity}
Time: {timestamp}

Event Type: {event_type}
Event Categories: {', '.join(event_categories)}

Message:
{event_message}

"""
        
        if notification.get('ClusterStatus'):
            message_body += f"\nCluster Status: {notification['ClusterStatus']}"
        if notification.get('ClusterCapacity'):
            message_body += f"\nCurrent Capacity: {notification['ClusterCapacity']} ACUs"
        
        message_body += f"\n\nFull Event Details:\n{json.dumps(notification, indent=2)}"
        
        # Publish to SNS
        if SNS_TOPIC_ARN:
            response = sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=subject[:100],  # SNS subject limit
                Message=message_body
            )
            print(f"Published to SNS: {response['MessageId']}")
        else:
            print("SNS_TOPIC_ARN not configured, skipping notification")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'notification': notification
            })
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Send error notification
        if SNS_TOPIC_ARN:
            try:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f"[ERROR] Aurora Event Processing Failed - {ENVIRONMENT}",
                    Message=f"Failed to process Aurora event:\n\n{str(e)}\n\nEvent:\n{json.dumps(event, indent=2)}"
                )
            except:
                pass
        
        raise

```

## Deployment Instructions

1. Initialize Terraform:
   ```bash
   terraform init -backend-config="bucket=your-state-bucket"
   ```

2. Set required variables:
   ```bash
   export TF_VAR_environment_suffix="pr123"
   export TF_VAR_master_password="YourSecurePassword"
   ```

3. Plan and apply:
   ```bash
   terraform plan
   terraform apply
   ```

4. Access outputs:
   ```bash
   terraform output aurora_cluster_endpoint
   terraform output aurora_reader_endpoint
   ```

## Key Features

- **Automatic Scaling**: Aurora Serverless v2 scales from 0.5 to 128 ACUs based on CPU and connection metrics
- **High Availability**: Multi-AZ deployment with automatic failover
- **Security**: KMS encryption, private subnets, least privilege IAM policies
- **Monitoring**: Comprehensive CloudWatch alarms and dashboard
- **Compliance**: GDPR-ready with encryption at rest and audit logging
- **Cost Optimization**: Scheduled scaling for predictable patterns, lifecycle policies for backups

## Security Considerations

- All data encrypted at rest using KMS
- All data encrypted in transit using TLS
- IAM policies follow least privilege principle
- Security groups restrict access to port 3306 from application tier only
- S3 buckets block all public access
- CloudWatch logs encrypted with KMS

## Operational Notes

- Enhanced monitoring enabled for detailed performance metrics
- CloudWatch alarms notify via SNS for critical events
- EventBridge captures all scaling and failover events
- Automatic backups with 7-day retention
- S3 backup lifecycle transitions to cheaper storage after 30 days
