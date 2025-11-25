# IAM Role for Trigger Lambda
resource "aws_iam_role" "trigger_lambda_role" {
  name = "trigger-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name = "trigger-lambda-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "trigger_lambda_policy" {
  name = "trigger-lambda-policy"
  role = aws_iam_role.trigger_lambda_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/trigger-reconciliation-*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.reconciliation_workflow.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reconciliation_data.arn}/*"
      }
    ]
  })
}

# IAM Role for Processing Lambdas
resource "aws_iam_role" "processing_lambda_role" {
  name = "processing-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name = "processing-lambda-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "processing_lambda_policy" {
  name = "processing-lambda-policy"
  role = aws_iam_role.processing_lambda_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/*-${var.environment_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reconciliation_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.transaction_records.arn,
          aws_dynamodb_table.reconciliation_results.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.reconciliation_notifications.arn
      }
    ]
  })
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions_role" {
  name = "step-functions-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "step-functions-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "step_functions_policy" {
  name = "step-functions-policy"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.file_parser.arn,
          aws_lambda_function.transaction_validator.arn,
          aws_lambda_function.report_generator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.reconciliation_notifications.arn
      }
    ]
  })
}
