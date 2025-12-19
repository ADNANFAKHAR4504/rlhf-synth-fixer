# Multi-Environment Terraform Infrastructure

This implementation provides a complete multi-environment infrastructure setup using Terraform workspaces for development, staging, and production environments.

## File: lib/main.tf

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
    bucket         = "fintech-terraform-state"
    key            = "payment-platform/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fintech-terraform-locks"

    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  environment = terraform.workspace

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    Workspace   = terraform.workspace
  }

  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr          = "10.0.0.0/16"
      instance_type     = "t3.micro"
      db_instance_class = "db.t3.micro"
      asg_min_size      = 1
      asg_max_size      = 2
      asg_desired       = 1
      multi_az          = false
      deletion_protection = false
      backup_retention  = 1
    }
    staging = {
      vpc_cidr          = "10.1.0.0/16"
      instance_type     = "t3.small"
      db_instance_class = "db.t3.small"
      asg_min_size      = 1
      asg_max_size      = 3
      asg_desired       = 2
      multi_az          = false
      deletion_protection = false
      backup_retention  = 3
    }
    prod = {
      vpc_cidr          = "10.2.0.0/16"
      instance_type     = "t3.medium"
      db_instance_class = "db.t3.medium"
      asg_min_size      = 2
      asg_max_size      = 6
      asg_desired       = 2
      multi_az          = true
      deletion_protection = true
      backup_retention  = 7
    }
  }

  current_env = local.env_config[local.environment]
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
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

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = local.environment
  environment_suffix = var.environment_suffix
  vpc_cidr           = local.current_env.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  project_name       = var.project_name
  environment        = local.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = local.current_env.vpc_cidr

  tags = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = local.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id

  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  environment          = local.environment
  environment_suffix   = var.environment_suffix
  db_instance_class    = local.current_env.db_instance_class
  multi_az             = local.current_env.multi_az
  deletion_protection  = local.current_env.deletion_protection
  backup_retention     = local.current_env.backup_retention
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_security_group_id = module.security_groups.db_security_group_id
  db_password          = var.db_password

  skip_final_snapshot = !local.current_env.deletion_protection

  tags = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"

  project_name         = var.project_name
  environment          = local.environment
  environment_suffix   = var.environment_suffix
  ami_id               = data.aws_ami.amazon_linux_2.id
  instance_type        = local.current_env.instance_type
  min_size             = local.current_env.asg_min_size
  max_size             = local.current_env.asg_max_size
  desired_capacity     = local.current_env.asg_desired
  private_subnet_ids   = module.vpc.private_subnet_ids
  target_group_arns    = [module.alb.target_group_arn]
  asg_security_group_id = module.security_groups.asg_security_group_id
  db_endpoint          = module.rds.db_endpoint

  tags = local.common_tags
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fintech-payment"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to prevent conflicts"
  type        = string
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
}
```

## File: lib/outputs.tf

```hcl
output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = local.current_env.vpc_cidr
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
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.alb.alb_arn
}

output "target_group_arn" {
  description = "Target Group ARN"
  value       = module.alb.target_group_arn
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = module.rds.db_instance_id
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.asg.asg_name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = module.asg.asg_arn
}
```

## File: lib/dev.tfvars

```hcl
environment_suffix = "dev-001"
```

## File: lib/staging.tfvars

```hcl
environment_suffix = "staging-001"
```

## File: lib/prod.tfvars

```hcl
environment_suffix = "prod-001"
```

## File: lib/modules/vpc/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-public-rt-${var.environment_suffix}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/modules/vpc/variables.tf

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource names"
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

variable "tags" {
  description = "Common tags to apply to all resources"
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

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## File: lib/modules/security_groups/main.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

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

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ASG Security Group
resource "aws_security_group" "asg" {
  name_prefix = "${var.project_name}-${var.environment}-asg-sg-"
  description = "Security group for Auto Scaling Group instances"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
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

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-asg-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name_prefix = "${var.project_name}-${var.environment}-db-sg-"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ASG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.asg.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/modules/security_groups/variables.tf

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/security_groups/outputs.tf

```hcl
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "asg_security_group_id" {
  description = "ASG security group ID"
  value       = aws_security_group.asg.id
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.db.id
}
```

## File: lib/modules/alb/main.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb-${var.environment_suffix}"
    }
  )
}

# Target Group
resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-${var.environment}-tg-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-tg-${var.environment_suffix}"
    }
  )
}

# HTTP Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

## File: lib/modules/alb/variables.tf

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource names"
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

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/alb/outputs.tf

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
  value       = aws_lb_target_group.app.arn
}

output "listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}
```

