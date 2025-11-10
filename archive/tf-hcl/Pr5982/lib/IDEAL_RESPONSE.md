# Overview

This solution implements a comprehensive zero-downtime payment processing system migration from on-premises to AWS using Terraform with HCL.

## Architecture

The infrastructure implements:
- **Multi-AZ VPC**: Spanning 3 availability zones with public, private app, and private DB subnets
- **Aurora MySQL 8.0 Cluster**: Multi-AZ database with read replicas
- **AWS DMS**: Database Migration Service with CDC for continuous replication
- **ECS Fargate**: Containerized application platform with auto-scaling
- **Blue-Green Deployment**: ALB with weighted target groups for gradual traffic shifting
- **Route 53**: DNS management with weighted routing policies
- **CloudWatch & Kinesis**: Comprehensive logging and monitoring

## Solution Files


## ./provider.tf

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

  # Backend configuration commented out for QA testing - using local state
  # backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

## ./variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "migration"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "onprem_cidr" {
  description = "On-premises CIDR for Direct Connect routing"
  type        = string
  default     = "192.168.0.0/16"
}

variable "db_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
}

variable "onprem_db_endpoint" {
  description = "On-premises database endpoint for DMS"
  type        = string
  default     = "onprem-db.example.com"
}

variable "onprem_db_username" {
  description = "On-premises database username"
  type        = string
  sensitive   = true
}

variable "onprem_db_password" {
  description = "On-premises database password"
  type        = string
  sensitive   = true
}

variable "payment_app_image" {
  description = "Docker image for payment application"
  type        = string
  default     = "payment-app:latest"
}

variable "payment_app_port" {
  description = "Port for payment application"
  type        = number
  default     = 8080
}

variable "onprem_syslog_endpoint" {
  description = "On-premises syslog endpoint for log forwarding"
  type        = string
  default     = "syslog.onprem.example.com"
}

variable "blue_target_weight" {
  description = "Weight for blue target group (0-100)"
  type        = number
  default     = 100
}

variable "green_target_weight" {
  description = "Weight for green target group (0-100)"
  type        = number
  default     = 0
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
  default     = "FinTech-Payments"
}

variable "migration_phase" {
  description = "Current migration phase"
  type        = string
  default     = "preparation"
}

variable "direct_connect_gateway_id" {
  description = "Direct Connect Gateway ID for hybrid connectivity"
  type        = string
  default     = ""
}

variable "direct_connect_vif_id" {
  description = "Direct Connect Virtual Interface ID"
  type        = string
  default     = ""
}
```

## ./terraform.tfvars

```hcl
# Terraform variables for QA deployment
aws_region         = "us-east-1"
environment_suffix = "synthomii5"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
onprem_cidr        = "192.168.0.0/16"

# Database Configuration
db_master_username = "admin"
db_master_password = "TestPassword123!ChangeMe"

# On-Premises Configuration (test values for deployment)
onprem_db_endpoint     = "test-onprem-db.example.com"
onprem_db_username     = "migration_user"
onprem_db_password     = "TestOnPremPassword123!"
onprem_syslog_endpoint = "syslog.onprem.example.com"

# Application Configuration
payment_app_image = "nginx:latest"
payment_app_port  = 80

# Traffic Distribution (Blue-Green)
blue_target_weight  = 100
green_target_weight = 0

# Tags
cost_center     = "FinTech-Payments"
migration_phase = "preparation"

# Direct Connect (empty for QA - optional)
direct_connect_gateway_id = ""
direct_connect_vif_id     = ""

