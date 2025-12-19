# Primary Application Load Balancer
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "alb-primary-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(local.common_tags, {
    Name    = "alb-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Target Group
resource "aws_lb_target_group" "primary" {
  provider    = aws.primary
  name        = "tg-primary-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "instance"

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

  tags = merge(local.common_tags, {
    Name    = "tg-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary ALB Listener
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name    = "listener-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}
