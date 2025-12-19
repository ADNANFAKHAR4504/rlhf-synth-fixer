# Generate random password for database
resource "random_password" "master_password" {
  length  = 16
  special = true
  # Override special characters to avoid issues with some databases
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Secret for primary region
resource "aws_secretsmanager_secret" "primary_db" {
  name                    = "rds-master-password-primary-${var.environment_suffix}"
  description             = "Master password for RDS Aurora in ${var.primary_region}"
  recovery_window_in_days = 7

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-secret-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_secretsmanager_secret_version" "primary_db" {
  secret_id = aws_secretsmanager_secret.primary_db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.primary.endpoint
    port     = aws_rds_cluster.primary.port
    dbname   = var.database_name
  })
}

# Secret rotation Lambda execution role
resource "aws_iam_role" "secret_rotation" {
  name = "secret-rotation-lambda-${var.environment_suffix}"

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
    var.common_tags,
    {
      Name = "secret-rotation-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "secret_rotation_basic" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "secret_rotation_vpc" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "secret_rotation" {
  name = "secret-rotation-policy-${var.environment_suffix}"
  role = aws_iam_role.secret_rotation.id

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
          aws_secretsmanager_secret.primary_db.arn,
          aws_secretsmanager_secret.secondary_db.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      }
    ]
  })
}

# Secret for secondary region
resource "aws_secretsmanager_secret" "secondary_db" {
  provider                = aws.secondary
  name                    = "rds-master-password-secondary-${var.environment_suffix}"
  description             = "Master password for RDS Aurora in ${var.secondary_region}"
  recovery_window_in_days = 7

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-secret-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_secretsmanager_secret_version" "secondary_db" {
  provider  = aws.secondary
  secret_id = aws_secretsmanager_secret.secondary_db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.secondary.endpoint
    port     = aws_rds_cluster.secondary.port
    dbname   = var.database_name
  })
}
