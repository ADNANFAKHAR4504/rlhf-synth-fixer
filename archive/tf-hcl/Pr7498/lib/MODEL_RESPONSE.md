# Multi-Environment Infrastructure Consistency Framework

This solution implements a comprehensive multi-environment infrastructure framework using Terraform with workspace-based environment separation, reusable modules, and automated drift detection capabilities.

## File: modules/networking/main.tf

```hcl
# modules/networking/main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-vpc-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = can(regex("^[a-z]+-(dev|staging|prod)-[a-z0-9]+$", "${var.environment}-vpc-${var.environment_suffix}"))
      error_message = "Resource name must follow {environment}-{service}-{resource-type}-{suffix} pattern."
    }
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-igw-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
      Tier = "public"
    }
  )
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
      Tier = "private"
    }
  )
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-nat-eip-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-nat-gateway-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-public-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: modules/networking/variables.tf

```hcl
# modules/networking/variables.tf
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters and numbers."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 3
    error_message = "Exactly 3 availability zones must be specified."
  }
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/networking/outputs.tf

```hcl
# modules/networking/outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## File: modules/alb/main.tf

```hcl
# modules/alb/main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

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
    var.common_tags,
    {
      Name = "${var.environment}-alb-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection = false

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-alb-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = length(var.subnet_ids) >= 2
      error_message = "ALB requires at least 2 subnets in different availability zones."
    }
  }
}

resource "aws_lb_target_group" "app" {
  name_prefix = substr("${var.environment}-tg-", 0, 6)
  port        = var.target_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-tg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = var.common_tags
}
```

## File: modules/alb/variables.tf

```hcl
# modules/alb/variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ALB"
  type        = list(string)
}

variable "target_port" {
  description = "Target port for application"
  type        = number
  default     = 80
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/alb/outputs.tf

```hcl
# modules/alb/outputs.tf
output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}
```

## File: modules/ecs/main.tf

```hcl
# modules/ecs/main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-ecs-cluster-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.environment}-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-ecs-logs-${var.environment_suffix}"
    }
  )
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.environment}-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-ecs-tasks-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "${var.environment}-ecs-exec-"

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
    var.common_tags,
    {
      Name = "${var.environment}-ecs-execution-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name_prefix = "${var.environment}-ecs-task-"

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
    var.common_tags,
    {
      Name = "${var.environment}-ecs-task-role-${var.environment_suffix}"
    }
  )
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}-app-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
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

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "DB_HOST"
          value = var.db_host
        }
      ]
    }
  ])

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-task-def-${var.environment_suffix}"
    }
  )
}

resource "aws_ecs_service" "app" {
  name            = "${var.environment}-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "app"
    container_port   = var.container_port
  }

  depends_on = [var.alb_listener_arn]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-ecs-service-${var.environment_suffix}"
    }
  )

  lifecycle {
    ignore_changes = [desired_count]
  }
}

data "aws_region" "current" {}
```

## File: modules/ecs/variables.tf

```hcl
# modules/ecs/variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN"
  type        = string
}

variable "alb_listener_arn" {
  description = "ALB listener ARN"
  type        = string
}

variable "container_image" {
  description = "Docker container image"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 80
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "db_host" {
  description = "Database host"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/ecs/outputs.tf

```hcl
# modules/ecs/outputs.tf
output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

output "security_group_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}
```

## File: modules/rds/main.tf

```hcl
# modules/rds/main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg-"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-rds-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.environment}-db-subnet-"
  description = "Database subnet group"
  subnet_ids  = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-db-subnet-group-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = length(var.private_subnet_ids) >= 2
      error_message = "RDS requires at least 2 subnets in different availability zones."
    }
  }
}

resource "aws_rds_cluster_parameter_group" "main" {
  name_prefix = "${var.environment}-aurora-pg-"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-cluster-pg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = "${var.environment}-aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  skip_final_snapshot       = true
  final_snapshot_identifier = null
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  storage_encrypted = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-cluster-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = can(regex("^[a-z]+-(dev|staging|prod)-aurora-cluster-[a-z0-9]+$", "${var.environment}-aurora-cluster-${var.environment_suffix}"))
      error_message = "Cluster identifier must follow naming convention."
    }
  }
}

