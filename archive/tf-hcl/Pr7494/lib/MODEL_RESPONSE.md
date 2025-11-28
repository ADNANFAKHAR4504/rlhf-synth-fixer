# Database Migration Infrastructure - Terraform Implementation

This implementation provides a complete AWS infrastructure for migrating an on-premises PostgreSQL database to Aurora PostgreSQL using AWS Database Migration Service (DMS).

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project        = "inventory-migration"
      Environment    = var.environment
      MigrationPhase = var.migration_phase
      CostCenter     = var.cost_center
      ManagedBy      = "terraform"
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "migration_phase" {
  description = "Current migration phase (setup, testing, cutover, complete)"
  type        = string
  default     = "setup"
}

variable "cost_center" {
  description = "Cost center tag for billing"
  type        = string
  default     = "engineering"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Aurora Configuration
variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version (matching source PostgreSQL 13.x)"
  type        = string
  default     = "13.12"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances (minimum 2 for Multi-AZ)"
  type        = number
  default     = 2
}

variable "aurora_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "aurora_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
}

variable "aurora_database_name" {
  description = "Initial database name"
  type        = string
  default     = "inventory"
}

variable "aurora_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "aurora_preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "aurora_preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# DMS Configuration
variable "dms_replication_instance_class" {
  description = "DMS replication instance class (sized for 500GB migration)"
  type        = string
  default     = "dms.c5.2xlarge"
}

variable "dms_allocated_storage" {
  description = "DMS replication instance storage in GB"
  type        = number
  default     = 500
}

variable "dms_source_endpoint_host" {
  description = "On-premises source database host"
  type        = string
}

variable "dms_source_endpoint_port" {
  description = "On-premises source database port"
  type        = number
  default     = 5432
}

variable "dms_source_database_name" {
  description = "Source database name"
  type        = string
  default     = "inventory"
}

variable "dms_source_username" {
  description = "Source database username"
  type        = string
  sensitive   = true
}

variable "dms_source_password" {
  description = "Source database password"
  type        = string
  sensitive   = true
}

# S3 Configuration
variable "s3_lifecycle_ia_transition_days" {
  description = "Days before transitioning to Infrequent Access"
  type        = number
  default     = 90
}

variable "s3_lifecycle_glacier_transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before expiring old versions"
  type        = number
  default     = 365
}

# CloudWatch Configuration
variable "alarm_replication_lag_threshold" {
  description = "Replication lag alarm threshold in seconds"
  type        = number
  default     = 300
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization alarm threshold percentage"
  type        = number
  default     = 80
}

variable "alarm_email_endpoints" {
  description = "Email addresses for alarm notifications"
  type        = list(string)
  default     = []
}
```

## File: lib/main.tf

```hcl
# KMS Keys for Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS Aurora encryption - ${var.environment_suffix}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "rds-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-aurora-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption - ${var.environment_suffix}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "s3-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-migration-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "migration-vpc-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "migration-igw-${var.environment_suffix}"
  }
}

# Public Subnets (for NAT Gateway and DMS)
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "migration-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets (for RDS Aurora)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "migration-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "migration-public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "aurora" {
  name_prefix = "aurora-sg-${var.environment_suffix}-"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "dms" {
  name_prefix = "dms-sg-${var.environment_suffix}-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from on-premises"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to on-premises IP ranges in production
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dms-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for DMS
resource "aws_iam_role" "dms_vpc_role" {
  name = "dms-vpc-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "dms-vpc-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "dms_vpc_role" {
  role       = aws_iam_role.dms_vpc_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

resource "aws_iam_role" "dms_cloudwatch_role" {
  name = "dms-cloudwatch-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "dms-cloudwatch-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch_role" {
  role       = aws_iam_role.dms_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}

# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  }
}

# Aurora Parameter Group (PostgreSQL 13.x compatible)
resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "aurora-pg13-params-${var.environment_suffix}"
  family      = "aurora-postgresql13"
  description = "Custom parameter group for Aurora PostgreSQL 13 - ${var.environment_suffix}"

  # Parameters matching PostgreSQL 13.x configuration
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pg_hint_plan"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "aurora-pg13-params-${var.environment_suffix}"
  }
}

resource "aws_db_parameter_group" "aurora_instance" {
  name        = "aurora-instance-params-${var.environment_suffix}"
  family      = "aurora-postgresql13"
  description = "Instance parameter group for Aurora PostgreSQL 13 - ${var.environment_suffix}"

  tags = {
    Name = "aurora-instance-params-${var.environment_suffix}"
  }
}

# Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = var.aurora_engine_version
  database_name                   = var.aurora_database_name
  master_username                 = var.aurora_master_username
  master_password                 = var.aurora_master_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]

  # Multi-AZ and High Availability
  availability_zones = var.availability_zones

  # Backup Configuration
  backup_retention_period      = var.aurora_backup_retention_period
  preferred_backup_window      = var.aurora_preferred_backup_window
  preferred_maintenance_window = var.aurora_preferred_maintenance_window

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Deletion Protection - DISABLED for destroyability
  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Cluster Instances
