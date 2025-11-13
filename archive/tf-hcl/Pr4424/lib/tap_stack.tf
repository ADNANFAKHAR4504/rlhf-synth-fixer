# tap_stack.tf

# Data source for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Create VPC if not provided
resource "aws_vpc" "main" {
  count = var.vpc_id == "" ? 1 : 0
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Create private subnets if not provided
resource "aws_subnet" "private" {
  count = var.vpc_id == "" ? 2 : 0
  
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables for VPC and subnet IDs
locals {
  vpc_id             = var.vpc_id != "" ? var.vpc_id : aws_vpc.main[0].id
  private_subnet_ids = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids : aws_subnet.private[*].id
}

# KMS Key for encryption
resource "aws_kms_key" "secrets_key" {
  description             = "KMS key for Secrets Manager encryption"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow Secrets Manager"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
  
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
  subnet_ids = local.private_subnet_ids
  
  tags = {
    Name        = "${var.project_name}-db-subnet"
    Environment = var.environment
  }
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${var.project_name}-mysql"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.secrets_key.arn
  
  tags = {
    Name        = "${var.project_name}-rds-logs"
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
  
  tags = {
    Name        = "${var.project_name}-mysql-params"
    Environment = var.environment
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
  storage_type          = "gp3"
  
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
  
  performance_insights_enabled    = var.enable_performance_insights
  performance_insights_kms_key_id = var.enable_performance_insights ? aws_kms_key.secrets_key.arn : null
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null
  
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-mysql-final-snapshot"
  
  copy_tags_to_snapshot = true
  auto_minor_version_upgrade = false
  
  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      password
    ]
  }
  
  tags = {
    Name        = "${var.project_name}-mysql"
    Environment = var.environment
  }
  
  depends_on = [aws_cloudwatch_log_group.rds_logs]
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS MySQL"
  vpc_id      = local.vpc_id
  
  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_lambda" {
  security_group_id            = aws_security_group.rds.id
  description                  = "Allow MySQL from Lambda"
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.lambda.id
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = local.vpc_id
  
  tags = {
    Name        = "${var.project_name}-lambda-sg"
    Environment = var.environment
  }
}

resource "aws_vpc_security_group_egress_rule" "lambda_to_rds" {
  security_group_id            = aws_security_group.lambda.id
  description                  = "Allow outbound to RDS"
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.rds.id
}

resource "aws_vpc_security_group_egress_rule" "lambda_to_https" {
  security_group_id = aws_security_group.lambda.id
  description       = "Allow HTTPS for AWS API calls"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
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
  recovery_window_in_days = 7
  
  tags = {
    Name     = "${var.project_name}-user-credential-template"
    Template = "true"
  }
}

resource "aws_secretsmanager_secret_version" "user_credential_template" {
  secret_id = aws_secretsmanager_secret.user_credential_template.id
  secret_string = jsonencode({
    username = "template_user"
    password = "template_password_change_me"
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = 3306
    dbname   = var.db_name
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_rotation" "user_credential_template" {
  count = var.enable_rotation ? 1 : 0
  
  secret_id           = aws_secretsmanager_secret.user_credential_template.id
  rotation_lambda_arn = aws_lambda_function.rotation.arn
  
  rotation_rules {
    automatically_after_days = var.rotation_days
  }
  
  depends_on = [aws_lambda_permission.rotation]
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
  
  policy = templatefile("${path.module}/iam-policies.json", {
    region       = var.aws_region
    account_id   = data.aws_caller_identity.current.account_id
    project_name = var.project_name
    kms_key_arn  = aws_kms_key.secrets_key.arn
  })
}

# VPC Lambda Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_rotation.name
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_rotation" {
  name              = "/aws/lambda/${var.project_name}-credential-rotation"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.secrets_key.arn
  
  tags = {
    Name        = "${var.project_name}-lambda-rotation-logs"
    Environment = var.environment
  }
}

# Lambda deployment package
data "archive_file" "lambda_rotation" {
  type        = "zip"
  source_file = "${path.module}/lambda/rotation-function.py"
  output_path = "${path.module}/lambda/rotation-function.zip"
}

# Lambda Rotation Function
resource "aws_lambda_function" "rotation" {
  filename         = data.archive_file.lambda_rotation.output_path
  source_code_hash = data.archive_file.lambda_rotation.output_base64sha256
  function_name    = "${var.project_name}-credential-rotation"
  role            = aws_iam_role.lambda_rotation.arn
  handler         = "rotation-function.lambda_handler"
  runtime         = var.lambda_runtime
  timeout         = 60
  memory_size     = 512
  
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
    subnet_ids         = local.private_subnet_ids
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
  
  depends_on = [
    aws_cloudwatch_log_group.lambda_rotation,
    aws_iam_role_policy.lambda_rotation,
    aws_iam_role_policy_attachment.lambda_vpc
  ]
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

# VPC Endpoint for Secrets Manager
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "${var.project_name}-secretsmanager-endpoint"
    Environment = var.environment
  }
}

# VPC Endpoint for KMS
resource "aws_vpc_endpoint" "kms" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "${var.project_name}-kms-endpoint"
    Environment = var.environment
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = local.vpc_id
  
  tags = {
    Name        = "${var.project_name}-vpc-endpoints-sg"
    Environment = var.environment
  }
}

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_lambda" {
  security_group_id            = aws_security_group.vpc_endpoints.id
  description                  = "Allow HTTPS from Lambda"
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.lambda.id
}

