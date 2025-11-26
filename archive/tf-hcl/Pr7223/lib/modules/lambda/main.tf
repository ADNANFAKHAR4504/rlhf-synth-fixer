resource "aws_iam_role" "lambda" {
  name_prefix = "${substr(var.name_prefix, 0, 20)}-lambda-"

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
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3" {
  name_prefix = "${substr(var.name_prefix, 0, 20)}-lambda-s3-"
  role        = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${var.s3_bucket_arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "processor" {
  filename         = "${path.module}/function.zip"
  function_name    = "${var.name_prefix}-data-processor"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/function.zip")
  runtime          = "python3.9"
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = {
      ENVIRONMENT = var.environment
      BUCKET_NAME = var.bucket_name
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-data-processor"
    }
  )
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.processor.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-logs"
    }
  )
}
