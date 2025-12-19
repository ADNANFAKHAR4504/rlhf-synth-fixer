# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "s3-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment}-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "PostgreSQL from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "lambda-${var.environment}-${var.environment_suffix}-"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}