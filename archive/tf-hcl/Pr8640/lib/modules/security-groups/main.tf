resource "aws_security_group" "ecs_tasks" {
  name        = "ecs-tasks-sg-${var.environment}-${var.environment_suffix}"
  description = "Security group for ECS tasks in ${var.environment} environment"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ecs-tasks-sg-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment}-${var.environment_suffix}"
  description = "Security group for ALB in ${var.environment} environment"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "alb-sg-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
