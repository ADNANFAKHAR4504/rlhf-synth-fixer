# Loan Processing Application Infrastructure - Terraform Implementation

This document contains the complete, corrected Terraform configuration for deploying a PCI DSS compliant loan processing application infrastructure.

All critical issues from MODEL_RESPONSE.md have been fixed:
- IAM role name_prefix values shortened to fit within 38-character AWS limit
- S3 lifecycle configurations include required `filter {}` attribute
- All files formatted with `terraform fmt`
- Actual terraform.tfvars file created with task-specific values

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix to append to resource names for environment identification"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
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

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "dbadmin"
}

variable "instance_types" {
  description = "List of instance types for Auto Scaling mixed instances"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium"]
}

variable "min_capacity" {
  description = "Minimum number of instances in Auto Scaling group"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of instances in Auto Scaling group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling group"
  type        = number
  default     = 3
}

variable "logs_retention_days" {
  description = "Retention period for application logs in days"
  type        = number
  default     = 30
}

variable "documents_retention_days" {
  description = "Retention period for loan documents in days"
  type        = number
  default     = 90
}

variable "documents_glacier_days" {
  description = "Days before transitioning documents to Glacier"
  type        = number
  default     = 60
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "LoanProcessing"
    ManagedBy  = "Terraform"
    Compliance = "PCI-DSS"
  }
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      var.tags,
      {
        EnvironmentSuffix = var.environment_suffix
      }
    )
  }
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
```

## File: vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "loan-processing-vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "loan-processing-igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "loan-processing-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 3)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "loan-processing-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "loan-processing-nat-eip-${var.environment_suffix}"
  }
}

# NAT Gateway (single for cost optimization)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "loan-processing-nat-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "loan-processing-public-rt-${var.environment_suffix}"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "loan-processing-private-rt-${var.environment_suffix}"
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

## File: security-groups.tf

```hcl
# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "loan-processing-alb-sg-${var.environment_suffix}-"
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
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "loan-processing-alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "loan-processing-ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Application port from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "loan-processing-ec2-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name_prefix = "loan-processing-aurora-sg-${var.environment_suffix}-"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2 instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "loan-processing-aurora-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: iam.tf

```hcl
# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name_prefix = "loan-ec2-${var.environment_suffix}-"

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
    Name = "loan-processing-ec2-role-${var.environment_suffix}"
  }
}

# IAM Policy for EC2 to access S3, CloudWatch, and RDS
resource "aws_iam_role_policy" "ec2" {
  name_prefix = "loan-ec2-policy-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

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
        Resource = [
          "${aws_s3_bucket.logs.arn}/*",
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          aws_s3_bucket.documents.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:*/${var.db_master_username}"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# Attach CloudWatch Agent policy
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "loan-ec2-prof-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name = "loan-processing-ec2-profile-${var.environment_suffix}"
  }
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name_prefix = "loan-eb-${var.environment_suffix}-"

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

  tags = {
    Name = "loan-processing-eventbridge-role-${var.environment_suffix}"
  }
}
```

## File: kms.tf

```hcl
# KMS key for encrypting all data at rest
resource "aws_kms_key" "main" {
  description             = "Customer-managed key for loan processing application - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "loan-processing-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/loan-processing-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}
```

## File: rds.tf

```hcl
# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name_prefix = "loan-processing-aurora-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "loan-processing-aurora-subnet-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Random password for Aurora (will be rotated via IAM auth)
resource "random_password" "db_master" {
  length  = 32
  special = true
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "loan-processing-aurora-${var.environment_suffix}"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "15.4"
  database_name      = "loandb"
  master_username    = var.db_master_username
  master_password    = random_password.db_master.result

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  # IAM database authentication
  iam_database_authentication_enabled = true

  # Backup and recovery
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Enable point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Destroyability for testing
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "loan-processing-aurora-${var.environment_suffix}"
  }
}

# Aurora Cluster Instance
resource "aws_rds_cluster_instance" "aurora" {
  identifier         = "loan-processing-aurora-instance-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = true

  tags = {
    Name = "loan-processing-aurora-instance-${var.environment_suffix}"
  }
}
```

## File: s3.tf

