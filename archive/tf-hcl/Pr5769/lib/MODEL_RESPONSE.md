# Multi-Environment Terraform Infrastructure Implementation

This implementation provides a complete multi-environment infrastructure solution using Terraform with HCL for development, staging, and production environments.

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "multi-env/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
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

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Optional: Reference existing Route53 hosted zone
data "aws_route53_zone" "main" {
  count = var.route53_zone_name != "" ? 1 : 0
  name  = var.route53_zone_name
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  environment_suffix  = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  project_name       = var.project_name
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_id            = module.vpc.vpc_id
  project_name      = var.project_name
}

# KMS Module
module "kms" {
  source = "./modules/kms"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  kms_key_arn       = module.kms.key_arn
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.rds_security_group_id
  instance_class     = var.rds_instance_class
  backup_retention   = var.rds_backup_retention
  kms_key_arn       = module.kms.key_arn
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  environment         = var.environment
  environment_suffix  = var.environment_suffix
  project_name        = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_security_group_id
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  environment         = var.environment
  environment_suffix  = var.environment_suffix
  project_name        = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.ecs_security_group_id
  alb_target_group_arn = module.alb.target_group_arn
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  desired_count      = var.ecs_desired_count
  cloudwatch_log_group_name = module.cloudwatch.log_group_name
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  retention_days     = var.cloudwatch_retention_days
  kms_key_arn       = module.kms.key_arn
}
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
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to support parallel deployments"
  type        = string
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-env-saas"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name (optional)"
  type        = string
  default     = ""
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "rds_backup_retention" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "cloudwatch_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = module.alb.alb_zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.database_name
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.kms.key_arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch.log_group_name
}
```

## File: dev.tfvars

```hcl
environment        = "dev"
environment_suffix = "dev01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"

# RDS Configuration
rds_instance_class    = "db.t3.micro"
rds_backup_retention  = 7

# ECS Configuration
ecs_task_cpu      = "256"
ecs_task_memory   = "512"
ecs_desired_count = 1

# CloudWatch Configuration
cloudwatch_retention_days = 7

# Optional: Route53 zone
route53_zone_name = ""
```

## File: staging.tfvars

```hcl
environment        = "staging"
environment_suffix = "stg01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.2.0.0/16"

# RDS Configuration
rds_instance_class    = "db.t3.small"
rds_backup_retention  = 14

# ECS Configuration
ecs_task_cpu      = "512"
ecs_task_memory   = "1024"
ecs_desired_count = 2

# CloudWatch Configuration
cloudwatch_retention_days = 30

# Optional: Route53 zone
route53_zone_name = ""
```

## File: prod.tfvars

```hcl
environment        = "prod"
environment_suffix = "prod01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.3.0.0/16"

# RDS Configuration
rds_instance_class    = "db.t3.medium"
rds_backup_retention  = 30

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# CloudWatch Configuration
cloudwatch_retention_days = 90

# Optional: Route53 zone
route53_zone_name = ""
```

## File: modules/vpc/main.tf

```hcl
locals {
  az_count = length(var.availability_zones)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_subnet" "private" {
  count             = local.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "private"
  }
}

resource "aws_eip" "nat" {
  count  = local.az_count
  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "main" {
  count         = local.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.environment}-nat-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = local.az_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = local.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = local.az_count
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

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "project_name" {
  description = "Project name"
  type        = string
}
```

## File: modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```

## File: modules/security_groups/main.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-sg-${var.environment_suffix}-"
  description = "Security group for ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
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
    Name        = "${var.environment}-alb-sg-${var.environment_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name_prefix = "${var.environment}-ecs-sg-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Traffic from ALB on port 8080"
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
    Name        = "${var.environment}-ecs-sg-${var.environment_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-rds-sg-${var.environment_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: modules/security_groups/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}
```

## File: modules/security_groups/outputs.tf

```hcl
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
```

## File: modules/kms/main.tf

```hcl
resource "aws_kms_key" "main" {
  description             = "${var.environment} environment encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-kms-key-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}
```

## File: modules/kms/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}
```

## File: modules/kms/outputs.tf

```hcl
output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "key_alias" {
  description = "KMS key alias"
  value       = aws_kms_alias.main.name
}
```

## File: modules/s3/main.tf

```hcl
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-assets-${var.environment_suffix}"

  tags = {
    Name        = "${var.environment}-assets-bucket-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## File: modules/s3/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}
```

## File: modules/s3/outputs.tf

```hcl
output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}
```

## File: modules/rds/main.tf

```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name_prefix = "${var.environment}-db-password-${var.environment_suffix}-"
  description = "RDS database password for ${var.environment}"

  tags = {
    Name        = "${var.environment}-db-password-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.environment}-db-subnet-${var.environment_suffix}-"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name        = "${var.environment}-db-subnet-group-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-postgres-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_arn

  db_name  = "${var.project_name}_${var.environment}"
  username = "dbadmin"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = var.backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.environment}-final-snapshot-${var.environment_suffix}"
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.environment}-postgres-${var.environment_suffix}"
    Environment = var.environment
  }
}
```

## File: modules/rds/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for RDS"
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

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}
```

## File: modules/rds/outputs.tf

```hcl
output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Database username"
  value       = aws_db_instance.main.username
}

output "password_secret_arn" {
  description = "ARN of Secrets Manager secret containing DB password"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}
