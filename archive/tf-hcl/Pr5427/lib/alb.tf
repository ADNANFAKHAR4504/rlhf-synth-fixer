# Target groups for services with ports
resource "aws_lb_target_group" "services" {
  for_each = { for k, v in var.services : k => v if v.port > 0 }

  name_prefix = substr("${each.key}-", 0, 6)
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = each.value.health_check_path
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.service_tags[each.key],
    { Name = "${var.environment}-${each.key}-tg-${local.env_suffix}" }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Listener rules
resource "aws_lb_listener_rule" "services" {
  for_each = { for k, v in var.services : k => v if v.port > 0 }

  listener_arn = data.aws_lb_listener.main.arn
  priority     = each.key == "web" ? 100 : (each.key == "api" ? 200 : 300)

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.key == "api" ? ["/api/*"] : ["/"]
    }
  }

  tags = local.service_tags[each.key]
}