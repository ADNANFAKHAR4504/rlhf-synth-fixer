## tap_stack.tf

```hcl
# tap_stack.tf - Multi-Stage Payment Processing Pipeline (Modular Architecture)

# ================================
# DATA SOURCES
# ================================

# Get current caller identity for account ID
data "aws_caller_identity" "current" {}

# Get available AZs in the current region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get existing VPC (if available)
data "aws_vpcs" "existing" {
  filter {
    name   = "state"
    values = ["available"]
  }
}

# Get existing subnets (if available)
data "aws_subnets" "private" {
  count = length(data.aws_vpcs.existing.ids) > 0 ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpcs.existing.ids[0]]
  }
  filter {
    name   = "subnet-id"
    values = ["subnet-*"]
  }
  tags = {
    Type = "private"
  }
}

# ================================
# LOCALS - Environment-specific configurations
# ================================

locals {
  # Environment suffix for unique resource naming
  env_suffix = var.environment_suffix

  # Account ID for resource naming
  account_id = data.aws_caller_identity.current.account_id

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment_suffix
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    Application = "payment-processing"
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
    CostCenter  = "FinTech"
  }

  # Resource naming prefix
  name_prefix = "payment-processing-${local.env_suffix}"

  # SQS Queue names - FIFO queues for ordered processing
  transaction_validation_queue_name = "${local.name_prefix}-transaction-validation.fifo"
  fraud_detection_queue_name        = "${local.name_prefix}-fraud-detection.fifo"
  payment_notification_queue_name   = "${local.name_prefix}-payment-notification.fifo"

  # Dead Letter Queue names
  transaction_validation_dlq_name = "${local.name_prefix}-transaction-validation-dlq.fifo"
  fraud_detection_dlq_name        = "${local.name_prefix}-fraud-detection-dlq.fifo"
  payment_notification_dlq_name   = "${local.name_prefix}-payment-notification-dlq.fifo"

  # IAM role names
  lambda_validation_role_name   = "${local.name_prefix}-validation-lambda-role"
  lambda_fraud_role_name        = "${local.name_prefix}-fraud-lambda-role"
  lambda_notification_role_name = "${local.name_prefix}-notification-lambda-role"
  eventbridge_role_name         = "${local.name_prefix}-eventbridge-role"

  # DynamoDB table for transaction state
  transaction_state_table_name = "${local.name_prefix}-transaction-state"

  # SNS topic for notifications
  sns_alerts_topic_name = "${local.name_prefix}-alerts"

  # CloudWatch log groups
  log_group_validation   = "/aws/lambda/${local.name_prefix}-validation"
  log_group_fraud        = "/aws/lambda/${local.name_prefix}-fraud"
  log_group_notification = "/aws/lambda/${local.name_prefix}-notification"

  # SSM parameter names for queue URLs
  ssm_validation_queue_url   = "/payment-processing/${local.env_suffix}/sqs/validation-queue-url"
  ssm_fraud_queue_url        = "/payment-processing/${local.env_suffix}/sqs/fraud-queue-url"
  ssm_notification_queue_url = "/payment-processing/${local.env_suffix}/sqs/notification-queue-url"

  # VPC configuration
  vpc_id             = length(data.aws_vpcs.existing.ids) > 0 ? data.aws_vpcs.existing.ids[0] : null
  private_subnet_ids = length(data.aws_vpcs.existing.ids) > 0 ? data.aws_subnets.private[0].ids : []
}

# ================================
# IAM MODULE - Roles and Policies
# ================================

module "iam" {
  source = "./modules/iam"

  # Role names
  lambda_validation_role_name   = local.lambda_validation_role_name
  lambda_fraud_role_name        = local.lambda_fraud_role_name
  lambda_notification_role_name = local.lambda_notification_role_name
  eventbridge_role_name         = local.eventbridge_role_name

  # Configuration
  name_prefix        = local.name_prefix
  aws_region         = var.aws_region
  account_id         = local.account_id
  environment_suffix = local.env_suffix

  # Log groups
  log_group_validation   = local.log_group_validation
  log_group_fraud        = local.log_group_fraud
  log_group_notification = local.log_group_notification

  # Resource ARNs (will be populated by SQS and monitoring modules)
  validation_queue_arn        = module.sqs.transaction_validation_queue_arn
  fraud_queue_arn             = module.sqs.fraud_detection_queue_arn
  notification_queue_arn      = module.sqs.payment_notification_queue_arn
  transaction_state_table_arn = module.sqs.transaction_state_table_arn
  sns_topic_arn               = module.monitoring.sns_topic_arn

  # VPC configuration
  vpc_id = local.vpc_id

  # Tags
  common_tags = local.common_tags
}

# ================================
# SQS MODULE - Queues and Policies
# ================================

module "sqs" {
  source = "./modules/sqs"

  # Queue names
  transaction_validation_queue_name = local.transaction_validation_queue_name
  transaction_validation_dlq_name   = local.transaction_validation_dlq_name
  fraud_detection_queue_name        = local.fraud_detection_queue_name
  fraud_detection_dlq_name          = local.fraud_detection_dlq_name
  payment_notification_queue_name   = local.payment_notification_queue_name
  payment_notification_dlq_name     = local.payment_notification_dlq_name

  # Configuration
  account_id                   = local.account_id
  transaction_state_table_name = local.transaction_state_table_name

  # IAM role ARNs from IAM module
  lambda_validation_role_arn   = module.iam.lambda_validation_role_arn
  lambda_fraud_role_arn        = module.iam.lambda_fraud_role_arn
  lambda_notification_role_arn = module.iam.lambda_notification_role_arn
  eventbridge_role_arn         = module.iam.eventbridge_role_arn

  # SSM parameter names
  ssm_validation_queue_url   = local.ssm_validation_queue_url
  ssm_fraud_queue_url        = local.ssm_fraud_queue_url
  ssm_notification_queue_url = local.ssm_notification_queue_url

  # Tags
  common_tags = local.common_tags
}

# ================================
# MONITORING MODULE - CloudWatch and Alerting
# ================================

module "monitoring" {
  source = "./modules/monitoring"

  # Configuration
  name_prefix           = local.name_prefix
  sns_alerts_topic_name = local.sns_alerts_topic_name
  aws_region            = var.aws_region

  # Queue names for monitoring
  validation_queue_name   = module.sqs.transaction_validation_queue_name
  fraud_queue_name        = module.sqs.fraud_detection_queue_name
  notification_queue_name = module.sqs.payment_notification_queue_name

  # DLQ names for monitoring
  validation_dlq_name   = module.sqs.transaction_validation_dlq_name
  fraud_dlq_name        = module.sqs.fraud_detection_dlq_name
  notification_dlq_name = module.sqs.payment_notification_dlq_name

  # Log group names
  log_group_validation   = local.log_group_validation
  log_group_fraud        = local.log_group_fraud
  log_group_notification = local.log_group_notification

  # Tags
  common_tags = local.common_tags
}

# ================================
# VPC ENDPOINTS - Private SQS Access
# ================================

# VPC Endpoint for SQS (if VPC exists)
resource "aws_vpc_endpoint" "sqs" {
  count = local.vpc_id != null ? 1 : 0

  vpc_id             = local.vpc_id
  service_name       = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = local.private_subnet_ids
  security_group_ids = [module.iam.vpc_endpoint_security_group_id]

  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          module.sqs.transaction_validation_queue_arn,
          module.sqs.fraud_detection_queue_arn,
          module.sqs.payment_notification_queue_arn
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-sqs-endpoint"
    Purpose = "Private access to SQS from Lambda functions"
    Service = "VPC"
  })
}

# ================================
# S3 BUCKET - Cross-Region Replication for DR
# ================================

# S3 bucket for cross-region replication events
resource "aws_s3_bucket" "dr_events" {
  bucket        = "${local.account_id}-payment-processing-dr-events-${local.env_suffix}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "payment-processing-dr-events"
    Purpose = "Cross-region disaster recovery events"
    Service = "S3"
  })
}

# S3 bucket versioning for DR events
resource "aws_s3_bucket_versioning" "dr_events" {
  bucket = aws_s3_bucket.dr_events.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for DR events
resource "aws_s3_bucket_server_side_encryption_configuration" "dr_events" {
  bucket = aws_s3_bucket.dr_events.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```
## variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

## provider.tf
```hcl
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

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

```

## outputs.tf
```hcl
# outputs.tf - Main Infrastructure Outputs

# ================================
# SQS QUEUE OUTPUTS
# ================================

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation queue"
  value       = module.sqs.transaction_validation_queue_arn
}

output "transaction_validation_queue_url" {
  description = "URL of the transaction validation queue"
  value       = module.sqs.transaction_validation_queue_url
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection queue"
  value       = module.sqs.fraud_detection_queue_arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection queue"
  value       = module.sqs.fraud_detection_queue_url
}

output "payment_notification_queue_arn" {
  description = "ARN of the payment notification queue"
  value       = module.sqs.payment_notification_queue_arn
}

output "payment_notification_queue_url" {
  description = "URL of the payment notification queue"
  value       = module.sqs.payment_notification_queue_url
}

# ================================
# IAM ROLE OUTPUTS
# ================================

output "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  value       = module.iam.lambda_validation_role_arn
}

output "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  value       = module.iam.lambda_fraud_role_arn
}

output "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  value       = module.iam.lambda_notification_role_arn
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  value       = module.iam.eventbridge_role_arn
}

# ================================
# MONITORING OUTPUTS
# ================================

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = module.monitoring.sns_topic_arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_name
}

# ================================
# DYNAMODB OUTPUTS
# ================================

output "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  value       = module.sqs.transaction_state_table_arn
}

output "transaction_state_table_name" {
  description = "Name of the DynamoDB transaction state table"
  value       = module.sqs.transaction_state_table_name
}

# ================================
# S3 OUTPUTS
# ================================

output "dr_events_bucket_name" {
  description = "Name of the S3 bucket for DR events"
  value       = aws_s3_bucket.dr_events.bucket
}

output "dr_events_bucket_arn" {
  description = "ARN of the S3 bucket for DR events"
  value       = aws_s3_bucket.dr_events.arn
}

# ================================
# VPC OUTPUTS
# ================================

output "vpc_endpoint_id" {
  description = "ID of the SQS VPC endpoint"
  value       = length(aws_vpc_endpoint.sqs) > 0 ? aws_vpc_endpoint.sqs[0].id : null
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group"
  value       = module.iam.vpc_endpoint_security_group_id
}

# ================================
# ENVIRONMENT INFORMATION
# ================================

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}

output "name_prefix" {
  description = "Prefix used for all resource names"
  value       = local.name_prefix
}

output "account_id" {
  description = "AWS account ID"
  value       = local.account_id
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
```



