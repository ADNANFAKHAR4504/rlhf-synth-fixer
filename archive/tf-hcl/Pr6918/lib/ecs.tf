resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-v1-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-v1-${var.environment_suffix}"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "payment-gateway-v1-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-gateway"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_tasks.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment-gateway"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        }
      ]
    }
  ])

  tags = {
    Name = "task-definition-v1-${var.environment_suffix}"
  }
}

resource "aws_ecs_service" "app" {
  name                               = "payment-gateway-service-v1-${var.environment_suffix}"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.ecs_desired_count
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-gateway"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_listener.test,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer,
      desired_count,
      platform_version
    ]
  }

  tags = {
    Name = "ecs-service-v1-${var.environment_suffix}"
  }
}
