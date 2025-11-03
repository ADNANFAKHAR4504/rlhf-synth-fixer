## Terraform Configuration Files

### provider.tf

```hcl

# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### variables.tf

```hcl
# variables.tf

# General variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-startup"
}

variable "managed_by" {
  description = "Tool or team managing the infrastructure"
  type        = string
  default     = "terraform"
}

# Environment-specific configurations using locals and maps
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  
  # Environment-specific CIDR blocks
  vpc_cidrs = {
    dev     = "10.0.0.0/16"
    staging = "10.1.0.0/16"
    prod    = "10.2.0.0/16"
  }
  
  # Environment-specific RDS instance classes
  rds_instance_classes = {
    dev     = "db.t3.micro"
    staging = "db.t3.small"
    prod    = "db.t3.micro"
  }
  
  # Environment-specific ECS scaling policies
  ecs_scaling = {
    dev = {
      min_capacity = 1
      max_capacity = 2
      desired_count = 1
    }
    staging = {
      min_capacity = 2
      max_capacity = 4
      desired_count = 2
    }
    prod = {
      min_capacity = 3
      max_capacity = 10
      desired_count = 3
    }
  }
  
  # Environment-specific log retention periods (in days)
  log_retention = {
    dev     = 7
    staging = 30
    prod    = 90
  }
  
  # Environment-specific RDS backup retention periods (in days)
  rds_backup_retention = {
    dev     = 1
    staging = 7
    prod    = 30
  }
  
  # Multi-AZ configuration for RDS
  rds_multi_az = {
    dev     = false
    staging = true
    prod    = true
  }
  
  # Common tags
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = var.managed_by
  }
  
  # Availability zones
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
}

# Domain configuration
variable "domain_name" {
  description = "Base domain name for Route53 hosted zones"
  type        = string
  default     = "fintech-startup.local"
}

variable "container_image" {
  description = "Container image for the API service"
  type        = string
  default     = "nginx:latest"  # Replace with your actual container image
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 80
}

# Database configuration
variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "dbadmin"
}

# Existing Route53 hosted zone (if any)
variable "parent_hosted_zone_id" {
  description = "ID of the parent hosted zone (optional)"
  type        = string
  default     = null
}
```

### main.tf

```hcl
# main.tf

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Get existing Route53 hosted zone if specified
data "aws_route53_zone" "parent" {
  count   = var.parent_hosted_zone_id != null ? 1 : 0
  zone_id = var.parent_hosted_zone_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidrs[local.environment]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-public-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-private-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidrs[local.environment], 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-database-${count.index + 1}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(local.azs)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-public-rt"
  })
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count = length(local.azs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Database
resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${local.environment}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-db-subnet-group"
  })
}

# Security Groups
# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${local.environment}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-rds-sg"
  })
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-${local.environment}-ecs-tasks-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-ecs-tasks-sg"
  })
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${local.environment}-alb-"
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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb-sg"
  })
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store DB password in Systems Manager Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${local.environment}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = local.common_tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${local.environment}-postgres"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15"
  instance_class = local.rds_instance_classes[local.environment]

  # Database configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database settings
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Multi-AZ and backup configuration
  multi_az               = local.rds_multi_az[local.environment]
  backup_retention_period = local.rds_backup_retention[local.environment]
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  delete_automated_backups = true

  # Security and monitoring
  deletion_protection = false
  skip_final_snapshot = local.environment == "dev" ? true : false
  final_snapshot_identifier = local.environment != "dev" ? "${var.project_name}-${local.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance insights
  performance_insights_enabled = local.environment != "dev" ? true : false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-postgres"
  })
}
```

### iam.tf

```hcl
# iam.tf - IAM roles and policies

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${local.environment}-ecs-task-execution"

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

# Attach managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${local.environment}-ecs-task"

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

# ECS Task Role Policy - Environment-specific resource access
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-${local.environment}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/${local.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_logs.arn
        ]
      }
    ]
  })
}

