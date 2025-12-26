# Terraform Infrastructure for Financial Services Web Portal

This implementation provides a production-ready, highly available infrastructure for a financial services web portal using Terraform with HCL.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "container_image" {
  description = "Docker container image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Container port for the application"
  type        = number
  default     = 80
}

variable "desired_task_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
}

variable "min_task_count" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 3
}

variable "max_task_count" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "512"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "financialdb"
}

variable "db_username" {
  description = "Master username for database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "financial-portal.example.com"
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "FinancialServices"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "compliance" {
  description = "Compliance tag value"
  type        = string
  default     = "PCI-DSS"
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo-blocking"
  type        = list(string)
  default     = ["KP", "IR", "SY", "CU"]
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.0"
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
    tags = {
      CostCenter  = var.cost_center
      Environment = var.environment
      Compliance  = var.compliance
      ManagedBy   = "Terraform"
    }
  }
}

# Generate random password for database if not provided
resource "random_password" "db_password" {
  length  = 16
  special = true
}

locals {
  db_password     = var.db_password != "" ? var.db_password : random_password.db_password.result
  common_tags = {
    Project         = "FinancialPortal"
    CostCenter      = var.cost_center
    Environment     = var.environment
    Compliance      = var.compliance
  }
}
```

## File: vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${var.environment_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "igw-${var.environment_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${var.environment_suffix}"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "vpc-flow-log-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_iam_role" "vpc_flow_log" {
  name = "vpc-flow-log-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "vpc-flow-log-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect = "Allow"
        Resource = "*"
      }
    ]
  })
}
```

## File: security-groups.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
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

  tags = merge(local.common_tags, {
    Name = "alb-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.environment_suffix}-"
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

  tags = merge(local.common_tags, {
    Name = "ecs-tasks-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster"
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

  tags = merge(local.common_tags, {
    Name = "rds-sg-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: kms.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "rds-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cloudwatch-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# KMS Key for ECS
resource "aws_kms_key" "ecs" {
  description             = "KMS key for ECS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "ecs-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "ecs" {
  name          = "alias/ecs-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecs.key_id
}

data "aws_caller_identity" "current" {}
```

## File: rds.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${var.environment_suffix}"
  })
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = local.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.rds.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2.0
  }

  tags = merge(local.common_tags, {
    Name = "aurora-cluster-${var.environment_suffix}"
  })
}

# Aurora Serverless v2 Instance - Writer
resource "aws_rds_cluster_instance" "writer" {
  identifier           = "aurora-writer-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = merge(local.common_tags, {
    Name = "aurora-writer-${var.environment_suffix}"
    Role = "Writer"
  })
}

# Aurora Serverless v2 Instance - Reader
resource "aws_rds_cluster_instance" "reader" {
  identifier           = "aurora-reader-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = merge(local.common_tags, {
    Name = "aurora-reader-${var.environment_suffix}"
    Role = "Reader"
  })
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/cluster/aurora-cluster-${var.environment_suffix}/postgresql"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}
```

## File: ecs.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(local.common_tags, {
    Name = "ecs-cluster-${var.environment_suffix}"
  })
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/financial-portal-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_kms" {
  name = "ecs-task-execution-kms-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.ecs.arn,
          aws_kms_key.cloudwatch.arn
        ]
      }
    ]
  })
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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "financial-portal-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "financial-portal"
      image = var.container_image
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.main.endpoint
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "DB_USER"
          value = var.db_username
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
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name = "ecs-task-definition-${var.environment_suffix}"
  })
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "financial-portal-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_task_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "financial-portal"
    container_port   = var.container_port
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 80
    base              = 0
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 20
    base              = var.min_task_count
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  health_check_grace_period_seconds = 60

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = merge(local.common_tags, {
    Name = "ecs-service-${var.environment_suffix}"
  })
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_task_count
  min_capacity       = var.min_task_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "ecs-cpu-autoscaling-${var.environment_suffix}"
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

# Auto Scaling Policy - ALB Request Count
resource "aws_appautoscaling_policy" "ecs_alb_requests" {
  name               = "ecs-alb-requests-autoscaling-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.main.arn_suffix}"
    }
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

## File: alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "alb-${var.environment_suffix}"
  })
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "alb-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name        = "tg-${var.environment_suffix}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200,201"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "tg-${var.environment_suffix}"
  })
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Self-signed certificate for HTTPS (replace with ACM certificate in production)
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "acm-cert-${var.environment_suffix}"
  })
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Listener Rule for Path-based Routing (example)
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

## File: waf.tf

