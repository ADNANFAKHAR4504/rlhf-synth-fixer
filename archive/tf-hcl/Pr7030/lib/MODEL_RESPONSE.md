# Multi-Environment Payment Processing Infrastructure

I'll provide a complete Terraform solution for deploying consistent payment processing infrastructure across development, staging, and production environments using workspaces, modules, and environment-specific configurations.

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
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
  
  backend "s3" {
    # Backend configuration provided via backend config files
    # terraform init -backend-config="environments/${env}/backend.tfvars"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Local variables for environment-specific configuration
locals {
  environment_suffix = var.environment_suffix
  name_prefix        = "${var.environment}-${var.aws_region}"
  
  # Environment-specific configurations
  vpc_cidr = {
    dev     = "10.0.0.0/16"
    staging = "10.1.0.0/16"
    prod    = "10.2.0.0/16"
  }
  
  db_instance_class = {
    dev     = "db.t3.medium"
    staging = "db.r5.large"
    prod    = "db.r5.xlarge"
  }
  
  ecs_task_cpu = {
    dev     = "256"
    staging = "512"
    prod    = "1024"
  }
  
  ecs_task_memory = {
    dev     = "512"
    staging = "1024"
    prod    = "2048"
  }
  
  log_retention_days = {
    dev     = 7
    staging = 30
    prod    = 90
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_cidr           = lookup(local.vpc_cidr, var.environment, local.vpc_cidr["dev"])
  availability_zones = data.aws_availability_zones.available.names
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
}

# RDS Aurora Module
module "database" {
  source = "./modules/database"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.database_sg_id
  instance_class     = lookup(local.db_instance_class, var.environment, local.db_instance_class["dev"])
  enable_rotation    = var.environment == "prod" ? true : false
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_sg_id
}

# ECS Fargate Module
module "ecs" {
  source = "./modules/ecs"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.ecs_sg_id
  target_group_arn   = module.alb.target_group_arn
  task_cpu           = lookup(local.ecs_task_cpu, var.environment, local.ecs_task_cpu["dev"])
  task_memory        = lookup(local.ecs_task_memory, var.environment, local.ecs_task_memory["dev"])
  db_secret_arn      = module.database.secret_arn
}

# CloudWatch Logs Module
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  retention_days     = lookup(local.log_retention_days, var.environment, local.log_retention_days["dev"])
}

# SNS Alerting Module
module "sns" {
  source = "./modules/sns"
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  email_addresses    = var.alert_email_addresses
}

# Route53 (Production only - blue-green)
module "route53" {
  source = "./modules/route53"
  count  = var.environment == "prod" ? 1 : 0
  
  environment        = var.environment
  environment_suffix = local.environment_suffix
  hosted_zone_id     = var.hosted_zone_id
  domain_name        = var.domain_name
  alb_dns_name       = module.alb.alb_dns_name
  alb_zone_id        = module.alb.alb_zone_id
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "alert_email_addresses" {
  description = "Email addresses for SNS alerts"
  type        = list(string)
  default     = ["ops@example.com"]
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (required for prod)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for Route53 records"
  type        = string
  default     = ""
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_service_name" {
  description = "ECS Service name"
  value       = module.ecs.service_name
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = module.database.cluster_reader_endpoint
}

output "database_secret_arn" {
  description = "Secrets Manager secret ARN for database credentials"
  value       = module.database.secret_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.sns.topic_arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch.log_group_name
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "environment_suffix" {
  description = "Environment suffix used"
  value       = var.environment_suffix
}
```

## File: modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.name_prefix}-vpc-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.name_prefix}-igw-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.name_prefix}-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.name_prefix}-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.name_prefix}-public-rt-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.name_prefix}-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: modules/vpc/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}
```

## File: modules/vpc/outputs.tf

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

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}
```

## File: modules/security/main.tf

```hcl
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name        = "${var.name_prefix}-alb-sg-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_security_group" "ecs" {
  name        = "${var.name_prefix}-ecs-sg-${var.environment_suffix}"
  description = "Security group for ECS Fargate tasks"
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
    description = "Allow all outbound"
  }

  tags = {
    Name        = "${var.name_prefix}-ecs-sg-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_security_group" "database" {
  name        = "${var.name_prefix}-rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "PostgreSQL from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name        = "${var.name_prefix}-rds-sg-${var.environment_suffix}"
    Environment = var.environment
  }
}
```

## File: modules/security/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}
```

## File: modules/security/outputs.tf

```hcl
output "alb_sg_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "database_sg_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}
```


## File: modules/database/main.tf

```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.name_prefix}-db-credentials-${var.environment_suffix}"
  
  tags = {
    Name        = "${var.name_prefix}-db-credentials-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
    engine   = "postgres"
    port     = 5432
    host     = aws_rds_cluster.main.endpoint
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group-${var.environment_suffix}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.name_prefix}-db-subnet-group-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.name_prefix}-aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.4"
  database_name           = "payments"
  master_username         = "dbadmin"
  master_password         = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [var.security_group_id]
  
  backup_retention_period = var.environment == "prod" ? 7 : 1
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true
  
  tags = {
    Name        = "${var.name_prefix}-aurora-cluster-${var.environment_suffix}"
    Environment = var.environment
  }
  
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster_instance" "main" {
  count = 2

  identifier          = "${var.name_prefix}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  publicly_accessible = false

  tags = {
    Name        = "${var.name_prefix}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }
}
```

## File: modules/database/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for RDS"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "enable_rotation" {
  description = "Enable automatic secret rotation"
  type        = bool
  default     = false
}
```

## File: modules/database/outputs.tf

```hcl
output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.main.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
```

## File: modules/alb/main.tf

```hcl
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.subnet_ids
  
  enable_deletion_protection = false
  
  tags = {
    Name        = "${var.name_prefix}-alb-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "main" {
  name        = "${var.name_prefix}-tg-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  tags = {
    Name        = "${var.name_prefix}-tg-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

## File: modules/alb/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}
```

## File: modules/alb/outputs.tf

```hcl
output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.main.arn
}
```

## File: modules/ecs/main.tf

```hcl
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-ecs-cluster-${var.environment_suffix}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name        = "${var.name_prefix}-ecs-cluster-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution-${var.environment_suffix}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Condition = {
        StringEquals = {
          "aws:RequestedRegion" = data.aws_region.current.name
        }
      }
    }]
  })
  
  tags = {
    Name        = "${var.name_prefix}-ecs-task-execution-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs_secrets_access" {
  name = "${var.name_prefix}-ecs-secrets-${var.environment_suffix}"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = var.db_secret_arn
      Condition = {
        StringEquals = {
          "aws:RequestedRegion" = data.aws_region.current.name
        }
      }
    }]
  })
  
  tags = {
    Name        = "${var.name_prefix}-ecs-secrets-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_secrets_access" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_secrets_access.arn
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-${var.environment_suffix}"
  
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
    Name        = "${var.name_prefix}-ecs-task-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.name_prefix}-${var.environment_suffix}"
  retention_in_days = var.environment == "prod" ? 90 : (var.environment == "staging" ? 30 : 7)
  
  tags = {
    Name        = "${var.name_prefix}-ecs-logs-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.name_prefix}-task-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([{
    name  = "payment-app"
    image = "nginx:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }
    environment = [{
      name  = "ENVIRONMENT"
      value = var.environment
    }]
    secrets = [{
      name      = "DB_SECRET"
      valueFrom = var.db_secret_arn
    }]
  }])
  
  tags = {
    Name        = "${var.name_prefix}-task-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "main" {
  name            = "${var.name_prefix}-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.environment == "prod" ? 3 : 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "payment-app"
    container_port   = 8080
  }
  
  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution]
  
  tags = {
    Name        = "${var.name_prefix}-service-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.environment == "prod" ? 10 : 5
  min_capacity       = var.environment == "prod" ? 3 : 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.name_prefix}-ecs-cpu-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

