# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-microservices-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "alb-microservices-${var.environment_suffix}"
  }
}

# Target Groups for each microservice
resource "aws_lb_target_group" "services" {
  for_each = var.service_config

  name        = substr("tg-${each.key}-${var.environment_suffix}", 0, 32)
  port        = each.value.port
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
    Name    = "tg-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
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
    Name = "listener-http-${var.environment_suffix}"
  }
}

# Listener Rules for path-based routing
resource "aws_lb_listener_rule" "services" {
  for_each = var.service_config

  listener_arn = aws_lb_listener.http.arn
  priority     = 100 + index(keys(var.service_config), each.key)

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = [each.value.path]
    }
  }

  tags = {
    Name    = "rule-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}