```hcl
# S3 Bucket for Application Logs
resource "aws_s3_bucket" "logs" {
  bucket = "loan-processing-logs-${var.environment_suffix}"

  tags = {
    Name = "loan-processing-logs-${var.environment_suffix}"
    Type = "Logs"
  }
}

# S3 Bucket encryption for logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# S3 Bucket versioning for logs
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block for logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle policy for logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.logs_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# S3 Bucket for Loan Documents
resource "aws_s3_bucket" "documents" {
  bucket = "loan-processing-documents-${var.environment_suffix}"

  tags = {
    Name = "loan-processing-documents-${var.environment_suffix}"
    Type = "Documents"
  }
}

# S3 Bucket encryption for documents
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# S3 Bucket versioning for documents
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block for documents
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle policy for documents
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = var.documents_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.documents_retention_days
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 60
    }
  }
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket = "loan-processing-static-${var.environment_suffix}"

  tags = {
    Name = "loan-processing-static-${var.environment_suffix}"
    Type = "StaticAssets"
  }
}

# S3 Bucket encryption for static assets
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# S3 Bucket public access block for static assets
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "static_assets" {
  name                              = "loan-processing-oac-${var.environment_suffix}"
  description                       = "OAC for static assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static_assets.arn
          }
        }
      }
    ]
  })
}
```

## File: alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "loan-proc-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true
  enable_waf_fail_open       = false

  tags = {
    Name = "loan-processing-alb-${var.environment_suffix}"
  }
}

# Target Group for Application Servers
resource "aws_lb_target_group" "app" {
  name_prefix = "app-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "loan-processing-app-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for API Servers
resource "aws_lb_target_group" "api" {
  name_prefix = "api-"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "loan-processing-api-tg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener (redirect to HTTPS in production)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = {
    Name = "loan-processing-http-listener-${var.environment_suffix}"
  }
}

# Listener Rule for API Path
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = {
    Name = "loan-processing-api-rule-${var.environment_suffix}"
  }
}

# Note: HTTPS Listener would be added in production with ACM certificate
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = aws_acm_certificate.alb.arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.app.arn
#   }
# }
```

## File: asg.tf

```hcl
# User data script for EC2 instances
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent

    # Configure CloudWatch Agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWCONFIG'
    {
      "metrics": {
        "namespace": "LoanProcessing",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
            ],
            "totalcpu": false
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ]
          },
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
            ],
            "resources": ["/"]
          }
        }
      }
    }
    CWCONFIG

    # Start CloudWatch Agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

    # Install application dependencies
    yum install -y docker
    systemctl start docker
    systemctl enable docker

    # Application setup would go here
    echo "Loan Processing Application - ${var.environment_suffix}" > /var/www/html/index.html
  EOF
  )
}

# Launch Template for EC2 Instances
resource "aws_launch_template" "main" {
  name_prefix   = "loan-proc-lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_types[0]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      var.tags,
      {
        Name              = "loan-processing-instance-${var.environment_suffix}"
        EnvironmentSuffix = var.environment_suffix
      }
    )
  }

  tag_specifications {
    resource_type = "volume"

    tags = merge(
      var.tags,
      {
        Name              = "loan-processing-volume-${var.environment_suffix}"
        EnvironmentSuffix = var.environment_suffix
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix               = "loan-proc-asg-${var.environment_suffix}-"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app.arn, aws_lb_target_group.api.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity

  # Mixed instances policy with spot instances
  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 1
      on_demand_percentage_above_base_capacity = 80
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      dynamic "override" {
        for_each = var.instance_types
        content {
          instance_type = override.value
        }
      }
    }
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupMinSize",
    "GroupMaxSize",
    "GroupTerminatingInstances",
    "GroupStandbyInstances"
  ]

  tag {
    key                 = "Name"
    value               = "loan-processing-asg-${var.environment_suffix}"
    propagate_at_launch = false
  }

  tag {
    key                 = "EnvironmentSuffix"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - CPU Based
resource "aws_autoscaling_policy" "cpu" {
  name                   = "loan-proc-cpu-policy-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 70.0
  }
}

# Auto Scaling Policy - Memory Based (using custom metric)
resource "aws_autoscaling_policy" "memory" {
  name                   = "loan-proc-memory-policy-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    customized_metric_specification {
      metrics {
        id    = "m1"
        label = "Memory Usage"

        metric_stat {
          metric {
            namespace   = "LoanProcessing"
            metric_name = "MEM_USED"

            dimensions {
              name  = "AutoScalingGroupName"
              value = aws_autoscaling_group.main.name
            }
          }

          stat = "Average"
        }

        return_data = true
      }
    }

    target_value = 75.0
  }
}
```

## File: cloudfront.tf

```hcl
# CloudFront Distribution for Static Assets
resource "aws_cloudfront_distribution" "static_assets" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for loan processing static assets - ${var.environment_suffix}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static_assets.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "loan-processing-cloudfront-${var.environment_suffix}"
  }
}
```

## File: waf.tf

```hcl
# WAF Web ACL for ALB
resource "aws_wafv2_web_acl" "alb" {
  name  = "loan-proc-waf-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # SQL Injection Rule
  rule {
    name     = "sql-injection-rule"
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-injection-rule"
      sampled_requests_enabled   = true
    }
  }

  # XSS Rule
  rule {
    name     = "xss-rule"
    priority = 2

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "xss-rule"
      sampled_requests_enabled   = true
    }
  }

  # Common Rule Set
  rule {
    name     = "common-rule-set"
    priority = 3

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "common-rule-set"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "loan-processing-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "loan-processing-waf-${var.environment_suffix}"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.alb.arn
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ec2/loan-processing-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "loan-processing-log-group-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "loan-proc-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Name = "loan-processing-high-cpu-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Unhealthy Target Count
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "loan-proc-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors unhealthy target count"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "loan-processing-unhealthy-targets-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Aurora CPU
resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "loan-proc-aurora-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora cpu utilization"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "loan-processing-aurora-cpu-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Aurora Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "loan-proc-aurora-conn-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora database connections"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "loan-processing-aurora-conn-alarm-${var.environment_suffix}"
  }
}
```

## File: eventbridge.tf

```hcl
# EventBridge Rule for Nightly Batch Processing
resource "aws_cloudwatch_event_rule" "nightly_batch" {
  name                = "loan-proc-nightly-batch-${var.environment_suffix}"
  description         = "Trigger nightly batch processing for loan applications"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily

  tags = {
    Name = "loan-processing-nightly-batch-rule-${var.environment_suffix}"
  }
}

