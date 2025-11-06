# Multi-Environment Infrastructure with Terraform Workspaces

This solution provides a workspace-based Terraform configuration to deploy identical infrastructure across development, staging, and production environments using environment-specific tfvars files.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-bucket-fintech"
    key            = "payment-platform/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"

    # Workspace-aware state file paths
    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment  = var.environment_suffix
      ManagedBy    = "terraform"
      Project      = "payment-platform"
      Workspace    = terraform.workspace
    }
  }
}
```

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid collisions"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-platform"
}

variable "ecs_task_count" {
  description = "Number of ECS tasks to run"
  type        = number
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "alb_health_check_interval" {
  description = "ALB health check interval in seconds"
  type        = number
  default     = 30
}

variable "s3_lifecycle_days" {
  description = "Days before transitioning S3 objects to IA"
  type        = number
  default     = 90
}
```

## File: locals.tf

```hcl
locals {
  # Environment-specific naming
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  # Availability zones
  azs = data.aws_availability_zones.available.names

  # Common tags
  common_tags = {
    Environment      = var.environment_suffix
    ManagedBy        = "terraform"
    Project          = var.project_name
    Workspace        = terraform.workspace
    EnvironmentSuffix = var.environment_suffix
  }
}

data "aws_availability_zones" "available" {
  state = "available"
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
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Private Subnets for ECS
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 2)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "private"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# NAT Gateway EIP
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "nat-gw-${count.index + 1}-${var.environment_suffix}"
  })
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
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Database Route Tables
resource "aws_route_table" "database" {
  count = 2

  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "database-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = 2

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}
```

## File: security.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
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
    description = "All traffic"
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

# ECS Security Group
resource "aws_security_group" "ecs" {
  name_prefix = "ecs-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "ecs-sg-${var.environment_suffix}"
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
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "All traffic"
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
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "alb-${var.environment_suffix}"
  })
}

# Target Group for ECS Service
resource "aws_lb_target_group" "ecs" {
  name        = "ecs-tg-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = var.alb_health_check_interval
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "ecs-tg-${var.environment_suffix}"
  })
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs.arn
  }

  tags = merge(local.common_tags, {
    Name = "http-listener-${var.environment_suffix}"
  })
}

# Path-based routing rule for payment processing
resource "aws_lb_listener_rule" "payment" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs.arn
  }

  condition {
    path_pattern {
      values = ["/payment/*", "/api/payment/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "payment-rule-${var.environment_suffix}"
  })
}

# Path-based routing rule for transactions
resource "aws_lb_listener_rule" "transactions" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs.arn
  }

  condition {
    path_pattern {
      values = ["/transactions/*", "/api/transactions/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "transactions-rule-${var.environment_suffix}"
  })
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

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/payment-platform-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "ecs-logs-${var.environment_suffix}"
  })
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

  tags = merge(local.common_tags, {
    Name = "ecs-execution-role-${var.environment_suffix}"
  })
}

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

  tags = merge(local.common_tags, {
    Name = "ecs-task-role-${var.environment_suffix}"
  })
}

# Policy for ECS tasks to access S3 audit logs
resource "aws_iam_policy" "ecs_s3_access" {
  name        = "ecs-s3-access-${var.environment_suffix}"
  description = "Allow ECS tasks to write to S3 audit logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "ecs-s3-policy-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_s3_access" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_s3_access.arn
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "payment-app-${var.environment_suffix}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-processor"
      image     = "nginx:latest"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        },
        {
          name  = "DB_HOST"
          value = aws_rds_cluster.main.endpoint
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name = "ecs-task-${var.environment_suffix}"
  })
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "payment-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_task_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs.arn
    container_name   = "payment-processor"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]

  tags = merge(local.common_tags, {
    Name = "ecs-service-${var.environment_suffix}"
  })
}
```

## File: rds.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "rds-subnet-group-${var.environment_suffix}"
  })
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = "paymentdb"
  master_username         = "dbadmin"
  master_password         = "ChangeMe123!"
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  skip_final_snapshot            = true

  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  tags = merge(local.common_tags, {
    Name = "aurora-cluster-${var.environment_suffix}"
  })
}

# RDS Aurora Cluster Instance
resource "aws_rds_cluster_instance" "main" {
  count = 1

  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.rds_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  tags = merge(local.common_tags, {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

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

  tags = merge(local.common_tags, {
    Name = "rds-monitoring-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

## File: s3.tf

```hcl
# S3 Bucket for Audit Logs
resource "aws_s3_bucket" "audit_logs" {
  bucket = "audit-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "audit-logs-${var.environment_suffix}"
  })
}

data "aws_caller_identity" "current" {}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = var.s3_lifecycle_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  target_bucket = aws_s3_bucket.audit_logs.id
  target_prefix = "logs/"
}
```

## File: outputs.tf

```hcl
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# ALB Outputs
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

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_count" {
  description = "Number of ECS tasks running"
  value       = aws_ecs_service.app.desired_count
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.main.database_name
}

# S3 Outputs
output "audit_logs_bucket_name" {
  description = "Name of the S3 audit logs bucket"
  value       = aws_s3_bucket.audit_logs.bucket
}

