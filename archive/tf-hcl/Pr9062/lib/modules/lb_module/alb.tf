# Application Load Balancer
# Conditional creation: ELBv2 is not available in LocalStack Community Edition
resource "aws_lb" "main" {
  count = var.enable_alb ? 1 : 0

  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  count = var.enable_alb ? 1 : 0

  name     = "${var.environment}-${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "main" {
  count = var.enable_alb ? 1 : 0

  load_balancer_arn = aws_lb.main[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[0].arn
  }

  tags = var.common_tags
}