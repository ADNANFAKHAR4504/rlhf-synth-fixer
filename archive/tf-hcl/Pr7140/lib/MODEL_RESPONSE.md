# Multi-Region Disaster Recovery Architecture - Terraform Implementation

This implementation provides a complete active-passive disaster recovery solution for a payment processing application using Terraform and AWS services across us-east-1 (primary) and us-west-2 (DR) regions.

## Architecture Overview

- Aurora PostgreSQL Global Database for cross-region data replication
- ECS Fargate services in both regions for containerized application deployment
- Route53 health checks and failover routing for automatic DNS-based failover
- VPC architecture with 3 private subnets per region across multiple AZs
- CloudWatch monitoring with alarms for replication lag and service health
- Automated backups with 7-day retention

## File: lib/providers.tf

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

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}

# DR region provider (us-west-2)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = var.common_tags
  }
}

# Default provider (primary region)
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Application = "payment-processing"
    CostCenter  = "finance-ops"
    ManagedBy   = "terraform"
  }
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dr_vpc_cidr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  default     = "ChangeMe123456!"
  sensitive   = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task"
  type        = string
  default     = "512"
}

variable "container_image" {
  description = "Docker container image for payment application"
  type        = string
  default     = "nginx:latest"
}

variable "health_check_interval" {
  description = "Route53 health check interval in seconds"
  type        = number
  default     = 30
}

variable "replication_lag_threshold" {
  description = "Aurora replication lag threshold in seconds for alarms"
  type        = number
  default     = 30
}
```

## File: lib/main.tf

```hcl
# Primary Region VPC
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  vpc_cidr          = var.primary_vpc_cidr
  region            = var.primary_region
  region_name       = "primary"

  tags = merge(var.common_tags, {
    Region = var.primary_region
  })
}

# DR Region VPC
module "vpc_dr" {
  source = "./modules/vpc"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  vpc_cidr          = var.dr_vpc_cidr
  region            = var.dr_region
  region_name       = "dr"

  tags = merge(var.common_tags, {
    Region = var.dr_region
  })
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix        = var.environment_suffix
  primary_region           = var.primary_region
  dr_region                = var.dr_region
  db_master_username       = var.db_master_username
  db_master_password       = var.db_master_password

  primary_subnet_ids       = module.vpc_primary.private_subnet_ids
  primary_vpc_id           = module.vpc_primary.vpc_id
  dr_subnet_ids            = module.vpc_dr.private_subnet_ids
  dr_vpc_id                = module.vpc_dr.vpc_id

  replication_lag_threshold = var.replication_lag_threshold

  tags = var.common_tags
}

# ECS Primary Region
module "ecs_primary" {
  source = "./modules/ecs"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  region_name        = "primary"

  vpc_id             = module.vpc_primary.vpc_id
  subnet_ids         = module.vpc_primary.private_subnet_ids
  container_image    = var.container_image
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory

  db_endpoint        = module.aurora_global.primary_cluster_endpoint

  tags = merge(var.common_tags, {
    Region = var.primary_region
  })
}

# ECS DR Region
module "ecs_dr" {
  source = "./modules/ecs"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  region_name        = "dr"

  vpc_id             = module.vpc_dr.vpc_id
  subnet_ids         = module.vpc_dr.private_subnet_ids
  container_image    = var.container_image
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory

  db_endpoint        = module.aurora_global.dr_cluster_endpoint

  tags = merge(var.common_tags, {
    Region = var.dr_region
  })
}

# Route53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  environment_suffix        = var.environment_suffix
  primary_lb_dns            = module.ecs_primary.lb_dns_name
  primary_lb_zone_id        = module.ecs_primary.lb_zone_id
  dr_lb_dns                 = module.ecs_dr.lb_dns_name
  dr_lb_zone_id             = module.ecs_dr.lb_zone_id
  health_check_interval     = var.health_check_interval

  tags = var.common_tags
}
```

## File: lib/outputs.tf

```hcl
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = module.vpc_dr.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
}

