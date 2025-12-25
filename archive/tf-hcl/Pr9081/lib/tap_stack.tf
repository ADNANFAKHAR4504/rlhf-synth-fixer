# =============================================================================
# Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "iac-nova-model-breaking"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Minimum size of ASG"
  type        = number
  default     = 2
}

variable "asg_desired_capacity" {
  description = "Desired capacity of ASG"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of ASG"
  type        = number
  default     = 4
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "appuser"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}

# LocalStack compatibility feature flags
variable "enable_alb" {
  description = "Enable ALB - set to false for LocalStack free tier"
  type        = bool
  default     = true
}

variable "enable_rds" {
  description = "Enable RDS - set to false for LocalStack free tier"
  type        = bool
  default     = true
}

variable "enable_asg" {
  description = "Enable ASG - set to false for LocalStack free tier"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway - set to false for LocalStack free tier"
  type        = bool
  default     = true
}

# =============================================================================
# Locals
# =============================================================================

locals {
  computed_suffix = var.environment_suffix != "" && var.environment_suffix != var.environment ? "-${var.environment_suffix}" : ""
  name_prefix     = "${var.project}-${var.environment}${local.computed_suffix}"

  # 32-char caps for these names
  alb_name = substr("${local.name_prefix}-alb", 0, 32)
  tg_name  = substr("${local.name_prefix}-tg", 0, 32)

  common_tags = {
    project     = var.project
    environment = var.environment
    suffix      = var.environment_suffix
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ssm_parameter" "amazon_linux_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_kms_key" "ssm" {
  key_id = "alias/aws/ssm"
}

# =============================================================================
# Random Password
# =============================================================================

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# =============================================================================
# VPC & Networking
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(aws_subnet.public) : 0
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(aws_subnet.public) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

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

resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

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

# =============================================================================
# Security Groups
# =============================================================================

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${local.name_prefix}-app-"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from App"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
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

# =============================================================================
# SSM Parameters
# =============================================================================

resource "aws_ssm_parameter" "app_config" {
  name = "/app/${local.name_prefix}/app/config_json"
  type = "String"
  value = jsonencode({
    app_name    = local.name_prefix
    environment = var.environment
    version     = "1.0.0"
    features = {
      logging_enabled = true
      metrics_enabled = true
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-config"
  })
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/app/${local.name_prefix}/db/username"
  type  = "String"
  value = var.db_username

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-username"
  })
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/app/${local.name_prefix}/db/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_ssm_parameter" "cloudwatch_config" {
  name = "/app/${local.name_prefix}/cloudwatch/config"
  type = "String"
  value = jsonencode({
    agent = {
      metrics_collection_interval = 60
      run_as_user                 = "cwagent"
    }
    logs = {
      logs_collected = {
        files = {
          collect_list = [
            {
              file_path       = "/var/log/messages"
              log_group_name  = "/app/${local.name_prefix}/web"
              log_stream_name = "{instance_id}/messages"
              timezone        = "UTC"
            },
            {
              file_path       = "/var/log/nginx/access.log"
              log_group_name  = "/app/${local.name_prefix}/web"
              log_stream_name = "{instance_id}/nginx-access"
              timezone        = "UTC"
            },
            {
              file_path       = "/var/log/nginx/error.log"
              log_group_name  = "/app/${local.name_prefix}/web"
              log_stream_name = "{instance_id}/nginx-error"
              timezone        = "UTC"
            }
          ]
        }
      }
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudwatch-config"
  })
}

# =============================================================================
# CloudWatch Log Groups
# =============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/app/${local.name_prefix}/web"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/${local.name_prefix}-rds/postgresql"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-logs"
  })
}

# =============================================================================
# IAM (for EC2 to use SSM + CloudWatch + SSM Parameter/KMS decrypt)
# =============================================================================

