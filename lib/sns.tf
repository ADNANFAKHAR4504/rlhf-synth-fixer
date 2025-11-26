# SNS topic for database events in primary region
resource "aws_sns_topic" "primary_db_events" {
  name              = "db-events-primary-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.primary_sns.id

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# Dead letter queue for primary SNS
resource "aws_sqs_queue" "primary_dlq" {
  name                      = "db-events-dlq-primary-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-dlq-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_sqs_queue_policy" "primary_dlq" {
  queue_url = aws_sqs_queue.primary_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.primary_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.primary_db_events.arn
          }
        }
      }
    ]
  })
}

# RDS event subscription for primary region
resource "aws_db_event_subscription" "primary" {
  name      = "rds-event-sub-primary-${var.environment_suffix}"
  sns_topic = aws_sns_topic.primary_db_events.arn

  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.primary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-event-sub-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# SNS topic for database events in secondary region
resource "aws_sns_topic" "secondary_db_events" {
  provider          = aws.secondary
  name              = "db-events-secondary-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.secondary_sns.id

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# Dead letter queue for secondary SNS
resource "aws_sqs_queue" "secondary_dlq" {
  provider                  = aws.secondary
  name                      = "db-events-dlq-secondary-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(
    var.common_tags,
    {
      Name   = "db-events-dlq-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_sqs_queue_policy" "secondary_dlq" {
  provider  = aws.secondary
  queue_url = aws_sqs_queue.secondary_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.secondary_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.secondary_db_events.arn
          }
        }
      }
    ]
  })
}

# RDS event subscription for secondary region
resource "aws_db_event_subscription" "secondary" {
  provider  = aws.secondary
  name      = "rds-event-sub-secondary-${var.environment_suffix}"
  sns_topic = aws_sns_topic.secondary_db_events.arn

  source_type = "db-cluster"
  source_ids  = [aws_rds_cluster.secondary.id]

  event_categories = [
    "failover",
    "failure",
    "notification",
    "maintenance"
  ]

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-event-sub-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
