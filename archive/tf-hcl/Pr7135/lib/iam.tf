# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_fraud_detector" {
  name = "fraud-detector-lambda-role-${var.environment_suffix}"

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
    Name = "fraud-detector-lambda-role-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda - DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "fraud-detector-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.fraud_patterns.arn
      },
      {
        Effect   = "Deny"
        Action   = "dynamodb:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "dynamodb:ResourceTag/Service" = "FraudDetection"
          }
        }
      }
    ]
  })
}

# IAM Policy for Lambda - S3 Access
resource "aws_iam_role_policy" "lambda_s3" {
  name = "fraud-detector-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.audit_trail.arn}/*"
      },
      {
        Effect   = "Deny"
        Action   = "s3:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:ResourceTag/Service" = "FraudDetection"
          }
        }
      }
    ]
  })
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs" {
  name = "fraud-detector-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_fraud_detector.arn}:*"
      }
    ]
  })
}

# IAM Policy for Lambda - SQS DLQ
resource "aws_iam_role_policy" "lambda_sqs" {
  name = "fraud-detector-sqs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection_dlq.arn
      }
    ]
  })
}

# IAM Policy for Lambda - KMS
resource "aws_iam_role_policy" "lambda_kms" {
  name = "fraud-detector-kms-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.fraud_detection.arn
      }
    ]
  })
}

# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "fraud-detector-api-gateway-logs-${var.environment_suffix}"

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
    Name = "fraud-detector-api-gateway-logs-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name = "fraud-detector-eventbridge-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "fraud-detector-eventbridge-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "eventbridge_lambda" {
  name = "fraud-detector-eventbridge-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.fraud_detector.arn
      }
    ]
  })
}
