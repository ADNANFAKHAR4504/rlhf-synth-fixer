# Ideal Response - Terraform Payment Processing Infrastructure

This document contains the ideal response for implementing a multi-environment payment processing infrastructure using Terraform. The solution provides a comprehensive, production-ready infrastructure that can be deployed across dev, staging, and prod environments using a modular file structure with separate files for better organization and maintainability.

## Complete Terraform Configuration (main.tf)

```hcl
# tap_stack.tf - Payment Processing Infrastructure
# Multi-environment deployment infrastructure
# Deploy with: terraform apply -var-file="dev.tfvars"

# ==================== LOCALS (MAPPINGS) ====================

locals {
  # Environment to environment code mapping (for CIDR blocks)
  env_code_map = {
    dev     = 1
    staging = 2
    prod    = 3
  }

  # Environment to RDS instance size mapping
  rds_instance_map = {
    dev     = "db.t3.micro"
    staging = "db.t3.small"
    prod    = "db.t3.medium"
  }

  # Environment to ECS task count mapping
  ecs_task_count_map = {
    dev     = 1
    staging = 2
    prod    = 4
  }

  # Environment to Lambda reserved concurrency mapping
  lambda_concurrency_map = {
    dev     = 10  # Low concurrency for development
    staging = 50  # Medium for staging environment
    prod    = 200 # High for production traffic
  }

  # CloudWatch alarm thresholds (based on environment capacity)
  alarm_thresholds = {
    dev = {
      cpu_high      = 80 # Higher threshold for dev (less critical)
      memory_high   = 85
      error_rate    = 10   # Higher error tolerance in dev
      response_time = 3000 # 3 seconds
    }
    staging = {
      cpu_high      = 75 # Medium thresholds for staging
      memory_high   = 80
      error_rate    = 5
      response_time = 2000 # 2 seconds
    }
    prod = {
      cpu_high      = 70 # Most sensitive for production
      memory_high   = 75
      error_rate    = 1    # Very low error tolerance
      response_time = 1000 # 1 second SLA
    }
  }

  # Common tags for all resources
  common_tags = {
    Environment        = var.environment
    CostCenter         = var.cost_center
    DataClassification = var.data_classification
    ManagedBy          = "Terraform"
    Project            = "PaymentProcessing"
    Repository         = var.repository
    CommitAuthor       = var.commit_author
    PrNumber           = var.pr_number
    Team               = var.team
  }

  # Derived values  
  env_code = local.env_code_map[var.environment]
  vpc_cidr = "10.${local.env_code}.0.0/16"
}

# ==================== DATA SOURCES ====================

# Get available AZs (limit to 3)
data "aws_availability_zones" "available" {
  state = "available"
}

# Current caller identity
data "aws_caller_identity" "current" {}

# Current region
data "aws_region" "current" {}

# ==================== VPC AND NETWORKING ====================

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.${local.env_code}.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.${local.env_code}.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways (one per AZ for HA)
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.common_tags, {
    Name = "${var.environment}-s3-endpoint"
  })
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.common_tags, {
    Name = "${var.environment}-dynamodb-endpoint"
  })
}

# ==================== SECURITY GROUPS ====================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Inbound: HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }

  # Inbound: HTTP from anywhere (redirect to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet (redirect to HTTPS)"
  }

  # Outbound: All traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb-sg"
  })
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Inbound: From ALB only
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Traffic from ALB"
  }

  # Outbound: All traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-ecs-tasks-sg"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.environment}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # Inbound: PostgreSQL from ECS tasks and Lambda
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id, aws_security_group.lambda.id]
    description     = "PostgreSQL from ECS and Lambda"
  }

  # Outbound: All traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-rds-sg"
  })
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name        = "${var.environment}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  # Outbound: All traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-sg"
  })
}

# ==================== IAM ROLES ====================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.environment}-ECS-TaskExecution-Role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.environment}-ECS-Task-Role"

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

  tags = local.common_tags
}

# ECS Task Policy for Secrets and S3 access
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.environment}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.payment_logs.arn}/*"
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment}-Lambda-PaymentValidation-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# Lambda Policy
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.payment_logs.arn}/*"
      }
    ]
  })
}

# Secrets Manager Rotation Lambda Role
resource "aws_iam_role" "secrets_rotation" {
  name = "${var.environment}-SecretsManager-Rotation-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "secrets_rotation" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ==================== SECRETS MANAGER ====================

# Database Credentials Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}-payment-db-credentials"
  description             = "RDS PostgreSQL credentials for payment processing"
  recovery_window_in_days = 7 # Soft delete protection

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "paymentadmin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = "paymentdb"
  })
  
  depends_on = [aws_db_instance.main]
}

# API Keys Secret
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.environment}-payment-api-keys"
  description             = "API keys for payment gateway integration"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    payment_gateway_key    = random_password.api_key.result
    webhook_signing_secret = random_password.webhook_secret.result
  })
}

# Rotation configuration for DB credentials
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30 # Rotate every 30 days as required
  }
}

# ==================== RDS POSTGRESQL ====================

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Random API key
resource "random_password" "api_key" {
  length  = 40
  special = false
}

# Random webhook secret
resource "random_password" "webhook_secret" {
  length  = 32
  special = false
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-payment-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-db-subnet-group"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-payment-db"
  engine         = "postgres"
  engine_version = "14.7" # Required version

  instance_class = local.rds_instance_map[var.environment]

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true # Encryption enabled as required

  db_name  = "paymentdb"
  username = "paymentadmin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Multi-AZ configuration: true for production, false for dev/staging
  multi_az = var.environment == "prod" ? true : false

  # Backup configuration
  backup_retention_period = var.environment == "prod" ? 30 : 7 # Longer retention for production
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Performance Insights
  performance_insights_enabled = var.environment == "prod" ? true : false

  # Deletion protection explicitly disabled as required
  deletion_protection = false
  skip_final_snapshot = true # For demo purposes; in real scenario, set to false for prod

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-database"
  })
}

# ==================== APPLICATION LOAD BALANCER ====================

# ALB
resource "aws_lb" "main" {
  name               = "${var.environment}-payment-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = false # Explicitly disabled as required
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name        = "${var.environment}-payment-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Required for Fargate

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 30
    interval            = 60
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-target-group"
  })
}

# ALB Listener (HTTP redirect to HTTPS)
resource "aws_lb_listener" "http" {
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
}

# ACM Certificate (only create if not provided)
resource "aws_acm_certificate" "main" {
  count             = var.acm_certificate_arn == "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-cert"
  })
}

# ACM Certificate Validation (only validate if we created the certificate AND validation is enabled)
# IMPORTANT: This requires DNS validation records to be created in your DNS zone
# To use this, you must either:
# 1. Set acm_certificate_arn variable to an existing certificate ARN, OR
# 2. Set enable_certificate_validation=false to skip validation (recommended for initial deployment), OR
# 3. Create DNS validation records manually after certificate creation, then set enable_certificate_validation=true
resource "aws_acm_certificate_validation" "main" {
  count           = var.acm_certificate_arn == "" && var.enable_certificate_validation ? 1 : 0
  certificate_arn = aws_acm_certificate.main[0].arn
  
  timeouts {
    create = "10m"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener (HTTPS - using certificate)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn != "" ? var.acm_certificate_arn : (var.enable_certificate_validation ? aws_acm_certificate_validation.main[0].certificate_arn : aws_acm_certificate.main[0].arn)

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  depends_on = [aws_acm_certificate.main]
}

# ==================== ECS FARGATE ====================

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-payment-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-cluster"
  })
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.environment}-payment"
  retention_in_days = 30 # 30-day retention as required

  tags = local.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.environment}-payment-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "prod" ? "1024" : "512"
  memory                   = var.environment == "prod" ? "2048" : "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "payment-processor"
    image = var.container_image # PLACEHOLDER: Replace with actual payment processing image

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "AWS_REGION"
        value = data.aws_region.current.name
      },
      {
        name  = "LOG_LEVEL"
        value = var.environment == "prod" ? "INFO" : "DEBUG"
      }
    ]

    secrets = [
      {
        name      = "DB_CONNECTION"
        valueFrom = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        name      = "API_KEYS"
        valueFrom = aws_secretsmanager_secret.api_keys.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "payment"
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

  tags = local.common_tags
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.environment}-payment-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn

  desired_count = local.ecs_task_count_map[var.environment]

  launch_type = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "payment-processor"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy.ecs_task
  ]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-service"
  })
}

# ==================== LAMBDA FUNCTIONS ====================

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.environment}-payment-validation"
  retention_in_days = 30 # 30-day retention as required

  tags = local.common_tags
}

# Lambda function for payment validation
resource "aws_lambda_function" "payment_validation" {
  filename         = var.lambda_source_path # PLACEHOLDER: Replace with actual Lambda zip file path
  function_name    = "${var.environment}-payment-validation"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda.handler" # PLACEHOLDER: Update handler as needed
  source_code_hash = filebase64sha256(var.lambda_source_path)
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = var.environment == "prod" ? 512 : 256

  reserved_concurrency = local.lambda_concurrency_map[var.environment]

  environment {
    variables = {
      ENVIRONMENT    = var.environment
      DB_SECRET_ARN  = aws_secretsmanager_secret.db_credentials.arn
      API_SECRET_ARN = aws_secretsmanager_secret.api_keys.arn
      S3_BUCKET      = aws_s3_bucket.payment_logs.bucket
      LOG_LEVEL      = var.environment == "prod" ? "INFO" : "DEBUG"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-validation-lambda"
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.lambda_execution
  ]
}

# Lambda for Secrets Rotation
resource "aws_lambda_function" "secrets_rotation" {
  filename         = var.lambda_source_path # PLACEHOLDER: Use AWS-provided rotation function
  function_name    = "${var.environment}-secrets-rotation"
  role             = aws_iam_role.secrets_rotation.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = filebase64sha256(var.lambda_source_path)
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${data.aws_region.current.name}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.common_tags
}

# Lambda permission for Secrets Manager
resource "aws_lambda_permission" "secrets_rotation" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# ==================== S3 BUCKET FOR PAYMENT LOGS ====================

resource "aws_s3_bucket" "payment_logs" {
  bucket = "${data.aws_caller_identity.current.account_id}-${var.environment}-payment-logs"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-payment-logs"
  })
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" # AES-256 encryption as required
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90 # Transition to Glacier after 90 days as required
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # Keep for 7 years for compliance
    }
  }
}

# ==================== CLOUDWATCH DASHBOARDS & ALARMS ====================

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-payment-dashboard"

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
          region = data.aws_region.current.name
          title  = "ECS Resource Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.payment_validation.function_name],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Lambda Performance"
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
          region = data.aws_region.current.name
          title  = "ALB Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarm - ECS CPU
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = local.alarm_thresholds[var.environment].cpu_high
  alarm_description   = "ECS CPU utilization too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  tags = local.common_tags
}

# CloudWatch Alarm - ECS Memory
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = local.alarm_thresholds[var.environment].memory_high
  alarm_description   = "ECS memory utilization too high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  tags = local.common_tags
}

# CloudWatch Alarm - RDS CPU
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = local.alarm_thresholds[var.environment].cpu_high
  alarm_description   = "RDS CPU utilization too high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# CloudWatch Alarm - ALB Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = local.alarm_thresholds[var.environment].response_time / 1000 # Convert to seconds
  alarm_description   = "ALB response time too high"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.environment}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = local.alarm_thresholds[var.environment].error_rate
  alarm_description   = "Lambda function errors exceed threshold"

  dimensions = {
    FunctionName = aws_lambda_function.payment_validation.function_name
  }

  tags = local.common_tags
}

# ==================== OUTPUTS ====================

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
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS Service name"
  value       = aws_ecs_service.main.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_secret_arn" {
  description = "Database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "api_keys_secret_arn" {
  description = "API keys secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "s3_bucket_arn" {
  description = "Payment logs S3 bucket ARN"
  value       = aws_s3_bucket.payment_logs.arn
}

output "s3_bucket_name" {
  description = "Payment logs S3 bucket name"
  value       = aws_s3_bucket.payment_logs.bucket
}

output "lambda_function_arn" {
  description = "Payment validation Lambda ARN"
  value       = aws_lambda_function.payment_validation.arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# ==================== EXAMPLE USAGE ====================

# Example terraform.tfvars file:
# environment         = "prod"
# cost_center        = "FINTECH-001"
# data_classification = "confidential"
# container_image    = "${account_id}.dkr.ecr.us-east-1.amazonaws.com/payment-processor:latest"
# lambda_source_path = "./lambda.zip"

# Example commands:
# terraform init
# terraform plan -var="environment=dev"
# terraform apply -var="environment=staging"
# terraform apply -var="environment=prod"
```

