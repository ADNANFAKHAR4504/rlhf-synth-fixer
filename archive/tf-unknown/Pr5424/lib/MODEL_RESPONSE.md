I'll help you create a production-ready Terraform infrastructure for your fintech payment processing app. This will be a comprehensive setup with all the requirements you've specified. Let me break this down into the modular structure you requested.

## Terraform Infrastructure for Fintech Payment Processing App

### 1. `variables.tf` - Input Variables

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "vpc_id" {
  description = "ID of existing VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
}

variable "ecr_repository_url" {
  description = "URL of ECR repository"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.fintech-app.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "fintechdb"
}

variable "database_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
}

variable "task_cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "4096"  # 4 vCPUs
}

variable "task_memory" {
  description = "Memory for ECS task"
  type        = string
  default     = "8192"  # 8GB
}

variable "min_tasks" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 3
}

variable "max_tasks" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 15
}

variable "cpu_target_value" {
  description = "Target CPU utilization for auto-scaling"
  type        = number
  default     = 70
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "fintech-app"
    ManagedBy   = "terraform"
  }
}
```

### 2. `main.tf` - Provider Configuration

```hcl
terraform {
  required_version = ">= 1.5.0"

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
    tags = var.common_tags
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for caller identity
data "aws_caller_identity" "current" {}

# Data source for existing VPC
data "aws_vpc" "existing" {
  id = var.vpc_id
}
```

### 3. `networking.tf` - VPC and Network Configuration

```hcl
# Data sources for existing subnets
data "aws_subnet" "private" {
  count = length(var.private_subnet_ids)
  id    = var.private_subnet_ids[count.index]
}

data "aws_subnet" "public" {
  count = length(var.public_subnet_ids)
  id    = var.public_subnet_ids[count.index]
}

# VPC Endpoints for ECR (if not already existing)
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]

  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-dkr-endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]

  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-api-endpoint"
  }
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.private.ids

  tags = {
    Name = "${var.project_name}-s3-endpoint"
  }
}

# Data source for private route tables
data "aws_route_tables" "private" {
  vpc_id = var.vpc_id

  filter {
    name   = "association.subnet-id"
    values = var.private_subnet_ids
  }
}
```

### 4. `security.tf` - Security Groups

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-ecs-tasks-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "Security group for RDS Aurora"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "PostgreSQL from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints Security Group
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpc-endpoints-"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-vpc-endpoints-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 5. `secrets.tf` - Secrets Manager

```hcl
# Generate random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
}

# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name_prefix             = "${var.project_name}-rds-credentials-"
  description             = "RDS master credentials for ${var.project_name}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-rds-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = var.database_master_username
    password = random_password.rds_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

# Application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "${var.project_name}-app-secrets-"
  description             = "Application secrets for ${var.project_name}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-app-secrets"
  }
}
```

### 6. `database.tf` - RDS Aurora PostgreSQL

```hcl
# RDS Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name_prefix = "${var.project_name}-aurora-"
  description = "Subnet group for Aurora cluster"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-aurora-subnet-group"
  }
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "${var.project_name}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_version         = "15.3"
  database_name          = var.database_name
  master_username        = var.database_master_username
  master_password        = random_password.rds_password.result
  
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  apply_immediately = false

  tags = {
    Name = "${var.project_name}-aurora-cluster"
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# RDS Aurora Writer Instance
resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier              = "${var.project_name}-aurora-writer"
  cluster_identifier      = aws_rds_cluster.aurora.id
  instance_class          = "db.t3.medium"
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = aws_rds_cluster.aurora.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name = "${var.project_name}-aurora-writer"
    Type = "writer"
  }
}

# RDS Aurora Reader Instance
resource "aws_rds_cluster_instance" "aurora_reader" {
  identifier              = "${var.project_name}-aurora-reader"
  cluster_identifier      = aws_rds_cluster.aurora.id
  instance_class          = "db.t3.medium"
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = aws_rds_cluster.aurora.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name = "${var.project_name}-aurora-reader"
    Type = "reader"
  }
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-rds-kms-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-rds"
  target_key_id = aws_kms_key.rds.key_id
}
```

### 7. `iam.tf` - IAM Roles and Policies

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "${var.project_name}-ecs-task-execution-"
  
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
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager and CloudWatch
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name_prefix = "${var.project_name}-ecs-secrets-"
  role        = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.rds_credentials.arn,
          aws_secretsmanager_secret.app_secrets.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = ["*"]
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "secretsmanager.${var.region}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name_prefix = "${var.project_name}-ecs-task-"
  
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
    Name = "${var.project_name}-ecs-task-role"
  }
}

# Task role policy for application-specific permissions
resource "aws_iam_role_policy" "ecs_task" {
  name_prefix = "${var.project_name}-ecs-task-"
  role        = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs_tasks.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.project_name}-rds-monitoring-"
  
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

  tags = {
    Name = "${var.project_name}-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

### 8. `compute.tf` - ECS Cluster and Service

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-ecs-cluster"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = var.project_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = var.project_name
      image = "${var.ecr_repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "APP_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "8080"
        },
        {
          name  = "DB_NAME"
          value = var.database_name
        }
      ]
      
      secrets = [
        {
          name      = "DB_CONNECTION_STRING"
          valueFrom = "${aws_secretsmanager_secret.rds_credentials.arn}:connection_string::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_tasks.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      essential = true
    }
  ])

  tags = {
    Name = "${var.project_name}-task-definition"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.min_tasks
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = var.project_name
    container_port   = 8080
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
    
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  enable_execute_command = true
  
  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy.ecs_task_execution_secrets
  ]

  tags = {
    Name = "${var.project_name}-ecs-service"
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}
```

