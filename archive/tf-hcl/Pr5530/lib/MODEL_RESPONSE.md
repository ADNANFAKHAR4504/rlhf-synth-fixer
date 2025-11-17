### Reasoning Trace
---

This is a comprehensive Terraform configuration request for a multi-environment infrastructure deployment. I need to create a modular Terraform configuration that:

1. Uses workspaces for environment management
2. Creates environment-specific infrastructure with appropriate sizing
3. Includes all the required components (VPC, RDS, ECS, ALB, Route53, S3, IAM)
4. Uses locals and maps for environment-specific configurations
5. Follows best practices for infrastructure as code

Let me structure this as:
- main.tf - Main infrastructure resources
- variables.tf - Variable definitions
- terraform.tfvars files for each environment (dev.tfvars, staging.tfvars, prod.tfvars)
- I should also include outputs.tf and versions.tf for completeness

I'll make sure to:
- Use workspace-aware configurations
- Implement proper tagging
- Use data sources where appropriate
- Reference Parameter Store for sensitive values
- Create modular and reusable configurations
### Answer 
---

# Multi-Environment Infrastructure Deployment with Terraform

I'll create a comprehensive Terraform configuration that manages infrastructure across dev, staging, and prod environments using workspaces. This solution ensures consistency while allowing environment-appropriate sizing and configurations.

## Directory Structure
```
.
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
```

## Configuration Files

### **versions.tf**
```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terraform-state-fintech-startup"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = local.common_tags
  }
}
```

### **variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-platform"
}

variable "parent_domain" {
  description = "Parent domain for Route53"
  type        = string
  default     = "example.com"
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 80
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 512
}

variable "health_check_path" {
  description = "Health check path for ALB"
  type        = string
  default     = "/"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}
```

### **main.tf**
```hcl
# Local variables for environment-specific configurations
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  
  env_config = {
    dev = {
      vpc_cidr                = "10.0.0.0/16"
      az_count                = 2
      db_instance_class       = "db.t3.micro"
      db_multi_az             = false
      db_backup_retention     = 1
      ecs_desired_count       = 1
      ecs_min_capacity        = 1
      ecs_max_capacity        = 2
      log_retention_days      = 7
      alb_deletion_protection = false
    }
    staging = {
      vpc_cidr                = "10.1.0.0/16"
      az_count                = 2
      db_instance_class       = "db.t3.small"
      db_multi_az             = true
      db_backup_retention     = 7
      ecs_desired_count       = 2
      ecs_min_capacity        = 2
      ecs_max_capacity        = 4
      log_retention_days      = 30
      alb_deletion_protection = false
    }
    prod = {
      vpc_cidr                = "10.2.0.0/16"
      az_count                = 2
      db_instance_class       = "db.t3.micro"
      db_multi_az             = true
      db_backup_retention     = 30
      ecs_desired_count       = 3
      ecs_min_capacity        = 3
      ecs_max_capacity        = 10
      log_retention_days      = 90
      alb_deletion_protection = true
    }
  }
  
  config = local.env_config[local.environment]
  
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
  
  resource_prefix = "${var.project_name}-${local.environment}"
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for RDS database credentials from Parameter Store
data "aws_ssm_parameter" "db_username" {
  name = "/${var.project_name}/${local.environment}/db/username"
}

data "aws_ssm_parameter" "db_password" {
  name            = "/${var.project_name}/${local.environment}/db/password"
  with_decryption = true
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = local.config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${local.resource_prefix}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${local.resource_prefix}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = local.config.az_count
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.config.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = local.config.az_count
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.config.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = local.config.az_count
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.config.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${local.resource_prefix}-database-subnet-${count.index + 1}"
    Type = "Database"
  }
}

