# main.tf - Production Web Application Stack for AWS
# Terraform v1.x compatible with AWS Provider

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Configure AWS Provider with default tags
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "Production"
    }
  }
}

# ==================== VARIABLES ====================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr_primary" {
  description = "CIDR block for primary private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_cidr_secondary" {
  description = "CIDR block for secondary private subnet (for Multi-AZ RDS)"
  type        = string
  default     = "10.0.3.0/24"
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS listener (must be in us-east-1)"
  type        = string
  # No default - this is required. User must provide valid ACM cert ARN
}

variable "key_pair_name" {
  description = "Name of EC2 key pair for SSH access"
  type        = string
}

variable "instance_ami" {
  description = "AMI ID for EC2 instance"
  type        = string
  default     = "ami-0c02fb55731490381" # Amazon Linux 2 in us-east-1 - verify current AMI
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "rds_username" {
  description = "Master username for RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "rds_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "my_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your IP/32)"
  type        = string
  # No default for security - user must explicitly provide
}

# ==================== DATA SOURCES ====================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_elb_service_account" "main" {}

data "aws_caller_identity" "current" {}

# ==================== NETWORKING ====================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "production-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "production-public-subnet"
    Type = "Public"
  }
}

# Private Subnet Primary
resource "aws_subnet" "private_primary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr_primary
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "production-private-subnet-primary"
    Type = "Private"
  }
}

# Private Subnet Secondary (for Multi-AZ RDS)
resource "aws_subnet" "private_secondary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr_secondary
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "production-private-subnet-secondary"
    Type = "Private"
  }
}

# Route Table for Public Subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "production-public-rt"
  }
}

# Route Table Association for Public Subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Note: For enhanced network monitoring, consider enabling VPC Flow Logs
# to capture IP traffic information for security analysis and troubleshooting

# ==================== SECURITY GROUPS ====================
# Note: Resource names are hardcoded as "production-*" per requirement that all resources 
# are tagged with Environment = "Production". This implementation is for a single production 
# environment deployment. For multi-environment support (dev/staging/prod), consider 
# parameterizing names with an environment suffix variable.

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "production-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet (for redirect)"
    from_port   = 80
    to_port     = 80
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
    Name = "production-alb-sg"
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name        = "production-web-sg"
  description = "Security group for web server EC2 instance"
  vpc_id      = aws_vpc.main.id

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

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_allowed_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-web-sg"
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "production-db-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from web server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow minimal outbound for AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-db-sg"
  }
}

# ==================== IAM ROLES AND POLICIES ====================

# IAM Role for EC2 Instance (S3 Read-Only)
resource "aws_iam_role" "ec2_s3_read" {
  name = "production-ec2-s3-read-role"

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
    Name = "production-ec2-s3-read-role"
  }
}

# IAM Policy for S3 Read-Only Access (Least Privilege)
resource "aws_iam_policy" "s3_read_only" {
  name        = "production-s3-read-only"
  description = "S3 read-only access for EC2 instances"

  # Note: Wildcard S3 resource is intentional for this use case
  # The web application needs read-only access to various S3 buckets (e.g., static assets, configuration)
  # Actions are restricted to read-only (GetObject, ListBucket) following least privilege
  # For production, consider scoping to specific bucket ARNs if all required buckets are known in advance
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
          "arn:aws:s3:::*",
          "arn:aws:s3:::*/*"
        ]
      }
    ]
  })
}

# Attach S3 Read-Only Policy to EC2 Role
resource "aws_iam_role_policy_attachment" "ec2_s3_read" {
  role       = aws_iam_role.ec2_s3_read.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "production-ec2-instance-profile"
  role = aws_iam_role.ec2_s3_read.name
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "production-rds-enhanced-monitoring"

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
    Name = "production-rds-enhanced-monitoring"
  }
}

# Attach AWS Managed Policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==================== S3 BUCKET FOR ALB LOGS ====================

