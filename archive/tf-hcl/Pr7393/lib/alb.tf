# Application Load Balancer Configuration
# Optimized health checks and deregistration delays

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ecs-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name       = "ecs-alb-${var.environment_suffix}"
    Service    = "alb"
    CostCenter = "infrastructure"
  }
}

# Target Group for API Service
resource "aws_lb_target_group" "api" {
  name        = "api-tg-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  # Optimized deregistration delay for API service (30 seconds)
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    interval            = 15
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name       = "api-tg-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Worker Service
resource "aws_lb_target_group" "worker" {
  name        = "worker-tg-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  # Longer deregistration delay for worker service (60 seconds)
  deregistration_delay = 60

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    interval            = 15
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name       = "worker-tg-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Scheduler Service
resource "aws_lb_target_group" "scheduler" {
  name        = "scheduler-tg-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  # Standard deregistration delay for scheduler service
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    interval            = 15
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name       = "scheduler-tg-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }

  tags = {
    Name       = "http-listener-${var.environment_suffix}"
    Service    = "alb"
    CostCenter = "infrastructure"
  }
}

# Listener Rules for API Service
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = {
    Name       = "api-rule-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# Listener Rules for Worker Service
resource "aws_lb_listener_rule" "worker" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.worker.arn
  }

  condition {
    path_pattern {
      values = ["/worker/*"]
    }
  }

  tags = {
    Name       = "worker-rule-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# Listener Rules for Scheduler Service
resource "aws_lb_listener_rule" "scheduler" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.scheduler.arn
  }

  condition {
    path_pattern {
      values = ["/scheduler/*"]
    }
  }

  tags = {
    Name       = "scheduler-rule-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }
}
