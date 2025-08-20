# Application Load Balancer
resource "aws_lb" "ecommerce_alb" {
  name               = "ecommerce-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "ecommerce-alb-${var.environment_suffix}"
  })
}

# Target Group
resource "aws_lb_target_group" "ecommerce_tg" {
  name     = "ecommerce-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.ecommerce_vpc.id

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

  tags = merge(var.common_tags, {
    Name = "ecommerce-tg-${var.environment_suffix}"
  })
}

# Load Balancer Listener
resource "aws_lb_listener" "ecommerce_alb_listener" {
  load_balancer_arn = aws_lb.ecommerce_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecommerce_tg.arn
  }
}