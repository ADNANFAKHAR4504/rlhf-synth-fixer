# tap_stack.tf - Complete Infrastructure Stack Configuration

# ==========================================
# VARIABLES
# ==========================================

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environments" {
  description = "List of environments to create"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "instance_type" {
  description = "EC2 instance type per environment"
  type        = map(string)
  default = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "alerts@example.com"
}

# ==========================================
# DATA SOURCES
# ==========================================

# Get available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
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

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ==========================================
# RANDOM RESOURCES FOR UNIQUE SUFFIXES
# ==========================================

# Random suffix for each environment
resource "random_string" "env_suffix" {
  for_each = toset(var.environments)
  
  length  = 4
  special = false
  upper   = false
  lower   = true
  numeric = false
}

# ==========================================
# LOCALS
# ==========================================

locals {
  # Common tags for all resources
  common_tags = {
    ManagedBy   = "Terraform"
    Project     = "tap-stack"
    Region      = var.region
  }

  # Subnet CIDR calculations
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 0),  # 10.0.0.0/24
    cidrsubnet(var.vpc_cidr, 8, 1)   # 10.0.1.0/24
  ]
  
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 10), # 10.0.10.0/24
    cidrsubnet(var.vpc_cidr, 8, 11)  # 10.0.11.0/24
  ]

  # Environment-specific suffixes
  env_suffixes = {
    for env in var.environments : env => random_string.env_suffix[env].result
  }

  # Resource naming conventions
  resource_names = {
    vpc                 = "tap-vpc"
    igw                 = "tap-igw"
    public_subnet       = "tap-public-subnet"
    private_subnet      = "tap-private-subnet"
    nat_gateway         = "tap-natgw"
    eip                 = "tap-eip"
    public_route_table  = "tap-public-rt"
    private_route_table = "tap-private-rt"
    security_group      = "tap-sg"
    ec2_instance        = "tap-instance"
    s3_bucket           = "tap-bucket"
    iam_role            = "tap-ec2-role"
    iam_policy          = "tap-s3-policy"
    cloudtrail          = "tap-trail"
    cloudwatch_log      = "tap-cwlog"
    sns_topic           = "tap-alerts"
    kms_key             = "tap-kms"
  }
}

# ==========================================
# KMS KEYS FOR ENCRYPTION
# ==========================================

# KMS key for S3 bucket encryption per environment
resource "aws_kms_key" "s3_encryption" {
  for_each = toset(var.environments)
  
  description             = "KMS key for S3 bucket encryption - ${each.key}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.kms_key}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# KMS key alias per environment
resource "aws_kms_alias" "s3_encryption" {
  for_each = toset(var.environments)
  
  name          = "alias/${local.resource_names.kms_key}-${each.key}-${local.env_suffixes[each.key]}"
  target_key_id = aws_kms_key.s3_encryption[each.key].key_id
}

# ==========================================
# VPC AND NETWORKING
# ==========================================

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = local.resource_names.vpc
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = local.resource_names.igw
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.public_subnet}-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.private_subnet}-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2
  
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.eip}-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.nat_gateway}-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
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
      Name = local.resource_names.public_route_table
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 2
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.private_route_table}-${count.index + 1}"
    }
  )
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count = 2
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==========================================
# SECURITY GROUPS
# ==========================================

# Security Group for EC2 instances per environment
resource "aws_security_group" "ec2" {
  for_each = toset(var.environments)
  
  name        = "${local.resource_names.security_group}-${each.key}-${local.env_suffixes[each.key]}"
  description = "Security group for EC2 instances in ${each.key} environment"
  vpc_id      = aws_vpc.main.id
  
  # SSH access (restrict in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = each.key == "prod" ? ["10.0.0.0/16"] : ["0.0.0.0/0"]
    description = "SSH access"
  }
  
  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }
  
  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }
  
  # Outbound traffic
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
      Name        = "${local.resource_names.security_group}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# ==========================================
# IAM ROLES AND POLICIES
# ==========================================

# IAM role for EC2 instances per environment
resource "aws_iam_role" "ec2_role" {
  for_each = toset(var.environments)
  
  name = "${local.resource_names.iam_role}-${each.key}-${local.env_suffixes[each.key]}"
  
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
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.iam_role}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# IAM policy for S3 access per environment (Least Privilege)
resource "aws_iam_policy" "s3_access" {
  for_each = toset(var.environments)
  
  name        = "${local.resource_names.iam_policy}-${each.key}-${local.env_suffixes[each.key]}"
  description = "Policy for EC2 to access S3 bucket in ${each.key} environment"
  
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
          aws_s3_bucket.environment[each.key].arn,
          "${aws_s3_bucket.environment[each.key].arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_encryption[each.key].arn
      }
    ]
  })
}

