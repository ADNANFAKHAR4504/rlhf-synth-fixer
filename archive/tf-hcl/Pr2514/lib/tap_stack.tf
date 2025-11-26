# Complete Production AWS Web App Infrastructure
# This file contains all resources needed for a production web application
# including VPC, ALB, Auto Scaling, RDS, S3, CloudFront, and monitoring

#==============================================================================
# VARIABLES - ALL WITH DEFAULT VALUES
#==============================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "key_name" {
  description = "EC2 Key Pair name (optional)"
  type        = string
  default     = null
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = "admin@example.com"
}

#==============================================================================
# DATA SOURCES
#==============================================================================

# Get latest Amazon Linux 2 AMI
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

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

#==============================================================================
# RANDOM RESOURCES FOR UNIQUE NAMING
#==============================================================================

resource "random_string" "resource_suffix" {
  length  = 8
  special = false
  upper   = false
}

#==============================================================================
# NETWORKING - VPC, SUBNETS, GATEWAYS
#==============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-${random_string.resource_suffix.result}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw-${random_string.resource_suffix.result}"
  }
}

# Public Subnets (for ALB and NAT Gateways)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}-${random_string.resource_suffix.result}"
    Type = "Public"
  }
}

# Private Subnets (for EC2 instances)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}-${random_string.resource_suffix.result}"
    Type = "Private"
  }
}

# Database Subnets (for RDS)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-database-subnet-${count.index + 1}-${random_string.resource_suffix.result}"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}-${random_string.resource_suffix.result}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-gw-${count.index + 1}-${random_string.resource_suffix.result}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt-${random_string.resource_suffix.result}"
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}-${random_string.resource_suffix.result}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

#==============================================================================
# SECURITY GROUPS
#==============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg-${random_string.resource_suffix.result}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-${var.environment}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from VPC"
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
    Name = "${var.project_name}-${var.environment}-web-sg-${random_string.resource_suffix.result}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-${var.environment}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    description     = "MySQL/Aurora from web servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-db-sg-${random_string.resource_suffix.result}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

#==============================================================================
# IAM ROLES AND POLICIES
#==============================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-${var.environment}-ec2-role-${random_string.resource_suffix.result}"

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
    Name = "${var.project_name}-${var.environment}-ec2-role-${random_string.resource_suffix.result}"
  }
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile-${random_string.resource_suffix.result}"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-profile-${random_string.resource_suffix.result}"
  }
}

# Policy for EC2 instances to access S3 and CloudWatch
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-${var.environment}-ec2-policy-${random_string.resource_suffix.result}"
  role = aws_iam_role.ec2_role.id

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
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-role-${random_string.resource_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-monitoring-role-${random_string.resource_suffix.result}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

#==============================================================================
# S3 BUCKET AND CLOUDFRONT
#==============================================================================

# S3 Bucket for static assets
resource "aws_s3_bucket" "static_assets" {
  bucket_prefix = "${var.project_name}-${var.environment}-static-${random_string.resource_suffix.result}-"

  tags = {
    Name = "${var.project_name}-${var.environment}-static-assets-${random_string.resource_suffix.result}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "static_assets" {
  name                              = "${var.project_name}-${var.environment}-oac-${random_string.resource_suffix.result}"
  description                       = "OAC for ${var.project_name} static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "static_assets" {
  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets.id
    origin_id                = "S3-${aws_s3_bucket.static_assets.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} static assets"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static_assets.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for API calls (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${aws_s3_bucket.static_assets.bucket}"
    compress               = true
    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront-${random_string.resource_suffix.result}"
  }
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

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
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static_assets.arn
          }
        }
      }
    ]
  })
}

#==============================================================================
# DATABASE (RDS)
#==============================================================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group-${random_string.resource_suffix.result}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group-${random_string.resource_suffix.result}"
  }
}

# Random password for RDS - exclude characters not allowed by RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# AWS Secrets Manager secret for DB password
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.project_name}-${var.environment}-db-password-${random_string.resource_suffix.result}"
  description = "Database password for ${var.project_name} ${var.environment}"

  tags = {
    Name = "${var.project_name}-${var.environment}-db-password-${random_string.resource_suffix.result}"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-db-${random_string.resource_suffix.result}"

  # Engine options
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database
  db_name  = replace("${var.project_name}${var.environment}", "-", "")
  username = "admin"
  password = random_password.db_password.result

  # Network & Security
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false

  # Backup & Maintenance
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Multi-AZ for high availability
  multi_az = true

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights (not supported on db.t3.micro)
  performance_insights_enabled = var.db_instance_class != "db.t3.micro"

  # Deletion protection for production
  deletion_protection = false # Set to true for production

  # Final snapshot
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot-${random_string.resource_suffix.result}"
  skip_final_snapshot       = true # Set to false for production

  tags = {
    Name = "${var.project_name}-${var.environment}-database-${random_string.resource_suffix.result}"
  }

  depends_on = [aws_db_subnet_group.main]
}

