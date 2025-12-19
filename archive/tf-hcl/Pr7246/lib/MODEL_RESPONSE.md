# Multi-Environment Terraform Infrastructure

This implementation provides a complete multi-environment infrastructure framework using Terraform workspaces.

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider (default region based on workspace)
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = terraform.workspace
      Project     = var.project_name
      ManagedBy   = "terraform"
      Team        = var.team_name
    }
  }
}

# Multi-region provider aliases
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

## File: lib/backend.tf

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket"  # INTENTIONAL ERROR: Hardcoded bucket name
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"  # INTENTIONAL ERROR: Hardcoded table name
    encrypt        = true
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env"
}

variable "team_name" {
  description = "Team name for resource tagging"
  type        = string
  default     = "platform"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "database_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "admin"
}

variable "database_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  default     = "Password123!"  # INTENTIONAL ERROR: Hardcoded password
  sensitive   = true
}

variable "container_image" {
  description = "Docker image for ECS task"
  type        = string
  default     = "nginx:latest"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}
```

## File: lib/main.tf

```hcl
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.availability_zones_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.availability_zones_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.availability_zones_count

  vpc = true  # INTENTIONAL ERROR: Deprecated API - should use domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.availability_zones_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
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
    Name = "${var.project_name}-public-rt"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.availability_zones_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-tasks-sg"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

