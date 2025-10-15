### Reasoning Trace

---

This is a comprehensive request for a production-ready RDS MySQL setup for a healthcare application with HIPAA compliance requirements. Let me break down what I need to create:

1. **versions.tf** - Terraform and AWS provider version constraints
2. **providers.tf** - AWS provider configuration
3. **variables.tf** - All input variables with proper types and defaults
4. **main.tf** - Core infrastructure components:
   - VPC and networking (optional)
   - Security groups
   - KMS key and alias
   - Secrets Manager for DB password
   - RDS subnet group
   - RDS instance with all required configurations
   - CloudWatch log groups
   - CloudWatch alarms
   - SNS topic (if not provided)
   - Lambda function for snapshots
   - EventBridge rule for daily snapshots
   - IAM role and policy for Lambda
5. **parameter-group.tf** - RDS parameter group with SSL enforcement
6. **outputs.tf** - All required outputs
7. **lambda/snapshot.py** - Python Lambda function for snapshot management
8. **README.md** - Comprehensive documentation with usage examples

Key requirements:

- HIPAA compliant with encryption everywhere
- No hardcoded credentials
- Proper backup and snapshot management
- Monitoring with CloudWatch alarms
- Flexible networking (can use existing or create new)
- Comprehensive tagging
- Production-ready with high availability

Let me start creating each file systematically.

### Answer

---

I'll create a comprehensive Terraform module for a production-ready RDS MySQL setup with HIPAA compliance. Let me break this down into the requested files:

## 1. versions.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}
```

## 2. providers.tf

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## 3. variables.tf

```hcl
# General Variables
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
}

variable "application" {
  description = "Application name"
  type        = string
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
}

# Networking Variables
variable "vpc_id" {
  description = "Existing VPC ID (if not provided, a new VPC will be created)"
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "List of existing private subnet IDs (if not provided, new subnets will be created)"
  type        = list(string)
  default     = []
}

variable "app_security_group_id" {
  description = "Security group ID of the application that will connect to the database"
  type        = string
}

# RDS Configuration Variables
variable "db_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
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

variable "storage_type" {
  description = "Storage type for RDS"
  type        = string
  default     = "gp3"
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
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

variable "enabled_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = ["error", "general", "slowquery"]
}

# Monitoring Variables
variable "sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms (if not provided, a new topic will be created)"
  type        = string
  default     = null
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilization threshold for alarm (percentage)"
  type        = number
  default     = 20
}

variable "storage_alarm_threshold" {
  description = "Free storage space threshold for alarm (in bytes)"
  type        = number
  default     = 10737418240 # 10GB
}

variable "connection_alarm_threshold" {
  description = "Database connections threshold for alarm"
  type        = number
  default     = 80
}

# Snapshot Lambda Variables
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

# Tagging Variables
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## 4. main.tf

