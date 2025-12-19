# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "alb-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# Target Group - Blue Environment
resource "aws_lb_target_group" "blue" {
  name     = "tg-blue-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-blue-${var.environment_suffix}"
    Environment    = "Blue"
    DeploymentType = "BlueGreen"
    Version        = var.app_version_blue
  }
}

# Target Group - Green Environment
resource "aws_lb_target_group" "green" {
  name     = "tg-green-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name           = "tg-green-${var.environment_suffix}"
    Environment    = "Green"
    DeploymentType = "BlueGreen"
    Version        = var.app_version_green
  }
}

# ALB Listener - HTTP (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_traffic_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_traffic_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  tags = {
    Name = "alb-listener-http-${var.environment_suffix}"
  }
}
