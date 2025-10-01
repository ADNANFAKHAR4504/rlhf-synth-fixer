# tap_stack.tf - Complete infrastructure stack for us-west-1

```hcl

# ==================== VARIABLES ====================
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "tapstack"
}

# ==================== DATA SOURCES ====================
# Fetch available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# Fetch latest Amazon Linux 2 AMI
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

# ==================== LOCALS ====================
locals {
  # Generate unique 4-byte suffix for resources
  suffix = "k9x2"
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Region      = var.aws_region
  }
  
  # Network configuration
  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 2)
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ==================== RANDOM RESOURCES ====================
# Generate random username for RDS (8 chars, starts with letter)
resource "random_string" "rds_username" {
  length  = 7
  special = false
  upper   = false
  numeric = true
}

# Generate random password for RDS (16 chars with allowed special characters)
resource "random_password" "rds_password" {
  length  = 16
  special = true
  # AWS RDS allows these special characters: !#$%&*()_+=:?
  override_special = "!#$%&*()_+=:?"
}

# ==================== NETWORKING RESOURCES ====================
# VPC creation
resource "aws_vpc" "main_vpc" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${local.suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main_igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = merge(local.common_tags, {
    Name = "igw-${local.suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_eips" {
  count  = 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "nat_gws" {
  count         = 2
  allocation_id = aws_eip.nat_eips[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = merge(local.common_tags, {
    Name = "nat-gw-${count.index + 1}-${local.suffix}"
  })

  depends_on = [aws_internet_gateway.main_igw]
}

# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${local.suffix}"
  })
}

# Private Route Tables
resource "aws_route_table" "private_rt" {
  count  = 2
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gws[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${count.index + 1}-${local.suffix}"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public_rta" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_rta" {
  count          = 2
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rt[count.index].id
}

# ==================== SECURITY GROUPS ====================
# ALB Security Group
resource "aws_security_group" "alb_sg" {
  name_prefix = "alb-sg-${local.suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
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

  tags = merge(local.common_tags, {
    Name = "alb-sg-${local.suffix}"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name_prefix = "ec2-sg-${local.suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "ec2-sg-${local.suffix}"
  })
}

# RDS Security Group
resource "aws_security_group" "rds_sg" {
  name_prefix = "rds-sg-${local.suffix}-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "rds-sg-${local.suffix}"
  })
}

# ==================== IAM RESOURCES ====================
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-role-${local.suffix}"

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

# IAM Policy for EC2 instances (least privilege for RDS and S3 access)
resource "aws_iam_role_policy" "ec2_policy" {
  name = "ec2-policy-${local.suffix}"
  role = aws_iam_role.ec2_role.id

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
          aws_s3_bucket.static_content.arn,
          "${aws_s3_bucket.static_content.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-profile-${local.suffix}"
  role = aws_iam_role.ec2_role.name
}

# ==================== S3 BUCKET ====================
# S3 Bucket for static content
resource "aws_s3_bucket" "static_content" {
  bucket = "static-content-${local.suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "static-content-${local.suffix}"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_content_versioning" {
  bucket = aws_s3_bucket.static_content.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_content_encryption" {
  bucket = aws_s3_bucket.static_content.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_content_pab" {
  bucket = aws_s3_bucket.static_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for CloudFront or ALB access
resource "aws_s3_bucket_policy" "static_content_policy" {
  bucket = aws_s3_bucket.static_content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEC2Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.static_content.arn,
          "${aws_s3_bucket.static_content.arn}/*"
        ]
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_content_pab]
}

# ==================== SECRETS MANAGER ====================
# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "rds-credentials-${local.suffix}"
  recovery_window_in_days = 0 # Immediate deletion for testing

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_credentials_version" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id

  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
  })
}

# ==================== RDS DATABASE ====================
# DB Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group-${local.suffix}"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "rds-subnet-group-${local.suffix}"
  })
}

# RDS Multi-AZ MySQL Instance
resource "aws_db_instance" "main_rds" {
  identifier     = "rds-instance-${local.suffix}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database configuration
  db_name  = "tapstackdb"
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false

  # Multi-AZ for high availability
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Security and maintenance
  auto_minor_version_upgrade = true
  deletion_protection        = false
  skip_final_snapshot        = true

  tags = merge(local.common_tags, {
    Name = "rds-instance-${local.suffix}"
  })
}

# ==================== APPLICATION LOAD BALANCER ====================
# ALB
resource "aws_lb" "main_alb" {
  name               = "alb-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(local.common_tags, {
    Name = "alb-${local.suffix}"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main_tg" {
  name     = "tg-${local.suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name = "tg-${local.suffix}"
  })
}

# ALB Listener
resource "aws_lb_listener" "main_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_tg.arn
  }
}

# ==================== LAUNCH TEMPLATE ====================
# Launch Template for Auto Scaling
resource "aws_launch_template" "app_lt" {
  name_prefix   = "app-lt-${local.suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>TapStack Instance - ${local.suffix}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "asg-instance-${local.suffix}"
    })
  }
}

# ==================== AUTO SCALING ====================
# Auto Scaling Group
resource "aws_autoscaling_group" "app_asg" {
  name               = "asg-${local.suffix}"
  vpc_zone_identifier = aws_subnet.private_subnets[*].id
  target_group_arns  = [aws_lb_target_group.main_tg.arn]

  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-${local.suffix}"
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
  name                   = "scale-up-${local.suffix}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app_asg.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down-${local.suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app_asg.name
}

# ==================== CLOUDWATCH ALARMS ====================
# CloudWatch Alarm for High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_asg.name
  }
}

# CloudWatch Alarm for Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "low-cpu-${local.suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_asg.name
  }
}

# CloudWatch Alarm for RDS CPU
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "rds-high-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_rds.id
  }
}

# CloudWatch Alarm for ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "alb-unhealthy-hosts-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when we have any unhealthy hosts"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main_tg.arn_suffix
    LoadBalancer = aws_lb.main_alb.arn_suffix
  }
}

# ==================== ROUTE 53 ====================
# Route 53 Hosted Zone
resource "aws_route53_zone" "main_zone" {
  name = "tapstacknew.com"

  tags = merge(local.common_tags, {
    Name = "route53-zone-${local.suffix}"
  })
}

# Route 53 Health Check for ALB
resource "aws_route53_health_check" "alb_health" {
  fqdn              = aws_lb.main_alb.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.common_tags, {
    Name = "alb-health-check-${local.suffix}"
  })
}

# Route 53 A Record for ALB
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main_zone.zone_id
  name    = "www.tapstacknew.com"
  type    = "A"

  alias {
    name                   = aws_lb.main_alb.dns_name
    zone_id                = aws_lb.main_alb.zone_id
    evaluate_target_health = true
  }

  set_identifier = "Primary"

  health_check_id = aws_route53_health_check.alb_health.id

  failover_routing_policy {
    type = "PRIMARY"
  }
}

# Route 53 Root Domain Record
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main_zone.zone_id
  name    = "tapstacknew.com"
  type    = "A"

  alias {
    name                   = aws_lb.main_alb.dns_name
    zone_id                = aws_lb.main_alb.zone_id
    evaluate_target_health = true
  }
}

# ==================== OUTPUTS ====================
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main_vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main_vpc.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private_subnets[*].id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = aws_security_group.alb_sg.id
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = aws_security_group.ec2_sg.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds_sg.id
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main_rds.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main_rds.db_name
}

output "rds_secrets_arn" {
  description = "ARN of the secrets manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for static content"
  value       = aws_s3_bucket.static_content.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.static_content.arn
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main_alb.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main_alb.arn
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.main_tg.arn
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main_zone.zone_id
}

output "route53_name_servers" {
  description = "Name servers for the Route 53 hosted zone"
  value       = aws_route53_zone.main_zone.name_servers
}

output "route53_domain_name" {
  description = "Domain name configured in Route 53"
  value       = aws_route53_zone.main_zone.name
}

# Auto Scaling Outputs
output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app_asg.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app_lt.id
}

# AMI Output
output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux_2.id
}

output "ami_name" {
  description = "Name of the AMI used"
  value       = data.aws_ami.amazon_linux_2.name
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_high_cpu" {
  description = "Name of high CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}

output "cloudwatch_alarm_low_cpu" {
  description = "Name of low CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.low_cpu.alarm_name
}

output "cloudwatch_alarm_rds_cpu" {
  description = "Name of RDS CPU CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.rds_cpu.alarm_name
}

output "cloudwatch_alarm_alb_unhealthy" {
  description = "Name of ALB unhealthy hosts CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.alb_unhealthy_hosts.alarm_name
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.nat_gws[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = aws_eip.nat_eips[*].public_ip
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main_igw.id
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
