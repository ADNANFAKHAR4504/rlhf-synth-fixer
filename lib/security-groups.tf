# security-groups.tf - Security groups for application components

# ALB security group
resource "aws_security_group" "alb" {
  name_prefix = "payment-alb-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet (redirect to HTTPS)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name       = "payment-alb-sg-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ECS tasks security group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "payment-ecs-tasks-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name       = "payment-ecs-tasks-sg-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Aurora database security group
resource "aws_security_group" "aurora" {
  name_prefix = "payment-aurora-${var.environment_suffix}-"
  description = "Security group for Aurora MySQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "MySQL from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name       = "payment-aurora-sg-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}