output "dr_cluster_endpoint" {
  description = "DR Aurora cluster endpoint"
  value       = module.aurora_global.dr_cluster_endpoint
}

output "primary_ecs_cluster_name" {
  description = "Primary ECS cluster name"
  value       = module.ecs_primary.cluster_name
}

output "dr_ecs_cluster_name" {
  description = "DR ECS cluster name"
  value       = module.ecs_dr.cluster_name
}

output "primary_lb_dns_name" {
  description = "Primary load balancer DNS name"
  value       = module.ecs_primary.lb_dns_name
}

output "dr_lb_dns_name" {
  description = "DR load balancer DNS name"
  value       = module.ecs_dr.lb_dns_name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "failover_domain" {
  description = "Failover domain name"
  value       = module.route53_failover.failover_domain
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
```

## File: lib/modules/vpc/main.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "vpc-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "private-subnet-${var.region_name}-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "igw-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "nat-eip-${var.region_name}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.private[0].id

  tags = merge(var.tags, {
    Name = "nat-${var.region_name}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "private-rt-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "database" {
  name_prefix = "db-sg-${var.region_name}-${var.environment_suffix}-"
  description = "Security group for Aurora database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "PostgreSQL from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "db-sg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "ecs-sg-${var.region_name}-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "ecs-sg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.region_name}-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

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
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "alb-sg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/modules/vpc/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or dr)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}
```

## File: lib/modules/aurora/main.tf

```hcl
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "global-aurora-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "14.6"
  database_name             = "payments"
  storage_encrypted         = true
}

resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name_prefix = "aurora-primary-${var.environment_suffix}-"
  subnet_ids  = var.primary_subnet_ids

  tags = merge(var.tags, {
    Name   = "aurora-subnet-group-primary-${var.environment_suffix}"
    Region = var.primary_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_subnet_group" "dr" {
  provider    = aws.dr
  name_prefix = "aurora-dr-${var.environment_suffix}-"
  subnet_ids  = var.dr_subnet_ids

  tags = merge(var.tags, {
    Name   = "aurora-subnet-group-dr-${var.environment_suffix}"
    Region = var.dr_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name_prefix = "aurora-sg-primary-${var.environment_suffix}-"
  description = "Security group for Aurora primary cluster"
  vpc_id      = var.primary_vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "PostgreSQL from primary VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name   = "aurora-sg-primary-${var.environment_suffix}"
    Region = var.primary_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name_prefix = "aurora-sg-dr-${var.environment_suffix}-"
  description = "Security group for Aurora DR cluster"
  vpc_id      = var.dr_vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
    description = "PostgreSQL from DR VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name   = "aurora-sg-dr-${var.environment_suffix}"
    Region = var.dr_region
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "primary" {
  provider                      = aws.primary
  cluster_identifier            = "aurora-primary-${var.environment_suffix}"
  engine                        = aws_rds_global_cluster.main.engine
  engine_version                = aws_rds_global_cluster.main.engine_version
  database_name                 = "payments"
  master_username               = var.db_master_username
  master_password               = var.db_master_password
  backup_retention_period       = 7
  preferred_backup_window       = "03:00-04:00"
  preferred_maintenance_window  = "mon:04:00-mon:05:00"
  db_subnet_group_name          = aws_db_subnet_group.primary.name
  vpc_security_group_ids        = [aws_security_group.aurora_primary.id]
  storage_encrypted             = true
  skip_final_snapshot           = true
  deletion_protection           = false
  global_cluster_identifier     = aws_rds_global_cluster.main.id

  tags = merge(var.tags, {
    Name   = "aurora-primary-${var.environment_suffix}"
    Region = var.primary_region
  })
}

resource "aws_rds_cluster_instance" "primary" {
  provider             = aws.primary
  count                = 2
  identifier           = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false

  tags = merge(var.tags, {
    Name   = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Region = var.primary_region
  })
}

resource "aws_rds_cluster" "dr" {
  provider                      = aws.dr
  cluster_identifier            = "aurora-dr-${var.environment_suffix}"
  engine                        = aws_rds_global_cluster.main.engine
  engine_version                = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name          = aws_db_subnet_group.dr.name
  vpc_security_group_ids        = [aws_security_group.aurora_dr.id]
  storage_encrypted             = true
  skip_final_snapshot           = true
  deletion_protection           = false
  global_cluster_identifier     = aws_rds_global_cluster.main.id

  depends_on = [
    aws_rds_cluster_instance.primary
  ]

  tags = merge(var.tags, {
    Name   = "aurora-dr-${var.environment_suffix}"
    Region = var.dr_region
  })
}

resource "aws_rds_cluster_instance" "dr" {
  provider             = aws.dr
  count                = 2
  identifier           = "aurora-dr-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.dr.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.dr.engine
  engine_version       = aws_rds_cluster.dr.engine_version
  publicly_accessible  = false

  tags = merge(var.tags, {
    Name   = "aurora-dr-instance-${count.index + 1}-${var.environment_suffix}"
    Region = var.dr_region
  })
}

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "aurora-replication-lag-alarm-${var.environment_suffix}"
  })
}

resource "aws_sns_topic" "aurora_alarms" {
  provider = aws.primary
  name     = "aurora-alarms-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "aurora-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "aurora_alarms_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.aurora_alarms.arn
  protocol  = "email"
  endpoint  = "admin@example.com"
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.primary
  alarm_name          = "aurora-primary-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora primary cluster CPU utilization"
  alarm_actions       = [aws_sns_topic.aurora_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(var.tags, {
    Name = "aurora-primary-cpu-alarm-${var.environment_suffix}"
  })
}
```

## File: lib/modules/aurora/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "dr_region" {
  description = "DR AWS region"
  type        = string
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  sensitive   = true
}

variable "primary_subnet_ids" {
  description = "Primary region subnet IDs"
  type        = list(string)
}

variable "primary_vpc_id" {
  description = "Primary VPC ID"
  type        = string
}

variable "dr_subnet_ids" {
  description = "DR region subnet IDs"
  type        = list(string)
}

variable "dr_vpc_id" {
  description = "DR VPC ID"
  type        = string
}

variable "replication_lag_threshold" {
  description = "Replication lag threshold in seconds"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/aurora/outputs.tf

```hcl
output "global_cluster_id" {
  description = "Global cluster identifier"
  value       = aws_rds_global_cluster.main.id
}

output "primary_cluster_id" {
  description = "Primary cluster identifier"
  value       = aws_rds_cluster.primary.id
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "dr_cluster_id" {
  description = "DR cluster identifier"
  value       = aws_rds_cluster.dr.id
}

output "dr_cluster_endpoint" {
  description = "DR cluster endpoint"
  value       = aws_rds_cluster.dr.endpoint
}

output "replication_lag_alarm_arn" {
  description = "Replication lag alarm ARN"
  value       = aws_cloudwatch_metric_alarm.replication_lag.arn
}
```

## File: lib/modules/ecs/main.tf

```hcl
resource "aws_ecs_cluster" "main" {
  name = "ecs-cluster-${var.region_name}-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "ecs-cluster-${var.region_name}-${var.environment_suffix}"
  })
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

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/payment-app-${var.region_name}-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "ecs-logs-${var.region_name}-${var.environment_suffix}"
  })
}

data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name_prefix        = "ecs-task-exec-${var.region_name}-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = merge(var.tags, {
    Name = "ecs-task-execution-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name_prefix        = "ecs-task-${var.region_name}-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = merge(var.tags, {
    Name = "ecs-task-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_ecs_task_definition" "app" {
  family                   = "payment-app-${var.region_name}-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "payment-app"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DB_ENDPOINT"
          value = var.db_endpoint
        },
        {
          name  = "REGION"
          value = var.region
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name = "payment-app-task-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_lb" "main" {
  name               = "alb-${var.region_name}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection = false

  tags = merge(var.tags, {
    Name = "alb-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.region_name}-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "alb-sg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-sg-${var.region_name}-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "ecs-tasks-sg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "app" {
  name_prefix = "tg-${substr(var.region_name, 0, 1)}-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-299"
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "tg-${var.region_name}-${var.environment_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_ecs_service" "app" {
  name            = "payment-service-${var.region_name}-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "payment-app"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.app
  ]

  tags = merge(var.tags, {
    Name = "payment-service-${var.region_name}-${var.environment_suffix}"
  })
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "ecs-cpu-autoscaling-${var.region_name}-${var.environment_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_health" {
  alarm_name          = "ecs-service-health-${var.region_name}-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ECS service health"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.tags, {
    Name = "ecs-service-health-alarm-${var.region_name}-${var.environment_suffix}"
  })
}
```

## File: lib/modules/ecs/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "region_name" {
  description = "Region name (primary or dr)"
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

variable "container_image" {
  description = "Docker container image"
  type        = string
}

variable "task_cpu" {
  description = "CPU units for ECS task"
  type        = string
}

variable "task_memory" {
  description = "Memory for ECS task"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/ecs/outputs.tf

```hcl
output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "lb_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "lb_zone_id" {
  description = "Load balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "lb_arn" {
  description = "Load balancer ARN"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}
```

## File: lib/modules/route53/main.tf

```hcl
resource "aws_route53_zone" "main" {
  name = "payment-dr-${var.environment_suffix}.example.com"

  tags = merge(var.tags, {
    Name = "payment-dr-zone-${var.environment_suffix}"
  })
}

resource "aws_route53_health_check" "primary" {
  type                            = "HTTPS_STR_MATCH"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = var.health_check_interval
  search_string                   = "200"
  measure_latency                 = true

  tags = merge(var.tags, {
    Name = "primary-health-check-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_health_check" {
  alarm_name          = "primary-health-check-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors primary region health"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = merge(var.tags, {
    Name = "primary-health-check-alarm-${var.environment_suffix}"
  })
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.payment-dr-${var.environment_suffix}.example.com"
  type    = "A"

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_lb_dns
    zone_id                = var.primary_lb_zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.payment-dr-${var.environment_suffix}.example.com"
  type    = "A"

  set_identifier = "dr"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = var.dr_lb_dns
    zone_id                = var.dr_lb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_sns_topic" "route53_alarms" {
  name = "route53-alarms-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "route53-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "route53_alarms_email" {
  topic_arn = aws_sns_topic.route53_alarms.arn
  protocol  = "email"
  endpoint  = "ops@example.com"
}
```

## File: lib/modules/route53/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "primary_lb_dns" {
  description = "Primary load balancer DNS name"
  type        = string
}

variable "primary_lb_zone_id" {
  description = "Primary load balancer zone ID"
  type        = string
}

variable "dr_lb_dns" {
  description = "DR load balancer DNS name"
  type        = string
}

variable "dr_lb_zone_id" {
  description = "DR load balancer zone ID"
  type        = string
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/route53/outputs.tf

```hcl
output "zone_id" {
  description = "Route53 zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Route53 zone name"
  value       = aws_route53_zone.main.name
}

output "failover_domain" {
  description = "Failover domain name"
  value       = aws_route53_record.primary.name
}

output "primary_health_check_id" {
  description = "Primary health check ID"
  value       = aws_route53_health_check.primary.id
}

output "name_servers" {
  description = "Route53 zone name servers"
  value       = aws_route53_zone.main.name_servers
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy to terraform.tfvars and customize

environment_suffix = "test-12345"

primary_region = "us-east-1"
dr_region      = "us-west-2"

primary_vpc_cidr = "10.0.0.0/16"
dr_vpc_cidr      = "10.1.0.0/16"

db_master_username = "dbadmin"
db_master_password = "ChangeMe123456!"

ecs_task_cpu    = "256"
ecs_task_memory = "512"

container_image = "nginx:latest"

health_check_interval      = 30
replication_lag_threshold = 30

common_tags = {
  Environment = "production"
  Application = "payment-processing"
  CostCenter  = "finance-ops"
  ManagedBy   = "terraform"
}
```
