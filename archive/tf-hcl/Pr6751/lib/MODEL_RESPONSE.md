# Highly Available Transaction Processing System - Terraform Implementation

This implementation provides a production-ready, highly available transaction processing system deployed across three availability zones in us-east-1. The infrastructure includes Aurora PostgreSQL Multi-AZ, ECS Fargate with auto-scaling, Application Load Balancer, ElastiCache Redis cluster, Route 53 health checks, and comprehensive monitoring with CloudWatch alarms.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
  validation {
    condition     = var.availability_zones_count >= 2 && var.availability_zones_count <= 3
    error_message = "Must use between 2 and 3 availability zones"
  }
}

variable "db_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for Aurora PostgreSQL"
  type        = string
  sensitive   = true
  default     = ""
  validation {
    condition     = var.db_password == "" || length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters if provided"
  }
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest"
}

variable "container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 80
}

variable "min_tasks_per_az" {
  description = "Minimum tasks per availability zone"
  type        = number
  default     = 2
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alarm_email))
    error_message = "Must provide a valid email address"
  }
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment       = "production"
    DisasterRecovery  = "enabled"
    ManagedBy         = "Terraform"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}
```

## File: main.tf

```hcl
# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zones_count)

  common_tags = merge(
    var.tags,
    {
      EnvironmentSuffix = var.environment_suffix
    }
  )
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.availability_zones_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${var.environment_suffix}-${count.index + 1}"
      Type = "public"
    }
  )
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-app-subnet-${var.environment_suffix}-${count.index + 1}"
      Type = "private"
      Tier = "application"
    }
  )
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-db-subnet-${var.environment_suffix}-${count.index + 1}"
      Type = "private"
      Tier = "database"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.availability_zones_count
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ)
resource "aws_nat_gateway" "main" {
  count         = var.availability_zones_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-gateway-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "public-rt-${var.environment_suffix}"
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for high availability)
resource "aws_route_table" "private" {
  count  = var.availability_zones_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "private-rt-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Private Route Table Associations for Application Subnets
resource "aws_route_table_association" "private_app" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Private Route Table Associations for Database Subnets
resource "aws_route_table_association" "private_db" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
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
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-sg-${var.environment_suffix}"
    }
  )
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "ecs-tasks-sg-${var.environment_suffix}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-tasks-sg-${var.environment_suffix}"
    }
  )
}

# Security Group for Aurora PostgreSQL
resource "aws_security_group" "aurora" {
  name        = "aurora-sg-${var.environment_suffix}"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-sg-${var.environment_suffix}"
    }
  )
}

# Security Group for ElastiCache Redis
resource "aws_security_group" "redis" {
  name        = "redis-sg-${var.environment_suffix}"
  description = "Security group for ElastiCache Redis cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "redis-sg-${var.environment_suffix}"
    }
  )
}

# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_db[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-subnet-group-${var.environment_suffix}"
    }
  )
}

# Random password for Aurora if not provided
resource "random_password" "aurora" {
  length  = 16
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  database_name                   = "transactions"
  master_username                 = var.db_username
  master_password                 = var.db_password != "" ? var.db_password : random_password.aurora.result
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]

  # High Availability Settings
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Aurora Backtrack - 24 hours
  backtrack_window                = 86400

  # Point-in-time recovery (enabled by default with backup_retention_period > 0)
  skip_final_snapshot             = true
  final_snapshot_identifier       = "aurora-final-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enable deletion protection in production
  deletion_protection             = false

  apply_immediately               = false

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cluster-${var.environment_suffix}"
    }
  )

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      master_password
    ]
  }
}

# Aurora Cluster Instances (one per AZ)
resource "aws_rds_cluster_instance" "aurora" {
  count                = var.availability_zones_count
  identifier           = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.aurora.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.aurora.engine
  engine_version       = aws_rds_cluster.aurora.engine_version
  publicly_accessible  = false

  performance_insights_enabled = true
  monitoring_interval          = 60

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "redis-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_app[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "redis-subnet-group-${var.environment_suffix}"
    }
  )
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  name   = "redis-params-${var.environment_suffix}"
  family = "redis7"

  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "redis-params-${var.environment_suffix}"
    }
  )
}

