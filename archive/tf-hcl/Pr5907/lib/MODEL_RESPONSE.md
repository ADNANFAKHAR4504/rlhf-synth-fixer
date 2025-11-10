# Payment Processing Application Migration - Terraform Infrastructure

This document contains the complete Terraform infrastructure code for migrating a payment processing application to AWS with zero-downtime capabilities.

## Architecture Overview

The infrastructure includes:
- Multi-tier VPC with public and private subnets across 2 availability zones
- RDS PostgreSQL Multi-AZ for high availability
- AWS DMS for database migration from on-premises
- Auto Scaling Group with blue-green deployment capability
- Application Load Balancer with AWS WAF protection
- Secrets Manager for credential management
- CloudWatch for logging and monitoring

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts across environments"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "paymentdb"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "dms_source_endpoint_server" {
  description = "Hostname or IP of on-premises database server"
  type        = string
  default     = "10.1.1.100"
}

variable "dms_source_endpoint_port" {
  description = "Port number of on-premises database"
  type        = number
  default     = 5432
}

variable "dms_source_endpoint_username" {
  description = "Username for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_password" {
  description = "Password for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_database" {
  description = "Database name on on-premises server"
  type        = string
  default     = "legacy_payment_db"
}

variable "app_config_values" {
  description = "Application configuration key-value pairs"
  type        = map(string)
  default = {
    "app_version"    = "1.0.0"
    "log_level"      = "INFO"
    "feature_flag_1" = "enabled"
  }
}
```

## File: main.tf

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name             = "payment-vpc-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name             = "payment-igw-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name             = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
    Tier             = "public"
  }
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name             = "payment-private-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
    Tier             = "private-app"
  }
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name             = "payment-private-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
    Tier             = "private-db"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name             = "payment-nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name             = "payment-nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name             = "payment-public-rt-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private App Subnets
resource "aws_route_table" "private_app" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name             = "payment-private-app-rt-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Route Table Associations for Private App Subnets
resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Route Tables for Private DB Subnets
resource "aws_route_table" "private_db" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name             = "payment-private-db-rt-${count.index + 1}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Route Table Associations for Private DB Subnets
resource "aws_route_table_association" "private_db" {
  count          = 2
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db[count.index].id
}
```

## File: security.tf

```hcl
# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "payment-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet"
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
    Name             = "payment-alb-sg-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Tier
resource "aws_security_group" "app" {
  name_prefix = "payment-app-sg-"
  description = "Security group for Application tier EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Application port from ALB"
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
    Name             = "payment-app-sg-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Database Tier
resource "aws_security_group" "db" {
  name_prefix = "payment-db-sg-"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name             = "payment-db-sg-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for DMS Replication Instance
resource "aws_security_group" "dms" {
  name_prefix = "payment-dms-sg-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name             = "payment-dms-sg-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# WAF Web ACL for Rate Limiting
resource "aws_wafv2_web_acl" "main" {
  name  = "payment-waf-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

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

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PaymentWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name             = "payment-waf-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}
```

## File: database.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name             = "payment-rds-kms-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/payment-rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name             = "payment-db-subnet-group-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  deletion_protection             = false
  skip_final_snapshot             = true

  tags = {
    Name             = "payment-db-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "payment-dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private_app[*].id

  tags = {
    Name             = "payment-dms-subnet-group-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id   = "payment-dms-${var.environment_suffix}"
  replication_instance_class = "dms.c5.large"
  allocated_storage          = 100

  vpc_security_group_ids         = [aws_security_group.dms.id]
  replication_subnet_group_id    = aws_dms_replication_subnet_group.main.id
  publicly_accessible            = false
  multi_az                       = false
  engine_version                 = "3.5.1"

  tags = {
    Name             = "payment-dms-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# DMS Source Endpoint (On-premises database)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "payment-dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name = var.dms_source_endpoint_server
  port        = var.dms_source_endpoint_port
  username    = var.dms_source_endpoint_username
  password    = var.dms_source_endpoint_password
  database_name = var.dms_source_endpoint_database

  ssl_mode = "require"

  tags = {
    Name             = "payment-dms-source-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# DMS Target Endpoint (RDS)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "payment-dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "postgres"

  server_name   = aws_db_instance.main.address
  port          = aws_db_instance.main.port
  username      = var.db_username
  password      = random_password.db_password.result
  database_name = var.db_name

  ssl_mode = "require"

  tags = {
    Name             = "payment-dms-target-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  depends_on = [aws_db_instance.main]
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id      = "payment-dms-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn
  table_mappings           = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    Logging = {
      EnableLogging = true
    }
  })

  tags = {
    Name             = "payment-dms-task-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  depends_on = [
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}
```

## File: secrets.tf

```hcl
# Secrets Manager Secret for Database Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "payment-db-credentials-${var.environment_suffix}"
  description             = "Database credentials for payment processing application"
  recovery_window_in_days = 7

  tags = {
    Name             = "payment-db-credentials-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Store the actual credentials
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })
}

# Secrets Manager Secret Rotation
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [
    aws_secretsmanager_secret_version.db_credentials,
    aws_lambda_permission.secrets_manager
  ]
}

# IAM Role for Lambda Secrets Rotation
resource "aws_iam_role" "secrets_rotation" {
  name = "payment-secrets-rotation-${var.environment_suffix}"

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
    Name             = "payment-secrets-rotation-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# IAM Policy for Secrets Rotation Lambda
resource "aws_iam_role_policy" "secrets_rotation" {
  name = "payment-secrets-rotation-policy"
  role = aws_iam_role.secrets_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:ModifyDBInstance"
        ]
        Resource = aws_db_instance.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function for Secrets Rotation (placeholder)
resource "aws_lambda_function" "secrets_rotation" {
  filename      = "${path.module}/lambda/secrets_rotation.zip"
  function_name = "payment-secrets-rotation-${var.environment_suffix}"
  role          = aws_iam_role.secrets_rotation.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30

  vpc_config {
    subnet_ids         = aws_subnet.private_app[*].id
    security_group_ids = [aws_security_group.app.id]
  }

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.aws_region}.amazonaws.com"
    }
  }

  tags = {
    Name             = "payment-secrets-rotation-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Systems Manager Parameter Store - Application Configuration
resource "aws_ssm_parameter" "app_config" {
  for_each = var.app_config_values

  name  = "/payment/${var.environment_suffix}/${each.key}"
  type  = "String"
  value = each.value

  tags = {
    Name             = "payment-config-${each.key}-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Systems Manager Parameter for DB Secret ARN
resource "aws_ssm_parameter" "db_secret_arn" {
  name  = "/payment/${var.environment_suffix}/db_secret_arn"
  type  = "String"
  value = aws_secretsmanager_secret.db_credentials.arn

  tags = {
    Name             = "payment-db-secret-arn-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}
```

## File: compute.tf

```hcl
# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name = "payment-ec2-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name             = "payment-ec2-role-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# IAM Policy for EC2 Instances
resource "aws_iam_role_policy" "ec2" {
  name = "payment-ec2-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/payment/${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "payment-ec2-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2.name

  tags = {
    Name             = "payment-ec2-profile-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "payment-app-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent

              # Install application dependencies
              yum install -y python3 python3-pip postgresql15

              # Configure CloudWatch agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWCONFIG'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/payment-app/*.log",
                          "log_group_name": "${aws_cloudwatch_log_group.app.name}",
                          "log_stream_name": "{instance_id}"
                        }
                      ]
                    }
                  }
                }
              }
              CWCONFIG

              # Start CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

              # Create application directory
              mkdir -p /opt/payment-app
              mkdir -p /var/log/payment-app

              # Retrieve database credentials from Secrets Manager
              aws secretsmanager get-secret-value \
                --secret-id ${aws_secretsmanager_secret.db_credentials.id} \
                --region ${var.aws_region} \
                --query SecretString \
                --output text > /opt/payment-app/db-credentials.json

              # Retrieve application configuration from Parameter Store
              aws ssm get-parameters-by-path \
                --path /payment/${var.environment_suffix}/ \
                --region ${var.aws_region} \
                --output json > /opt/payment-app/app-config.json

              # Start application (placeholder - actual application deployment would go here)
              echo "Application server starting..." > /var/log/payment-app/startup.log
              EOF
  )

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name             = "payment-app-${var.environment_suffix}"
      Environment      = var.environment_suffix
      Application      = "PaymentProcessing"
      MigrationPhase   = "production"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "payment-asg-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private_app[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "payment-app-instance-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Application"
    value               = "PaymentProcessing"
    propagate_at_launch = true
  }

  tag {
    key                 = "MigrationPhase"
    value               = "production"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentColor"
    value               = "blue"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "payment-scale-up-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "payment-scale-down-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}