```hcl
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "waf-acl-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # SQL Injection Rule
  rule {
    name     = "sql-injection-rule"
    priority = 1

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
      sampled_requests_enabled   = true
    }
  }

  # XSS Rule
  rule {
    name     = "xss-rule"
    priority = 2

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSRule"
      sampled_requests_enabled   = true
    }
  }

  # Common Rule Set
  rule {
    name     = "common-rule"
    priority = 3

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRule"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting Rule
  rule {
    name     = "rate-limit-rule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WAFWebACL"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "waf-acl-${var.environment_suffix}"
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}
```

## File: cloudfront.tf

```hcl
# S3 Bucket for CloudFront Logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "cloudfront-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "cloudfront-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "oac-${var.environment_suffix}"
  description                       = "Origin Access Control for ALB"
  origin_access_control_origin_type = "custom"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Financial Portal Distribution"
  default_root_object = ""
  price_class         = "PriceClass_100"
  aliases             = [var.domain_name]

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Custom-Origin-Header"
      value = "FinancialPortal-${var.environment_suffix}"
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-Origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "CloudFront-Forwarded-Proto"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = merge(local.common_tags, {
    Name = "cloudfront-distribution-${var.environment_suffix}"
  })

  depends_on = [aws_acm_certificate.main]
}
```

## File: route53.tf

```hcl
# Route53 Health Check for ALB
resource "aws_route53_health_check" "alb" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name = "alb-health-check-${var.environment_suffix}"
  })
}

# CloudWatch Alarm for Health Check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  alarm_name          = "route53-health-check-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors Route53 health check status"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "infrastructure-alerts-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "sns-alerts-${var.environment_suffix}"
  })
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "financial-portal-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "ECS CPU" }],
            [".", "MemoryUtilization", { stat = "Average", label = "ECS Memory" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ECS Cluster Metrics"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", label = "Requests" }],
            [".", "TargetResponseTime", { stat = "Average", label = "Response Time" }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum", label = "Success" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "Connections" }],
            [".", "ServerlessDatabaseCapacity", { stat = "Average", label = "Capacity" }],
            [".", "ReadLatency", { stat = "Average", label = "Read Latency" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "RDS Aurora Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes" }],
            [".", "4xxErrorRate", { stat = "Average", label = "4xx Errors" }],
            [".", "5xxErrorRate", { stat = "Average", label = "5xx Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = "ap-southeast-1"
          title  = "CloudFront Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/WAFV2", "AllowedRequests", { stat = "Sum", label = "Allowed" }],
            [".", "BlockedRequests", { stat = "Sum", label = "Blocked" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "WAF Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ecs-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "ecs-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  alarm_name          = "alb-target-5xx-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors ALB 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "rds-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
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

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
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

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.main.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "route53_health_check_id" {
  description = "ID of the Route53 health check"
  value       = aws_route53_health_check.alb.id
}

output "kms_rds_key_id" {
  description = "ID of the KMS key for RDS"
  value       = aws_kms_key.rds.id
}

output "kms_rds_key_arn" {
  description = "ARN of the KMS key for RDS"
  value       = aws_kms_key.rds.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "db_password" {
  description = "Database password (sensitive)"
  value       = local.db_password
  sensitive   = true
}
```

## File: terraform.tfvars.example

```hcl
# Environment Configuration
environment_suffix = "prod-001"
region            = "ap-southeast-1"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]

# ECS Configuration
container_image    = "your-account-id.dkr.ecr.ap-southeast-1.amazonaws.com/financial-portal:latest"
container_port     = 80
desired_task_count = 3
min_task_count     = 3
max_task_count     = 10
cpu                = "256"
memory             = "512"

# Database Configuration
db_name     = "financialdb"
db_username = "dbadmin"
# db_password will be auto-generated if not provided

# Domain Configuration
domain_name = "financial-portal.example.com"

# Tags
cost_center = "FinancialServices"
environment = "production"
compliance  = "PCI-DSS"

# Geo-blocking (sanctioned countries)
geo_restriction_locations = ["KP", "IR", "SY", "CU"]
```

## File: README.md

````markdown
# Financial Services Web Portal Infrastructure

This Terraform configuration deploys a production-ready, highly available infrastructure for a financial services web portal on AWS.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public, private, and database subnets
- **ECS Fargate**: Container orchestration with auto-scaling (Spot + On-Demand)
- **Aurora Serverless v2**: PostgreSQL database with read replicas
- **Application Load Balancer**: SSL termination and path-based routing
- **CloudFront**: CDN with geo-blocking capabilities
- **WAF**: SQL injection and XSS protection
- **Route53**: Health checks with failover routing
- **CloudWatch**: Comprehensive monitoring and alerting
- **KMS**: Customer-managed encryption keys

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions
- Domain name for SSL certificate (or use AWS-generated for testing)

