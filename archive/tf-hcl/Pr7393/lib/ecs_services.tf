# ECS Task Definitions and Services
# Optimized CPU/memory configurations for each service

# API Service Task Definition (256 CPU / 512 Memory)
resource "aws_ecs_task_definition" "api" {
  family                   = "api-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.api_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "nginx:latest" # Placeholder image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "SERVICE_NAME"
          value = "api"
        },
        {
          name  = "AWS_XRAY_DAEMON_ADDRESS"
          value = "xray-daemon:2000"
        }
      ]
    }
  ])

  tags = {
    Name       = "api-task-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# Worker Service Task Definition (512 CPU / 1024 Memory)
resource "aws_ecs_task_definition" "worker" {
  family                   = "worker-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.worker_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "nginx:latest" # Placeholder image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 90
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "SERVICE_NAME"
          value = "worker"
        },
        {
          name  = "AWS_XRAY_DAEMON_ADDRESS"
          value = "xray-daemon:2000"
        }
      ]
    }
  ])

  tags = {
    Name       = "worker-task-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# Scheduler Service Task Definition (256 CPU / 512 Memory)
resource "aws_ecs_task_definition" "scheduler" {
  family                   = "scheduler-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.scheduler_task.arn

  container_definitions = jsonencode([
    {
      name      = "scheduler"
      image     = "nginx:latest" # Placeholder image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.scheduler.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "scheduler"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "SERVICE_NAME"
          value = "scheduler"
        },
        {
          name  = "AWS_XRAY_DAEMON_ADDRESS"
          value = "xray-daemon:2000"
        }
      ]
    }
  ])

  tags = {
    Name       = "scheduler-task-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }
}

# Service Discovery for API
resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
  }

  tags = {
    Name       = "api-discovery-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

# Service Discovery for Worker
resource "aws_service_discovery_service" "worker" {
  name = "worker"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
  }

  tags = {
    Name       = "worker-discovery-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

# Service Discovery for Scheduler
resource "aws_service_discovery_service" "scheduler" {
  name = "scheduler"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
  }

  tags = {
    Name       = "scheduler-discovery-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }
}

# API ECS Service with Circuit Breaker
resource "aws_ecs_service" "api" {
  name            = "api-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name       = "api-service-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}

# Worker ECS Service with Circuit Breaker
resource "aws_ecs_service" "worker" {
  name            = "worker-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.worker.arn
    container_name   = "worker"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.worker.arn
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name       = "worker-service-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}

# Scheduler ECS Service with Circuit Breaker
resource "aws_ecs_service" "scheduler" {
  name            = "scheduler-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scheduler.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.scheduler.arn
    container_name   = "scheduler"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.scheduler.arn
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name       = "scheduler-service-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}
