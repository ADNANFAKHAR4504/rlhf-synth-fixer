# tap_stack.tf - Complete Infrastructure Stack

# ====================
# Variables
# ====================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ====================
# Locals
# ====================

locals {
  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Stack       = "tap-stack"
  }
  
  # Generate unique 4-byte suffix
  resource_suffix = "tap4"
  
  # Subnet calculations
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# ====================
# Data Sources
# ====================

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

# ====================
# VPC Resources
# ====================

# VPC
resource "aws_vpc" "main_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${local.resource_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = merge(local.common_tags, {
    Name = "igw-${local.resource_suffix}"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_eip" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "eip-nat-${count.index + 1}-${local.resource_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count                   = 3
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "subnet-public-${count.index + 1}-${local.resource_suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count             = 3
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "subnet-private-${count.index + 1}-${local.resource_suffix}"
    Type = "Private"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "nat_gateways" {
  count         = 3
  allocation_id = aws_eip.nat_eip[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = merge(local.common_tags, {
    Name = "nat-gateway-${count.index + 1}-${local.resource_suffix}"
  })

  depends_on = [aws_internet_gateway.igw]
}

# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(local.common_tags, {
    Name = "rt-public-${local.resource_suffix}"
  })
}

# Private Route Tables
resource "aws_route_table" "private_rt" {
  count  = 3
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateways[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "rt-private-${count.index + 1}-${local.resource_suffix}"
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public_rta" {
  count          = 3
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_rta" {
  count          = 3
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rt[count.index].id
}

# ====================
# Security Groups
# ====================

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "ec2-${local.resource_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "ec2-${local.resource_suffix}"
  })
}

# RDS Security Group - Very restrictive
resource "aws_security_group" "rds_sg" {
  name        = "rds-${local.resource_suffix}"
  description = "Restrictive security group for RDS database"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    description = "No outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  tags = merge(local.common_tags, {
    Name = "rds-${local.resource_suffix}"
  })
}

# ====================
# KMS Key
# ====================

resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "kms-s3-${local.resource_suffix}"
  })
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/s3-encryption-${local.resource_suffix}"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

# ====================
# S3 Buckets
# ====================

# Create random string for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket for server access logs
resource "aws_s3_bucket" "access_logs_bucket" {
  bucket = "access-logs-${local.resource_suffix}-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "access-logs-${local.resource_suffix}"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs_pab" {
  bucket = aws_s3_bucket.access_logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
    }
  }
}

# Main S3 bucket
resource "aws_s3_bucket" "main_bucket" {
  bucket = "main-bucket-${local.resource_suffix}-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "main-bucket-${local.resource_suffix}"
  })
}

resource "aws_s3_bucket_public_access_block" "main_bucket_pab" {
  bucket = aws_s3_bucket.main_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "main_bucket_versioning" {
  bucket = aws_s3_bucket.main_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_bucket_encryption" {
  bucket = aws_s3_bucket.main_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
    }
  }
}

resource "aws_s3_bucket_logging" "main_bucket_logging" {
  bucket = aws_s3_bucket.main_bucket.id

  target_bucket = aws_s3_bucket.access_logs_bucket.id
  target_prefix = "main-bucket-logs/"
}

# ====================
# IAM Roles and Policies
# ====================

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "ec2-role-${local.resource_suffix}"

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

  tags = merge(local.common_tags, {
    Name = "ec2-role-${local.resource_suffix}"
  })
}

# IAM Policy for S3 access (Least Privilege)
resource "aws_iam_policy" "s3_access_policy" {
  name        = "s3-access-policy-${local.resource_suffix}"
  description = "Policy for EC2 to access specific S3 bucket"

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
          aws_s3_bucket.main_bucket.arn,
          "${aws_s3_bucket.main_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.s3_encryption_key.arn]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "s3-access-policy-${local.resource_suffix}"
  })
}