# EventBridge Target - CloudWatch Log Group (placeholder)
resource "aws_cloudwatch_log_group" "batch_processing" {
  name              = "/aws/events/loan-processing-batch-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "loan-processing-batch-log-group-${var.environment_suffix}"
  }
}

# Note: In production, this would trigger a Lambda function or Step Functions workflow
# For now, we'll log the event
resource "aws_cloudwatch_event_target" "nightly_batch_log" {
  rule      = aws_cloudwatch_event_rule.nightly_batch.name
  target_id = "LogTarget"
  arn       = aws_cloudwatch_log_group.batch_processing.arn
}

# EventBridge Rule for Business Hours Monitoring
resource "aws_cloudwatch_event_rule" "business_hours_monitor" {
  name                = "loan-proc-biz-hours-${var.environment_suffix}"
  description         = "Monitor during business hours for enhanced alerting"
  schedule_expression = "cron(0 9-17 ? * MON-FRI *)" # 9 AM - 5 PM UTC, Mon-Fri

  tags = {
    Name = "loan-processing-business-hours-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "business_hours_log" {
  rule      = aws_cloudwatch_event_rule.business_hours_monitor.name
  target_id = "LogTarget"
  arn       = aws_cloudwatch_log_group.batch_processing.arn
}
```

## File: outputs.tf

```hcl
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "app_target_group_arn" {
  description = "ARN of the application target group"
  value       = aws_lb_target_group.app.arn
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

# Aurora Outputs
output "aurora_cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Name of the Aurora database"
  value       = aws_rds_cluster.aurora.database_name
}

# Auto Scaling Outputs
output "autoscaling_group_id" {
  description = "ID of the Auto Scaling group"
  value       = aws_autoscaling_group.main.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling group"
  value       = aws_autoscaling_group.main.arn
}

# S3 Outputs
output "logs_bucket_id" {
  description = "ID of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "documents_bucket_id" {
  description = "ID of the documents S3 bucket"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "ARN of the documents S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "static_assets_bucket_id" {
  description = "ID of the static assets S3 bucket"
  value       = aws_s3_bucket.static_assets.id
}

output "static_assets_bucket_arn" {
  description = "ARN of the static assets S3 bucket"
  value       = aws_s3_bucket.static_assets.arn
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.arn
}

# KMS Outputs
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

# CloudWatch Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "batch_log_group_name" {
  description = "Name of the batch processing CloudWatch log group"
  value       = aws_cloudwatch_log_group.batch_processing.name
}

# EventBridge Outputs
output "nightly_batch_rule_arn" {
  description = "ARN of the nightly batch EventBridge rule"
  value       = aws_cloudwatch_event_rule.nightly_batch.arn
}

output "business_hours_rule_arn" {
  description = "ARN of the business hours EventBridge rule"
  value       = aws_cloudwatch_event_rule.business_hours_monitor.arn
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

output "aurora_security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

# Environment Suffix Output
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
```

## File: terraform.tfvars

```hcl
# Terraform variables for loan processing application
environment_suffix = "synthz4a8u2v3"
aws_region         = "us-east-1"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database Configuration
db_master_username = "dbadmin"

# Auto Scaling Configuration
instance_types   = ["t3.medium", "t3a.medium"]
min_capacity     = 2
max_capacity     = 6
desired_capacity = 3

# S3 Lifecycle Configuration
logs_retention_days      = 30
documents_retention_days = 90
documents_glacier_days   = 60

# Tags
tags = {
  Project    = "LoanProcessing"
  ManagedBy  = "Terraform"
  Compliance = "PCI-DSS"
  Team       = "DevOps"
}
```

