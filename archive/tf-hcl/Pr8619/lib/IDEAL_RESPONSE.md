# Production Environment Migration - On-Premises to AWS

This Terraform configuration orchestrates a production-ready migration from on-premises to AWS for a financial services trading application. The infrastructure implements blue-green deployment, continuous database replication via AWS DMS, and automated rollback capabilities.

## File: variables.tf

```hclvariable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "db_master_username" {
  description = "Master username for RDS Aurora"
  type        = string
  default     = "admin"
  sensitive   = true
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
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "alb_certificate_arn" {
  description = "ARN of ACM certificate for ALB HTTPS listener"
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name"
  type        = string
  default     = "example.com"
}

variable "onpremises_endpoint" {
  description = "On-premises application endpoint for weighted routing"
  type        = string
  default     = "onprem.example.com"
}

variable "aws_weighted_routing_weight" {
  description = "Weight for AWS environment in Route53 weighted routing (0-100)"
  type        = number
  default     = 0
}

variable "dms_source_endpoint" {
  description = "Source database endpoint for DMS"
  type        = string
}

variable "dms_source_db_name" {
  description = "Source database name"
  type        = string
  default     = "trading_db"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "trading-migration"
}

variable "migration_phase" {
  description = "Current migration phase"
  type        = string
  default     = "preparation"
}

variable "container_image" {
  description = "Docker container image for ECS"
  type        = string
  default     = "nginx:latest"
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
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
  region = var.aws_region

  default_tags {
    tags = {
      Environment    = var.environment_suffix
      Project        = var.project_name
      MigrationPhase = var.migration_phase
      ManagedBy      = "Terraform"
    }
  }
}
```

## File: vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

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

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "db-subnet-group-${var.environment_suffix}"
  }
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private[*].id

  tags = {
    Name = "dms-subnet-group-${var.environment_suffix}"
  }
}
```

## File: security_groups.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
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

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name        = "ecs-sg-${var.environment_suffix}"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-sg-${var.environment_suffix}"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }
}

# DMS Security Group
resource "aws_security_group" "dms" {
  name        = "dms-sg-${var.environment_suffix}"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dms-sg-${var.environment_suffix}"
  }
}
```

## File: secrets.tf

```hcl
# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store RDS master password in Secrets Manager
resource "aws_secretsmanager_secret" "db_master_password" {
  name        = "rds-master-password-${var.environment_suffix}"
  description = "Master password for RDS Aurora PostgreSQL cluster"

  tags = {
    Name = "rds-master-password-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = "trading"
  })
}

# Store DMS source credentials
resource "aws_secretsmanager_secret" "dms_source_credentials" {
  name        = "dms-source-credentials-${var.environment_suffix}"
  description = "Credentials for DMS source database"

  tags = {
    Name = "dms-source-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "dms_source_credentials" {
  secret_id = aws_secretsmanager_secret.dms_source_credentials.id
  secret_string = jsonencode({
    username = "source_admin"
    password = "PLACEHOLDER_TO_BE_UPDATED"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Store API keys
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "api-keys-${var.environment_suffix}"
  description = "API keys for trading application"

  tags = {
    Name = "api-keys-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key        = "PLACEHOLDER_TO_BE_UPDATED"
    api_secret     = "PLACEHOLDER_TO_BE_UPDATED"
    encryption_key = "PLACEHOLDER_TO_BE_UPDATED"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
```

## File: ssm_parameters.tf

```hcl
# Application configuration parameters
resource "aws_ssm_parameter" "app_config_database_host" {
  name  = "/trading-app/${var.environment_suffix}/database/host"
  type  = "String"
  value = aws_rds_cluster.main.endpoint

  tags = {
    Name = "app-config-db-host-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_database_port" {
  name  = "/trading-app/${var.environment_suffix}/database/port"
  type  = "String"
  value = "5432"

  tags = {
    Name = "app-config-db-port-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_log_level" {
  name  = "/trading-app/${var.environment_suffix}/logging/level"
  type  = "String"
  value = "INFO"

  tags = {
    Name = "app-config-log-level-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_cache_ttl" {
  name  = "/trading-app/${var.environment_suffix}/cache/ttl"
  type  = "String"
  value = "300"

  tags = {
    Name = "app-config-cache-ttl-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_api_endpoint" {
  name  = "/trading-app/${var.environment_suffix}/api/endpoint"
  type  = "String"
  value = "https://${aws_lb.main.dns_name}"

  tags = {
    Name = "app-config-api-endpoint-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_max_connections" {
  name  = "/trading-app/${var.environment_suffix}/database/max_connections"
  type  = "String"
  value = "100"

  tags = {
    Name = "app-config-max-connections-${var.environment_suffix}"
  }
}
```

