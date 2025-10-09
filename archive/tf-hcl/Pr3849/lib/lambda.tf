# Lambda function for processing payments
resource "aws_lambda_function" "process_payment" {
  filename         = data.archive_file.process_payment.output_path
  function_name    = "${var.project_name}-process-payment-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.process_payment.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE      = aws_dynamodb_table.subscriptions.name
      SECRETS_MANAGER_ARN = aws_secretsmanager_secret.payment_gateway.arn
      ENVIRONMENT         = local.env_suffix
    }
  }

  tags = {
    Name        = "${var.project_name}-process-payment"
    Environment = local.env_suffix
  }
}

data "archive_file" "process_payment" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/process_payment.zip"
  source {
    content  = file("${path.module}/lambda/process_payment.js")
    filename = "index.js"
  }
}

# Lambda function for generating receipts
resource "aws_lambda_function" "generate_receipt" {
  filename         = data.archive_file.generate_receipt.output_path
  function_name    = "${var.project_name}-generate-receipt-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.generate_receipt.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      S3_BUCKET   = aws_s3_bucket.receipts.id
      ENVIRONMENT = local.env_suffix
    }
  }

  tags = {
    Name        = "${var.project_name}-generate-receipt"
    Environment = local.env_suffix
  }
}

data "archive_file" "generate_receipt" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/generate_receipt.zip"
  source {
    content  = file("${path.module}/lambda/generate_receipt.js")
    filename = "index.js"
  }
}

# Lambda function for sending emails
resource "aws_lambda_function" "send_email" {
  filename         = data.archive_file.send_email.output_path
  function_name    = "${var.project_name}-send-email-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.send_email.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SENDER_EMAIL          = var.sender_email
      SES_CONFIGURATION_SET = aws_ses_configuration_set.receipts.name
      S3_BUCKET             = aws_s3_bucket.receipts.id
      ENVIRONMENT           = local.env_suffix
    }
  }

  tags = {
    Name        = "${var.project_name}-send-email"
    Environment = local.env_suffix
  }
}

data "archive_file" "send_email" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/send_email.zip"
  source {
    content  = file("${path.module}/lambda/send_email.js")
    filename = "index.js"
  }
}

# Lambda function for webhook handler
resource "aws_lambda_function" "webhook_handler" {
  filename         = data.archive_file.webhook_handler.output_path
  function_name    = "${var.project_name}-webhook-handler-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.webhook_handler.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.renewal_workflow.arn
      ENVIRONMENT       = local.env_suffix
    }
  }

  tags = {
    Name        = "${var.project_name}-webhook-handler"
    Environment = local.env_suffix
  }
}

data "archive_file" "webhook_handler" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/webhook_handler.zip"
  source {
    content  = file("${path.module}/lambda/webhook_handler.js")
    filename = "index.js"
  }
}

resource "aws_lambda_permission" "apigateway_webhook" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.subscription_api.execution_arn}/*/*"
}

# Grant Step Functions permission to invoke Lambda
resource "aws_iam_role_policy" "stepfunctions_invoke_lambda" {
  name = "${var.project_name}-stepfunctions-invoke-lambda-${local.env_suffix}"
  role = aws_iam_role.stepfunctions_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.webhook_handler.arn
        ]
      }
    ]
  })
}