## modules/iam/main.tf
```hcl
# modules/iam/main.tf - IAM Roles and Policies Module

# ================================
# IAM ROLES AND POLICIES - Least Privilege
# ================================

# IAM Role for Transaction Validation Lambda
resource "aws_iam_role" "lambda_validation_role" {
  name = var.lambda_validation_role_name

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

  tags = merge(var.common_tags, {
    Name    = var.lambda_validation_role_name
    Purpose = "IAM role for transaction validation Lambda"
    Service = "Lambda"
  })
}

# IAM Policy for Transaction Validation Lambda
resource "aws_iam_role_policy" "lambda_validation_policy" {
  name = "${var.lambda_validation_role_name}-policy"
  role = aws_iam_role.lambda_validation_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:${var.log_group_validation}*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.validation_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = var.transaction_state_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${var.account_id}:parameter/payment-processing/${var.environment_suffix}/*"
        ]
      }
    ]
  })
}

# IAM Role for Fraud Detection Lambda
resource "aws_iam_role" "lambda_fraud_role" {
  name = var.lambda_fraud_role_name

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

  tags = merge(var.common_tags, {
    Name    = var.lambda_fraud_role_name
    Purpose = "IAM role for fraud detection Lambda"
    Service = "Lambda"
  })
}

# IAM Policy for Fraud Detection Lambda
resource "aws_iam_role_policy" "lambda_fraud_policy" {
  name = "${var.lambda_fraud_role_name}-policy"
  role = aws_iam_role.lambda_fraud_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:${var.log_group_fraud}*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.fraud_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = var.transaction_state_table_arn
      }
    ]
  })
}

# IAM Role for Payment Notification Lambda
resource "aws_iam_role" "lambda_notification_role" {
  name = var.lambda_notification_role_name

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

  tags = merge(var.common_tags, {
    Name    = var.lambda_notification_role_name
    Purpose = "IAM role for payment notification Lambda"
    Service = "Lambda"
  })
}

# IAM Policy for Payment Notification Lambda
resource "aws_iam_role_policy" "lambda_notification_policy" {
  name = "${var.lambda_notification_role_name}-policy"
  role = aws_iam_role.lambda_notification_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:${var.log_group_notification}*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.notification_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = var.transaction_state_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      }
    ]
  })
}

# IAM Role for EventBridge Pipes
resource "aws_iam_role" "eventbridge_role" {
  name = var.eventbridge_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name    = var.eventbridge_role_name
    Purpose = "IAM role for EventBridge Pipes"
    Service = "EventBridge"
  })
}

# IAM Policy for EventBridge Pipes
resource "aws_iam_role_policy" "eventbridge_policy" {
  name = "${var.eventbridge_role_name}-policy"
  role = aws_iam_role.eventbridge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          var.validation_queue_arn,
          var.fraud_queue_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          var.fraud_queue_arn,
          var.notification_queue_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          "arn:aws:lambda:${var.aws_region}:${var.account_id}:function:${var.name_prefix}-message-transformer"
        ]
      }
    ]
  })
}

# ================================
# VPC SECURITY GROUPS - For VPC Endpoints
# ================================

# Security Group for VPC Endpoint (conditional based on VPC existence)
resource "aws_security_group" "vpc_endpoint" {
  count = var.vpc_id != null ? 1 : 0

  name_prefix = "${var.name_prefix}-vpc-endpoint-"
  vpc_id      = var.vpc_id
  description = "Security group for SQS VPC endpoint"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Allow HTTPS traffic from private subnets"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-vpc-endpoint-sg"
    Purpose = "Security group for VPC endpoint access"
    Service = "EC2"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

## modules/iam/outputs.tf
```hcl
# modules/iam/outputs.tf