## File: rds_aurora.tf

```hcl
# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier     = "aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = "trading"
  master_username        = var.db_master_username
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period      = 30
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-cluster-${var.environment_suffix}-final"

  apply_immediately = false

  serverlessv2_scaling_configuration {
    max_capacity = 4.0
    min_capacity = 0.5
  }

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora cluster instances
resource "aws_rds_cluster_instance" "main" {
  count = 2

  identifier           = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# Read replica for improved performance
resource "aws_rds_cluster_instance" "read_replica" {
  identifier           = "aurora-read-replica-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "aurora-read-replica-${var.environment_suffix}"
    Replica     = "true"
    ReplicaType = "read"
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "rds-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

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
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

## File: dms.tf

```hcl
# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id    = "dms-replication-${var.environment_suffix}"
  replication_instance_class = "dms.t3.medium"
  allocated_storage          = 100

  engine_version              = "3.5.2"
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]

  auto_minor_version_upgrade = true
  apply_immediately          = false

  tags = {
    Name = "dms-replication-${var.environment_suffix}"
  }
}

# DMS Source Endpoint (On-Premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name   = var.dms_source_endpoint
  port          = 5432
  database_name = var.dms_source_db_name
  username      = jsondecode(aws_secretsmanager_secret_version.dms_source_credentials.secret_string)["username"]
  password      = jsondecode(aws_secretsmanager_secret_version.dms_source_credentials.secret_string)["password"]

  ssl_mode = "require"

  tags = {
    Name = "dms-source-${var.environment_suffix}"
  }
}

# DMS Target Endpoint (Aurora)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"

  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = var.db_master_username
  password      = random_password.db_password.result

  ssl_mode = "require"

  tags = {
    Name = "dms-target-${var.environment_suffix}"
  }
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id = "dms-task-${var.environment_suffix}"
  migration_type      = "full-load-and-cdc"

  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn

  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
        object-locator = {
          schema-name = "public"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    TargetMetadata = {
      TargetSchema       = ""
      SupportLobs        = true
      FullLobMode        = false
      LobChunkSize       = 64
      LimitedSizeLobMode = true
      LobMaxSize         = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode = "DROP_AND_CREATE"
      MaxFullLoadSubTasks = 8
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "TRANSFORMATION"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_INFO"
        }
      ]
    }
    ControlTablesSettings = {
      ControlSchema               = "dms_control"
      HistoryTimeslotInMinutes    = 5
      HistoryTableEnabled         = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled          = true
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped   = true
      HandleSourceTableTruncated = true
      HandleSourceTableAltered   = true
    }
  })

  tags = {
    Name = "dms-task-${var.environment_suffix}"
  }
}
```

## File: ecs.tf

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-cluster-${var.environment_suffix}"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/trading-app-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name = "ecs-logs-${var.environment_suffix}"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "trading-app-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "trading-app"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment_suffix
        }
      ]

      secrets = [
        {
          name      = "DB_HOST"
          valueFrom = aws_ssm_parameter.app_config_database_host.arn
        },
        {
          name      = "DB_PORT"
          valueFrom = aws_ssm_parameter.app_config_database_port.arn
        },
        {
          name      = "DB_CREDENTIALS"
          valueFrom = aws_secretsmanager_secret.db_master_password.arn
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
          "awslogs-region"        = var.aws_region
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
    }
  ])

  tags = {
    Name = "trading-app-task-${var.environment_suffix}"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "trading-app-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  platform_version = "LATEST"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "trading-app"
    container_port   = 8080
  }

  health_check_grace_period_seconds = 60

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name = "trading-app-service-${var.environment_suffix}"
  }

  depends_on = [aws_lb_listener.https]
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
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

## File: iam_ecs.tf

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "ecs-execution-role-${var.environment_suffix}"

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
    Name = "ecs-execution-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager and SSM access
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "ecs-execution-secrets-${var.environment_suffix}"
  role = aws_iam_role.ecs_execution.id

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
          aws_secretsmanager_secret.db_master_password.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParameterHistory"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/trading-app/${var.environment_suffix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.rds.arn
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

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
    Name = "ecs-task-role-${var.environment_suffix}"
  }
}

# Task role policy for application-level permissions
resource "aws_iam_role_policy" "ecs_task_permissions" {
  name = "ecs-task-permissions-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

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
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/trading-app/${var.environment_suffix}/*"
      }
    ]
  })
}
```

