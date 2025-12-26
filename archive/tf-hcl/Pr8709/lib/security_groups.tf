# security_groups.tf - Security group definitions

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "alb-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name        = "ecs-sg-${var.environment_suffix}"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "ecs-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from ECS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = concat(
      [aws_security_group.ecs.id],
      var.enable_dms ? [aws_security_group.dms[0].id] : []
    )
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "rds-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Security Group
resource "aws_security_group" "dms" {
  count = var.enable_dms ? 1 : 0

  name        = "dms-sg-${var.environment_suffix}"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name           = "dms-sg-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}