output "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  value       = aws_iam_role.lambda_validation_role.arn
}

output "lambda_validation_role_name" {
  description = "Name of the Lambda validation role"
  value       = aws_iam_role.lambda_validation_role.name
}

output "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  value       = aws_iam_role.lambda_fraud_role.arn
}

output "lambda_fraud_role_name" {
  description = "Name of the Lambda fraud detection role"
  value       = aws_iam_role.lambda_fraud_role.name
}

output "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  value       = aws_iam_role.lambda_notification_role.arn
}

output "lambda_notification_role_name" {
  description = "Name of the Lambda notification role"
  value       = aws_iam_role.lambda_notification_role.name
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  value       = aws_iam_role.eventbridge_role.arn
}

output "eventbridge_role_name" {
  description = "Name of the EventBridge role"
  value       = aws_iam_role.eventbridge_role.name
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group"
  value       = var.vpc_id != null ? aws_security_group.vpc_endpoint[0].id : null
}
```

## modules/iam/variables.tf
```hcl
# modules/iam/variables.tf

variable "lambda_validation_role_name" {
  description = "Name for the Lambda validation IAM role"
  type        = string
}

variable "lambda_fraud_role_name" {
  description = "Name for the Lambda fraud detection IAM role"
  type        = string
}

variable "lambda_notification_role_name" {
  description = "Name for the Lambda notification IAM role"
  type        = string
}