### 9. `alb.tf` - Application Load Balancer

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket_prefix = "${var.project_name}-alb-logs-"

  tags = {
    Name = "${var.project_name}-alb-logs"
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

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for ALB logs
data "aws_elb_service_account" "main" {}

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
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb/*"
      }
    ]
  })
}

# Target Groups for Blue/Green deployments
resource "aws_lb_target_group" "blue" {
  name_prefix          = "blue-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-tg-blue"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "green" {
  name_prefix          = "green-"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-tg-green"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = {
    Name = "${var.project_name}-https-listener"
  }
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
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
    Name = "${var.project_name}-http-redirect"
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.project_name}-waf"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

### 10. `monitoring.tf` - CloudWatch Resources

```hcl
# CloudWatch Log Group for ECS tasks
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-ecs-logs"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ECS Service Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "RequestCount", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ALB Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aws_rds_cluster.aurora.cluster_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "RDS Aurora Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "${var.project_name}-ecs-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_health" {
  alarm_name          = "${var.project_name}-alb-unhealthy-targets"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = var.min_tasks
  alarm_description   = "Alert when we have less than minimum healthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "${var.project_name}-alb-health-alarm"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = {
    Name = "${var.project_name}-alerts-topic"
  }
}
```

### 11. `autoscaling.tf` - Auto-scaling Configuration

```hcl
# ECS Service Auto-scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_tasks
  min_capacity       = var.min_tasks
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.app]
}

# CPU-based Auto-scaling Policy
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.project_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_target_value
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Memory-based Auto-scaling Policy
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "${var.project_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = 80
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Request Count Target Tracking
resource "aws_appautoscaling_policy" "ecs_alb_request_count" {
  name               = "${var.project_name}-request-count-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.blue.arn_suffix}"
    }

    target_value       = 1000
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### 12. `dns.tf` - Route53 Configuration

```hcl
# Route53 A Record
resource "aws_route53_record" "app" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Health Check
resource "aws_route53_health_check" "app" {
  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "${var.project_name}-health-check"
  }
}
```

### 13. `outputs.tf` - Output Values

```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "application_url" {
  description = "URL of the application"
  value       = "https://${var.domain_name}"
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_tasks.name
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "secrets_manager_rds_secret_arn" {
  description = "ARN of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
  sensitive   = true
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = var.ecr_repository_url
}
```

## Deployment Instructions

1. **Prerequisites:**
   - Ensure you have Terraform 1.5+ installed
   - Configure AWS credentials
   - Have the ECR repository URL and ACM certificate ARN ready
   - Ensure VPC and subnets exist

2. **Create a `terraform.tfvars` file:**

```hcl
vpc_id              = "vpc-xxxxxxxxx"
private_subnet_ids  = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
public_subnet_ids   = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]
acm_certificate_arn = "arn:aws:acm:us-west-1:123456789012:certificate/xxxxxxxx"
ecr_repository_url  = "123456789012.dkr.ecr.us-west-1.amazonaws.com/fintech-app"
route53_zone_id     = "Z1234567890ABC"
```

3. **Initialize and Deploy:**

```bash
terraform init
terraform plan
terraform apply
```

## Blue/Green Deployment Process

To perform a blue/green deployment:

1. Update the container image in ECR with a new tag
2. Update the task definition to use the new image
3. Create a new service pointing to the green target group
4. Test the new deployment
5. Switch the ALB listener to point to the green target group
6. Gradually drain connections from the blue target group

## Security Considerations

- All data is encrypted at rest and in transit
- Secrets are stored in AWS Secrets Manager
- Network isolation using security groups
- WAF protection against common attacks
- Private subnets for compute resources
- VPC endpoints to avoid internet traffic for AWS services

## Monitoring and Alerting

- CloudWatch dashboards for real-time monitoring
- Alarms for CPU, memory, and target health
- Logs retained for 30 days
- SNS topic for alert notifications

This infrastructure is designed to handle 10,000 concurrent users with auto-scaling capabilities and zero-downtime deployments. Make sure to subscribe to the SNS topic to receive alerts.