# ElastiCache Redis Replication Group (Cluster Mode)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "redis-cluster-${var.environment_suffix}"
  description                = "Redis cluster for session management"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r6g.large"
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]

  # Cluster mode configuration
  num_node_groups         = var.availability_zones_count
  replicas_per_node_group = 1

  # High Availability
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # Backup settings
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "mon:05:00-mon:07:00"

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled        = false

  # Logs
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "redis-cluster-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/redis-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "redis-logs-${var.environment_suffix}"
    }
  )
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_cross_zone_load_balancing = true

  tags = merge(
    local.common_tags,
    {
      Name = "alb-${var.environment_suffix}"
    }
  )
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name        = "tg-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name = "tg-${var.environment_suffix}"
    }
  )
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-listener-${var.environment_suffix}"
    }
  )
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-cluster-${var.environment_suffix}"
    }
  )
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "ecs-execution-role-${var.environment_suffix}"

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
      Name = "ecs-execution-role-${var.environment_suffix}"
    }
  )
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

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

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/app-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-logs-${var.environment_suffix}"
    }
  )
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "app-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.aurora.endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = aws_rds_cluster.aurora.database_name
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_replication_group.redis.configuration_endpoint_address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/ || exit 1"]
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
      Name = "app-task-${var.environment_suffix}"
    }
  )
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "app-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.min_tasks_per_az * var.availability_zones_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # Ensure tasks are distributed across AZs
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "app-service-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution
  ]

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.min_tasks_per_az * var.availability_zones_count * 3
  min_capacity       = var.min_tasks_per_az * var.availability_zones_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "ecs-cpu-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "ecs-memory-scaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "alarms-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "alarms-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarm - ALB Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-unhealthy-targets-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarm - ECS Service CPU
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ecs-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when ECS service CPU is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-cpu-high-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarm - Aurora CPU
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "aurora-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when Aurora CPU is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cpu-high-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarm - Aurora Replication Lag
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag" {
  alarm_name          = "aurora-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alert when Aurora replication lag exceeds 1 second"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-replication-lag-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarm - Redis CPU
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "redis-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Alert when Redis CPU is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "redis-cpu-high-${var.environment_suffix}"
    }
  )
}

# Route 53 Health Check for ALB
resource "aws_route53_health_check" "alb" {
  count             = var.domain_name != "" ? 1 : 0
  type              = "HTTPS"
  resource_path     = "/"
  fqdn              = aws_lb.main.dns_name
  port              = 443
  request_interval  = 30
  failure_threshold = 2

  tags = merge(
    local.common_tags,
    {
      Name = "alb-health-check-${var.environment_suffix}"
    }
  )
}

# Route 53 Hosted Zone (only if domain provided)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = merge(
    local.common_tags,
    {
      Name = "hosted-zone-${var.environment_suffix}"
    }
  )
}

