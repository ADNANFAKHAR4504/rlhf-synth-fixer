# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "webhook-lambda-role-${var.environment_suffix}"

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
    Name        = "webhook-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Logs Policy
resource "aws_iam_role_policy" "lambda_logs_policy" {
  name = "lambda-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:${var.region}:*:*"
      }
    ]
  })
}

# SQS Policy for Lambda
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "lambda-sqs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.validation_queue.arn,
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.notification_queue.arn,
          aws_sqs_queue.validation_dlq.arn,
          aws_sqs_queue.processing_dlq.arn,
          aws_sqs_queue.notification_dlq.arn
        ]
      }
    ]
  })
}

# X-Ray Policy for Lambda
resource "aws_iam_role_policy" "lambda_xray_policy" {
  count = var.enable_xray ? 1 : 0
  name  = "lambda-xray-policy-${var.environment_suffix}"
  role  = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for API Gateway
resource "aws_iam_role" "api_gateway_role" {
  name = "webhook-api-gateway-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "webhook-api-gateway-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SQS Policy for API Gateway
resource "aws_iam_role_policy" "api_gateway_sqs_policy" {
  name = "api-gateway-sqs-policy-${var.environment_suffix}"
  role = aws_iam_role.api_gateway_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.validation_queue.arn
      }
    ]
  })
}
