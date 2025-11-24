# tap_stack.tf - Complete Infrastructure Stack Configuration

# ===========================
# Variables
# ===========================

variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "tap-stack"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner for tagging"
  type        = string
  default     = "DevOps-Team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = "tap-stack-key"
}

# ===========================
# Data Sources
# ===========================

data "aws_availability_zones" "available" {
  state = "available"
}

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

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

data "aws_caller_identity" "current" {}

# ===========================
# Locals
# ===========================

locals {
  # Common tags for all resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
  }

  # Naming conventions
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Network configuration
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Subnet CIDR blocks
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  
  # Database configuration
  db_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

# ===========================
# Random Resources for RDS
# ===========================

resource "random_string" "rds_username" {
  length  = 8
  special = false
  upper   = true
  lower   = true
  numeric = false
}

resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"
}

# ===========================
# VPC and Networking
# ===========================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-igw"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Database Subnets (for RDS Multi-AZ)
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-subnet-${count.index + 1}"
      Type = "Database"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
    }
  )
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-public-rt"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    }
  )
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ===========================
# Security Groups
# ===========================

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Restrict SSH access (only from VPC)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "SSH from VPC only"
  }

  # HTTPS inbound
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  # HTTP inbound
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ec2-sg"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id, aws_security_group.lambda.id]
    description     = "MySQL from EC2 and Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-sg"
    }
  )
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-sg"
    }
  )
}

# ===========================
# S3 Bucket
# ===========================

resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-secure-bucket-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-s3-bucket"
    }
  )
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy - Deny non-HTTPS requests
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ===========================
# IAM Roles and Policies
# ===========================

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

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

# IAM Policy for EC2
resource "aws_iam_role_policy" "ec2" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2.id

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
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for AWS Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# ===========================
# EC2 Instance
# ===========================

resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  monitoring             = true # Enable detailed CloudWatch monitoring

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # IMDSv2
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    # Configure CloudWatch agent
    cat << 'CONFIG' > /opt/aws/amazon-cloudwatch-agent/etc/config.json
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "unit": "Percent"},
              "cpu_usage_system",
              "cpu_usage_user"
            ],
            "totalcpu": false,
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    CONFIG
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s
  EOF

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ec2-instance"
    }
  )
}

# ===========================
# RDS Database
# ===========================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-subnet-group"
    }
  )
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-rds-instance"

  # Database configuration
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Credentials
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High availability
  multi_az = true
  
  # Maintenance and backup
  auto_minor_version_upgrade = true
  backup_retention_period    = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "sun:04:00-sun:05:00"
  
  # Protection settings
  deletion_protection = false
  skip_final_snapshot = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-instance"
    }
  )
}

# ===========================
# Secrets Manager
# ===========================

resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "${local.name_prefix}-rds-credentials"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# ===========================
# Lambda Function
# ===========================

resource "aws_lambda_function" "main" {
  function_name = "${local.name_prefix}-security-monitor"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11" # Latest secure runtime
  timeout       = 60

  # VPC Configuration
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  # Inline code
  filename = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      PROJECT     = var.project_name
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-function"
    }
  )
}

# Create Lambda deployment package inline
data "archive_file" "lambda_code" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    Security monitoring Lambda function
    Monitors for unauthorized API access and security events
    """
    
    # Initialize clients
    cloudwatch = boto3.client('cloudwatch')
    sns = boto3.client('sns')
    
    # Process security events
    security_event = {
        'timestamp': datetime.now().isoformat(),
        'environment': os.environ.get('ENVIRONMENT', 'unknown'),
        'project': os.environ.get('PROJECT', 'unknown'),
        'event_type': event.get('detail-type', 'unknown'),
        'event_details': event
    }
    
    # Log the security event
    print(f"Security Event Detected: {json.dumps(security_event)}")
    
    # Check for unauthorized API access patterns
    if event.get('detail', {}).get('errorCode') in ['UnauthorizedAccess', 'AccessDenied', 'TokenRefreshRequired']:
        # Send custom metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='Security/Monitoring',
            MetricData=[
                {
                    'MetricName': 'UnauthorizedAPIAccess',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Security event processed',
                'event_type': 'unauthorized_access_detected'
            })
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Event processed successfully',
            'timestamp': datetime.now().isoformat()
        })
    }
EOT
    filename = "index.py"
  }
}

# ===========================
# AWS Config
# ===========================

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-bucket-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-config-bucket"
    }
  )
}

# S3 Bucket Policy for Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config.id
}

# Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules - S3 Bucket Public Read Prohibited
resource "aws_config_config_rule" "s3_public_read" {
  name = "${local.name_prefix}-s3-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  tags = local.common_tags
}

# Config Rules - RDS Encryption Enabled
resource "aws_config_config_rule" "rds_encryption" {
  name = "${local.name_prefix}-rds-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = local.common_tags
}

# Config Rules - EC2 Instance Managed by SSM
resource "aws_config_config_rule" "ec2_ssm_managed" {
  name = "${local.name_prefix}-ec2-ssm-managed"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_MANAGED_BY_SSM"
  }

  tags = local.common_tags
}

# ===========================
# CloudWatch Alarms
# ===========================

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-security-alarms"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-sns-topic"
    }
  )
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.main.function_name}"
  retention_in_days = 30

  tags = local.common_tags
}

# CloudWatch Metric Filter for Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = "aws-cloudtrail-logs"
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "Security/Monitoring"
    value     = "1"
  }
}

# CloudWatch Alarm for Unauthorized API Access
resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-access"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "Security/Monitoring"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on unauthorized API access attempts"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when RDS CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${local.name_prefix}-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when EC2 CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    InstanceId = aws_instance.main.id
  }

  tags = local.common_tags
}

# ===========================
# WAF Web ACL
# ===========================

resource "aws_wafv2_web_acl" "main" {
  name  = "${local.name_prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule to block SQL injection attacks
  rule {
    name     = "SQLiRule"
    priority = 1

    statement {
      sqli_match_statement {
        field_to_match {
          body {
            oversize_handling = "MATCH"
          }
        }

        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }

  # Rule to block XSS attacks
  rule {
    name     = "XSSRule"
    priority = 2

    statement {
      xss_match_statement {
        field_to_match {
          body {
            oversize_handling = "MATCH"
          }
        }

        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSRule"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3

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

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-waf"
    }
  )
}

# ===========================
# Outputs
# ===========================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_instance_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2"
  value       = aws_security_group.ec2.id
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "lambda_security_group_id" {
  description = "Security group ID for Lambda"
  value       = aws_security_group.lambda.id
}

output "iam_role_ec2_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "iam_role_lambda_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda.arn
}

output "iam_role_config_arn" {
  description = "ARN of the AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch log group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_bucket_id" {
  description = "ID of the Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = local.azs
}

output "region" {
  description = "The AWS region used for deployment"
  value       = var.region
}
