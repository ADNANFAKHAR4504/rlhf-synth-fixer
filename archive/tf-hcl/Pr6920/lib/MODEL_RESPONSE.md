# ECS Fargate Optimization - Terraform Implementation

This implementation provides a production-ready, optimized ECS Fargate deployment with proper auto-scaling, health checks, and cost controls.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Service     = var.service_name
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
      Project     = "ecs-fargate-optimization"
    }
  }
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "environment_suffix must be between 1 and 20 characters"
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "service_name" {
  description = "Service name for tagging"
  type        = string
  default     = "microservices-platform"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "api_cpu" {
  description = "CPU units for API service (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "Memory for API service in MB"
  type        = number
  default     = 512
}

variable "worker_cpu" {
  description = "CPU units for worker service"
  type        = number
  default     = 512
}

variable "worker_memory" {
  description = "Memory for worker service in MB"
  type        = number
  default     = 1024
}

variable "scheduler_cpu" {
  description = "CPU units for scheduler service"
  type        = number
  default     = 256
}

variable "scheduler_memory" {
  description = "Memory for scheduler service in MB"
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "worker_desired_count" {
  description = "Desired number of worker tasks"
  type        = number
  default     = 2
}

variable "scheduler_desired_count" {
  description = "Desired number of scheduler tasks"
  type        = number
  default     = 1
}

variable "container_image" {
  description = "Container image for services"
  type        = string
  default     = "nginx:latest"
}
```

## File: main.tf

```hcl
# Data sources
data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ecs-vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ecs-igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "ecs-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = {
    Name = "ecs-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.azs)
  domain = "vpc"

  tags = {
    Name = "ecs-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "ecs-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "ecs-public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "ecs-private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(var.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "ecs-alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Allow internal communication"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-tasks-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ecs-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "ecs-alb-${var.environment_suffix}"
  }
}

# ALB Target Group for API Service
resource "aws_lb_target_group" "api" {
  name        = "ecs-api-tg-${var.environment_suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 15
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "ecs-api-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Target Group for Worker Service
resource "aws_lb_target_group" "worker" {
  name        = "ecs-worker-tg-${var.environment_suffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 15
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 60

  tags = {
    Name = "ecs-worker-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ALB Listener Rule for Worker
resource "aws_lb_listener_rule" "worker" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.worker.arn
  }

  condition {
    path_pattern {
      values = ["/worker/*"]
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/api-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name = "ecs-api-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/worker-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name = "ecs-worker-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/scheduler-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "ecs-scheduler-logs-${var.environment_suffix}"
  }
}

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

# Cloud Map Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "ecs-services-${var.environment_suffix}.local"
  description = "Private DNS namespace for ECS service discovery"
  vpc         = aws_vpc.main.id

  tags = {
    Name = "ecs-namespace-${var.environment_suffix}"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ecs-task-execution-role-${var.environment_suffix}"
  }
}

# Attach policies to ECS Task Execution Role
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

# Task-level permissions policy
resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "servicediscovery:DiscoverInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS Task Definition - API Service
resource "aws_ecs_task_definition" "api" {
  family                   = "ecs-api-${var.environment_suffix}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "api"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = {
    Name = "ecs-api-task-${var.environment_suffix}"
  }
}

# ECS Task Definition - Worker Service
resource "aws_ecs_task_definition" "worker" {
  family                   = "ecs-worker-${var.environment_suffix}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "worker"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = {
    Name = "ecs-worker-task-${var.environment_suffix}"
  }
}

# ECS Task Definition - Scheduler Service
resource "aws_ecs_task_definition" "scheduler" {
  family                   = "ecs-scheduler-${var.environment_suffix}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.scheduler_cpu
  memory                   = var.scheduler_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "scheduler"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.scheduler.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "scheduler"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        {
          name  = "SERVICE_NAME"
          value = "scheduler"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = {
    Name = "ecs-scheduler-task-${var.environment_suffix}"
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
    failure_threshold = 1
  }

  tags = {
    Name = "ecs-api-discovery-${var.environment_suffix}"
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
    failure_threshold = 1
  }

  tags = {
    Name = "ecs-worker-discovery-${var.environment_suffix}"
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
    failure_threshold = 1
  }

  tags = {
    Name = "ecs-scheduler-discovery-${var.environment_suffix}"
  }
}

# ECS Service - API
resource "aws_ecs_service" "api" {
  name            = "ecs-api-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 80
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Name = "ecs-api-service-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}

# ECS Service - Worker
resource "aws_ecs_service" "worker" {
  name            = "ecs-worker-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.worker.arn
    container_name   = "worker"
    container_port   = 80
  }

  service_registries {
    registry_arn = aws_service_discovery_service.worker.arn
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Name = "ecs-worker-service-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.http]
}

# ECS Service - Scheduler
resource "aws_ecs_service" "scheduler" {
  name            = "ecs-scheduler-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scheduler.arn
  desired_count   = var.scheduler_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.scheduler.arn
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Name = "ecs-scheduler-service-${var.environment_suffix}"
  }
}

# Auto Scaling Target - API Service
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - API CPU
resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "ecs-api-cpu-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - API Memory
resource "aws_appautoscaling_policy" "api_memory" {
  name               = "ecs-api-memory-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target - Worker Service
resource "aws_appautoscaling_target" "worker" {
  max_capacity       = 20
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.worker.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - Worker CPU
resource "aws_appautoscaling_policy" "worker_cpu" {
  name               = "ecs-worker-cpu-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Worker Memory
resource "aws_appautoscaling_policy" "worker_memory" {
  name               = "ecs-worker-memory-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Target - Scheduler Service
resource "aws_appautoscaling_target" "scheduler" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.scheduler.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - Scheduler CPU
resource "aws_appautoscaling_policy" "scheduler_cpu" {
  name               = "ecs-scheduler-cpu-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.scheduler.resource_id
  scalable_dimension = aws_appautoscaling_target.scheduler.scalable_dimension
  service_namespace  = aws_appautoscaling_target.scheduler.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# CloudWatch Alarms - API Service
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "ecs-api-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "API service CPU utilization is too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  tags = {
    Name = "ecs-api-cpu-high-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_memory_high" {
  alarm_name          = "ecs-api-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "API service memory utilization is too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  tags = {
    Name = "ecs-api-memory-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarms - Worker Service
resource "aws_cloudwatch_metric_alarm" "worker_cpu_high" {
  alarm_name          = "ecs-worker-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Worker service CPU utilization is too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.worker.name
  }

  tags = {
    Name = "ecs-worker-cpu-high-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "worker_memory_high" {
  alarm_name          = "ecs-worker-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Worker service memory utilization is too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.worker.name
  }

  tags = {
    Name = "ecs-worker-memory-high-${var.environment_suffix}"
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "Name of the Worker ECS service"
  value       = aws_ecs_service.worker.name
}

output "scheduler_service_name" {
  description = "Name of the Scheduler ECS service"
  value       = aws_ecs_service.scheduler.name
}

output "api_task_definition_arn" {
  description = "ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "worker_task_definition_arn" {
  description = "ARN of the Worker task definition"
  value       = aws_ecs_task_definition.worker.arn
}

output "scheduler_task_definition_arn" {
  description = "ARN of the Scheduler task definition"
  value       = aws_ecs_task_definition.scheduler.arn
}

output "service_discovery_namespace" {
  description = "Name of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "worker_target_group_arn" {
  description = "ARN of the Worker target group"
  value       = aws_lb_target_group.worker.arn
}

output "cloudwatch_log_group_api" {
  description = "Name of the API CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

output "cloudwatch_log_group_worker" {
  description = "Name of the Worker CloudWatch log group"
  value       = aws_cloudwatch_log_group.worker.name
}

output "cloudwatch_log_group_scheduler" {
  description = "Name of the Scheduler CloudWatch log group"
  value       = aws_cloudwatch_log_group.scheduler.name
}

output "api_service_url" {
  description = "URL to access the API service"
  value       = "http://${aws_lb.main.dns_name}"
}

output "worker_service_url" {
  description = "URL to access the Worker service"
  value       = "http://${aws_lb.main.dns_name}/worker"
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}
```
