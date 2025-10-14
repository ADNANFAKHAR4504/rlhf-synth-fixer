I'll create a comprehensive credential management system for your banking application that meets all the specified requirements. Let me provide each component:

```hcl
# tap_stack.tf

# KMS Key for encryption
resource "aws_kms_key" "secrets_key" {
  description             = "KMS key for Secrets Manager encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.project_name}-secrets-key"
    Environment = var.environment
    Compliance  = "Banking"
  }
}

resource "aws_kms_alias" "secrets_key_alias" {
  name          = "alias/${var.project_name}-secrets"
  target_key_id = aws_kms_key.secrets_key.key_id
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = var.private_subnet_ids
  
  tags = {
    Name        = "${var.project_name}-db-subnet"
    Environment = var.environment
  }
}

# RDS Parameter Group for MySQL
resource "aws_db_parameter_group" "mysql" {
  family = "mysql8.0"
  name   = "${var.project_name}-mysql-params"
  
  parameter {
    name  = "general_log"
    value = "1"
  }
  
  parameter {
    name  = "slow_query_log"
    value = "1"
  }
  
  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }
}

# RDS MySQL Instance with IAM Authentication
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-mysql"
  engine         = "mysql"
  engine_version = var.mysql_version
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.secrets_key.arn
  
  db_name  = var.db_name
  username = "admin"
  password = aws_secretsmanager_secret_version.rds_master_password.secret_string
  
  iam_database_authentication_enabled = true
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.mysql.name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-mysql-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = {
    Name        = "${var.project_name}-mysql"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS MySQL"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

# Master Password Secret
resource "aws_secretsmanager_secret" "rds_master_password" {
  name_prefix             = "${var.project_name}-rds-master-"
  description             = "Master password for RDS MySQL"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets_key.arn
  
  tags = {
    Name = "${var.project_name}-rds-master-password"
  }
}

resource "aws_secretsmanager_secret_version" "rds_master_password" {
  secret_id     = aws_secretsmanager_secret.rds_master_password.id
  secret_string = random_password.rds_master_password.result
}

resource "random_password" "rds_master_password" {
  length  = 32
  special = true
}

# Template Secret for User Credentials
resource "aws_secretsmanager_secret" "user_credential_template" {
  name_prefix             = "${var.project_name}-user-cred-template-"
  description             = "Template for user credentials with rotation"
  kms_key_id              = aws_kms_key.secrets_key.arn
  recovery_window_in_days = 0
  
  rotation_rules {
    automatically_after_days = var.rotation_days
  }
  
  tags = {
    Name     = "${var.project_name}-user-credential-template"
    Template = "true"
  }
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_rotation" {
  name = "${var.project_name}-lambda-rotation-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Lambda Rotation Policy
resource "aws_iam_role_policy" "lambda_rotation" {
  name = "${var.project_name}-lambda-rotation-policy"
  role = aws_iam_role.lambda_rotation.id
  
  policy = file("${path.module}/iam-policies.json")
}

# VPC Lambda Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_rotation.name
}

# Lambda Layer for MySQL
resource "aws_lambda_layer_version" "pymysql" {
  filename            = "${path.module}/layers/pymysql.zip"
  layer_name          = "${var.project_name}-pymysql"
  compatible_runtimes = ["python3.9"]
  
  lifecycle {
    create_before_destroy = true
  }
}

# Lambda Rotation Function
resource "aws_lambda_function" "rotation" {
  filename         = "${path.module}/lambda/rotation-function.zip"
  function_name    = "${var.project_name}-credential-rotation"
  role            = aws_iam_role.lambda_rotation.arn
  handler         = "rotation-function.lambda_handler"
  runtime         = "python3.9"
  timeout         = 60
  memory_size     = 512
  
  layers = [aws_lambda_layer_version.pymysql.arn]
  
  environment {
    variables = {
      RDS_ENDPOINT          = aws_db_instance.main.endpoint
      RDS_DATABASE          = var.db_name
      MASTER_SECRET_ARN     = aws_secretsmanager_secret.rds_master_password.arn
      KMS_KEY_ID           = aws_kms_key.secrets_key.id
      MAX_RETRY_ATTEMPTS   = var.max_retry_attempts
      ROTATION_ENABLED     = "true"
    }
  }
  
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = {
    Name        = "${var.project_name}-credential-rotation"
    Environment = var.environment
  }
}

# Dead Letter Queue for Lambda
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-rotation-dlq"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600
  receive_wait_time_seconds = 0
  kms_master_key_id        = aws_kms_key.secrets_key.id
  
  tags = {
    Name = "${var.project_name}-rotation-dlq"
  }
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "rotation" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# EventBridge Rule for Rotation Monitoring
resource "aws_cloudwatch_event_rule" "rotation_events" {
  name        = "${var.project_name}-rotation-events"
  description = "Capture rotation events from Secrets Manager"
  
  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "RotateSecret",
        "CreateSecret",
        "UpdateSecret",
        "RestoreSecret"
      ]
    }
  })
}

# EventBridge Target for CloudWatch Logs
resource "aws_cloudwatch_event_target" "rotation_logs" {
  rule      = aws_cloudwatch_event_rule.rotation_events.name
  target_id = "rotation-logs"
  arn       = aws_cloudwatch_log_group.rotation_events.arn
}

# CloudWatch Log Group for Rotation Events
resource "aws_cloudwatch_log_group" "rotation_events" {
  name              = "/aws/events/${var.project_name}-rotation"
  retention_in_days = 90
  kms_key_id       = aws_kms_key.secrets_key.arn
}

# CloudTrail for Audit
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-audit-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::SecretsManager::Secret"
      values = ["arn:aws:secretsmanager:*:*:secret:*"]
    }
  }
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::RDS::DBCluster"
      values = ["arn:aws:rds:*:*:cluster:*"]
    }
  }
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket_prefix = "${var.project_name}-audit-trail-"
  
  tags = {
    Name = "${var.project_name}-cloudtrail"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.secrets_key.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    id     = "archive-old-logs"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.secrets_key.arn
          }
        }
      }
    ]
  })
}

# CloudWatch Metrics
resource "aws_cloudwatch_metric_alarm" "rotation_failures" {
  alarm_name          = "${var.project_name}-rotation-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.rotation_failure_threshold
  alarm_description   = "This metric monitors rotation failures"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.rotation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "rotation_duration" {
  alarm_name          = "${var.project_name}-rotation-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rotation_duration_threshold
  alarm_description   = "This metric monitors rotation duration"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.rotation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_name}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-rotation-alerts"
  kms_master_key_id = aws_kms_key.secrets_key.id
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "rotation" {
  dashboard_name = "${var.project_name}-rotation-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }],
            [".", "Duration", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Rotation Metrics"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SecretsManager", "UserAccessToSecret", { stat = "Sum" }],
            [".", "UserAccessToSecretDenied", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Secrets Access Metrics"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# Outputs
output "secrets_manager_template_arn" {
  value       = aws_secretsmanager_secret.user_credential_template.arn
  description = "ARN of the template secret for user credentials"
}

output "lambda_function_name" {
  value       = aws_lambda_function.rotation.function_name
  description = "Name of the rotation Lambda function"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
}

output "cloudwatch_dashboard_url" {
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.rotation.dashboard_name}"
  description = "CloudWatch dashboard URL"
}

output "kms_key_id" {
  value       = aws_kms_key.secrets_key.id
  description = "KMS key ID for encryption"
}

output "cloudtrail_name" {
  value       = aws_cloudtrail.main.name
  description = "CloudTrail name for audit logging"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for alerts"
}
```