resource "aws_iam_role" "instance_role" {
  name = "${local.name_prefix}-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# Allow SSM agent + Session Manager
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Allow CloudWatch Agent to push logs/metrics
resource "aws_iam_role_policy_attachment" "cloudwatch_agent_server_policy" {
  role       = aws_iam_role.instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Read app parameters from SSM (and decrypt with AWS managed SSM KMS key)
resource "aws_iam_role_policy" "ssm_parameter_access" {
  name = "${local.name_prefix}-ssm-parameter-access"
  role = aws_iam_role.instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadAppParameters"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/app/${local.name_prefix}/*"
      },
      {
        Sid      = "KmsDecryptForParameters"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = data.aws_kms_key.ssm.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "instance_profile" {
  name = "${local.name_prefix}-instance-profile"
  role = aws_iam_role.instance_role.name
  tags = local.common_tags
}

# =============================================================================
# User data (inline, single file)
# =============================================================================

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-"
  image_id      = data.aws_ssm_parameter.amazon_linux_ami.value
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.instance_profile.name
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y nginx

# Get instance ID with fallback for LocalStack
INSTANCE_ID=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "localstack-instance-$RANDOM")

# Create nginx index page
cat > /usr/share/nginx/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${local.name_prefix}</title>
</head>
<body>
    <h1>Hello from ${local.name_prefix}</h1>
    <p>Instance ID: INSTANCE_ID_PLACEHOLDER</p>
    <p>Environment: ${var.environment}</p>
    <p>Project: ${var.project}</p>
    <p>Suffix: ${var.environment_suffix}</p>
</body>
</html>
HTML

# Replace placeholder with actual instance ID
sed -i "s/INSTANCE_ID_PLACEHOLDER/$INSTANCE_ID/g" /usr/share/nginx/html/index.html

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Install CloudWatch Agent (skip if not available)
yum install -y amazon-cloudwatch-agent 2>/dev/null || echo "CloudWatch agent not available"

# Get CloudWatch config from SSM (with error handling for LocalStack)
aws ssm get-parameter --name "/app/${local.name_prefix}/cloudwatch/config" --region ${var.aws_region} --query 'Parameter.Value' --output text > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json 2>/dev/null || echo "CloudWatch config not retrieved"

# Start CloudWatch Agent (if available)
if [ -f /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl ]; then
  /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || echo "CloudWatch agent not started"
fi
EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Auto Scaling Group
# =============================================================================

resource "aws_autoscaling_group" "app" {
  count = var.enable_asg ? 1 : 0

  name                      = "${local.name_prefix}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = var.enable_alb ? [aws_lb_target_group.app[0].arn] : []
  health_check_type         = var.enable_alb ? "ELB" : "EC2"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
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
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "app" {
  count = var.enable_alb ? 1 : 0

  name               = local.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })

  # LocalStack compatibility: Ignore health_check_logs attribute changes
  lifecycle {
    ignore_changes = [
      # LocalStack tries to set health_check_logs.s3.enabled which isn't supported
      # We ignore ALL attribute changes to prevent the provider from trying to update them
      desync_mitigation_mode,
      drop_invalid_header_fields,
      enable_http2,
      enable_tls_version_and_cipher_suite_headers,
      enable_waf_fail_open,
      enable_xff_client_port,
      enable_zonal_shift,
      idle_timeout,
      preserve_host_header,
      xff_header_processing_mode,
      client_keep_alive
    ]
  }
}

resource "aws_lb_target_group" "app" {
  count = var.enable_alb ? 1 : 0

  name     = local.tg_name
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
    Name = "${local.name_prefix}-tg"
  })
}

resource "aws_lb_listener" "app" {
  count = var.enable_alb ? 1 : 0

  load_balancer_arn = aws_lb.app[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-listener"
  })
}

# =============================================================================
# RDS
# =============================================================================

resource "aws_db_subnet_group" "app" {
  count = var.enable_rds ? 1 : 0

  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

resource "aws_db_instance" "app" {
  count = var.enable_rds ? 1 : 0

  identifier = "${local.name_prefix}-rds"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  engine         = "postgres"
  engine_version = "15.14" # <- use numeric minor; console shows as 15.14.R1
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.app[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  auto_minor_version_upgrade = true # will move to 15.14.Rx patch automatically
  deletion_protection        = false
  skip_final_snapshot        = true
  final_snapshot_identifier  = "${local.name_prefix}-rds-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  multi_az                        = false # LocalStack: Multi-AZ not fully supported

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds" })
}

# =============================================================================
# Outputs
# =============================================================================

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

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = var.enable_alb ? aws_lb.app[0].dns_name : ""
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = var.enable_asg ? aws_autoscaling_group.app[0].name : ""
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = var.enable_rds ? aws_db_instance.app[0].endpoint : ""
}

output "enable_alb" {
  description = "Whether ALB is enabled"
  value       = var.enable_alb
}

output "enable_rds" {
  description = "Whether RDS is enabled"
  value       = var.enable_rds
}

output "enable_asg" {
  description = "Whether ASG is enabled"
  value       = var.enable_asg
}

output "enable_nat_gateway" {
  description = "Whether NAT Gateway is enabled"
  value       = var.enable_nat_gateway
}

output "ssm_parameter_arns" {
  description = "ARNs of created SSM parameters"
  value = {
    app_config        = aws_ssm_parameter.app_config.arn
    db_username       = aws_ssm_parameter.db_username.arn
    db_password       = aws_ssm_parameter.db_password.arn
    cloudwatch_config = aws_ssm_parameter.cloudwatch_config.arn
  }
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb = aws_security_group.alb.id
    app = aws_security_group.app.id
    rds = aws_security_group.rds.id
  }
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = var.enable_alb ? "http://${aws_lb.app[0].dns_name}" : ""
}
