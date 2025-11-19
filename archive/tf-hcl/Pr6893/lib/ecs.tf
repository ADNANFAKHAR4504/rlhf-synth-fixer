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

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

resource "aws_cloudwatch_log_group" "ecs_blue" {
  name              = "/ecs/trading-dashboard-blue-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "ecs-blue-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "ecs_green" {
  name              = "/ecs/trading-dashboard-green-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "ecs-green-logs-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "blue" {
  family                   = "trading-dashboard-blue-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "django-app"
    image = var.container_image

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = "blue"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]

    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.db_credentials.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_blue.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "ecs-task-def-blue-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "green" {
  family                   = "trading-dashboard-green-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "django-app"
    image = var.container_image

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = "green"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]

    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.db_credentials.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_green.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "ecs-task-def-green-${var.environment_suffix}"
  }
}

resource "aws_ecs_service" "blue" {
  name                               = "trading-dashboard-blue-${var.environment_suffix}"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.blue.arn
  desired_count                      = var.blue_weight > 0 ? var.ecs_desired_count : 0
  launch_type                        = "FARGATE"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  enable_execute_command             = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "django-app"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name = "ecs-service-blue-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "green" {
  name                               = "trading-dashboard-green-${var.environment_suffix}"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.green.arn
  desired_count                      = var.green_weight > 0 ? var.ecs_desired_count : 0
  launch_type                        = "FARGATE"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  enable_execute_command             = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "django-app"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name = "ecs-service-green-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}