```

## File: loadbalancer.tf

```hcl
# Application Load Balancer
resource "aws_lb" "app" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name             = "payment-alb-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name     = "payment-tg-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

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
    Name             = "payment-tg-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# ALB Listener - HTTP (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
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

# ALB Listener - HTTPS
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Self-signed certificate for HTTPS (for testing - replace with real cert in production)
resource "aws_acm_certificate" "main" {
  private_key       = tls_private_key.main.private_key_pem
  certificate_body  = tls_self_signed_cert.main.cert_pem

  tags = {
    Name             = "payment-cert-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "main" {
  private_key_pem = tls_private_key.main.private_key_pem

  subject {
    common_name  = "payment-app.example.com"
    organization = "Payment Processing Inc"
  }

  validity_period_hours = 8760

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

# WAF Association with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.app.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## File: monitoring.tf

```hcl
# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/payment-app-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name             = "payment-app-logs-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Log Group for DMS Logs
resource "aws_cloudwatch_log_group" "dms" {
  name              = "/aws/dms/payment-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name             = "payment-dms-logs-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/payment-db-${var.environment_suffix}/postgresql"
  retention_in_days = 30

  tags = {
    Name             = "payment-rds-logs-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Alarm - High CPU on RDS
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "payment-rds-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name             = "payment-rds-cpu-alarm-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Alarm - High CPU on ASG
resource "aws_cloudwatch_metric_alarm" "asg_cpu_high" {
  alarm_name          = "payment-asg-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Trigger scale up when CPU exceeds 75%"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Name             = "payment-asg-cpu-high-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Alarm - Low CPU on ASG
resource "aws_cloudwatch_metric_alarm" "asg_cpu_low" {
  alarm_name          = "payment-asg-low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "25"
  alarm_description   = "Trigger scale down when CPU is below 25%"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Name             = "payment-asg-cpu-low-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Alarm - Unhealthy Target Group
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "payment-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when target group has unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.app.arn_suffix
  }

  tags = {
    Name             = "payment-unhealthy-targets-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Alarm - ALB 5xx Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "payment-alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when ALB returns too many 5xx errors"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  tags = {
    Name             = "payment-alb-5xx-${var.environment_suffix}"
    Environment      = var.environment_suffix
    Application      = "PaymentProcessing"
    MigrationPhase   = "production"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "payment-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "EC2 CPU" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Response Time"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "Request Count"
        }
      }
    ]
  })
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs of private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "IDs of private database subnets"
  value       = aws_subnet.private_db[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app.arn
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.main.db_name
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "dms_replication_instance_arn" {
  description = "ARN of the DMS replication instance"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_task_arn" {
  description = "ARN of the DMS replication task"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "cloudwatch_log_group_app" {
  description = "Name of the CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}
```

## File: terraform.tfvars

```hcl
# Example terraform.tfvars file
# Copy this file and customize values for your environment

aws_region        = "ap-southeast-1"
environment_suffix = "dev001"

vpc_cidr = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# Database configuration
db_username = "dbadmin"
db_name     = "paymentdb"

# EC2 configuration
instance_type    = "t3.medium"
min_size         = 2
max_size         = 6
desired_capacity = 2

# DMS source endpoint (on-premises database)
dms_source_endpoint_server   = "10.1.1.100"
dms_source_endpoint_port     = 5432
dms_source_endpoint_database = "legacy_payment_db"

# Application configuration
app_config_values = {
  "app_version"    = "1.0.0"
  "log_level"      = "INFO"
  "feature_flag_1" = "enabled"
}
```