```hcl
# Local variables for tagging
locals {
  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Application = var.application
      Owner       = var.owner
      ManagedBy   = "Terraform"
      Compliance  = "HIPAA"
    }
  )

  create_vpc = var.vpc_id == null
  vpc_id     = local.create_vpc ? aws_vpc.main[0].id : var.vpc_id
  subnet_ids = local.create_vpc ? [aws_subnet.private_a[0].id, aws_subnet.private_b[0].id] : var.private_subnet_ids
}

# VPC (conditionally created)
resource "aws_vpc" "main" {
  count = local.create_vpc ? 1 : 0

  cidr_block           = "10.0.10.0/24"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-vpc"
  })
}

# Private Subnets
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private_a" {
  count = local.create_vpc ? 1 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.10.0/25"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-private-subnet-a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_b" {
  count = local.create_vpc ? 1 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.10.128/25"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.tags, {
    Name = "${var.environment}-${var.application}-private-subnet-b"
    Type = "Private"
  })
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.db_identifier}-subnet-group"
  subnet_ids = local.subnet_ids

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-subnet-group"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.db_identifier}-sg"
  description = "Security group for RDS MySQL instance"
  vpc_id      = local.vpc_id

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-sg"
  })
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = var.app_security_group_id
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

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.db_identifier}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Generate random password
resource "random_password" "master" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.db_identifier}-master-password"
  description             = "Master password for RDS MySQL instance"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 30

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-master-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.master.result
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "rds_logs" {
  for_each = toset(var.enabled_cloudwatch_logs_exports)

  name              = "/aws/rds/instance/${var.db_identifier}/${each.key}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = var.db_identifier
  db_name        = var.db_name
  engine         = "mysql"
  engine_version = var.engine_version

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id            = aws_kms_key.rds.arn

  username = var.db_username
  password = random_password.master.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az               = var.multi_az
  publicly_accessible    = false
  deletion_protection    = var.deletion_protection
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.db_identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports
  iam_database_authentication_enabled = var.enable_iam_auth

  tags = merge(local.tags, {
    Name = var.db_identifier
  })

  depends_on = [
    aws_cloudwatch_log_group.rds_logs
  ]
}

# SNS Topic for alarms (conditionally created)
resource "aws_sns_topic" "alarms" {
  count = var.sns_topic_arn == null ? 1 : 0

  name              = "${var.db_identifier}-alarms"
  kms_master_key_id = aws_kms_key.rds.id

  tags = merge(local.tags, {
    Name = "${var.db_identifier}-alarms"
  })
}

locals {
  sns_topic_arn = var.sns_topic_arn != null ? var.sns_topic_arn : aws_sns_topic.alarms[0].arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.db_identifier}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [local.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "freeable_memory" {
  alarm_name          = "${var.db_identifier}-low-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold * 1024 * 1024 * 1024 # Convert GB to bytes
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = [local.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${var.db_identifier}-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.storage_alarm_threshold
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [local.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.db_identifier}-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.connection_alarm_threshold
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [local.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.tags
}

# Lambda function for snapshot management
data "archive_file" "lambda_snapshot" {
  type        = "zip"
  source_file = "${path.module}/lambda/snapshot.py"
  output_path = "${path.module}/lambda_snapshot.zip"
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_snapshot" {
  name = "${var.db_identifier}-snapshot-lambda-role"

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
  name = "${var.db_identifier}-snapshot-lambda-policy"
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

# Lambda function
resource "aws_lambda_function" "snapshot" {
  filename         = data.archive_file.lambda_snapshot.output_path
  function_name    = "${var.db_identifier}-snapshot-manager"
  role            = aws_iam_role.lambda_snapshot.arn
  handler         = "snapshot.handler"
  source_code_hash = data.archive_file.lambda_snapshot.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = 60

  environment {
    variables = {
      DB_INSTANCE_IDENTIFIER = aws_db_instance.main.id
      RETENTION_DAYS        = var.snapshot_retention_days
    }
  }

  tags = local.tags
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_snapshot" {
  name              = "/aws/lambda/${aws_lambda_function.snapshot.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.rds.arn

  tags = local.tags
}

# EventBridge rule for daily snapshots
resource "aws_cloudwatch_event_rule" "daily_snapshot" {
  name                = "${var.db_identifier}-daily-snapshot"
  description         = "Trigger daily RDS snapshot"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily

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
```

## 5. parameter-group.tf

```hcl
resource "aws_db_parameter_group" "main" {
  name   = "${var.db_identifier}-params"
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
    Name = "${var.db_identifier}-parameter-group"
  })
}
```

## 6. outputs.tf

```hcl
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
  description = "The RDS instance ID"
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
    for k, v in aws_cloudwatch_log_group.rds_logs : k => v.name
  }
}

output "secret_arn" {
  description = "The ARN of the Secrets Manager secret containing the database password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alarms"
  value       = local.sns_topic_arn
}

output "lambda_function_name" {
  description = "The name of the Lambda function for snapshot management"
  value       = aws_lambda_function.snapshot.function_name
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = local.vpc_id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = local.subnet_ids
}
```

## 7. lambda/snapshot.py

