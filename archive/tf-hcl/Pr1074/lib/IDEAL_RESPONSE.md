# Infrastructure as Code Solution

## Terraform Configuration Files


### main.tf

```hcl
#############################################
# main.tf
# Assumptions:
# - AWS region is provided via var.aws_region (in provider.tf or variables.tf)
# - IP allow list is provided in var.allowed_cidrs
# - AMI ID provided in var.ec2_ami_id (default is latest Amazon Linux 2)
# - RDS password stored in AWS Secrets Manager or provided securely (NEVER in code)
#############################################
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # For local integration testing, switch to backend "local" in your test scripts
  # For real deployments, pass S3 backend config via `terraform init`
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
#########################
# Locals
#########################
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

#########################
# Variables
#########################
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "Turing"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "HCL"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "allowed_cidrs" {
  description = "List of CIDR blocks allowed to access RDS"
  type        = list(string)
  default     = ["10.0.10.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for application"
  type        = string
  default     = "t3.micro"
}

variable "ec2_ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-04c82466a6fab80eb"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "dbapp"
}

#########################
# VPC + Networking
#########################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = local.common_tags
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = local.common_tags
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Public subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Tier = "Public"
  })
}

# Private subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Tier = "Private"
  })
}

# NAT Gateway
resource "aws_eip" "nat" {
  tags = local.common_tags
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = local.common_tags
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = local.common_tags
}

resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = local.common_tags
}

resource "aws_route" "private_nat_access" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

#########################
# IAM Roles
#########################
resource "aws_iam_role" "ec2_role" {
  name = "${var.project}-${var.environment}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
  tags = local.common_tags
}

# Attach a managed AWS policy (avoids inline policy issues)
resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  depends_on = [aws_iam_role.ec2_role]
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-${var.environment}-instance-profile"
  role = aws_iam_role.ec2_role.name
}
#########################
# Security Groups
#########################
resource "aws_security_group" "alb_sg" {
  name        = "${var.project}-${var.environment}-alb-sg"
  description = "Allow HTTP"
  vpc_id      = aws_vpc.main.id
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
  tags = local.common_tags
}

resource "aws_security_group" "ec2_sg" {
  name        = "${var.project}-${var.environment}-ec2-sg"
  description = "Allow traffic from ALB"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Allow MySQL from allowed CIDRs"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

#########################
# S3 Buckets
#########################
resource "aws_s3_bucket" "app_data" {
  bucket = "${lower(var.project)}-${lower(var.environment)}-app-data"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${lower(var.project)}-${lower(var.environment)}-alb-logs"
  tags   = local.common_tags
}

# Explicit dependency: allow ELB to write logs
resource "aws_s3_bucket_policy" "alb_logs_policy" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSLogDeliveryWrite"
        Effect    = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Sid       = "AWSLogDeliveryAclCheck"
        Effect    = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

#########################
# ALB + Target Group + Listener
#########################
# Application Load Balancer
resource "aws_lb" "app_alb" {
  name               = lower("${var.project}-${var.environment}-alb")
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public[0].id, aws_subnet.public[1].id]
  security_groups    = [aws_security_group.alb_sg.id]

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  depends_on = [aws_s3_bucket_policy.alb_logs_policy] # Ensure bucket & policy exist first
}
resource "aws_lb_target_group" "app_tg" {
  name     = "${var.project}-${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
  }
  tags = local.common_tags
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

#########################
# Auto Scaling Group + Launch Template
#########################
resource "aws_launch_template" "app_lt" {
  name_prefix   = "${var.project}-${var.environment}-lt"
  image_id      = var.ec2_ami_id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    security_groups = [aws_security_group.ec2_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags          = local.common_tags
  }
}

resource "aws_autoscaling_group" "app_asg" {
  name                      = "${var.project}-${var.environment}-asg"
  min_size                  = 2
  max_size                  = 4
  desired_capacity          = 2
  vpc_zone_identifier       = aws_subnet.private[*].id
  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }
  target_group_arns         = [aws_lb_target_group.app_tg.arn]
  health_check_type         = "EC2"
  health_check_grace_period = 300
  tag {
    key                 = "Name"
    value               = "${var.project}-${var.environment}-ec2"
    propagate_at_launch = true
  }
}

#########################
# RDS MySQL Multi-AZ
#########################
resource "aws_db_subnet_group" "rds_subnets" {
  name       = lower("${var.project}-${var.environment}-rds-subnet-group")
  subnet_ids = aws_subnet.private[*].id
  tags       = local.common_tags
}

resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.project}-${var.environment}-db-password"
  description = "RDS master password for ${var.project} ${var.environment}"
}


resource "aws_secretsmanager_secret_version" "db_password_value" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "_%@"
}

data "aws_secretsmanager_secret" "db_password" {
  name = "${var.project}-${var.environment}-db-password"
  depends_on = [aws_secretsmanager_secret.db_password]
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
  depends_on = [aws_secretsmanager_secret_version.db_password_value]
}

resource "aws_db_instance" "mysql" {
  depends_on = [
    aws_secretsmanager_secret_version.db_password_value
  ]

  identifier              = "a-${lower(var.project)}-${lower(var.environment)}-mysql"
  allocated_storage       = 20
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  username                = var.db_username
  password                = data.aws_secretsmanager_secret_version.db_password.secret_string
  multi_az                = true
  storage_encrypted       = true
  publicly_accessible     = false
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_db_subnet_group.rds_subnets.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  deletion_protection     = false
  tags                    = local.common_tags
}

#########################
# Outputs
#########################
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = try(aws_lb.app_alb.dns_name, "pending-dns-name")
}

output "rds_endpoint" {
  description = "Endpoint of the RDS MySQL instance"
  value       = try(aws_db_instance.mysql.endpoint, "pending-endpoint")
}

output "auto_scaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = try(aws_autoscaling_group.app_asg.name, "pending-asg-name")
}

output "app_security_group_id" {
  description = "ID of the application Security Group"
  value       = try(aws_security_group.ec2_sg.id, "pending-sg-id")
}

output "alb_security_group_id" {
  description = "ID of the ALB Security Group"
  value       = try(aws_security_group.alb_sg.id, "pending-sg-id")
}

output "ec2_iam_role_name" {
  description = "Name of the IAM role attached to EC2 instances"
  value       = try(aws_iam_role.ec2_role.name, "pending-iam-role")
}
```
