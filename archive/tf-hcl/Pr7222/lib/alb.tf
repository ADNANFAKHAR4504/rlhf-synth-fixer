# alb.tf - Application Load Balancer Configuration

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
    Name = "payment-alb-${var.environment_suffix}"
  }
}

# Target Group - Blue
resource "aws_lb_target_group" "blue" {
  name     = "payment-tg-blue-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 45

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name            = "payment-tg-blue-${var.environment_suffix}"
    DeploymentColor = "blue"
  }
}

# Target Group - Green
resource "aws_lb_target_group" "green" {
  name     = "payment-tg-green-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 45

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name            = "payment-tg-green-${var.environment_suffix}"
    DeploymentColor = "green"
  }
}

# ALB Listener - HTTP (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = var.deployment_color == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  tags = {
    Name = "payment-listener-http-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for ALB Access Logs
resource "aws_cloudwatch_log_group" "alb_logs" {
  name              = "/aws/alb/payment-alb-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "payment-alb-logs-${var.environment_suffix}"
  }
}
