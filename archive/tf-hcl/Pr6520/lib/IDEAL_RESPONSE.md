# Blue-Green Deployment Infrastructure for Payment Processing Application

## Overview

This Terraform implementation creates a complete AWS infrastructure for migrating an on-premises payment processing application to AWS using a blue-green deployment strategy. The solution uses ECS Fargate for container orchestration, Aurora PostgreSQL for the database, and Application Load Balancer for traffic management.

## Architecture

The infrastructure includes:
- VPC with 3 availability zones, each with public and private subnets
- NAT Gateways for outbound internet access
- ECS Fargate cluster with separate blue and green services
- Aurora PostgreSQL cluster with Multi-AZ deployment and encryption
- Application Load Balancer with separate target groups for blue/green
- Auto-scaling policies for ECS tasks based on CPU utilization
- Security groups implementing least-privilege access
- CloudWatch log groups and alarms for monitoring
- Parameter Store for secure credential management

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment isolation"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "container_image" {
  description = "Docker image for payment processor"
  type        = string
  default     = "nginx:latest" # Replace with actual payment processor image
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8080
}

variable "task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "desired_count_blue" {
  description = "Desired number of tasks for blue environment"
  type        = number
  default     = 2
}

variable "desired_count_green" {
  description = "Desired number of tasks for green environment"
  type        = number
  default     = 0
}

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "paymentadmin"
  sensitive   = true
}

variable "db_instance_class" {
  description = "Instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r5.large"
}

variable "db_backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}
```

## File: lib/main.tf

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "payment-vpc-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "payment-igw-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Public Subnets (one per AZ)
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
    Type        = "public"
  }
}

# Private Subnets (one per AZ)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "payment-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
    Type        = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "payment-nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "payment-nat-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "payment-public-rt-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets (one per AZ)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "payment-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/security-groups.tf

```hcl
# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "payment-alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
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
    Name        = "payment-alb-sg-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "payment-ecs-tasks-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks - allows traffic only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "payment-ecs-tasks-sg-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Aurora RDS
resource "aws_security_group" "rds" {
  name_prefix = "payment-rds-sg-${var.environment_suffix}-"
  description = "Security group for Aurora PostgreSQL - allows traffic only from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "payment-rds-sg-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = {
    Name        = "payment-alb-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Target Group for Blue Environment
resource "aws_lb_target_group" "blue" {
  name        = "payment-blue-tg-${var.environment_suffix}"
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
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name        = "payment-blue-tg-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "blue"
  }
}

# Target Group for Green Environment
resource "aws_lb_target_group" "green" {
  name        = "payment-green-tg-${var.environment_suffix}"
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
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name        = "payment-green-tg-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "green"
  }
}

# ALB Listener on port 80
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = {
    Name        = "payment-alb-listener-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Listener Rule for Blue Environment
resource "aws_lb_listener_rule" "blue" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  tags = {
    Name        = "payment-blue-rule-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

## File: lib/ecs.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "payment-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = {
    Name        = "payment-cluster-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "payment_processor" {
  family                   = "payment-processor-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "payment-processor"
      image     = var.container_image
      cpu       = var.task_cpu
      memory    = var.task_memory
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "DB_CONNECTION_STRING"
          valueFrom = aws_ssm_parameter.db_connection_string.arn
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_tasks.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment-processor"
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

  tags = {
    Name        = "payment-processor-task-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ECS Service - Blue Environment
resource "aws_ecs_service" "blue" {
  name            = "payment-service-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.payment_processor.arn
  desired_count   = var.desired_count_blue
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-processor"
    container_port   = var.container_port
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name        = "payment-service-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "blue"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]
}

# ECS Service - Green Environment
resource "aws_ecs_service" "green" {
  name            = "payment-service-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.payment_processor.arn
  desired_count   = var.desired_count_green
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "payment-processor"
    container_port   = var.container_port
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name        = "payment-service-green-${var.environment_suffix}"
    Environment = var.environment_suffix
    Color       = "green"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]
}
```

## File: lib/rds.tf

```hcl
# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "payment-aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "payment-aurora-subnet-group-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Random password for Aurora master user
resource "random_password" "db_master_password" {
  length  = 32
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora_postgresql" {
  cluster_identifier      = "payment-aurora-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = "paymentdb"
  master_username         = var.db_master_username
  master_password         = random_password.db_master_password.result
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.rds.id]

  backup_retention_period = var.db_backup_retention_days
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot       = false
  final_snapshot_identifier = "payment-aurora-${var.environment_suffix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  apply_immediately = false

  tags = {
    Name        = "payment-aurora-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier
    ]
  }
}