```python
import boto3
import os
from datetime import datetime, timedelta
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 clients
rds = boto3.client('rds')

def handler(event, context):
    """
    Lambda handler for creating daily RDS snapshots and cleaning up old ones
    """
    try:
        # Get environment variables
        db_instance_identifier = os.environ['DB_INSTANCE_IDENTIFIER']
        retention_days = int(os.environ.get('RETENTION_DAYS', 30))

        # Create snapshot
        snapshot_id = create_snapshot(db_instance_identifier)
        logger.info(f"Successfully created snapshot: {snapshot_id}")

        # Clean up old snapshots
        deleted_count = cleanup_old_snapshots(db_instance_identifier, retention_days)
        logger.info(f"Deleted {deleted_count} old snapshots")

        return {
            'statusCode': 200,
            'body': {
                'message': 'Snapshot management completed successfully',
                'snapshot_created': snapshot_id,
                'snapshots_deleted': deleted_count
            }
        }

    except Exception as e:
        logger.error(f"Error in snapshot management: {str(e)}")
        raise


def create_snapshot(db_instance_identifier):
    """
    Create a manual snapshot of the RDS instance
    """
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    snapshot_id = f"{db_instance_identifier}-manual-{timestamp}"

    try:
        # Create the snapshot
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_identifier
        )

        # Add tags to the snapshot
        snapshot_arn = response['DBSnapshot']['DBSnapshotArn']
        rds.add_tags_to_resource(
            ResourceName=snapshot_arn,
            Tags=[
                {
                    'Key': 'Type',
                    'Value': 'Manual'
                },
                {
                    'Key': 'CreatedBy',
                    'Value': 'Lambda-SnapshotManager'
                },
                {
                    'Key': 'CreatedDate',
                    'Value': datetime.now().strftime('%Y-%m-%d')
                }
            ]
        )

        return snapshot_id

    except Exception as e:
        logger.error(f"Error creating snapshot: {str(e)}")
        raise


def cleanup_old_snapshots(db_instance_identifier, retention_days):
    """
    Delete manual snapshots older than retention_days
    """
    deleted_count = 0
    cutoff_date = datetime.now() - timedelta(days=retention_days)

    try:
        # Get all snapshots for the instance
        paginator = rds.get_paginator('describe_db_snapshots')

        for page in paginator.paginate(
            DBInstanceIdentifier=db_instance_identifier,
            SnapshotType='manual',
            IncludeShared=False,
            IncludePublic=False
        ):
            for snapshot in page['DBSnapshots']:
                snapshot_id = snapshot['DBSnapshotIdentifier']

                # Skip if snapshot doesn't match our naming pattern
                if not snapshot_id.startswith(f"{db_instance_identifier}-manual-"):
                    continue

                # Check if snapshot is older than retention period
                create_time = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                if create_time < cutoff_date.replace(tzinfo=None):
                    try:
                        logger.info(f"Deleting old snapshot: {snapshot_id} (created: {create_time})")
                        rds.delete_db_snapshot(DBSnapshotIdentifier=snapshot_id)
                        deleted_count += 1
                    except Exception as e:
                        logger.error(f"Error deleting snapshot {snapshot_id}: {str(e)}")
                        continue

        return deleted_count

    except Exception as e:
        logger.error(f"Error listing/deleting snapshots: {str(e)}")
        raise


def get_db_instance_info(db_instance_identifier):
    """
    Get information about the RDS instance
    """
    try:
        response = rds.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )
        return response['DBInstances'][0]
    except Exception as e:
        logger.error(f"Error describing DB instance: {str(e)}")
        raise
```

## 8. README.md

````markdown
# RDS MySQL Module for Healthcare Application

This Terraform module creates a production-ready, HIPAA-compliant RDS MySQL database with comprehensive security, monitoring, and backup features.

## Features

- **Security & Compliance**
  - KMS encryption for database, backups, and snapshots
  - Password stored in AWS Secrets Manager
  - SSL/TLS enforced connections
  - Private subnets only (no public access)
  - HIPAA compliance tags

- **High Availability**
  - Multi-AZ deployment
  - Automated backups with 7-day retention
  - Daily manual snapshots via Lambda
  - Auto-scaling storage (GP3)

- **Monitoring**
  - CloudWatch alarms for CPU, memory, storage, and connections
  - Database logs exported to CloudWatch (error, general, slow query)
  - SNS notifications for all alarms

- **Automation**
  - Lambda function for daily snapshots
  - Automatic cleanup of old snapshots
  - EventBridge scheduled triggers

## Usage

### Basic Example