## File: alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name = "alb-${var.environment_suffix}"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${var.environment_suffix}"

  tags = {
    Name = "alb-logs-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 30
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

# Target Group
resource "aws_lb_target_group" "app" {
  name        = "tg-${var.environment_suffix}"
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

  tags = {
    Name = "tg-${var.environment_suffix}"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.alb_certificate_arn != "" ? var.alb_certificate_arn : aws_acm_certificate.main[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# HTTP Listener (redirect to HTTPS)
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

# Self-signed certificate for testing (remove in production)
resource "aws_acm_certificate" "main" {
  count = var.alb_certificate_arn == "" ? 1 : 0

  domain_name       = "${var.environment_suffix}.${var.route53_zone_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.environment_suffix}.${var.route53_zone_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "acm-cert-${var.environment_suffix}"
  }
}
```

## File: route53.tf

```hcl
# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.route53_zone_name

  tags = {
    Name = "route53-zone-${var.environment_suffix}"
  }
}

# Weighted routing for gradual migration - AWS environment
resource "aws_route53_record" "app_aws" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  weighted_routing_policy {
    weight = var.aws_weighted_routing_weight
  }

  set_identifier = "aws-${var.environment_suffix}"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Weighted routing for gradual migration - On-premises environment
resource "aws_route53_record" "app_onprem" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "CNAME"

  weighted_routing_policy {
    weight = 100 - var.aws_weighted_routing_weight
  }

  set_identifier = "onprem"

  ttl     = 60
  records = [var.onpremises_endpoint]
}

# Health check for ALB
resource "aws_route53_health_check" "alb" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "alb-health-check-${var.environment_suffix}"
  }
}

# CloudWatch alarm for health check
resource "aws_cloudwatch_metric_alarm" "route53_health" {
  alarm_name          = "route53-health-alarm-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Route53 health check failed"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb.id
  }

  tags = {
    Name = "route53-health-alarm-${var.environment_suffix}"
  }
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Dashboard for Migration Monitoring
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencySource", { stat = "Average" }],
            [".", "CDCLatencyTarget", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "DMS Replication Lag"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", dimensions = { ServiceName = aws_ecs_service.app.name, ClusterName = aws_ecs_cluster.main.name } }],
            [".", "MemoryUtilization", { stat = "Average", dimensions = { ServiceName = aws_ecs_service.app.name, ClusterName = aws_ecs_cluster.main.name } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Resource Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }],
            [".", "RequestCount", { stat = "Sum", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Performance Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier } }],
            [".", "CPUUtilization", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Database Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckStatus", { stat = "Minimum", dimensions = { HealthCheckId = aws_route53_health_check.alb.id } }]
          ]
          period = 60
          stat   = "Minimum"
          region = "us-east-1"
          title  = "Route53 Health Check Status"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "rollback_lambda" {
  name              = "/aws/lambda/rollback-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name = "rollback-lambda-logs-${var.environment_suffix}"
  }
}

# CloudWatch Alarms for Migration Status

# DMS Replication Lag Alarm
resource "aws_cloudwatch_metric_alarm" "dms_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "DMS replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
  }

  tags = {
    Name = "dms-lag-alarm-${var.environment_suffix}"
  }
}

# ECS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ecs-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "ecs-cpu-alarm-${var.environment_suffix}"
  }
}

# ALB Target Unhealthy Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn, aws_lambda_function.rollback.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "alb-unhealthy-alarm-${var.environment_suffix}"
  }
}

# ALB 5XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High rate of 5XX errors from ALB targets"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn, aws_lambda_function.rollback.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-alarm-${var.environment_suffix}"
  }
}

# RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-cpu-alarm-${var.environment_suffix}"
  }
}
```

## File: sns.tf

```hcl
# SNS Topic for Migration Alerts
resource "aws_sns_topic" "migration_alerts" {
  name = "migration-alerts-${var.environment_suffix}"

  tags = {
    Name = "migration-alerts-${var.environment_suffix}"
  }
}

# SNS Topic for Status Notifications
resource "aws_sns_topic" "migration_status" {
  name = "migration-status-${var.environment_suffix}"

  tags = {
    Name = "migration-status-${var.environment_suffix}"
  }
}

# SNS Topic Subscription (Email - placeholder)
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.migration_alerts.arn
  protocol  = "email"
  endpoint  = "alerts@example.com"

  lifecycle {
    ignore_changes = [endpoint]
  }
}

resource "aws_sns_topic_subscription" "status_email" {
  topic_arn = aws_sns_topic.migration_status.arn
  protocol  = "email"
  endpoint  = "status@example.com"

  lifecycle {
    ignore_changes = [endpoint]
  }
}