# CloudWatch policy for EC2
resource "aws_iam_policy" "cloudwatch_policy" {
  name        = "cloudwatch-policy-${local.resource_suffix}"
  description = "Policy for EC2 to send logs to CloudWatch"

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

  tags = merge(local.common_tags, {
    Name = "cloudwatch-policy-${local.resource_suffix}"
  })
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "ec2_s3_attachment" {
  policy_arn = aws_iam_policy.s3_access_policy.arn
  role       = aws_iam_role.ec2_role.name
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_attachment" {
  policy_arn = aws_iam_policy.cloudwatch_policy.arn
  role       = aws_iam_role.ec2_role.name
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.ec2_role.name
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-profile-${local.resource_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "ec2-profile-${local.resource_suffix}"
  })
}

# ====================
# Random Resources for RDS
# ====================

# Random username (8 chars, starts with letter, no special chars)
resource "random_string" "rds_username" {
  length  = 7
  special = false
  number  = false
  upper   = false
}

resource "random_string" "rds_username_prefix" {
  length  = 1
  special = false
  numeric = false
  upper   = false
}

# Random password (16 chars with special chars, but only AWS-allowed ones)
resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

# ====================
# Secrets Manager
# ====================

resource "aws_secretsmanager_secret" "rds_credentials" {
  name = "rds-credentials-${local.resource_suffix}"

  tags = merge(local.common_tags, {
    Name = "rds-credentials-${local.resource_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_credentials_version" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "${random_string.rds_username_prefix.result}${random_string.rds_username.result}"
    password = random_password.rds_password.result
  })
}

# ====================
# RDS Resources
# ====================

# DB Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group-${local.resource_suffix}"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "rds-subnet-group-${local.resource_suffix}"
  })
}

# RDS Instance
resource "aws_db_instance" "main_db" {
  identifier     = "rds-instance-${local.resource_suffix}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.rds_instance_class

  allocated_storage     = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "maindb"
  username = "${random_string.rds_username_prefix.result}${random_string.rds_username.result}"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name

  multi_az                    = true
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  skip_final_snapshot         = true
  deletion_protection         = false

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name = "rds-instance-${local.resource_suffix}"
  })
}

# ====================
# EC2 Instances
# ====================

resource "aws_instance" "app_servers" {
  count                  = 3
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.private_subnets[count.index].id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOL
    {
      "metrics": {
        "namespace": "TAP-Stack",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "totalcpu": false
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ]
          }
        }
      }
    }
    EOL
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "ec2-instance-${count.index + 1}-${local.resource_suffix}"
  })
}

# ====================
# CloudFront Distribution
# ====================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${local.resource_suffix}"
}

# S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "main_bucket_policy" {
  bucket = aws_s3_bucket.main_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.main_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.main_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  # Cost optimization - using PriceClass_100 for lowest cost
  price_class = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.main_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "cloudfront-${local.resource_suffix}"
  })
}

# ====================
# CloudWatch Resources
# ====================

resource "aws_cloudwatch_dashboard" "main_dashboard" {
  dashboard_name = "dashboard-${local.resource_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["TAP-Stack", "cpu_usage_user", { stat = "Average" }],
            [".", "cpu_usage_system", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 CPU Usage"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["TAP-Stack", "mem_used_percent", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 Memory Usage"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = 3
  alarm_name          = "high-cpu-instance-${count.index + 1}-${local.resource_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.app_servers[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "high-cpu-alarm-${count.index + 1}-${local.resource_suffix}"
  })
}

# ====================
# Outputs
# ====================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main_vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main_vpc.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.igw.id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.nat_gateways[*].id
}

output "ec2_instance_ids" {
  description = "IDs of EC2 instances"
  value       = aws_instance.app_servers[*].id
}

output "ec2_instance_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.app_servers[*].private_ip
}

output "ec2_security_group_id" {
  description = "ID of EC2 security group"
  value       = aws_security_group.ec2_sg.id
}

output "rds_security_group_id" {
  description = "ID of RDS security group"
  value       = aws_security_group.rds_sg.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main_db.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main_db.id
}

output "rds_secret_arn" {
  description = "ARN of RDS credentials in Secrets Manager"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "s3_main_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main_bucket.id
}

output "s3_main_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main_bucket.arn
}

output "s3_access_logs_bucket_name" {
  description = "Name of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs_bucket.id
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}

output "iam_ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "iam_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main_dashboard.dashboard_name
}

output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "route_table_public_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public_rt.id
}

output "route_table_private_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private_rt[*].id
}
