# CloudWatch Log Group for VPC Flow Logs
# Use random_id to ensure unique naming across deployments
resource "random_id" "log_group_suffix" {
  byte_length = 4
  keepers = {
    environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/payment-gateway-${var.environment_suffix}-${random_id.log_group_suffix.hex}"
  retention_in_days = 30

  tags = {
    Name        = "vpc-flow-logs-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "payment-gateway-flowlogs-${var.environment_suffix}-${random_id.log_group_suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "payment-flow-logs-role-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "payment-gateway-flowlogs-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "payment_vpc" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.payment_vpc.id

  tags = {
    Name        = "vpc-flow-log-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}