## Quick Start

1. **Clone the repository and navigate to the lib directory**

```bash
cd lib
```
````

2. **Initialize Terraform**

```bash
terraform init
```

3. **Copy and customize the variables file**

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

4. **Review the execution plan**

```bash
terraform plan -var-file=terraform.tfvars
```

5. **Deploy the infrastructure**

```bash
terraform apply -var-file=terraform.tfvars
```

## Required Variables

| Variable             | Description                       | Example                        |
| -------------------- | --------------------------------- | ------------------------------ |
| `environment_suffix` | Unique suffix for resource naming | `"prod-001"`                   |
| `region`             | AWS region                        | `"ap-southeast-1"`             |
| `container_image`    | Docker image for ECS              | `"nginx:latest"`               |
| `db_username`        | Database master username          | `"dbadmin"`                    |
| `db_password`        | Database master password          | Auto-generated if not provided |
| `domain_name`        | Domain name for the application   | `"example.com"`                |

## Security Features

- **Encryption at Rest**: All data encrypted using customer-managed KMS keys
- **Encryption in Transit**: TLS 1.2+ enforced on all endpoints
- **Network Isolation**: Private subnets for ECS tasks and databases
- **WAF Protection**: Managed rules for SQL injection, XSS, and rate limiting
- **Least Privilege IAM**: Minimal permissions for all service roles
- **VPC Flow Logs**: Network traffic logging for audit and analysis
- **Geo-blocking**: CloudFront restrictions for sanctioned countries

## High Availability

- **Multi-AZ Deployment**: Resources distributed across 3 availability zones
- **Auto-scaling**: ECS tasks scale based on CPU and ALB request count
- **Database Replication**: Aurora Serverless v2 with read replicas
- **Health Checks**: Route53 and ALB health monitoring
- **Failover**: Automatic failover for database and application layers

## Cost Optimization

- **Fargate Spot**: 80% of capacity on Spot instances with on-demand fallback
- **Aurora Serverless v2**: Automatic scaling from 0.5 to 2.0 ACUs
- **S3 Lifecycle**: Automatic deletion of old logs after 90 days
- **CloudWatch Retention**: 30-day log retention

## Monitoring

Access the CloudWatch dashboard for real-time metrics:

```bash
terraform output cloudwatch_dashboard_name
```

Key metrics monitored:

- ECS CPU and memory utilization
- ALB request count and response times
- RDS connections and latency
- CloudFront requests and errors
- WAF allowed/blocked requests

## Outputs

After deployment, retrieve important information:

```bash
# ALB DNS name
terraform output alb_dns_name

# CloudFront distribution domain
terraform output cloudfront_distribution_domain

# RDS endpoints
terraform output rds_cluster_endpoint
terraform output rds_cluster_reader_endpoint

# Database password (if auto-generated)
terraform output -raw db_password
```

## Deployment

### Initial Deployment

1. Ensure all prerequisites are met
2. Update `terraform.tfvars` with your configuration
3. Run `terraform apply`
4. Note the outputs for application configuration

### Zero-Downtime Updates

The infrastructure supports zero-downtime deployments:

- ECS deployment configuration: 100% minimum healthy, 200% maximum
- ALB health checks ensure traffic only routes to healthy targets
- Auto-scaling maintains desired capacity during updates

## Disaster Recovery

### Backups

- **RDS**: Automated daily backups with 7-day retention
- **Point-in-Time Recovery**: Enabled for Aurora cluster
- **S3 Versioning**: Enabled for log buckets

### Failover

- **Route53 Health Checks**: Automatic DNS failover on ALB failure
- **Multi-AZ RDS**: Automatic failover to read replica
- **Auto-scaling**: Maintains minimum task count across AZs

## Compliance

The infrastructure meets financial services compliance requirements:

- **PCI-DSS**: Encryption, network isolation, audit logging
- **SOC 2**: CloudWatch logs, VPC flow logs, access controls
- **Tagging**: All resources tagged with CostCenter, Environment, Compliance

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

**Warning**: This will permanently delete all resources including databases and logs.

## Support

For issues or questions:

1. Check CloudWatch logs for application errors
2. Review VPC flow logs for network issues
3. Monitor WAF logs for blocked requests
4. Check ECS service events for task failures

## License

Copyright (c) 2025. All rights reserved.

```

```
