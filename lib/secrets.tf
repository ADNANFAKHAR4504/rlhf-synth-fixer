# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "${local.resource_prefix}-db-credentials-${local.suffix}"
  description             = "Database credentials with automatic rotation"
  kms_key_id              = null # LocalStack: KMS encryption disabled due to compatibility issues
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-db-credentials-${local.suffix}"
    DataClassification = "PII"
    Purpose            = "database-credentials"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Initial secret value
resource "aws_secretsmanager_secret_version" "database_credentials_initial" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = "localhost"
    port     = 5432
    dbname   = "production"
  })

  lifecycle {
    ignore_changes = [
      secret_string,
      version_stages
    ]
    prevent_destroy = false
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Lambda function for secret rotation
resource "aws_lambda_function" "secret_rotation" {
  filename         = "${path.module}/lambda/secret_rotation.zip"
  function_name    = "${local.resource_prefix}-rotation-${local.suffix}"
  role             = aws_iam_role.secrets_rotation.arn
  handler          = "secret_rotation.lambda_handler"
  source_code_hash = data.archive_file.secret_rotation.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.primary_region}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-rotation-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "secret-rotation"
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_rotation
  ]
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${local.resource_prefix}-lambda-${local.suffix}"
  description = "Security group for Lambda rotation function"
  vpc_id      = local.vpc_id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to AWS services"
  }

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-lambda-sg-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"

  lifecycle {
    prevent_destroy = false
  }
}

# Rotation configuration
resource "aws_secretsmanager_secret_rotation" "database_credentials" {
  secret_id           = aws_secretsmanager_secret.database_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = var.secret_rotation_days
  }

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_lambda_permission.secrets_manager
  ]
}

# Archive Lambda function code
data "archive_file" "secret_rotation" {
  type        = "zip"
  source_file = "${path.module}/lambda/secret_rotation.py"
  output_path = "${path.module}/lambda/secret_rotation.zip"
}
