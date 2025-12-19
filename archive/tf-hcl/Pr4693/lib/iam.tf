# iam.tf - IAM roles and policies with least privilege

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment_suffix}-lambda-execution-role"

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

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-execution-role"
    }
  )
}

# Lambda policy for DynamoDB access (specific table ARN only)
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.environment_suffix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.user_profiles.arn,
          "${aws_dynamodb_table.user_profiles.arn}/index/*"
        ]
      }
    ]
  })
}

# Lambda policy for CloudWatch Logs (specific log group ARN only)
resource "aws_iam_role_policy" "lambda_logs" {
  name = "${var.environment_suffix}-lambda-logs-policy"
  role = aws_iam_role.lambda_execution.id

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
        Resource = [
          "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.environment_suffix}-api-handler",
          "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.environment_suffix}-api-handler:*"
        ]
      }
    ]
  })
}

# Attach AWS managed policy for X-Ray tracing
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# API Gateway CloudWatch Logs role
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.environment_suffix}-api-gateway-cloudwatch-role"

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

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-gateway-cloudwatch-role"
    }
  )
}

# API Gateway CloudWatch Logs policy
resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${var.environment_suffix}-api-gateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/${var.environment_suffix}-api",
          "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/${var.environment_suffix}-api:*"
        ]
      }
    ]
  })
}
