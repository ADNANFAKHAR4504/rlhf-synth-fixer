# alb.tf - Application Load Balancer configuration

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${local.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-access-logs"
    enabled = true
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-${local.environment}-api-tg"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-api-tg"
  })
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = local.common_tags
}

# ALB Listener Rule for API
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.api.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  tags = local.common_tags
}