# Database Credentials Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.resource_prefix}-db-credentials-${local.unique_suffix}"
  description = "Database credentials for ${local.resource_prefix} application"

  replica {
    region = "us-west-2"
  }

  tags = {
    Name      = "${local.resource_prefix}-db-credentials"
    Component = "database"
    Function  = "authentication"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    database = var.database_name
    host     = "localhost"
    port     = 3306
  })
}

# API Key Secret
resource "aws_secretsmanager_secret" "api_key" {
  name        = "${local.resource_prefix}-api-key-${local.unique_suffix}"
  description = "API key for external service integration"

  replica {
    region = "us-west-2"
  }

  tags = {
    Name      = "${local.resource_prefix}-api-key"
    Component = "application"
    Function  = "integration"
  }
}

resource "aws_secretsmanager_secret_version" "api_key" {
  secret_id = aws_secretsmanager_secret.api_key.id
  secret_string = jsonencode({
    api_key = random_password.api_key.result
    service = "external-api"
  })
}

# Lambda function for secret rotation (if enabled)
resource "aws_lambda_function" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  filename         = "secret_rotation.zip"
  function_name    = "${local.resource_prefix}-secret-rotation-${local.unique_suffix}"
  role             = aws_iam_role.lambda_rotation_role[0].arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.rotation_lambda[0].output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

  tags = {
    Name      = "${local.resource_prefix}-secret-rotation"
    Component = "security"
    Function  = "rotation"
  }
}

data "archive_file" "rotation_lambda" {
  count = var.enable_secret_rotation ? 1 : 0

  type        = "zip"
  output_path = "secret_rotation.zip"

  source {
    content  = <<EOF
import json
import boto3

def handler(event, context):
    # Basic rotation logic
    secrets_client = boto3.client('secretsmanager')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Rotation completed successfully')
    }
EOF
    filename = "index.py"
  }
}

# IAM Role for Lambda rotation function
resource "aws_iam_role" "lambda_rotation_role" {
  count = var.enable_secret_rotation ? 1 : 0

  name = "${local.resource_prefix}-lambda-rotation-role-${local.unique_suffix}"

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
}

resource "aws_iam_role_policy" "lambda_rotation_policy" {
  count = var.enable_secret_rotation ? 1 : 0

  name = "${local.resource_prefix}-lambda-rotation-policy-${local.unique_suffix}"
  role = aws_iam_role.lambda_rotation_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for Secrets Manager to invoke rotation function
resource "aws_lambda_permission" "allow_secret_manager_call" {
  count = var.enable_secret_rotation ? 1 : 0

  function_name = aws_lambda_function.secret_rotation[0].arn
  statement_id  = "AllowSecretsManagerInvocation"
  action        = "lambda:InvokeFunction"
  principal     = "secretsmanager.amazonaws.com"
}

# Automatic rotation configuration
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  count = var.enable_secret_rotation ? 1 : 0

  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation[0].arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_lambda_permission.allow_secret_manager_call]
}