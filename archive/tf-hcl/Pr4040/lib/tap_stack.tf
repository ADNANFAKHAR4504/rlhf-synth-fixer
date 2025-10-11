# tap_stack.tf - RDS MySQL Infrastructure with HIPAA Compliance

# ================================================================================
# VARIABLES
# ================================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "application" {
  description = "Application name"
  type        = string
  default     = "healthcare-app"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "db_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
  default     = "healthcare-db"
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "healthcare_db"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.m5.large"
}

variable "engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 1000
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
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

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "enable_iam_auth" {
  description = "Enable IAM database authentication"
  type        = bool
  default     = false
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold_gb" {
  description = "Free memory threshold for alarm (in GB)"
  type        = number
  default     = 2
}

variable "storage_alarm_threshold_gb" {
  description = "Free storage space threshold for alarm (in GB)"
  type        = number
  default     = 10
}

variable "connection_alarm_threshold" {
  description = "Database connections threshold for alarm"
  type        = number
  default     = 80
}

variable "snapshot_retention_days" {
  description = "Number of days to retain manual snapshots"
  type        = number
  default     = 30
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "sns_email_endpoint" {
  description = "Email address for SNS alarm notifications"
  type        = string
  default     = "alerts@example.com"
}

variable "environment_suffix" {
  description = "Random suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

# ================================================================================
# DATA SOURCES
# ================================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ================================================================================
# RANDOM SUFFIX FOR UNIQUE NAMING
# ================================================================================

# Generate random suffix if not provided
resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ================================================================================
# LOCALS
# ================================================================================

locals {
  # Environment suffix
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  tags = {
    Environment = var.environment
    Application = var.application
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Compliance  = "HIPAA"
  }

  vpc_cidr             = "10.0.10.0/24"
  private_subnet_cidrs = ["10.0.10.0/25", "10.0.10.128/25"]
}

# ================================================================================
# VPC AND NETWORKING
# ================================================================================

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-vpc"
  })
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[0]
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-private-subnet-a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[1]
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-private-subnet-b"
    Type = "Private"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.db_identifier}-subnet-group-${local.env_suffix}"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-subnet-group-${local.env_suffix}"
  })
}

# ================================================================================
# SECURITY GROUPS
# ================================================================================

resource "aws_security_group" "app" {
  name_prefix = "${var.application}-app-sg-"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.tags, {
    Name = "${var.application}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.db_identifier}-sg-"
  description = "Security group for RDS MySQL instance"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  security_group_id        = aws_security_group.rds.id
  description              = "Allow MySQL access from application"
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
  description       = "Allow all outbound traffic"
}

# ================================================================================
# KMS ENCRYPTION
# ================================================================================

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.db_identifier}-rds-${local.env_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# ================================================================================
# SECRETS MANAGER
# ================================================================================

resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.db_identifier}-master-password-${local.env_suffix}"
  description             = "Master password for RDS MySQL instance"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 30

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-master-password-${local.env_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.master.result
}

# ================================================================================
# RDS PARAMETER GROUP
# ================================================================================

resource "aws_db_parameter_group" "main" {
  name   = "${var.db_identifier}-params-${local.env_suffix}"
  family = "mysql8.0"

  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  parameter {
    name  = "general_log"
    value = "1"
  }

  parameter {
    name  = "log_output"
    value = "FILE"
  }

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-parameter-group-${local.env_suffix}"
  })
}

# ================================================================================
# CLOUDWATCH LOG GROUPS
# ================================================================================

resource "aws_cloudwatch_log_group" "rds_error" {
  name              = "/aws/rds/instance/${var.db_identifier}-${local.env_suffix}/error"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "rds_general" {
  name              = "/aws/rds/instance/${var.db_identifier}-${local.env_suffix}/general"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "rds_slowquery" {
  name              = "/aws/rds/instance/${var.db_identifier}-${local.env_suffix}/slowquery"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

# ================================================================================
# RDS INSTANCE
# ================================================================================

resource "aws_db_instance" "main" {
  identifier     = "${var.db_identifier}-${local.env_suffix}"
  db_name        = var.db_name
  engine         = "mysql"
  engine_version = var.engine_version

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  username = var.db_username
  password = random_password.master.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az            = var.multi_az
  publicly_accessible = false
  deletion_protection = var.deletion_protection
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.db_identifier}-final-snapshot-${local.env_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  enabled_cloudwatch_logs_exports     = ["error", "general", "slowquery"]
  iam_database_authentication_enabled = var.enable_iam_auth

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-${local.env_suffix}"
  })

  depends_on = [
    aws_cloudwatch_log_group.rds_error,
    aws_cloudwatch_log_group.rds_general,
    aws_cloudwatch_log_group.rds_slowquery
  ]
}

# ================================================================================
# SNS TOPIC FOR ALARMS
# ================================================================================

resource "aws_sns_topic" "alarms" {
  name              = "${var.db_identifier}-alarms-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.rds.id

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-alarms-${local.env_suffix}"
  })
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoint
}

