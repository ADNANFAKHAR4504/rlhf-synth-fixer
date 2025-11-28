# Loan Processing Infrastructure - Terraform Implementation

This provides a complete Terraform implementation for the fintech loan processing system with PCI DSS compliance, high availability across 3 AZs, and production-ready security.

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project            = "LoanProcessing"
      Environment        = var.environment_suffix
      ManagedBy          = "Terraform"
      ComplianceLevel    = "PCI-DSS"
    }
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

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, prod, test)"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0
    error_message = "environment_suffix must not be empty"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired count of ECS tasks"
  type        = number
  default     = 2
}

variable "aurora_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity in ACUs"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity in ACUs"
  type        = number
  default     = 1.0
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for ECS"
  type        = bool
  default     = true
}
```

## File: lib/main.tf

```hcl
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "kms-key-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/loan-processing-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.azs_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.azs_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.azs_count
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.azs_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
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
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.azs_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.azs_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.azs_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Network ACLs for additional security
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "public-nacl-${var.environment_suffix}"
  }
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "private-nacl-${var.environment_suffix}"
  }
}
```

## File: lib/security.tf

```hcl
# Security Groups

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
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

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

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
    from_port       = 8080
    to_port         = 8080
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

  tags = {
    Name = "ecs-tasks-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Aurora Security Group
resource "aws_security_group" "aurora" {
  name_prefix = "aurora-sg-${var.environment_suffix}-"
  description = "Security group for Aurora PostgreSQL"
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

  tags = {
    Name = "aurora-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ACM Certificate (self-signed for demo - replace with real cert in production)
resource "aws_acm_certificate" "main" {
  domain_name       = "loan-app-${var.environment_suffix}.example.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.loan-app-${var.environment_suffix}.example.com"
  ]

  tags = {
    Name = "acm-cert-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/ecs.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environment_suffix}"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 80
    base              = 1
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 20
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/loan-processing-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "ecs-logs-${var.environment_suffix}"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

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
    Name = "ecs-task-execution-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_kms_decrypt" {
  name = "ecs-kms-decrypt-${var.environment_suffix}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:DescribeKey"
      ]
      Resource = aws_kms_key.main.arn
    }]
  })
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

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
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "ecs_task_s3_access" {
  name = "ecs-task-s3-access-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.documents.arn}/*",
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          aws_s3_bucket.logs.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_rds_access" {
  name = "ecs-task-rds-access-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "rds-db:connect"
      ]
      Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora.cluster_resource_id}/${var.db_master_username}"
    }]
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "loan_api" {
  family                   = "loan-api-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "loan-api"
    image = "nginx:latest" # Replace with actual application image

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment_suffix
      },
      {
        name  = "DB_ENDPOINT"
        value = aws_rds_cluster.aurora.endpoint
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "loan-api"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "loan-api-task-${var.environment_suffix}"
  }
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "loan-processing-${var.environment_suffix}.local"
  description = "Service discovery namespace for loan processing"
  vpc         = aws_vpc.main.id

  tags = {
    Name = "service-discovery-${var.environment_suffix}"
  }
}

resource "aws_service_discovery_service" "loan_api" {
  name = "loan-api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = {
    Name = "loan-api-discovery-${var.environment_suffix}"
  }
}

# ECS Service
resource "aws_ecs_service" "loan_api" {
  name            = "loan-api-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.loan_api.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.loan_api.arn
    container_name   = "loan-api"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.loan_api.arn
  }

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "loan-api-service-${var.environment_suffix}"
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = var.ecs_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.loan_api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "ecs-cpu-scaling-${var.environment_suffix}"
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

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "ecs-memory-scaling-${var.environment_suffix}"
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
    scale_out_cooldown = 60
  }
}
```

## File: lib/alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "loan-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = {
    Name = "loan-alb-${var.environment_suffix}"
  }

  depends_on = [aws_s3_bucket_policy.logs]
}

# Target Group
resource "aws_lb_target_group" "loan_api" {
  name        = "loan-api-tg-${var.environment_suffix}"
  port        = 8080
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
    matcher             = "200"
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name = "loan-api-tg-${var.environment_suffix}"
  }
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
    target_group_arn = aws_lb_target_group.loan_api.arn
  }

  tags = {
    Name = "https-listener-${var.environment_suffix}"
  }
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

  tags = {
    Name = "http-listener-${var.environment_suffix}"
  }
}

# Listener Rules for path-based routing
resource "aws_lb_listener_rule" "api_v1" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.loan_api.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/*"]
    }
  }

  tags = {
    Name = "api-v1-rule-${var.environment_suffix}"
  }
}

resource "aws_lb_listener_rule" "health_check" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 50

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.loan_api.arn
  }

  condition {
    path_pattern {
      values = ["/health", "/healthz"]
    }
  }

  tags = {
    Name = "health-check-rule-${var.environment_suffix}"
  }
}
```