# Additional policy for accessing Systems Manager parameters
resource "aws_iam_role_policy" "ecs_task_ssm" {
  name = "${var.project_name}-${local.environment}-ecs-task-ssm"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/${local.environment}/*"
        ]
      }
    ]
  })
}
```

### ecs.tf

```hcl
# ecs.tf - ECS Cluster, Services, and Task Definitions

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${local.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${local.environment}"
  retention_in_days = local.log_retention[local.environment]

  tags = local.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-${local.environment}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = var.container_image
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = local.environment
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}:5432/${var.db_name}"
        }
      ]
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password.arn
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
      essential = true
    }
  ])

  tags = local.common_tags
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-${local.environment}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = local.ecs_scaling[local.environment].desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.api]

  tags = local.common_tags
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = local.ecs_scaling[local.environment].max_capacity
  min_capacity       = local.ecs_scaling[local.environment].min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = local.common_tags
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.project_name}-${local.environment}-cpu-scaling"
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
    scale_out_cooldown = 300
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "${var.project_name}-${local.environment}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
```

### alb.tf

```hcl
# alb.tf - Application Load Balancer configuration

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${local.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-access-logs"
    enabled = true
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-${local.environment}-api-tg"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-api-tg"
  })
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = local.common_tags
}

# ALB Listener Rule for API
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.api.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  tags = local.common_tags
}
```

### s3.tf

```hcl
# s3.tf - S3 buckets for application logs and ALB access logs

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get ELB service account for ALB access logs
data "aws_elb_service_account" "main" {}

# S3 bucket for application logs
resource "aws_s3_bucket" "app_logs" {
  bucket = "${var.project_name}-${local.environment}-app-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-app-logs"
  })
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.project_name}-${local.environment}-alb-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb-logs"
  })
}

# Random ID for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 bucket versioning - App logs
resource "aws_s3_bucket_versioning" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket versioning - ALB logs
resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption - App logs
resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket server-side encryption - ALB logs
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block - App logs
resource "aws_s3_bucket_public_access_block" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket public access block - ALB logs
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration - App logs
resource "aws_s3_bucket_lifecycle_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    id     = "app_logs_lifecycle"
    status = "Enabled"

    expiration {
      days = local.log_retention[local.environment]
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket lifecycle configuration - ALB logs
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "alb_logs_lifecycle"
    status = "Enabled"

    expiration {
      days = local.log_retention[local.environment]
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket policy for ALB access logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}
```

### route53.tf

```hcl
# route53.tf - DNS configuration with Route53

# Route53 Hosted Zone for environment-specific subdomain
resource "aws_route53_zone" "main" {
  name = "${local.environment}.${var.domain_name}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-hosted-zone"
  })
}

# Route53 Record for ALB
resource "aws_route53_record" "alb" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "${local.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route53 Record for API subdomain
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${local.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Optional: Route53 Record in parent hosted zone (if exists)
resource "aws_route53_record" "parent_ns" {
  count = var.parent_hosted_zone_id != null ? 1 : 0

  zone_id = var.parent_hosted_zone_id
  name    = "${local.environment}.${var.domain_name}"
  type    = "NS"
  ttl     = 30

  records = aws_route53_zone.main.name_servers
}

# Health check for the ALB
resource "aws_route53_health_check" "alb" {
  fqdn                            = aws_lb.main.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  insufficient_data_health_status = "Unhealthy"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb-health-check"
  })
}
```

### outputs.tf

```hcl
# outputs.tf - Terraform outputs for important infrastructure information

# VPC Information
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

# Subnet Information
output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

# Load Balancer Information
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

# Database Information
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# ECS Information
output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.api.name
}

# S3 Information
output "app_logs_bucket_name" {
  description = "Application logs S3 bucket name"
  value       = aws_s3_bucket.app_logs.id
}

output "alb_logs_bucket_name" {
  description = "ALB access logs S3 bucket name"
  value       = aws_s3_bucket.alb_logs.id
}

# Route53 Information
output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Route53 hosted zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "environment_domain" {
  description = "Environment-specific domain name"
  value       = "${local.environment}.${var.domain_name}"
}

output "api_domain" {
  description = "API domain name"
  value       = "api.${local.environment}.${var.domain_name}"
}

# Security Groups
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_tasks_security_group_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

# IAM Roles
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

# Environment Information
output "environment" {
  description = "Current environment"
  value       = local.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

# Systems Manager Parameters
output "db_password_parameter_name" {
  description = "Database password parameter name in Systems Manager"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}
```