# ================================================================================
# CLOUDWATCH ALARMS
# ================================================================================

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.db_identifier}-cpu-utilization-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "freeable_memory" {
  alarm_name          = "${var.db_identifier}-low-memory-${local.env_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold_gb * 1024 * 1024 * 1024
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${var.db_identifier}-low-storage-${local.env_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.storage_alarm_threshold_gb * 1024 * 1024 * 1024
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.db_identifier}-high-connections-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.connection_alarm_threshold
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.tags
}

# ================================================================================
# IAM ROLE FOR LAMBDA
# ================================================================================

resource "aws_iam_role" "lambda_snapshot" {
  name = "${var.db_identifier}-snapshot-lambda-role-${local.env_suffix}"

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

  tags = local.tags
}

resource "aws_iam_role_policy" "lambda_snapshot" {
  name = "${var.db_identifier}-snapshot-lambda-policy-${local.env_suffix}"
  role = aws_iam_role.lambda_snapshot.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:AddTagsToResource",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:CreateGrant"
        ]
        Resource = aws_kms_key.rds.arn
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

# ================================================================================
# LAMBDA FUNCTION FOR SNAPSHOTS
# ================================================================================

data "archive_file" "lambda_snapshot" {
  type        = "zip"
  source_file = "${path.module}/lambda/snapshot.py"
  output_path = "${path.module}/lambda_snapshot.zip"
}

resource "aws_lambda_function" "snapshot" {
  filename         = data.archive_file.lambda_snapshot.output_path
  function_name    = "${var.db_identifier}-snapshot-manager-${local.env_suffix}"
  role             = aws_iam_role.lambda_snapshot.arn
  handler          = "snapshot.handler"
  source_code_hash = data.archive_file.lambda_snapshot.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = 60

  environment {
    variables = {
      DB_INSTANCE_IDENTIFIER = aws_db_instance.main.identifier
      RETENTION_DAYS         = var.snapshot_retention_days
    }
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_snapshot" {
  name              = "/aws/lambda/${aws_lambda_function.snapshot.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

# ================================================================================
# EVENTBRIDGE RULE FOR DAILY SNAPSHOTS
# ================================================================================

resource "aws_cloudwatch_event_rule" "daily_snapshot" {
  name                = "${var.db_identifier}-daily-snapshot-${local.env_suffix}"
  description         = "Trigger daily RDS snapshot"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.daily_snapshot.name
  target_id = "SnapshotLambdaTarget"
  arn       = aws_lambda_function.snapshot.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.snapshot.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_snapshot.arn
}

# ================================================================================
# OUTPUTS
# ================================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "The RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_instance_resource_id" {
  description = "The RDS instance resource ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "db_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "db_security_group_id" {
  description = "The security group ID of the RDS instance"
  value       = aws_security_group.rds.id
}

output "app_security_group_id" {
  description = "The security group ID of the application"
  value       = aws_security_group.app.id
}

output "db_subnet_group_name" {
  description = "The DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_id" {
  description = "The ID of the KMS key used for encryption"
  value       = aws_kms_key.rds.key_id
}

output "db_parameter_group_name" {
  description = "The name of the RDS parameter group"
  value       = aws_db_parameter_group.main.name
}

output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log group names"
  value = {
    error     = aws_cloudwatch_log_group.rds_error.name
    general   = aws_cloudwatch_log_group.rds_general.name
    slowquery = aws_cloudwatch_log_group.rds_slowquery.name
  }
}

output "secret_arn" {
  description = "The ARN of the Secrets Manager secret containing the database password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "lambda_function_name" {
  description = "The name of the Lambda function for snapshot management"
  value       = aws_lambda_function.snapshot.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function for snapshot management"
  value       = aws_lambda_function.snapshot.arn
}

output "eventbridge_rule_name" {
  description = "The name of the EventBridge rule for daily snapshots"
  value       = aws_cloudwatch_event_rule.daily_snapshot.name
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}
