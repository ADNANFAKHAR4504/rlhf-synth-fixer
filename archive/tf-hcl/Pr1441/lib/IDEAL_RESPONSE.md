# Terraform Infrastructure Code

## provider.tf

```hcl
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
  region = var.aws_region
}

```

## tap_stack.tf

```hcl
# =============================================================================
# AWS INFRASTRUCTURE PROJECT - TERRAFORM CONFIGURATION
# =============================================================================
# This configuration implements all AWS infrastructure requirements:
# 1. Terraform HCL Configuration
# 2. Network Configuration
# 3. Resource Management
# 4. Security and Access Control
# 5. Rollback and Recovery
# 6. Validation and Testing
# =============================================================================

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.aws_region))
    error_message = "AWS region must be in valid format (e.g., us-east-1)."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for resource isolation"
  type        = string
  default     = ""

  validation {
    condition     = length(var.environment_suffix) <= 10
    error_message = "Environment suffix must be 10 characters or less."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "aws-infrastructure"

  validation {
    condition     = length(var.project_name) >= 3 && length(var.project_name) <= 20
    error_message = "Project name must be between 3 and 20 characters."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR block must be in valid CIDR notation."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  validation {
    condition = alltrue([
      for cidr in var.public_subnet_cidrs :
      can(cidrhost(cidr, 0))
    ])
    error_message = "All public subnet CIDR blocks must be in valid CIDR notation."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]

  validation {
    condition = alltrue([
      for cidr in var.private_subnet_cidrs :
      can(cidrhost(cidr, 0))
    ])
    error_message = "All private subnet CIDR blocks must be in valid CIDR notation."
  }
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]

  validation {
    condition = alltrue([
      for cidr in var.allowed_ssh_cidrs :
      can(cidrhost(cidr, 0))
    ])
    error_message = "All SSH CIDR blocks must be in valid CIDR notation."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"

  validation {
    condition     = can(regex("^db\\.[a-z0-9]+\\.[a-z0-9]+$", var.db_instance_class))
    error_message = "DB instance class must be in valid format (e.g., db.t3.micro)."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
  default     = "dbadmin"

  validation {
    condition     = length(var.db_username) >= 1 && length(var.db_username) <= 16
    error_message = "Database username must be between 1 and 16 characters."
  }
}

variable "db_password" {
  description = "Database master password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

variable "enable_multi_az_nat" {
  description = "Enable multiple NAT gateways for production resilience"
  type        = bool
  default     = true
}

# Storage and sizing variables
variable "ec2_volume_size" {
  description = "Size of EC2 root volume in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.ec2_volume_size >= 8 && var.ec2_volume_size <= 100
    error_message = "EC2 volume size must be between 8 and 100 GB."
  }
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.rds_allocated_storage >= 20 && var.rds_allocated_storage <= 65536
    error_message = "RDS allocated storage must be between 20 and 65536 GB."
  }
}

# Network and security variables
variable "http_port" {
  description = "HTTP port for web traffic"
  type        = number
  default     = 80
  validation {
    condition     = var.http_port >= 1 && var.http_port <= 65535
    error_message = "HTTP port must be between 1 and 65535."
  }
}

variable "https_port" {
  description = "HTTPS port for secure web traffic"
  type        = number
  default     = 443
  validation {
    condition     = var.https_port >= 1 && var.https_port <= 65535
    error_message = "HTTPS port must be between 1 and 65535."
  }
}

variable "ssh_port" {
  description = "SSH port for secure shell access"
  type        = number
  default     = 22
  validation {
    condition     = var.ssh_port >= 1 && var.ssh_port <= 65535
    error_message = "SSH port must be between 1 and 65535."
  }
}

variable "mysql_port" {
  description = "MySQL database port"
  type        = number
  default     = 3306
  validation {
    condition     = var.mysql_port >= 1 && var.mysql_port <= 65535
    error_message = "MySQL port must be between 1 and 65535."
  }
}

# Monitoring and lifecycle variables
variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
  validation {
    condition     = var.cloudwatch_log_retention_days >= 1 && var.cloudwatch_log_retention_days <= 3653
    error_message = "CloudWatch log retention must be between 1 and 3653 days."
  }
}

variable "s3_lifecycle_transition_days" {
  description = "Days before transitioning S3 objects to IA storage"
  type        = number
  default     = 30
  validation {
    condition     = var.s3_lifecycle_transition_days >= 1
    error_message = "S3 lifecycle transition days must be at least 1."
  }
}

variable "s3_lifecycle_glacier_days" {
  description = "Days before transitioning S3 objects to Glacier storage"
  type        = number
  default     = 90
  validation {
    condition     = var.s3_lifecycle_glacier_days >= 1
    error_message = "S3 lifecycle glacier days must be at least 1."
  }
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before expiring S3 objects"
  type        = number
  default     = 365
  validation {
    condition     = var.s3_lifecycle_expiration_days >= 1
    error_message = "S3 lifecycle expiration days must be at least 1."
  }
}

# Monitoring thresholds
variable "cpu_threshold" {
  description = "CPU utilization threshold for CloudWatch alarms"
  type        = number
  default     = 80
  validation {
    condition     = var.cpu_threshold >= 1 && var.cpu_threshold <= 100
    error_message = "CPU threshold must be between 1 and 100 percent."
  }
}

variable "cloudwatch_evaluation_periods" {
  description = "Number of evaluation periods for CloudWatch alarms"
  type        = number
  default     = 2
  validation {
    condition     = var.cloudwatch_evaluation_periods >= 1 && var.cloudwatch_evaluation_periods <= 10
    error_message = "CloudWatch evaluation periods must be between 1 and 10."
  }
}

variable "cloudwatch_period_seconds" {
  description = "Period in seconds for CloudWatch metrics"
  type        = number
  default     = 300
  validation {
    condition     = var.cloudwatch_period_seconds >= 60 && var.cloudwatch_period_seconds <= 86400
    error_message = "CloudWatch period must be between 60 and 86400 seconds."
  }
}

# Load balancer health check variables
variable "alb_health_check_interval" {
  description = "Interval in seconds for ALB health checks"
  type        = number
  default     = 30
  validation {
    condition     = var.alb_health_check_interval >= 5 && var.alb_health_check_interval <= 300
    error_message = "ALB health check interval must be between 5 and 300 seconds."
  }
}

variable "alb_health_check_timeout" {
  description = "Timeout in seconds for ALB health checks"
  type        = number
  default     = 5
  validation {
    condition     = var.alb_health_check_timeout >= 2 && var.alb_health_check_timeout <= 60
    error_message = "ALB health check timeout must be between 2 and 60 seconds."
  }
}

variable "alb_healthy_threshold" {
  description = "Number of consecutive health check successes required"
  type        = number
  default     = 2
  validation {
    condition     = var.alb_healthy_threshold >= 2 && var.alb_healthy_threshold <= 10
    error_message = "ALB healthy threshold must be between 2 and 10."
  }
}

variable "alb_unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 2
  validation {
    condition     = var.alb_unhealthy_threshold >= 2 && var.alb_unhealthy_threshold <= 10
    error_message = "ALB unhealthy threshold must be between 2 and 10."
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

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

# =============================================================================
# SECURITY RESOURCES
# =============================================================================

# Random password generator for database
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# AWS Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-secret-manager-v3"

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-secret-manager-v3"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != null ? var.db_password : random_password.db_password[0].result
  })
}

# =============================================================================
# NETWORK INFRASTRUCTURE
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-vpc-v3"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-igw-v3"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-public-subnet-${count.index + 1}-v3"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-private-subnet-${count.index + 1}-v3"
    Type = "Private"
  }
}

# NAT Gateway EIPs
resource "aws_eip" "nat" {
  count  = var.enable_multi_az_nat ? length(var.public_subnet_cidrs) : 1
  domain = "vpc"

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-nat-eip-${count.index + 1}-v3"
  }
}

# NAT Gateways - Multi-AZ for production, single for development
resource "aws_nat_gateway" "main" {
  count         = var.enable_multi_az_nat ? length(var.public_subnet_cidrs) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-nat-gateway-${count.index + 1}-v3"
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
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-public-rt-v3"
  }
}

# Private Route Tables - One per AZ when multi-AZ NAT is enabled
resource "aws_route_table" "private" {
  count  = var.enable_multi_az_nat ? length(var.private_subnet_cidrs) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_multi_az_nat ? aws_nat_gateway.main[count.index].id : aws_nat_gateway.main[0].id
  }

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-private-rt-${count.index + 1}-v3"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.enable_multi_az_nat ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Web Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-web-v4-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = var.http_port
    to_port     = var.http_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    from_port   = var.https_port
    to_port     = var.https_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  ingress {
    from_port   = var.ssh_port
    to_port     = var.ssh_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
    description = "SSH access from allowed CIDRs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-web-sg-v4"
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-v4-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.mysql_port
    to_port         = var.mysql_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL access from web servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-sg-v4"
  }
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-ec2-role-v3"

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
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-ec2-role-v3"
  }
}

# EC2 Policy
resource "aws_iam_policy" "ec2_policy" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-ec2-policy-v3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-ec2-profile-v3"
  role = aws_iam_role.ec2_role.name
}

# =============================================================================
# COMPUTE RESOURCES
# =============================================================================

# EC2 Instances
resource "aws_instance" "web" {
  count = 2

  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  subnet_id                   = aws_subnet.public[count.index % length(aws_subnet.public)].id
  vpc_security_group_ids      = [aws_security_group.web.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true

  user_data_base64 = base64encode(<<-EOF
#!/bin/bash
# User data script for EC2 instances
# This script is used to bootstrap EC2 instances with required software and configuration

set -e

# Update system packages
yum update -y

# Install required packages
yum install -y httpd php php-mysqlnd mysql

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple health check page
cat > /var/www/html/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>${var.project_name} - Instance Health</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .healthy { background-color: #d4edda; color: #155724; }
        .info { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${var.project_name} - Instance Health Check</h1>
        <div class="status healthy">
            <strong>Status:</strong> Healthy
        </div>
        <div class="status info">
            <strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        </div>
        <div class="status info">
            <strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
        </div>
        <div class="status info">
            <strong>Timestamp:</strong> $(date)
        </div>
    </div>
</body>
</html>
HTML_EOF

# Create a health check endpoint
cat > /var/www/html/health << 'HEALTH_EOF'
OK
HEALTH_EOF

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Configure Apache to handle health checks
cat > /etc/httpd/conf.d/health.conf << 'CONF_EOF'
<Location "/health">
    SetHandler default-handler
    Require all granted
</Location>
CONF_EOF

# Restart Apache to apply changes
systemctl restart httpd

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}",
                        "log_stream_name": "{instance_id}/apache/access.log",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}",
                        "log_stream_name": "{instance_id}/apache/error.log",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    },
    "metrics": {
        "metrics_collected": {
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
CW_EOF

# Start CloudWatch agent
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

echo "User data script completed successfully"
EOF
  )

  root_block_device {
    volume_size = var.ec2_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-web-${count.index + 1}-v3"
  }

  depends_on = [aws_internet_gateway.main]

  # Force replacement when security group changes
  lifecycle {
    replace_triggered_by = [
      aws_security_group.web.id
    ]
  }
}

# Application Load Balancer
resource "aws_lb" "web" {
  name               = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-alb-v3"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-alb-v3"
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-tg-v3"
  port     = var.http_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = var.alb_healthy_threshold
    interval            = var.alb_health_check_interval
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = var.alb_health_check_timeout
    unhealthy_threshold = var.alb_unhealthy_threshold
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = var.http_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "web" {
  count            = length(aws_instance.web)
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web[count.index].id
  port             = var.http_port
}

# =============================================================================
# DATABASE RESOURCES
# =============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-subnet-group-manager-v3"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-subnet-group-manager-v3"
  }
}

# RDS Parameter Group - Use existing one
data "aws_db_parameter_group" "main" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-params-manager-v3"
}

# RDS Instance with Secrets Manager Integration
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-secrets-manager-v3"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "application_db"
  username = var.db_username
  password = var.db_password != null ? var.db_password : random_password.db_password[0].result
  port     = var.mysql_port

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = data.aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-final-snapshot-v3-${formatdate("YYYYMMDD-HHmmss", timestamp())}"

  deletion_protection = var.enable_deletion_protection

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-database-v3"
  }

  # Force replacement when subnet group or security group changes
  lifecycle {
    replace_triggered_by = [
      aws_db_subnet_group.main.name,
      aws_security_group.database.id
    ]
  }
}

# =============================================================================
# STORAGE RESOURCES
# =============================================================================

# Random string for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for Application Data
resource "aws_s3_bucket" "data" {
  bucket = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-data-v3-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-data-bucket-v3"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "data_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.s3_lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_lifecycle_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.s3_lifecycle_expiration_days
    }
  }
}

# =============================================================================
# MONITORING RESOURCES
# =============================================================================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ec2/${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-logs-v3"
  }
}

# CloudWatch Alarm for CPU
resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-cpu-alarm-v3"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.cloudwatch_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = var.cloudwatch_period_seconds
  statistic           = "Average"
  threshold           = var.cpu_threshold
  alarm_description   = "This metric monitors EC2 CPU utilization"

  dimensions = {
    InstanceId = aws_instance.web[0].id
  }
}

# CloudWatch Alarm for Database
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-db-cpu-alarm-v3"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.cloudwatch_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.cloudwatch_period_seconds
  statistic           = "Average"
  threshold           = var.cpu_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "load_balancer_dns" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.web.dns_name
}

output "database_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.data.bucket
}

output "ec2_instance_ids" {
  description = "The IDs of the EC2 instances"
  value       = aws_instance.web[*].id
}

output "security_group_ids" {
  description = "The IDs of the security groups"
  value = {
    web      = aws_security_group.web.id
    database = aws_security_group.database.id
  }
}

output "secrets_manager_arn" {
  description = "The ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "nat_gateway_ids" {
  description = "The IDs of the NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_count" {
  description = "The number of NAT gateways deployed"
  value       = var.enable_multi_az_nat ? length(var.public_subnet_cidrs) : 1
}

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = "Infrastructure Team"
  }

  subnet_count = length(var.public_subnet_cidrs)
}

```