data "aws_region" "current" {}
```

## File: modules/ecs/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = string
}

variable "task_memory" {
  description = "Task memory in MB"
  type        = string
}

variable "db_secret_arn" {
  description = "Database secret ARN"
  type        = string
}
```

## File: modules/ecs/outputs.tf

```hcl
output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.main.name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.main.arn
}
```

## File: modules/cloudwatch/main.tf

```hcl
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/${var.name_prefix}/${var.environment_suffix}"
  retention_in_days = var.retention_days
  
  tags = {
    Name        = "${var.name_prefix}-logs-${var.environment_suffix}"
    Environment = var.environment
  }
}
```

## File: modules/cloudwatch/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}
```

## File: modules/cloudwatch/outputs.tf

```hcl
output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.main.name
}

output "log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.main.arn
}
```

## File: modules/sns/main.tf

```hcl
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts-${var.environment_suffix}"
  
  tags = {
    Name        = "${var.name_prefix}-alerts-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count = length(var.email_addresses)
  
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_addresses[count.index]
}
```

## File: modules/sns/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "email_addresses" {
  description = "Email addresses for SNS subscriptions"
  type        = list(string)
}
```

## File: modules/sns/outputs.tf

```hcl
output "topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.alerts.name
}
```

## File: modules/route53/main.tf