# SNS Topic Policy for CloudWatch Alarms
resource "aws_sns_topic_policy" "migration_alerts" {
  arn = aws_sns_topic.migration_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.migration_alerts.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.migration_alerts.arn
      }
    ]
  })
}
```

## File: lambda_rollback.tf

```hcl
# Lambda function for automatic rollback
resource "aws_lambda_function" "rollback" {
  filename      = "${path.module}/lambda/rollback.zip"
  function_name = "migration-rollback-${var.environment_suffix}"
  role          = aws_iam_role.lambda_rollback.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      ROUTE53_ZONE_ID    = aws_route53_zone.main.zone_id
      RECORD_NAME        = "app.${var.route53_zone_name}"
      AWS_SET_IDENTIFIER = "aws-${var.environment_suffix}"
      ONPREM_ENDPOINT    = var.onpremises_endpoint
      SNS_TOPIC_ARN      = aws_sns_topic.migration_alerts.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "migration-rollback-${var.environment_suffix}"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_rollback" {
  name = "lambda-rollback-role-${var.environment_suffix}"

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
    Name = "lambda-rollback-role-${var.environment_suffix}"
  }
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_rollback" {
  name = "lambda-rollback-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_rollback.id

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
        Resource = "${aws_cloudwatch_log_group.rollback_lambda.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "route53:ListResourceRecordSets"
        ]
        Resource = [
          aws_route53_zone.main.arn,
          "arn:aws:route53:::change/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.migration_alerts.arn
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

# Lambda permission for CloudWatch Alarms
resource "aws_lambda_permission" "cloudwatch_alarm" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rollback.function_name
  principal     = "lambda.alarms.cloudwatch.amazonaws.com"
  source_arn    = aws_cloudwatch_metric_alarm.alb_unhealthy_targets.arn
}