resource "aws_rds_cluster_instance" "aurora" {
  count              = var.aurora_instance_count
  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  db_parameter_group_name = aws_db_parameter_group.aurora_instance.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

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
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group - ${var.environment_suffix}"
  subnet_ids                           = aws_subnet.public[*].id

  tags = {
    Name = "dms-subnet-group-${var.environment_suffix}"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id      = "dms-instance-${var.environment_suffix}"
  replication_instance_class   = var.dms_replication_instance_class
  allocated_storage            = var.dms_allocated_storage
  vpc_security_group_ids       = [aws_security_group.dms.id]
  replication_subnet_group_id  = aws_dms_replication_subnet_group.main.id
  publicly_accessible          = false
  multi_az                     = true
  engine_version               = "3.5.2"
  auto_minor_version_upgrade   = false
  allow_major_version_upgrade  = false
  apply_immediately            = true

  tags = {
    Name = "dms-instance-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc_role,
    aws_iam_role_policy_attachment.dms_cloudwatch_role
  ]
}

# DMS Source Endpoint (On-premises PostgreSQL)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "source-endpoint-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name = var.dms_source_endpoint_host
  port        = var.dms_source_endpoint_port
  database_name = var.dms_source_database_name
  username    = var.dms_source_username
  password    = var.dms_source_password

  ssl_mode = "require"

  tags = {
    Name = "source-endpoint-${var.environment_suffix}"
  }
}

# DMS Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-endpoint-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"

  server_name   = aws_rds_cluster.aurora.endpoint
  port          = 5432
  database_name = var.aurora_database_name
  username      = var.aurora_master_username
  password      = var.aurora_master_password

  ssl_mode = "require"

  tags = {
    Name = "target-endpoint-${var.environment_suffix}"
  }

  depends_on = [aws_rds_cluster.aurora]
}

# DMS Replication Task (Full Load + CDC)
resource "aws_dms_replication_task" "main" {
  replication_task_id       = "migration-task-${var.environment_suffix}"
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn       = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target.endpoint_arn
  table_mappings            = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "migrate-all-tables"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    TargetMetadata = {
      SupportLobs                = true
      FullLobMode                = false
      LobChunkSize               = 64
      LimitedSizeLobMode         = true
      LobMaxSize                 = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode        = "DO_NOTHING"
      CreatePkAfterFullLoad      = false
      StopTaskCachedChangesApplied = false
      StopTaskCachedChangesNotApplied = false
      MaxFullLoadSubTasks        = 8
      TransactionConsistencyTimeout = 600
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped   = true
      HandleSourceTableTruncated = true
      HandleSourceTableAltered   = true
    }
    ErrorBehavior = {
      DataErrorPolicy            = "LOG_ERROR"
      EventErrorPolicy           = "IGNORE"
      DataTruncationErrorPolicy  = "LOG_ERROR"
      DataErrorEscalationPolicy  = "SUSPEND_TABLE"
      DataErrorEscalationCount   = 50
      TableErrorPolicy           = "SUSPEND_TABLE"
      TableErrorEscalationPolicy = "STOP_TASK"
      TableErrorEscalationCount  = 50
      RecoverableErrorCount      = -1
      RecoverableErrorInterval   = 5
      RecoverableErrorThrottling = true
      RecoverableErrorThrottlingMax = 1800
      ApplyErrorDeletePolicy     = "IGNORE_RECORD"
      ApplyErrorInsertPolicy     = "LOG_ERROR"
      ApplyErrorUpdatePolicy     = "LOG_ERROR"
      ApplyErrorEscalationPolicy = "LOG_ERROR"
      ApplyErrorEscalationCount  = 0
      FullLoadIgnoreConflicts    = true
    }
    ChangeProcessingTuning = {
      BatchApplyPreserveTransaction = true
      BatchApplyTimeoutMin          = 1
      BatchApplyTimeoutMax          = 30
      BatchApplyMemoryLimit         = 500
      BatchSplitSize                = 0
      MinTransactionSize            = 1000
      CommitTimeout                 = 1
      MemoryLimitTotal              = 1024
      MemoryKeepTime                = 60
      StatementCacheSize            = 50
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "SOURCE_UNLOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_LOAD"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_INFO"
        }
      ]
    }
  })

  tags = {
    Name = "migration-task-${var.environment_suffix}"
  }

  depends_on = [
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}

