<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4bb7f3b05d21c79862aaac8e024337477383dc3f
# IaC - AWS Nova Model Breaking

**Author:** ngwakoleslieelijah  
**Created:** 2025-08-14 21:08:49 UTC  
**Tool:** Terraform (HCL)  
**Target Region:** us-east-1

## Architecture Overview

This Terraform configuration creates a secure, production-ready AWS infrastructure with proper resource connectivity and security isolation. The architecture follows AWS Well-Architected Framework principles with defense-in-depth security.

```
┌─────────────────────────────────────────────────────────────────┐
│                           VPC (10.0.0.0/16)                    │
├─────────────────────┬───────────────────────┬───────────────────┤
│   Public Subnet     │   Public Subnet       │   Private Subnet  │
│   10.0.1.0/24       │   10.0.2.0/24         │   10.0.10.0/24    │
│   (us-east-1a)      │   (us-east-1b)        │   (us-east-1a)    │
│                     │                       │                   │
│   ┌─────────────┐   │   ┌─────────────┐     │   ┌─────────────┐ │
│   │     ALB     │   │   │ NAT Gateway │     │   │    EC2      │ │
│   └─────────────┘   │   └─────────────┘     │   └─────────────┘ │
└─────────────────────┼───────────────────────┼───────────────────┤
                      │                       │   Private Subnet  │
                      │                       │   10.0.20.0/24    │
                      │                       │   (us-east-1b)    │
                      │                       │                   │
                      │                       │   ┌─────────────┐ │
                      │                       │   │     RDS     │ │
                      │                       │   └─────────────┘ │
                      └───────────────────────┴───────────────────┘
```

## Project Structure

```
.
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
├── README.md
└── modules/
    ├── networking/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── compute/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── database/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── storage/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── iam/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── monitoring/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Root Configuration Files

### main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Author      = var.author
      Environment = var.environment
      CreatedDate = var.created_date
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name        = var.project_name
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones  = data.aws_availability_zones.available.names
}

# Security Module
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  kms_key_arn  = aws_kms_key.main.arn
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  route_table_ids       = module.networking.private_route_table_ids
  kms_key_arn           = aws_kms_key.main.arn
  vpc_endpoint_sg_id    = module.security.vpc_endpoint_sg_id
  ec2_instance_role_arn = module.iam.ec2_instance_role_arn
}

# Database Module
module "database" {
  source = "./modules/database"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  rds_security_group_id = module.security.rds_sg_id
  kms_key_arn           = aws_kms_key.main.arn
  db_username           = var.db_username
  db_password           = var.db_password
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.security.alb_sg_id
  ec2_security_group_id = module.security.ec2_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  kms_key_arn           = aws_kms_key.main.arn
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  kms_key_arn  = aws_kms_key.main.arn
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "author" {
  description = "Author of the project"
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "created_date" {
  description = "Creation date"
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
```

### outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = module.storage.s3_data_bucket_name
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = module.storage.s3_logs_bucket_name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}
```

### terraform.tfvars

```hcl
aws_region   = "us-east-1"
project_name = "iac-aws-nova-model-breaking"
author       = "ngwakoleslieelijah"
environment  = "production"
created_date = "2025-08-14T21:08:49Z"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

db_username = "admin"
# db_password should be set via environment variable or AWS Secrets Manager
```

## Module Configurations

### modules/networking/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
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
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-nat-gateway"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
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
    Name = "${var.project_name}-private-rt"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

### modules/networking/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}
```

### modules/networking/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = [aws_route_table.private.id]
}
```

### modules/security/main.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = var.vpc_id
  description = "Security group for Application Load Balancer"

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
    description     = "HTTP to EC2"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description     = "HTTPS to EC2"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = var.vpc_id
  description = "Security group for EC2 instances"

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
    description = "SSH from VPC only - NEVER from 0.0.0.0/0"
    from_port   = 22
    to_port     = 22
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

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS database"

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "No outbound traffic required"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
resource "aws_security_group" "vpc_endpoint" {
  name_prefix = "${var.project_name}-vpc-endpoint-"
  vpc_id      = var.vpc_id
  description = "Security group for VPC endpoints"

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

  tags = {
    Name = "${var.project_name}-vpc-endpoint-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### modules/security/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}
```

