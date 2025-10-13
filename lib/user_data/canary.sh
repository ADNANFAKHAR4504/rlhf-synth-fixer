resource "aws_lb_target_group" "web" {
  name        = "tap-tg-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.this.id

  health_check {
    path                = "/health"
    matcher             = "200-299"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = merge(local.tags, {
    Name = "tap-tg-${var.environment}${var.environment_suffix}"
  })
}