```

## ./locals.tf

```hcl
locals {
  environment = terraform.workspace

  # Environment-specific configurations
  env_config = {
    "staging-migration" = {
      db_instance_class       = "db.r6g.large"
      ecs_task_count          = 2
      ecs_task_cpu            = 1024
      ecs_task_memory         = 2048
      alb_deletion_protection = false
      db_backup_retention     = 7
    }
    "production-migration" = {
      db_instance_class       = "db.r6g.xlarge"
      ecs_task_count          = 4
      ecs_task_cpu            = 2048
      ecs_task_memory         = 4096
      alb_deletion_protection = true
      db_backup_retention     = 30
    }
  }

  current_env = lookup(local.env_config, local.environment, local.env_config["staging-migration"])

  common_tags = {
    Environment    = local.environment
    MigrationPhase = var.migration_phase
    CostCenter     = var.cost_center
    ManagedBy      = "terraform"
    Project        = "payment-migration"
  }

  # Resource naming with environment suffix
  name_prefix = "payment-${var.environment_suffix}"
}
```

## ./networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "public"
    }
  )
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-app-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "private-app"
    }
  )
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-db-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "private-db"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "public-rt-${var.environment_suffix}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  # Route to on-premises via Direct Connect
  dynamic "route" {
    for_each = var.direct_connect_gateway_id != "" ? [1] : []
    content {
      cidr_block = var.onprem_cidr
      gateway_id = var.direct_connect_gateway_id
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "private-rt-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count = 3

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "private_db" {
  count = 3

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from on-premises"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.payment_app_port
    to_port         = var.payment_app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Traffic from on-premises"
    from_port   = var.payment_app_port
    to_port     = var.payment_app_port
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-tasks-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from ECS tasks"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "MySQL from DMS"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  ingress {
    description = "MySQL from on-premises"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for DMS
resource "aws_security_group" "dms" {
  name_prefix = "dms-${var.environment_suffix}-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "MySQL from on-premises"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "dms-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints for Systems Manager (for private subnet access)
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "ssm-endpoint-${var.environment_suffix}"
    }
  )
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "ssmmessages-endpoint-${var.environment_suffix}"
    }
  )
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.environment_suffix}-"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-endpoints-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

## ./database.tf

```hcl
# Systems Manager Parameter Store for database credentials
resource "aws_ssm_parameter" "db_master_username" {
  name        = "/payment-migration/${var.environment_suffix}/db/master-username"
  description = "RDS Aurora master username"
  type        = "String"
  value       = var.db_master_username

  tags = merge(
    local.common_tags,
    {
      Name = "db-master-username-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "db_master_password" {
  name        = "/payment-migration/${var.environment_suffix}/db/master-password"
  description = "RDS Aurora master password"
  type        = "SecureString"
  value       = var.db_master_password

  tags = merge(
    local.common_tags,
    {
      Name = "db-master-password-${var.environment_suffix}"
    }
  )
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name        = "aurora-subnet-group-${var.environment_suffix}"
  description = "Subnet group for Aurora cluster"
  subnet_ids  = aws_subnet.private_db[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-subnet-group-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "payment" {
  cluster_identifier              = "payment-cluster-${var.environment_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  engine_mode                     = "provisioned"
  database_name                   = "paymentdb"
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = local.current_env.db_backup_retention
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  storage_encrypted               = true
  deletion_protection             = false
  skip_final_snapshot             = true

  serverlessv2_scaling_configuration {
    max_capacity = 16.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-cluster-${var.environment_suffix}"
    }
  )
}

# Aurora Cluster Instances (Writer)
resource "aws_rds_cluster_instance" "payment_writer" {
  identifier                   = "payment-writer-${var.environment_suffix}"
  cluster_identifier           = aws_rds_cluster.payment.id
  instance_class               = local.current_env.db_instance_class
  engine                       = aws_rds_cluster.payment.engine
  engine_version               = aws_rds_cluster.payment.engine_version
  publicly_accessible          = false
  db_subnet_group_name         = aws_db_subnet_group.aurora.name
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "payment-writer-${var.environment_suffix}"
      Role = "writer"
    }
  )
}

# Aurora Cluster Instances (Readers)
resource "aws_rds_cluster_instance" "payment_reader" {
  count = 2

  identifier                   = "payment-reader-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.payment.id
  instance_class               = local.current_env.db_instance_class
  engine                       = aws_rds_cluster.payment.engine
  engine_version               = aws_rds_cluster.payment.engine_version
  publicly_accessible          = false
  db_subnet_group_name         = aws_db_subnet_group.aurora.name
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "payment-reader-${var.environment_suffix}-${count.index + 1}"
      Role = "reader"
    }
  )
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "rds-monitoring-${var.environment_suffix}-"

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

  tags = merge(
    local.common_tags,
    {
      Name = "rds-monitoring-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store Aurora endpoints in Parameter Store
resource "aws_ssm_parameter" "aurora_writer_endpoint" {
  name        = "/payment-migration/${var.environment_suffix}/db/writer-endpoint"
  description = "Aurora cluster writer endpoint"
  type        = "String"
  value       = aws_rds_cluster.payment.endpoint

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-writer-endpoint-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "aurora_reader_endpoint" {
  name        = "/payment-migration/${var.environment_suffix}/db/reader-endpoint"
  description = "Aurora cluster reader endpoint"
  type        = "String"
  value       = aws_rds_cluster.payment.reader_endpoint

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-reader-endpoint-${var.environment_suffix}"
    }
  )
}
```

## ./compute.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "payment" {
  name = "payment-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-cluster-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_payment" {
  name              = "/ecs/payment-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-payment-logs-${var.environment_suffix}"
    }
  )
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "ecs-task-execution-${var.environment_suffix}-"

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

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-task-execution-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Parameter Store access
resource "aws_iam_role_policy" "ecs_parameter_store" {
  name_prefix = "ecs-parameter-store-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_execution.id

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
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/payment-migration/${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:payment-migration/${var.environment_suffix}/*"
      }
    ]
  })
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  name_prefix = "ecs-task-${var.environment_suffix}-"

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

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-task-role-${var.environment_suffix}"
    }
  )
}

# ECS Task Definition
resource "aws_ecs_task_definition" "payment" {
  family                   = "payment-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.current_env.ecs_task_cpu
  memory                   = local.current_env.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app"
      image     = var.payment_app_image
      essential = true

      portMappings = [
        {
          containerPort = var.payment_app_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = local.environment
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "DB_HOST"
          valueFrom = aws_ssm_parameter.aurora_writer_endpoint.arn
        },
        {
          name      = "DB_USERNAME"
          valueFrom = aws_ssm_parameter.db_master_username.arn
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_master_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_payment.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "payment"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.payment_app_port}/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name = "payment-task-${var.environment_suffix}"
    }
  )
}

# ECS Service - Blue
resource "aws_ecs_service" "payment_blue" {
  name            = "payment-blue-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.payment.id
  task_definition = aws_ecs_task_definition.payment.arn
  desired_count   = local.current_env.ecs_task_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "payment-app"
    container_port   = var.payment_app_port
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  health_check_grace_period_seconds = 60

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-service-${var.environment_suffix}"
      Deployment = "blue"
    }
  )

  depends_on = [
    aws_lb_listener.http
  ]
}

# ECS Service - Green
resource "aws_ecs_service" "payment_green" {
  name            = "payment-green-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.payment.id
  task_definition = aws_ecs_task_definition.payment.arn
  desired_count   = var.green_target_weight > 0 ? local.current_env.ecs_task_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "payment-app"
    container_port   = var.payment_app_port
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  health_check_grace_period_seconds = 60

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-service-${var.environment_suffix}"
      Deployment = "green"
    }
  )

  depends_on = [
    aws_lb_listener.http
  ]
}

# Auto Scaling for Blue Service
resource "aws_appautoscaling_target" "ecs_blue" {
  max_capacity       = local.current_env.ecs_task_count * 3
  min_capacity       = local.current_env.ecs_task_count
  resource_id        = "service/${aws_ecs_cluster.payment.name}/${aws_ecs_service.payment_blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_blue_cpu" {
  name               = "ecs-blue-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_blue.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_blue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_blue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling for Green Service
resource "aws_appautoscaling_target" "ecs_green" {
  count = var.green_target_weight > 0 ? 1 : 0

  max_capacity       = local.current_env.ecs_task_count * 3
  min_capacity       = local.current_env.ecs_task_count
  resource_id        = "service/${aws_ecs_cluster.payment.name}/${aws_ecs_service.payment_green.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_green_cpu" {
  count = var.green_target_weight > 0 ? 1 : 0

  name               = "ecs-green-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_green[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_green[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_green[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## ./loadbalancer.tf

```hcl
# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "payment-alb-logs-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "alb-logs-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }
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

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  depends_on = [
    aws_s3_bucket_public_access_block.alb_logs
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "payment" {
  name               = "payment-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = local.current_env.alb_deletion_protection
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  depends_on = [
    aws_s3_bucket_policy.alb_logs,
    aws_s3_bucket_public_access_block.alb_logs
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "payment-alb-${var.environment_suffix}"
    }
  )
}

# Target Group - Blue
resource "aws_lb_target_group" "blue" {
  name        = "payment-blue-${var.environment_suffix}"
  port        = var.payment_app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-tg-${var.environment_suffix}"
      Deployment = "blue"
    }
  )
}