resource "aws_rds_cluster_instance" "main" {
  count                = var.instance_count
  identifier           = "${var.environment}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = var.instance_class
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  performance_insights_enabled = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    }
  )
}
```

## File: modules/rds/variables.tf

```hcl
# modules/rds/variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS security group ID"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "appdb"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.database_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "master_username" {
  description = "Master username"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.master_username) >= 1 && length(var.master_username) <= 16
    error_message = "Master username must be between 1 and 16 characters."
  }
}

variable "master_password" {
  description = "Master password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.master_password) >= 8
    error_message = "Master password must be at least 8 characters."
  }
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "instance_count" {
  description = "Number of RDS instances"
  type        = number
  default     = 2

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 15
    error_message = "Instance count must be between 1 and 15."
  }
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/rds/outputs.tf

```hcl
# modules/rds/outputs.tf
output "cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.main.id
}

output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "RDS cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
```

## File: backend.tf

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket-example"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"

    # Workspace prefix for environment separation
    workspace_key_prefix = "workspaces"
  }
}
```

## File: main.tf

```hcl
# main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

# Cross-region provider aliases for replication
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment = var.environment
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
      Workspace   = terraform.workspace
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  common_tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
    Project     = "multi-environment-infrastructure"
  }
}

# Networking module
module "networking" {
  source = "./modules/networking"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  availability_zones = local.availability_zones
  common_tags        = local.common_tags
}

# Application Load Balancer module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.public_subnet_ids
  target_port        = var.container_port
  health_check_path  = var.health_check_path
  common_tags        = local.common_tags
}

# RDS Aurora module
module "rds" {
  source = "./modules/rds"

  environment           = var.environment
  environment_suffix    = var.environment_suffix
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id
  database_name         = var.database_name
  master_username       = var.db_master_username
  master_password       = var.db_master_password
  instance_class        = var.db_instance_class
  instance_count        = var.db_instance_count
  common_tags           = local.common_tags

  depends_on = [module.ecs]
}

# ECS Fargate module
module "ecs" {
  source = "./modules/ecs"

  environment           = var.environment
  environment_suffix    = var.environment_suffix
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  target_group_arn      = module.alb.target_group_arn
  alb_listener_arn      = module.alb.alb_dns_name
  container_image       = var.container_image
  container_port        = var.container_port
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  desired_count         = var.desired_count
  log_retention_days    = var.log_retention_days
  db_host               = module.rds.cluster_endpoint
  common_tags           = local.common_tags
}

# S3 bucket for state management (created separately)
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "terraform-state-bucket-${var.environment}-${var.environment_suffix}"
  force_destroy = true

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-state-bucket-${var.environment}-${var.environment_suffix}"
      Purpose = "Terraform state storage"
    }
  )

  lifecycle {
    precondition {
      condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", "terraform-state-bucket-${var.environment}-${var.environment_suffix}"))
      error_message = "S3 bucket name must be lowercase alphanumeric with hyphens."
    }
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks-${var.environment}-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-locks-${var.environment}-${var.environment_suffix}"
      Purpose = "Terraform state locking"
    }
  )
}

# Remote state data source example (for sharing outputs between environments)
data "terraform_remote_state" "shared" {
  count   = var.environment != "dev" ? 1 : 0
  backend = "s3"

  config = {
    bucket = "terraform-state-bucket-dev-${var.environment_suffix}"
    key    = "infrastructure/terraform.tfstate"
    region = var.aws_region
  }
}
```

## File: variables.tf

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{6,12}$", var.environment_suffix))
    error_message = "Environment suffix must be 6-12 lowercase alphanumeric characters."
  }
}

variable "cost_center" {
  description = "Cost center tag for billing"
  type        = string

  validation {
    condition     = length(var.cost_center) > 0
    error_message = "Cost center must not be empty."
  }
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ALB variables
variable "health_check_path" {
  description = "Health check path for ALB target group"
  type        = string
  default     = "/health"
}

# ECS variables
variable "container_image" {
  description = "Docker container image"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 80
}

variable "task_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# RDS variables
variable "database_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_instance_count" {
  description = "Number of RDS instances"
  type        = number
  default     = 2
}
```

## File: outputs.tf

```hcl
# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
  sensitive   = true
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint"
  value       = module.rds.cluster_reader_endpoint
  sensitive   = true
}

output "state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "locks_table_name" {
  description = "DynamoDB table name for state locks"
  value       = aws_dynamodb_table.terraform_locks.name
}
```

## File: terraform.tfvars.example