#==============================================================================
# APPLICATION LOAD BALANCER
#==============================================================================

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb-${random_string.resource_suffix.result}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Set to true for production

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-${random_string.resource_suffix.result}"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "web" {
  name     = "${substr("${var.project_name}-${var.environment}", 0, 15)}-tg-${random_string.resource_suffix.result}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-web-tg-${random_string.resource_suffix.result}"
  }
}

# ALB Listener (HTTP) - Redirects to HTTPS if certificate available, otherwise forwards
resource "aws_lb_listener" "web_http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = var.domain_name != "" ? "redirect" : "forward"
    target_group_arn = var.domain_name == "" ? aws_lb_target_group.web.arn : null
    
    dynamic "redirect" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-http-listener-${random_string.resource_suffix.result}"
  }
}

# SSL certificate (only created if domain_name is provided)
resource "aws_acm_certificate" "main" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert-${random_string.resource_suffix.result}"
  }
}

# ALB Listener (HTTPS) - only created if domain_name is provided
resource "aws_lb_listener" "web_https" {
  count             = var.domain_name != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-https-listener-${random_string.resource_suffix.result}"
  }
}

#==============================================================================
# LAUNCH TEMPLATE AND AUTO SCALING
#==============================================================================

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "${var.project_name}-${var.environment}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data_template.sh", {
    db_secret_arn  = aws_secretsmanager_secret.db_password.arn
    s3_bucket_name = aws_s3_bucket.static_assets.bucket
    cloudfront_url = aws_cloudfront_distribution.static_assets.domain_name
    project_name   = var.project_name
    environment    = var.environment
    aws_region     = var.aws_region
    log_group_name = aws_cloudwatch_log_group.app_logs.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-${var.environment}-web-server-${random_string.resource_suffix.result}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-launch-template-${random_string.resource_suffix.result}"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                      = "${var.project_name}-${var.environment}-asg-${random_string.resource_suffix.result}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.web.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Instance refresh settings
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg-${random_string.resource_suffix.result}"
    propagate_at_launch = false
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-${var.environment}-scale-up-${random_string.resource_suffix.result}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-${var.environment}-scale-down-${random_string.resource_suffix.result}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

#==============================================================================
# CLOUDWATCH MONITORING AND ALARMS
#==============================================================================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${var.project_name}-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-logs-${random_string.resource_suffix.result}"
  }
}

# SNS Topic for Notifications
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts-${random_string.resource_suffix.result}"

  tags = {
    Name = "${var.project_name}-${var.environment}-alerts-${random_string.resource_suffix.result}"
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu-${random_string.resource_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn, aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-high-cpu-alarm-${random_string.resource_suffix.result}"
  }
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-low-cpu-${random_string.resource_suffix.result}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 low cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-low-cpu-alarm-${random_string.resource_suffix.result}"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-${random_string.resource_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-cpu-alarm-${random_string.resource_suffix.result}"
  }
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-connections-${random_string.resource_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "40"
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-connections-alarm-${random_string.resource_suffix.result}"
  }
}

# CloudWatch Alarm - ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-${random_string.resource_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-response-time-alarm-${random_string.resource_suffix.result}"
  }
}

#==============================================================================
# USER DATA SCRIPT FILE
#==============================================================================

resource "local_file" "user_data" {
  filename = "${path.module}/user_data.sh"
  content = templatefile("${path.module}/user_data_template.sh", {
    db_secret_arn  = aws_secretsmanager_secret.db_password.arn
    s3_bucket_name = aws_s3_bucket.static_assets.bucket
    cloudfront_url = aws_cloudfront_distribution.static_assets.domain_name
    project_name   = var.project_name
    environment    = var.environment
    aws_region     = var.aws_region
    log_group_name = aws_cloudwatch_log_group.app_logs.name
  })
}

#==============================================================================
# OUTPUTS
#==============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "nat_gateway_ips" {
  description = "Elastic IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "application_url" {
  description = "URL to access the application"
  value       = "https://${aws_lb.main.dns_name}"
}

output "cloudfront_url" {
  description = "CloudFront URL for static assets"
  value       = "https://${aws_cloudfront_distribution.static_assets.domain_name}"
}

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    application_url   = "https://${aws_lb.main.dns_name}"
    cloudfront_url    = "https://${aws_cloudfront_distribution.static_assets.domain_name}"
    s3_bucket         = aws_s3_bucket.static_assets.bucket
    database_endpoint = aws_db_instance.main.endpoint
    vpc_id            = aws_vpc.main.id
    region            = var.aws_region
    environment       = var.environment
  }
}
