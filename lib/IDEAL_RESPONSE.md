```hcl

# tap_stack.tf - Complete Infrastructure Stack Configuration

# ===========================
# VARIABLES
# ===========================

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "min_size" {
  description = "Minimum size for Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum size for Auto Scaling Group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired capacity for Auto Scaling Group"
  type        = number
  default     = 3
}

# ===========================
# LOCALS
# ===========================

locals {
  # Generate random suffix for resource naming
  random_suffix = lower(substr(replace(uuid(), "-", ""), 0, 4))
  
  # Common tags for all resources
  common_tags = {
    environment = "prd"
    ManagedBy   = "terraform"
    Timestamp   = timestamp()
  }
  
  # Resource naming conventions
  name_prefix = "tap"
  vpc_name    = "${local.name_prefix}-vpc-${local.random_suffix}"
  igw_name    = "${local.name_prefix}-igw-${local.random_suffix}"
  nat_name    = "${local.name_prefix}-nat-${local.random_suffix}"
  sg_name     = "${local.name_prefix}-sg-${local.random_suffix}"
  alb_name    = "${local.name_prefix}-alb-${local.random_suffix}"
  asg_name    = "${local.name_prefix}-asg-${local.random_suffix}"
  rds_name    = "${local.name_prefix}-rds-${local.random_suffix}"
  s3_name     = "${local.name_prefix}-static-${local.random_suffix}"
  cf_name     = "${local.name_prefix}-cdn-${local.random_suffix}"
  role_name   = "${local.name_prefix}-role-${local.random_suffix}"
  
  # Subnet CIDR blocks
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  db_subnet_cidrs      = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
}

# ===========================
# DATA SOURCES
# ===========================

# Get latest Amazon Linux 2 AMI
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

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ===========================
# NETWORKING RESOURCES
# ===========================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = local.vpc_name
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = local.igw_name
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.nat_name}-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-${local.random_suffix}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-${local.random_suffix}"
    Type = "private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-${count.index + 1}-${local.random_suffix}"
    Type = "database"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.nat_name}-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt-${local.random_suffix}"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}-${local.random_suffix}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ===========================
# SECURITY GROUPS
# ===========================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.sg_name}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from internet"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.sg_name}-alb"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${local.sg_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.sg_name}-ec2"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${local.sg_name}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "Allow MySQL/Aurora access from EC2"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.sg_name}-rds"
  })
}

# ===========================
# IAM ROLES AND POLICIES
# ===========================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.role_name}-ec2"
  
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
  
  tags = local.common_tags
}

# IAM Policy for EC2 instances (least privilege)
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.role_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "arn:aws:kms:${var.region}:${data.aws_caller_identity.current.account_id}:key/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.static.arn,
          "${aws_s3_bucket.static.arn}/*"
        ]
      }
    ]
  })
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.role_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  
  tags = local.common_tags
}

# ===========================
# KMS KEYS
# ===========================

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-${local.random_suffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds-${local.random_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# ===========================
# RDS DATABASE
# ===========================

# Random username generation
resource "random_string" "rds_username" {
  length  = 8
  special = false
  numeric = false
  upper   = true
  lower   = true
}

# Random password generation
resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.rds_name}-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.rds_name}-subnet-group"
  })
}

# RDS Instance - Primary
resource "aws_rds_cluster" "main" {
  cluster_identifier      = local.rds_name
  engine                  = "aurora-mysql"
  engine_mode            = "provisioned"
  engine_version         = "8.0.mysql_aurora.3.02.0"
  database_name          = "tapdb"
  master_username        = "a${random_string.rds_username.result}"
  master_password        = random_password.rds_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  storage_encrypted               = true
  kms_key_id                     = aws_kms_key.rds.arn
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  
  tags = merge(local.common_tags, {
    Name = local.rds_name
  })
}

# RDS Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${local.rds_name}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.rds_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  
  auto_minor_version_upgrade = true
  
  tags = merge(local.common_tags, {
    Name = "${local.rds_name}-instance-${count.index + 1}"
  })
}

# IAM Role for RDS Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.role_name}-rds-monitoring"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "${local.name_prefix}-rds-credentials-${local.random_suffix}"
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-credentials-${local.random_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_rds_cluster.main.endpoint
    port     = 3306
    dbname   = "tapdb"
  })
}

# Store credentials in Parameter Store
resource "aws_ssm_parameter" "rds_username" {
  name   = "/${local.name_prefix}/rds/username"
  type   = "SecureString"
  value  = "a${random_string.rds_username.result}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-username"
  })
}

resource "aws_ssm_parameter" "rds_password" {
  name   = "/${local.name_prefix}/rds/password"
  type   = "SecureString"
  value  = random_password.rds_password.result
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-password"
  })
}

# ===========================
# LAUNCH TEMPLATE
# ===========================

# Launch Template for Auto Scaling
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux2.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }
  
  monitoring {
    enabled = true
  }
  
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Start httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Create sample page
    echo "<h1>TAP Stack - Instance in $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-${local.random_suffix}"
    })
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-volume-${local.random_suffix}"
    })
  }
  
  tags = local.common_tags
}

# ===========================
# LOAD BALANCER
# ===========================

# Application Load Balancer
resource "aws_lb" "main" {
  name               = local.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb"
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = local.alb_name
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg-${local.random_suffix}"
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
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-${local.random_suffix}"
  })
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
  
  tags = local.common_tags
}

# ===========================
# AUTO SCALING
# ===========================

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = local.asg_name
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance-${local.random_suffix}"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "environment"
    value               = "prd"
    propagate_at_launch = true
  }
  
  depends_on = [aws_lb.main]
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${local.name_prefix}-scale-up-${local.random_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${local.name_prefix}-scale-down-${local.random_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.name_prefix}-cpu-high-${local.random_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "70"
  alarm_description  = "This metric monitors EC2 CPU utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
  
  tags = local.common_tags
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${local.name_prefix}-cpu-low-${local.random_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "20"
  alarm_description  = "This metric monitors EC2 CPU utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
  
  tags = local.common_tags
}

# ===========================
# S3 BUCKETS
# ===========================

# S3 Bucket for Static Content
resource "aws_s3_bucket" "static" {
  bucket = local.s3_name
  
  tags = merge(local.common_tags, {
    Name = local.s3_name
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-${local.random_suffix}"
  })
}


# S3 Bucket Encryption for Logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Lifecycle for Logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ===========================
# CLOUDFRONT DISTRIBUTION
# ===========================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${local.s3_name}"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled    = true
  comment            = "CDN for ${local.s3_name}"
  default_root_object = "index.html"
  price_class        = "PriceClass_100"
  
  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "S3-${local.s3_name}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${local.alb_name}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${local.s3_name}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${local.alb_name}"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
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
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }
  
  tags = merge(local.common_tags, {
    Name = local.cf_name
  })
}

# ===========================
# CLOUDWATCH LOG GROUPS
# ===========================

# Log Group for Application
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

# Log Group for RDS
resource "aws_cloudwatch_log_group" "rds_error" {
  name              = "/aws/rds/cluster/${local.rds_name}/error"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-error-logs"
  })
}

resource "aws_cloudwatch_log_group" "rds_general" {
  name              = "/aws/rds/cluster/${local.rds_name}/general"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-general-logs"
  })
}

resource "aws_cloudwatch_log_group" "rds_slowquery" {
  name              = "/aws/rds/cluster/${local.rds_name}/slowquery"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-slowquery-logs"
  })
}

# ===========================
# OUTPUTS
# ===========================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the Target Group"
  value       = aws_lb_target_group.main.arn
}

output "auto_scaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.main.id
}

output "rds_cluster_identifier" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "secrets_manager_secret_id" {
  description = "ID of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.id
}

output "ssm_parameter_username" {
  description = "SSM Parameter Store path for RDS username"
  value       = aws_ssm_parameter.rds_username.name
}

output "ssm_parameter_password" {
  description = "SSM Parameter Store path for RDS password"
  value       = aws_ssm_parameter.rds_password.name
}

output "s3_static_bucket_name" {
  description = "Name of the S3 bucket for static content"
  value       = aws_s3_bucket.static.id
}

output "s3_static_bucket_arn" {
  description = "ARN of the S3 bucket for static content"
  value       = aws_s3_bucket.static.arn
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ec2_iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "rds_monitoring_role_arn" {
  description = "ARN of the IAM role for RDS monitoring"
  value       = aws_iam_role.rds_monitoring.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ec2_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "cloudwatch_log_group_application" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "cloudwatch_log_group_rds_error" {
  description = "Name of the RDS error CloudWatch log group"
  value       = aws_cloudwatch_log_group.rds_error.name
}

output "amazon_linux2_ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux2.id
}

output "resource_suffix" {
  description = "Random suffix used for resource naming"
  value       = local.random_suffix
}

output "region" {
  description = "aws region"
  value       = var.region
}

```

```
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.region
}
```
