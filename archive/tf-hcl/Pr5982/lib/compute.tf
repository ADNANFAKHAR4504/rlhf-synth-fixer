# ECS Cluster
resource "aws_ecs_cluster" "payment" {
  name = "payment-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-cluster-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_payment" {
  name              = "/ecs/payment-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-payment-logs-${var.environment_suffix}"
    }
  )
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "ecs-task-execution-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-task-execution-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Parameter Store access
resource "aws_iam_role_policy" "ecs_parameter_store" {
  name_prefix = "ecs-parameter-store-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/payment-migration/${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:payment-migration/${var.environment_suffix}/*"
      }
    ]
  })
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  name_prefix = "ecs-task-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-task-role-${var.environment_suffix}"
    }
  )
}

# ECS Task Definition
resource "aws_ecs_task_definition" "payment" {
  family                   = "payment-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.current_env.ecs_task_cpu
  memory                   = local.current_env.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app"
      image     = var.payment_app_image
      essential = true

      portMappings = [
        {
          containerPort = var.payment_app_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = local.environment
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "DB_HOST"
          valueFrom = aws_ssm_parameter.aurora_writer_endpoint.arn
        },
        {
          name      = "DB_USERNAME"
          valueFrom = aws_ssm_parameter.db_master_username.arn
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_master_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_payment.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.payment_app_port}/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name = "payment-task-${var.environment_suffix}"
    }
  )
}

# ECS Service - Blue
resource "aws_ecs_service" "payment_blue" {
  name            = "payment-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.payment.id
  task_definition = aws_ecs_task_definition.payment.arn
  desired_count   = local.current_env.ecs_task_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-app"
    container_port   = var.payment_app_port
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  health_check_grace_period_seconds = 60

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-service-${var.environment_suffix}"
      Deployment = "blue"
    }
  )

  depends_on = [
    aws_lb_listener.http
  ]
}

# ECS Service - Green
resource "aws_ecs_service" "payment_green" {
  name            = "payment-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.payment.id
  task_definition = aws_ecs_task_definition.payment.arn
  desired_count   = var.green_target_weight > 0 ? local.current_env.ecs_task_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "payment-app"
    container_port   = var.payment_app_port
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  health_check_grace_period_seconds = 60

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-service-${var.environment_suffix}"
      Deployment = "green"
    }
  )

  depends_on = [
    aws_lb_listener.http
  ]
}

# Auto Scaling for Blue Service
resource "aws_appautoscaling_target" "ecs_blue" {
  max_capacity       = local.current_env.ecs_task_count * 3
  min_capacity       = local.current_env.ecs_task_count
  resource_id        = "service/${aws_ecs_cluster.payment.name}/${aws_ecs_service.payment_blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_blue_cpu" {
  name               = "ecs-blue-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling for Green Service
resource "aws_appautoscaling_target" "ecs_green" {
  count = var.green_target_weight > 0 ? 1 : 0

  max_capacity       = local.current_env.ecs_task_count * 3
  min_capacity       = local.current_env.ecs_task_count
  resource_id        = "service/${aws_ecs_cluster.payment.name}/${aws_ecs_service.payment_green.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_green_cpu" {
  count = var.green_target_weight > 0 ? 1 : 0

  name               = "ecs-green-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_green[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_green[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_green[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}