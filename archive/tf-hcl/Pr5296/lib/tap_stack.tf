# tap_stack.tf

# Variables
variable "env" {
  type        = string
  description = "Environment name"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "name" {
  type        = string
  description = "Service/project name"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDR blocks"
  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Must provide exactly 2 public subnet CIDRs"
  }
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDR blocks"
  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Must provide exactly 2 private subnet CIDRs"
  }
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
}

variable "db_allocated_storage" {
  type        = number
  description = "DB allocated storage in GB"
}

variable "db_engine_version" {
  type        = string
  description = "PostgreSQL engine version"
}

variable "db_username" {
  type        = string
  description = "Database master username"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}

# Data Sources
data "aws_availability_zones" "this" {
  state = "available"
}

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# Locals
locals {
  instance_type = var.instance_type
  db_allocated  = var.db_allocated_storage
  azs           = slice(data.aws_availability_zones.this.names, 0, 2)
  tags          = merge(var.common_tags, { Environment = title(var.env) })
}

# VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IP for NAT
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-nat-eip"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-nat"
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-public-rt"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-private-rt"
  })
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.name}-${var.env}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-alb-sg"
  })
}

# App Security Group
resource "aws_security_group" "app" {
  name        = "${var.name}-${var.env}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-app-sg"
  })
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.name}-${var.env}-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-db-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "this" {
  name               = "${var.name}-${var.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "this" {
  name_prefix = substr("${var.name}-${var.env}-", 0, 6)
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "this" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

# Launch Template
resource "aws_launch_template" "this" {
  name_prefix   = "${var.name}-${var.env}-lt-"
  image_id      = data.aws_ssm_parameter.al2023.value
  instance_type = local.instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "${var.name}-${var.env}-instance"
    })
  }

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-launch-template"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "this" {
  name                      = "${var.name}-${var.env}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.this.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  desired_capacity = 2
  min_size         = 2
  max_size         = 4

  launch_template {
    id      = aws_launch_template.this.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.name}-${var.env}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = title(var.env)
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-${var.env}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "this" {
  identifier     = "${var.name}-${var.env}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version

  instance_class    = "db.t3.medium"
  allocated_storage = local.db_allocated
  storage_encrypted = true
  storage_type      = "gp3"

  db_name  = replace("${var.name}_${var.env}", "-", "_")
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.this.name

  publicly_accessible     = false
  multi_az                = false
  skip_final_snapshot     = true
  deletion_protection     = var.env == "prod" ? true : false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  tags = merge(local.tags, {
    Name = "${var.name}-${var.env}-db"
  })
}

# Outputs
output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "alb_arn" {
  value = aws_lb.this.arn
}

output "alb_dns_name" {
  value = aws_lb.this.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.this.arn
}

output "asg_name" {
  value = aws_autoscaling_group.this.name
}

output "rds_endpoint" {
  value = aws_db_instance.this.endpoint
}

output "rds_arn" {
  value = aws_db_instance.this.arn
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}