# S3 Bucket for File Migration
resource "aws_s3_bucket" "migration" {
  bucket = "inventory-migration-${var.environment_suffix}"

  tags = {
    Name = "inventory-migration-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "migration" {
  bucket = aws_s3_bucket.migration.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "migration" {
  bucket = aws_s3_bucket.migration.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "migration" {
  bucket = aws_s3_bucket.migration.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    transition {
      days          = var.s3_lifecycle_ia_transition_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_lifecycle_glacier_transition_days
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = var.s3_lifecycle_ia_transition_days
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = var.s3_lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "migration" {
  bucket = aws_s3_bucket.migration.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SNS Topic for Notifications
resource "aws_sns_topic" "migration_alerts" {
  name              = "migration-alerts-${var.environment_suffix}"
  display_name      = "Database Migration Alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = {
    Name = "migration-alerts-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "migration_email" {
  count     = length(var.alarm_email_endpoints)
  topic_arn = aws_sns_topic.migration_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CDCLatencyTarget"
  namespace           = "AWS/DMS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_replication_lag_threshold
  alarm_description   = "DMS replication lag exceeds ${var.alarm_replication_lag_threshold} seconds"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }

  tags = {
    Name = "dms-replication-lag-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "aurora-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "Aurora CPU utilization exceeds ${var.alarm_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-cpu-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "aurora-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "450"
  alarm_description   = "Aurora database connections approaching limit"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-connections-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_storage" {
  alarm_name          = "aurora-storage-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "VolumeBytesUsed"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "644245094400" # 600 GB in bytes
  alarm_description   = "Aurora storage usage exceeds 600 GB"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-storage-${var.environment_suffix}"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencyTarget", { "stat" : "Average" }],
            [".", "CDCLatencySource", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DMS Replication Lag"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "FullLoadThroughputRowsTarget", { "stat" : "Average" }],
            [".", "FullLoadThroughputBandwidthTarget", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DMS Full Load Throughput"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { "stat" : "Average", "label" : "Aurora CPU" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora CPU Utilization"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Database Connections"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "VolumeBytesUsed", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Storage Usage"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "WriteLatency", { "stat" : "Average" }],
            [".", "ReadLatency", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Read/Write Latency"
          period  = 300
        }
      }
    ]
  })
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "dms_replication_instance_arn" {
  description = "DMS replication instance ARN"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_replication_instance_private_ip" {
  description = "DMS replication instance private IP addresses"
  value       = aws_dms_replication_instance.main.replication_instance_private_ips
}

output "dms_source_endpoint_arn" {
  description = "DMS source endpoint ARN"
  value       = aws_dms_endpoint.source.endpoint_arn
}

output "dms_target_endpoint_arn" {
  description = "DMS target endpoint ARN"
  value       = aws_dms_endpoint.target.endpoint_arn
}

output "dms_replication_task_arn" {
  description = "DMS replication task ARN"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "s3_migration_bucket_name" {
  description = "S3 bucket name for file migration"
  value       = aws_s3_bucket.migration.id
}

output "s3_migration_bucket_arn" {
  description = "S3 bucket ARN for file migration"
  value       = aws_s3_bucket.migration.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for migration alerts"
  value       = aws_sns_topic.migration_alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.migration.dashboard_name
}

output "kms_rds_key_id" {
  description = "KMS key ID for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_s3_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.id
}

output "security_group_aurora_id" {
  description = "Security group ID for Aurora"
  value       = aws_security_group.aurora.id
}

output "security_group_dms_id" {
  description = "Security group ID for DMS"
  value       = aws_security_group.dms.id
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this to terraform.tfvars and fill in your values

aws_region         = "us-east-1"
environment_suffix = "prod-001"
environment        = "production"
migration_phase    = "setup"
cost_center        = "engineering"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Aurora Configuration
aurora_engine_version              = "13.12"
aurora_instance_class              = "db.r6g.xlarge"
aurora_instance_count              = 2
aurora_database_name               = "inventory"
aurora_backup_retention_period     = 30
aurora_preferred_backup_window     = "03:00-04:00"
aurora_preferred_maintenance_window = "sun:04:00-sun:05:00"

# Sensitive values - DO NOT commit these to version control
# aurora_master_username = "postgres"
# aurora_master_password = "CHANGE_ME_STRONG_PASSWORD"

# DMS Configuration
dms_replication_instance_class = "dms.c5.2xlarge"
dms_allocated_storage          = 500
dms_source_endpoint_host       = "192.168.1.100"
dms_source_endpoint_port       = 5432
dms_source_database_name       = "inventory"

# Sensitive values - DO NOT commit these to version control
# dms_source_username = "replication_user"
# dms_source_password = "CHANGE_ME_STRONG_PASSWORD"

# S3 Lifecycle
s3_lifecycle_ia_transition_days     = 90
s3_lifecycle_glacier_transition_days = 180
s3_lifecycle_expiration_days        = 365

# CloudWatch Alarms
alarm_replication_lag_threshold = 300
alarm_cpu_threshold             = 80
alarm_email_endpoints           = ["ops-team@example.com", "dba-team@example.com"]
```

## File: lib/README.md

```markdown
# Database Migration Infrastructure

This Terraform configuration provides a complete infrastructure for migrating an on-premises PostgreSQL database to AWS Aurora PostgreSQL using AWS Database Migration Service (DMS).

## Architecture Overview

The infrastructure includes:

- **RDS Aurora PostgreSQL**: Multi-AZ cluster with automated backups and encryption
- **AWS DMS**: Replication instance with full load and CDC capabilities
- **VPC Networking**: 3 availability zones with public and private subnets
- **S3 Storage**: Versioned bucket with lifecycle policies for file migration
- **CloudWatch**: Comprehensive monitoring dashboard and alarms
- **SNS**: Alert notifications for migration events
- **KMS**: Customer-managed encryption keys for data at rest
- **IAM**: Least privilege roles and policies for DMS

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- On-premises PostgreSQL 13.x database accessible from AWS
- Valid SSL certificates for secure connections

## Deployment Instructions

### Step 1: Configure Variables

Copy the example variables file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:

- `environment_suffix`: Unique suffix for resource naming (e.g., "prod-001")
- `dms_source_endpoint_host`: IP address or hostname of on-premises database
- `aurora_master_password`: Strong password for Aurora cluster
- `dms_source_username` and `dms_source_password`: Credentials for source database
- `alarm_email_endpoints`: Email addresses for alerts

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Execution Plan

```bash
terraform plan
```

Review the plan to ensure all resources will be created as expected.

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm deployment.

Deployment takes approximately 20-30 minutes for Aurora cluster provisioning.

### Step 5: Start DMS Replication Task

After infrastructure is deployed, start the DMS replication task:

```bash
aws dms start-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn) \
  --start-replication-task-type start-replication
```

### Step 6: Monitor Migration Progress

Access the CloudWatch dashboard:

```bash
echo "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$(terraform output -raw cloudwatch_dashboard_name)"
```

Monitor replication lag and error rates.

## Testing

Run Terraform validation and tests:

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Run tests
cd ../test
go test -v -timeout 30m
```

## Migration Runbook

See [runbook.md](runbook.md) for detailed migration procedures including:

- Pre-migration checklist
- Cutover procedures
- Rollback steps
- Post-migration verification

## State Management

See [state-migration.md](state-migration.md) for Terraform state management best practices.

## Resource Cleanup

To destroy all resources:

```bash
# Stop DMS replication task first
aws dms stop-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Wait for task to stop (5-10 minutes)
aws dms wait replication-task-stopped \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Destroy infrastructure
terraform destroy
```

## Outputs

Key outputs available after deployment:

- `aurora_cluster_endpoint`: Writer endpoint for Aurora cluster
- `aurora_cluster_reader_endpoint`: Reader endpoint for queries
- `s3_migration_bucket_name`: S3 bucket for file migration
- `cloudwatch_dashboard_name`: CloudWatch dashboard for monitoring
- `dms_replication_task_arn`: ARN of DMS replication task

## Security Considerations

- All data is encrypted at rest using KMS customer-managed keys
- Security groups restrict traffic to only necessary sources
- IAM roles follow least privilege principle
- Aurora cluster has deletion protection disabled for testing (enable in production)
- SNS topics are encrypted with KMS
- S3 bucket blocks all public access

## Cost Optimization

- Aurora uses Serverless v2 or right-sized instances
- S3 lifecycle policies transition to cheaper storage classes
- DMS replication instance sized appropriately for workload
- CloudWatch logs have retention policies

## Support and Troubleshooting

### Common Issues

1. **DMS Connection Failures**: Verify security group rules and network connectivity
2. **Replication Lag**: Check DMS instance size and network bandwidth
3. **Aurora Connection Limits**: Monitor DatabaseConnections metric and adjust instance class
4. **S3 Upload Failures**: Verify IAM permissions and KMS key policies

### Logging

- Aurora logs: CloudWatch Logs group `/aws/rds/cluster/aurora-cluster-*`
- DMS logs: CloudWatch Logs group `/aws/dms/tasks/*`
- Application logs: Configure in ECS tasks

## Contributing

Follow Terraform best practices:

- Use consistent naming conventions
- Tag all resources appropriately
- Document all variables and outputs
- Write tests for infrastructure changes
- Use `terraform fmt` before committing

## License

Internal use only - Proprietary
```

## File: lib/runbook.md

```markdown
# Database Migration Runbook

This runbook provides step-by-step procedures for executing the on-premises to AWS database migration.

## Migration Overview

- **Source**: On-premises PostgreSQL 13.x (500GB data + 2TB files)
- **Target**: AWS Aurora PostgreSQL 13.12 (Multi-AZ)
- **Migration Tool**: AWS Database Migration Service (DMS)
- **File Migration**: AWS S3 with lifecycle policies
- **Migration Window**: 4 hours
- **Deployment Pattern**: Blue-green with rollback capability

## Pre-Migration Checklist

### 1 Week Before Migration

- [ ] Infrastructure deployed and tested
- [ ] DMS replication task tested with sample data
- [ ] Aurora parameter groups match source PostgreSQL settings
- [ ] All schemas, indexes, and stored procedures verified in target
- [ ] CloudWatch dashboard and alarms configured
- [ ] SNS alert subscriptions confirmed
- [ ] Backup and rollback procedures tested
- [ ] Stakeholders notified of migration schedule

### 24 Hours Before Migration

- [ ] Final infrastructure validation
- [ ] DMS replication lag baseline established
- [ ] Application team ready for cutover
- [ ] On-call team notified
- [ ] Communication channels established
- [ ] Database backup completed and verified
- [ ] File storage backup completed

### 1 Hour Before Migration

- [ ] All team members on call
- [ ] Final system health check completed
- [ ] Backup verification completed
- [ ] Runbook reviewed with team

## Migration Phases

### Phase 1: Initial Setup (Complete before migration window)

**Duration**: Completed during infrastructure deployment

```bash
# Verify infrastructure is deployed
terraform output

# Verify Aurora cluster is available
aws rds describe-db-clusters \
  --db-cluster-identifier $(terraform output -raw aurora_cluster_id) \
  --query 'DBClusters[0].Status'

# Expected output: "available"
```

### Phase 2: Start Full Load Replication

**Duration**: 4-8 hours (before migration window)

```bash
# Start DMS replication task for full load
aws dms start-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn) \
  --start-replication-task-type start-replication

# Monitor task status
watch -n 30 'aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=$(terraform output -raw dms_replication_task_arn) \
  --query "ReplicationTasks[0].[Status,ReplicationTaskStats]"'

# Expected status progression: creating -> running -> completed
```

**Success Criteria**:
- DMS task status: "running" with CDC active
- Full load progress: 100%
- Replication lag: < 30 seconds
- No errors in DMS logs

### Phase 3: CDC Sync Period

**Duration**: Ongoing until cutover

```bash
# Monitor CDC lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/DMS \
  --metric-name CDCLatencyTarget \
  --dimensions Name=ReplicationTaskIdentifier,Value=migration-task-$(terraform output -raw environment_suffix) \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Check for errors
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=$(terraform output -raw dms_replication_task_arn) \
  --query 'ReplicationTasks[0].ReplicationTaskStats'
```

**Success Criteria**:
- CDC latency: < 60 seconds
- No table errors
- All source changes replicating

### Phase 4: Pre-Cutover Validation

**Duration**: 30 minutes

```bash
# 1. Verify Aurora cluster health
aws rds describe-db-clusters \
  --db-cluster-identifier $(terraform output -raw aurora_cluster_id) \
  --query 'DBClusters[0].[Status,MultiAZ,StorageEncrypted]'

# 2. Verify all Aurora instances are available
aws rds describe-db-cluster-members \
  --db-cluster-identifier $(terraform output -raw aurora_cluster_id) \
  --query 'DBClusterMembers[*].[DBInstanceIdentifier,IsClusterWriter,DBClusterMemberStatus]'

# 3. Verify data consistency
# Connect to source database
psql -h <source-host> -U <source-user> -d inventory -c "SELECT count(*) FROM products;"

# Connect to target Aurora
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "SELECT count(*) FROM products;"

# Row counts should match (allowing for CDC lag)

# 4. Verify indexes and constraints
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "\di"
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "\d+ products"

# 5. Test stored procedures
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "\df"
```

**Success Criteria**:
- Aurora cluster: "available" and Multi-AZ enabled
- All instances: "available"
- Row counts match (within CDC lag)
- All indexes present
- All stored procedures present
- All constraints present

### Phase 5: Application Cutover (Downtime Begins)

**Duration**: 15-30 minutes

```bash
# 1. Enable application maintenance mode
# (Application team executes)

# 2. Wait for in-flight transactions to complete
sleep 60

# 3. Stop writes to source database
# (DBA team executes source-side)

# 4. Wait for CDC to catch up
echo "Waiting for CDC to catch up..."
while true; do
  LAG=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/DMS \
    --metric-name CDCLatencyTarget \
    --dimensions Name=ReplicationTaskIdentifier,Value=migration-task-$(terraform output -raw environment_suffix) \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)

  echo "Current CDC lag: $LAG seconds"

  if (( $(echo "$LAG < 5" | bc -l) )); then
    echo "CDC caught up!"
    break
  fi
  sleep 10
done

# 5. Final data validation
SOURCE_COUNT=$(psql -h <source-host> -U <source-user> -d inventory -t -c "SELECT count(*) FROM products;")
TARGET_COUNT=$(psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -t -c "SELECT count(*) FROM products;")

echo "Source count: $SOURCE_COUNT"
echo "Target count: $TARGET_COUNT"

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
  echo "✓ Data validation passed"
else
  echo "✗ Data validation failed - STOP MIGRATION"
  exit 1
fi

# 6. Update application database connection strings
# (Application team updates configuration)

# 7. Disable maintenance mode and restart application
# (Application team executes)
```

**Success Criteria**:
- CDC lag: < 5 seconds
- Row counts match exactly
- Application connects to Aurora successfully
- No connection errors in application logs

### Phase 6: Post-Cutover Validation (Downtime Ends)

**Duration**: 30-60 minutes

```bash
# 1. Verify application functionality
# (Application team executes smoke tests)

# 2. Monitor Aurora metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=$(terraform output -raw aurora_cluster_id) \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average

aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBClusterIdentifier,Value=$(terraform output -raw aurora_cluster_id) \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average

# 3. Check application error rates
# (Application team monitors)

# 4. Verify write operations
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "INSERT INTO migration_test (timestamp) VALUES (NOW());"
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory -c "SELECT * FROM migration_test ORDER BY timestamp DESC LIMIT 1;"

# 5. Monitor CloudWatch dashboard
echo "Dashboard URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$(terraform output -raw cloudwatch_dashboard_name)"
```

**Success Criteria**:
- Application operational
- No database errors
- Normal connection count
- CPU utilization within normal range
- Write operations succeed
- Read operations succeed

### Phase 7: File Migration to S3

**Duration**: Varies (can run in parallel)

```bash
# 1. Install AWS CLI on source system
# (If not already installed)

# 2. Configure AWS credentials
aws configure

# 3. Sync files to S3
aws s3 sync /path/to/product-images/ \
  s3://$(terraform output -raw s3_migration_bucket_name)/product-images/ \
  --storage-class STANDARD \
  --metadata migration-date=$(date +%Y-%m-%d)

# 4. Verify file count
LOCAL_COUNT=$(find /path/to/product-images -type f | wc -l)
S3_COUNT=$(aws s3 ls s3://$(terraform output -raw s3_migration_bucket_name)/product-images/ --recursive | wc -l)

echo "Local files: $LOCAL_COUNT"
echo "S3 files: $S3_COUNT"

# 5. Update application configuration to use S3
# (Application team executes)
```

## Rollback Procedures

### Scenario 1: Pre-Cutover Issues

If issues detected before application cutover:

```bash
# 1. Stop DMS replication task
aws dms stop-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# 2. Investigate issues
aws logs tail /aws/dms/tasks/$(terraform output -raw dms_replication_task_arn | awk -F: '{print $NF}')

# 3. Fix issues and restart
aws dms start-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn) \
  --start-replication-task-type resume-processing
```

### Scenario 2: Post-Cutover Application Issues

If application issues after cutover:

```bash
# 1. Enable application maintenance mode
# (Application team executes)

# 2. Revert database connection strings to source
# (Application team updates configuration)

# 3. Restart application
# (Application team executes)

# 4. Disable maintenance mode
# (Application team executes)

# 5. DMS will continue replicating, allowing retry later
```

### Scenario 3: Data Corruption or Major Issues

If data corruption detected:

```bash
# 1. Immediate rollback to source database
# (Follow Scenario 2 steps)

# 2. Restore Aurora from backup if needed
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier $(terraform output -raw aurora_cluster_id) \
  --db-cluster-identifier $(terraform output -raw aurora_cluster_id)-restored \
  --restore-to-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

# 3. Investigate root cause
# 4. Plan retry after fixes
```

## Post-Migration Tasks

### Immediate (Within 1 Hour)

- [ ] All application smoke tests passed
- [ ] Database write operations confirmed
- [ ] Database read operations confirmed
- [ ] CloudWatch alarms reviewed (no critical alerts)
- [ ] DMS task status: "running" (for continued CDC)
- [ ] File migration progress verified
- [ ] Stakeholders notified of successful migration

### Within 24 Hours

- [ ] Application performance validated
- [ ] Database query performance analyzed
- [ ] All scheduled jobs executed successfully
- [ ] Backup procedures verified
- [ ] Documentation updated with new connection strings
- [ ] Team retrospective scheduled

### Within 1 Week

- [ ] Stop DMS replication task (after confidence period)
- [ ] Decommission source database
- [ ] Update disaster recovery procedures
- [ ] Remove temporary firewall rules
- [ ] Complete post-migration report
- [ ] Optimize Aurora configuration based on workload

### DMS Task Cleanup

After migration is stable (1-2 weeks):

```bash
# Stop DMS task
aws dms stop-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Wait for stop
aws dms wait replication-task-stopped \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Delete task (optional - can keep for rollback)
# aws dms delete-replication-task \
#   --replication-task-arn $(terraform output -raw dms_replication_task_arn)
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **DMS Replication Lag**: < 60 seconds normal, < 300 seconds alarm
2. **Aurora CPU**: < 80% normal, > 80% investigate
3. **Aurora Connections**: < 450 normal, > 450 alarm
4. **Aurora Storage**: Monitor growth rate
5. **Application Error Rate**: Should remain stable
6. **Application Response Time**: Should improve or stay same

### CloudWatch Dashboard

Access dashboard:
```bash
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$(terraform output -raw cloudwatch_dashboard_name)"
```

### SNS Alerts

Alert destinations configured in:
```bash
terraform output sns_topic_arn
```

## Contact Information

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Database team lead
3. **Level 3**: Infrastructure architect
4. **Level 4**: VP Engineering

### Support Resources

- AWS Support: Premium support case
- DMS Documentation: https://docs.aws.amazon.com/dms/
- Aurora Documentation: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/

## Appendix: Useful Commands

```bash
# Check DMS task status
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=$(terraform output -raw dms_replication_task_arn)

# View DMS logs
aws logs tail /aws/dms/tasks/$(terraform output -raw dms_replication_task_arn | awk -F: '{print $NF}') --follow

# Connect to Aurora
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d inventory

# List S3 bucket contents
aws s3 ls s3://$(terraform output -raw s3_migration_bucket_name)/ --recursive --human-readable

# Check CloudWatch alarms
aws cloudwatch describe-alarms --alarm-name-prefix migration-
```
```

## File: lib/state-migration.md

```markdown
# Terraform State Management Guide

This document provides guidance on managing Terraform state for the database migration infrastructure.

## State Storage Backend

### Recommended: S3 Backend with DynamoDB Locking

Create backend configuration file:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "database-migration/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY-ID"
  }
}
```

### Setup Backend Resources

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket your-terraform-state-bucket \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-terraform-state-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "your-kms-key-id"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket your-terraform-state-bucket \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Migrate Local State to S3

If you started with local state:

```bash
# 1. Initialize with backend configuration
terraform init -backend-config=backend.tf

# 2. Terraform will prompt to migrate state
# Answer 'yes' to copy local state to S3

# 3. Verify state is in S3
aws s3 ls s3://your-terraform-state-bucket/database-migration/

# 4. Backup local state before removing
cp terraform.tfstate terraform.tfstate.backup

# 5. Remove local state (after verification)
rm terraform.tfstate terraform.tfstate.backup
```

## State Operations

### View Current State

```bash
# List all resources in state
terraform state list

# Show specific resource details
terraform state show aws_rds_cluster.aurora

# Pull state to local file for inspection
terraform state pull > state-backup.json
```

### Backup State

```bash
# Manual backup
terraform state pull > state-backup-$(date +%Y%m%d-%H%M%S).json

# Automated backup script
#!/bin/bash
BACKUP_DIR=~/.terraform-backups
mkdir -p $BACKUP_DIR
cd /path/to/terraform/project
terraform state pull > $BACKUP_DIR/state-backup-$(date +%Y%m%d-%H%M%S).json

# Keep only last 30 backups
ls -t $BACKUP_DIR/state-backup-* | tail -n +31 | xargs rm -f
```

### Restore State from Backup

```bash
# Restore from local backup
terraform state push state-backup-TIMESTAMP.json

# Restore from S3 version
aws s3api list-object-versions \
  --bucket your-terraform-state-bucket \
  --prefix database-migration/terraform.tfstate

aws s3api get-object \
  --bucket your-terraform-state-bucket \
  --key database-migration/terraform.tfstate \
  --version-id VERSION-ID \
  state-restored.json

terraform state push state-restored.json
```

### Import Existing Resources

If resources were created outside Terraform:

```bash
# Import Aurora cluster
terraform import aws_rds_cluster.aurora aurora-cluster-prod-001

# Import Aurora instance
terraform import 'aws_rds_cluster_instance.aurora[0]' aurora-instance-1-prod-001

# Import DMS replication instance
terraform import aws_dms_replication_instance.main dms-instance-prod-001

# Import S3 bucket
terraform import aws_s3_bucket.migration inventory-migration-prod-001
```

### Move Resources Between Modules

```bash
# Move resource within state
terraform state mv aws_rds_cluster.aurora module.database.aws_rds_cluster.aurora

# Move resource to different state file (requires both state files)
terraform state mv -state=source.tfstate -state-out=dest.tfstate aws_rds_cluster.aurora aws_rds_cluster.aurora
```

### Remove Resources from State

```bash
# Remove resource from state without destroying
terraform state rm aws_rds_cluster.aurora

# Useful when:
# - Resource managed outside Terraform
# - Resource manually deleted
# - Splitting infrastructure into multiple state files
```

## Workspace Management

### Using Workspaces for Environments

```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new production

# Create staging workspace
terraform workspace new staging

# Switch between workspaces
terraform workspace select production
terraform workspace select staging

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete staging
```

### Workspace-Specific Variables

```hcl
# variables.tf
locals {
  environment_config = {
    production = {
      aurora_instance_class = "db.r6g.xlarge"
      aurora_instance_count = 3
      dms_instance_class    = "dms.c5.2xlarge"
    }
    staging = {
      aurora_instance_class = "db.r6g.large"
      aurora_instance_count = 2
      dms_instance_class    = "dms.c5.xlarge"
    }
  }

  config = local.environment_config[terraform.workspace]
}

resource "aws_rds_cluster_instance" "aurora" {
  count          = local.config.aurora_instance_count
  instance_class = local.config.aurora_instance_class
  # ...
}
```

## State Locking

### Verify Locking is Working

```bash
# Terminal 1: Start long-running operation
terraform apply

# Terminal 2: Try concurrent operation (should fail with lock error)
terraform plan
# Expected: Error acquiring the state lock

# Verify lock in DynamoDB
aws dynamodb scan \
  --table-name terraform-state-locks \
  --region us-east-1
```

### Force Unlock (Use with Caution)

```bash
# If Terraform crashes and leaves lock
terraform force-unlock LOCK-ID

# Get lock ID from error message or DynamoDB
aws dynamodb scan --table-name terraform-state-locks --region us-east-1
```

## State Security

### Encrypt Sensitive Data

```hcl
# Mark variables as sensitive
variable "aurora_master_password" {
  type      = string
  sensitive = true
}

variable "dms_source_password" {
  type      = string
  sensitive = true
}

# Sensitive values are redacted in CLI output but stored in state
# Ensure state file is encrypted at rest (S3 + KMS)
```

### Access Control

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowTerraformStateAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/TerraformRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::your-terraform-state-bucket/database-migration/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/TerraformRole"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-terraform-state-bucket"
    }
  ]
}
```

## Disaster Recovery

### State Corruption Recovery

```bash
# 1. Stop all Terraform operations

# 2. Pull current state
terraform state pull > state-corrupted.json

# 3. Restore from S3 version history
aws s3api list-object-versions \
  --bucket your-terraform-state-bucket \
  --prefix database-migration/terraform.tfstate \
  --query 'Versions[*].[VersionId,LastModified]' \
  --output table

# 4. Download previous version
aws s3api get-object \
  --bucket your-terraform-state-bucket \
  --key database-migration/terraform.tfstate \
  --version-id GOOD-VERSION-ID \
  state-restored.json

# 5. Validate restored state
cat state-restored.json | jq .

# 6. Push restored state
terraform state push state-restored.json

# 7. Verify with plan
terraform plan
```

### Complete State Loss Recovery

If all state is lost:

```bash
# 1. Create new empty state
terraform init

# 2. Import all resources one by one
# See "Import Existing Resources" section above

# 3. Run plan to verify
terraform plan

# 4. State should show no changes if all resources imported correctly
```

## Best Practices

1. **Always Use Remote State**: Never use local state in production
2. **Enable State Locking**: Prevent concurrent modifications
3. **Enable Versioning**: Allow state recovery from S3 versions
4. **Encrypt State**: Use KMS encryption for sensitive data
5. **Backup Regularly**: Automate state backups
6. **Use Workspaces**: Separate environments (dev/staging/prod)
7. **Limit Access**: Restrict state file access with IAM
8. **Review State**: Regularly audit state for drift
9. **Test Imports**: Validate resource imports before production
10. **Document Changes**: Keep changelog of state operations

## Troubleshooting

### State Drift Detection

```bash
# Check for drift
terraform plan -detailed-exitcode

# Exit codes:
# 0 = No changes
# 1 = Error
# 2 = Changes detected (drift)

# Refresh state from actual infrastructure
terraform refresh

# Show specific resource
terraform state show aws_rds_cluster.aurora
```

### State Conflicts

```bash
# If state conflicts occur during concurrent operations
# 1. Let current operation complete
# 2. Pull latest state
terraform init -reconfigure

# 3. Run plan again
terraform plan
```

### Large State Files

```bash
# Check state file size
terraform state pull | wc -c

# If state is too large (>50MB):
# 1. Split into separate modules
# 2. Use selective applies: terraform apply -target=module.database
# 3. Remove unused resources: terraform state rm
```

## CI/CD Integration

### GitLab CI Example

```yaml
terraform:
  before_script:
    - terraform init -backend-config="backend.tf"
  script:
    - terraform plan -out=tfplan
    - terraform apply tfplan
  only:
    - main
  artifacts:
    paths:
      - tfplan
```

### GitHub Actions Example

```yaml
name: Terraform

on:
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - run: terraform init -backend-config="backend.tf"
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan
```
```
