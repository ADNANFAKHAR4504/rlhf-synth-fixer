# lambda.tf - Lambda function for stream processing

# IAM role for Lambda function
resource "aws_iam_role" "lambda" {
  name = "transaction-processor-role-${var.environment_suffix}"

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
    Name = "lambda-role-${var.environment_suffix}"
  }
}

# IAM policy for Lambda execution
resource "aws_iam_role_policy" "lambda" {
  name = "lambda-execution-policy"
  role = aws_iam_role.lambda.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListShards",
          "kinesis:ListStreams"
        ]
        Resource = aws_kinesis_stream.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "PaymentTransactions/${var.environment_suffix}"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Dead Letter Queue for failed Lambda invocations
resource "aws_sqs_queue" "dlq" {
  name                      = "lambda-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "lambda-dlq-${var.environment_suffix}"
  }
}

# Lambda function (container-based - Constraint #3)
resource "aws_lambda_function" "processor" {
  function_name = "transaction-processor-${var.environment_suffix}"
  role          = aws_iam_role.lambda.arn

  # Container image configuration
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.lambda.repository_url}:latest"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  environment {
    variables = {
      ENVIRONMENT_SUFFIX   = var.environment_suffix
      CLOUDWATCH_NAMESPACE = "PaymentTransactions/${var.environment_suffix}"
      LOG_LEVEL            = "INFO"
    }
  }

  # Enable X-Ray tracing (Constraint #7)
  tracing_config {
    mode = "Active"
  }

  tags = {
    Name = "transaction-processor-${var.environment_suffix}"
  }

  # Depends on ECR repository
  depends_on = [
    aws_ecr_repository.lambda,
    aws_cloudwatch_log_group.lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/transaction-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "lambda-logs-${var.environment_suffix}"
  }
}

# Event source mapping: Kinesis -> Lambda
resource "aws_lambda_event_source_mapping" "kinesis" {
  event_source_arn  = aws_kinesis_stream.transactions.arn
  function_name     = aws_lambda_function.processor.arn
  starting_position = "LATEST"
  batch_size        = 100

  # Enable enhanced monitoring
  maximum_batching_window_in_seconds = 10
  parallelization_factor             = 5

  depends_on = [aws_iam_role_policy.lambda]
}
