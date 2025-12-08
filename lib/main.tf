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

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration - Hardcoded values
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "TapStack${var.environment_suffix}-vpc"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Public Subnets - Repetitive code
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "TapStack${var.environment_suffix}-public-subnet-1"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "TapStack${var.environment_suffix}-public-subnet-2"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

resource "aws_subnet" "public_3" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}c"

  tags = {
    Name        = "TapStack${var.environment_suffix}-public-subnet-3"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "public"
  }
}

# Private Subnets - More repetitive code
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "TapStack${var.environment_suffix}-private-subnet-1"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "TapStack${var.environment_suffix}-private-subnet-2"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

resource "aws_subnet" "private_3" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.13.0/24"
  availability_zone = "${var.aws_region}c"

  tags = {
    Name        = "TapStack${var.environment_suffix}-private-subnet-3"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    Type        = "private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "TapStack${var.environment_suffix}-igw"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Security Groups - Repetitive rules (not using dynamic blocks)
resource "aws_security_group" "alb" {
  name        = "TapStack${var.environment_suffix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "TapStack${var.environment_suffix}-alb-sg"
    Environment = var.environment_suffix
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
  name        = "TapStack${var.environment_suffix}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "TapStack${var.environment_suffix}-ecs-sg"
    Environment = var.environment_suffix
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
  bucket = "tapstack${var.environment_suffix}-alb-logs"

  tags = {
    Name        = "TapStack${var.environment_suffix}-alb-logs"
    Environment = var.environment_suffix
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
  bucket = "tapstack${var.environment_suffix}-app-logs"

  tags = {
    Name        = "TapStack${var.environment_suffix}-app-logs"
    Environment = var.environment_suffix
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
  bucket = "tapstack${var.environment_suffix}-audit-logs"

  tags = {
    Name        = "TapStack${var.environment_suffix}-audit-logs"
    Environment = var.environment_suffix
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
  name = "TapStack${var.environment_suffix}-cluster"

  tags = {
    Name        = "TapStack${var.environment_suffix}-cluster"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# IAM Role - Inline policy (should use data source)
resource "aws_iam_role" "ecs_task_execution" {
  name = "TapStack${var.environment_suffix}-ecs-task-execution-role"

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
    Name        = "TapStack${var.environment_suffix}-ecs-execution-role"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Inline policy - Should use managed policy data source
resource "aws_iam_role_policy" "ecs_task_execution" {
  name = "TapStack${var.environment_suffix}-ecs-task-execution-policy"
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
  name               = "TapStack${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets = [
    aws_subnet.public_1.id,
    aws_subnet.public_2.id,
    aws_subnet.public_3.id
  ]

  enable_deletion_protection = false

  tags = {
    Name        = "TapStack${var.environment_suffix}-alb"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# CloudWatch Log Groups - Repetitive
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/TapStack${var.environment_suffix}-api"
  retention_in_days = 7

  tags = {
    Name        = "TapStack${var.environment_suffix}-api-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/TapStack${var.environment_suffix}-worker"
  retention_in_days = 7

  tags = {
    Name        = "TapStack${var.environment_suffix}-worker-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/TapStack${var.environment_suffix}-scheduler"
  retention_in_days = 7

  tags = {
    Name        = "TapStack${var.environment_suffix}-scheduler-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}