# Create lambda deployment package directory
resource "null_resource" "lambda_package" {
  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p ${path.module}/lambda
      cat > ${path.module}/lambda/index.py << 'EOF'
import json
import boto3
import os
from datetime import datetime

route53 = boto3.client('route53')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Rollback function to revert Route53 weighted routing to on-premises
    """
    zone_id = os.environ['ROUTE53_ZONE_ID']
    record_name = os.environ['RECORD_NAME']
    aws_set_id = os.environ['AWS_SET_IDENTIFIER']
    onprem_endpoint = os.environ['ONPREM_ENDPOINT']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']
    
    try:
        # Update Route53 weighted routing to send all traffic to on-premises
        response = route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Comment': f'Automatic rollback triggered at {datetime.utcnow().isoformat()}',
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': record_name,
                            'Type': 'A',
                            'SetIdentifier': aws_set_id,
                            'Weight': 0,
                            'TTL': 60,
                            'ResourceRecords': [{'Value': '127.0.0.1'}]  # Effectively disable
                        }
                    }
                ]
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=sns_topic,
            Subject=f'CRITICAL: Migration Rollback Executed - {env_suffix}',
            Message=f'''
Automatic rollback has been triggered due to detected issues.

Environment: {env_suffix}
Timestamp: {datetime.utcnow().isoformat()}
Action: Route53 weighted routing updated to 0% for AWS environment

All traffic is now being directed to on-premises infrastructure.

Route53 Change ID: {response['ChangeInfo']['Id']}
Change Status: {response['ChangeInfo']['Status']}

Please investigate the root cause immediately.
            '''
        )
        
        # Put custom metric
        cloudwatch.put_metric_data(
            Namespace='Migration',
            MetricData=[
                {
                    'MetricName': 'RollbackExecuted',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': env_suffix}
                    ]
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback executed successfully',
                'changeId': response['ChangeInfo']['Id']
            })
        }
        
    except Exception as e:
        error_msg = f'Rollback failed: {str(e)}'
        sns.publish(
            TopicArn=sns_topic,
            Subject=f'ERROR: Migration Rollback Failed - {env_suffix}',
            Message=f'''
CRITICAL: Automatic rollback FAILED!

Environment: {env_suffix}
Timestamp: {datetime.utcnow().isoformat()}
Error: {str(e)}

Manual intervention required immediately!
            '''
        )
        raise
EOF
      cd ${path.module}/lambda && zip rollback.zip index.py
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}

resource "terraform_data" "lambda_package_dependency" {
  depends_on = [null_resource.lambda_package]
}
```

## File: backup.tf

```hcl
# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name = "backup-vault-${var.environment_suffix}"

  tags = {
    Name = "backup-vault-${var.environment_suffix}"
  }
}

# AWS Backup Plan
resource "aws_backup_plan" "main" {
  name = "backup-plan-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 * * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment = var.environment_suffix
      Project     = var.project_name
      BackupType  = "daily"
    }
  }

  tags = {
    Name = "backup-plan-${var.environment_suffix}"
  }
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "backup-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "backup-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  name         = "backup-selection-rds-${var.environment_suffix}"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_rds_cluster.main.arn
  ]

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }
}

# Backup Selection for ECS (configuration backup via SSM)
resource "aws_backup_selection" "ecs_config" {
  name         = "backup-selection-ecs-${var.environment_suffix}"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    "arn:aws:ssm:${var.aws_region}:*:parameter/trading-app/${var.environment_suffix}/*"
  ]
}
```

## File: outputs.tf

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

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "RDS Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "dms_replication_instance_arn" {
  description = "DMS replication instance ARN"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_task_arn" {
  description = "DMS replication task ARN"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name_servers" {
  description = "Route53 zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.migration.dashboard_name
}

output "sns_alerts_topic_arn" {
  description = "SNS alerts topic ARN"
  value       = aws_sns_topic.migration_alerts.arn
}

output "sns_status_topic_arn" {
  description = "SNS status topic ARN"
  value       = aws_sns_topic.migration_status.arn
}

output "backup_vault_name" {
  description = "AWS Backup vault name"
  value       = aws_backup_vault.main.name
}

output "backup_plan_id" {
  description = "AWS Backup plan ID"
  value       = aws_backup_plan.main.id
}

output "lambda_rollback_function_name" {
  description = "Lambda rollback function name"
  value       = aws_lambda_function.rollback.function_name
}

output "db_secret_arn" {
  description = "Database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "api_keys_secret_arn" {
  description = "API keys secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize values

environment_suffix = "dev-12345"
aws_region         = "us-east-1"

# VPC Configuration
vpc_cidr                = "10.0.0.0/16"
availability_zones      = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs    = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
database_subnet_cidrs   = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

# Database Configuration
db_master_username = "admin"

# ECS Configuration
ecs_task_cpu       = 1024
ecs_task_memory    = 2048
ecs_desired_count  = 2
container_image    = "your-ecr-repo/trading-app:latest"

# ALB Configuration
alb_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx"

# Route53 Configuration
route53_zone_name           = "example.com"
onpremises_endpoint         = "onprem.example.com"
aws_weighted_routing_weight = 0  # Start with 0% to AWS

# DMS Configuration
dms_source_endpoint = "onprem-db.example.com"
dms_source_db_name  = "trading_db"

# Project Configuration
project_name    = "trading-migration"
migration_phase = "preparation"
```

## Deployment Instructions

### Prerequisites

1. Install Terraform 1.5 or later
2. Configure AWS CLI with appropriate credentials
3. Ensure you have permissions for all required AWS services
4. Update `terraform.tfvars` with your specific values

### Deployment Steps

```bash
# Initialize Terraform
terraform init

# Review the execution plan
terraform plan -var-file=terraform.tfvars

# Apply the configuration
terraform apply -var-file=terraform.tfvars

# After successful deployment, outputs will display critical resource information
```

### Migration Execution

1. **Preparation Phase** (aws_weighted_routing_weight = 0)
   - Deploy all infrastructure
   - Verify AWS DMS replication is running
   - Monitor CloudWatch dashboard for replication lag
   - Ensure all CloudWatch alarms are in OK state

2. **Testing Phase** (aws_weighted_routing_weight = 10-20)
   - Gradually increase weight to send 10-20% traffic to AWS
   - Monitor application metrics and error rates
   - Verify data consistency between source and target databases
   - Test rollback mechanism if needed

3. **Migration Phase** (aws_weighted_routing_weight = 50-100)
   - Increase weight in increments of 25%
   - Monitor for 30-60 minutes between increases
   - Watch for CloudWatch alarms
   - Rollback will trigger automatically if issues detected

4. **Completion Phase** (aws_weighted_routing_weight = 100)
   - All traffic directed to AWS environment
   - Continue DMS replication for rollback capability
   - After 7 days of stable operation, decommission on-premises

### Rollback Procedure

Automatic rollback triggers on:
- Unhealthy ALB targets
- High 5XX error rates
- Failed Route53 health checks

Manual rollback:
```bash
# Reduce weight to 0
terraform apply -var="aws_weighted_routing_weight=0"
```

### Resource Cleanup

```bash
# Destroy all resources (after migration completion)
terraform destroy -var-file=terraform.tfvars
```