# CloudWatch Log Group for Rotation Events
resource "aws_cloudwatch_log_group" "rotation_events" {
  name              = "/aws/events/${var.project_name}-rotation"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.secrets_key.arn
  
  tags = {
    Name        = "${var.project_name}-rotation-events-logs"
    Environment = var.environment
  }
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
  
  tags = {
    Name        = "${var.project_name}-rotation-events"
    Environment = var.environment
  }
}

# EventBridge Target for CloudWatch Logs
resource "aws_cloudwatch_event_target" "rotation_logs" {
  rule      = aws_cloudwatch_event_rule.rotation_events.name
  target_id = "rotation-logs"
  arn       = aws_cloudwatch_log_group.rotation_events.arn
  
  depends_on = [aws_cloudwatch_log_group.rotation_events]
}

# CloudWatch Log Resource Policy for EventBridge
resource "aws_cloudwatch_log_resource_policy" "eventbridge_logs" {
  policy_name = "${var.project_name}-eventbridge-logs-policy"
  
  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.rotation_events.arn}:*"
      }
    ]
  })
}

# EventBridge Scheduled Rule for Periodic Rotation Check
resource "aws_cloudwatch_event_rule" "rotation_schedule" {
  count = var.enable_rotation ? 1 : 0
  
  name                = "${var.project_name}-rotation-schedule"
  description         = "Scheduled rule to check for credentials needing rotation"
  schedule_expression = "rate(${var.rotation_check_frequency_hours} hours)"
  
  tags = {
    Name        = "${var.project_name}-rotation-schedule"
    Environment = var.environment
  }
}

# EventBridge Target for Scheduled Rotation
resource "aws_cloudwatch_event_target" "rotation_schedule" {
  count = var.enable_rotation ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.rotation_schedule[0].name
  target_id = "lambda-rotation"
  arn       = aws_lambda_function.rotation.arn
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "eventbridge" {
  count = var.enable_rotation ? 1 : 0
  
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rotation_schedule[0].arn
}

# CloudTrail for Audit
# Note: Disabled by default due to AWS account trail limit (max 5 trails per region)
# Set enable_cloudtrail = true if you have available trail capacity
resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name                          = "${var.project_name}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail[0].id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.secrets_key.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function:*"]
    }
  }
  
  tags = {
    Name        = "${var.project_name}-cloudtrail"
    Environment = var.environment
  }
  
  depends_on = [
    aws_s3_bucket_policy.cloudtrail,
    aws_s3_bucket_public_access_block.cloudtrail
  ]
}

# S3 Bucket for CloudTrail (conditional)
resource "aws_s3_bucket" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket_prefix = "${var.project_name}-audit-trail-"
  
  tags = {
    Name = "${var.project_name}-cloudtrail"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.secrets_key.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail[0].id
  
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
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.cloudtrail[0].id
  
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
        Resource = aws_s3_bucket.cloudtrail[0].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail[0].arn}/*"
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
  
  tags = {
    Name        = "${var.project_name}-rotation-alerts"
    Environment = var.environment
  }
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
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : "CloudTrail disabled - trail limit reached"
  description = "CloudTrail name for audit logging"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for alerts"
}