# Target Group - Green
resource "aws_lb_target_group" "green" {
  name        = "payment-green-${var.environment_suffix}"
  port        = var.payment_app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-tg-${var.environment_suffix}"
      Deployment = "green"
    }
  )
}

# HTTP Listener with Weighted Target Groups (HTTPS disabled for QA testing)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.payment.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_target_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_target_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-http-listener-${var.environment_suffix}"
    }
  )
}
```

## ./migration.tf

```hcl
# Store on-premises database credentials in Parameter Store
resource "aws_ssm_parameter" "onprem_db_username" {
  name        = "/payment-migration/${var.environment_suffix}/onprem/db-username"
  description = "On-premises database username for DMS"
  type        = "String"
  value       = var.onprem_db_username

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-db-username-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "onprem_db_password" {
  name        = "/payment-migration/${var.environment_suffix}/onprem/db-password"
  description = "On-premises database password for DMS"
  type        = "SecureString"
  value       = var.onprem_db_password

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-db-password-${var.environment_suffix}"
    }
  )
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group for payment migration"
  subnet_ids                           = aws_subnet.private_app[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "dms-subnet-group-${var.environment_suffix}"
    }
  )
}

# IAM Role for DMS
resource "aws_iam_role" "dms_vpc" {
  name = "dms-vpc-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "dms-vpc-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "dms_vpc" {
  role       = aws_iam_role.dms_vpc.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

resource "aws_iam_role" "dms_cloudwatch" {
  name = "dms-cloudwatch-logs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "dms-cloudwatch-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch" {
  role       = aws_iam_role.dms_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id     = "dms-replication-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 100
  engine_version              = "3.5.1"
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]
  auto_minor_version_upgrade  = false

  tags = merge(
    local.common_tags,
    {
      Name = "dms-replication-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc,
    aws_iam_role_policy_attachment.dms_cloudwatch
  ]
}

# DMS Source Endpoint (On-premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id                 = "source-onprem-${var.environment_suffix}"
  endpoint_type               = "source"
  engine_name                 = "mysql"
  server_name                 = var.onprem_db_endpoint
  port                        = 3306
  username                    = var.onprem_db_username
  password                    = var.onprem_db_password
  database_name               = "paymentdb"
  ssl_mode                    = "require"
  extra_connection_attributes = "parallelLoadThreads=4;initstmt=SET FOREIGN_KEY_CHECKS=0"

  tags = merge(
    local.common_tags,
    {
      Name = "dms-source-onprem-${var.environment_suffix}"
    }
  )
}

# DMS Target Endpoint (Aurora)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora"
  server_name   = aws_rds_cluster.payment.endpoint
  port          = 3306
  username      = var.db_master_username
  password      = var.db_master_password
  database_name = "paymentdb"
  ssl_mode      = "require"

  tags = merge(
    local.common_tags,
    {
      Name = "dms-target-aurora-${var.environment_suffix}"
    }
  )

  depends_on = [aws_rds_cluster_instance.payment_writer]
}