# NAT Gateways and Elastic IPs
resource "aws_eip" "nat" {
  count  = local.config.az_count
  domain = "vpc"
  
  tags = {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = local.config.az_count
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${local.resource_prefix}-nat-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${local.resource_prefix}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = local.config.az_count
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = local.config.az_count
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = local.config.az_count
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.resource_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
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
  
  tags = {
    Name = "${local.resource_prefix}-alb-sg"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${local.resource_prefix}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
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
  
  tags = {
    Name = "${local.resource_prefix}-ecs-tasks-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.resource_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
  
  tags = {
    Name = "${local.resource_prefix}-rds-sg"
  }
}

# RDS Database
resource "aws_db_subnet_group" "main" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  
  tags = {
    Name = "${local.resource_prefix}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${local.resource_prefix}-postgres"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = local.config.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "appdb"
  username = data.aws_ssm_parameter.db_username.value
  password = data.aws_ssm_parameter.db_password.value
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  multi_az               = local.config.db_multi_az
  backup_retention_period = local.config.db_backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = local.environment == "dev" ? true : false
  deletion_protection = local.environment == "prod" ? true : false
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Name = "${local.resource_prefix}-postgres"
  }
}

# S3 Buckets for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "${local.resource_prefix}-app-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${local.resource_prefix}-app-logs"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "expire-old-logs"
    status = "Enabled"
    
    expiration {
      days = local.config.log_retention_days
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 7
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

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.resource_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = local.config.alb_deletion_protection
  enable_http2              = true
  
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb"
    enabled = true
  }
  
  tags = {
    Name = "${local.resource_prefix}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name        = "${local.resource_prefix}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  deregistration_delay = 30
  
  tags = {
    Name = "${local.resource_prefix}-tg"
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

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.resource_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "${local.resource_prefix}-cluster"
  }
}

# IAM Roles for ECS
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.resource_prefix}-ecs-task-execution-role"
  
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

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.resource_prefix}-ecs-task-role"
  
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

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${local.resource_prefix}-ecs-task-s3-policy"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.resource_prefix}"
  retention_in_days = local.config.log_retention_days
  
  tags = {
    Name = "${local.resource_prefix}-ecs-logs"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${local.resource_prefix}-app"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.container_cpu
  memory                  = var.container_memory
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "app"
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
          name  = "DB_HOST"
          value = aws_db_instance.main.endpoint
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
  
  tags = {
    Name = "${local.resource_prefix}-app-task"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${local.resource_prefix}-app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = local.config.ecs_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets         = aws_subnet.private[*].id
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "app"
    container_port   = var.container_port
  }
  
  depends_on = [aws_lb_listener.http]
  
  tags = {
    Name = "${local.resource_prefix}-app-service"
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = local.config.ecs_max_capacity
  min_capacity       = local.config.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${local.resource_prefix}-cpu-autoscaling"
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

# Route53 DNS
data "aws_route53_zone" "parent" {
  name = var.parent_domain
}

resource "aws_route53_zone" "subdomain" {
  name = "${local.environment}.${var.parent_domain}"
  
  tags = {
    Name = "${local.resource_prefix}-zone"
  }
}

resource "aws_route53_record" "ns" {
  zone_id = data.aws_route53_zone.parent.zone_id
  name    = aws_route53_zone.subdomain.name
  type    = "NS"
  ttl     = "172800"
  records = aws_route53_zone.subdomain.name_servers
}

resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.subdomain.zone_id
  name    = "app.${aws_route53_zone.subdomain.name}"
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

### **outputs.tf**
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "URL of the application"
  value       = "http://app.${aws_route53_zone.subdomain.name}"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_logs_bucket" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "environment" {
  description = "Current environment"
  value       = local.environment
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}
```

### **environments/dev.tfvars**
```hcl
# Development Environment Configuration
aws_region = "us-east-1"

project_name = "fintech-platform"

parent_domain = "example.com"

container_image = "nginx:latest"

container_port = 80

container_cpu = 256

container_memory = 512

health_check_path = "/health"
```

### **environments/staging.tfvars**
```hcl
# Staging Environment Configuration
aws_region = "us-east-1"

project_name = "fintech-platform"

parent_domain = "example.com"

container_image = "nginx:latest"

container_port = 80

container_cpu = 512

container_memory = 1024

health_check_path = "/health"
```

### **environments/prod.tfvars**
```hcl
# Production Environment Configuration
aws_region = "us-east-1"

project_name = "fintech-platform"

parent_domain = "example.com"

container_image = "nginx:latest"

container_port = 80

container_cpu = 1024

container_memory = 2048

health_check_path = "/health"

# Optional: Production ACM certificate
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
```

## Usage Instructions

### 1. **Initialize Terraform**
```bash
terraform init
```

### 2. **Create Workspaces**
```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

### 3. **Create Parameter Store Values**
Before deploying, create the required SSM parameters for each environment:
```bash
# For each environment (dev, staging, prod)
aws ssm put-parameter --name "/fintech-platform/dev/db/username" --value "dbadmin" --type "String"
aws ssm put-parameter --name "/fintech-platform/dev/db/password" --value "YourSecurePassword" --type "SecureString"
```

### 4. **Deploy to Each Environment**
```bash
# Deploy to development
terraform workspace select dev
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# Deploy to staging
terraform workspace select staging
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars

# Deploy to production
terraform workspace select prod
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

## Key Features

### **Environment Isolation**
- Each environment uses separate VPC CIDR blocks
- Workspace-based state isolation
- Environment-specific resource naming

### **Security**
- Sensitive values stored in AWS Systems Manager Parameter Store
- Security groups with least privilege access
- VPC isolation between environments
- Encrypted RDS storage
- Private subnets for compute resources

### **Scalability**
- Environment-appropriate auto-scaling policies
- Multi-AZ deployment for staging/production
- Automatic storage scaling for RDS

### **Cost Optimization**
- Right-sized instances per environment
- Lifecycle policies for log retention
- NAT Gateway per AZ (can be reduced for dev)

### **Monitoring & Logging**
- CloudWatch Logs for ECS tasks
- S3 bucket for ALB access logs
- Environment-specific retention periods

## Considerations & Best Practices

1. **State Management**: Use remote state backend with locking (S3 + DynamoDB)
2. **Secrets Management**: Never commit sensitive values; use Parameter Store or Secrets Manager
3. **Tagging Strategy**: Consistent tagging for cost allocation and management
4. **Network Security**: Use VPC endpoints for AWS services to reduce data transfer costs
5. **Backup Strategy**: Automated RDS backups with environment-appropriate retention
6. **Monitoring**: Consider adding CloudWatch alarms and dashboards
7. **CI/CD Integration**: Use this configuration with GitOps workflows

This configuration provides a robust, scalable, and maintainable infrastructure that can grow with your fintech platform while maintaining security and compliance requirements.