## File: lib/modules/rds/main.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group-${var.environment_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-subnet-group-${var.environment_suffix}"
    }
  )
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-db-${var.environment_suffix}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "paymentdb"
  username = "dbadmin"
  password = var.db_password

  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  backup_retention_period = var.backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-${var.environment_suffix}"
    }
  )
}
```

## File: lib/modules/rds/variables.tf

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
}

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group ID for database"
  type        = string
}

variable "db_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/rds/outputs.tf

```hcl
output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}
```

## File: lib/modules/asg/main.tf

```hcl
# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-${var.environment}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.asg_security_group_id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = var.db_endpoint
    environment = var.environment
  }))

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

    tags = merge(
      var.tags,
      {
        Name = "${var.project_name}-${var.environment}-instance-${var.environment_suffix}"
      }
    )
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-lt-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-${var.environment}-asg-${var.environment_suffix}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = var.target_group_arns
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg-${var.environment_suffix}"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-${var.environment}-scale-up-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-${var.environment}-scale-down-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Triggers when CPU exceeds 70%"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-high-cpu-alarm-${var.environment_suffix}"
    }
  )
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Triggers when CPU drops below 30%"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-low-cpu-alarm-${var.environment_suffix}"
    }
  )
}
```

## File: lib/modules/asg/user_data.sh

```bash
#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple health check endpoint
cat > /opt/app/health-check.sh << 'EOF'
#!/bin/bash
while true; do
  echo -e "HTTP/1.1 200 OK\n\nOK" | nc -l -p 8080 -q 1
done
EOF
chmod +x /opt/app/health-check.sh

# Create systemd service for health check
cat > /etc/systemd/system/health-check.service << EOF
[Unit]
Description=Health Check Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
ExecStart=/opt/app/health-check.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start health check service
systemctl daemon-reload
systemctl start health-check.service
systemctl enable health-check.service

# Log environment info
echo "Environment: ${environment}" > /opt/app/env.txt
echo "DB Endpoint: ${db_endpoint}" >> /opt/app/env.txt
```

## File: lib/modules/asg/variables.tf

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "target_group_arns" {
  description = "List of target group ARNs"
  type        = list(string)
}

variable "asg_security_group_id" {
  description = "Security group ID for ASG instances"
  type        = string
}

variable "db_endpoint" {
  description = "RDS database endpoint"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/modules/asg/outputs.tf

```hcl
output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.app.arn
}

output "launch_template_id" {
  description = "Launch template ID"
  value       = aws_launch_template.app.id
}

output "launch_template_latest_version" {
  description = "Latest version of launch template"
  value       = aws_launch_template.app.latest_version
}
```

## File: lib/README.md

```markdown
# Multi-Environment Terraform Infrastructure

This Terraform configuration deploys a complete multi-environment infrastructure for a fintech payment processing platform using Terraform workspaces.

## Architecture

The infrastructure consists of:

- **VPC**: Isolated network per environment with non-overlapping CIDR blocks
- **Subnets**: 2 public and 2 private subnets across 2 availability zones
- **Application Load Balancer**: Distributes traffic to EC2 instances
- **Auto Scaling Group**: Manages EC2 instances with environment-specific sizing
- **RDS PostgreSQL**: Database with Multi-AZ for production
- **Security Groups**: Network isolation between tiers
- **CloudWatch**: Monitoring and auto-scaling based on CPU metrics

## Environments

- **Development** (workspace: `dev`)
  - VPC CIDR: 10.0.0.0/16
  - Instance Type: t3.micro
  - RDS: db.t3.micro (Single-AZ)
  - ASG: 1-2 instances

- **Staging** (workspace: `staging`)
  - VPC CIDR: 10.1.0.0/16
  - Instance Type: t3.small
  - RDS: db.t3.small (Single-AZ)
  - ASG: 1-3 instances

- **Production** (workspace: `prod`)
  - VPC CIDR: 10.2.0.0/16
  - Instance Type: t3.medium
  - RDS: db.t3.medium (Multi-AZ with deletion protection)
  - ASG: 2-6 instances

## Prerequisites

1. Terraform >= 1.5.0
2. AWS CLI configured with appropriate credentials
3. S3 bucket for state storage: `fintech-terraform-state`
4. DynamoDB table for state locking: `fintech-terraform-locks`

## State Backend Setup

Create the S3 bucket and DynamoDB table:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket fintech-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket fintech-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name fintech-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Deployment

### Initialize Terraform

```bash
terraform init
```

### Deploy to Development

