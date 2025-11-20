data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name = var.role_name
  }
}

# VPC Access Policy
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB Access Policy
data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [var.dynamodb_table_arn]
  }
}

resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.role_name}-dynamodb-access"
  description = "Allow Lambda to access DynamoDB"
  policy      = data.aws_iam_policy_document.dynamodb_access.json
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Aurora Access Policy
data "aws_iam_policy_document" "aurora_access" {
  statement {
    effect = "Allow"
    actions = [
      "rds:DescribeDBClusters",
      "rds:DescribeDBInstances"
    ]
    resources = var.aurora_cluster_arns
  }
}

resource "aws_iam_policy" "aurora_access" {
  name        = "${var.role_name}-aurora-access"
  description = "Allow Lambda to describe Aurora clusters"
  policy      = data.aws_iam_policy_document.aurora_access.json
}

resource "aws_iam_role_policy_attachment" "lambda_aurora" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.aurora_access.arn
}
