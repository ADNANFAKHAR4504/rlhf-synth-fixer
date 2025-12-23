# Multi-Environment Infrastructure Deployment

I'll create a Terraform configuration that deploys identical infrastructure across dev, staging, and production environments with environment-specific variations.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix  # Issue 1: Using suffix instead of environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}
```

## File: variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  # Issue 2: Missing validation for environment values
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "multi-env-app"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 2
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = true
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "asg_min_size" {
  description = "Min ASG size"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Max ASG size"
  type        = number
  default     = 3
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_multi_az" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "Backup retention days"
  type        = number
  default     = 7
}

variable "s3_versioning_enabled" {
  description = "Enable S3 versioning"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 7
}

# Issue 3: Missing CI/CD metadata variables (repository, commit_author, pr_number, team)
```

## File: tap_stack.tf

```hcl
# Multi-Environment Infrastructure

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "igw-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Type = "private"
  }
}

# NAT Gateway - Issue 4: Missing conditional EIP creation
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? var.az_count : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Issue 5: EIP resource should be here but checking if NAT is enabled

# Route Table for Public Subnets
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

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  # Issue 6: Missing dynamic route block for conditional NAT gateway routing

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Issue 7: Missing HTTPS ingress rule

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }
}

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name        = "ec2-sg-${var.environment_suffix}"
  description = "Security group for EC2"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Issue 8: Missing SSH ingress rule

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-sg-${var.environment_suffix}"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "ec2-role-${var.environment_suffix}"

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
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# Issue 9: Missing IAM role policy for CloudWatch and S3 access

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2.name
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-${var.environment_suffix}"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "tg-${var.environment_suffix}"
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "lt-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.ec2.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.environment} environment</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "ec2-${var.environment_suffix}"
      Environment = var.environment
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "asg-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "rds-subnet-group-${var.environment_suffix}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier             = "rds-${var.environment_suffix}"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp3"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.db_multi_az
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = var.db_backup_retention_days

  deletion_protection = false

  tags = {
    Name = "rds-${var.environment_suffix}"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "app" {
  bucket = "app-storage-${var.environment_suffix}"

  tags = {
    Name = "app-storage-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id

  versioning_configuration {
    status = var.s3_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Issue 10: Missing S3 lifecycle configuration

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/app/${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "app-logs-${var.environment_suffix}"
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app.id
}
```

## File: dev.tfvars

```hcl
environment        = "dev"
environment_suffix = "dev-001"
project_name       = "multi-env-app"

vpc_cidr           = "10.0.0.0/16"
az_count           = 2
enable_nat_gateway = false

instance_type        = "t3.micro"
asg_min_size         = 1
asg_max_size         = 2
asg_desired_capacity = 1

db_instance_class         = "db.t3.micro"
db_allocated_storage      = 20
db_name                   = "appdb"
db_username               = "admin"
db_multi_az               = false
db_backup_retention_days  = 1

s3_versioning_enabled = false
log_retention_days    = 7
```

## File: staging.tfvars

```hcl
environment        = "staging"
environment_suffix = "staging-001"
project_name       = "multi-env-app"

vpc_cidr           = "10.1.0.0/16"
az_count           = 2
enable_nat_gateway = true

instance_type        = "t3.small"
asg_min_size         = 1
asg_max_size         = 4
asg_desired_capacity = 2

db_instance_class         = "db.t3.small"
db_allocated_storage      = 50
db_name                   = "appdb"
db_username               = "admin"
db_multi_az               = true
db_backup_retention_days  = 7

s3_versioning_enabled = true
log_retention_days    = 14
```

## File: prod.tfvars

```hcl
environment        = "prod"
environment_suffix = "prod-001"
project_name       = "multi-env-app"

vpc_cidr           = "10.2.0.0/16"
az_count           = 3
enable_nat_gateway = true

instance_type        = "t3.medium"
asg_min_size         = 2
asg_max_size         = 6
asg_desired_capacity = 3

db_instance_class         = "db.t3.medium"
db_allocated_storage      = 100
db_name                   = "appdb"
db_username               = "admin"
db_multi_az               = true
db_backup_retention_days  = 30

s3_versioning_enabled = true
log_retention_days    = 30
```

## Deployment Instructions

To deploy to each environment:

```bash
# Get AMI ID
export TF_VAR_ami_id=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

# Set database password
# export TF_VAR_db_password="<set-your-secure-password-here>"

# For dev environment
terraform init -backend-config="key=multi-env/dev/terraform.tfstate"
terraform apply -var-file="lib/dev.tfvars"

# For staging environment
terraform init -backend-config="key=multi-env/staging/terraform.tfstate" -reconfigure
terraform apply -var-file="lib/staging.tfvars"

# For prod environment
terraform init -backend-config="key=multi-env/prod/terraform.tfstate" -reconfigure
terraform apply -var-file="lib/prod.tfvars"
```

This creates identical infrastructure across all three environments with environment-specific sizing and configuration.
