```hcl
# ====================
# Variables
# ====================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "rds-postgres-prod"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "proddb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 500
}

variable "owner_tag" {
  description = "Owner tag for cost allocation"
  type        = string
  default     = "DevOps-Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

# ====================
# Data Sources
# ====================

data "aws_availability_zones" "available" {
  state = "available"
}

# ====================
# Networking Resources
# ====================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eip-${count.index + 1}"
  })
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private_db" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-db-subnet-${count.index + 1}"
    Type = "Private-DB"
  })
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-app-subnet-${count.index + 1}"
    Type = "Private-App"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_db" {
  count          = 3
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "private_app" {
  count          = 3
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ====================
# Security Groups
# ====================

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS PostgreSQL instance"

  ingress {
    description = "PostgreSQL from Application Subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = aws_subnet.private_app[*].cidr_block
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ====================
# Password Generation & Secrets Manager
# ====================

# Generate random password
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_special      = 5
  min_upper        = 5
  min_lower        = 5
  min_numeric      = 5
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name_prefix             = "${var.project_name}-db-password-"
  description             = "RDS PostgreSQL master password"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.db_name
  })
}

# ====================
# RDS Resources
# ====================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.project_name}-postgres-params"
  family = "postgres15"

  # Connection Management Parameters
  parameter {
    name         = "max_connections"
    value        = "250"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements,auto_explain"
    apply_method = "pending-reboot"
  }

  # Query Performance Parameters
  parameter {
    name         = "effective_cache_size"
    value        = "393216"
    apply_method = "immediate"
  }

  parameter {
    name         = "checkpoint_completion_target"
    value        = "0.9"
    apply_method = "immediate"
  }

  parameter {
    name         = "work_mem"
    value        = "4096"
    apply_method = "immediate"
  }

  parameter {
    name         = "maintenance_work_mem"
    value        = "65536"
    apply_method = "immediate"
  }

  parameter {
    name         = "random_page_cost"
    value        = "1.1"
    apply_method = "immediate"
  }

  parameter {
    name         = "effective_io_concurrency"
    value        = "200"
    apply_method = "immediate"
  }

  # Statement Timeout and Logging
  parameter {
    name         = "statement_timeout"
    value        = "60000"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_statement"
    value        = "none"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_min_duration_statement"
    value        = "1000"
    apply_method = "immediate"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres-params"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "enhanced_monitoring" {
  name_prefix = "${var.project_name}-rds-monitoring-"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "enhanced_monitoring" {
  role       = aws_iam_role.enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"

  # Engine Configuration
  engine                      = "postgres"
  engine_version              = "15.14"
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false

  # Instance Configuration
  instance_class        = var.db_instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password.result
  port     = 5432

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = true

  # Parameter Groups
  parameter_group_name = aws_db_parameter_group.postgres.name

  # Backup Configuration
  backup_retention_period   = 7
  backup_window             = "08:00-09:00"         # Midnight PST (UTC-8)
  maintenance_window        = "sun:09:00-sun:10:00" # 1 AM PST Sunday
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-postgres-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  copy_tags_to_snapshot     = true

  # Monitoring Configuration
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.enhanced_monitoring.arn
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Other Settings
  apply_immediately = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres"
  })

  depends_on = [
    aws_iam_role_policy_attachment.enhanced_monitoring
  ]
}

# ====================
# CloudWatch Alarms
# ====================

# SNS Topic for Alarms
resource "aws_sns_topic" "db_alarms" {
  name = "${var.project_name}-db-alarms"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-alarms"
  })
}

resource "aws_sns_topic_subscription" "db_alarms_email" {
  topic_arn = aws_sns_topic.db_alarms.arn
  protocol  = "email"
  endpoint  = "ops-team@example.com" # Change to your email
}

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.project_name}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "60" # 1-minute granularity
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = local.common_tags
}

# Database Connections Alarm
resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "${var.project_name}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60" # 1-minute granularity
  statistic           = "Average"
  threshold           = "180"
  alarm_description   = "Alert when DB connections exceed 180"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = local.common_tags
}

# Read Latency Alarm
resource "aws_cloudwatch_metric_alarm" "read_latency" {
  alarm_name          = "${var.project_name}-rds-read-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "60" # 1-minute granularity
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "Alert when read latency exceeds 200ms"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = local.common_tags
}

# Write Latency Alarm
resource "aws_cloudwatch_metric_alarm" "write_latency" {
  alarm_name          = "${var.project_name}-rds-write-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "60" # 1-minute granularity
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "Alert when write latency exceeds 200ms"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = local.common_tags
}

# Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "free_storage" {
  alarm_name          = "${var.project_name}-rds-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "60" # 1-minute granularity
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "Alert when free storage falls below 10GB"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = local.common_tags
}

# ====================
# CloudWatch Dashboard
# ====================

resource "aws_cloudwatch_dashboard" "rds_monitoring" {
  dashboard_name = "${var.project_name}-rds-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Performance Metrics"
          period  = 60 # 1-minute granularity
          dimensions = {
            DBInstanceIdentifier = aws_db_instance.postgres.id
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", label = "Read Latency" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency" }],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Latency"
          period  = 60 # 1-minute granularity
          dimensions = {
            DBInstanceIdentifier = aws_db_instance.postgres.id
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average", label = "Free Storage" }],
            [".", "ReadIOPS", { stat = "Average", label = "Read IOPS" }],
            [".", "WriteIOPS", { stat = "Average", label = "Write IOPS" }],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Storage and IOPS"
          period  = 60 # 1-minute granularity
          dimensions = {
            DBInstanceIdentifier = aws_db_instance.postgres.id
          }
        }
      }
    ]
  })
}

# ====================
# Local Values
# ====================

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner_tag
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }
}

# ====================
# Outputs
# ====================

output "aws_region" {
  description = "aws region"
  value       = var.aws_region
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = false
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.postgres.address
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.postgres.port
}

output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.postgres.id
}

output "db_parameter_group_name" {
  description = "The name of the DB parameter group"
  value       = aws_db_parameter_group.postgres.name
}

output "db_subnet_group_name" {
  description = "The name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for database"
  value       = aws_subnet.private_db[*].id
}

output "app_subnet_ids" {
  description = "List of application subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for database alarms"
  value       = aws_sns_topic.db_alarms.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.rds_monitoring.dashboard_name}"
}

output "connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${var.db_username}:PASSWORD@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
  sensitive   = true
}

output "db_password_secret_arn" {
  description = "The ARN of the Secrets Manager secret containing the database password"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_password_secret_name" {
  description = "The name of the Secrets Manager secret containing the database password"
  value       = aws_secretsmanager_secret.db_password.name
}

output "monitoring_role_arn" {
  description = "The ARN of the enhanced monitoring IAM role"
  value       = aws_iam_role.enhanced_monitoring.arn
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```
