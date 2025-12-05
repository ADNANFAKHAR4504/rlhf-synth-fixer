terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "lambda_execution_role" { type = string }
variable "source_bucket" { type = string }

resource "aws_security_group" "lambda" {
  name        = "transaction-lambda-sg-${var.region}-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "transaction-lambda-sg-${var.region}-${var.environment_suffix}"
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<EOF
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Transaction processed in ${var.region}'
    }
EOF
    filename = "index.py"
  }
}

resource "aws_s3_object" "lambda_zip" {
  bucket = var.source_bucket
  key    = "lambda/transaction-processor.zip"
  source = data.archive_file.lambda.output_path
  etag   = filemd5(data.archive_file.lambda.output_path)
}

resource "aws_lambda_function" "transaction_processor" {
  function_name = "transaction-processor-${var.region}-${var.environment_suffix}"
  s3_bucket     = var.source_bucket
  s3_key        = aws_s3_object.lambda_zip.key
  role          = var.lambda_execution_role
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 512

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REGION             = var.region
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "transaction-processor-${var.region}-${var.environment_suffix}"
  }
}

output "function_arn" { value = aws_lambda_function.transaction_processor.arn }
output "function_name" { value = aws_lambda_function.transaction_processor.function_name }
