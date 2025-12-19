# Application Load Balancer
resource "aws_lb" "app" {
  name_prefix        = "app-"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.use_existing_vpc ? data.aws_subnets.public[0].ids : aws_subnet.public[*].id

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = merge(
    local.common_tags,
    {
      Name = "app-alb-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name_prefix = "app-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id

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

  tags = merge(
    local.common_tags,
    {
      Name = "app-tg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
