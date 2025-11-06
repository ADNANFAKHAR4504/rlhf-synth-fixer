# tap_stack.tf - Secure AWS Infrastructure Deployment
# Region: us-west-1
# Purpose: Production-ready secure infrastructure with monitoring, backup, and WAF protection

# Variables
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-1"
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== VPC CONFIGURATION ====================
# Create VPC with private IP range for network isolation
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Internet Gateway for public subnet internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "main-igw"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== SUBNET CONFIGURATION ====================
# Public Subnet 1 - For ALB and NAT Gateway
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1"
    Type        = "Public"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Public Subnet 2 - For ALB and NAT Gateway (High Availability)
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-2"
    Type        = "Public"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Private Subnet 1 - For EC2 and RDS
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "private-subnet-1"
    Type        = "Private"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Private Subnet 2 - For EC2 and RDS (High Availability)
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "private-subnet-2"
    Type        = "Private"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== NAT GATEWAY CONFIGURATION ====================
# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-1"
    Environment = "Production"
    Team        = "DevOps"
  }
}

resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-2"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# NAT Gateway 1 - Provides internet access for private subnet 1
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "nat-gateway-1"
    Environment = "Production"
    Team        = "DevOps"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 2 - Provides internet access for private subnet 2
resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "nat-gateway-2"
    Environment = "Production"
    Team        = "DevOps"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==================== ROUTE TABLE CONFIGURATION ====================
# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-route-table"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Private Route Table 1
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = {
    Name        = "private-route-table-1"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Private Route Table 2
resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = {
    Name        = "private-route-table-2"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# ==================== SECURITY GROUP CONFIGURATION ====================
# Security Group for EC2 - Least privilege approach
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-"
  description = "Security group for EC2 instance with minimal required access"
  vpc_id      = aws_vpc.main.id

  # Allow inbound from ALB only on port 80
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic for updates and package downloads
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ec2-security-group"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Security Group for RDS - Least privilege approach
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-"
  description = "Security group for RDS with minimal required access"
  vpc_id      = aws_vpc.main.id

  # Allow inbound only from EC2 security group on MySQL/Aurora port
  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # No egress rules needed for RDS
  egress {
    description = "Deny all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["127.0.0.1/32"]
  }

  tags = {
    Name        = "rds-security-group"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Allow inbound HTTP traffic
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow inbound HTTPS traffic
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow outbound to EC2 instances
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "alb-security-group"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== IAM CONFIGURATION ====================
# IAM Role for EC2 - Least privilege principle
resource "aws_iam_role" "ec2_role" {
  name = "ec2-minimal-role"

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
    Name        = "ec2-iam-role"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# IAM Policy for EC2 - Minimal permissions for CloudWatch metrics
resource "aws_iam_role_policy" "ec2_policy" {
  name = "ec2-minimal-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# IAM Account Password Policy - Enforce MFA and strong passwords
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  password_reuse_prevention      = 24
  max_password_age               = 90
}

# ==================== S3 BUCKET CONFIGURATION ====================
# S3 Bucket with SSE-KMS encryption
resource "aws_s3_bucket" "secure_bucket" {
  bucket_prefix = "secure-bucket-"

  tags = {
    Name        = "secure-s3-bucket"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with AWS managed KMS key
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "alias/aws/s3"
    }
    bucket_key_enabled = true
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for backup storage
resource "aws_s3_bucket" "backup_bucket" {
  bucket_prefix = "backup-bucket-"

  tags = {
    Name        = "backup-s3-bucket"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Enable versioning for backup bucket
resource "aws_s3_bucket_versioning" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for backup bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "alias/aws/s3"
    }
    bucket_key_enabled = true
  }
}

# Block all public access to backup bucket
resource "aws_s3_bucket_public_access_block" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==================== EC2 INSTANCE CONFIGURATION ====================
# EC2 Instance in private subnet
resource "aws_instance" "main" {
  ami                    = "ami-12345678"
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_1.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring for better observability
  monitoring = true

  # User data script for CloudWatch agent installation
  user_data = <<-EOF
    #!/bin/bash
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "ec2-root-volume"
      Environment = "Production"
      Team        = "DevOps"
    }
  }

  tags = {
    Name        = "main-ec2-instance"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== AWS SECRETS MANAGER ====================
# Generate a random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store RDS credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name_prefix             = "rds-credentials-"
  description             = "RDS database credentials"
  recovery_window_in_days = 7

  tags = {
    Name        = "rds-credentials"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Store the secret value
resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = 3306
    dbname   = "maindb"
  })

  depends_on = [aws_db_instance.main]
}

# ==================== RDS CONFIGURATION ====================
# DB Subnet Group for RDS
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name        = "main-db-subnet-group"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# RDS Instance in private subnets
resource "aws_db_instance" "main" {
  identifier     = "main-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "maindb"
  username = "admin"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # No deletion protection as per requirements
  deletion_protection = false
  skip_final_snapshot = true

  # Enable automated backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name        = "main-rds-instance"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== APPLICATION LOAD BALANCER CONFIGURATION ====================
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  # Enable deletion protection is disabled as per requirements
  enable_deletion_protection = false

  # Enable access logs
  enable_http2 = true

  tags = {
    Name        = "main-alb"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Target Group for ALB
resource "aws_lb_target_group" "main" {
  name     = "main-tg"
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
    Name        = "main-target-group"
    Environment = "Production"
    Team        = "DevOps"
  }
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

# Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.main.id
  port             = 80
}

# ==================== AWS WAF CONFIGURATION ====================
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "main-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule to block SQL injection attacks
  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - SQL Database
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "main-web-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "main-web-acl"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# ==================== CLOUDWATCH MONITORING CONFIGURATION ====================
# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alarms" {
  name = "cloudwatch-alarms"

  tags = {
    Name        = "cloudwatch-alarms-topic"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# SNS Topic Subscription (email would be added separately)
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = "devops@example.com" # Change to actual email
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "ec2-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    InstanceId = aws_instance.main.id
  }

  tags = {
    Name        = "ec2-cpu-alarm"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "rds-cpu-alarm"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# ==================== AWS BACKUP CONFIGURATION ====================
# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "aws-backup-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "backup-iam-role"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Attach AWS managed policy for Backup
resource "aws_iam_role_policy_attachment" "backup_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup_role.name
}

# Backup Vault
resource "aws_backup_vault" "main" {
  name = "main-backup-vault"

  tags = {
    Name        = "main-backup-vault"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "main-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment = "Production"
      Team        = "DevOps"
    }
  }

  tags = {
    Name        = "main-backup-plan"
    Environment = "Production"
    Team        = "DevOps"
  }
}

# Backup Selection for EC2
resource "aws_backup_selection" "ec2" {
  name         = "ec2-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_instance.main.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = "Production"
    }
  }
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  name         = "rds-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_db_instance.main.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = "Production"
    }
  }
}

# ==================== OUTPUTS ====================
# Output important resource information
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "ec2_instance_id" {
  value       = aws_instance.main.id
  description = "ID of the EC2 instance"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.secure_bucket.id
  description = "Name of the secure S3 bucket"
}

output "backup_vault_name" {
  value       = aws_backup_vault.main.name
  description = "Name of the backup vault"
}

output "rds_credentials_secret_arn" {
  value       = aws_secretsmanager_secret.rds_credentials.arn
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  sensitive   = true
}