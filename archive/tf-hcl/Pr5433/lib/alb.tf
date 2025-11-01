# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
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
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "app-alb-${var.environment_suffix}"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name           = "app-alb-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}

# Target group for blue environment
resource "aws_lb_target_group" "blue" {
  name     = "blue-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name            = "blue-tg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    DeploymentColor = "blue"
  }
}

# Target group for green environment
resource "aws_lb_target_group" "green" {
  name     = "green-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name            = "green-tg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    DeploymentColor = "green"
  }
}

# Register instances with blue target group (active)
resource "aws_lb_target_group_attachment" "blue" {
  for_each = aws_instance.app_server

  target_group_arn = aws_lb_target_group.blue.arn
  target_id        = each.value.id
  port             = 80
}

# HTTP listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = {
    Name           = "http-listener-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}
