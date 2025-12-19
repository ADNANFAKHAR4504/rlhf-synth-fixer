# Task Definition for Analytics Service
resource "aws_ecs_task_definition" "analytics_service" {
  family                   = "analytics-service-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "analytics-service"
      image     = "${var.ecr_repository_urls.analytics_service}:${var.container_image_tags.analytics_service}"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "analytics-service"
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

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.analytics_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "analytics"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/analytics/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name    = "analytics-service-task-${var.environment_suffix}"
    Service = "analytics-service"
  }
}

# ECS Service for Analytics Service
resource "aws_ecs_service" "analytics_service" {
  name            = "analytics-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.fintech_cluster.id
  task_definition = aws_ecs_task_definition.analytics_service.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.analytics_service.arn
    container_name   = "analytics-service"
    container_port   = 8080
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = 60

  tags = {
    Name    = "analytics-service-${var.environment_suffix}"
    Service = "analytics-service"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_execution_additional
  ]
}