variable "eventbridge_role_name" {
  description = "Name for the EventBridge IAM role"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "log_group_validation" {
  description = "CloudWatch log group name for validation Lambda"
  type        = string
}

variable "log_group_fraud" {
  description = "CloudWatch log group name for fraud detection Lambda"
  type        = string
}

variable "log_group_notification" {
  description = "CloudWatch log group name for notification Lambda"
  type        = string
}

variable "validation_queue_arn" {
  description = "ARN of the validation SQS queue"
  type        = string
}

variable "fraud_queue_arn" {
  description = "ARN of the fraud detection SQS queue"
  type        = string
}

variable "notification_queue_arn" {
  description = "ARN of the notification SQS queue"
  type        = string
}

variable "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for creating security group (optional)"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## modules/monitoring/main.tf
```hcl
# modules/monitoring/main.tf - CloudWatch Monitoring and Alerting Module

# ================================
# SNS TOPIC - Alerts and Notifications
# ================================

resource "aws_sns_topic" "payment_alerts" {
  name = var.sns_alerts_topic_name

  # Server-side encryption
  kms_master_key_id = "alias/aws/sns"

  tags = merge(var.common_tags, {
    Name    = var.sns_alerts_topic_name
    Purpose = "Payment processing alerts and notifications"
    Service = "SNS"
  })
}

# ================================
# CLOUDWATCH ALARMS - Queue Monitoring
# ================================

# CloudWatch Alarm for Transaction Validation Queue Depth
resource "aws_cloudwatch_metric_alarm" "validation_queue_depth" {
  alarm_name          = "${var.name_prefix}-validation-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for transaction validation"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.validation_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-validation-queue-depth-alarm"
    Purpose = "Monitor transaction validation queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Fraud Detection Queue Depth
resource "aws_cloudwatch_metric_alarm" "fraud_queue_depth" {
  alarm_name          = "${var.name_prefix}-fraud-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for fraud detection"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.fraud_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-fraud-queue-depth-alarm"
    Purpose = "Monitor fraud detection queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Payment Notification Queue Depth
resource "aws_cloudwatch_metric_alarm" "notification_queue_depth" {
  alarm_name          = "${var.name_prefix}-notification-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth for payment notifications"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    QueueName = var.notification_queue_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-notification-queue-depth-alarm"
    Purpose = "Monitor payment notification queue depth"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Transaction Validation DLQ Messages
resource "aws_cloudwatch_metric_alarm" "validation_dlq_messages" {
  alarm_name          = "${var.name_prefix}-validation-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for transaction validation"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.validation_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-validation-dlq-messages-alarm"
    Purpose = "Monitor transaction validation DLQ messages"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Fraud Detection DLQ Messages
resource "aws_cloudwatch_metric_alarm" "fraud_dlq_messages" {
  alarm_name          = "${var.name_prefix}-fraud-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for fraud detection"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.fraud_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-fraud-dlq-messages-alarm"
    Purpose = "Monitor fraud detection DLQ messages"
    Service = "CloudWatch"
  })
}

# CloudWatch Alarm for Payment Notification DLQ Messages
resource "aws_cloudwatch_metric_alarm" "notification_dlq_messages" {
  alarm_name          = "${var.name_prefix}-notification-dlq-messages-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DLQ messages for payment notifications"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = var.notification_dlq_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-notification-dlq-messages-alarm"
    Purpose = "Monitor payment notification DLQ messages"
    Service = "CloudWatch"
  })
}

# ================================
# CLOUDWATCH LOG GROUPS - Lambda Function Logs
# ================================

# Log Group for Transaction Validation Lambda
resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = var.log_group_validation
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_validation
    Purpose = "Log group for transaction validation Lambda"
    Service = "CloudWatch"
  })
}

# Log Group for Fraud Detection Lambda
resource "aws_cloudwatch_log_group" "fraud_lambda" {
  name              = var.log_group_fraud
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_fraud
    Purpose = "Log group for fraud detection Lambda"
    Service = "CloudWatch"
  })
}

# Log Group for Payment Notification Lambda
resource "aws_cloudwatch_log_group" "notification_lambda" {
  name              = var.log_group_notification
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name    = var.log_group_notification
    Purpose = "Log group for payment notification Lambda"
    Service = "CloudWatch"
  })
}

# ================================
# CLOUDWATCH DASHBOARD - Payment Processing Overview
# ================================

resource "aws_cloudwatch_dashboard" "payment_processing" {
  dashboard_name = "${var.name_prefix}-dashboard"

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
            ["AWS/SQS", "ApproximateNumberOfVisibleMessages", "QueueName", var.validation_queue_name],
            [".", ".", ".", var.fraud_queue_name],
            [".", ".", ".", var.notification_queue_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Queue Depths"
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
            ["AWS/SQS", "ApproximateNumberOfVisibleMessages", "QueueName", var.validation_dlq_name],
            [".", ".", ".", var.fraud_dlq_name],
            [".", ".", ".", var.notification_dlq_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Dead Letter Queue Messages"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.validation_queue_name],
            [".", ".", ".", var.fraud_queue_name],
            [".", ".", ".", var.notification_queue_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Messages Sent"
          period  = 300
        }
      }
    ]
  })
}
```

## modules/monitoring/outputs.tf
```hcl
# modules/monitoring/outputs.tf

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.payment_alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS alerts topic"
  value       = aws_sns_topic.payment_alerts.name
}

output "validation_queue_depth_alarm_arn" {
  description = "ARN of the validation queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.validation_queue_depth.arn
}

output "fraud_queue_depth_alarm_arn" {
  description = "ARN of the fraud queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.fraud_queue_depth.arn
}

output "notification_queue_depth_alarm_arn" {
  description = "ARN of the notification queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.notification_queue_depth.arn
}

output "validation_dlq_alarm_arn" {
  description = "ARN of the validation DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.validation_dlq_messages.arn
}

output "fraud_dlq_alarm_arn" {
  description = "ARN of the fraud DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.fraud_dlq_messages.arn
}

output "notification_dlq_alarm_arn" {
  description = "ARN of the notification DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.notification_dlq_messages.arn
}

output "validation_log_group_name" {
  description = "Name of the validation Lambda log group"
  value       = aws_cloudwatch_log_group.validation_lambda.name
}

output "fraud_log_group_name" {
  description = "Name of the fraud detection Lambda log group"
  value       = aws_cloudwatch_log_group.fraud_lambda.name
}

output "notification_log_group_name" {
  description = "Name of the notification Lambda log group"
  value       = aws_cloudwatch_log_group.notification_lambda.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.payment_processing.dashboard_name
}
```

## modules/monitoring/variables.tf
```hcl
# modules/monitoring/variables.tf

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "sns_alerts_topic_name" {
  description = "Name for the SNS alerts topic"
  type        = string
}

variable "queue_depth_threshold" {
  description = "Threshold for queue depth alarms"
  type        = number
  default     = 1000
}

variable "validation_queue_name" {
  description = "Name of the validation queue for monitoring"
  type        = string
}

variable "fraud_queue_name" {
  description = "Name of the fraud detection queue for monitoring"
  type        = string
}

variable "notification_queue_name" {
  description = "Name of the notification queue for monitoring"
  type        = string
}

variable "validation_dlq_name" {
  description = "Name of the validation DLQ for monitoring"
  type        = string
}

variable "fraud_dlq_name" {
  description = "Name of the fraud detection DLQ for monitoring"
  type        = string
}

variable "notification_dlq_name" {
  description = "Name of the notification DLQ for monitoring"
  type        = string
}

variable "log_group_validation" {
  description = "CloudWatch log group name for validation Lambda"
  type        = string
}

variable "log_group_fraud" {
  description = "CloudWatch log group name for fraud detection Lambda"
  type        = string
}

variable "log_group_notification" {
  description = "CloudWatch log group name for notification Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "aws_region" {
  description = "AWS region for CloudWatch resources"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## modules/sqs/main.tf
```hcl
# modules/sqs/main.tf - SQS Queues and Policies Module

# ================================
# SQS FIFO QUEUES - Transaction Processing Pipeline
# ================================

# Transaction Validation Queue (FIFO)
resource "aws_sqs_queue" "transaction_validation" {
  name                        = var.transaction_validation_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  # Server-side encryption with AWS managed keys
  sqs_managed_sse_enabled = true

  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transaction_validation_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.transaction_validation_queue_name
    Purpose         = "FIFO queue for transaction validation processing"
    QueueType       = "Primary"
    ProcessingStage = "Validation"
  })
}

