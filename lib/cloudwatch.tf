# CloudWatch Log Group for Lambda rotation function
resource "aws_cloudwatch_log_group" "lambda_rotation" {
  name              = "/aws/lambda/${local.resource_prefix}-rotation-${local.suffix}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-lambda-logs-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "lambda-logging"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.resource_prefix}-flow-logs-${local.suffix}"
  retention_in_days = var.cloudwatch_logs_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-logs-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "vpc-flow-logging"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name               = "${local.resource_prefix}-vpc-flow-logs-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_assume.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-flow-logs-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name   = "${local.resource_prefix}-vpc-flow-logs-policy-${local.suffix}"
  role   = aws_iam_role.vpc_flow_logs.id
  policy = data.aws_iam_policy_document.vpc_flow_logs_policy.json

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]

    resources = [
      aws_cloudwatch_log_group.vpc_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
    ]
  }
}

# VPC Flow Logs
resource "aws_flow_log" "security_vpc" {
  count = var.vpc_id == "" ? 1 : 0

  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.security[0].id
  # max_aggregation_interval not supported by LocalStack

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-flow-log-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}
