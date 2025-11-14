resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environmentSuffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environmentSuffix}"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }

  default_capacity_provider_strategy {
    weight            = 0
    capacity_provider = "FARGATE_SPOT"
  }
}

# Fraud Detection Task Definition
resource "aws_ecs_task_definition" "fraud_detection" {
  family                   = "fraud-detection-${var.environmentSuffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fraud_detection_cpu
  memory                   = var.fraud_detection_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.fraud_detection_task.arn

  container_definitions = jsonencode([{
    name      = "fraud-detection"
    image     = "public.ecr.aws/docker/library/httpd:2.4"
    essential = true

    portMappings = [{
      containerPort = 80
      hostPort      = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.fraud_detection.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    environment = [
      {
        name  = "SERVICE_NAME"
        value = "fraud-detection"
      },
      {
        name  = "ENVIRONMENT"
        value = var.environment
      }
    ]
  }])

  tags = {
    Name = "fraud-detection-task-${var.environmentSuffix}"
  }
}

# Transaction Processor Task Definition
resource "aws_ecs_task_definition" "transaction_processor" {
  family                   = "transaction-processor-${var.environmentSuffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.transaction_processor_cpu
  memory                   = var.transaction_processor_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.transaction_processor_task.arn

  container_definitions = jsonencode([{
    name      = "transaction-processor"
    image     = "public.ecr.aws/docker/library/httpd:2.4"
    essential = true

    portMappings = [{
      containerPort = 80
      hostPort      = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.transaction_processor.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    environment = [
      {
        name  = "SERVICE_NAME"
        value = "transaction-processor"
      },
      {
        name  = "ENVIRONMENT"
        value = var.environment
      }
    ]
  }])

  tags = {
    Name = "transaction-processor-task-${var.environmentSuffix}"
  }
}

# Fraud Detection Service
resource "aws_ecs_service" "fraud_detection" {
  name            = "fraud-detection"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.fraud_detection.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.fraud_detection.arn
    container_name   = "fraud-detection"
    container_port   = 80
  }

  service_registries {
    registry_arn = aws_service_discovery_service.fraud_detection.arn
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "fraud-detection-service-${var.environmentSuffix}"
  }
}

# Transaction Processor Service
resource "aws_ecs_service" "transaction_processor" {
  name            = "transaction-processor"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.transaction_processor.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.transaction_processor.arn
    container_name   = "transaction-processor"
    container_port   = 80
  }

  service_registries {
    registry_arn = aws_service_discovery_service.transaction_processor.arn
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "transaction-processor-service-${var.environmentSuffix}"
  }
}