# Transaction Validation Dead Letter Queue
resource "aws_sqs_queue" "transaction_validation_dlq" {
  name                        = var.transaction_validation_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.transaction_validation_dlq_name
    Purpose         = "Dead letter queue for failed transaction validations"
    QueueType       = "DLQ"
    ProcessingStage = "Validation"
  })
}

# Fraud Detection Queue (FIFO)
resource "aws_sqs_queue" "fraud_detection" {
  name                        = var.fraud_detection_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fraud_detection_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.fraud_detection_queue_name
    Purpose         = "FIFO queue for fraud detection processing"
    QueueType       = "Primary"
    ProcessingStage = "FraudDetection"
  })
}

# Fraud Detection Dead Letter Queue
resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                        = var.fraud_detection_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.fraud_detection_dlq_name
    Purpose         = "Dead letter queue for failed fraud detection"
    QueueType       = "DLQ"
    ProcessingStage = "FraudDetection"
  })
}

# Payment Notification Queue (FIFO)
resource "aws_sqs_queue" "payment_notification" {
  name                        = var.payment_notification_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_notification_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.payment_notification_queue_name
    Purpose         = "FIFO queue for payment notification processing"
    QueueType       = "Primary"
    ProcessingStage = "Notification"
  })
}

# Payment Notification Dead Letter Queue
resource "aws_sqs_queue" "payment_notification_dlq" {
  name                        = var.payment_notification_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.payment_notification_dlq_name
    Purpose         = "Dead letter queue for failed payment notifications"
    QueueType       = "DLQ"
    ProcessingStage = "Notification"
  })
}

