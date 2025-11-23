# monitoring.tf - VPC Flow Logs and monitoring configuration

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = local.flow_logs_log_group_name
  retention_in_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.flow_logs_name}-log-group"
    Type = "cloudwatch-log-group"
  })
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = local.flow_logs_role_name

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

  tags = merge(local.common_tags, {
    Name = local.flow_logs_role_name
    Type = "iam-role"
  })
}

# IAM policy for VPC Flow Logs to write to CloudWatch
resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = local.flow_logs_policy_name
  role = aws_iam_role.vpc_flow_logs[0].id

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
        Effect = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.vpc_flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = local.flow_logs_name
    Type = "vpc-flow-logs"
  })

  depends_on = [
    aws_vpc.main,
    aws_cloudwatch_log_group.vpc_flow_logs,
    aws_iam_role_policy.vpc_flow_logs
  ]
}