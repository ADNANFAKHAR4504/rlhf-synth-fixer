# tagging.tf - Tag enforcement policies
# Note: Organization tag policies require AWS Organizations admin access

# Tag policy for mandatory tags
resource "aws_organizations_policy" "tagging" {
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-mandatory-tags"
  description = "Enforce mandatory tags on all resources"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = var.allowed_environments
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "ec2:snapshot",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer",
            "elasticloadbalancing:targetgroup"
          ]
        }
      }
      Owner = {
        tag_key = {
          "@@assign" = "Owner"
        }
        tag_value = {
          "@@assign" = ["*"]
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "rds:db",
            "s3:bucket",
            "lambda:function"
          ]
        }
      }
      CostCenter = {
        tag_key = {
          "@@assign" = "CostCenter"
        }
        tag_value = {
          "@@assign" = var.cost_centers
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer"
          ]
        }
      }
    }
  })
}

# Attach tag policy to organizational units
resource "aws_organizations_policy_attachment" "tagging" {
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.tagging[0].id
  target_id = var.target_organizational_units[count.index]
}

# Lambda function for auto-tagging resources
resource "aws_iam_role" "auto_tagging_lambda" {
  count = var.enable_auto_tagging ? 1 : 0
  name  = "${local.name_prefix}-auto-tagging-lambda-role"

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

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda execution policy
resource "aws_iam_policy" "auto_tagging_lambda" {
  count       = var.enable_auto_tagging ? 1 : 0
  name        = "${local.name_prefix}-auto-tagging-lambda-policy"
  description = "Policy for auto-tagging Lambda function"

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSecurityGroups",
          "rds:AddTagsToResource",
          "rds:DescribeDBInstances",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "auto_tagging_lambda" {
  count      = var.enable_auto_tagging ? 1 : 0
  role       = aws_iam_role.auto_tagging_lambda[0].name
  policy_arn = aws_iam_policy.auto_tagging_lambda[0].arn
}

# Lambda function for auto-tagging
resource "aws_lambda_function" "auto_tagging" {
  count         = var.enable_auto_tagging ? 1 : 0
  filename      = data.archive_file.auto_tagging_lambda[0].output_path
  function_name = "${local.name_prefix}-auto-tagging"
  role          = aws_iam_role.auto_tagging_lambda[0].arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60

  environment {
    variables = {
      DEFAULT_TAGS = jsonencode(local.mandatory_tags)
    }
  }

  tags = local.mandatory_tags
}

# CloudWatch Events rule for auto-tagging
resource "aws_cloudwatch_event_rule" "auto_tagging" {
  count       = var.enable_auto_tagging ? 1 : 0
  name        = "${local.name_prefix}-auto-tagging"
  description = "Trigger auto-tagging Lambda on resource creation"

  event_pattern = jsonencode({
    source      = ["aws.ec2", "aws.rds", "aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "RunInstances",
        "CreateVolume",
        "CreateSecurityGroup",
        "CreateDBInstance",
        "CreateBucket"
      ]
    }
  })

  tags = local.mandatory_tags
}

# CloudWatch Events target
resource "aws_cloudwatch_event_target" "auto_tagging" {
  count     = var.enable_auto_tagging ? 1 : 0
  rule      = aws_cloudwatch_event_rule.auto_tagging[0].name
  target_id = "AutoTaggingLambda"
  arn       = aws_lambda_function.auto_tagging[0].arn
}

# Permission for CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "auto_tagging" {
  count         = var.enable_auto_tagging ? 1 : 0
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_tagging[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.auto_tagging[0].arn
}

# Archive file for Lambda
data "archive_file" "auto_tagging_lambda" {
  count       = var.enable_auto_tagging ? 1 : 0
  type        = "zip"
  source_file = "${path.module}/lambda/auto-tagging.py"
  output_path = "${path.module}/auto-tagging-lambda.zip"
}