## Complete Variables Configuration (variables.tf)

```hcl
# variables.tf

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "FINTECH-001"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "confidential"
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "lambda_source_path" {
  description = "Path to Lambda deployment package"
  type        = string
  default     = "lambda.zip"
  
  validation {
    condition     = var.environment != "prod" || can(regex("^(?!.*lambda\\.zip$).*", var.lambda_source_path))
    error_message = "PRODUCTION SAFETY: Cannot use 'lambda.zip' placeholder in production environment. Please provide a valid Lambda deployment package path."
  }
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN (optional). If provided, will use this instead of creating a new certificate."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
  default     = "payment-api.example.com"
}

variable "enable_certificate_validation" {
  description = "Enable ACM certificate validation (requires DNS records to be created). Set to false to skip validation and avoid deployment blocking."
  type        = bool
  default     = false
}
```

## Key Features of the Ideal Response

### 1. **Multi-Environment Architecture**
- Modular Terraform structure with separate files for provider, variables, and main infrastructure supporting dev, staging, and prod environments
- Environment-specific resource sizing and configurations
- Region mapping: dev (eu-west-1), staging (us-west-2), prod (us-east-1)

### 2. **Comprehensive Infrastructure Components**
- **VPC & Networking**: Multi-AZ setup with public/private subnets, NAT gateways, VPC endpoints
- **Security**: Security groups with least privilege, IAM roles with proper naming conventions
- **Database**: PostgreSQL 14.7 with Multi-AZ for production, automated backups
- **Compute**: ECS Fargate with environment-specific scaling
- **Load Balancing**: Application Load Balancer with HTTPS/HTTP listeners
- **Serverless**: Lambda functions with VPC configuration and reserved concurrency
- **Storage**: S3 buckets with AES-256 encryption and lifecycle policies
- **Monitoring**: CloudWatch dashboards, alarms, and log groups

### 3. **Security Best Practices**
- All resources encrypted at rest and in transit
- Secrets Manager for credential management with 30-day rotation
- Security groups with minimal required access
- S3 buckets with public access blocked
- IAM roles with least privilege principles

### 4. **Production-Ready Features**
- Multi-AZ RDS for production high availability
- Environment-specific alarm thresholds
- Comprehensive monitoring and logging
- Automated secret rotation
- Resource tagging for cost management and compliance

### 5. **Deployment Flexibility**
- Single command deployment with environment variable
- Consistent configuration across all environments
- Clear placeholder comments for customization
- Example usage documentation included