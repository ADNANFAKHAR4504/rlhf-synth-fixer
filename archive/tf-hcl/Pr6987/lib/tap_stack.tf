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