# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environment_suffix}"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# CloudWatch Log Groups for each service
resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.microservices)

  name              = "/ecs/${each.key}-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "log-group-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "services" {
  for_each = var.service_config

  family                   = "task-${each.key}-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_role[each.key].arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${aws_ecr_repository.services[each.key].repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = each.key
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = []

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${each.key}-${var.environment_suffix}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${each.value.port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      memory            = each.value.memory
      memoryReservation = each.value.memory / 2
    }
  ])

  tags = {
    Name    = "task-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# ECS Services
resource "aws_ecs_service" "services" {
  for_each = var.service_config

  name            = "service-${each.key}-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  health_check_grace_period_seconds = 60

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  enable_execute_command = false

  tags = {
    Name    = "service-${each.key}-${var.environment_suffix}"
    Service = each.key
  }

  depends_on = [aws_lb_listener.http]
}
