# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "Primary AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name for resource tagging"
  type        = string
  default     = "financial-app"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# VPC AND NETWORKING - PRIMARY REGION
# ============================================================================

resource "aws_vpc" "primary" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.app_name}-vpc-primary"
    Environment = var.environment
    Region      = var.aws_region
  }
}

resource "aws_subnet" "primary_private" {
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.app_name}-subnet-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

resource "aws_subnet" "primary_public" {
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-subnet-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name        = "${var.app_name}-igw-primary"
    Environment = var.environment
  }
}

resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "${var.app_name}-rt-public"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "primary_public" {
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.app_name}-eip-nat"
    Environment = var.environment
    Purpose     = "NAT Gateway"
  }
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.primary.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.app_name}-lambda-sg"
    Environment = var.environment
  }
}

# ============================================================================
# S3 BUCKETS - PRIMARY AND SECONDARY REGIONS
# ============================================================================

resource "aws_s3_bucket" "primary_data" {
  bucket = "${var.app_name}-data-${var.aws_region}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.app_name}-data-primary"
    Environment = var.environment
    Region      = var.aws_region
  }
}

resource "aws_s3_bucket_versioning" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket" "cloudformation_templates" {
  bucket = "${var.app_name}-cfn-templates-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.app_name}-cfn-templates"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "cloudformation_templates" {
  bucket = aws_s3_bucket.cloudformation_templates.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudformation_templates" {
  bucket = aws_s3_bucket.cloudformation_templates.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda_failover" {
  name              = "/aws/lambda/${var.app_name}-failover"
  retention_in_days = 7

  tags = {
    Name        = "${var.app_name}-lambda-failover-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.app_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-application-logs"
    Environment = var.environment
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

resource "aws_iam_role" "lambda_failover" {
  name = "${var.app_name}-lambda-failover-role"

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

  tags = {
    Name        = "${var.app_name}-lambda-failover-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "lambda_failover" {
  name = "${var.app_name}-lambda-failover-policy"
  role = aws_iam_role.lambda_failover.id

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
          aws_cloudwatch_log_group.lambda_failover.arn,
          "${aws_cloudwatch_log_group.lambda_failover.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary_data.arn,
          "${aws_s3_bucket.primary_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudformation:DescribeStacks",
          "cloudformation:CreateStack",
          "cloudformation:UpdateStack"
        ]
        Resource = [
          "arn:aws:cloudformation:${var.aws_region}:${data.aws_caller_identity.current.account_id}:stack/${var.app_name}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = [
          "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:metric/FinancialApp/FailoverAutomation/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics"
        ]
        Resource = [
          "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:metric/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.failover_notifications.arn
        ]
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTION - FAILOVER AUTOMATION
# ============================================================================

data "archive_file" "lambda_failover" {
  type        = "zip"
  output_path = "${path.module}/lambda_failover.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      import os
      from datetime import datetime

      cloudwatch = boto3.client('cloudwatch')
      s3 = boto3.client('s3')
      cfn = boto3.client('cloudformation')
      sns = boto3.client('sns')

      def lambda_handler(event, context):
          print(f"Failover triggered: {json.dumps(event)}")

          # Log failure detection
          timestamp = datetime.utcnow().isoformat()
          print(f"Failure detected at: {timestamp}")

          results = {
              's3_health': 'unknown',
              'notifications_sent': False
          }

          # Put custom metric
          cloudwatch.put_metric_data(
              Namespace='FinancialApp/FailoverAutomation',
              MetricData=[
                  {
                      'MetricName': 'FailoverTriggered',
                      'Value': 1,
                      'Unit': 'Count',
                      'Timestamp': datetime.utcnow()
                  }
              ]
          )

          # Check S3 bucket health
          bucket_name = os.environ.get('PRIMARY_BUCKET')
          try:
              s3.head_bucket(Bucket=bucket_name)
              results['s3_health'] = 'healthy'
              print(f"Bucket {bucket_name} is healthy")
          except Exception as e:
              results['s3_health'] = 'failed'
              error_msg = f"Bucket {bucket_name} health check failed: {str(e)}"
              print(error_msg)

              # Send SNS notification for failure
              sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
              if sns_topic_arn:
                  try:
                      sns.publish(
                          TopicArn=sns_topic_arn,
                          Subject='Failover Health Check Alert',
                          Message=json.dumps({
                              'timestamp': timestamp,
                              'bucket': bucket_name,
                              'status': 'failed',
                              'error': str(e),
                              'environment': os.environ.get('ENVIRONMENT')
                          }, indent=2)
                      )
                      results['notifications_sent'] = True
                      print("SNS notification sent successfully")
                  except Exception as sns_error:
                      print(f"Failed to send SNS notification: {str(sns_error)}")

          return {
              'statusCode': 200,
              'body': json.dumps({
                  'message': 'Failover automation executed',
                  'timestamp': timestamp,
                  'results': results
              })
          }
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.lambda_failover.output_path
  function_name    = "${var.app_name}-failover-automation"
  role             = aws_iam_role.lambda_failover.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_failover.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      PRIMARY_BUCKET    = aws_s3_bucket.primary_data.id
      SECONDARY_REGION  = var.secondary_region
      ENVIRONMENT       = var.environment
      SNS_TOPIC_ARN     = aws_sns_topic.failover_notifications.arn
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "${var.app_name}-failover-automation"
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check.arn
}

# ============================================================================
# EVENTBRIDGE RULES - HEALTH MONITORING
# ============================================================================

resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "${var.app_name}-health-check"
  description         = "Trigger failover automation on health check failures"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name        = "${var.app_name}-health-check-rule"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "lambda_failover" {
  rule      = aws_cloudwatch_event_rule.health_check.name
  target_id = "FailoverLambdaTarget"
  arn       = aws_lambda_function.failover.arn
}

# ============================================================================
# SNS TOPIC FOR NOTIFICATIONS
# ============================================================================

resource "aws_sns_topic" "failover_notifications" {
  name              = "${var.app_name}-failover-notifications"
  display_name      = "Failover Automation Notifications"
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name        = "${var.app_name}-failover-notifications"
    Environment = var.environment
    Purpose     = "Alert notifications"
  }
}

resource "aws_sns_topic_policy" "failover_notifications" {
  arn = aws_sns_topic.failover_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.failover_notifications.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.app_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function has errors"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.failover_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.failover.function_name
  }

  tags = {
    Name        = "${var.app_name}-lambda-errors-alarm"
    Environment = var.environment
    Severity    = "high"
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_errors" {
  alarm_name          = "${var.app_name}-s3-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert on S3 bucket access errors"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.failover_notifications.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary_data.id
  }

  tags = {
    Name        = "${var.app_name}-s3-errors-alarm"
    Environment = var.environment
    Severity    = "medium"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.app_name}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 250000
  alarm_description   = "Alert when Lambda execution duration exceeds threshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.failover_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.failover.function_name
  }

  tags = {
    Name        = "${var.app_name}-lambda-duration-alarm"
    Environment = var.environment
    Severity    = "low"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${var.app_name}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when Lambda function is throttled"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.failover_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.failover.function_name
  }

  tags = {
    Name        = "${var.app_name}-lambda-throttles-alarm"
    Environment = var.environment
    Severity    = "medium"
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary_data.id
}

output "primary_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary_data.arn
}

output "cloudformation_bucket_name" {
  description = "Name of the CloudFormation templates bucket"
  value       = aws_s3_bucket.cloudformation_templates.id
}

output "lambda_function_name" {
  description = "Name of the failover Lambda function"
  value       = aws_lambda_function.failover.function_name
}

output "lambda_function_arn" {
  description = "ARN of the failover Lambda function"
  value       = aws_lambda_function.failover.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge health check rule"
  value       = aws_cloudwatch_event_rule.health_check.name
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch log group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_failover.name
}

output "cloudwatch_log_group_application" {
  description = "CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.application.name
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for failover notifications"
  value       = aws_sns_topic.failover_notifications.arn
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarm names"
  value = {
    lambda_errors   = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
    s3_errors       = aws_cloudwatch_metric_alarm.s3_bucket_errors.alarm_name
    lambda_duration = aws_cloudwatch_metric_alarm.lambda_duration.alarm_name
    lambda_throttles = aws_cloudwatch_metric_alarm.lambda_throttles.alarm_name
  }
}