# Aurora Cluster Instances (Multi-AZ)
resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 2
  identifier         = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora_postgresql.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.aurora_postgresql.engine
  engine_version     = aws_rds_cluster.aurora_postgresql.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_role.arn

  tags = {
    Name        = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS Aurora encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "payment-rds-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# KMS Key Alias
resource "aws_kms_alias" "rds" {
  name          = "alias/payment-rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}
```

## File: lib/ssm.tf

```hcl
# Store database connection string in Parameter Store
resource "aws_ssm_parameter" "db_connection_string" {
  name        = "/payment/${var.environment_suffix}/db/connection_string"
  description = "Database connection string for payment processor"
  type        = "SecureString"
  value = format(
    "postgresql://%s:%s@%s:5432/%s",
    aws_rds_cluster.aurora_postgresql.master_username,
    random_password.db_master_password.result,
    aws_rds_cluster.aurora_postgresql.endpoint,
    aws_rds_cluster.aurora_postgresql.database_name
  )

  tags = {
    Name        = "payment-db-connection-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database password in Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name        = "/payment/${var.environment_suffix}/db/password"
  description = "Database master password"
  type        = "SecureString"
  value       = random_password.db_master_password.result

  tags = {
    Name        = "payment-db-password-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database endpoint in Parameter Store
resource "aws_ssm_parameter" "db_endpoint" {
  name        = "/payment/${var.environment_suffix}/db/endpoint"
  description = "Database cluster endpoint"
  type        = "String"
  value       = aws_rds_cluster.aurora_postgresql.endpoint

  tags = {
    Name        = "payment-db-endpoint-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database reader endpoint in Parameter Store
resource "aws_ssm_parameter" "db_reader_endpoint" {
  name        = "/payment/${var.environment_suffix}/db/reader_endpoint"
  description = "Database cluster reader endpoint"
  type        = "String"
  value       = aws_rds_cluster.aurora_postgresql.reader_endpoint

  tags = {
    Name        = "payment-db-reader-endpoint-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

## File: lib/iam.tf

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "payment-ecs-execution-role-${var.environment_suffix}"

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

  tags = {
    Name        = "payment-ecs-execution-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for accessing Parameter Store and KMS
resource "aws_iam_role_policy" "ecs_execution_role_ssm_policy" {
  name = "ssm-kms-access"
  role = aws_iam_role.ecs_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParameterHistory"
        ]
        Resource = [
          aws_ssm_parameter.db_connection_string.arn,
          aws_ssm_parameter.db_password.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "payment-ecs-task-role-${var.environment_suffix}"

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

  tags = {
    Name        = "payment-ecs-task-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Policy for ECS Task to access AWS services
resource "aws_iam_role_policy" "ecs_task_role_policy" {
  name = "ecs-task-permissions"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/payment/${var.environment_suffix}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring_role" {
  name = "payment-rds-monitoring-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "payment-rds-monitoring-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring_role_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Log Group for ECS Tasks
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/payment-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "payment-ecs-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for Aurora PostgreSQL
resource "aws_cloudwatch_log_group" "aurora_postgresql" {
  name              = "/aws/rds/cluster/payment-aurora-${var.environment_suffix}/postgresql"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "payment-aurora-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ALB Unhealthy Hosts (Blue)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts_blue" {
  alarm_name          = "payment-alb-unhealthy-hosts-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when blue environment has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
  }

  tags = {
    Name        = "payment-alarm-unhealthy-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ALB Unhealthy Hosts (Green)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts_green" {
  alarm_name          = "payment-alb-unhealthy-hosts-green-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when green environment has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.green.arn_suffix
  }

  tags = {
    Name        = "payment-alarm-unhealthy-green-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ECS CPU Utilization (Blue)
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_blue" {
  alarm_name          = "payment-ecs-cpu-high-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when blue ECS service CPU is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name        = "payment-alarm-cpu-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ECS Memory Utilization (Blue)
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_blue" {
  alarm_name          = "payment-ecs-memory-high-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when blue ECS service memory is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name        = "payment-alarm-memory-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - Aurora CPU Utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "payment-aurora-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when Aurora CPU utilization is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_postgresql.cluster_identifier
  }

  tags = {
    Name        = "payment-alarm-aurora-cpu-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - Aurora Database Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections_high" {
  alarm_name          = "payment-aurora-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when Aurora database connections are high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_postgresql.cluster_identifier
  }

  tags = {
    Name        = "payment-alarm-aurora-connections-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

## File: lib/autoscaling.tf

```hcl
# Auto-scaling Target for Blue Service
resource "aws_appautoscaling_target" "ecs_target_blue" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto-scaling Policy for Blue Service - CPU
resource "aws_appautoscaling_policy" "ecs_policy_cpu_blue" {
  name               = "payment-ecs-cpu-scaling-blue-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Policy for Blue Service - Memory
resource "aws_appautoscaling_policy" "ecs_policy_memory_blue" {
  name               = "payment-ecs-memory-scaling-blue-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Target for Green Service
resource "aws_appautoscaling_target" "ecs_target_green" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.green.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto-scaling Policy for Green Service - CPU
resource "aws_appautoscaling_policy" "ecs_policy_cpu_green" {
  name               = "payment-ecs-cpu-scaling-green-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_green.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling Policy for Green Service - Memory
resource "aws_appautoscaling_policy" "ecs_policy_memory_green" {
  name               = "payment-ecs-memory-scaling-green-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target_green.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target_green.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target_green.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_blue_name" {
  description = "Name of the blue ECS service"
  value       = aws_ecs_service.blue.name
}

output "ecs_service_green_name" {
  description = "Name of the green ECS service"
  value       = aws_ecs_service.green.name
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.id
}

output "rds_cluster_arn" {
  description = "ARN of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.arn
}

output "db_connection_string_parameter" {
  description = "SSM Parameter name for database connection string"
  value       = aws_ssm_parameter.db_connection_string.name
}

output "db_password_parameter" {
  description = "SSM Parameter name for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs_tasks.name
}
```

## Blue-Green Deployment Strategy

### Initial State (Blue Active)
1. Blue environment runs with `desired_count_blue = 2`
2. Green environment is idle with `desired_count_green = 0`
3. ALB listener forwards all traffic to blue target group

### Deployment Process

#### Step 1: Deploy to Green Environment
```bash
# Update task definition with new code/image
terraform apply -var="container_image=your-registry/payment-processor:v2.0"

# Scale up green environment
terraform apply -var="desired_count_green=2"

# Wait for green tasks to be healthy
aws ecs wait services-stable --cluster payment-cluster-prod --services payment-service-green-prod
```

#### Step 2: Test Green Environment
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <green-target-group-arn>

# Test green environment directly (optional test traffic)
# You can temporarily add a listener rule to route specific headers to green
```

#### Step 3: Switch Traffic to Green
```bash
# Update ALB listener to point to green target group
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --default-actions Type=forward,TargetGroupArn=<green-target-group-arn>
```

#### Step 4: Monitor and Validate
```bash
# Monitor CloudWatch metrics for errors
# Check application logs in CloudWatch Logs
# Validate payment processing is working correctly
```

#### Step 5: Scale Down Blue (After Validation)
```bash
# Scale down blue environment after confirming green is stable
terraform apply -var="desired_count_blue=0"
```

#### Step 6: Rollback (If Needed)
```bash
# If issues detected, immediately switch traffic back to blue
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --default-actions Type=forward,TargetGroupArn=<blue-target-group-arn>

# Scale up blue if it was scaled down
terraform apply -var="desired_count_blue=2"
```

### Advanced Traffic Shifting (Optional)

For gradual traffic shifting, you can use weighted target groups:

```bash
# 90% blue, 10% green
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --default-actions Type=forward,ForwardConfig='{
    "TargetGroups": [
      {"TargetGroupArn": "<blue-arn>", "Weight": 90},
      {"TargetGroupArn": "<green-arn>", "Weight": 10}
    ]
  }'

# Gradually increase green weight: 70/30, 50/50, 30/70, 0/100
```

## Deployment Instructions

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. Docker image for payment processor published to ECR or Docker Hub

### Initial Deployment

```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Get ALB DNS name
terraform output alb_dns_name
```

### Variable Configuration

Create a `terraform.tfvars` file:

```hcl
environment_suffix        = "prod"
aws_region               = "us-east-1"
container_image          = "your-registry/payment-processor:v1.0"
desired_count_blue       = 2
desired_count_green      = 0
db_master_username       = "paymentadmin"
autoscaling_min_capacity = 2
autoscaling_max_capacity = 10
autoscaling_target_cpu   = 70
```

### Monitoring

Access CloudWatch Logs:
```bash
# View ECS task logs
aws logs tail /ecs/payment-processor-prod --follow

# View Aurora logs
aws logs tail /aws/rds/cluster/payment-aurora-prod/postgresql --follow
```

Check service health:
```bash
# Check ECS service status
aws ecs describe-services \
  --cluster payment-cluster-prod \
  --services payment-service-blue-prod payment-service-green-prod

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Security Considerations

1. **Network Security**: All compute resources run in private subnets with no direct internet access
2. **Database Encryption**: Aurora cluster uses KMS encryption at rest
3. **Secrets Management**: Database credentials stored in Parameter Store with SecureString encryption
4. **IAM Least Privilege**: Separate execution and task roles with minimal required permissions
5. **Security Groups**: Strict ingress rules - ALB only accepts internet traffic, ECS tasks only accept ALB traffic, RDS only accepts ECS traffic

## Cost Optimization Notes

- NAT Gateways are deployed in all AZs for high availability (consider single NAT for dev/test)
- Aurora instances use provisioned mode (consider Serverless v2 for variable workloads)
- Auto-scaling policies prevent over-provisioning during low traffic
- CloudWatch log retention set to 30 days (adjust based on compliance requirements)

## Testing Recommendations

1. Test database connectivity from ECS tasks
2. Validate ALB health checks are passing
3. Test auto-scaling by generating load
4. Verify CloudWatch alarms trigger correctly
5. Practice blue-green deployment in staging environment first
6. Test rollback procedure under load

## Cleanup

To destroy all resources:
```bash
# Warning: This will delete all data including database snapshots
terraform destroy

# To preserve final snapshot, ensure skip_final_snapshot = false (default)
```
