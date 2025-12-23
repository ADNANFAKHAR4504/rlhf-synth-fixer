# alb.tf - Application Load Balancer configuration

# ACM certificate for ALB HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = "payment-processing-${var.environment_suffix}.example.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.payment-processing-${var.environment_suffix}.example.com"
  ]

  tags = {
    Name           = "acm-cert-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [subject_alternative_names]
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = var.environment_suffix == "prod" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name           = "alb-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  lifecycle {
    ignore_changes = all
  }
}

# Target Group - Blue Environment
resource "aws_lb_target_group" "blue" {
  name        = "tg-blue-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-blue-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Blue"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Target Group - Green Environment
resource "aws_lb_target_group" "green" {
  name        = "tg-green-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-green-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Green"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# HTTP Listener - ✅ IMPROVED: Now redirects to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ✅ SECURITY FIX: HTTPS Listener enabled for production compliance
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  lifecycle {
    # Allow switching between blue/green without recreation
    ignore_changes = [default_action]
  }
}