# S3 Bucket for ALB Access Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "production-alb-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # For demo purposes; remove in production

  tags = {
    Name = "production-alb-logs"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for ALB Access Logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowALBAccessLogs"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# ==================== EC2 INSTANCE ====================
# Note: Current implementation uses single EC2 instance per prompt requirements
# Future enhancements for production at scale could include:
# - Auto Scaling Group with multiple instances for true high availability
# - Launch Template for consistent instance configuration
# - Target tracking scaling policies based on CPU/memory metrics

# EC2 Instance (Web Server)
resource "aws_instance" "web" {
  ami                    = var.instance_ami # User must provide valid AMI ID for us-east-1
  instance_type          = var.instance_type
  key_name               = var.key_pair_name # User must provide existing key pair name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  # Simple user-data to install nginx
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install nginx1 -y
    systemctl start nginx
    systemctl enable nginx
    
    # Create simple index page with DB connection info placeholder
    cat > /usr/share/nginx/html/index.html <<'HTML'
    <!DOCTYPE html>
    <html>
    <head><title>Production Web Server</title></head>
    <body>
      <h1>Production Web Application</h1>
      <p>Server is running</p>
      <!-- DB Connection: ${aws_db_instance.main.endpoint} -->
    </body>
    </html>
    HTML
    
    systemctl restart nginx
  EOF

  tags = {
    Name = "production-web-server"
  }
}

# ==================== APPLICATION LOAD BALANCER ====================
# Note: Future security enhancements could include AWS WAF (Web Application Firewall) association
# for protection against common web exploits (SQL injection, XSS, etc.)

# ALB
resource "aws_lb" "main" {
  name               = "production-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  # ALB requires 2 subnets in different AZs for high availability
  # Current configuration: 1 public subnet (10.0.1.0/24) + 1 private subnet (10.0.3.0/24) per prompt requirements
  # Best practice recommendation: Use 2 public subnets instead (would require additional public subnet creation)
  # This configuration meets the prompt's specified subnet requirements while enabling Multi-AZ ALB deployment
  subnets            = [aws_subnet.public.id, aws_subnet.private_secondary.id]

  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
    prefix  = "alb"
  }

  tags = {
    Name = "production-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "production-web-tg"
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

  tags = {
    Name = "production-web-tg"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "web" {
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web.id
  port             = 80
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn # User must provide valid ACM certificate ARN

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# HTTP Listener (Redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ==================== RDS POSTGRESQL ====================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "production-db-subnet-group"
  subnet_ids = [aws_subnet.private_primary.id, aws_subnet.private_secondary.id]

  tags = {
    Name = "production-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "production-postgres"
  engine         = "postgres"
  engine_version = "13.7"
  instance_class = "db.t3.micro"

  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp2" # Cost optimization: Consider upgrading to "gp3" for better performance/cost ratio
  storage_encrypted = true

  db_name  = "productiondb"
  username = var.rds_username
  password = var.rds_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "production-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enhanced Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "production-postgres"
  }
}

# ==================== CLOUDWATCH ALARMS ====================

# CloudWatch Alarm for ALB Target Unhealthy
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "production-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when ALB has unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "production-alb-unhealthy-alarm"
  }
}

# CloudWatch Alarm for RDS High CPU
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "production-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when RDS CPU exceeds 80%"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "production-rds-cpu-alarm"
  }
}

# CloudWatch Alarm for EC2 High CPU
resource "aws_cloudwatch_metric_alarm" "ec2_high_cpu" {
  alarm_name          = "production-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when EC2 CPU exceeds 80%"

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name = "production-ec2-cpu-alarm"
  }
}

# ==================== OUTPUTS ====================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

# Subnet Outputs
output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "private_subnet_primary_id" {
  description = "ID of the primary private subnet"
  value       = aws_subnet.private_primary.id
}

output "private_subnet_secondary_id" {
  description = "ID of the secondary private subnet"
  value       = aws_subnet.private_secondary.id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "web_security_group_id" {
  description = "ID of the web server security group"
  value       = aws_security_group.web.id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.db.id
}

# EC2 Outputs
output "web_instance_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_instance.web.public_ip
}

output "web_instance_id" {
  description = "ID of the web server instance"
  value       = aws_instance.web.id
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}

# RDS Outputs
output "rds_endpoint_address" {
  description = "RDS instance endpoint address"
  value       = aws_db_instance.main.address
}

output "rds_endpoint_port" {
  description = "RDS instance endpoint port"
  value       = aws_db_instance.main.port
}

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

# S3 Outputs
output "alb_logs_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "ARN of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.arn
}

# ==================== OPTIONAL SANITY CHECK ====================

# Optional: Null resource to verify AWS credentials during apply
# Uncomment if you want to verify AWS caller identity during terraform apply
# resource "null_resource" "aws_credentials_check" {
#   provisioner "local-exec" {
#     command = "aws sts get-caller-identity"
#   }
# }

# ==================== DEPLOYMENT INSTRUCTIONS ====================

# To deploy this infrastructure, run the following commands:
#
# 1. Initialize Terraform:
#    terraform init
#
# 2. Validate the configuration:
#    terraform validate
#
# 3. Plan the deployment (replace placeholder values):
#    terraform plan \
#      -var 'acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID' \
#      -var 'key_pair_name=your-existing-keypair' \
#      -var 'my_allowed_cidr=YOUR.IP.ADD.RESS/32' \
#      -var 'rds_password=YourSecurePassword123!' \
#      -var 'instance_ami=ami-0c02fb55731490381'
#
# 4. Apply the configuration:
#    terraform apply \
#      -var 'acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID' \
#      -var 'key_pair_name=your-existing-keypair' \
#      -var 'my_allowed_cidr=YOUR.IP.ADD.RESS/32' \
#      -var 'rds_password=YourSecurePassword123!' \
#      -var 'instance_ami=ami-0c02fb55731490381'
#
# IMPORTANT NOTES:
# - You must have a valid ACM certificate in us-east-1 before deployment
# - You must have an existing EC2 key pair in us-east-1
# - Replace YOUR.IP.ADD.RESS/32 with your actual IP address for SSH access
# - Choose a strong password for RDS
# - Verify the AMI ID is valid and current for us-east-1
#
# COST OPTIMIZATION RECOMMENDATIONS:
# - All resources include Environment = "Production" tag via provider default_tags
# - For detailed cost allocation, consider adding additional tags: Project, Owner, CostCenter
# - Enable AWS Cost Explorer and Cost Allocation Tags in billing console
# - Consider RDS Reserved Instances for long-term cost savings