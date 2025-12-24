# lambda.tf - Lambda function with VPC configuration and encrypted environment variables

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "lambda-${var.environment_suffix}-"
  description = "Security group for Lambda payment processor"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS to VPC Endpoints"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "lambda-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group Rule for Lambda to access RDS
resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "egress"
  description              = "PostgreSQL to RDS"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  security_group_id        = aws_security_group.lambda.id
}

# Lambda Function for Payment Processing
resource "aws_lambda_function" "payment_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "payment-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST           = aws_db_instance.postgres.address
      DB_NAME           = aws_db_instance.postgres.db_name
      DB_USER           = var.db_username
      S3_BUCKET         = aws_s3_bucket.data.id
      ENCRYPTION_KEY_ID = aws_kms_key.lambda.key_id
    }
  }

  kms_key_arn = aws_kms_key.lambda.arn

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = {
    Name = "payment-processor-${var.environment_suffix}"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc
  ]
}

# Lambda Function Code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda/payment_processor.py")
    filename = "index.py"
  }
}

# Dead Letter Queue for Lambda
resource "aws_sqs_queue" "dlq" {
  name                              = "payment-dlq-${var.environment_suffix}"
  message_retention_seconds         = 1209600
  kms_master_key_id                 = aws_kms_key.s3.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name = "payment-dlq-${var.environment_suffix}"
  }
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.lambda.arn}:*"
}
