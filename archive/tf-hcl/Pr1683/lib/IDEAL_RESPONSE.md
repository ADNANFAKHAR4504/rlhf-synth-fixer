# Infrastructure Code Response - Ideal Solution

Based on your requirements, here is a comprehensive and production-ready Terraform infrastructure that implements all specified requirements with best practices for security, scalability, and maintainability.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.4"
    }
  }

  # Partial backend config for S3 state management
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Environment suffix for resource isolation"
  type        = string
  default     = ""
}

variable "random_id" {
  description = "Random identifier for resource naming"
  type        = string
  default     = "a1b2c3"
}
```

## File: locals.tf

```hcl
locals {
  # Use environment suffix if provided, otherwise generate a unique one
  env_suffix  = var.environment_suffix != "" ? var.environment_suffix : "synth${var.random_id}"
  name_prefix = "AppResource-${var.environment}-${local.env_suffix}"

  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = local.env_suffix
    ManagedBy         = "terraform"
    Project           = "WebAppInfra"
  }
}
```

## File: tap_stack.tf

```hcl
# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

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

# VPC with Multi-AZ Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
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

# Public Subnets in multiple AZs for high availability
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets in multiple AZs
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
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
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group - Deny all by default, allow only HTTP/HTTPS
resource "aws_security_group" "web_servers" {
  name        = "${local.name_prefix}-web-servers-sg"
  description = "Security group for web servers - allows HTTP/HTTPS only"
  vpc_id      = aws_vpc.main.id

  # HTTP access from internet
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from internet"
  }

  # HTTPS access from internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from internet"
  }

  # Outbound internet access for updates
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-servers-sg"
  })
}

# IAM Role for EC2 instances - No embedded credentials
resource "aws_iam_role" "ec2_role" {
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

# IAM Policy for S3 and DynamoDB access
resource "aws_iam_policy" "ec2_policy" {
  name        = "${local.name_prefix}-ec2-policy"
  description = "Policy for EC2 instances to access S3 and DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${lower(local.name_prefix)}-app-logs-${random_string.bucket_suffix.result}",
          "arn:aws:s3:::${lower(local.name_prefix)}-app-logs-${random_string.bucket_suffix.result}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.app_table.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# EC2 Instances in multiple AZs with CloudWatch monitoring
resource "aws_instance" "web_servers" {
  count                  = 2
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[count.index].id
  vpc_security_group_ids = [aws_security_group.web_servers.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring for CloudWatch
  monitoring = true

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server ${count.index + 1} in AZ ${data.aws_availability_zones.available.names[count.index]}</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent for enhanced monitoring
    yum install -y amazon-cloudwatch-agent
    
    # Create CloudWatch agent config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CONFIG'
    {
      "metrics": {
        "namespace": "AWS/EC2/Custom",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ],
            "totalcpu": false
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "diskio": {
            "measurement": [
              "io_time"
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
CONFIG
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
      -s
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-server-${count.index + 1}"
  })
}

# Random suffix for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for application logs with versioning enabled
resource "aws_s3_bucket" "app_logs" {
  bucket        = lower("${local.name_prefix}-app-logs-${random_string.bucket_suffix.result}")
  force_destroy = true # Allow bucket deletion even with objects

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

# Enable versioning on S3 bucket
resource "aws_s3_bucket_versioning" "app_logs_versioning" {
  bucket = aws_s3_bucket.app_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "app_logs_pab" {
  bucket                  = aws_s3_bucket.app_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs_encryption" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DynamoDB Table with on-demand scaling
resource "aws_dynamodb_table" "app_table" {
  name                        = "${local.name_prefix}-app-table"
  billing_mode                = "PAY_PER_REQUEST" # On-demand scaling
  hash_key                    = "id"
  deletion_protection_enabled = false # Allow table deletion

  attribute {
    name = "id"
    type = "S"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-table"
  })
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-log-group"
  })
}

# CloudWatch Alarms for EC2 instances
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = length(aws_instance.web_servers)
  alarm_name          = "${local.name_prefix}-high-cpu-${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.web_servers[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-high-cpu-alarm-${count.index + 1}"
  })
}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "app_dashboard" {
  dashboard_name = "${local.name_prefix}-dashboard"

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
            for instance in aws_instance.web_servers : [
              "AWS/EC2",
              "CPUUtilization",
              "InstanceId",
              instance.id
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 Instance CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.app_table.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.app_table.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Capacity Utilization"
          period  = 300
        }
      }
    ]
  })
}
```

## File: outputs.tf

```hcl
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

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.web_servers[*].id
}

output "ec2_public_ips" {
  description = "Public IP addresses of the EC2 instances"
  value       = aws_instance.web_servers[*].public_ip
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_logs.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.name
}

output "security_group_id" {
  description = "ID of the web servers security group"
  value       = aws_security_group.web_servers.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.app_dashboard.dashboard_name}"
}
```

## Key Improvements and Best Practices

This ideal solution incorporates several critical improvements:

### 1. **Environment Isolation**
- Added `environment_suffix` variable for unique resource naming across deployments
- Ensures no resource naming conflicts when deploying to the same AWS account

### 2. **Destroyable Resources**
- S3 bucket has `force_destroy = true` for cleanup
- DynamoDB table has `deletion_protection_enabled = false`
- All resources can be cleanly destroyed

### 3. **Security Best Practices**
- IAM roles instead of embedded credentials
- Security groups deny all traffic by default
- Only ports 80 and 443 are open to the internet
- S3 bucket has public access blocked
- Server-side encryption enabled for S3 and DynamoDB

### 4. **High Availability**
- Resources deployed across multiple availability zones
- EC2 instances in different AZs for fault tolerance
- VPC with public and private subnets in multiple AZs

### 5. **Monitoring and Observability**
- CloudWatch monitoring enabled for all EC2 instances
- CloudWatch alarms for CPU utilization
- CloudWatch dashboard for centralized monitoring
- CloudWatch agent installed for enhanced metrics

### 6. **Naming Conventions**
- Follows the pattern: `AppResource-<Stage>-<environment_suffix>`
- Consistent tagging strategy with common_tags
- S3 bucket names are lowercase to comply with AWS requirements

### 7. **Infrastructure as Code Best Practices**
- Modular file structure with separation of concerns
- Use of data sources for dynamic values
- Proper resource dependencies
- Comprehensive outputs for integration

This solution meets all 6 requirements and 9 constraints specified in the original task while implementing AWS best practices for production-ready infrastructure.