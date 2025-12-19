# Application Load Balancer
resource "aws_lb" "main" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name        = "payment-alb-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Target Group for Blue Environment
resource "aws_lb_target_group" "blue" {
  name        = "payment-blue-tg-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
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
    Name        = "payment-blue-tg-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "blue"
  }
}

# Target Group for Green Environment
resource "aws_lb_target_group" "green" {
  name        = "payment-green-tg-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
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
    Name        = "payment-green-tg-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "green"
  }
}

# ALB Listener on port 80
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = {
    Name        = "payment-alb-listener-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Listener Rule for Blue Environment
resource "aws_lb_listener_rule" "blue" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  tags = {
    Name        = "payment-blue-rule-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