# ================================
# SQS QUEUE POLICIES - Least Privilege Access
# ================================

# Transaction Validation Queue Policy
resource "aws_sqs_queue_policy" "transaction_validation" {
  queue_url = aws_sqs_queue.transaction_validation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowValidationLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_validation_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      }
    ]
  })
}

# Fraud Detection Queue Policy
resource "aws_sqs_queue_policy" "fraud_detection" {
  queue_url = aws_sqs_queue.fraud_detection.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowFraudLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_fraud_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Sid    = "AllowEventBridgePipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.eventbridge_role_arn
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })
}

# Payment Notification Queue Policy
resource "aws_sqs_queue_policy" "payment_notification" {
  queue_url = aws_sqs_queue.payment_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowNotificationLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_notification_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Sid    = "AllowEventBridgePipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.eventbridge_role_arn
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
      }
    ]
  })
}

# ================================
# DYNAMODB TABLE - Transaction State Management
# ================================

resource "aws_dynamodb_table" "transaction_state" {
  name         = var.transaction_state_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "merchant_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "merchant_id"
    type = "S"
  }

  attribute {
    name = "processing_stage"
    type = "S"
  }

  attribute {
    name = "created_timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "ProcessingStageIndex"
    hash_key        = "processing_stage"
    range_key       = "created_timestamp"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # TTL for automatic cleanup of old records
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.common_tags, {
    Name    = var.transaction_state_table_name
    Purpose = "Transaction state management across processing stages"
    Service = "DynamoDB"
  })
}

# ================================
# SSM PARAMETERS - Queue URLs for Lambda Configuration
# ================================