# Attach S3 policy to EC2 role
resource "aws_iam_role_policy_attachment" "s3_access" {
  for_each = toset(var.environments)
  
  role       = aws_iam_role.ec2_role[each.key].name
  policy_arn = aws_iam_policy.s3_access[each.key].arn
}

# CloudWatch Logs policy attachment
resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  for_each = toset(var.environments)
  
  role       = aws_iam_role.ec2_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# SSM policy for EC2 management
resource "aws_iam_role_policy_attachment" "ssm_managed" {
  for_each = toset(var.environments)
  
  role       = aws_iam_role.ec2_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  for_each = toset(var.environments)
  
  name = "${local.resource_names.iam_role}-profile-${each.key}-${local.env_suffixes[each.key]}"
  role = aws_iam_role.ec2_role[each.key].name
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.iam_role}-profile-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# ==========================================
# S3 BUCKETS
# ==========================================

# S3 bucket for each environment
resource "aws_s3_bucket" "environment" {
  for_each = toset(var.environments)
  
  bucket = "${local.resource_names.s3_bucket}-${each.key}-${local.env_suffixes[each.key]}"
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.s3_bucket}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# Block public access for S3 buckets
resource "aws_s3_bucket_public_access_block" "environment" {
  for_each = toset(var.environments)
  
  bucket = aws_s3_bucket.environment[each.key].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for S3 buckets
resource "aws_s3_bucket_versioning" "environment" {
  for_each = toset(var.environments)
  
  bucket = aws_s3_bucket.environment[each.key].id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for S3 buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "environment" {
  for_each = toset(var.environments)
  
  bucket = aws_s3_bucket.environment[each.key].id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption[each.key].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.resource_names.s3_bucket}-cloudtrail-${random_string.env_suffix["dev"].result}"
  
  tags = merge(
    local.common_tags,
    {
      Name    = "${local.resource_names.s3_bucket}-cloudtrail"
      Purpose = "CloudTrail Logs"
    }
  )
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

# ==========================================
# EC2 INSTANCES
# ==========================================

# EC2 instances for each environment
resource "aws_instance" "environment" {
  for_each = toset(var.environments)
  
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type[each.key]
  subnet_id              = aws_subnet.private[0].id  # Place in first private subnet
  vpc_security_group_ids = [aws_security_group.ec2[each.key].id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile[each.key].name
  
  # Enable monitoring
  monitoring = true
  
  # User data script for CloudWatch agent installation
  user_data = <<-EOF
    #!/bin/bash
    # Update system
    yum update -y
    
    # Install CloudWatch agent
    wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Install SSM agent (usually pre-installed on AL2)
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
    
    # Basic CloudWatch agent configuration
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOC
    {
      "metrics": {
        "namespace": "TAP/${each.key}",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
            ],
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
    EOC
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
      -s
  EOF
  
  root_block_device {
    volume_type           = "gp3"
    volume_size           = each.key == "prod" ? 50 : 20
    encrypted             = true
    delete_on_termination = true
  }
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.ec2_instance}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# ==========================================
# CLOUDTRAIL
# ==========================================

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  for_each = toset(var.environments)
  
  name              = "/aws/cloudtrail/${each.key}-${local.env_suffixes[each.key]}"
  retention_in_days = each.key == "prod" ? 90 : 30
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.cloudwatch_log}-cloudtrail-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "${local.resource_names.iam_role}-cloudtrail-${random_string.env_suffix["dev"].result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_names.iam_role}-cloudtrail"
    }
  )
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-logs-policy"
  role = aws_iam_role.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/*"
      }
    ]
  })
}

# CloudTrail for each environment
resource "aws_cloudtrail" "environment" {
  for_each = toset(var.environments)
  
  name                          = "${local.resource_names.cloudtrail}-${each.key}-${local.env_suffixes[each.key]}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = each.key
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true
  
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail[each.key].arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.environment[each.key].arn}/"]
    }
  }
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.cloudtrail}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ==========================================
# CLOUDWATCH MONITORING AND SNS ALERTS
# ==========================================

# SNS Topic for alerts per environment
resource "aws_sns_topic" "alerts" {
  for_each = toset(var.environments)
  
  name = "${local.resource_names.sns_topic}-${each.key}-${local.env_suffixes[each.key]}"
  
  tags = merge(
    local.common_tags,
    {
      Name        = "${local.resource_names.sns_topic}-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# SNS Topic subscription
resource "aws_sns_topic_subscription" "alerts_email" {
  for_each = toset(var.environments)
  
  topic_arn = aws_sns_topic.alerts[each.key].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms for EC2 CPU utilization
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  for_each = toset(var.environments)
  
  alarm_name          = "high-cpu-${each.key}-${local.env_suffixes[each.key]}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = each.key == "prod" ? "80" : "90"
  alarm_description   = "This metric monitors EC2 CPU utilization in ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts[each.key].arn]
  
  dimensions = {
    InstanceId = aws_instance.environment[each.key].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name        = "high-cpu-alarm-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# CloudWatch Alarms for EC2 status check
resource "aws_cloudwatch_metric_alarm" "instance_status_check" {
  for_each = toset(var.environments)
  
  alarm_name          = "instance-status-${each.key}-${local.env_suffixes[each.key]}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 instance status check in ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts[each.key].arn]
  
  dimensions = {
    InstanceId = aws_instance.environment[each.key].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name        = "status-check-alarm-${each.key}-${local.env_suffixes[each.key]}"
      Environment = each.key
    }
  )
}

# CloudWatch Dashboard for each environment
resource "aws_cloudwatch_dashboard" "environment" {
  for_each = toset(var.environments)
  
  dashboard_name = "tap-dashboard-${each.key}-${local.env_suffixes[each.key]}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }],
            [".", "NetworkIn", { stat = "Sum", label = "Network In" }],
            [".", "NetworkOut", { stat = "Sum", label = "Network Out" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "EC2 Metrics - ${each.key}"
          period  = 300
        }
      }
    ]
  })
}

# ==========================================
# OUTPUTS
# ==========================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
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

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# EC2 Instance Outputs
output "ec2_instance_ids" {
  description = "IDs of EC2 instances by environment"
  value = {
    for env in var.environments : env => aws_instance.environment[env].id
  }
}

output "ec2_instance_private_ips" {
  description = "Private IPs of EC2 instances by environment"
  value = {
    for env in var.environments : env => aws_instance.environment[env].private_ip
  }
}

output "ec2_instance_public_ips" {
  description = "Public IPs of EC2 instances by environment"
  value = {
    for env in var.environments : env => aws_instance.environment[env].public_ip
  }
}

# S3 Bucket Outputs
output "s3_bucket_ids" {
  description = "IDs of S3 buckets by environment"
  value = {
    for env in var.environments : env => aws_s3_bucket.environment[env].id
  }
}

output "s3_bucket_arns" {
  description = "ARNs of S3 buckets by environment"
  value = {
    for env in var.environments : env => aws_s3_bucket.environment[env].arn
  }
}

output "s3_bucket_domains" {
  description = "Domain names of S3 buckets by environment"
  value = {
    for env in var.environments : env => aws_s3_bucket.environment[env].bucket_domain_name
  }
}

output "cloudtrail_s3_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

# IAM Role Outputs
output "iam_role_arns" {
  description = "ARNs of IAM roles by environment"
  value = {
    for env in var.environments : env => aws_iam_role.ec2_role[env].arn
  }
}

output "iam_role_names" {
  description = "Names of IAM roles by environment"
  value = {
    for env in var.environments : env => aws_iam_role.ec2_role[env].name
  }
}

output "iam_instance_profile_names" {
  description = "Names of IAM instance profiles by environment"
  value = {
    for env in var.environments : env => aws_iam_instance_profile.ec2_profile[env].name
  }
}

# CloudTrail Outputs
output "cloudtrail_arns" {
  description = "ARNs of CloudTrail trails by environment"
  value = {
    for env in var.environments : env => aws_cloudtrail.environment[env].arn
  }
}

output "cloudtrail_names" {
  description = "Names of CloudTrail trails by environment"
  value = {
    for env in var.environments : env => aws_cloudtrail.environment[env].name
  }
}

# CloudWatch Log Group Outputs
output "cloudwatch_log_group_names" {
  description = "Names of CloudWatch Log Groups by environment"
  value = {
    for env in var.environments : env => aws_cloudwatch_log_group.cloudtrail[env].name
  }
}

# SNS Topic Outputs
output "sns_topic_arns" {
  description = "ARNs of SNS topics by environment"
  value = {
    for env in var.environments : env => aws_sns_topic.alerts[env].arn
  }
}

# KMS Key Outputs
output "kms_key_ids" {
  description = "IDs of KMS keys by environment"
  value = {
    for env in var.environments : env => aws_kms_key.s3_encryption[env].id
  }
}

output "kms_key_arns" {
  description = "ARNs of KMS keys by environment"
  value = {
    for env in var.environments : env => aws_kms_key.s3_encryption[env].arn
  }
}

# Security Group Outputs
output "security_group_ids" {
  description = "IDs of security groups by environment"
  value = {
    for env in var.environments : env => aws_security_group.ec2[env].id
  }
}

# AMI Information Output
output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "ami_name" {
  description = "Name of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.name
}

# Environment Suffixes Output
output "environment_suffixes" {
  description = "Random suffixes generated for each environment"
  value       = local.env_suffixes
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# CloudWatch Dashboard URLs
output "cloudwatch_dashboard_urls" {
  description = "URLs to CloudWatch Dashboards by environment"
  value = {
    for env in var.environments : env => "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.environment[env].dashboard_name}"
  }
}

# Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region for deployment"
  value       = var.region
}
