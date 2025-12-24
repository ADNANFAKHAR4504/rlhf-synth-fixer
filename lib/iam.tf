# IAM roles created ONLY in us-east-1 (primary region)
# Referenced cross-region using data sources

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  provider = aws.iam
  name     = "${local.resource_prefix}-lambda-execution-role"

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
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-execution-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  provider   = aws.iam
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  provider   = aws.iam
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  provider = aws.iam
  name     = "${local.resource_prefix}-lambda-dynamodb-policy"
  role     = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 replication role
resource "aws_iam_role" "s3_replication" {
  provider = aws.iam
  name     = "${local.resource_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-s3-replication-role"
    }
  )
}

resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.iam
  name     = "${local.resource_prefix}-s3-replication-policy"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:ViaService" = [
              "s3.us-east-1.amazonaws.com",
              "s3.eu-west-1.amazonaws.com"
            ]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:ViaService" = [
              "s3.us-east-1.amazonaws.com",
              "s3.eu-west-1.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# API Gateway CloudWatch role
resource "aws_iam_role" "apigateway_cloudwatch" {
  provider = aws.iam
  name     = "${local.resource_prefix}-apigateway-cloudwatch-role"

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
    local.common_tags,
    {
      Name = "${local.resource_prefix}-apigateway-cloudwatch-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "apigateway_cloudwatch" {
  provider   = aws.iam
  role       = aws_iam_role.apigateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Data sources to reference IAM roles in other regions
data "aws_iam_role" "lambda_execution" {
  provider = aws.primary
  name     = aws_iam_role.lambda_execution.name
}

data "aws_iam_role" "s3_replication" {
  provider = aws.primary
  name     = aws_iam_role.s3_replication.name
}

data "aws_iam_role" "apigateway_cloudwatch" {
  provider = aws.primary
  name     = aws_iam_role.apigateway_cloudwatch.name
}
