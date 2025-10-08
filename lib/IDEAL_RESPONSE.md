# Multi-Tier AWS Web Application Infrastructure with Terraform

This solution provides a production-ready, highly available, and secure multi-tier AWS web application infrastructure deployed in the `us-west-2` region using Terraform HCL.

## Solution Overview

The infrastructure creates a complete AWS environment with the following components:

### 1. **Networking (VPC)**
- VPC with CIDR block `10.0.0.0/16`
- 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`) across 2 availability zones
- 2 private subnets (`10.0.10.0/24`, `10.0.11.0/24`) across 2 availability zones
- Internet Gateway for public subnet internet access
- 2 NAT Gateways (one per AZ) for private subnet outbound connectivity
- Route tables configured appropriately for public and private subnets

### 2. **S3 Storage**
- S3 bucket for storing logs with:
  - Server-side encryption using AWS KMS
  - Versioning enabled
  - Lifecycle policy to transition objects to GLACIER after 30 days
  - All public access blocked
  - `force_destroy = true` to allow cleanup during testing

### 3. **Database (RDS)**
- PostgreSQL 15 RDS instance with:
  - Multi-AZ deployment for high availability
  - KMS encryption for storage
  - Deployed in private subnets
  - Security group allowing access only from EC2 instances
  - Automated backups configured
  - Password stored in AWS Secrets Manager using `random_password`

### 4. **Compute (EC2 + Auto Scaling)**
- Launch Template with:
  - Latest Amazon Linux 2 AMI (dynamically fetched)
  - t3.micro instance type
  - EBS volumes encrypted with KMS
  - IAM instance profile attached (no hardcoded credentials)
  - User data script that:
    - Installs and configures CloudWatch agent
    - Installs and starts Apache httpd web server
    - Pushes custom CPU and memory metrics to CloudWatch
- Auto Scaling Group with:
  - Minimum 2 instances
  - Maximum 4 instances
  - Health checks via ELB
  - Deployed in private subnets

### 5. **Load Balancing (ALB)**
- Application Load Balancer with:
  - Deployed in public subnets
  - HTTP listener on port 80
  - Target group forwarding to EC2 instances
  - Health checks configured
  - Security group allowing HTTP/HTTPS from internet (0.0.0.0/0)

### 6. **Content Delivery (CloudFront)**
- CloudFront distribution with:
  - S3 logs bucket as origin
  - Origin Access Control (OAC) for secure S3 access
  - Default TTL of 86400 seconds (24 hours)
  - HTTPS redirect enabled
  - Access logging to S3 bucket

### 7. **Monitoring (CloudWatch)**
- CloudWatch alarms for:
  - CPU utilization > 75% for 5 minutes
  - Memory usage > 75% for 5 minutes
- SNS topic for alarm notifications
- Auto Scaling policies triggered by CPU alarms

### 8. **Security & Encryption**
- KMS key with automatic rotation enabled for:
  - S3 bucket encryption
  - RDS storage encryption
  - EBS volume encryption
- IAM roles and policies following least privilege:
  - EC2 instance role with CloudWatch, S3 read, and SSM permissions
  - No hardcoded credentials anywhere in the code
- Security groups with strict ingress/egress rules:
  - ALB: allows 80/443 from internet
  - EC2: allows 80 from ALB only
  - RDS: allows 5432 from EC2 only
- Secrets Manager for database password with immediate deletion (recovery_window = 0)

### 9. **Resource Identification**
- `random_id` resource for unique bucket and resource naming
- All resources tagged with `Environment = "Production"`

## Implementation

**File: `lib/tap_stack.tf`** - Complete infrastructure in a single file

The implementation includes all required Terraform resources following AWS best practices. Key highlights:

- **Provider Configuration**: AWS provider set to us-west-2 region
- **Data Sources**: Dynamic AMI lookup and availability zone discovery
- **Random Resources**: Unique naming for buckets and resources
- **Networking**: Full VPC setup with public/private subnets, IGW, NAT Gateways
- **Storage**: S3 with encryption, versioning, lifecycle policies
- **Database**: RDS PostgreSQL Multi-AZ with encryption
- **Compute**: Launch Template + Auto Scaling Group with CloudWatch agent
- **Load Balancing**: ALB with target groups and health checks
- **CDN**: CloudFront with OAC for S3 origin
- **Monitoring**: CloudWatch alarms and SNS notifications
- **Security**: KMS encryption, IAM roles, security groups, Secrets Manager

### Complete Terraform Code

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket = "my-terraform-state-bucket"
    key    = "tap-stack/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

# Data source to fetch the latest Amazon Linux 2 AMI
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

# Data source to get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# Random ID for unique resource naming
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# KMS Key for encryption with rotation
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-kms-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-2"
    Environment = var.environment
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "${var.project_name}-private-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "${var.project_name}-private-subnet-2"
    Environment = var.environment
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-1"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-2"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "${var.project_name}-nat-gateway-1"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "${var.project_name}-nat-gateway-2"
    Environment = var.environment
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
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-1"
    Environment = var.environment
  }
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-2"
    Environment = var.environment
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# S3 Bucket for logs
resource "aws_s3_bucket" "logs" {
  bucket        = "${var.project_name}-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-logs-bucket"
    Environment = var.environment
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

# S3 Bucket Policy for CloudFront OAC
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for S3 logs bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = true

  origin {
    domain_name              = aws_s3_bucket.logs.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.logs.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.logs.id}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  logging_config {
    bucket = aws_s3_bucket.logs.bucket_domain_name
    prefix = "cloudfront-logs/"
  }

  tags = {
    Name        = "${var.project_name}-cloudfront"
    Environment = var.environment
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Secrets Manager for DB password
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-db-password-${random_id.bucket_suffix.hex}"
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "tapdb"
  username = "admin"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = true
  backup_retention_period = 7
  skip_final_snapshot    = true

  tags = {
    Name        = "${var.project_name}-rds"
    Environment = var.environment
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
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
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Environment = var.environment
  }
}

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
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
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Environment = var.environment
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

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
    Name        = "${var.project_name}-ec2-role"
    Environment = var.environment
  }
}

# IAM Policy for EC2 - CloudWatch
resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name = "${var.project_name}-ec2-cloudwatch-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for EC2 - S3 Read
resource "aws_iam_role_policy" "ec2_s3" {
  name = "${var.project_name}-ec2-s3-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
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

# IAM Policy for EC2 - SSM
resource "aws_iam_role_policy" "ec2_ssm" {
  name = "${var.project_name}-ec2-ssm-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParameterHistory"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = {
    Name        = "${var.project_name}-ec2-profile"
    Environment = var.environment
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp2"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Update system
    yum update -y

    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Create CloudWatch agent config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWCONFIG'
    {
      "metrics": {
        "namespace": "TapApp",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
            ],
            "totalcpu": false,
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    CWCONFIG

    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

    # Install and start Apache
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd

    # Create a simple web page
    echo "<h1>Hello from TAP Multi-Tier Architecture</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(ec2-metadata --instance-id | cut -d ' ' -f 2)</p>" >> /var/www/html/index.html
    echo "<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d ' ' -f 2)</p>" >> /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-instance"
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-launch-template"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

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

  tags = {
    Name        = "${var.project_name}-target-group"
    Environment = var.environment
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

  tags = {
    Name        = "${var.project_name}-listener"
    Environment = var.environment
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-asg"
  desired_capacity    = 2
  min_size            = 2
  max_size            = 4
  health_check_type   = "ELB"
  health_check_grace_period = 300
  vpc_zone_identifier = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  target_group_arns   = [aws_lb_target_group.main.arn]

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-alarms"

  tags = {
    Name        = "${var.project_name}-alarms-topic"
    Environment = var.environment
  }
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Triggers when CPU exceeds 75%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Name        = "${var.project_name}-cpu-alarm"
    Environment = var.environment
  }
}

# CloudWatch Alarm - High Memory
resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${var.project_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "MEM_USED"
  namespace           = "TapApp"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Triggers when Memory exceeds 75%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = {
    Name        = "${var.project_name}-memory-alarm"
    Environment = var.environment
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm to trigger scale up
resource "aws_cloudwatch_metric_alarm" "scale_up_alarm" {
  alarm_name          = "${var.project_name}-scale-up-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Scale up when CPU exceeds 75%"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Name        = "${var.project_name}-scale-up-alarm"
    Environment = var.environment
  }
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}
```