# DMS Replication Task (Full Load + CDC)
resource "aws_dms_replication_task" "main" {
  replication_task_id       = "payment-migration-${var.environment_suffix}"
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn       = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target.endpoint_arn
  table_mappings            = file("${path.module}/dms-table-mappings.json")
  replication_task_settings = file("${path.module}/dms-task-settings.json")

  tags = merge(
    local.common_tags,
    {
      Name = "payment-migration-task-${var.environment_suffix}"
    }
  )

  lifecycle {
    ignore_changes = [replication_task_settings]
  }
}

# CloudWatch Log Group for DMS
resource "aws_cloudwatch_log_group" "dms" {
  name              = "/aws/dms/payment-migration-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "dms-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarms for DMS
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 300
  alarm_description   = "This metric monitors DMS replication lag"

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "dms-replication-lag-alarm-${var.environment_suffix}"
    }
  )
}
```

## ./dns.tf

```hcl
# Route 53 Private Hosted Zone
resource "aws_route53_zone" "private" {
  name = "payment.internal"

  vpc {
    vpc_id = aws_vpc.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-private-zone-${var.environment_suffix}"
    }
  )
}

# Weighted Record for Blue Environment
resource "aws_route53_record" "payment_blue" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "api.payment.internal"
  type    = "A"

  weighted_routing_policy {
    weight = var.blue_target_weight
  }

  set_identifier = "blue-${var.environment_suffix}"

  alias {
    name                   = aws_lb.payment.dns_name
    zone_id                = aws_lb.payment.zone_id
    evaluate_target_health = true
  }
}

