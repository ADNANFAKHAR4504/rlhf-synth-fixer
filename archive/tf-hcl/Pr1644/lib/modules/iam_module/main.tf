# IAM Policy Document for VPC Flow Logs
data "aws_iam_policy_document" "flow_logs_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "flow_logs_policy_primary" {
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
      "arn:aws:logs:us-east-1:*:log-group:${var.name_prefix}-vpc-flow-logs-primary",
      "arn:aws:logs:us-east-1:*:log-group:${var.name_prefix}-vpc-flow-logs-primary:*"
    ]
  }
}

data "aws_iam_policy_document" "flow_logs_policy_secondary" {
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
      "arn:aws:logs:eu-west-1:*:log-group:${var.name_prefix}-vpc-flow-logs-secondary",
      "arn:aws:logs:eu-west-1:*:log-group:${var.name_prefix}-vpc-flow-logs-secondary:*"
    ]
  }
}

## Use existing IAM Roles (lookup by name)
data "aws_iam_role" "flow_logs_role_primary" {
  name = "${var.name_prefix}-vpc-flow-logs-role-primary"
}

data "aws_iam_role" "flow_logs_role_secondary" {
  provider = aws.eu_west_1
  name     = "${var.name_prefix}-vpc-flow-logs-role-secondary"
}

# IAM Policy for VPC Flow Logs - Primary Region
resource "aws_iam_role_policy" "flow_logs_policy_primary" {
  name   = "${var.name_prefix}-vpc-flow-logs-policy-primary"
  role   = data.aws_iam_role.flow_logs_role_primary.name
  policy = data.aws_iam_policy_document.flow_logs_policy_primary.json
}

# IAM Policy for VPC Flow Logs - Secondary Region
resource "aws_iam_role_policy" "flow_logs_policy_secondary" {
  provider = aws.eu_west_1
  name     = "${var.name_prefix}-vpc-flow-logs-policy-secondary"
  role     = data.aws_iam_role.flow_logs_role_secondary.name
  policy   = data.aws_iam_policy_document.flow_logs_policy_secondary.json
}