```hcl
module "rds_mysql" {
  source = "./path-to-module"

  # General settings
  environment = "production"
  application = "healthcare-app"
  owner       = "devops-team"

  # Database configuration
  db_identifier = "healthcare-prod-db"
  db_name      = "patient_records"

  # Networking - using existing VPC
  vpc_id                = "vpc-12345678"
  private_subnet_ids    = ["subnet-111111", "subnet-222222"]
  app_security_group_id = "sg-app12345"

  # Monitoring
  sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:db-alerts"

  # Tags
  common_tags = {
    Project     = "Healthcare Platform"
    CostCenter  = "IT-001"
  }
}
```
````

### Complete Example with Custom Settings

```hcl
module "rds_mysql" {
  source = "./path-to-module"

  # General settings
  aws_region  = "us-east-1"
  environment = "production"
  application = "healthcare-app"
  owner       = "devops-team"

  # Database configuration
  db_identifier         = "healthcare-prod-db"
  db_name              = "patient_records"
  db_username          = "dbadmin"
  instance_class       = "db.m5.xlarge"
  engine_version       = "8.0.35"
  allocated_storage    = 200
  max_allocated_storage = 2000

  # Security
  enable_iam_auth = true

  # If not providing existing VPC, module will create one
  app_security_group_id = aws_security_group.app.id

  # Backup settings
  backup_retention_period = 14
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"
  snapshot_retention_days = 60

  # Monitoring thresholds
  cpu_alarm_threshold        = 75
  memory_alarm_threshold     = 25
  storage_alarm_threshold    = 21474836480  # 20GB
  connection_alarm_threshold = 100

  # Tags
  common_tags = {
    Project     = "Healthcare Platform"
    CostCenter  = "IT-001"
    DataClass   = "PHI"
  }
}
```

## Variables

| Name                      | Description                                   | Type           | Default           | Required |
| ------------------------- | --------------------------------------------- | -------------- | ----------------- | -------- |
| `environment`             | Environment name                              | `string`       | n/a               | yes      |
| `application`             | Application name                              | `string`       | n/a               | yes      |
| `owner`                   | Owner of resources                            | `string`       | n/a               | yes      |
| `db_identifier`           | RDS instance identifier                       | `string`       | n/a               | yes      |
| `app_security_group_id`   | Security group ID of application              | `string`       | n/a               | yes      |
| `aws_region`              | AWS region                                    | `string`       | `"us-east-1"`     | no       |
| `vpc_id`                  | Existing VPC ID (creates new if not provided) | `string`       | `null`            | no       |
| `private_subnet_ids`      | Existing subnet IDs                           | `list(string)` | `[]`              | no       |
| `db_name`                 | Database name                                 | `string`       | `"healthcare_db"` | no       |
| `db_username`             | Master username                               | `string`       | `"admin"`         | no       |
| `instance_class`          | RDS instance type                             | `string`       | `"db.m5.large"`   | no       |
| `engine_version`          | MySQL version                                 | `string`       | `"8.0"`           | no       |
| `allocated_storage`       | Initial storage (GB)                          | `number`       | `100`             | no       |
| `max_allocated_storage`   | Max storage for autoscaling (GB)              | `number`       | `1000`            | no       |
| `multi_az`                | Enable Multi-AZ                               | `bool`         | `true`            | no       |
| `deletion_protection`     | Enable deletion protection                    | `bool`         | `true`            | no       |
| `backup_retention_period` | Backup retention (days)                       | `number`       | `7`               | no       |
| `snapshot_retention_days` | Manual snapshot retention (days)              | `number`       | `30`              | no       |
| `enable_iam_auth`         | Enable IAM authentication                     | `bool`         | `false`           | no       |
| `sns_topic_arn`           | SNS topic for alarms                          | `string`       | `null`            | no       |

## Outputs

| Name                    | Description                |
| ----------------------- | -------------------------- |
| `db_instance_endpoint`  | RDS connection endpoint    |
| `db_instance_port`      | Database port              |
| `db_security_group_id`  | Security group ID          |
| `kms_key_arn`           | KMS key ARN                |
| `secret_arn`            | Secrets Manager secret ARN |
| `cloudwatch_log_groups` | CloudWatch log group names |

