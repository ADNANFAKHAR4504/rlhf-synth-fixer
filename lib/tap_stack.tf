# Multi-Environment Infrastructure Stack
# Deploys identical infrastructure to dev, staging, and prod environments

# Data sources
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
    ManagedBy   = "terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "igw-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
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
    Name        = "public-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "private-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Type        = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? var.az_count : 0
  domain = "vpc"

  tags = {
    Name        = "nat-eip-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? var.az_count : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "nat-gateway-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-rt-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = {
    Name        = "private-rt-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment}-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "alb-sg-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name        = "ec2-sg-${var.environment}-${var.environment_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTP from ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "Allow SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "ec2-sg-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Security Group for RDS
# Commented out: RDS service not enabled in LocalStack
# resource "aws_security_group" "rds" {
#   name        = "rds-sg-${var.environment}-${var.environment_suffix}"
#   description = "Security group for RDS database"
#   vpc_id      = aws_vpc.main.id
#
#   ingress {
#     from_port       = 3306
#     to_port         = 3306
#     protocol        = "tcp"
#     security_groups = [aws_security_group.ec2.id]
#     description     = "Allow MySQL access from EC2"
#   }
#
#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#     description = "Allow all outbound traffic"
#   }
#
#   tags = {
#     Name        = "rds-sg-${var.environment}-${var.environment_suffix}"
#     Environment = var.environment
#     Project     = var.project_name
#     ManagedBy   = "terraform"
#   }
# }

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name = "ec2-role-${var.environment}-${var.environment_suffix}"

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
    Name        = "ec2-role-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# IAM Role Policy for EC2 (CloudWatch and S3 access)
resource "aws_iam_role_policy" "ec2" {
  name = "ec2-policy-${var.environment}-${var.environment_suffix}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app.arn,
          "${aws_s3_bucket.app.arn}/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-profile-${var.environment}-${var.environment_suffix}"
  role = aws_iam_role.ec2.name

  tags = {
    Name        = "ec2-profile-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  # Explicitly disable access logs for LocalStack compatibility
  access_logs {
    enabled = false
  }

  tags = {
    Name        = "alb-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "tg-${var.environment}-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

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
    Name        = "tg-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
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

# Launch Template for Auto Scaling
resource "aws_launch_template" "main" {
  name_prefix   = "lt-${var.environment}-${var.environment_suffix}-"
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
      Name        = "ec2-${var.environment}-${var.environment_suffix}"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }

  tags = {
    Name        = "lt-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "asg-${var.environment}-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
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
    value               = "asg-instance-${var.environment}-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "terraform"
    propagate_at_launch = true
  }
}

# RDS Subnet Group
# Commented out: RDS service not enabled in LocalStack
# resource "aws_db_subnet_group" "main" {
#   name       = "rds-subnet-group-${var.environment}-${var.environment_suffix}"
#   subnet_ids = aws_subnet.private[*].id
#
#   tags = {
#     Name        = "rds-subnet-group-${var.environment}-${var.environment_suffix}"
#     Environment = var.environment
#     Project     = var.project_name
#     ManagedBy   = "terraform"
#   }
# }

# RDS Instance
# Commented out: RDS service not enabled in LocalStack
# resource "aws_db_instance" "main" {
#   identifier             = "rds-${var.environment}-${var.environment_suffix}"
#   engine                 = "mysql"
#   engine_version         = "8.0"
#   instance_class         = var.db_instance_class
#   allocated_storage      = var.db_allocated_storage
#   storage_type           = "gp2"
#   db_name                = var.db_name
#   username               = var.db_username
#   password               = var.db_password
#   parameter_group_name   = "default.mysql8.0"
#   db_subnet_group_name   = aws_db_subnet_group.main.name
#   vpc_security_group_ids = [aws_security_group.rds.id]
#
#   multi_az                = false
#   publicly_accessible     = false
#   skip_final_snapshot     = true
#   backup_retention_period = 0
#
#   deletion_protection = false
#
#   tags = {
#     Name        = "rds-${var.environment}-${var.environment_suffix}"
#     Environment = var.environment
#     Project     = var.project_name
#     ManagedBy   = "terraform"
#   }
# }

# S3 Bucket for Application Storage
resource "aws_s3_bucket" "app" {
  bucket = "app-storage-${var.environment}-${var.environment_suffix}"

  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id

  versioning_configuration {
    status = var.s3_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/app/${var.environment}-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "app-logs-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
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

# Commented out: RDS service not enabled in LocalStack
# output "rds_endpoint" {
#   description = "RDS endpoint"
#   value       = aws_db_instance.main.endpoint
# }

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app.id
}
