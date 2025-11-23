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
  cluster_identifier     = "aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_version         = "15.8"
  database_name          = "transactions"
  master_username        = var.db_username
  master_password        = var.db_password != "" ? var.db_password : random_password.aurora.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # High Availability Settings
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Point-in-time recovery (enabled by default with backup_retention_period > 0)
  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-final-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enable deletion protection in production
  deletion_protection = false

  apply_immediately = false

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
  count               = var.availability_zones_count
  identifier          = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier  = aws_rds_cluster.aurora.id
  instance_class      = "db.r6g.large"
  engine              = aws_rds_cluster.aurora.engine
  engine_version      = aws_rds_cluster.aurora.engine_version
  publicly_accessible = false

  performance_insights_enabled = true
  monitoring_interval          = 0

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
  replication_group_id = "redis-cluster-${var.environment_suffix}"
  description          = "Redis cluster for session management"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.r6g.large"
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  # Cluster mode configuration
  num_node_groups         = var.availability_zones_count
  replicas_per_node_group = 1

  # High Availability
  automatic_failover_enabled = true
  multi_az_enabled           = true

  # Backup settings
  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:05:00-mon:07:00"

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

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

  enable_deletion_protection       = false
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

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  enable_execute_command = false

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
  count          = var.domain_name != "" ? 1 : 0
  zone_id        = aws_route53_zone.main[0].zone_id
  name           = "app.${var.domain_name}"
  type           = "A"
  set_identifier = "primary-${var.environment_suffix}"
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