## Deployment Steps

1. **Prerequisites**
   - AWS CLI configured with appropriate credentials
   - Terraform >= 1.5 installed
   - Application security group created

2. **Initialize Terraform**

   ```bash
   terraform init
   ```

3. **Create terraform.tfvars**

   ```hcl
   environment           = "production"
   application          = "healthcare"
   owner                = "devops@company.com"
   db_identifier        = "healthcare-prod-mysql"
   app_security_group_id = "sg-0123456789abcdef0"
   ```

4. **Plan and Apply**

   ```bash
   terraform plan
   terraform apply
   ```

5. **Post-Deployment**
   - Update application configuration with RDS endpoint
   - Configure SNS topic subscriptions for alarm notifications
   - Test database connectivity
   - Verify CloudWatch logs and alarms

## HIPAA Compliance Notes

This module implements several HIPAA-required security controls:

1. **Encryption**
   - Data encrypted at rest using KMS customer-managed keys
   - Encrypted backups and snapshots
   - TLS/SSL enforced for data in transit

2. **Access Control**
   - Database in private subnets only
   - Security groups restrict access to authorized applications
   - Optional IAM database authentication
   - Secrets Manager for credential management

3. **Audit & Monitoring**
   - All database logs exported to CloudWatch
   - CloudWatch alarms for resource monitoring
   - Lambda function logs for snapshot operations
   - Comprehensive tagging for resource tracking

4. **Backup & Recovery**
   - Automated daily backups (7-day retention)
   - Additional manual snapshots (30-day default retention)
   - Multi-AZ for high availability
   - Deletion protection enabled

5. **Maintenance**
   - Defined maintenance windows
   - Auto-minor version upgrade capability
   - Regular security patching

## Important Notes

- Always test in a non-production environment first
- Review and adjust alarm thresholds based on your workload
- Ensure SNS topic has appropriate subscribers
- Monitor AWS costs, especially for storage and snapshots
- Regularly review CloudWatch logs for security events
- Keep Terraform state file secure and encrypted
- Enable AWS Config for compliance tracking

## Example Production terraform.tfvars

```hcl
# terraform.tfvars for production
aws_region  = "us-east-1"
environment = "production"
application = "healthcare-portal"
owner       = "platform-team@healthcare.com"

# Database
db_identifier  = "healthcare-prod-mysql-001"
db_name        = "patient_management"
instance_class = "db.m5.xlarge"
engine_version = "8.0.35"

# Storage
allocated_storage     = 500
max_allocated_storage = 3000

# Networking (assuming existing infrastructure)
vpc_id                = "vpc-prod12345"
private_subnet_ids    = ["subnet-priv1a", "subnet-priv1b"]
app_security_group_id = "sg-app-prod123"

# High Availability
multi_az            = true
deletion_protection = true

# Backups
backup_retention_period = 30
backup_window          = "03:00-04:00"
maintenance_window     = "sun:04:00-sun:05:00"
snapshot_retention_days = 90

# Monitoring
sns_topic_arn              = "arn:aws:sns:us-east-1:123456789012:healthcare-prod-alerts"
cpu_alarm_threshold        = 70
memory_alarm_threshold     = 30
storage_alarm_threshold    = 53687091200  # 50GB
connection_alarm_threshold = 150

# Security
enable_iam_auth = true

# Tags
common_tags = {
  Project            = "Healthcare Portal"
  CostCenter         = "IT-Healthcare"
  DataClassification = "PHI-Sensitive"
  BackupPolicy       = "Daily"
  MaintenanceWindow  = "Sunday-0400-0500-UTC"
}
```

```

This comprehensive Terraform module provides:

1. **Complete Infrastructure**: VPC, subnets, security groups, KMS, RDS, monitoring, and automation
2. **Security Best Practices**: Encryption everywhere, no hardcoded passwords, private networking
3. **HIPAA Compliance**: All required controls for healthcare data
4. **Operational Excellence**: Monitoring, alerting, automated backups, and maintenance
5. **Flexibility**: Can use existing VPC/subnets or create new ones
6. **Documentation**: Clear README with examples and compliance notes

The module is production-ready and follows AWS best practices for running critical healthcare workloads.
```