## Deployment Commands

```bash
# Initialize Terraform
terraform init -upgrade

# Format and validate
terraform fmt
terraform validate

# Plan deployment
terraform plan -out=tfplan

# Deploy infrastructure
terraform apply tfplan

# View outputs
terraform output

# Destroy when done (empty S3 bucket first if needed)
terraform destroy -auto-approve
```

## Outputs

- `alb_dns_name`: Application Load Balancer DNS
- `cloudfront_domain_name`: CloudFront distribution domain
- `rds_endpoint`: Database connection endpoint (sensitive)
- `s3_bucket_name`: Logs bucket name
- `kms_key_arn`: KMS key ARN for encryption
- `vpc_id`: VPC identifier

## Key Features

- **High Availability**: Multi-AZ across 2 zones, redundant NAT Gateways
- **Security**: End-to-end encryption, least privilege IAM, private subnets
- **Monitoring**: Custom CloudWatch metrics, alarms, auto-scaling
- **Cost Optimization**: t3.micro instances, S3 lifecycle to GLACIER
- **Compliance**: All resources tagged, encryption enabled, audit logging

## Best Practices

- Single self-contained Terraform file as requested
- No hardcoded credentials - uses IAM roles and Secrets Manager
- Dynamic resource lookups (AMIs, AZs)
- Encryption at rest for all data stores
- Network segmentation (public/private subnets)
- Automated scaling based on metrics
- Proper tagging for resource management
- Force destroy enabled for testing/QA cleanup