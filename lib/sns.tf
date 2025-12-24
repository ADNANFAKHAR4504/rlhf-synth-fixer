# Dead Letter Queue for primary SNS
resource "aws_sqs_queue" "dlq_primary" {
  provider = aws.primary
  name     = "sns-dlq-primary-${var.environment_suffix}"

  message_retention_seconds = 1209600

  tags = {
    Name        = "sqs-dlq-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SQS queue for primary event notifications
resource "aws_sqs_queue" "events_primary" {
  provider = aws.primary
  name     = "aurora-events-primary-${var.environment_suffix}"

  message_retention_seconds  = 345600
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq_primary.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "sqs-events-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SQS queue policy to allow SNS publishing
resource "aws_sqs_queue_policy" "events_primary" {
  provider  = aws.primary
  queue_url = aws_sqs_queue.events_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.events_primary.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.primary.arn
        }
      }
    }]
  })
}

# SNS topic for primary region
resource "aws_sns_topic" "primary" {
  provider = aws.primary
  name     = "aurora-events-primary-${var.environment_suffix}"

  tags = {
    Name        = "sns-events-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "primary" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.primary.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.events_primary.arn
}

# RDS event subscription for primary
resource "aws_db_event_subscription" "primary" {
  provider    = aws.primary
  name        = "aurora-events-primary-${var.environment_suffix}"
  sns_topic   = aws_sns_topic.primary.arn
  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.primary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]
}

# Dead Letter Queue for secondary SNS
resource "aws_sqs_queue" "dlq_secondary" {
  provider = aws.secondary
  name     = "sns-dlq-secondary-${var.environment_suffix}"

  message_retention_seconds = 1209600

  tags = {
    Name        = "sqs-dlq-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SQS queue for secondary event notifications
resource "aws_sqs_queue" "events_secondary" {
  provider = aws.secondary
  name     = "aurora-events-secondary-${var.environment_suffix}"

  message_retention_seconds  = 345600
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq_secondary.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "sqs-events-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SQS queue policy to allow SNS publishing
resource "aws_sqs_queue_policy" "events_secondary" {
  provider  = aws.secondary
  queue_url = aws_sqs_queue.events_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.events_secondary.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.secondary.arn
        }
      }
    }]
  })
}

# SNS topic for secondary region
resource "aws_sns_topic" "secondary" {
  provider = aws.secondary
  name     = "aurora-events-secondary-${var.environment_suffix}"

  tags = {
    Name        = "sns-events-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "secondary" {
  provider  = aws.secondary
  topic_arn = aws_sns_topic.secondary.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.events_secondary.arn
}

# RDS event subscription for secondary
resource "aws_db_event_subscription" "secondary" {
  provider    = aws.secondary
  name        = "aurora-events-secondary-${var.environment_suffix}"
  sns_topic   = aws_sns_topic.secondary.arn
  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.secondary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]
}