```hcl
# terraform.tfvars.example
# Copy to dev.tfvars, staging.tfvars, prod.tfvars and customize

# Region configuration
aws_region = "us-east-1"

# Environment configuration
environment        = "dev"
environment_suffix = "abc123"
cost_center        = "engineering"

# Networking
vpc_cidr = "10.0.0.0/16"

# ECS configuration
container_image    = "nginx:latest"
container_port     = 80
task_cpu           = 256
task_memory        = 512
desired_count      = 2
log_retention_days = 7

# RDS configuration
database_name      = "appdb"
db_master_username = "admin"
db_master_password = "ChangeMe123!"
db_instance_class  = "db.t4g.medium"
db_instance_count  = 2
```

## File: dev.tfvars

```hcl
# dev.tfvars - Development environment
aws_region         = "eu-west-1"
environment        = "dev"
environment_suffix = "devtest"
cost_center        = "engineering-dev"

vpc_cidr = "10.1.0.0/16"

# Smaller instances for dev
task_cpu           = 256
task_memory        = 512
desired_count      = 1
db_instance_class  = "db.t4g.medium"
db_instance_count  = 1
log_retention_days = 3

container_image    = "nginx:latest"
database_name      = "devdb"
db_master_username = "devadmin"
```

## File: staging.tfvars

```hcl
# staging.tfvars - Staging environment
aws_region         = "us-west-2"
environment        = "staging"
environment_suffix = "stgtest"
cost_center        = "engineering-staging"

vpc_cidr = "10.2.0.0/16"

# Medium-sized instances for staging
task_cpu           = 512
task_memory        = 1024
desired_count      = 2
db_instance_class  = "db.r6g.large"
db_instance_count  = 2
log_retention_days = 7

container_image    = "nginx:latest"
database_name      = "stagingdb"
db_master_username = "stagingadmin"
```

## File: prod.tfvars

```hcl
# prod.tfvars - Production environment
aws_region         = "us-east-1"
environment        = "prod"
environment_suffix = "prdmain"
cost_center        = "engineering-prod"

vpc_cidr = "10.3.0.0/16"

# Production-sized instances
task_cpu           = 1024
task_memory        = 2048
desired_count      = 4
db_instance_class  = "db.r6g.xlarge"
db_instance_count  = 3
log_retention_days = 30

container_image    = "nginx:latest"
database_name      = "proddb"
db_master_username = "prodadmin"
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure Consistency Framework

A comprehensive Terraform configuration implementing multi-environment infrastructure with workspace-based separation, reusable modules, and automated drift detection.

## Architecture

This solution implements a three-tier application architecture:
- **Network Layer**: VPC with public/private subnets across 3 AZs
- **Application Layer**: ECS Fargate with Application Load Balancer
- **Data Layer**: RDS Aurora PostgreSQL Multi-AZ cluster

## Features

- Workspace-based environment separation (dev, staging, prod)
- Reusable Terraform modules for networking, ALB, ECS, and RDS
- S3 backend with DynamoDB state locking
- Cross-region provider support for replication
- Validation rules using precondition blocks
- Environment-specific tfvars files
- Mandatory resource tagging (environment, cost-center)
- All resources follow naming convention: {environment}-{service}-{resource-type}-{suffix}

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS provider ~> 5.0

## Directory Structure

```
.
├── main.tf                    # Root configuration
├── backend.tf                 # S3 backend configuration
├── variables.tf               # Root variables
├── outputs.tf                 # Root outputs
├── dev.tfvars                 # Development environment variables
├── staging.tfvars             # Staging environment variables
├── prod.tfvars                # Production environment variables
├── modules/
│   ├── networking/            # VPC, subnets, NAT gateways
│   ├── alb/                   # Application Load Balancer
│   ├── ecs/                   # ECS Fargate cluster and services
│   └── rds/                   # RDS Aurora PostgreSQL
```

## Usage

### Initial Setup

1. **Create S3 bucket and DynamoDB table for state management** (run once):

```bash
# Create state bucket
aws s3 mb s3://terraform-state-bucket-example --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket terraform-state-bucket-example \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

2. **Update backend.tf** with your bucket name

3. **Create environment-specific tfvars** from examples

### Workspace Management

```bash
# Create and switch to dev workspace
terraform workspace new dev
terraform workspace select dev

# Create staging workspace
terraform workspace new staging

# Create prod workspace
terraform workspace new prod

# List workspaces
terraform workspace list

# Show current workspace
terraform workspace show
```

### Deploy Environment

