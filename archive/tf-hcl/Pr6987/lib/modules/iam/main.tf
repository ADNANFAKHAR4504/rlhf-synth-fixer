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