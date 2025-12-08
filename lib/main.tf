# Payment Processing Infrastructure - Baseline (Needs Optimization)
# This configuration contains intentional inefficiencies and code duplication

locals {
  name_prefix = "TapStack-${var.environment_suffix}"
}

# VPC Configuration - Hardcoded values
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.name_prefix}-vpc"
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
    Name        = "${local.name_prefix}-public-subnet-1"
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
    Name        = "${local.name_prefix}-public-subnet-2"
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
    Name        = "${local.name_prefix}-public-subnet-3"
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
    Name        = "${local.name_prefix}-private-subnet-1"
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
    Name        = "${local.name_prefix}-private-subnet-2"
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
    Name        = "${local.name_prefix}-private-subnet-3"
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
    Name        = "${local.name_prefix}-igw"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Security Groups - Repetitive rules (not using dynamic blocks)
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "${local.name_prefix}-alb-sg"
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
  name        = "${local.name_prefix}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "${local.name_prefix}-ecs-sg"
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
  bucket = "${lower(local.name_prefix)}-alb-logs"

  tags = {
    Name        = "${local.name_prefix}-alb-logs"
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
  bucket = "${lower(local.name_prefix)}-app-logs"

  tags = {
    Name        = "${local.name_prefix}-app-logs"
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
  bucket = "${lower(local.name_prefix)}-audit-logs"

  tags = {
    Name        = "${local.name_prefix}-audit-logs"
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
  name = "${local.name_prefix}-cluster"

  tags = {
    Name        = "${local.name_prefix}-cluster"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# IAM Role - Inline policy (should use data source)
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"

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
    Name        = "${local.name_prefix}-ecs-execution-role"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# Inline policy - Should use managed policy data source
resource "aws_iam_role_policy" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-policy"
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
  name               = "${local.name_prefix}-alb"
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
    Name        = "${local.name_prefix}-alb"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# CloudWatch Log Groups - Repetitive
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name_prefix}-api"
  retention_in_days = 7

  tags = {
    Name        = "${local.name_prefix}-api-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.name_prefix}-worker"
  retention_in_days = 7

  tags = {
    Name        = "${local.name_prefix}-worker-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/${local.name_prefix}-scheduler"
  retention_in_days = 7

  tags = {
    Name        = "${local.name_prefix}-scheduler-logs"
    Environment = var.environment_suffix
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}
