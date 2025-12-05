# Payment Processing Infrastructure - Baseline (Needs Optimization)
# This configuration contains intentional inefficiencies and code duplication

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "payment-infra-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC Configuration - Hardcoded values
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "payment-vpc"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Public Subnets - Repetitive code
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "payment-public-subnet-1"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "payment-public-subnet-2"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

resource "aws_subnet" "public_3" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1c"

  tags = {
    Name        = "payment-public-subnet-3"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

# Private Subnets - More repetitive code
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "payment-private-subnet-1"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "payment-private-subnet-2"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

resource "aws_subnet" "private_3" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.13.0/24"
  availability_zone = "us-east-1c"

  tags = {
    Name        = "payment-private-subnet-3"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "payment-igw"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Security Groups - Repetitive rules (not using dynamic blocks)
resource "aws_security_group" "alb" {
  name        = "payment-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "payment-alb-sg"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_security_group_rule" "alb_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

# ECS Security Group - Repetitive
resource "aws_security_group" "ecs" {
  name        = "payment-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "payment-ecs-sg"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "ecs_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs.id
}

# S3 Buckets - Duplicated configuration (should be a module or for_each)
resource "aws_s3_bucket" "alb_logs" {
  bucket = "payment-prod-alb-logs-12345"

  tags = {
    Name        = "payment-prod-alb-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Purpose     = "alb-logs"
  }
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

resource "aws_s3_bucket" "application_logs" {
  bucket = "payment-prod-app-logs-12345"

  tags = {
    Name        = "payment-prod-app-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Purpose     = "application-logs"
  }
}

resource "aws_s3_bucket_versioning" "application_logs" {
  bucket = aws_s3_bucket.application_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "application_logs" {
  bucket = aws_s3_bucket.application_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "audit_logs" {
  bucket = "payment-prod-audit-logs-12345"

  tags = {
    Name        = "payment-prod-audit-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Purpose     = "audit-logs"
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "payment-cluster"

  tags = {
    Name        = "payment-cluster"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# IAM Role - Inline policy (should use data source)
resource "aws_iam_role" "ecs_task_execution" {
  name = "payment-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "payment-ecs-execution-role"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Inline policy - Should use managed policy data source
resource "aws_iam_role_policy" "ecs_task_execution" {
  name = "ecs-task-execution-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# ALB
resource "aws_lb" "main" {
  name               = "payment-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = [
    aws_subnet.public_1.id,
    aws_subnet.public_2.id,
    aws_subnet.public_3.id
  ]

  enable_deletion_protection = true

  tags = {
    Name        = "payment-alb"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Duplicate ECS Services - Should use for_each
resource "aws_ecs_service" "api" {
  name            = "payment-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "payment-api:1"
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id,
      aws_subnet.private_3.id
    ]
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name        = "payment-api-service"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Service     = "api"
  }
}

resource "aws_ecs_service" "worker" {
  name            = "payment-worker-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "payment-worker:1"
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id,
      aws_subnet.private_3.id
    ]
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name        = "payment-worker-service"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Service     = "worker"
  }
}

resource "aws_ecs_service" "scheduler" {
  name            = "payment-scheduler-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "payment-scheduler:1"
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id,
      aws_subnet.private_3.id
    ]
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name        = "payment-scheduler-service"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Service     = "scheduler"
  }
}

# RDS Aurora - Hardcoded values
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "payment-db-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.3"
  database_name           = "payments"
  master_username         = "dbadmin"
  master_password         = "ChangeMe123!"  # Hardcoded password - bad practice
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  storage_encrypted       = true

  tags = {
    Name        = "payment-db-cluster"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-group"
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id,
    aws_subnet.private_3.id
  ]

  tags = {
    Name        = "payment-db-subnet-group"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_security_group" "rds" {
  name        = "payment-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "payment-rds-sg"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
  security_group_id        = aws_security_group.rds.id
}

# CloudWatch Log Groups - Repetitive
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/payment-api"
  retention_in_days = 7

  tags = {
    Name        = "payment-api-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/payment-worker"
  retention_in_days = 7

  tags = {
    Name        = "payment-worker-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/payment-scheduler"
  retention_in_days = 7

  tags = {
    Name        = "payment-scheduler-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}
