### Reasoning Trace
---

I need to create a comprehensive Terraform configuration that includes all the requirements mentioned. Let me break down what I need to include:

1. VPC in us-east-2 with CIDR 10.0.0.0/16 and VPC Flow Logs
2. 2 private and 2 public subnets, NAT gateway, internet gateway, route tables
3. EC2 instances in Auto Scaling group behind ALB in private subnets with security groups
4. IAM roles with least privilege
5. S3 buckets with versioning and logging
6. DynamoDB table with encryption
7. AWS WAF for web application protection
8. CloudTrail and CloudWatch for logging/monitoring
9. SNS notification system for alerts
10. RDS with automatic backups, random username/password, secrets manager, Multi-AZ, AWS Backup
11. 4-byte suffix for all resources
12. Security measures with IAM roles, security groups, S3 policies

I need to make sure:
- All resources have a 4-byte suffix
- RDS username starts with alphabet, 8 chars, no special chars
- RDS password 16 chars with AWS-allowed special chars
- No external modules
- Well commented
- All outputs for essential identifiers
- Region referenced via variable

Let me start building this step by step:

1. Variables first
2. Locals for common values and random suffixes
3. Data sources for AMI, AZs, etc.
4. VPC and networking
5. Security groups
6. IAM roles and policies
7. S3 buckets
8. DynamoDB
9. RDS with secrets manager
10. EC2, ASG, ALB
11. WAF
12. CloudTrail, CloudWatch, SNS
13. AWS Backup
14. Outputs

For the 4-byte suffix, I'll use random_id resource.
For RDS username/password, I'll use random_string and random_password resources.
### Answer 
---

Here's a comprehensive Terraform configuration file `tap_stack.tf` that meets all your requirements:

```hcl
# tap_stack.tf - Complete infrastructure stack with security and monitoring

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "authorized_cidr_blocks" {
  description = "CIDR blocks authorized for HTTP/HTTPS access"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

# =============================================================================
# LOCALS AND RANDOM RESOURCES
# =============================================================================

# Generate 4-byte suffix for all resources
resource "random_id" "suffix" {
  byte_length = 4
}

# Generate RDS master username (8 chars, starts with letter, no special chars)
resource "random_string" "rds_username" {
  length  = 8
  upper   = true
  lower   = true
  numeric = true
  special = false
}

# Generate RDS master password (16 chars with AWS-allowed special chars)
resource "random_password" "rds_password" {
  length  = 16
  upper   = true
  lower   = true
  numeric = true
  special = true
  # AWS RDS allowed special characters
  override_special = "!#$%&*+-=?^_`{|}~"
}

locals {
  suffix = random_id.suffix.hex
  
  # Ensure RDS username starts with a letter
  rds_master_username = "u${substr(random_string.rds_username.result, 1, 7)}"
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
    Suffix      = local.suffix
  }
  
  # Availability zones
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Current AWS account ID
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-${local.suffix}"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-flow-log-${local.suffix}"
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${local.suffix}"
  retention_in_days = 30
  
  tags = local.common_tags
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw-${local.suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${local.suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${local.suffix}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2
  
  domain = "vpc"
  depends_on = [aws_internet_gateway.main]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${local.suffix}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}-${local.suffix}"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt-${local.suffix}"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = 2
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${local.suffix}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 2
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 2
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-${local.suffix}"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.authorized_cidr_blocks
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.authorized_cidr_blocks
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg-${local.suffix}"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-${local.suffix}"
  vpc_id      = aws_vpc.main.id
  
  ingress {
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
    Name = "${var.project_name}-ec2-sg-${local.suffix}"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-${local.suffix}"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg-${local.suffix}"
  })
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role-${local.suffix}"
  
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

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-ec2-policy-${local.suffix}"
  role = aws_iam_role.ec2_role.id
  
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
        Resource = "${aws_s3_bucket.static_content.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile-${local.suffix}"
  role = aws_iam_role.ec2_role.name
  
  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name = "${var.project_name}-flow-log-role-${local.suffix}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_log_policy" {
  name = "${var.project_name}-flow-log-policy-${local.suffix}"
  role = aws_iam_role.flow_log_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# S3 Bucket for static content
resource "aws_s3_bucket" "static_content" {
  bucket = "${var.project_name}-static-content-${local.suffix}"
  
  tags = local.common_tags
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.project_name}-access-logs-${local.suffix}"
  
  tags = local.common_tags
}

# S3 Bucket logging configuration
resource "aws_s3_bucket_logging" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "static-content-logs/"
}