### modules/security/outputs.tf

```hcl
output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_sg_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_sg_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "vpc_endpoint_sg_id" {
  description = "ID of the VPC endpoint security group"
  value       = aws_security_group.vpc_endpoint.id
}
```

### modules/compute/main.tf

```hcl
# Data sources
data "aws_ami" "amazon_linux" {
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
  name_prefix   = "${var.project_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [var.ec2_security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type          = "gp3"
      encrypted            = true
      kms_key_id          = var.kms_key_arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-instance"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-tg"
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### modules/compute/user_data.sh

```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${project_name}</title>
</head>
<body>
    <h1>Welcome to ${project_name}</h1>
    <p>This is a secure AWS infrastructure deployment.</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
```

### modules/compute/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key"
  type        = string
}
```

### modules/compute/outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}
```

### modules/database/main.tf

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_arn

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.rds_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  enabled_cloudwatch_logs_exports = ["error", "general", "slow-query"]

  tags = {
    Name = "${var.project_name}-database"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
```
<<<<<<< HEAD
=======
# Serverless Data Processing Infrastructure

This document contains the CDKTF TypeScript code for implementing a serverless data processing pipeline using AWS services.

## Architecture Overview

The infrastructure creates:
- S3 bucket with encryption and security policies
- Lambda function for data processing
- KMS key for encryption at rest
- IAM roles and policies with least privilege
- S3 bucket notifications to trigger Lambda

## Implementation

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketNotification } from "@cdktf/provider-aws/lib/s3-bucket-notification";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { DataAwsRegion } from "@cdktf/provider-aws/lib/data-aws-region";
import { TerraformAsset, AssetType } from "cdktf";
import * as path from "path";

class ServerlessDataProcessingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider configuration for us-east-1
    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    // Data sources for account ID and region
    const current = new DataAwsCallerIdentity(this, "current");
    const currentRegion = new DataAwsRegion(this, "current-region");

    // Project prefix for consistent naming
    const projectPrefix = "projectXYZ";

    // KMS Key for S3 encryption at rest
    const s3KmsKey = new KmsKey(this, "s3-kms-key", {
      description: `${projectPrefix} S3 encryption key`,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow S3 Service",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            },
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-s3-kms-key`,
        Project: projectPrefix
      }
    });

    // KMS Key Alias for easier reference
    new KmsAlias(this, "s3-kms-key-alias", {
      name: `alias/${projectPrefix}-s3-encryption`,
      targetKeyId: s3KmsKey.keyId
    });

    // S3 Bucket for data processing
    const dataBucket = new S3Bucket(this, "data-bucket", {
      bucket: `${projectPrefix.toLowerCase()}-data-processing-${current.accountId}`,
      tags: {
        Name: `${projectPrefix}-data-processing-bucket`,
        Project: projectPrefix
      }
    });

    // S3 Bucket Server-Side Encryption Configuration
    new S3BucketServerSideEncryptionConfiguration(this, "data-bucket-encryption", {
      bucket: dataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: s3KmsKey.arn
          },
          bucketKeyEnabled: true
        }
      ]
    });

    // S3 Bucket Public Access Block - security best practice
    new S3BucketPublicAccessBlock(this, "data-bucket-pab", {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // S3 Bucket Policy to enforce HTTPS and encryption
    new S3BucketPolicy(this, "data-bucket-policy", {
      bucket: dataBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyInsecureConnections",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              dataBucket.arn,
              `${dataBucket.arn}/*`
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false"
              }
            }
          },
          {
            Sid: "DenyUnencryptedObjectUploads",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:PutObject",
            Resource: `${dataBucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                "s3:x-amz-server-side-encryption": "aws:kms"
              }
            }
          }
        ]
      })
    });

    // Lambda function code asset
    const lambdaAsset = new TerraformAsset(this, "lambda-asset", {
      path: path.resolve(__dirname, "lambda"),
      type: AssetType.ARCHIVE
    });

    // IAM Role for Lambda execution with least privilege
    const lambdaRole = new IamRole(this, "lambda-execution-role", {
      name: `${projectPrefix}-lambda-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-lambda-execution-role`,
        Project: projectPrefix
      }
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    // Custom IAM Policy for S3 and KMS access (principle of least privilege)
    const lambdaS3KmsPolicy = new IamPolicy(this, "lambda-s3-kms-policy", {
      name: `${projectPrefix}-lambda-s3-kms-policy`,
      description: "Policy for Lambda to access S3 bucket and KMS key",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            Resource: `${dataBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: s3KmsKey.arn
          },
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:log-group:/aws/lambda/${projectPrefix}-*`
          }
        ]
      }),
      tags: {
        Name: `${projectPrefix}-lambda-s3-kms-policy`,
        Project: projectPrefix
      }
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, "lambda-s3-kms-attachment", {
      role: lambdaRole.name,
      policyArn: lambdaS3KmsPolicy.arn
    });

    // Lambda function for data processing
    const dataProcessorLambda = new LambdaFunction(this, "data-processor-lambda", {
      functionName: `${projectPrefix}-data-processor`,
      filename: lambdaAsset.path,
      handler: "index.handler",
      runtime: "nodejs18.x",
      role: lambdaRole.arn,
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          BUCKET_NAME: dataBucket.bucket,
          KMS_KEY_ID: s3KmsKey.keyId,
          PROJECT_PREFIX: projectPrefix
        }
      },
      tags: {
        Name: `${projectPrefix}-data-processor`,
        Project: projectPrefix
      }
    });

    // Lambda permission to allow S3 to invoke the function
    new LambdaPermission(this, "s3-lambda-permission", {
      statementId: "AllowExecutionFromS3Bucket",
      action: "lambda:InvokeFunction",
      functionName: dataProcessorLambda.functionName,
      principal: "s3.amazonaws.com",
      sourceArn: dataBucket.arn
    });

    // S3 Bucket Notification to trigger Lambda on object creation
    new S3BucketNotification(this, "bucket-notification", {
      bucket: dataBucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: dataProcessorLambda.arn,
          events: ["s3:ObjectCreated:*"],
          filterPrefix: "input/",
          filterSuffix: ".json"
        }
      ],
      dependsOn: [dataProcessorLambda]
    });

    // Terraform Outputs
    new TerraformOutput(this, "bucket-name", {
      value: dataBucket.bucket,
      description: "Name of the S3 bucket for data processing"
    });

    new TerraformOutput(this, "lambda-function-name", {
      value: dataProcessorLambda.functionName,
      description: "Name of the Lambda function for data processing"
    });

    new TerraformOutput(this, "kms-key-id", {
      value: s3KmsKey.keyId,
      description: "KMS Key ID used for S3 encryption"
    });

    new TerraformOutput(this, "lambda-role-arn", {
      value: lambdaRole.arn,
      description: "ARN of the Lambda execution role"
    });
  }
}

// CDKTF App
const app = new App();
new ServerlessDataProcessingStack(app, "serverless-data-processing");
app.synth();
```

## Features

### Security
- **KMS Encryption**: S3 bucket encrypted at rest with customer-managed KMS key
- **IAM Least Privilege**: Lambda has minimal required permissions
- **Bucket Security**: Public access blocked, HTTPS enforced
- **Key Rotation**: KMS key rotation enabled

### Monitoring & Operations
- **Terraform Outputs**: Key resource information exposed
- **Resource Tagging**: Consistent tagging strategy
- **Environment Variables**: Configuration passed to Lambda

### Event Processing
- **S3 Triggers**: Lambda invoked on object creation in `input/` prefix
- **File Filtering**: Only processes `.json` files
- **Error Handling**: Comprehensive error handling in Lambda code

## Deployment

```bash
# Initialize CDKTF
cdktf get

# Generate Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy
```

## Resource Outputs

- `bucket-name`: S3 bucket for data processing
- `lambda-function-name`: Lambda function name
- `kms-key-id`: KMS key for encryption
- `lambda-role-arn`: Lambda execution role ARN
>>>>>>> d9c22907f0dee3f6a2dcdecdec2393589bfbe3a4
=======
>>>>>>> 4bb7f3b05d21c79862aaac8e024337477383dc3f
