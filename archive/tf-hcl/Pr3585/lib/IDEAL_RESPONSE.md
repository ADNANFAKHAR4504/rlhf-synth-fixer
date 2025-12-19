# Complete Terraform AWS Infrastructure

Here's a single standalone Terraform file (tap_stack.tf) that implements all the required AWS infrastructure:

## lib/tap_stack.tf

```hcl
# tap_stack.tf - Complete AWS Infrastructure
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# AWS Provider Configuration - us-east-1 region
provider "aws" {
  region = "us-east-1"
}

# VPC Configuration - CIDR 10.0.0.0/16
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc"
    Environment = "Production"
  }
}

# Internet Gateway attached to VPC
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "main-igw"
    Environment = "Production"
  }
}

# Public Subnets - 2 subnets across 2 AZs
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-2"
    Environment = "Production"
  }
}

# Private Subnets - 2 subnets across 2 AZs
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "private-subnet-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "private-subnet-2"
    Environment = "Production"
  }
}

# Elastic IPs for NAT Gateways - one per AZ
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-1"
    Environment = "Production"
  }
}

resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-2"
    Environment = "Production"
  }
}

# NAT Gateways - one per AZ for private subnet internet access
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "nat-gateway-1"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "nat-gateway-2"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table - routes to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-route-table"
    Environment = "Production"
  }
}

# Private Route Tables - one per AZ routing to respective NAT Gateway
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = {
    Name        = "private-route-table-1"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = {
    Name        = "private-route-table-2"
    Environment = "Production"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role"

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
    Environment = "Production"
  }
}

# Attach ECS Task Execution Policy
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"

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
    Environment = "Production"
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/sample-app"
  retention_in_days = 7

  tags = {
    Environment = "Production"
  }
}

# ECS Cluster using Fargate
resource "aws_ecs_cluster" "main" {
  name = "main-ecs-cluster"

  tags = {
    Name        = "main-ecs-cluster"
    Environment = "Production"
  }
}

# ECS Task Definition - Fargate with minimum CPU 256 and memory 512 MiB
resource "aws_ecs_task_definition" "sample_app" {
  family                   = "sample-app"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "256"
  memory                  = "512"
  execution_role_arn      = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn          = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "sample-container"
      image     = "nginx:latest"
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
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Environment = "Production"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
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
    Name        = "alb-sg"
    Environment = "Production"
  }
}

# Security Group for ECS Service
resource "aws_security_group" "ecs_service" {
  name        = "ecs-service-sg"
  description = "Security group for ECS service"
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
    Name        = "ecs-service-sg"
    Environment = "Production"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name        = "main-alb"
    Environment = "Production"
  }
}

# Target Group for ALB
resource "aws_lb_target_group" "main" {
  name        = "main-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "main-tg"
    Environment = "Production"
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ECS Service
resource "aws_ecs_service" "sample_service" {
  name            = "sample-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.sample_app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_service.id]
    subnets         = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "sample-container"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.main,
    aws_iam_role_policy_attachment.ecs_task_execution_role_policy
  ]

  tags = {
    Environment = "Production"
  }
}

# Random string for unique bucket name
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket with Block Public Access and versioning
resource "aws_s3_bucket" "main" {
  bucket = "main-bucket-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "main-bucket"
    Environment = "Production"
  }
}

# S3 Bucket Public Access Block - all public access blocked
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning enabled
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption - SSE-S3
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DynamoDB Table with provisioned capacity 5 read/write units
resource "aws_dynamodb_table" "main" {
  name           = "main-table"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "main-table"
    Environment = "Production"
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public Subnet IDs"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "private_subnet_ids" {
  description = "Private Subnet IDs"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "s3_bucket_name" {
  description = "S3 Bucket Name"
  value       = aws_s3_bucket.main.id
}

output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = aws_dynamodb_table.main.name
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = aws_lb.main.dns_name
}

# Validation Commands for convenience
resource "null_resource" "validation_commands" {
  provisioner "local-exec" {
    command = "echo 'Run: terraform validate && terraform plan to validate configuration'"
  }
}
```

## Implementation Details

### Architecture Overview

The infrastructure implements a secure, highly available AWS environment with the following components:

1. **Network Layer**:
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24) in us-east-1a and us-east-1b
   - 2 private subnets (10.0.10.0/24, 10.0.11.0/24) in us-east-1a and us-east-1b
   - Internet Gateway for public internet access
   - 2 NAT Gateways (one per AZ) with Elastic IPs for private subnet outbound access
   - Route tables configured for proper traffic routing

2. **Compute Layer**:
   - ECS Cluster configured for Fargate launch type
   - Task definition with minimum 256 CPU and 512 MiB memory
   - ECS service running 2 tasks across private subnets
   - Application Load Balancer distributing traffic

3. **Storage Layer**:
   - S3 bucket with versioning enabled
   - Server-side encryption using SSE-S3
   - All public access blocked
   - DynamoDB table with provisioned capacity (5 read/write units)

4. **Security**:
   - IAM roles with least privilege access
   - Security groups restricting traffic appropriately
   - All resources tagged with Environment = "Production"

### Key Features

- **Single File**: All infrastructure in one file as required
- **No Retain Policies**: All resources can be destroyed cleanly
- **Hard-coded Region**: us-east-1 specified in provider
- **Deterministic AZs**: Uses us-east-1a and us-east-1b explicitly
- **Security Best Practices**: S3 encryption, public access blocking, minimal IAM permissions
- **High Availability**: Resources distributed across 2 availability zones

### Deployment Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy
```

### Outputs

After deployment, the following outputs are available:

- VPC ID
- Public and private subnet IDs
- ECS cluster name
- S3 bucket name
- DynamoDB table name
- ALB DNS name for accessing the application
