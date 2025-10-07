# Lambda function for triggering Step Functions
resource "aws_lambda_function" "process_trigger" {
  filename         = "${path.module}/lambda_functions/process_trigger.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-process-trigger"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda_functions/process_trigger.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.receipt_processing.arn
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-process-trigger"
  })
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.receipts.arn
}

# Lambda function for OCR processing
resource "aws_lambda_function" "ocr_processor" {
  filename                       = "${path.module}/lambda_functions/ocr_processor.zip"
  function_name                  = "${var.project_name}-${var.environment_suffix}-ocr-processor"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("${path.module}/lambda_functions/ocr_processor.zip")
  runtime                        = "python3.10"
  timeout                        = var.lambda_timeout
  memory_size                    = var.lambda_memory
  reserved_concurrent_executions = 10

  environment {
    variables = {
      RECEIPTS_BUCKET = aws_s3_bucket.receipts.id
      DLQ_URL         = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-ocr-processor"
  })
}

# Lambda function for category detection
resource "aws_lambda_function" "category_detector" {
  filename                       = "${path.module}/lambda_functions/category_detector.zip"
  function_name                  = "${var.project_name}-${var.environment_suffix}-category-detector"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "index.handler"
  source_code_hash               = filebase64sha256("${path.module}/lambda_functions/category_detector.zip")
  runtime                        = "python3.10"
  timeout                        = 60
  memory_size                    = 512
  reserved_concurrent_executions = 10

  environment {
    variables = {
      DLQ_URL = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-category-detector"
  })
}

# Lambda function for saving expense records
resource "aws_lambda_function" "expense_saver" {
  filename         = "${path.module}/lambda_functions/expense_saver.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-expense-saver"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda_functions/expense_saver.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      EXPENSES_TABLE = aws_dynamodb_table.expenses.name
      DLQ_URL        = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-expense-saver"
  })
}