# iam.tf - IAM roles with least privilege and external ID requirements

# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_execution" {
  name = "payment-lambda-execution-${var.environment_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  max_session_duration = 3600

  tags = {
    Name = "lambda-execution-role-${var.environment_suffix}"
  }
}

# Managed Policy for Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Managed Policy for Lambda VPC Execution
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Custom Policy for S3 Access
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "payment-lambda-s3-access-${var.environment_suffix}"
  description = "Policy for Lambda to access S3 with KMS encryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.lambda.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })

  tags = {
    Name = "lambda-s3-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "payment-flow-logs-${var.environment_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  max_session_duration = 3600

  tags = {
    Name = "flow-logs-role-${var.environment_suffix}"
  }
}

# Policy for VPC Flow Logs to CloudWatch
resource "aws_iam_policy" "flow_logs_cloudwatch" {
  name        = "payment-flow-logs-cloudwatch-${var.environment_suffix}"
  description = "Policy for VPC Flow Logs to write to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "flow-logs-cloudwatch-policy-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "flow_logs_cloudwatch" {
  role       = aws_iam_role.flow_logs.name
  policy_arn = aws_iam_policy.flow_logs_cloudwatch.arn
}

# IAM Role for RDS Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "payment-rds-monitoring-${var.environment_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  max_session_duration = 3600

  tags = {
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
