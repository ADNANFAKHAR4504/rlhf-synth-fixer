# Security Team Role
resource "aws_iam_role" "security_team" {
  name = "SecurityTeamRole-${local.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-team-role-${local.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "security_team_policy" {
  name = "SecurityTeamPolicy"
  role = aws_iam_role.security_team.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "securityhub:Get*",
          "securityhub:List*",
          "securityhub:Describe*",
          "guardduty:Get*",
          "guardduty:List*",
          "cloudtrail:Get*",
          "cloudtrail:Describe*",
          "cloudtrail:LookupEvents",
          "logs:Get*",
          "logs:Describe*",
          "logs:FilterLogEvents",
          "s3:GetObject",
          "s3:ListBucket",
          "sns:Get*",
          "sns:List*",
          "events:List*",
          "events:Describe*",
          "lambda:Get*",
          "lambda:List*",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "CustomRulesLambdaExecutionRole-${local.environment_suffix}"

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
      Name = "lambda-execution-role-${local.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_custom_policy" {
  name = "CustomRulesProcessorPolicy"
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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.security_key.arn
      }
    ]
  })
}

# CloudTrail CloudWatch Role
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "CloudTrailCloudWatchRole-${local.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-cloudwatch-role"
    }
  )
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "CloudTrailCloudWatchPolicy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.cloudtrail.name}:*"
      }
    ]
  })
}