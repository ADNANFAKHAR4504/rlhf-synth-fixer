# Internal Application Load Balancer
resource "aws_lb" "internal" {
  name               = "fintech-alb-${var.environment_suffix}"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.private[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "fintech-internal-alb-${var.environment_suffix}"
  }
}

# Target Group for Payment Service
resource "aws_lb_target_group" "payment_service" {
  name_prefix          = "pay-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "payment-service-tg-${var.environment_suffix}"
    Service = "payment-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Auth Service
resource "aws_lb_target_group" "auth_service" {
  name_prefix          = "auth-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/auth/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "auth-service-tg-${var.environment_suffix}"
    Service = "auth-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Analytics Service
resource "aws_lb_target_group" "analytics_service" {
  name_prefix          = "anlyt-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/analytics/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }

  tags = {
    Name    = "analytics-service-tg-${var.environment_suffix}"
    Service = "analytics-service"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Service not found"
      status_code  = "404"
    }
  }

  tags = {
    Name = "fintech-alb-listener-${var.environment_suffix}"
  }
}

# Listener Rules for routing
resource "aws_lb_listener_rule" "payment_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_service.arn
  }

  condition {
    path_pattern {
      values = ["/payment/*", "/health"]
    }
  }

  tags = {
    Name    = "payment-service-rule-${var.environment_suffix}"
    Service = "payment-service"
  }
}

resource "aws_lb_listener_rule" "auth_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth_service.arn
  }

  condition {
    path_pattern {
      values = ["/auth/*"]
    }
  }

  tags = {
    Name    = "auth-service-rule-${var.environment_suffix}"
    Service = "auth-service"
  }
}

resource "aws_lb_listener_rule" "analytics_service" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.analytics_service.arn
  }

  condition {
    path_pattern {
      values = ["/analytics/*"]
    }
  }

  tags = {
    Name    = "analytics-service-rule-${var.environment_suffix}"
    Service = "analytics-service"
  }
}