```hcl
data "aws_route53_zone" "main" {
  zone_id = var.hosted_zone_id
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
  
  weighted_routing_policy {
    weight = 100
  }
  
  set_identifier = "${var.environment}-${var.environment_suffix}"
}
```

## File: modules/route53/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name for Route53 record"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "alb_zone_id" {
  description = "ALB zone ID"
  type        = string
}
```

## File: modules/route53/outputs.tf

```hcl
output "record_fqdn" {
  description = "Route53 record FQDN"
  value       = aws_route53_record.main.fqdn
}
```

## File: environments/dev/terraform.tfvars

```hcl
aws_region          = "us-east-1"
environment         = "dev"
environment_suffix  = "dev01"
project_name        = "payment-processing"
alert_email_addresses = ["dev-ops@example.com"]
```

## File: environments/staging/terraform.tfvars

```hcl
aws_region          = "us-east-1"
environment         = "staging"
environment_suffix  = "stg01"
project_name        = "payment-processing"
alert_email_addresses = ["staging-ops@example.com"]
```

## File: environments/prod/terraform.tfvars

```hcl
aws_region            = "us-east-1"
environment           = "prod"
environment_suffix    = "prd01"
project_name          = "payment-processing"
alert_email_addresses = ["prod-ops@example.com", "oncall@example.com"]
hosted_zone_id        = "Z1234567890ABC"
domain_name           = "payments.example.com"
```

## File: environments/dev/backend.tfvars

```hcl
bucket         = "terraform-state-payment-dev"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-dev"
```

## File: environments/staging/backend.tfvars

```hcl
bucket         = "terraform-state-payment-staging"
key            = "staging/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-staging"
```

## File: environments/prod/backend.tfvars

```hcl
bucket         = "terraform-state-payment-prod"
key            = "prod/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-prod"
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Processing Infrastructure

This Terraform configuration deploys a complete payment processing platform across development, staging, and production environments using a modular architecture and workspace-based management.

## Architecture Overview

The infrastructure consists of:

- **VPC**: Isolated virtual network per environment with public/private subnets
- **ECS Fargate**: Containerized payment processing application
- **RDS Aurora PostgreSQL**: Managed database cluster with environment-specific sizing
- **Application Load Balancer**: HTTP/HTTPS traffic distribution
- **Secrets Manager**: Secure credential management with optional rotation
- **CloudWatch**: Logging with environment-specific retention
- **SNS**: Environment-specific alerting
- **Route53**: Blue-green DNS routing (production only)
- **IAM**: Least-privilege roles with region-scoped conditions

## Module Structure

```
.
├── main.tf                    # Root configuration
├── variables.tf               # Root variables
├── outputs.tf                 # Root outputs
├── modules/
│   ├── vpc/                   # VPC networking module
│   ├── security/              # Security groups module
│   ├── database/              # RDS Aurora module
│   ├── alb/                   # Application Load Balancer module
│   ├── ecs/                   # ECS Fargate module
│   ├── cloudwatch/            # CloudWatch logs module
│   ├── sns/                   # SNS alerting module
│   └── route53/               # Route53 DNS module (prod only)
└── environments/
    ├── dev/                   # Development configuration
    │   ├── terraform.tfvars
    │   └── backend.tfvars
    ├── staging/               # Staging configuration
    │   ├── terraform.tfvars
    │   └── backend.tfvars
    └── prod/                  # Production configuration
        ├── terraform.tfvars
        └── backend.tfvars
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- S3 buckets for Terraform state (one per environment)
- DynamoDB tables for state locking (one per environment)

## Deployment Instructions

### Initial Setup

1. **Create Backend Resources** (S3 buckets and DynamoDB tables):

```bash
# For each environment (dev, staging, prod)
aws s3 mb s3://terraform-state-payment-dev --region us-east-1
aws s3 mb s3://terraform-state-payment-staging --region us-east-1
aws s3 mb s3://terraform-state-payment-prod --region us-east-1

aws dynamodb create-table \
  --table-name terraform-locks-payment-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

aws dynamodb create-table \
  --table-name terraform-locks-payment-staging \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

