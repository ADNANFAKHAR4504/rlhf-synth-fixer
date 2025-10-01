# tap_stack.tf - Complete Infrastructure Stack

```hcl

# ==========================================
# VARIABLES
# ==========================================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "self"
}

variable "department" {
  description = "Department name"
  type        = string
  default     = "businessunit"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# ==========================================
# LOCALS
# ==========================================

locals {
  common_tags = {
    Environment = var.environment
    ownership   = var.owner
    departmental = var.department
  }
  
  # Availability zones for subnet distribution
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
  
  # Subnet CIDR blocks
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  
  # Resource naming prefix
  name_prefix = lower("tap-${var.environment}")
}

# ==========================================
# DATA SOURCES
# ==========================================

# Get latest Amazon Linux 2 AMI
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

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ==========================================
# RANDOM RESOURCES
# ==========================================

# Random RDS master username
resource "random_string" "rds_username" {
  length  = 8
  special = false
  upper   = true
  lower   = true
  numeric = false
}

# Random RDS master password
resource "random_password" "rds_password" {
  length  = 16
  special = true
  # AWS RDS allows only specific special characters
  override_special = "!#$%^&*()-_=+[]{}:?"
}

# Random suffix for S3 bucket naming
resource "random_id" "s3_bucket_suffix" {
  byte_length = 4
}

# ==========================================
# NETWORKING RESOURCES
# ==========================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.private_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
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

# ==========================================
# SECURITY GROUPS
# ==========================================

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"
  
  # SSH access from specified CIDR only
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH from allowed CIDR"
  }
  
  # HTTP from ALB
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP from ALB"
  }
  
  # HTTPS from ALB
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"
  
  # MySQL access from EC2 instances only
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "MySQL from EC2 instances"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# ==========================================
# IAM RESOURCES
# ==========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"
  
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

# IAM Policy for EC2 to access S3 and Parameter Store
resource "aws_iam_policy" "ec2_policy" {
  name        = "${local.name_prefix}-ec2-policy"
  description = "Policy for EC2 instances to access S3 and SSM"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = local.common_tags
}

# Attach policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_policy" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Attach SSM managed policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = local.common_tags
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "${local.name_prefix}-cloudtrail-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# ==========================================
# S3 BUCKETS
# ==========================================

# S3 Bucket for application data
resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-data-${random_id.s3_bucket_suffix.hex}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-bucket"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for access logs
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_id.s3_bucket_suffix.hex}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
  })
}

# S3 Bucket ACL for logs
resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id
  acl    = "log-delivery-write"
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id
  
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-cloudtrail-${random_id.s3_bucket_suffix.hex}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-bucket"
  })
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ==========================================
# RDS DATABASE
# ==========================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = lower("${local.name_prefix}-db-subnet-group")
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier = lower("${local.name_prefix}-mysql-db")
  
  # Engine configuration
  engine               = "mysql"
  engine_version       = "8.0.43"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Multi-AZ for high availability
  multi_az = true
  
  # Database configuration
  db_name  = "appdb"
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  # Disable deletion protection as per requirements
  deletion_protection = false
  skip_final_snapshot = true
  
  tags = merge(local.common_tags, {
    Name = lower("${local.name_prefix}-mysql-db")
  })
}

# ==========================================
# SYSTEMS MANAGER PARAMETER STORE
# ==========================================

# Store RDS credentials in Parameter Store
resource "aws_ssm_parameter" "rds_username" {
  name  = "/${local.name_prefix}/rds/username"
  type  = "SecureString"
  value = aws_db_instance.main.username
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-username"
  })
}

resource "aws_ssm_parameter" "rds_password" {
  name  = "/${local.name_prefix}/rds/password"
  type  = "SecureString"
  value = random_password.rds_password.result
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-password"
  })
}

resource "aws_ssm_parameter" "rds_endpoint" {
  name  = "/${local.name_prefix}/rds/endpoint"
  type  = "String"
  value = aws_db_instance.main.endpoint
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-endpoint"
  })
}

# ==========================================
# APPLICATION LOAD BALANCER
# ==========================================

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
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
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg"
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
}

# ==========================================
# LAUNCH TEMPLATE & AUTO SCALING
# ==========================================

# Launch Template for EC2 instances
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }
  
  # Ensure no public IP
  network_interfaces {
    associate_public_ip_address = false
    delete_on_termination      = true
  }
  
  # Enable encryption for root volume
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted            = true
      delete_on_termination = true
    }
  }
  
  # User data for basic setup
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-efs-utils
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${local.name_prefix}</h1>" > /var/www/html/index.html
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-volume"
    })
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-launch-template"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${local.name_prefix}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
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
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${local.name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${local.name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# ==========================================
# CLOUDWATCH ALARMS
# ==========================================

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
  
  tags = local.common_tags
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${local.name_prefix}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "120"
  statistic          = "Average"
  threshold          = "20"
  alarm_description  = "This metric monitors ec2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
  
  tags = local.common_tags
}

# ==========================================
# CLOUDTRAIL
# ==========================================

# CloudTrail for auditing
resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ==========================================
# EBS LIFECYCLE MANAGER
# ==========================================

# IAM Role for DLM
resource "aws_iam_role" "dlm" {
  name = "${local.name_prefix}-dlm-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# DLM Policy attachment
resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

# DLM Lifecycle Policy for EBS Snapshots
resource "aws_dlm_lifecycle_policy" "ebs_snapshots" {
  description        = "DLM lifecycle policy for EBS snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state             = "ENABLED"
  
  policy_details {
    resource_types = ["VOLUME"]
    
    schedule {
      name = "Daily snapshots"
      
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times        = ["23:45"]
      }
      
      retain_rule {
        count = 7
      }
      
      tags_to_add = {
        SnapshotCreator = "DLM"
      }
      
      copy_tags = true
    }
    
    target_tags = local.common_tags
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dlm-policy"
  })
}

# ==========================================
# OUTPUTS
# ==========================================

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

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.main.db_name
}

output "rds_username_parameter" {
  description = "SSM Parameter Store path for RDS username"
  value       = aws_ssm_parameter.rds_username.name
}

output "rds_password_parameter" {
  description = "SSM Parameter Store path for RDS password"
  value       = aws_ssm_parameter.rds_password.name
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "ec2_security_group_id" {
  description = "ID of EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of RDS security group"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "ID of ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_iam_role_name" {
  description = "Name of EC2 IAM role"
  value       = aws_iam_role.ec2.name
}

output "ec2_iam_role_arn" {
  description = "ARN of EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "cloudtrail_iam_role_arn" {
  description = "ARN of CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.arn
}

output "dlm_lifecycle_policy_id" {
  description = "ID of DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.ebs_snapshots.id
}

output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux_2.id
}

output "elastic_ip_addresses" {
  description = "Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

```

# provider.tf

```hcl

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
  region = var.aws_region
}

```
