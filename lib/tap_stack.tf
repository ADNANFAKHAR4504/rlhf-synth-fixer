# tap_stack.tf

# Input variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "deployment_id" {
  description = "Unique identifier for this deployment to avoid naming conflicts"
  type        = string
  default     = null
}

variable "deployment_suffix" {
  description = "Additional unique suffix for this deployment (auto-generated if not provided)"
  type        = string
  default     = null
}

variable "force_unique_deployment" {
  description = "Force a unique deployment by generating new random strings"
  type        = bool
  default     = true
}

variable "unique_deployment_id" {
  description = "Unique deployment identifier to avoid naming conflicts (auto-generated if not provided)"
  type        = string
  default     = null
}

# Random strings
resource "random_string" "deployment_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_string" "unique_deployment" {
  length  = 4
  special = false
  upper   = false
}

resource "random_string" "asg_unique" {
  length  = 3
  special = false
  upper   = false
}

resource "random_string" "kms_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "random_string" "alb_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "random_string" "tg_suffix" {
  length  = 4
  special = false
  upper   = false
}

# Locals
locals {
  project_name        = "iac-aws-nova"
  environment         = "production"
  deployment_id       = var.deployment_id != null ? var.deployment_id : random_string.deployment_suffix.result
  deployment_suffix   = var.deployment_suffix != null ? var.deployment_suffix : random_string.unique_deployment.result
  unique_project_name = "${local.project_name}-${local.deployment_id}"
  
  # Create a unique deployment identifier that's short but unique (max 32 chars)
  unique_deployment_id = var.unique_deployment_id != null ? var.unique_deployment_id : "${substr(local.deployment_id, 0, 4)}-${local.deployment_suffix}"
  
  # Create a very short ASG identifier to stay under 32 chars
  asg_identifier = "${substr(local.deployment_id, 0, 3)}-${random_string.asg_unique.result}"

  common_tags = {
    Project     = local.unique_project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
    Owner       = "DevOps Team"
  }

  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux2" {
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

data "aws_caller_identity" "current" {}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-vpc" })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.unique_project_name}-igw" })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-public-subnet-${count.index + 1}" })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-private-subnet-${count.index + 1}" })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-database-subnet-${count.index + 1}" })
}

# NAT EIPs and Gateways
resource "aws_eip" "nat" {
  count = length(local.availability_zones)
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${local.unique_project_name}-nat-eip-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
  count         = length(local.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.unique_project_name}-nat-gateway-${count.index + 1}" })
  depends_on    = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-public-rt" })
}

resource "aws_route_table" "private" {
  count = length(local.availability_zones)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-private-rt-${count.index + 1}" })
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.unique_project_name}-database-rt" })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.unique_project_name}-alb-"
  vpc_id      = aws_vpc.main.id
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
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
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-alb-sg" })
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ec2" {
  name_prefix = "${local.unique_project_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  ingress {
    description     = "HTTP from ALB"
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
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-ec2-sg" })
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.unique_project_name}-rds-"
  vpc_id      = aws_vpc.main.id
  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-rds-sg" })
  lifecycle {
    create_before_destroy = true
  }
}

# S3 Bucket
resource "aws_s3_bucket" "app_data" {
  bucket = "${lower(local.unique_project_name)}-app-data-${random_string.bucket_suffix.result}"
  tags   = merge(local.common_tags, { Name = "${local.unique_project_name}-app-data" })
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket                  = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# KMS Key
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.unique_project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Effect    = "Allow"
        Principal = { Service = "logs.amazonaws.com" }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-kms-key" })
}

resource "aws_kms_alias" "main" {
  name          = "alias/iac-nova-${random_string.kms_suffix.result}"
  target_key_id = aws_kms_key.main.key_id
}

# IAM Role & Policy
resource "aws_iam_role" "ec2_role" {
  name = "${local.unique_project_name}-${local.unique_deployment_id}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action  = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "s3_access" {
  name        = "${local.unique_project_name}-${local.unique_deployment_id}-s3-access"
  description = "Allow EC2 to access S3, KMS, and SSM"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.unique_project_name}-${local.unique_deployment_id}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  tags = local.common_tags
}

