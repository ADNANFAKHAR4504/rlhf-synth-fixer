# Task definitions for each service
resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "${var.environment}-${each.key}-${local.env_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_execution[each.key].arn
  task_role_arn            = aws_iam_role.ecs_task[each.key].arn

  container_definitions = jsonencode([{
    name  = each.key
    image = "${data.aws_ecr_repository.services[each.key].repository_url}:latest"

    # Only add port mappings for services with ports
    portMappings = each.value.port > 0 ? [{
      containerPort = each.value.port
      protocol      = "tcp"
    }] : []

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "SERVICE_NAME"
        value = each.key
      }
    ]

    secrets = [
      for param_key in ["database_url", "api_key", "jwt_secret"] : {
        name      = upper(param_key)
        valueFrom = data.aws_ssm_parameter.app_secrets[param_key].arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs[each.key].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = local.service_tags[each.key]

  # Prevent constant redeployments
  lifecycle {
    create_before_destroy = true
  }
}

# ECS Services
resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = "${var.environment}-${each.key}-${local.env_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_services[each.key].id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  # Only attach to ALB for services with ports
  dynamic "load_balancer" {
    for_each = each.value.port > 0 ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.services[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }

  # Prevent circular dependency
  depends_on = [
    aws_lb_target_group.services,
    aws_lb_listener_rule.services
  ]

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = local.service_tags[each.key]
}

# Auto-scaling (optional but recommended)
resource "aws_appautoscaling_target" "ecs_target" {
  for_each = { for k, v in var.services : k => v if v.port > 0 }

  max_capacity       = each.value.desired_count * 3
  min_capacity       = each.value.desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}