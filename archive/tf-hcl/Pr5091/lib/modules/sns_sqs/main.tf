resource "aws_sns_topic" "feature_flags" {
  name              = "${var.name_prefix}-updates"
  kms_master_key_id = var.kms_key_id

  delivery_policy = jsonencode({
    "http" : {
      "defaultHealthyRetryPolicy" : {
        "minDelayTarget" : 1,
        "maxDelayTarget" : 10,
        "numRetries" : 3,
        "numMaxDelayRetries" : 0,
        "numNoDelayRetries" : 0,
        "numMinDelayRetries" : 0,
        "backoffFunction" : "linear"
      }
    }
  })

  tags = var.tags
}

resource "aws_sqs_queue" "microservice" {
  count = var.microservices_count

  name                       = "${var.name_prefix}-queue-${format("%03d", count.index)}"
  message_retention_seconds  = 86400
  visibility_timeout_seconds = 30
  receive_wait_time_seconds  = 0

  kms_master_key_id                 = var.kms_key_id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[count.index].arn
    maxReceiveCount     = 3
  })

  tags = merge(
    var.tags,
    {
      MicroserviceId = format("service-%03d", count.index)
    }
  )
}

resource "aws_sqs_queue" "dlq" {
  count = var.microservices_count

  name                      = "${var.name_prefix}-dlq-${format("%03d", count.index)}"
  message_retention_seconds = 1209600
  kms_master_key_id         = var.kms_key_id

  tags = merge(
    var.tags,
    {
      MicroserviceId = format("service-%03d", count.index)
      Type           = "DLQ"
    }
  )
}

resource "aws_sns_topic_subscription" "sqs" {
  count = var.microservices_count

  topic_arn = aws_sns_topic.feature_flags.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.microservice[count.index].arn

  raw_message_delivery = true

  filter_policy = jsonencode({
    service_id = [format("service-%03d", count.index), "all"]
  })
}

resource "aws_sqs_queue_policy" "microservice" {
  count = var.microservices_count

  queue_url = aws_sqs_queue.microservice[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.microservice[count.index].arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.feature_flags.arn
          }
        }
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "sqs" {
  count = var.microservices_count

  event_source_arn = aws_sqs_queue.microservice[count.index].arn
  function_name    = var.lambda_functions[count.index]

  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
