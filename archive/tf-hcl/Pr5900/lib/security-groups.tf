# Security Group for Internal ALB
resource "aws_security_group" "alb" {
  name_prefix = "fintech-alb-${var.environment_suffix}-"
  description = "Security group for internal ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintech-alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Services
resource "aws_security_group" "ecs_services" {
  name_prefix = "fintech-ecs-${var.environment_suffix}-"
  description = "Security group for ECS services"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Port 8080 from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Port 8080 from same security group (inter-service communication)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintech-ecs-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
