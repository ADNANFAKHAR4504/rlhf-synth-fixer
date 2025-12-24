# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-stack"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "tapdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "enable_pro_features" {
  description = "Enable features requiring LocalStack Pro (ALB, RDS, EFS)"
  type        = bool
  default     = false
}

# Locals
locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev"

  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    ManagedBy         = "Terraform"
    EnvironmentSuffix = local.environment_suffix
    CreatedAt         = timestamp()
  }

  name_prefix = "${var.project_name}-${local.environment_suffix}"

  # Use only 2 AZs for eu-north-1 (it only has 3 AZs and RDS might have limitations)
  azs = slice(data.aws_availability_zones.available.names, 0, min(2, length(data.aws_availability_zones.available.names)))

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  db_subnet_cidrs      = ["10.0.21.0/24", "10.0.22.0/24"]

  # Conditional EFS values for user_data
  efs_file_system_id  = var.enable_pro_features ? aws_efs_file_system.main[0].id : ""
  efs_access_point_id = var.enable_pro_features ? aws_efs_access_point.app_data[0].id : ""
}

# Data Sources
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

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

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
  count = length(local.azs)

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
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(local.azs)

  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })
}

# Route Tables - Public
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

# Route Tables - Private
resource "aws_route_table" "private" {
  count = length(local.azs)

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
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group - ALB
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

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
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - RDS
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - EFS
resource "aws_security_group" "efs" {
  name_prefix = "${local.name_prefix}-efs-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EFS file system"

  ingress {
    description     = "NFS from EC2"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-efs-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name_prefix = "${local.name_prefix}-ec2-role-"

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

# IAM Policy for EC2 instances (minimal permissions)
resource "aws_iam_role_policy" "ec2_policy" {
  name_prefix = "${local.name_prefix}-ec2-policy-"
  role        = aws_iam_role.ec2_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${local.name_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeFileSystems"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "arn:aws:events:${var.aws_region}:*:event-bus/${local.name_prefix}-*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "${local.name_prefix}-ec2-profile-"
  role        = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd mysql amazon-efs-utils aws-cli

# Conditionally mount EFS file system if enabled
EFS_FILE_SYSTEM_ID="${local.efs_file_system_id}"
EFS_ACCESS_POINT_ID="${local.efs_access_point_id}"

if [ -n "$EFS_FILE_SYSTEM_ID" ] && [ -n "$EFS_ACCESS_POINT_ID" ]; then
  mkdir -p /mnt/efs
  echo "$EFS_FILE_SYSTEM_ID.efs.${var.aws_region}.amazonaws.com:/ /mnt/efs efs defaults,_netdev,tls,accesspoint=$EFS_ACCESS_POINT_ID" >> /etc/fstab
  mount -a
  # Create shared application data directory
  mkdir -p /mnt/efs/shared-data
  mkdir -p /mnt/efs/logs
fi

# Start and enable Apache HTTP server
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Create a basic index page
cat > /var/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Stack Application</title>
</head>
<body>
    <h1>Welcome to TAP Stack</h1>
    <p>Application is running successfully!</p>
    <p>Environment: ${local.environment_suffix}</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>EFS Mount Status: $(mount | grep efs || echo "Not mounted")</p>
</body>
</html>
HTML

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 644 /var/www/html

# Create a script to send custom events to EventBridge
cat > /usr/local/bin/send-app-event.sh << 'SCRIPT'
#!/bin/bash
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
aws events put-events \
  --entries Source="${local.name_prefix}-app",DetailType="Application Event",Detail="{\"instance-id\":\"$INSTANCE_ID\",\"event\":\"application-started\",\"timestamp\":\"$(date -Iseconds)\"}" \
  --region ${var.aws_region}
SCRIPT

chmod +x /usr/local/bin/send-app-event.sh

# Send startup event
/usr/local/bin/send-app-event.sh

# Ensure httpd starts properly
systemctl restart httpd
EOF
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer (requires LocalStack Pro)
resource "aws_lb" "main" {
  count              = var.enable_pro_features ? 1 : 0
  name               = substr("${local.name_prefix}-alb-v2", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = local.common_tags
}

# ALB Target Group (requires LocalStack Pro)
resource "aws_lb_target_group" "main" {
  count    = var.enable_pro_features ? 1 : 0
  name     = substr("${local.name_prefix}-tg", 0, 32)
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

# ALB Listener (requires LocalStack Pro)
resource "aws_lb_listener" "main" {
  count             = var.enable_pro_features ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[0].arn
  }
}

# Auto Scaling Group (requires LocalStack Pro)
resource "aws_autoscaling_group" "main" {
  count                     = var.enable_pro_features ? 1 : 0
  name                      = "${local.name_prefix}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main[0].arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Subnet Group (requires LocalStack Pro)
resource "aws_db_subnet_group" "main" {
  count      = var.enable_pro_features ? 1 : 0
  name       = substr(lower("${local.name_prefix}-db-subnet"), 0, 255)
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Parameter Group (requires LocalStack Pro)
resource "aws_db_parameter_group" "main" {
  count  = var.enable_pro_features ? 1 : 0
  family = "mysql8.0"
  name   = substr(lower("${local.name_prefix}-db-params"), 0, 255)

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  tags = local.common_tags
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Store DB password in Systems Manager Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${local.name_prefix}/db/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = local.common_tags
}

# RDS Instance (requires LocalStack Pro)
resource "aws_db_instance" "main" {
  count      = var.enable_pro_features ? 1 : 0
  identifier = substr(lower("${local.name_prefix}-db"), 0, 63)

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  parameter_group_name   = aws_db_parameter_group.main[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  performance_insights_enabled = false
  monitoring_interval          = 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

# EFS File System (requires LocalStack Pro)
resource "aws_efs_file_system" "main" {
  count          = var.enable_pro_features ? 1 : 0
  creation_token = "${local.name_prefix}-efs"
  encrypted      = true
  kms_key_id     = aws_kms_key.efs.arn

  performance_mode                = "generalPurpose"
  throughput_mode                 = "provisioned"
  provisioned_throughput_in_mibps = 100

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  lifecycle_policy {
    transition_to_primary_storage_class = "AFTER_1_ACCESS"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-efs"
  })
}

# KMS Key for EFS encryption
resource "aws_kms_key" "efs" {
  description             = "KMS key for EFS encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-efs-key"
  })
}

resource "aws_kms_alias" "efs" {
  name          = "alias/${local.name_prefix}-efs"
  target_key_id = aws_kms_key.efs.key_id
}

# EFS Mount Targets (requires LocalStack Pro)
resource "aws_efs_mount_target" "main" {
  count = var.enable_pro_features ? length(aws_subnet.private) : 0

  file_system_id  = aws_efs_file_system.main[0].id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# EFS Access Point for application data (requires LocalStack Pro)
resource "aws_efs_access_point" "app_data" {
  count          = var.enable_pro_features ? 1 : 0
  file_system_id = aws_efs_file_system.main[0].id

  posix_user {
    gid = 1000
    uid = 1000
  }

  root_directory {
    path = "/app-data"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-data-access-point"
  })
}

# EventBridge Custom Bus
resource "aws_cloudwatch_event_bus" "app_events" {
  name = "${local.name_prefix}-app-events"

  tags = local.common_tags
}

# EventBridge Rule - ASG Events (requires LocalStack Pro)
resource "aws_cloudwatch_event_rule" "asg_events" {
  count          = var.enable_pro_features ? 1 : 0
  name           = "${local.name_prefix}-asg-events"
  description    = "Capture Auto Scaling Group events"
  event_bus_name = aws_cloudwatch_event_bus.app_events.name

  event_pattern = jsonencode({
    source      = ["aws.autoscaling"]
    detail-type = ["EC2 Instance Launch Successful", "EC2 Instance Terminate Successful"]
    detail = {
      AutoScalingGroupName = [aws_autoscaling_group.main[0].name]
    }
  })

  tags = local.common_tags
}

# EventBridge Rule - Application Events
resource "aws_cloudwatch_event_rule" "app_events" {
  name           = "${local.name_prefix}-custom-app-events"
  description    = "Capture custom application events"
  event_bus_name = aws_cloudwatch_event_bus.app_events.name

  event_pattern = jsonencode({
    source = ["${local.name_prefix}-app"]
  })

  tags = local.common_tags
}

# CloudWatch Log Group for EventBridge
resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/events/${local.name_prefix}"
  retention_in_days = 14

  tags = local.common_tags
}

# EventBridge Target - CloudWatch Logs for ASG Events (requires LocalStack Pro)
resource "aws_cloudwatch_event_target" "asg_logs" {
  count          = var.enable_pro_features ? 1 : 0
  rule           = aws_cloudwatch_event_rule.asg_events[0].name
  event_bus_name = aws_cloudwatch_event_bus.app_events.name
  target_id      = "ASGEventsLogTarget"
  arn            = aws_cloudwatch_log_group.eventbridge_logs.arn
}

# EventBridge Target - CloudWatch Logs for App Events
resource "aws_cloudwatch_event_target" "app_logs" {
  rule           = aws_cloudwatch_event_rule.app_events.name
  event_bus_name = aws_cloudwatch_event_bus.app_events.name
  target_id      = "AppEventsLogTarget"
  arn            = aws_cloudwatch_log_group.eventbridge_logs.arn
}

# IAM Role for EventBridge to write to CloudWatch Logs
resource "aws_iam_role" "eventbridge_logs_role" {
  name_prefix = "${local.name_prefix}-eb-logs-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_logs_policy" {
  name_prefix = "${local.name_prefix}-eb-logs-"
  role        = aws_iam_role.eventbridge_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = aws_cloudwatch_log_group.eventbridge_logs.arn
      }
    ]
  })
}

# IAM Role for RDS Enhanced Monitoring (removed since not supported in eu-north-1 with t3.micro)

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 14

  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
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

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = var.enable_pro_features ? aws_lb.main[0].arn : ""
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = var.enable_pro_features ? aws_lb.main[0].dns_name : ""
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = var.enable_pro_features ? aws_lb.main[0].zone_id : ""
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = var.enable_pro_features ? aws_autoscaling_group.main[0].arn : ""
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = var.enable_pro_features ? aws_autoscaling_group.main[0].name : ""
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = var.enable_pro_features ? aws_db_instance.main[0].endpoint : ""
}

output "rds_port" {
  description = "RDS instance port"
  value       = var.enable_pro_features ? aws_db_instance.main[0].port : 0
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = var.enable_pro_features ? aws_db_instance.main[0].id : ""
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

output "kms_key_arn" {
  description = "ARN of the KMS key used for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "iam_role_ec2_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "db_parameter_ssm_name" {
  description = "SSM parameter name for database password"
  value       = aws_ssm_parameter.db_password.name
}

output "efs_file_system_id" {
  description = "ID of the EFS file system"
  value       = var.enable_pro_features ? aws_efs_file_system.main[0].id : ""
}

output "efs_file_system_dns_name" {
  description = "DNS name of the EFS file system"
  value       = var.enable_pro_features ? aws_efs_file_system.main[0].dns_name : ""
}

output "efs_access_point_id" {
  description = "ID of the EFS access point"
  value       = var.enable_pro_features ? aws_efs_access_point.app_data[0].id : ""
}

output "efs_mount_target_ids" {
  description = "IDs of the EFS mount targets"
  value       = var.enable_pro_features ? aws_efs_mount_target.main[*].id : []
}

output "eventbridge_bus_name" {
  description = "Name of the EventBridge custom bus"
  value       = aws_cloudwatch_event_bus.app_events.name
}

output "eventbridge_bus_arn" {
  description = "ARN of the EventBridge custom bus"
  value       = aws_cloudwatch_event_bus.app_events.arn
}

output "eventbridge_asg_rule_arn" {
  description = "ARN of the EventBridge ASG events rule"
  value       = var.enable_pro_features ? aws_cloudwatch_event_rule.asg_events[0].arn : ""
}

output "eventbridge_app_rule_arn" {
  description = "ARN of the EventBridge application events rule"
  value       = aws_cloudwatch_event_rule.app_events.arn
}

output "eventbridge_log_group_name" {
  description = "Name of the EventBridge CloudWatch log group"
  value       = aws_cloudwatch_log_group.eventbridge_logs.name
}

output "efs_kms_key_arn" {
  description = "ARN of the KMS key used for EFS encryption"
  value       = aws_kms_key.efs.arn
}

output "security_group_efs_id" {
  description = "ID of the EFS security group"
  value       = aws_security_group.efs.id
}