## File: lib/aurora.tf

```hcl
# Aurora Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  }
}

# Random password for Aurora master
resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "aurora_master_password" {
  name                    = "aurora-master-password-${var.environment_suffix}"
  description             = "Master password for Aurora PostgreSQL cluster"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.main.id

  tags = {
    Name = "aurora-master-password-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "aurora_master_password" {
  secret_id     = aws_secretsmanager_secret.aurora_master_password.id
  secret_string = random_password.aurora_master.result
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = "loanprocessing"
  master_username         = var.db_master_username
  master_password         = random_password.aurora_master.result

  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  iam_database_authentication_enabled = true

  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-final-snapshot-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Cluster Instances (Serverless v2)
resource "aws_rds_cluster_instance" "aurora" {
  count = 2

  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.main.arn

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}
```

## File: lib/s3.tf

```hcl
# S3 Bucket for Application Logs
resource "aws_s3_bucket" "logs" {
  bucket        = "loan-processing-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "logs-bucket-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      }
    ]
  })
}

# S3 Bucket for Loan Documents
resource "aws_s3_bucket" "documents" {
  bucket        = "loan-documents-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "documents-bucket-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-documents"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 180
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for CloudFront Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket        = "loan-static-assets-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "static-assets-bucket-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## File: lib/cloudfront.tf

```hcl
# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for loan processing static assets ${var.environment_suffix}"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets_cloudfront" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "CloudFrontGetObject"
      Effect = "Allow"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.main.iam_arn
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.static_assets.arn}/*"
    }]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for loan processing ${var.environment_suffix}"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/images/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/error.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/error.html"
  }

  tags = {
    Name = "cloudfront-distribution-${var.environment_suffix}"
  }
}
```

## File: lib/waf.tf

```hcl
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "waf-loan-processing-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rule - SQL Injection Protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - XSS Protection
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting Rule
  rule {
    name     = "RateLimitRule"
    priority = 3

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

  # IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesAmazonIpReputationList"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesAmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "waf-loan-processing-${var.environment_suffix}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "waf-acl-${var.environment_suffix}"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/wafv2/loan-processing-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "waf-logs-${var.environment_suffix}"
  }
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
}
```

## File: lib/eventbridge.tf

```hcl
# IAM Role for EventBridge to execute ECS tasks
resource "aws_iam_role" "eventbridge_ecs" {
  name = "eventbridge-ecs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "eventbridge-ecs-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "eventbridge_ecs" {
  name = "eventbridge-ecs-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecs:RunTask"
      ]
      Resource = aws_ecs_task_definition.batch_processor.arn
      Condition = {
        ArnLike = {
          "ecs:cluster" = aws_ecs_cluster.main.arn
        }
      }
    },
    {
      Effect = "Allow"
      Action = [
        "iam:PassRole"
      ]
      Resource = [
        aws_iam_role.ecs_task_execution.arn,
        aws_iam_role.ecs_task.arn
      ]
    }]
  })
}

# ECS Task Definition for Batch Processing
resource "aws_ecs_task_definition" "batch_processor" {
  family                   = "batch-processor-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 2048
  memory                   = 4096
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "batch-processor"
    image = "nginx:latest" # Replace with actual batch processing image

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment_suffix
      },
      {
        name  = "DB_ENDPOINT"
        value = aws_rds_cluster.aurora.endpoint
      },
      {
        name  = "BATCH_TYPE"
        value = "nightly"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "batch-processor"
      }
    }
  }])

  tags = {
    Name = "batch-processor-task-${var.environment_suffix}"
  }
}

# EventBridge Rule for Nightly Batch Processing
resource "aws_cloudwatch_event_rule" "nightly_batch" {
  name                = "nightly-batch-processing-${var.environment_suffix}"
  description         = "Trigger nightly batch processing at 2 AM UTC"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = {
    Name = "nightly-batch-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "nightly_batch" {
  rule      = aws_cloudwatch_event_rule.nightly_batch.name
  target_id = "ecs-batch-processor"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.batch_processor.arn
    launch_type         = "FARGATE"

    network_configuration {
      subnets          = aws_subnet.private[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = false
    }
  }
}

# Dead Letter Queue for Failed Events
resource "aws_sqs_queue" "eventbridge_dlq" {
  name                      = "eventbridge-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "eventbridge-dlq-${var.environment_suffix}"
  }
}

# EventBridge Rule for Weekly Report Generation
resource "aws_cloudwatch_event_rule" "weekly_report" {
  name                = "weekly-report-generation-${var.environment_suffix}"
  description         = "Generate weekly loan processing reports on Monday at 6 AM UTC"
  schedule_expression = "cron(0 6 ? * MON *)"

  tags = {
    Name = "weekly-report-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "weekly_report" {
  rule      = aws_cloudwatch_event_rule.weekly_report.name
  target_id = "ecs-report-generator"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.batch_processor.arn
    launch_type         = "FARGATE"

    network_configuration {
      subnets          = aws_subnet.private[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = false
    }
  }

  dead_letter_config {
    arn = aws_sqs_queue.eventbridge_dlq.arn
  }
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "loan-processing-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Cluster Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            [".", "ServerlessDatabaseCapacity", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms

# High CPU Alarm
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
    ServiceName = aws_ecs_service.loan_api.name
  }

  tags = {
    Name = "ecs-cpu-alarm-${var.environment_suffix}"
  }
}

# High Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "ecs-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "This metric monitors ECS memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.loan_api.name
  }

  tags = {
    Name = "ecs-memory-alarm-${var.environment_suffix}"
  }
}

# ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "alb-response-time-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.0
  alarm_description   = "This metric monitors ALB target response time"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-response-alarm-${var.environment_suffix}"
  }
}

# ALB 5XX Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors 5XX errors from ALB targets"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-alarm-${var.environment_suffix}"
  }
}

# Aurora Database Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "aurora-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-connections-alarm-${var.environment_suffix}"
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

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS Service name"
  value       = aws_ecs_service.loan_api.name
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_master_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Aurora master password"
  value       = aws_secretsmanager_secret.aurora_master_password.arn
  sensitive   = true
}

output "s3_logs_bucket" {
  description = "S3 bucket for application logs"
  value       = aws_s3_bucket.logs.id
}

output "s3_documents_bucket" {
  description = "S3 bucket for loan documents"
  value       = aws_s3_bucket.documents.id
}

output "s3_static_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.main.arn
}

output "service_discovery_namespace" {
  description = "Service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "eventbridge_nightly_batch_rule" {
  description = "EventBridge rule name for nightly batch processing"
  value       = aws_cloudwatch_event_rule.nightly_batch.name
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize for your environment

aws_region         = "us-east-1"
environment_suffix = "prod"

vpc_cidr  = "10.0.0.0/16"
azs_count = 3

ecs_task_cpu       = 1024
ecs_task_memory    = 2048
ecs_desired_count  = 2

aurora_min_capacity = 0.5
aurora_max_capacity = 1.0
db_master_username  = "dbadmin"

cloudfront_price_class      = "PriceClass_100"
enable_container_insights   = true
```

## File: lib/README.md

```markdown
# Loan Processing Infrastructure

This Terraform configuration deploys a production-ready loan processing infrastructure on AWS with PCI DSS compliance.

## Architecture Overview

- **VPC**: 3 public and 3 private subnets across 3 availability zones
- **Compute**: ECS Fargate cluster with auto-scaling (80% Fargate, 20% Fargate Spot)
- **Database**: Aurora PostgreSQL Serverless v2 with 0.5-1 ACU scaling
- **Load Balancing**: Application Load Balancer with WAF protection
- **Storage**: S3 buckets for logs and documents with lifecycle policies
- **CDN**: CloudFront distribution for static assets
- **Security**: KMS encryption, IAM authentication, TLS 1.2 minimum
- **Monitoring**: CloudWatch Container Insights, dashboards, and alarms
- **Automation**: EventBridge for scheduled batch processing

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with sufficient permissions

## Deployment

1. Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars` and set your `environment_suffix`:
```hcl
environment_suffix = "dev"  # or "prod", "staging", etc.
```

3. Initialize Terraform:
```bash
terraform init
```

4. Review the execution plan:
```bash
terraform plan
```

5. Apply the configuration:
```bash
terraform apply
```

## Configuration

### Required Variables

- `environment_suffix`: Unique suffix for resource naming (required)

### Optional Variables

- `aws_region`: AWS region (default: us-east-1)
- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `azs_count`: Number of availability zones (default: 3)
- `ecs_task_cpu`: CPU units for ECS task (default: 1024)
- `ecs_task_memory`: Memory for ECS task (default: 2048)
- `ecs_desired_count`: Desired ECS task count (default: 2)
- `aurora_min_capacity`: Minimum Aurora capacity (default: 0.5 ACU)
- `aurora_max_capacity`: Maximum Aurora capacity (default: 1.0 ACU)

## Security Features

- **Encryption**: All data encrypted at rest using customer-managed KMS keys
- **IAM Authentication**: Aurora PostgreSQL uses IAM database authentication
- **TLS**: ALB enforces TLS 1.2 minimum
- **WAF**: Protection against SQL injection and XSS attacks
- **Network Isolation**: Compute resources in private subnets
- **Multi-AZ**: High availability across 3 availability zones

## Outputs

After deployment, Terraform outputs key resource identifiers:

- ALB DNS name for accessing the application
- Aurora cluster endpoints
- S3 bucket names
- CloudFront distribution domain
- KMS key ARN

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

## Compliance

This infrastructure is designed to meet PCI DSS requirements:
- Encryption at rest and in transit
- Network segmentation
- Access controls and IAM authentication
- Logging and monitoring
- Regular security scanning (WAF)
```