output "audit_logs_bucket_arn" {
  description = "ARN of the S3 audit logs bucket"
  value       = aws_s3_bucket.audit_logs.arn
}

# Environment Summary
output "environment_summary" {
  description = "Summary of the deployed environment"
  value = {
    environment          = var.environment_suffix
    workspace           = terraform.workspace
    vpc_cidr            = var.vpc_cidr
    ecs_task_count      = var.ecs_task_count
    rds_instance_class  = var.rds_instance_class
    region              = var.aws_region
    alb_endpoint        = aws_lb.main.dns_name
    rds_endpoint        = aws_rds_cluster.main.endpoint
  }
}
```

## File: terraform.tfvars

```hcl
# Default values (can be overridden by workspace-specific tfvars)
aws_region                = "ap-southeast-1"
project_name              = "payment-platform"
environment_suffix        = "default"
vpc_cidr                  = "10.1.0.0/16"
ecs_task_count            = 1
rds_instance_class        = "db.t3.micro"
alb_health_check_interval = 30
s3_lifecycle_days         = 90
```

## File: dev.tfvars

```hcl
# Development environment configuration
environment_suffix        = "dev"
vpc_cidr                  = "10.1.0.0/16"
ecs_task_count            = 1
rds_instance_class        = "db.t3.micro"
alb_health_check_interval = 60
s3_lifecycle_days         = 30
```

## File: staging.tfvars

```hcl
# Staging environment configuration
environment_suffix        = "staging"
vpc_cidr                  = "10.2.0.0/16"
ecs_task_count            = 2
rds_instance_class        = "db.t3.small"
alb_health_check_interval = 45
s3_lifecycle_days         = 60
```

## File: prod.tfvars

```hcl
# Production environment configuration
environment_suffix        = "prod"
vpc_cidr                  = "10.3.0.0/16"
ecs_task_count            = 3
rds_instance_class        = "db.t3.medium"
alb_health_check_interval = 30
s3_lifecycle_days         = 90
```

## File: README.md

```markdown
# Multi-Environment Payment Platform Infrastructure

This Terraform configuration deploys identical infrastructure across development, staging, and production environments using workspace-based configuration.

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for remote state: `terraform-state-bucket-fintech`
- DynamoDB table for state locking: `terraform-state-lock`

## Architecture

Each environment consists of:
- **VPC** with non-overlapping CIDR blocks (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod)
- **ECS Fargate** cluster with environment-appropriate task counts
- **RDS Aurora PostgreSQL** cluster with automated backups
- **Application Load Balancer** with path-based routing
- **S3 buckets** with versioning and lifecycle policies

## Workspace Setup

### Create Workspaces

```bash
# Create development workspace
terraform workspace new dev

# Create staging workspace
terraform workspace new staging

# Create production workspace
terraform workspace new prod
```

### Select Workspace

```bash
terraform workspace select dev
```

## Deployment

### Development Environment

```bash
terraform workspace select dev
terraform init
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
```

### Staging Environment

```bash
terraform workspace select staging
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Production Environment

```bash
terraform workspace select prod
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

## Environment-Specific Configuration

| Environment | VPC CIDR     | ECS Tasks | RDS Instance  | Health Check Interval |
|-------------|-------------|-----------|---------------|----------------------|
| dev         | 10.1.0.0/16 | 1         | db.t3.micro   | 60s                  |
| staging     | 10.2.0.0/16 | 2         | db.t3.small   | 45s                  |
| prod        | 10.3.0.0/16 | 3         | db.t3.medium  | 30s                  |

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name` - ALB endpoint for the application
- `rds_cluster_endpoint` - Database writer endpoint
- `ecs_cluster_name` - ECS cluster name
- `audit_logs_bucket_name` - S3 bucket for audit logs

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example: `ecs-cluster-dev`, `alb-staging`, `vpc-prod`

## Cleanup

```bash
# Select the workspace to destroy
terraform workspace select dev

# Destroy infrastructure
terraform destroy -var-file="dev.tfvars"
```

## Security Features

- VPC with public and private subnets across 2 AZs
- Security groups with least privilege access
- RDS encryption at rest
- S3 bucket encryption and versioning
- CloudWatch logging enabled
- Enhanced RDS monitoring

## Cost Optimization

- NAT Gateways (consider NAT instances for dev)
- RDS Aurora with appropriate instance sizes per environment
- S3 lifecycle policies to transition to IA and Glacier
- ECS Fargate with scaled task counts
```

## Deployment Instructions

1. **Initialize Remote Backend**: Ensure the S3 bucket `terraform-state-bucket-fintech` and DynamoDB table `terraform-state-lock` exist in `ap-southeast-1`.

2. **Create Workspaces**: Create three workspaces (dev, staging, prod) using `terraform workspace new`.

3. **Deploy Per Environment**: Switch to each workspace and apply with the corresponding tfvars file.

4. **Verify Outputs**: Check the outputs to get ALB DNS name and RDS endpoints.

## Testing

- Access the ALB DNS name at `/health` to verify ECS service health
- Test path-based routing at `/payment/*` and `/transactions/*`
- Verify S3 bucket versioning and lifecycle policies
- Check CloudWatch logs for ECS task logs