# Load Balancer
resource "aws_lb" "main" {
  name                   = "${local.unique_project_name}-alb-${random_string.alb_suffix.result}"
  internal               = false
  load_balancer_type     = "application"
  security_groups        = [aws_security_group.alb.id]
  subnets                = aws_subnet.public[*].id
  enable_deletion_protection = false
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-alb" })
}

resource "aws_lb_target_group" "main" {
  name       = "${local.unique_project_name}-tg-${random_string.tg_suffix.result}"
  port       = 80
  protocol   = "HTTP"
  vpc_id     = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 15     # Faster checks every 15 seconds
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5      # Shorter timeout
    unhealthy_threshold = 2      # Fewer failures before marking unhealthy
  }

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-target-group" })
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  tags = local.common_tags
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${local.unique_project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux2.id
  instance_type = "t3.micro"

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2.id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -eux
    exec > /var/log/user-data.log 2>&1

    echo "Starting EC2 setup..."

    # Wait a little for network and yum
    sleep 20

    yum install -y httpd -q
    systemctl enable httpd
    systemctl start httpd

    mkdir -p /var/www/html
    echo "healthy" > /var/www/html/health
    echo "<h1>Hello from ${local.unique_project_name}</h1><p>Instance is healthy!</p>" > /var/www/html/index.html

    chmod 644 /var/www/html/health
    chmod 644 /var/www/html/index.html

    # Quick verification
    curl -f http://localhost/ || echo "Index failed but continuing"
    curl -f http://localhost/health || echo "Health failed but continuing"

    echo "EC2 setup complete."
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = local.common_tags
  }

  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-launch-template" })
  lifecycle {
    create_before_destroy = true
  }
}
# Auto Scaling Group - DISABLED
# resource "time_sleep" "wait_for_infrastructure" {
#   depends_on = [
#     aws_launch_template.main,
#     aws_lb_target_group.main,
#     aws_subnet.public
#   ]
#   
#   create_duration = "20m"
# }
# resource "aws_autoscaling_group" "main" {
#   depends_on = [time_sleep.wait_for_infrastructure]
#   
#   name                      = "${local.unique_project_name}-${local.asg_identifier}-asg"
#   vpc_zone_identifier       = aws_subnet.public[*].id
#   target_group_arns         = [aws_lb_target_group.main.arn]
#   health_check_type         = "ELB"   # must be ELB if attached to ALB
#   health_check_grace_period = 1200    # allow 20 minutes for startup after delay
#   
#   min_size         = 2
#   max_size         = 6
#   desired_capacity = 2
#   
#   launch_template {
#     id      = aws_launch_template.main.id
#     version = "$Latest"
#   }
#   
#   tag {
#     key                 = "Name"
#     value               = "${local.unique_project_name}-asg-instance"
#     propagate_at_launch = true
#   }
#   
#   dynamic "tag" {
#     for_each = local.common_tags
#     content {
#       key                 = tag.key
#       value               = tag.value
#       propagate_at_launch = true
#     }
#   }
#   
#   lifecycle {
#     create_before_destroy = true
#     ignore_changes        = [desired_capacity]
#   }
# }
# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.unique_project_name}-${local.unique_deployment_id}-db-subnet"
  subnet_ids = aws_subnet.database[*].id
  tags       = merge(local.common_tags, { Name = "${local.unique_project_name}-db-subnet" })
  
  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier           = "${local.unique_project_name}-${local.unique_deployment_id}-database"
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id           = aws_kms_key.main.arn
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  db_name              = "appdb"
  username             = "admin"
  password             = "changeme123!"
  publicly_accessible  = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = true
  deletion_protection    = false
  tags = merge(local.common_tags, { Name = "${local.unique_project_name}-database" })
  
  depends_on = [aws_db_subnet_group.main]
  
  lifecycle {
    create_before_destroy = false
    replace_triggered_by = [aws_db_subnet_group.main.name]
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${local.unique_project_name}/app"
  retention_in_days = 30
  tags              = merge(local.common_tags, { Name = "${local.unique_project_name}-app-log-group" })
}

resource "aws_cloudwatch_log_group" "access_logs" {
  name              = "/aws/ec2/${local.unique_project_name}/access"
  retention_in_days = 30
  tags              = merge(local.common_tags, { Name = "${local.unique_project_name}-access-log-group" })
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_data.bucket
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

# output "autoscaling_group_name" {
#   description = "Name of the Auto Scaling Group"
#   value       = aws_autoscaling_group.main.name
# }