```hcl
# variables.tf

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "banking-creds"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "VPC ID for resources"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS and Lambda"
  type        = list(string)
}

# RDS Configuration
variable "mysql_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling"
  type        = number
  default     = 1000
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "banking"
}

# Rotation Configuration
variable "rotation_days" {
  description = "Number of days between automatic rotations"
  type        = number
  default     = 30
}

variable "max_retry_attempts" {
  description = "Maximum retry attempts for rotation"
  type        = string
  default     = "3"
}

# Alert Configuration
variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "rotation_failure_threshold" {
  description = "Threshold for rotation failure alerts"
  type        = number
  default     = 1
}

variable "rotation_duration_threshold" {
  description = "Threshold for rotation duration alerts (milliseconds)"
  type        = number
  default     = 30000
}
```

```hcl
# provider.tf

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Compliance  = "Banking"
    }
  }
}
```

```python
# lambda/rotation-function.py

import json
import logging
import os
import time
import boto3
import pymysql
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
RDS_ENDPOINT = os.environ['RDS_ENDPOINT']
RDS_DATABASE = os.environ['RDS_DATABASE']
MASTER_SECRET_ARN = os.environ['MASTER_SECRET_ARN']
MAX_RETRY_ATTEMPTS = int(os.environ.get('MAX_RETRY_ATTEMPTS', 3))


class RotationError(Exception):
    """Custom exception for rotation errors"""
    pass


def lambda_handler(event, context):
    """Main handler for credential rotation"""
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    logger.info(f"Starting rotation for secret {arn} with step {step}")
    
    # Send metrics
    send_metric('RotationAttempts', 1, {'Step': step})
    
    try:
        if step == "createSecret":
            create_secret(arn, token)
        elif step == "setSecret":
            set_secret(arn, token)
        elif step == "testSecret":
            test_secret(arn, token)
        elif step == "finishSecret":
            finish_secret(arn, token)
        else:
            raise RotationError(f"Invalid step: {step}")
            
        logger.info(f"Successfully completed step {step}")
        send_metric('RotationSuccess', 1, {'Step': step})
        
    except Exception as e:
        logger.error(f"Rotation failed at step {step}: {str(e)}")
        send_metric('RotationFailures', 1, {'Step': step})
        
        # Attempt rollback for critical steps
        if step in ['setSecret', 'testSecret']:
            try:
                rollback_secret(arn, token)
            except Exception as rollback_error:
                logger.error(f"Rollback failed: {str(rollback_error)}")
        
        raise


def create_secret(arn, token):
    """Create a new secret version with generated password"""
    metadata = secrets_client.describe_secret(SecretId=arn)
    
    # Check if version already exists
    if token in metadata.get('VersionIdsToStages', {}):
        logger.info(f"Version {token} already exists")
        return
    
    # Get current secret
    current_secret = get_secret_value(arn, "AWSCURRENT")
    
    # Generate new password
    new_password = generate_password()
    
    # Create new secret version
    new_secret = current_secret.copy()
    new_secret['password'] = new_password
    new_secret['rotation_timestamp'] = int(time.time())
    
    secrets_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(new_secret),
        VersionStages=['AWSPENDING']
    )
    
    logger.info(f"Created new secret version {token}")


def set_secret(arn, token):
    """Set the new password in the database"""
    pending_secret = get_secret_value(arn, "AWSPENDING", token)
    current_secret = get_secret_value(arn, "AWSCURRENT")
    master_secret = get_secret_value(MASTER_SECRET_ARN, "AWSCURRENT")
    
    # Connect to database with master credentials
    connection = None
    retry_count = 0
    
    while retry_count < MAX_RETRY_ATTEMPTS:
        try:
            connection = create_db_connection(master_secret)
            
            with connection.cursor() as cursor:
                # Update user password
                username = pending_secret['username']
                new_password = pending_secret['password']
                
                # Use MySQL 8.0 syntax for password update
                cursor.execute(
                    "ALTER USER %s@'%%' IDENTIFIED BY %s",
                    (username, new_password)
                )
                connection.commit()
                
                # Grant necessary privileges if needed
                cursor.execute(
                    "GRANT SELECT, INSERT, UPDATE, DELETE ON %s.* TO %s@'%%'",
                    (RDS_DATABASE, username)
                )
                connection.commit()
                
            logger.info(f"Successfully set new password for user {username}")
            break
            
        except pymysql.Error as e:
            retry_count += 1
            logger.warning(f"Database error (attempt {retry_count}/{MAX_RETRY_ATTEMPTS}): {str(e)}")
            
            if retry_count >= MAX_RETRY_ATTEMPTS:
                raise RotationError(f"Failed to set password after {MAX_RETRY_ATTEMPTS} attempts")
            
            time.sleep(2 ** retry_count)  # Exponential backoff
            
        finally:
            if connection:
                connection.close()


def test_secret(arn, token):
    """Test the new credentials"""
    pending_secret = get_secret_value(arn, "AWSPENDING", token)
    
    # Test connection with new credentials
    connection = None
    try:
        connection = create_db_connection(pending_secret)
        
        with connection.cursor() as cursor:
            # Test basic query
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            
            if result[0] != 1:
                raise RotationError("Connection test failed")
            
            # Test database access
            cursor.execute(f"USE {RDS_DATABASE}")
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables")
            
        logger.info("Successfully tested new credentials")
        
    except pymysql.Error as e:
        raise RotationError(f"Failed to test new credentials: {str(e)}")
        
    finally:
        if connection:
            connection.close()


def finish_secret(arn, token):
    """Finish the rotation by promoting the pending version"""
    metadata = secrets_client.describe_secret(SecretId=arn)
    current_version = None
    
    for version in metadata.get('VersionIdsToStages', {}):
        if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:
            current_version = version
            break
    
    # Update version stages
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    
    logger.info(f"Rotation completed successfully for {arn}")


def rollback_secret(arn, token):
    """Rollback to previous version in case of failure"""
    logger.info(f"Attempting rollback for secret {arn}")
    
    try:
        # Get current secret
        current_secret = get_secret_value(arn, "AWSCURRENT")
        master_secret = get_secret_value(MASTER_SECRET_ARN, "AWSCURRENT")
        
        # Restore previous password
        connection = create_db_connection(master_secret)
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "ALTER USER %s@'%%' IDENTIFIED BY %s",
                    (current_secret['username'], current_secret['password'])
                )
                connection.commit()
                
            logger.info("Successfully rolled back to previous password")
            send_metric('RotationRollbacks', 1)
            
        finally:
            connection.close()
            
    except Exception as e:
        logger.error(f"Rollback failed: {str(e)}")
        send_metric('RotationRollbackFailures', 1)
        raise


def get_secret_value(arn, stage, token=None):
    """Retrieve secret value from Secrets Manager"""
    try:
        kwargs = {'SecretId': arn}
        if token:
            kwargs['VersionId'] = token
        else:
            kwargs['VersionStage'] = stage
            
        response = secrets_client.get_secret_value(**kwargs)
        return json.loads(response['SecretString'])
        
    except ClientError as e:
        raise RotationError(f"Failed to retrieve secret: {str(e)}")


def create_db_connection(secret):
    """Create database connection"""
    host = RDS_ENDPOINT.split(':')[0]
    port = int(RDS_ENDPOINT.split(':')[1]) if ':' in RDS_ENDPOINT else 3306
    
    return pymysql.connect(
        host=host,
        port=port,
        user=secret['username'],
        password=secret['password'],
        database=RDS_DATABASE,
        connect_timeout=10,
        read_timeout=10,
        write_timeout=10,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        ssl={'ssl': True}
    )


def generate_password():
    """Generate a strong password"""
    response = secrets_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )
    return response['RandomPassword']


def send_metric(metric_name, value, dimensions=None):
    """Send custom metric to CloudWatch"""
    try:
        metric_data = {
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count',
            'Timestamp': time.time()
        }
        
        if dimensions:
            metric_data['Dimensions'] = [
                {'Name': k, 'Value': v} for k, v in dimensions.items()
            ]
        
        cloudwatch.put_metric_data(
            Namespace='CredentialRotation',
            MetricData=[metric_data]
        )
    except Exception as e:
        logger.warning(f"Failed to send metric: {str(e)}")
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecretVersionStage",
        "secretsmanager:GetRandomPassword"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:banking-creds-*"
      ]
    },
    {
      "Sid": "KMSDecryptAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey",
        "kms:GenerateDataKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": [
            "secretsmanager.*.amazonaws.com"
          ]
        }
      }
    },
    {
      "Sid": "RDSDescribeAccess",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": "CredentialRotation"
        }
      }
    },
    {
      "Sid": "XRayTracing",
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SQSAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:banking-creds-rotation-dlq"
    }
  ]
}
```

This comprehensive solution provides:

1. **Secure Credential Storage**: Using AWS Secrets Manager with KMS encryption
2. **Automated Rotation**: Lambda function with retry logic and rollback capabilities
3. **High-Scale Support**: Designed to handle 100,000+ daily users with minimal disruption
4. **Compliance**: Full CloudTrail auditing, encryption at rest and in transit
5. **Monitoring**: CloudWatch metrics, alarms, and dashboard for real-time visibility
6. **Least Privilege**: IAM policies restrict access to only necessary resources
7. **Error Handling**: DLQ for failed rotations and automatic rollback mechanism
8. **Banking Standards**: Meets security requirements with encryption, audit trails, and monitoring

The system automatically rotates credentials based on the configured schedule, monitors for failures, and alerts on any issues while maintaining a complete audit trail for compliance.