# Multi-Environment Terraform Infrastructure Solution

This is a complete Terraform implementation for managing multi-environment infrastructure using workspaces. The solution includes reusable modules for VPC, compute, database, and storage components with environment-specific configurations.

## File: backend.tf

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-multienv"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## File: provider.tf

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
  region = var.aws_region

  default_tags {
    tags = {
      Environment = terraform.workspace
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "fintech-app"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_backup_retention_days" {
  description = "Database backup retention period in days"
  type        = number
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
}

variable "enable_s3_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
}

variable "s3_lifecycle_days" {
  description = "Days before transitioning S3 objects to cheaper storage"
  type        = number
}

variable "enable_ssl" {
  description = "Enable SSL certificate for ALB"
  type        = bool
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "fintechdb"
}
```

## File: main.tf

```hcl
locals {
  environment = terraform.workspace
  name_prefix = "${var.project_name}-${local.environment}-${var.environment_suffix}"
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.name_prefix}-db-credentials"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true

  tags = {
    Name = "${local.name_prefix}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = module.database.db_endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment        = local.environment
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  instance_security_group_id = module.vpc.instance_security_group_id

  instance_type    = var.instance_type
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  enable_ssl           = var.enable_ssl
  ssl_certificate_arn  = var.ssl_certificate_arn
  environment          = local.environment
}

# Database Module
module "database" {
  source = "./modules/database"

  name_prefix               = local.name_prefix
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  db_security_group_id      = module.vpc.db_security_group_id

  db_instance_class         = var.db_instance_class
  db_name                   = var.db_name
  db_username               = var.db_username
  db_password               = random_password.db_password.result
  db_backup_retention_days  = var.db_backup_retention_days
  db_multi_az               = var.db_multi_az
  environment               = local.environment
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  name_prefix          = local.name_prefix
  enable_versioning    = var.enable_s3_versioning
  lifecycle_days       = var.s3_lifecycle_days
  environment          = local.environment
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
  description = "Application Load Balancer DNS name"
  value       = module.compute.alb_dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.compute.alb_arn
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID"
  value       = module.compute.alb_zone_id
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = module.compute.autoscaling_group_name
}

