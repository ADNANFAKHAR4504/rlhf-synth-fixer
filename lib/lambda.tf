# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment}-lambda-sg-${var.aws_region}"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-sg-${var.aws_region}"
  }
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename         = "lambda.zip"
  function_name    = "${var.project_name}-${var.environment}-api-${var.aws_region}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.endpoint
      DB_NAME     = aws_db_instance.main.db_name
      DB_USERNAME = aws_db_instance.main.username
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-${var.aws_region}"
  }
}

# Create a basic lambda.zip file (placeholder)
resource "null_resource" "lambda_zip" {
  provisioner "local-exec" {
    command = <<EOF
cat > index.py << 'LAMBDA'
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }
LAMBDA
zip lambda.zip index.py
rm index.py
EOF
  }

  triggers = {
    always_run = timestamp()
  }
}