# Weighted Record for Green Environment
resource "aws_route53_record" "payment_green" {
  count = var.green_target_weight > 0 ? 1 : 0

  zone_id = aws_route53_zone.private.zone_id
  name    = "api.payment.internal"
  type    = "A"

  weighted_routing_policy {
    weight = var.green_target_weight
  }

  set_identifier = "green-${var.environment_suffix}"

  alias {
    name                   = aws_lb.payment.dns_name
    zone_id                = aws_lb.payment.zone_id
    evaluate_target_health = true
  }
}

# Health Check for Blue Environment
resource "aws_route53_health_check" "blue" {
  type              = "HTTP"
  resource_path     = "/"
  fqdn              = aws_lb.payment.dns_name
  port              = 80
  request_interval  = 30
  failure_threshold = 3

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-blue-health-${var.environment_suffix}"
      Deployment = "blue"
    }
  )
}

# Health Check for Green Environment
resource "aws_route53_health_check" "green" {
  count = var.green_target_weight > 0 ? 1 : 0

  type              = "HTTP"
  resource_path     = "/"
  fqdn              = aws_lb.payment.dns_name
  port              = 80
  request_interval  = 30
  failure_threshold = 3

  tags = merge(
    local.common_tags,
    {
      Name       = "payment-green-health-${var.environment_suffix}"
      Deployment = "green"
    }
  )
}

# Database Endpoint Record
resource "aws_route53_record" "database_writer" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "db-writer.payment.internal"
  type    = "CNAME"
  ttl     = 300
  records = [aws_rds_cluster.payment.endpoint]
}

resource "aws_route53_record" "database_reader" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "db-reader.payment.internal"
  type    = "CNAME"
  ttl     = 300
  records = [aws_rds_cluster.payment.reader_endpoint]
}
```

## ./logging.tf

```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/payment-${var.environment_suffix}"
  retention_in_days = 30

  lifecycle {
    prevent_destroy = false
    ignore_changes  = []
  }

  tags = merge(
    local.common_tags,
    {
      Name = "application-logs-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_group" "infrastructure" {
  name              = "/aws/infrastructure/payment-${var.environment_suffix}"
  retention_in_days = 30

  lifecycle {
    prevent_destroy = false
    ignore_changes  = []
  }

  tags = merge(
    local.common_tags,
    {
      Name = "infrastructure-logs-${var.environment_suffix}"
    }
  )
}

# IAM Role for CloudWatch Logs to Kinesis Firehose
resource "aws_iam_role" "cloudwatch_to_firehose" {
  name_prefix = "cloudwatch-firehose-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudwatch-firehose-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "cloudwatch_to_firehose" {
  name_prefix = "cloudwatch-firehose-${var.environment_suffix}-"
  role        = aws_iam_role.cloudwatch_to_firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
      }
    ]
  })
}

# S3 Bucket for Backup Logs
resource "aws_s3_bucket" "logs_backup" {
  bucket = "payment-logs-backup-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "logs-backup-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_backup" {
  bucket = aws_s3_bucket.logs_backup.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_backup" {
  bucket = aws_s3_bucket.logs_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for Kinesis Firehose
resource "aws_iam_role" "firehose" {
  name_prefix = "firehose-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "firehose-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "firehose_s3" {
  name_prefix = "firehose-s3-${var.environment_suffix}-"
  role        = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.logs_backup.arn,
          "${aws_s3_bucket.logs_backup.arn}/*"
        ]
      }
    ]
  })
}