# S3 Bucket policy for static content
resource "aws_s3_bucket_policy" "static_content" {
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
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.static_content.arn}/*"
      }
    ]
  })
}

# Block public access for static content bucket
resource "aws_s3_bucket_public_access_block" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block public access for access logs bucket
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# DYNAMODB
# =============================================================================

# DynamoDB Table with encryption
resource "aws_dynamodb_table" "main" {
  name           = "${var.project_name}-table-${local.suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = local.common_tags
}

# =============================================================================
# SECRETS MANAGER FOR RDS
# =============================================================================

# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name = "${var.project_name}-rds-credentials-${local.suffix}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = local.rds_master_username
    password = random_password.rds_password.result
  })
}

# =============================================================================
# RDS
# =============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group-${local.suffix}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group-${local.suffix}"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier             = "${var.project_name}-db-${local.suffix}"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type          = "gp2"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = "db.t3.micro"
  
  db_name  = "tapstack"
  username = local.rds_master_username
  password = random_password.rds_password.result
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  auto_minor_version_upgrade = true
  multi_az                  = true
  publicly_accessible      = false
  
  storage_encrypted = true
  
  tags = local.common_tags
}

# =============================================================================
# AWS BACKUP FOR RDS
# =============================================================================

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-backup-vault-${local.suffix}"
  kms_key_arn = aws_kms_key.backup.arn
  
  tags = local.common_tags
}

# KMS Key for AWS Backup
resource "aws_kms_key" "backup" {
  description = "KMS key for AWS Backup"
  
  tags = local.common_tags
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-backup-key-${local.suffix}"
  target_key_id = aws_kms_key.backup.key_id
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role-${local.suffix}"
  
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
  
  tags = local.common_tags
}

# Attach AWS managed policy for backup service
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${var.project_name}-backup-plan-${local.suffix}"
  
  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 ? * * *)"
    
    lifecycle {
      delete_after = 30
    }
  }
  
  tags = local.common_tags
}

# Backup Selection
resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-backup-selection-${local.suffix}"
  plan_id      = aws_backup_plan.main.id
  
  resources = [
    aws_db_instance.main.arn
  ]
}

# =============================================================================
# APPLICATION LOAD BALANCER
# =============================================================================

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${local.suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  
  tags = local.common_tags
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg-${local.suffix}"
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
  
  tags = local.common_tags
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

# =============================================================================
# LAUNCH TEMPLATE AND AUTO SCALING GROUP
# =============================================================================

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-lt-${local.suffix}"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.project_name}-${local.suffix}</h1>" > /var/www/html/index.html
              # Install CloudWatch agent
              yum install -y amazon-cloudwatch-agent
              EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_name}-instance-${local.suffix}"
    })
  }
  
  tags = local.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-asg-${local.suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  
  min_size         = 2
  max_size         = 4
  desired_capacity = 2
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-${local.suffix}"
    propagate_at_launch = false
  }
}

# =============================================================================
# AWS WAF
# =============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-waf-${local.suffix}"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
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
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-${local.suffix}"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-${local.suffix}"
  
  tags = local.common_tags
}

# CloudTrail bucket policy
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

# Block public access for CloudTrail bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-cloudtrail-${local.suffix}"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []
  }
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
  
  tags = local.common_tags
}

# =============================================================================
# CLOUDWATCH AND SNS
# =============================================================================

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${local.suffix}"
  
  tags = local.common_tags
}

# CloudWatch Log Group for EC2 instances
resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "/aws/ec2/${var.project_name}-${local.suffix}"
  retention_in_days = 14
  
  tags = local.common_tags
}

# CloudWatch Metric Alarm for High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
  
  tags = local.common_tags
}

# CloudWatch Metric Alarm for RDS CPU
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-high-cpu-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# Auto Scaling Group Outputs
output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "asg_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

# Secrets Manager Output
output "rds_credentials_secret_arn" {
  description = "ARN of the RDS credentials secret in Secrets Manager"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

# S3 Bucket Outputs
output "static_content_bucket_name" {
  description = "Name of the static content S3 bucket"
  value       = aws_s3_bucket.static_content.id
}

output "static_content_bucket_arn" {
  description = "ARN of the static content S3 bucket"
  value       = aws_s3_bucket.static_content.arn
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

# DynamoDB Output
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# AMI Output
output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux.id
}

# WAF Output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# CloudTrail Output
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# SNS Topic Output
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# Backup Vault Output
output "backup_vault_name" {
  description = "Name of the AWS Backup vault"
  value       = aws_backup_vault.main.name
}

output "backup_vault_arn" {
  description = "ARN of the AWS Backup vault"
  value       = aws_backup_vault.main.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# Resource Suffix Output
output "resource_suffix" {
  description = "4-byte suffix used for all resources"
  value       = local.suffix
}
```

This comprehensive Terraform configuration includes:

## **Key Features:**

1. **VPC Infrastructure**: Complete VPC setup with public/private subnets, NAT gateways, and VPC Flow Logs
2. **Security**: Least privilege IAM roles, security groups, and WAF protection
3. **High Availability**: Multi-AZ RDS, Auto Scaling Group across multiple AZs
4. **Monitoring**: CloudWatch alarms, CloudTrail logging, SNS notifications
5. **Storage**: S3 buckets with versioning/logging, encrypted DynamoDB table
6. **Database**: RDS with random credentials stored in Secrets Manager, AWS Backup integration
7. **4-byte suffix**: Applied to all resources to prevent naming conflicts

## **Security Best Practices:**

- IAM roles with minimal required permissions
- Security groups allowing only necessary traffic
- S3 buckets with public access blocked
- Encrypted storage for RDS and DynamoDB
- VPC Flow Logs for network monitoring
- WAF protection for web applications

## **Deployment:**

```bash
terraform init
terraform plan
terraform apply
```

The configuration is fully self-contained and deployable without external dependencies or modules.
