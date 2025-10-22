# Production-grade AWS Web Application Infrastructure
# This configuration follows security best practices including:
# - Private S3 bucket with versioning
# - VPC network isolation with public/private subnet separation
# - Least-privilege IAM policies
# - Security groups with minimal exposure
# - Auto Scaling for high availability
# - Load balancing for traffic distribution

terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Configure the AWS Provider for us-east-1 region
provider "aws" {
  region = "us-east-1"
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Variables for configuration
variable "environment_suffix" {
  description = "Environment suffix for resource naming to prevent conflicts across deployments"
  type        = string
  default     = ""
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI for us-east-1
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

# S3 Bucket Configuration with versioning and block public access
# Security: All public access is blocked by default
resource "aws_s3_bucket" "app_bucket" {
  bucket_prefix = "webapp-secure-bucket-${var.environment_suffix}-"

  tags = {
    Name        = "WebApp-Secure-Storage"
    Environment = "Production"
  }
}

# Enable versioning for data protection and recovery
resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access to S3 bucket - security best practice
resource "aws_s3_bucket_public_access_block" "app_bucket_pab" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for EC2 instances with S3 access
# Security: Following least-privilege principle
resource "aws_iam_role" "ec2_s3_role" {
  name = "webapp-ec2-s3-role-${var.environment_suffix}"

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
    Name = "WebApp-EC2-S3-Role"
  }
}

# IAM Policy for S3 bucket access - restricted to specific bucket only
resource "aws_iam_policy" "s3_bucket_policy" {
  name        = "webapp-s3-bucket-policy-${var.environment_suffix}"
  description = "Policy for EC2 instances to access S3 bucket"

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
          aws_s3_bucket.app_bucket.arn,
          "${aws_s3_bucket.app_bucket.arn}/*"
        ]
      }
    ]
  })
}

# Attach S3 policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_s3_policy_attachment" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_bucket_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "webapp-ec2-instance-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_s3_role.name
}

# VPC Configuration - Network isolation for security
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "WebApp-VPC"
  }
}

# Internet Gateway for public subnet internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "WebApp-IGW"
  }
}

# Public Subnet 1 in first AZ
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "WebApp-Public-Subnet-1"
    Type = "Public"
  }
}

# Public Subnet 2 in second AZ
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "WebApp-Public-Subnet-2"
    Type = "Public"
  }
}

# Private Subnet 1 in first AZ
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "WebApp-Private-Subnet-1"
    Type = "Private"
  }
}

# Private Subnet 2 in second AZ
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "WebApp-Private-Subnet-2"
    Type = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "WebApp-NAT-EIP"
  }
}

# NAT Gateway for private subnet internet access
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name = "WebApp-NAT-Gateway"
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
    Name = "WebApp-Public-RT"
  }
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "WebApp-Private-RT"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

# Security Group for Web Servers - Only allow HTTP traffic
# Security: Minimal exposure with specific port access only
resource "aws_security_group" "web_sg" {
  name        = "webapp-web-sg-${var.environment_suffix}"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from anywhere - required for web application
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic for updates and external API calls
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "WebApp-Web-SG"
  }
}

# Launch Template for Auto Scaling Group
resource "aws_launch_template" "web_lt" {
  name_prefix   = "webapp-launch-template-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # User data script to install web server
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Web Server in $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "WebApp-Instance"
    }
  }
}

# Application Load Balancer for traffic distribution
resource "aws_lb" "web_lb" {
  name               = "webapp-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "WebApp-ALB"
  }
}

# Target Group for Load Balancer
resource "aws_lb_target_group" "web_tg" {
  name     = "webapp-tg-${var.environment_suffix}"
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
    Name = "WebApp-TG"
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "web_listener" {
  load_balancer_arn = aws_lb.web_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}

# Auto Scaling Group for high availability
resource "aws_autoscaling_group" "web_asg" {
  name                      = "webapp-asg-${var.environment_suffix}"
  vpc_zone_identifier       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  target_group_arns         = [aws_lb_target_group.web_tg.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.web_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "WebApp-ASG-Instance"
    propagate_at_launch = true
  }
}

# EC2 Instance 1 with Elastic IP (for direct access if needed)
resource "aws_instance" "web_1" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server 1 - Direct Access</h1>" > /var/www/html/index.html
  EOF

  tags = {
    Name = "WebApp-Instance-1"
  }
}

# EC2 Instance 2 with Elastic IP (for direct access if needed)
resource "aws_instance" "web_2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_2.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server 2 - Direct Access</h1>" > /var/www/html/index.html
  EOF

  tags = {
    Name = "WebApp-Instance-2"
  }
}

# Elastic IPs for EC2 instances
resource "aws_eip" "web_1_eip" {
  instance = aws_instance.web_1.id
  domain   = "vpc"

  tags = {
    Name = "WebApp-Instance-1-EIP"
  }
}

resource "aws_eip" "web_2_eip" {
  instance = aws_instance.web_2.id
  domain   = "vpc"

  tags = {
    Name = "WebApp-Instance-2-EIP"
  }
}

# Attach EC2 Instance 1 to Target Group
resource "aws_lb_target_group_attachment" "web_1_tg_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.web_1.id
  port             = 80
}

# Attach EC2 Instance 2 to Target Group
resource "aws_lb_target_group_attachment" "web_2_tg_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.web_2.id
  port             = 80
}

# Outputs for reference
output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.web_lb.dns_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_bucket.id
}

output "instance_1_public_ip" {
  description = "Public IP of instance 1"
  value       = aws_eip.web_1_eip.public_ip
}

output "instance_2_public_ip" {
  description = "Public IP of instance 2"
  value       = aws_eip.web_2_eip.public_ip
}