# Kinesis Firehose for Log Forwarding
resource "aws_kinesis_firehose_delivery_stream" "onprem_logs" {
  name        = "payment-logs-onprem-${var.environment_suffix}"
  destination = "http_endpoint"

  http_endpoint_configuration {
    url                = "https://${var.onprem_syslog_endpoint}/logs"
    name               = "OnPremisesSyslog"
    access_key         = "placeholder-access-key"
    buffering_size     = 5
    buffering_interval = 300
    retry_duration     = 300
    role_arn           = aws_iam_role.firehose.arn

    s3_backup_mode = "FailedDataOnly"

    request_configuration {
      content_encoding = "GZIP"

      common_attributes {
        name  = "Environment"
        value = local.environment
      }

      common_attributes {
        name  = "Source"
        value = "AWS"
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = "HTTPEndpointDelivery"
    }

    s3_configuration {
      role_arn           = aws_iam_role.firehose.arn
      bucket_arn         = aws_s3_bucket.logs_backup.arn
      buffering_size     = 5
      buffering_interval = 300
      compression_format = "GZIP"

      cloudwatch_logging_options {
        enabled         = true
        log_group_name  = aws_cloudwatch_log_group.firehose.name
        log_stream_name = "S3Delivery"
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-logs-firehose-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/payment-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "firehose-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Subscription Filter
resource "aws_cloudwatch_log_subscription_filter" "application_to_onprem" {
  name            = "application-to-onprem-${var.environment_suffix}"
  log_group_name  = aws_cloudwatch_log_group.ecs_payment.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

resource "aws_cloudwatch_log_subscription_filter" "infrastructure_to_onprem" {
  name            = "infrastructure-to-onprem-${var.environment_suffix}"
  log_group_name  = aws_cloudwatch_log_group.infrastructure.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors ALB 5xx errors"

  dimensions = {
    LoadBalancer = aws_lb.payment.arn_suffix
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-5xx-alarm-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "aurora-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora CPU utilization"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.payment.cluster_identifier
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cpu-alarm-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "ecs-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"

  dimensions = {
    ClusterName = aws_ecs_cluster.payment.name
    ServiceName = aws_ecs_service.payment_blue.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-cpu-alarm-${var.environment_suffix}"
    }
  )
}
```

## ./outputs.tf

```hcl
# Networking Outputs
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

# Database Outputs
output "aurora_cluster_endpoint" {
  description = "Writer endpoint for Aurora cluster"
  value       = aws_rds_cluster.payment.endpoint
  sensitive   = true
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint for Aurora cluster"
  value       = aws_rds_cluster.payment.reader_endpoint
  sensitive   = true
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.payment.cluster_identifier
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.payment.database_name
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.payment.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.payment.arn
}

output "blue_target_group_arn" {
  description = "ARN of blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of green target group"
  value       = aws_lb_target_group.green.arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.payment.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.payment.arn
}

output "ecs_blue_service_name" {
  description = "Name of blue ECS service"
  value       = aws_ecs_service.payment_blue.name
}

output "ecs_green_service_name" {
  description = "Name of green ECS service"
  value       = aws_ecs_service.payment_green.name
}

# DMS Outputs
output "dms_replication_instance_arn" {
  description = "ARN of DMS replication instance"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_replication_task_arn" {
  description = "ARN of DMS replication task"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "dms_source_endpoint_arn" {
  description = "ARN of DMS source endpoint"
  value       = aws_dms_endpoint.source.endpoint_arn
}

output "dms_target_endpoint_arn" {
  description = "ARN of DMS target endpoint"
  value       = aws_dms_endpoint.target.endpoint_arn
}

# Route 53 Outputs
output "private_hosted_zone_id" {
  description = "ID of Route 53 private hosted zone"
  value       = aws_route53_zone.private.zone_id
}

output "private_hosted_zone_name" {
  description = "Name of Route 53 private hosted zone"
  value       = aws_route53_zone.private.name
}

# Migration Status Outputs
output "migration_phase" {
  description = "Current migration phase"
  value       = var.migration_phase
}

output "traffic_distribution" {
  description = "Current traffic distribution between blue and green"
  value = {
    blue_weight  = var.blue_target_weight
    green_weight = var.green_target_weight
  }
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = local.environment
}

# S3 Bucket Outputs
output "alb_logs_bucket" {
  description = "S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "logs_backup_bucket" {
  description = "S3 bucket for log backups"
  value       = aws_s3_bucket.logs_backup.bucket
}

# CloudWatch Outputs
output "ecs_log_group" {
  description = "CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs_payment.name
}

output "dms_log_group" {
  description = "CloudWatch log group for DMS"
  value       = aws_cloudwatch_log_group.dms.name
}

# Connection Information
output "connection_info" {
  description = "Connection information for migration"
  value = {
    alb_endpoint = "https://${aws_lb.payment.dns_name}"
    internal_api = "https://api.payment.internal"
    db_writer    = "db-writer.payment.internal"
    db_reader    = "db-reader.payment.internal"
  }
}
```

## ./dms-table-mappings.json

```json
{
  "rules": [
    {
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "include-all-tables",
      "object-locator": {
        "schema-name": "paymentdb",
        "table-name": "%"
      },
      "rule-action": "include"
    },
    {
      "rule-type": "transformation",
      "rule-id": "2",
      "rule-name": "add-prefix-to-tables",
      "rule-target": "table",
      "object-locator": {
        "schema-name": "paymentdb",
        "table-name": "%"
      },
      "rule-action": "add-prefix",
      "value": "migrated_"
    }
  ]
}
```

## ./dms-task-settings.json

```json
{
  "TargetMetadata": {
    "TargetSchema": "paymentdb",
    "SupportLobs": true,
    "FullLobMode": false,
    "LobChunkSize": 64,
    "LimitedSizeLobMode": true,
    "LobMaxSize": 32,
    "InlineLobMaxSize": 0,
    "LoadMaxFileSize": 0,
    "ParallelLoadThreads": 4,
    "ParallelLoadBufferSize": 50,
    "BatchApplyEnabled": true,
    "TaskRecoveryTableEnabled": true
  },
  "FullLoadSettings": {
    "TargetTablePrepMode": "DROP_AND_CREATE",
    "CreatePkAfterFullLoad": false,
    "StopTaskCachedChangesApplied": false,
    "StopTaskCachedChangesNotApplied": false,
    "MaxFullLoadSubTasks": 8,
    "TransactionConsistencyTimeout": 600,
    "CommitRate": 10000
  },
  "Logging": {
    "EnableLogging": true,
    "LogComponents": [
      {
        "Id": "TRANSFORMATION",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "SOURCE_UNLOAD",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TARGET_LOAD",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "SOURCE_CAPTURE",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TARGET_APPLY",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TASK_MANAGER",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      }
    ]
  },
  "ControlTablesSettings": {
    "ControlSchema": "dms_control",
    "HistoryTimeslotInMinutes": 5,
    "HistoryTableEnabled": true,
    "SuspendedTablesTableEnabled": true,
    "StatusTableEnabled": true,
    "FullLoadExceptionTableEnabled": true
  },
  "StreamBufferSettings": {
    "StreamBufferCount": 3,
    "StreamBufferSizeInMB": 8,
    "CtrlStreamBufferSizeInMB": 5
  },
  "ChangeProcessingDdlHandlingPolicy": {
    "HandleSourceTableDropped": true,
    "HandleSourceTableTruncated": true,
    "HandleSourceTableAltered": true
  },
  "ChangeProcessingTuning": {
    "BatchApplyPreserveTransaction": true,
    "BatchApplyTimeoutMin": 1,
    "BatchApplyTimeoutMax": 30,
    "BatchApplyMemoryLimit": 500,
    "BatchSplitSize": 0,
    "MinTransactionSize": 1000,
    "CommitTimeout": 1,
    "MemoryLimitTotal": 1024,
    "MemoryKeepTime": 60,
    "StatementCacheSize": 50
  },
  "ValidationSettings": {
    "EnableValidation": true,
    "ValidationMode": "ROW_LEVEL",
    "ThreadCount": 5,
    "FailureMaxCount": 10000,
    "RecordFailureDelayInMinutes": 5,
    "RecordSuspendDelayInMinutes": 30,
    "MaxKeyColumnSize": 8096,
    "TableFailureMaxCount": 1000,
    "ValidationOnly": false,
    "HandleCollationDiff": false,
    "RecordFailureDelayLimitInMinutes": 0,
    "SkipLobColumns": false,
    "ValidationPartialLobSize": 0,
    "ValidationQueryCdcDelaySeconds": 180
  }
}
```
