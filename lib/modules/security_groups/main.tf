# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-lambda-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow PostgreSQL from Lambda"
  }

  # Environment-specific ingress rules
  dynamic "ingress" {
    for_each = var.environment == "dev" ? [1] : []
    content {
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/8"]
      description = "Dev environment: Allow PostgreSQL from private networks"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-rds-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