resource "aws_security_group" "aurora" {
  name_prefix = "${var.project_name}-aurora-"
  description = "Security group for Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name = "${var.project_name}-aurora-sg"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"  # INTENTIONAL ERROR: Missing environment_suffix
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg"  # INTENTIONAL ERROR: Missing environment_suffix
  port        = 80
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

  tags = {
    Name = "${var.project_name}-tg"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"  # INTENTIONAL ERROR: Missing environment_suffix

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution"  # INTENTIONAL ERROR: Missing environment_suffix

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
    Name = "${var.project_name}-ecs-task-execution-role"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task"  # INTENTIONAL ERROR: Missing environment_suffix

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
    Name = "${var.project_name}-ecs-task-role"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"  # INTENTIONAL ERROR: Missing environment_suffix
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-ecs-logs"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project_name}-task"  # INTENTIONAL ERROR: Missing environment_suffix
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-container"
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
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-task-definition"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"  # INTENTIONAL ERROR: Missing environment_suffix
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "${var.project_name}-container"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.main]

  tags = {
    Name = "${var.project_name}-service"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 4
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.project_name}-ecs-cpu-scaling"  # INTENTIONAL ERROR: Missing environment_suffix
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Aurora DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.project_name}-aurora-subnet-group"  # INTENTIONAL ERROR: Missing environment_suffix
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-aurora-subnet-group"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.project_name}-Aurora-Cluster"  # INTENTIONAL ERROR: Uppercase in identifier violates AWS naming
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "appdb"
  master_username         = var.database_master_username
  master_password         = var.database_master_password
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora.id]
  backup_retention_period = 7
  preferred_backup_window = "02:00-03:00"
  # INTENTIONAL ERROR: Missing skip_final_snapshot = true (destroyability issue)

  tags = {
    Name = "${var.project_name}-aurora-cluster"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Aurora Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.project_name}-aurora-instance-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.medium"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = {
    Name = "${var.project_name}-aurora-instance-${count.index + 1}"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Lambda Execution Role
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-execution"  # INTENTIONAL ERROR: Missing environment_suffix

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-role"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-processor"  # INTENTIONAL ERROR: Missing environment_suffix
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-lambda-logs"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# Lambda Function
resource "aws_lambda_function" "processor" {
  filename      = "${path.module}/lambda/processor.zip"
  function_name = "${var.project_name}-processor"  # INTENTIONAL ERROR: Missing environment_suffix
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime

  environment {
    variables = {
      ENVIRONMENT = terraform.workspace
      # INTENTIONAL ERROR: Missing DB connection strings and other env vars
    }
  }

  tags = {
    Name = "${var.project_name}-processor"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state"  # INTENTIONAL ERROR: Missing environment_suffix

  tags = {
    Name = "${var.project_name}-terraform-state"  # INTENTIONAL ERROR: Missing environment_suffix
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

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.project_name}-terraform-locks"  # INTENTIONAL ERROR: Missing environment_suffix
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-terraform-locks"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"  # INTENTIONAL ERROR: Missing environment_suffix
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_description = "This metric monitors ECS CPU utilization"

  tags = {
    Name = "${var.project_name}-ecs-cpu-alarm"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "${var.project_name}-aurora-cpu-high"  # INTENTIONAL ERROR: Missing environment_suffix
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  alarm_description = "This metric monitors Aurora CPU utilization"

  tags = {
    Name = "${var.project_name}-aurora-cpu-alarm"  # INTENTIONAL ERROR: Missing environment_suffix
  }
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}
```

## File: lib/dev.tfvars

```hcl
# Development Environment Configuration
aws_region               = "eu-west-1"
project_name             = "multi-env"
team_name                = "platform"
vpc_cidr                 = "10.0.0.0/16"
availability_zones_count = 3
database_master_username = "admin"
container_image          = "nginx:latest"
lambda_runtime           = "python3.11"
```

## File: lib/staging.tfvars

```hcl
# Staging Environment Configuration
aws_region               = "us-west-2"
project_name             = "multi-env"
team_name                = "platform"
vpc_cidr                 = "10.1.0.0/16"
availability_zones_count = 3
database_master_username = "admin"
container_image          = "nginx:latest"
lambda_runtime           = "python3.11"
```

## File: lib/prod.tfvars

```hcl
# Production Environment Configuration
aws_region               = "us-east-1"
project_name             = "multi-env"
team_name                = "platform"
vpc_cidr                 = "10.2.0.0/16"
availability_zones_count = 3
database_master_username = "admin"
container_image          = "nginx:latest"
lambda_runtime           = "python3.11"
```

## File: lib/lambda/processor.py

```python
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to process background tasks
    """
    logger.info(f"Processing event: {json.dumps(event)}")

    environment = os.environ.get('ENVIRONMENT', 'unknown')

    # Process the event
    # INTENTIONAL ERROR: Missing actual business logic

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Event processed successfully',
            'environment': environment
        })
    }
```

## File: lib/README.md

```markdown
# Multi-Environment Terraform Infrastructure

This Terraform configuration creates a complete multi-environment infrastructure setup using workspaces.

## Architecture

- **VPC**: 3 availability zones with public and private subnets
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Compute**: ECS Fargate cluster with auto-scaling
- **Database**: Aurora PostgreSQL Multi-AZ cluster
- **Serverless**: Lambda function for background processing
- **State Management**: S3 backend with DynamoDB locking
- **Monitoring**: CloudWatch logs and alarms

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- Appropriate AWS credentials

## Workspace Setup

```bash
# Initialize Terraform
terraform init

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

## Deployment

### Development Environment
```bash
terraform workspace select dev
terraform plan -var-file="lib/dev.tfvars"
terraform apply -var-file="lib/dev.tfvars"
```

### Staging Environment
```bash
terraform workspace select staging
terraform plan -var-file="lib/staging.tfvars"
terraform apply -var-file="lib/staging.tfvars"
```

### Production Environment
```bash
terraform workspace select prod
terraform plan -var-file="lib/prod.tfvars"
terraform apply -var-file="lib/prod.tfvars"
```

## Outputs

After deployment, you'll get:
- VPC and subnet IDs
- ALB DNS name
- ECS cluster name
- Aurora cluster endpoints
- Lambda function name
- Terraform state bucket and locks table

## Cleanup

```bash
terraform workspace select <environment>
terraform destroy -var-file="lib/<environment>.tfvars"
```

## Backend Configuration

Before using this in production, update `backend.tf` with your actual S3 bucket and DynamoDB table names.
```