```bash
# Create and select dev workspace
terraform workspace new dev
terraform workspace select dev

# Plan and apply
terraform plan -var-file=dev.tfvars -var="db_password=YOUR_DEV_PASSWORD"
terraform apply -var-file=dev.tfvars -var="db_password=YOUR_DEV_PASSWORD"
```

### Deploy to Staging

```bash
# Create and select staging workspace
terraform workspace new staging
terraform workspace select staging

# Plan and apply
terraform plan -var-file=staging.tfvars -var="db_password=YOUR_STAGING_PASSWORD"
terraform apply -var-file=staging.tfvars -var="db_password=YOUR_STAGING_PASSWORD"
```

### Deploy to Production

```bash
# Create and select prod workspace
terraform workspace new prod
terraform workspace select prod

# Plan and apply
terraform plan -var-file=prod.tfvars -var="db_password=YOUR_PROD_PASSWORD"
terraform apply -var-file=prod.tfvars -var="db_password=YOUR_PROD_PASSWORD"
```

## Viewing Outputs

```bash
# View outputs for current workspace
terraform output

# View specific output
terraform output alb_dns_name
terraform output rds_endpoint
```

## Destroying Infrastructure

### Non-Production Environments

```bash
terraform workspace select dev
terraform destroy -var-file=dev.tfvars -var="db_password=YOUR_DEV_PASSWORD"
```

### Production Environment

Production RDS has deletion protection enabled. To destroy:

1. Manually disable deletion protection on RDS instance
2. Run destroy command

```bash
# Disable deletion protection first
aws rds modify-db-instance \
  --db-instance-identifier fintech-payment-prod-db-prod-001 \
  --no-deletion-protection \
  --apply-immediately

# Then destroy
terraform workspace select prod
terraform destroy -var-file=prod.tfvars -var="db_password=YOUR_PROD_PASSWORD"
```

## Workspace Management

```bash
# List workspaces
terraform workspace list

# Select workspace
terraform workspace select <workspace-name>

# Show current workspace
terraform workspace show

# Delete workspace (must be empty)
terraform workspace delete <workspace-name>
```

## Module Structure

```
lib/
├── main.tf                      # Root configuration
├── variables.tf                 # Root variables
├── outputs.tf                   # Root outputs
├── dev.tfvars                   # Development variables
├── staging.tfvars               # Staging variables
├── prod.tfvars                  # Production variables
└── modules/
    ├── vpc/                     # VPC module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security_groups/         # Security groups module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── alb/                     # Application Load Balancer module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── rds/                     # RDS database module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── asg/                     # Auto Scaling Group module
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── user_data.sh
```

## Security Considerations

- RDS passwords must be provided as variables (never commit passwords)
- Security groups follow least-privilege principle
- RDS storage is encrypted
- Production has deletion protection enabled
- IMDSv2 enforced on EC2 instances
- CloudWatch logs enabled for RDS

## Monitoring

- CloudWatch alarms for CPU-based auto-scaling
- RDS Performance Insights enabled
- RDS CloudWatch logs (postgresql, upgrade)
- Auto Scaling Group metrics enabled

## Cost Optimization

- Development and staging use smaller instance types
- Single-AZ RDS for non-production environments
- Minimal backup retention for development (1 day)
- Auto-scaling to match demand

## Troubleshooting

### State Lock Issues

If state is locked:

```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Workspace Confusion

Always verify current workspace:

```bash
terraform workspace show
```

### RDS Connection Issues

Check security group rules and ensure EC2 instances can reach RDS on port 5432.

## Support

For issues or questions, consult the Terraform documentation or AWS service guides.
```

## Deployment Instructions

1. **Initialize Backend**:
   ```bash
   # Create S3 bucket and DynamoDB table first (see README.md)
   terraform init
   ```

2. **Create Workspaces**:
   ```bash
   terraform workspace new dev
   terraform workspace new staging
   terraform workspace new prod
   ```

3. **Deploy Each Environment**:
   ```bash
   # Development
   terraform workspace select dev
   terraform apply -var-file=dev.tfvars -var="db_password=DevPassword123!"

   # Staging
   terraform workspace select staging
   terraform apply -var-file=staging.tfvars -var="db_password=StagingPassword123!"

   # Production
   terraform workspace select prod
   terraform apply -var-file=prod.tfvars -var="db_password=ProdPassword123!"
   ```

4. **View Outputs**:
   ```bash
   terraform output
   ```

The infrastructure uses Terraform workspaces to maintain separate state for each environment while using the same codebase. Environment-specific configurations are managed through tfvars files and conditional logic based on the workspace name.
