# alb.tf - Application Load Balancer configuration

# ACM certificate for ALB HTTPS
# Note: For production, DNS validation should be configured with Route53
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

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name           = "alb-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
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
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-blue-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "blue"
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
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-green-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "green"
  }
}

# HTTPS Listener - Commented out for testing without Route53 DNS validation
# Uncomment and configure Route53 validation records for production use
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = aws_acm_certificate.main.arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.blue.arn
#   }
# }

# HTTP Listener - For testing without HTTPS/ACM
# In production, this should redirect to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
}

# Listener Rule for Blue-Green switching (controlled by variable)
# Updated to use HTTP listener for testing
resource "aws_lb_listener_rule" "traffic_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = var.active_environment == "green" ? aws_lb_target_group.green.arn : aws_lb_target_group.blue.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}
