```hcl
# tap_stack.tf - Web Application Infrastructure for AWS
# This file creates a scalable, secure web application infrastructure with VPC, 
# Auto Scaling Group, Application Load Balancer, RDS MySQL database, and monitoring.

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

# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# ========================================
# Variables and Locals
# ========================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment_suffix" {
  description = "Environment suffix to avoid resource conflicts"
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "webappdb"
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "admin"
}

variable "enable_https" {
  description = "Enable HTTPS with SSL certificate"
  type        = bool
  default     = false
}

variable "ssl_certificate_arn" {
  description = "ARN of existing SSL certificate (optional)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for SSL certificate (optional)"
  type        = string
  default     = ""
}

locals {
  # Use first 2 AZs in the region
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

  common_tags = {
    Project     = "WebAppDeployment"
    Environment = "Production"
    ManagedBy   = "Terraform"
    Owner       = "Infrastructure-Team"
  }
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store RDS password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name        = "webapp-db-password${var.environment_suffix}"
  description = "Password for WebApp RDS database"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# ========================================
# VPC Configuration
# ========================================

# Create the main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "webapp-vpc${var.environment_suffix}"
  })
}

# ========================================
# Internet Gateway
# ========================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "webapp-igw${var.environment_suffix}"
  })
}

# ========================================
# Public Subnets
# ========================================

resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "webapp-public-subnet-${count.index + 1}${var.environment_suffix}"
    Type = "Public"
  })
}

# ========================================
# Private Subnets
# ========================================

resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "webapp-private-subnet-${count.index + 1}${var.environment_suffix}"
    Type = "Private"
  })
}

# ========================================
# Elastic IP for NAT Gateway
# ========================================

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "webapp-nat-eip${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ========================================
# NAT Gateway
# ========================================

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "webapp-nat-gateway${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ========================================
# Route Tables - Public
# ========================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "webapp-public-rt${var.environment_suffix}"
    Type = "Public"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ========================================
# Route Tables - Private
# ========================================

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "webapp-private-rt${var.environment_suffix}"
    Type = "Private"
  })
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ========================================
# Security Groups
# ========================================

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "webapp-alb-sg${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # HTTP access from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access from anywhere (conditional)
  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      description = "HTTPS"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  # Outbound traffic to private subnets (where web servers are)
  egress {
    description = "HTTP to web servers"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = local.private_subnet_cidrs
  }

  tags = merge(local.common_tags, {
    Name = "webapp-alb-sg${var.environment_suffix}"
  })
}

# Security Group for Web Servers
resource "aws_security_group" "web" {
  name        = "webapp-web-sg${var.environment_suffix}"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # HTTP access from public subnets (where ALB is)
  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = local.public_subnet_cidrs
  }

  # SSH access (optional - for management)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "webapp-web-sg${var.environment_suffix}"
  })
}

# Security Group for RDS Database
resource "aws_security_group" "rds" {
  name        = "webapp-rds-sg${var.environment_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # MySQL access from web servers only
  ingress {
    description     = "MySQL from web servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # No outbound rules needed for RDS
  tags = merge(local.common_tags, {
    Name = "webapp-rds-sg${var.environment_suffix}"
  })
}

# ========================================
# Security Group Rules (to avoid circular dependency)
# ========================================

# Allow ALB to communicate with web servers using security group reference
resource "aws_security_group_rule" "alb_to_web" {
  type                     = "egress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  security_group_id        = aws_security_group.alb.id
  description              = "ALB to web servers"
}

# Allow web servers to receive traffic from ALB using security group reference
resource "aws_security_group_rule" "web_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.web.id
  description              = "Web servers from ALB"
}

# ========================================
# IAM Roles and Policies
# ========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "webapp-ec2-role${var.environment_suffix}"
  path = "/"

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

# IAM Policy for CloudWatch access
resource "aws_iam_policy" "cloudwatch_policy" {
  name        = "webapp-cloudwatch-policy${var.environment_suffix}"
  path        = "/"
  description = "CloudWatch monitoring and logging permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Secrets Manager access
resource "aws_iam_policy" "secrets_policy" {
  name        = "webapp-secrets-policy${var.environment_suffix}"
  path        = "/"
  description = "Access to database secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })

  tags = local.common_tags
}

# Attach CloudWatch policy to role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_policy.arn
}

# Attach Secrets Manager policy to role
resource "aws_iam_role_policy_attachment" "ec2_secrets_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.secrets_policy.arn
}

# Attach SSM Managed Instance Core (for Session Manager)
resource "aws_iam_role_policy_attachment" "ec2_ssm_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "webapp-ec2-profile${var.environment_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# ========================================
# Application Load Balancer
# ========================================

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "webapp-alb${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "webapp-alb${var.environment_suffix}"
  })
}

# Target Group for web servers
resource "aws_lb_target_group" "web" {
  name     = "webapp-tg${var.environment_suffix}"
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

  tags = merge(local.common_tags, {
    Name = "webapp-tg${var.environment_suffix}"
  })
}

# Conditional SSL Certificate creation
resource "aws_acm_certificate" "main" {
  count = var.enable_https && var.ssl_certificate_arn == "" && var.domain_name != "" ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "webapp-cert${var.environment_suffix}"
  })
}

# Local to determine which certificate to use
locals {
  certificate_arn = var.enable_https ? (
    var.ssl_certificate_arn != "" ? var.ssl_certificate_arn : (
      length(aws_acm_certificate.main) > 0 ? aws_acm_certificate.main[0].arn : ""
    )
  ) : ""
}

# HTTP Listener - Conditional behavior based on HTTPS availability
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # If HTTPS is enabled and certificate is available, redirect to HTTPS
  # Otherwise, serve HTTP traffic directly
  default_action {
    type = var.enable_https && local.certificate_arn != "" ? "redirect" : "forward"

    # Redirect action (when HTTPS is enabled)
    dynamic "redirect" {
      for_each = var.enable_https && local.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    # Forward action (when HTTPS is disabled or no certificate)
    target_group_arn = var.enable_https && local.certificate_arn != "" ? null : aws_lb_target_group.web.arn
  }

  tags = local.common_tags
}

# HTTPS Listener - Only created if HTTPS is enabled and certificate is available
resource "aws_lb_listener" "https" {
  count = var.enable_https && local.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = local.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = local.common_tags
}

# ========================================
# Auto Scaling Group and Launch Template
# ========================================

# User data script for web servers
locals {
  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create a simple HTML page
cat > /var/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 5px; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to WebApp Deployment</h1>
            <p>Your scalable web application is running!</p>
        </div>
        <div class="content">
            <h2>System Information</h2>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>Environment:</strong> Production</p>
            <p><strong>Project:</strong> WebAppDeployment</p>
        </div>
    </div>
</body>
</html>
HTML

# Update index.html with instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)

sed -i "s/\$(curl -s http:\/\/169.254.169.254\/latest\/meta-data\/instance-id)/$INSTANCE_ID/g" /var/www/html/index.html
sed -i "s/\$(curl -s http:\/\/169.254.169.254\/latest\/meta-data\/placement\/availability-zone)/$AZ/g" /var/www/html/index.html

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'JSON'
{
  "metrics": {
    "namespace": "WebApp/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 300
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 300,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 300,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 300
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/webapp/httpd/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/webapp/httpd/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
JSON

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

EOF
  )
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "webapp-lt${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "webapp-instance${var.environment_suffix}"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "webapp-launch-template${var.environment_suffix}"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "webapp-asg${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Enable instance refresh
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "webapp-asg${var.environment_suffix}"
    propagate_at_launch = false
  }

  # Propagate common tags
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "webapp-scale-up${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "webapp-scale-down${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

# ========================================
# RDS MySQL Database
# ========================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "webapp-db-subnet-group${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "webapp-db-subnet-group${var.environment_suffix}"
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "webapp-db-params${var.environment_suffix}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  tags = merge(local.common_tags, {
    Name = "webapp-db-params${var.environment_suffix}"
  })
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier = "webapp-db${var.environment_suffix}"

  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  # Database configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp2"
  storage_encrypted    = true

  # Database credentials
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network and security
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Other settings
  skip_final_snapshot       = true
  deletion_protection      = false
  auto_minor_version_upgrade = true

  tags = merge(local.common_tags, {
    Name = "webapp-db${var.environment_suffix}"
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "webapp-rds-monitoring-role${var.environment_suffix}"

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

# Attach the enhanced monitoring policy
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ========================================
# CloudWatch Monitoring and Logging
# ========================================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "httpd_access" {
  name              = "/aws/ec2/webapp/httpd/access"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "webapp-httpd-access-logs${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_group" "httpd_error" {
  name              = "/aws/ec2/webapp/httpd/error"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "webapp-httpd-error-logs${var.environment_suffix}"
  })
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "webapp-high-cpu${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "webapp-low-cpu${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = local.common_tags
}

# ALB Target Health Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "webapp-alb-unhealthy-targets${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This alarm monitors unhealthy targets behind ALB"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

# RDS Database Connection Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "webapp-rds-high-cpu${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# RDS Database Connection Count Alarm
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "webapp-rds-high-connections${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "40"
  alarm_description   = "This metric monitors RDS connection count"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# ========================================
# Outputs
# ========================================

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

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.arn
}

output "application_url" {
  description = "URL to access the web application"
  value = var.enable_https && local.certificate_arn != "" ? (
    var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_lb.main.dns_name}"
  ) : "http://${aws_lb.main.dns_name}"
}

output "https_enabled" {
  description = "Whether HTTPS is enabled"
  value       = var.enable_https && local.certificate_arn != ""
}

output "certificate_arn_used" {
  description = "ARN of the SSL certificate being used"
  value       = local.certificate_arn
  sensitive   = false
}
```

## provider.tf

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