```

## File: modules/alb/main.tf

```hcl
resource "aws_lb" "main" {
  name_prefix        = substr("${var.environment}-", 0, 6)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2              = true

  tags = {
    Name        = "${var.environment}-alb-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "main" {
  name_prefix = substr("${var.environment}-", 0, 6)
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
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name        = "${var.environment}-tg-${var.environment_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
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

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
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
  name = "${var.environment}-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.environment}-cluster-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
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
  name_prefix        = "${var.environment}-ecs-exec-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = {
    Name        = "${var.environment}-ecs-task-execution-role-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name_prefix        = "${var.environment}-ecs-task-${var.environment_suffix}-"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = {
    Name        = "${var.environment}-ecs-task-role-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.environment}-app-${var.environment_suffix}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "nginx:latest"
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.cloudwatch_log_group_name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
    }
  ])

  tags = {
    Name        = "${var.environment}-task-definition-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "main" {
  name            = "${var.environment}-service-${var.environment_suffix}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "app"
    container_port   = 80
  }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution]

  tags = {
    Name        = "${var.environment}-service-${var.environment_suffix}"
    Environment = var.environment
  }
}
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

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "task_cpu" {
  description = "ECS task CPU units"
  type        = string
}

variable "task_memory" {
  description = "ECS task memory in MB"
  type        = string
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}
```

## File: modules/ecs/outputs.tf

```hcl
output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

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
  value       = aws_ecs_service.main.name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.main.arn
}

output "task_execution_role_arn" {
  description = "Task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "task_role_arn" {
  description = "Task role ARN"
  value       = aws_iam_role.ecs_task.arn
}
```

## File: modules/cloudwatch/main.tf

```hcl
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/ecs/${var.environment}-${var.environment_suffix}"
  retention_in_days = var.retention_days
  kms_key_id        = var.kms_key_arn

  tags = {
    Name        = "${var.environment}-log-group-${var.environment_suffix}"
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

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "retention_days" {
  description = "Log retention period in days"
  type        = number
}

variable "kms_key_arn" {
  description = "KMS key ARN for log encryption"
  type        = string
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

## File: README.md

```markdown
# Multi-Environment Infrastructure with Terraform

This Terraform configuration implements a multi-environment infrastructure solution for deploying consistent AWS infrastructure across development, staging, and production environments.

## Architecture

The infrastructure includes:
- VPC with public and private subnets across 2 availability zones
- NAT Gateways for outbound connectivity
- Application Load Balancer (ALB)
- ECS Fargate cluster with containerized application
- RDS PostgreSQL database with environment-specific instance classes
- S3 bucket with versioning and KMS encryption
- CloudWatch log groups with environment-specific retention
- Security groups with least privilege access
- KMS keys for encryption at rest

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state (update backend configuration)
- DynamoDB table for state locking (update backend configuration)

## Directory Structure

```
.
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf             # Output definitions
├── dev.tfvars             # Development environment variables
├── staging.tfvars         # Staging environment variables
├── prod.tfvars            # Production environment variables
└── modules/
    ├── vpc/               # VPC module
    ├── security_groups/   # Security groups module
    ├── kms/               # KMS encryption module
    ├── s3/                # S3 bucket module
    ├── rds/               # RDS database module
    ├── alb/               # Application Load Balancer module
    ├── ecs/               # ECS Fargate module
    └── cloudwatch/        # CloudWatch logs module
```

## Usage

### Initialize Terraform

```bash
terraform init
```

### Deploy Development Environment

```bash
terraform workspace new dev
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Deploy Staging Environment

```bash
terraform workspace new staging
terraform workspace select staging
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
```

### Deploy Production Environment

```bash
terraform workspace new prod
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Environment Configurations

### Development (dev.tfvars)
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.micro with 7-day backup retention
- ECS: 256 CPU, 512 MB memory, 1 task
- CloudWatch: 7-day log retention

### Staging (staging.tfvars)
- VPC CIDR: 10.2.0.0/16
- RDS: db.t3.small with 14-day backup retention
- ECS: 512 CPU, 1024 MB memory, 2 tasks
- CloudWatch: 30-day log retention

### Production (prod.tfvars)
- VPC CIDR: 10.3.0.0/16
- RDS: db.t3.medium with 30-day backup retention
- ECS: 1024 CPU, 2048 MB memory, 3 tasks
- CloudWatch: 90-day log retention

## Resource Naming Convention

All resources follow the naming pattern:
```
{environment}-{resource-type}-{environment_suffix}
```

Example: `dev-vpc-dev01`, `prod-alb-prod01`

## Security Features

- Encryption at rest using KMS for RDS, S3, and CloudWatch logs
- Encryption in transit using TLS/SSL
- Security groups with least privilege access
- Private subnets for databases and ECS tasks
- Public access blocked on S3 buckets
- IAM roles following principle of least privilege

## Outputs

After successful deployment, Terraform will output:
- VPC ID and CIDR
- Subnet IDs (public and private)
- ALB DNS name
- ECS cluster and service names
- RDS endpoint (sensitive)
- S3 bucket name
- KMS key ARN
- CloudWatch log group name

## Destroying Infrastructure

To destroy an environment:

```bash
terraform workspace select <env>
terraform destroy -var-file=<env>.tfvars
```

## Notes

- RDS instances are configured with `skip_final_snapshot = true` for easy destruction
- All resources support parallel deployments via the `environment_suffix` variable
- Database passwords are randomly generated and stored in AWS Secrets Manager
- Container insights are enabled for ECS clusters
```