output "autoscaling_group_arn" {
  description = "Auto Scaling Group ARN"
  value       = module.compute.autoscaling_group_arn
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "db_arn" {
  description = "RDS database ARN"
  value       = module.database.db_arn
}

output "db_secret_arn" {
  description = "Secrets Manager secret ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.storage.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.storage.bucket_arn
}

output "environment" {
  description = "Current workspace environment"
  value       = local.environment
}
```

## File: dev.tfvars

```hcl
# Development Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "dev001"

# Network Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.micro"
min_size         = 1
max_size         = 2
desired_capacity = 1

# Database Configuration
db_instance_class         = "db.t3.micro"
db_backup_retention_days  = 1
db_multi_az               = false

# Storage Configuration
enable_s3_versioning = false
s3_lifecycle_days    = 30

# Security Configuration
enable_ssl = false
```

## File: staging.tfvars

```hcl
# Staging Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "stg001"

# Network Configuration
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.small"
min_size         = 2
max_size         = 4
desired_capacity = 2

# Database Configuration
db_instance_class         = "db.t3.small"
db_backup_retention_days  = 7
db_multi_az               = true

# Storage Configuration
enable_s3_versioning = false
s3_lifecycle_days    = 60

# Security Configuration
enable_ssl = true
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"
```

## File: prod.tfvars

```hcl
# Production Environment Configuration
aws_region         = "us-east-1"
project_name       = "fintech-app"
environment_suffix = "prod001"

# Network Configuration
vpc_cidr = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Compute Configuration
instance_type    = "t3.medium"
min_size         = 3
max_size         = 10
desired_capacity = 3

# Database Configuration
db_instance_class         = "db.t3.medium"
db_backup_retention_days  = 30
db_multi_az               = true

# Storage Configuration
enable_s3_versioning = true
s3_lifecycle_days    = 90

# Security Configuration
enable_ssl = true
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"
```

## File: modules/vpc/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.name_prefix}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.name_prefix}-nat-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.name_prefix}-nat-gateway"
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
    Name = "${var.name_prefix}-public-rt"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.name_prefix}-private-rt"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
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
    Name = "${var.name_prefix}-alb-sg"
  }
}

# Instance Security Group
resource "aws_security_group" "instance" {
  name        = "${var.name_prefix}-instance-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
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
    Name = "${var.name_prefix}-instance-sg"
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.instance.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-db-sg"
  }
}
```

## File: modules/vpc/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource naming"
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

variable "environment" {
  description = "Environment name"
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
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "instance_security_group_id" {
  description = "Instance security group ID"
  value       = aws_security_group.instance.id
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.db.id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## File: modules/compute/main.tf

```hcl
# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.instance_security_group_id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.environment} environment</h1>" > /var/www/html/index.html
              EOF
  )

  iam_instance_profile {
    name = aws_iam_instance_profile.main.name
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.name_prefix}-instance"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "main" {
  name_prefix = "${var.name_prefix}-ec2-role-"

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
    Name = "${var.name_prefix}-ec2-role"
  }
}

# Attach SSM policy for instance management
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.main.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "main" {
  name_prefix = "${var.name_prefix}-profile-"
  role        = aws_iam_role.main.name
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix         = "${var.name_prefix}-asg-"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-asg-instance"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name_prefix        = substr(replace(var.name_prefix, "/[^a-zA-Z0-9-]/", ""), 0, 6)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "${var.name_prefix}-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = substr(replace(var.name_prefix, "/[^a-zA-Z0-9-]/", ""), 0, 6)
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.name_prefix}-tg"
  }
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.enable_ssl ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.enable_ssl ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.enable_ssl ? null : aws_lb_target_group.main.arn
  }
}

# ALB Listener - HTTPS
resource "aws_lb_listener" "https" {
  count             = var.enable_ssl ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Auto Scaling Policy - Target Tracking
resource "aws_autoscaling_policy" "target_tracking" {
  name                   = "${var.name_prefix}-target-tracking-policy"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## File: modules/compute/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "instance_security_group_id" {
  description = "Security group ID for instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
}

variable "enable_ssl" {
  description = "Enable SSL certificate for ALB"
  type        = bool
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

## File: modules/compute/outputs.tf

```hcl
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target Group ARN"
  value       = aws_lb_target_group.main.arn
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.main.arn
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.main.id
}
```

## File: modules/database/main.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.name_prefix}-db-subnet-"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name = "${var.name_prefix}-db-subnet-group"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.name_prefix}-pg-"
  family      = "postgres15"
  description = "Custom parameter group for PostgreSQL 15"

  parameter {
    name  = "max_connections"
    value = "100"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}"
  }

  tags = {
    Name = "${var.name_prefix}-db-parameter-group"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier_prefix = "${var.name_prefix}-db-"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.db_instance_class
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  multi_az               = var.db_multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  backup_retention_period = var.db_backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = null
  deletion_protection       = false

  # Enable force destroy for clean teardown
  delete_automated_backups = true

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "${var.name_prefix}-postgresql"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: modules/database/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group ID for database"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

## File: modules/database/outputs.tf

```hcl
output "db_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_address" {
  description = "Database address"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "db_arn" {
  description = "Database ARN"
  value       = aws_db_instance.main.arn
}

output "db_id" {
  description = "Database ID"
  value       = aws_db_instance.main.id
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}
```

## File: modules/storage/main.tf

```hcl
# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket_prefix = "${var.name_prefix}-assets-"
  force_destroy = true

  tags = {
    Name = "${var.name_prefix}-assets-bucket"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = var.lifecycle_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.lifecycle_days * 2
      storage_class = "GLACIER_IR"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceTLSRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket_prefix = "${var.name_prefix}-logs-"
  force_destroy = true

  tags = {
    Name = "${var.name_prefix}-logs-bucket"
  }
}

# S3 Logs Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Logs Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Logs Bucket Lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}
```

## File: modules/storage/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
}

variable "lifecycle_days" {
  description = "Days before transitioning objects to cheaper storage"
  type        = number
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

## File: modules/storage/outputs.tf

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

output "bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "logs_bucket_name" {
  description = "Logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "Logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}
```

## File: lib/README.md

```markdown
# Multi-Environment Terraform Infrastructure

This Terraform configuration provides a complete multi-environment infrastructure solution for a fintech application using workspace-based environment management.

## Architecture

The infrastructure includes:
- **VPC Module**: Network infrastructure with public/private subnets, NAT Gateway, and security groups
- **Compute Module**: EC2 Auto Scaling Groups with Application Load Balancer
- **Database Module**: RDS PostgreSQL with automated backups and encryption
- **Storage Module**: S3 buckets with versioning, lifecycle policies, and encryption

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state backend
- DynamoDB table for state locking
- SSL certificates in ACM (for staging and production)

## Workspace Management

This configuration uses Terraform workspaces to manage multiple environments:

```bash
# List workspaces
terraform workspace list

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch workspace
terraform workspace select dev
```

## Deployment Instructions

### Initial Setup

1. **Configure Backend**

Edit `backend.tf` with your S3 bucket and DynamoDB table:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "your-state-lock-table"
  }
}
```

2. **Initialize Terraform**

```bash
terraform init
```

### Deploy Development Environment

```bash
# Create and select dev workspace
terraform workspace new dev || terraform workspace select dev

# Plan deployment
terraform plan -var-file="dev.tfvars"

# Apply configuration
terraform apply -var-file="dev.tfvars"
```

### Deploy Staging Environment

```bash
# Create and select staging workspace
terraform workspace new staging || terraform workspace select staging

# Update staging.tfvars with SSL certificate ARN
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# Plan deployment
terraform plan -var-file="staging.tfvars"

# Apply configuration
terraform apply -var-file="staging.tfvars"
```

### Deploy Production Environment

```bash
# Create and select prod workspace
terraform workspace new prod || terraform workspace select prod

# Update prod.tfvars with SSL certificate ARN
# ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# Plan deployment
terraform plan -var-file="prod.tfvars"

# Apply configuration
terraform apply -var-file="prod.tfvars"
```

## Configuration Files

### Environment-Specific Variables

- **dev.tfvars**: Development environment with minimal resources
  - VPC: 10.0.0.0/16
  - Instances: 1-2 (t3.micro)
  - Database: db.t3.micro, 1-day backups, Single-AZ
  - S3: No versioning

- **staging.tfvars**: Staging environment with production-like setup
  - VPC: 10.1.0.0/16
  - Instances: 2-4 (t3.small)
  - Database: db.t3.small, 7-day backups, Multi-AZ
  - S3: No versioning, SSL enabled

- **prod.tfvars**: Production environment with high availability
  - VPC: 10.2.0.0/16
  - Instances: 3-10 (t3.medium)
  - Database: db.t3.medium, 30-day backups, Multi-AZ
  - S3: Versioning enabled, SSL enabled

## Outputs

After successful deployment, retrieve outputs:

```bash
# Get all outputs
terraform output

# Get specific output
terraform output alb_dns_name
terraform output db_endpoint
terraform output s3_bucket_name
```

## Resource Naming Convention

All resources follow the naming pattern: `{project}-{environment}-{suffix}-{resource-type}`

Example: `fintech-app-dev-dev001-vpc`

## Security Features

- VPC with isolated private subnets for databases
- Security groups with least-privilege access
- RDS encryption at rest
- S3 encryption at rest (AES256)
- SSL/TLS for load balancer traffic (staging/prod)
- Database credentials stored in AWS Secrets Manager
- IMDSv2 required for EC2 instances
- Public access blocked on S3 buckets

## Backup Strategy

- **Development**: 1-day backup retention
- **Staging**: 7-day backup retention
- **Production**: 30-day backup retention

Automated backups run during maintenance windows:
- Backup window: 03:00-04:00 UTC
- Maintenance window: Monday 04:00-05:00 UTC

## Auto Scaling

Auto Scaling Groups configured per environment:

| Environment | Min | Max | Desired |
|------------|-----|-----|---------|
| Dev        | 1   | 2   | 1       |
| Staging    | 2   | 4   | 2       |
| Production | 3   | 10  | 3       |

Target tracking policy: 70% average CPU utilization

## Cost Optimization

- Development uses t3.micro instances
- NAT Gateway shared across availability zones
- Lifecycle policies move S3 objects to cheaper storage tiers
- Auto Scaling reduces costs during low traffic periods

## Cleanup

To destroy an environment:

```bash
# Select workspace
terraform workspace select dev

# Destroy resources
terraform destroy -var-file="dev.tfvars"

# Delete workspace (after destroying resources)
terraform workspace select default
terraform workspace delete dev
```

## Troubleshooting

### State Lock Issues

If state is locked:

```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

### Workspace Issues

If workspace state is corrupted:

```bash
# Pull current state
terraform state pull > backup.tfstate

# Delete and recreate workspace
terraform workspace delete -force WORKSPACE_NAME
terraform workspace new WORKSPACE_NAME

# Push state back
terraform state push backup.tfstate
```

## Module Structure

```
.
├── backend.tf                 # State backend configuration
├── provider.tf                # Provider and version constraints
├── variables.tf               # Root module variables
├── main.tf                    # Main configuration
├── outputs.tf                 # Root module outputs
├── dev.tfvars                 # Development variables
├── staging.tfvars             # Staging variables
├── prod.tfvars                # Production variables
└── modules/
    ├── vpc/                   # VPC module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── compute/               # Compute module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── database/              # Database module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── storage/               # Storage module
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Testing

Run validation and formatting:

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Plan with no changes
terraform plan -var-file="dev.tfvars"
```

## Additional Resources

- [Terraform Workspaces Documentation](https://www.terraform.io/docs/language/state/workspaces.html)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
```