```bash
# Initialize Terraform
terraform init

# Select workspace (environment)
terraform workspace select dev

# Validate configuration
terraform validate

# Plan deployment with environment-specific vars
terraform plan -var-file="dev.tfvars" -var="db_master_password=YourSecurePassword123!"

# Apply configuration
terraform apply -var-file="dev.tfvars" -var="db_master_password=YourSecurePassword123!"
```

### Deploy Multiple Environments

```bash
# Deploy dev
terraform workspace select dev
terraform apply -var-file="dev.tfvars" -var="db_master_password=DevPass123!"

# Deploy staging
terraform workspace select staging
terraform apply -var-file="staging.tfvars" -var="db_master_password=StagingPass123!"

# Deploy prod
terraform workspace select prod
terraform apply -var-file="prod.tfvars" -var="db_master_password=ProdPass123!"
```

### View Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output alb_dns_name

# View from different workspace
terraform workspace select staging
terraform output rds_cluster_endpoint
```

### Remote State Sharing

To reference outputs from another environment:

```hcl
data "terraform_remote_state" "dev" {
  backend = "s3"

  config = {
    bucket = "terraform-state-bucket-example"
    key    = "workspaces/dev/infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use output from dev environment
output "dev_vpc_id" {
  value = data.terraform_remote_state.dev.outputs.vpc_id
}
```

### Drift Detection

```bash
# Check for drift (changes outside Terraform)
terraform plan -var-file="dev.tfvars"

# If drift detected, refresh state
terraform apply -refresh-only -var-file="dev.tfvars"
```

### Destroy Environment

```bash
# Destroy specific environment
terraform workspace select dev
terraform destroy -var-file="dev.tfvars" -var="db_master_password=DevPass123!"
```

## Variables

### Required Variables

- `environment`: Environment name (dev, staging, prod)
- `environment_suffix`: Unique suffix for resource naming (6-12 chars)
- `cost_center`: Cost center tag for billing
- `db_master_username`: Database master username
- `db_master_password`: Database master password (sensitive)

### Optional Variables

See `variables.tf` for complete list with defaults.

## Validation Rules

The configuration includes precondition blocks that enforce:

1. **Naming Conventions**: Resources follow `{environment}-{service}-{resource-type}-{suffix}`
2. **Environment Values**: Only dev, staging, prod allowed
3. **Subnet Requirements**: Minimum 2 subnets for ALB and RDS (Multi-AZ)
4. **Database Names**: Must start with letter, alphanumeric only
5. **Password Strength**: Minimum 8 characters
6. **Region Format**: Valid AWS region identifiers

## Tagging Strategy

All resources automatically receive:

- `Environment`: From workspace/tfvars
- `CostCenter`: From tfvars (mandatory)
- `ManagedBy`: "Terraform"
- `Workspace`: Current workspace name

## Cross-Region Replication

Provider aliases are configured for multi-region support:

```hcl
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}
```

To use in modules:

```hcl
module "networking_replica" {
  source = "./modules/networking"

  providers = {
    aws = aws.us_west_2
  }

  # ... other variables
}
```

## Security Considerations

1. **Sensitive Variables**: Use environment variables or secret managers
   ```bash
   export TF_VAR_db_master_password="SecurePassword123!"
   terraform apply -var-file="prod.tfvars"
   ```

2. **State Encryption**: S3 bucket encryption enabled by default

3. **State Locking**: DynamoDB prevents concurrent modifications

4. **No Hardcoded Credentials**: All secrets via variables

5. **Security Groups**: Least privilege access patterns

## Monitoring and Maintenance

- ECS Container Insights enabled
- RDS Performance Insights enabled
- CloudWatch logs retention configurable per environment
- PostgreSQL query logging enabled

## Troubleshooting

### State Lock Issues

```bash
# If state is locked and process died
terraform force-unlock <LOCK_ID>
```

### Workspace State Issues

```bash
# If workspace doesn't exist in backend
terraform workspace new <workspace-name>
terraform init
```

### Module Changes

```bash
# After modifying modules
terraform init -upgrade
terraform plan -var-file="<env>.tfvars"
```

## Optional Enhancements

The architecture supports optional enhancements:

1. **CodeCommit**: Version control for modules
2. **EventBridge**: State change notifications
3. **Step Functions**: Automated remediation workflows

These can be added as additional modules without affecting core infrastructure.

## Contributing

When making changes:

1. Update modules in `modules/` directory
2. Test in dev workspace first
3. Update tfvars for all environments if needed
4. Run `terraform validate` and `terraform fmt`
5. Document changes in this README

## License

[Your License Here]
```
