# ecs.tf - ECS Fargate cluster and services

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name           = "ecs-cluster-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ECS Task Definition - Blue
resource "aws_ecs_task_definition" "blue" {
  family                   = "payment-processing-blue-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app-blue"
      image     = var.container_image
      cpu       = 512
      memory    = 1024
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_blue.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "DEPLOYMENT_TYPE"
          value = "BLUE"
        }
      ]
    }
  ])

  tags = {
    Name           = "payment-processing-blue-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Blue"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ECS Task Definition - Green
resource "aws_ecs_task_definition" "green" {
  family                   = "payment-processing-green-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app-green"
      image     = var.container_image
      cpu       = 512
      memory    = 1024
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_green.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "DEPLOYMENT_TYPE"
          value = "GREEN"
        }
      ]
    }
  ])

  tags = {
    Name           = "payment-processing-green-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Green"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ECS Service - Blue Environment
resource "aws_ecs_service" "blue" {
  name            = "payment-service-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.blue.arn
  desired_count   = var.active_environment == "blue" ? 2 : 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-app-blue"
    container_port   = 8080
  }

  enable_ecs_managed_tags = true
  propagate_tags          = "SERVICE"

  tags = {
    Name           = "payment-service-blue-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Blue"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [aws_lb_listener.http]
}

# ECS Service - Green Environment
resource "aws_ecs_service" "green" {
  name            = "payment-service-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.green.arn
  desired_count   = var.active_environment == "green" ? 2 : 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "payment-app-green"
    container_port   = 8080
  }

  enable_ecs_managed_tags = true
  propagate_tags          = "SERVICE"

  tags = {
    Name           = "payment-service-green-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Green"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [aws_lb_listener.http]
}