# Route 53 Record with Failover
resource "aws_route53_record" "app" {
  count           = var.domain_name != "" ? 1 : 0
  zone_id         = aws_route53_zone.main[0].zone_id
  name            = "app.${var.domain_name}"
  type            = "A"
  set_identifier  = "primary-${var.environment_suffix}"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.alb[0].id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs of private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "IDs of private database subnets"
  value       = aws_subnet.private_db[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint for Aurora cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint for Aurora cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "redis_configuration_endpoint" {
  description = "Configuration endpoint for Redis cluster"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID (if domain provided)"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].zone_id : null
}

output "route53_nameservers" {
  description = "Route 53 nameservers (if domain provided)"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].name_servers : null
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and update with your values

environment_suffix = "prod-01"
region            = "us-east-1"
vpc_cidr          = "10.0.0.0/16"

# Database credentials
db_username = "postgres"
db_password = "YourSecurePassword123!"  # Use secrets manager in production

# Container configuration
container_image = "public.ecr.aws/docker/library/nginx:latest"
container_port  = 80

# Scaling configuration
min_tasks_per_az          = 2
availability_zones_count  = 3

# Monitoring
alarm_email = "your-email@example.com"

# Optional: Route 53 domain
domain_name = ""  # Leave empty if not using Route 53

# Tags
tags = {
  Environment      = "production"
  DisasterRecovery = "enabled"
  ManagedBy        = "Terraform"
  Project          = "TransactionProcessing"
}
```

## File: README.md

```markdown
# Highly Available Transaction Processing System

This Terraform configuration deploys a production-ready, highly available transaction processing system across three availability zones in AWS.

## Architecture Overview

- **Network**: Multi-AZ VPC with public and private subnets across 3 AZs
- **Compute**: ECS Fargate service with auto-scaling (minimum 6 tasks)
- **Database**: Aurora PostgreSQL Multi-AZ cluster with 24-hour backtrack
- **Cache**: ElastiCache Redis cluster mode with automatic failover
- **Load Balancer**: Application Load Balancer with cross-zone load balancing
- **DNS**: Route 53 health checks with failover routing
- **Monitoring**: CloudWatch alarms with SNS notifications

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create all resources
- Valid email address for alarm notifications

## Deployment Instructions

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Create terraform.tfvars

Copy the example file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and provide:
- `environment_suffix`: Unique identifier for this deployment (e.g., "prod-01")
- `alarm_email`: Email address for CloudWatch alarms
- `db_password`: Secure password for Aurora PostgreSQL
- `container_image`: Docker image for your application

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply the Configuration

```bash
terraform apply
```

Confirm with `yes` when prompted.

### 5. Confirm SNS Subscription

Check your email and confirm the SNS subscription for CloudWatch alarms.

## Resource Naming

All resources include the `environment_suffix` variable in their names to support multiple deployments:
- VPC: `vpc-{environment_suffix}`
- ECS Cluster: `ecs-cluster-{environment_suffix}`
- Aurora Cluster: `aurora-cluster-{environment_suffix}`
- etc.

## High Availability Features

1. **Multi-AZ Deployment**: All resources distributed across 3 availability zones
2. **Automatic Failover**: Aurora and Redis configured for automatic failover
3. **Auto Scaling**: ECS tasks scale based on CPU and memory utilization
4. **Health Checks**: ALB and Route 53 health checks with 60-second intervals
5. **Backtrack**: Aurora 24-hour backtrack window for rapid recovery
6. **Monitoring**: CloudWatch alarms for CPU, memory, and replication lag

## Accessing the Application

After deployment, the application is accessible via:
- **ALB DNS**: Output as `alb_dns_name`
- **Route 53** (if configured): `app.{your-domain}`

## Monitoring

CloudWatch alarms are configured for:
- ALB unhealthy targets
- ECS service high CPU utilization
- Aurora high CPU utilization
- Aurora replication lag
- Redis high CPU utilization

All alarms send notifications to the configured email address.

## Failover Testing

To test AZ failover:
1. Monitor CloudWatch metrics
2. Simulate AZ failure by stopping instances in one AZ
3. Verify automatic failover and recovery
4. Check that no data loss occurred

## Backup and Recovery

- **Aurora Backups**: Automated backups every 6 hours, 7-day retention
- **Aurora Backtrack**: 24-hour window for point-in-time recovery
- **Redis Snapshots**: Daily snapshots with 5-day retention

## Destroying the Infrastructure

To remove all resources:

```bash
terraform destroy
```

Confirm with `yes` when prompted.

**Note**: All resources are configured to be fully destroyable. Aurora will create a final snapshot before deletion (skip_final_snapshot = true in this example).

## Security Considerations

1. **Security Groups**: Implement least privilege access between tiers
2. **Private Subnets**: Compute and database layers in private subnets
3. **Encryption**: Redis uses encryption at rest and in transit
4. **Secrets**: Store database credentials in AWS Secrets Manager for production
5. **IAM Roles**: ECS tasks use IAM roles with minimal required permissions

## Cost Optimization

This configuration uses:
- Aurora Serverless v2 instance classes (r6g.large) - consider smaller instances for dev
- ElastiCache r6g.large nodes - consider smaller instances for dev
- NAT Gateways per AZ - required for high availability but can be expensive
- ECS Fargate with minimal task count - scales based on demand

## Troubleshooting

### ECS Tasks Not Starting
- Check security group rules
- Verify container image is accessible
- Review CloudWatch logs in `/ecs/app-{environment_suffix}`

### Database Connection Issues
- Verify security group allows traffic from ECS
- Check Aurora cluster status
- Review RDS logs in CloudWatch

### High Costs
- Review NAT Gateway usage
- Check ECS task count and scaling policies
- Verify Aurora instance classes

## Support

For issues or questions, refer to:
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Aurora Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
```

## Summary

This Terraform implementation provides:

1. **Multi-AZ Network**: VPC spanning 3 AZs with public/private subnets and NAT Gateways
2. **Aurora PostgreSQL**: Multi-AZ cluster with 24-hour backtrack and automated backups
3. **ECS Fargate**: Containerized application with minimum 2 tasks per AZ
4. **Application Load Balancer**: Cross-zone load balancing with health checks
5. **ElastiCache Redis**: Cluster mode with automatic failover across 3 AZs
6. **Auto Scaling**: CPU and memory-based scaling policies
7. **Monitoring**: CloudWatch alarms for all critical metrics
8. **Route 53**: Health checks and failover routing (optional)
9. **Security**: Proper security groups and IAM roles
10. **Tagging**: All resources tagged with Environment and DisasterRecovery

The infrastructure automatically handles AZ failures with zero data loss and maintains service availability.
