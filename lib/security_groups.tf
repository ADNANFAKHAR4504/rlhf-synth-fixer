# Security group for ECS services
resource "aws_security_group" "ecs_services" {
  for_each = var.services

  name_prefix = "${var.environment}-${each.key}-ecs-${local.env_suffix}-"
  description = "Security group for ${each.key} ECS service"
  vpc_id      = var.vpc_id

  tags = merge(
    local.service_tags[each.key],
    { Name = "${var.environment}-${each.key}-ecs-sg-${local.env_suffix}" }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Ingress rules for services with ports
resource "aws_security_group_rule" "ecs_ingress" {
  for_each = { for k, v in var.services : k => v if v.port > 0 }

  type                     = "ingress"
  from_port                = each.value.port
  to_port                  = each.value.port
  protocol                 = "tcp"
  source_security_group_id = tolist(data.aws_lb.main.security_groups)[0]
  security_group_id        = aws_security_group.ecs_services[each.key].id
  description              = "Allow inbound from ALB"
}

# Egress rules for all services
resource "aws_security_group_rule" "ecs_egress" {
  for_each = aws_security_group.ecs_services

  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = each.value.id
  description       = "Allow all outbound"
}