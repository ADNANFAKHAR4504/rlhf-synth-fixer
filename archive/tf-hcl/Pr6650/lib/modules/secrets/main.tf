# Random password generation for RDS
resource "random_password" "db_master_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# AWS Secrets Manager Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix = "rds-credentials-${var.environment_suffix}-"
  description = "RDS Aurora database master credentials"

  tags = {
    Name        = "secret-rds-${var.environment_suffix}"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Note: Automatic rotation would require a Lambda function
# This is a placeholder for rotation configuration
# In production, you would add:
# resource "aws_secretsmanager_secret_rotation" "db_credentials" {
#   secret_id           = aws_secretsmanager_secret.db_credentials.id
#   rotation_lambda_arn = aws_lambda_function.rotate_secret.arn
#   rotation_rules {
#     automatically_after_days = 30
#   }
# }

# Store the credentials in Secrets Manager
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_master_password.result
    engine   = "mysql"
    host     = var.rds_endpoint
    port     = 3306
    dbname   = var.database_name
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM Role for Lambda rotation function (if needed)
resource "aws_iam_role" "rotation_lambda" {
  count = var.enable_rotation ? 1 : 0

  name_prefix = "SecretsManagerRotation-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "role-secrets-rotation-${var.environment_suffix}"
    Environment = var.environment
  }
}

# Policy for rotation Lambda
resource "aws_iam_role_policy" "rotation_lambda" {
  count = var.enable_rotation ? 1 : 0

  name_prefix = "SecretsManagerRotationPolicy-"
  role        = aws_iam_role.rotation_lambda[0].id

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
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBCluster",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach VPC execution policy if rotation is enabled
resource "aws_iam_role_policy_attachment" "rotation_lambda_vpc" {
  count      = var.enable_rotation ? 1 : 0
  role       = aws_iam_role.rotation_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Data source to retrieve the secret value
data "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  depends_on = [aws_secretsmanager_secret_version.db_credentials]
}