# SSM Parameter for Transaction Validation Queue URL
resource "aws_ssm_parameter" "validation_queue_url" {
  name  = var.ssm_validation_queue_url
  type  = "String"
  value = aws_sqs_queue.transaction_validation.url

  description = "SQS Queue URL for transaction validation processing"

  tags = merge(var.common_tags, {
    Name    = "ValidationQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}

# SSM Parameter for Fraud Detection Queue URL
resource "aws_ssm_parameter" "fraud_queue_url" {
  name  = var.ssm_fraud_queue_url
  type  = "String"
  value = aws_sqs_queue.fraud_detection.url

  description = "SQS Queue URL for fraud detection processing"

  tags = merge(var.common_tags, {
    Name    = "FraudQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}

# SSM Parameter for Payment Notification Queue URL
resource "aws_ssm_parameter" "notification_queue_url" {
  name  = var.ssm_notification_queue_url
  type  = "String"
  value = aws_sqs_queue.payment_notification.url

  description = "SQS Queue URL for payment notification processing"

  tags = merge(var.common_tags, {
    Name    = "NotificationQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}
```

## modules/sqs/outputs.tf
```hcl
# modules/sqs/outputs.tf

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.arn
}

output "transaction_validation_queue_url" {
  description = "URL of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.url
}

output "transaction_validation_queue_name" {
  description = "Name of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.name
}

output "transaction_validation_dlq_arn" {
  description = "ARN of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.arn
}

output "transaction_validation_dlq_name" {
  description = "Name of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.name
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.url
}

output "fraud_detection_queue_name" {
  description = "Name of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.name
}

output "fraud_detection_dlq_arn" {
  description = "ARN of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.arn
}

output "fraud_detection_dlq_name" {
  description = "Name of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.name
}

output "payment_notification_queue_arn" {
  description = "ARN of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.arn
}

output "payment_notification_queue_url" {
  description = "URL of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.url
}

output "payment_notification_queue_name" {
  description = "Name of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.name
}

output "payment_notification_dlq_arn" {
  description = "ARN of the payment notification dead letter queue"
  value       = aws_sqs_queue.payment_notification_dlq.arn
}

output "payment_notification_dlq_name" {
  description = "Name of the payment notification dead letter queue"
  value       = aws_sqs_queue.payment_notification_dlq.name
}

output "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  value       = aws_dynamodb_table.transaction_state.arn
}

output "transaction_state_table_name" {
  description = "Name of the DynamoDB transaction state table"
  value       = aws_dynamodb_table.transaction_state.name
}

output "validation_queue_url_parameter" {
  description = "SSM parameter name for validation queue URL"
  value       = aws_ssm_parameter.validation_queue_url.name
}

output "fraud_queue_url_parameter" {
  description = "SSM parameter name for fraud queue URL"
  value       = aws_ssm_parameter.fraud_queue_url.name
}

output "notification_queue_url_parameter" {
  description = "SSM parameter name for notification queue URL"
  value       = aws_ssm_parameter.notification_queue_url.name
}
```

## modules/sqs/variables.tf
```hcl
# modules/sqs/variables.tf

variable "transaction_validation_queue_name" {
  description = "Name for the transaction validation FIFO queue"
  type        = string
}

variable "transaction_validation_dlq_name" {
  description = "Name for the transaction validation dead letter queue"
  type        = string
}

variable "fraud_detection_queue_name" {
  description = "Name for the fraud detection FIFO queue"
  type        = string
}

variable "fraud_detection_dlq_name" {
  description = "Name for the fraud detection dead letter queue"
  type        = string
}

variable "payment_notification_queue_name" {
  description = "Name for the payment notification FIFO queue"
  type        = string
}

variable "payment_notification_dlq_name" {
  description = "Name for the payment notification dead letter queue"
  type        = string
}

variable "message_retention_seconds" {
  description = "Message retention period in seconds"
  type        = number
  default     = 604800 # 7 days
}

variable "dlq_message_retention_seconds" {
  description = "Dead letter queue message retention period in seconds"
  type        = number
  default     = 1209600 # 14 days
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for SQS messages in seconds"
  type        = number
  default     = 300 # 5 minutes
}

variable "max_message_size" {
  description = "Maximum message size in bytes"
  type        = number
  default     = 262144 # 256KB
}

variable "max_receive_count" {
  description = "Maximum number of receives before sending to DLQ"
  type        = number
  default     = 3
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  type        = string
}

variable "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  type        = string
}

variable "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  type        = string
}

variable "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  type        = string
}

variable "transaction_state_table_name" {
  description = "Name for the DynamoDB transaction state table"
  type        = string
}

variable "ssm_validation_queue_url" {
  description = "SSM parameter name for validation queue URL"
  type        = string
}

variable "ssm_fraud_queue_url" {
  description = "SSM parameter name for fraud queue URL"
  type        = string
}

variable "ssm_notification_queue_url" {
  description = "SSM parameter name for notification queue URL"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```