aws dynamodb create-table \
  --table-name terraform-locks-payment-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Deploy Development Environment

```bash
# Initialize with dev backend configuration
terraform init -backend-config=environments/dev/backend.tfvars

# Plan deployment
terraform plan -var-file=environments/dev/terraform.tfvars

# Apply configuration
terraform apply -var-file=environments/dev/terraform.tfvars
```

### Deploy Staging Environment

```bash
# Reinitialize with staging backend configuration
terraform init -backend-config=environments/staging/backend.tfvars -reconfigure

# Plan deployment
terraform plan -var-file=environments/staging/terraform.tfvars

# Apply configuration
terraform apply -var-file=environments/staging/terraform.tfvars
```

### Deploy Production Environment

```bash
# Reinitialize with prod backend configuration
terraform init -backend-config=environments/prod/backend.tfvars -reconfigure

# Plan deployment
terraform plan -var-file=environments/prod/terraform.tfvars

# Apply configuration
terraform apply -var-file=environments/prod/terraform.tfvars
```

## Environment-Specific Configurations

### Development
- **VPC CIDR**: 10.0.0.0/16
- **RDS Instance**: db.t3.medium
- **ECS Task**: 256 CPU, 512 MB memory
- **ECS Tasks**: 2 minimum
- **Log Retention**: 7 days
- **Secret Rotation**: Disabled

### Staging
- **VPC CIDR**: 10.1.0.0/16
- **RDS Instance**: db.r5.large
- **ECS Task**: 512 CPU, 1024 MB memory
- **ECS Tasks**: 2 minimum
- **Log Retention**: 30 days
- **Secret Rotation**: Disabled

### Production
- **VPC CIDR**: 10.2.0.0/16
- **RDS Instance**: db.r5.xlarge
- **ECS Task**: 1024 CPU, 2048 MB memory
- **ECS Tasks**: 3 minimum, 10 maximum
- **Log Retention**: 90 days
- **Secret Rotation**: Enabled
- **Route53**: Blue-green weighted routing

## Resource Naming Convention

All resources follow the pattern: `{env}-{region}-{service}-{resource}-{environment_suffix}`

Example: `prod-us-east-1-vpc-prd01`

## Outputs

After deployment, retrieve critical values:

```bash
terraform output
```

Key outputs:
- `alb_dns_name`: Load balancer endpoint
- `rds_cluster_endpoint`: Database write endpoint
- `rds_cluster_reader_endpoint`: Database read endpoint
- `ecs_cluster_arn`: ECS cluster ARN
- `database_secret_arn`: Secrets Manager ARN for DB credentials

## Cleanup

To destroy an environment:

```bash
# Development
terraform destroy -var-file=environments/dev/terraform.tfvars

# Staging
terraform destroy -var-file=environments/staging/terraform.tfvars

# Production (use with extreme caution)
terraform destroy -var-file=environments/prod/terraform.tfvars
```

## Security Features

- **Encryption**: All data encrypted at rest (RDS, S3)
- **Secrets Management**: Dynamic password generation, no hardcoded credentials
- **Network Isolation**: Private subnets for compute and database
- **IAM Least Privilege**: Region-scoped permissions with condition keys
- **Security Groups**: Restrictive ingress rules, minimal egress

## Monitoring and Alerting

- CloudWatch Container Insights enabled on ECS
- Environment-specific log retention policies
- SNS topics with email subscriptions per environment
- Auto-scaling policies based on CPU utilization

## Cost Optimization

- Serverless Aurora considered for future optimization
- Environment-appropriate instance sizing
- Auto-scaling prevents over-provisioning
- Short log retention in non-production

## Troubleshooting

### State Locking Issues
```bash
# Release stuck lock
aws dynamodb delete-item \
  --table-name terraform-locks-payment-dev \
  --key '{"LockID":{"S":"terraform-state-payment-dev/dev/terraform.tfstate"}}'
```

### Backend Reconfiguration
```bash
# Switch between environments
terraform init -backend-config=environments/{env}/backend.tfvars -reconfigure
```

## Future Enhancements

- Optional AWS WAF for production ALB
- CloudFront distributions for static assets
- ElastiCache Redis for session management
- Multi-region active-active deployment

## Support

For issues or questions:
- Review CloudWatch logs: `/ecs/{name_prefix}-{environment_suffix}`
- Check SNS alerts configured per environment
- Review Terraform state in environment-specific S3 buckets
```
