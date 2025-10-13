# tap_stack.tf - Production-Grade AWS Infrastructure Stack
# Region: us-east-1
# Purpose: Secure, compliant AWS foundation for production workloads

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
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
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "allowed_ssh_ips" {
  description = "IP addresses allowed to SSH to bastion"
  type        = list(string)
  default     = [] # Replace with your actual IP ranges
}

variable "ec2_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

variable "project_prefix" {
  description = "Project prefix for naming"
  type        = string
  default     = "nova"
}

variable "domain_name" {
  description = "Domain name for CloudFront distribution"
  type        = string
  default     = "example.com" # Replace with your domain
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

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

# ============================================================================
# LOCALS
# ============================================================================

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Project     = var.project_prefix
  }

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  s3_logging_bucket = "${var.project_prefix}-logs-prd-${data.aws_caller_identity.current.account_id}"
  s3_app_bucket     = "${var.project_prefix}-app-prd-${data.aws_caller_identity.current.account_id}"
  cloudtrail_name   = "${var.project_prefix}-trail-prd"
}

# ============================================================================
# KMS KEYS
# ============================================================================

# KMS key for EBS encryption
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 and AutoScaling to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "autoscaling.amazonaws.com"
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "autoscaling.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      },
      {
        Sid    = "Allow Auto Scaling service-linked role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-ebs-kms-prd"
  })
}

resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/${var.project_prefix}-ebs-prd"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}

# KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      # Allow CloudTrail to encrypt with this key
      {
        "Sid" : "AllowCloudTrailEncrypt",
        "Effect" : "Allow",
        "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
        "Action" : [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        "Resource" : "*",
        "Condition" : {
          "StringLike" : {
            "kms:EncryptionContext:aws:cloudtrail:arn" : "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      # (Optional but common) Allow decrypt via S3 for your account (reading logs, validations)
      {
        "Sid" : "AllowCloudTrailDecryptViaS3",
        "Effect" : "Allow",
        "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
        "Action" : [
          "kms:Decrypt"
        ],
        "Resource" : "*",
        "Condition" : {
          "StringEquals" : {
            "kms:CallerAccount" : "${data.aws_caller_identity.current.account_id}",
            "kms:ViaService" : "s3.${var.aws_region}.amazonaws.com"
          }
        }
      },
      # Allow AWS Config to encrypt to this key
      {
        "Sid" : "AllowConfigEncrypt",
        "Effect" : "Allow",
        "Principal" : { "Service" : "config.amazonaws.com" },
        "Action" : [
          "kms:GenerateDataKey*",
          "kms:Encrypt",
          "kms:DescribeKey"
        ],
        "Resource" : "*",
        "Condition" : {
          "StringEquals" : {
            "kms:CallerAccount" : "${data.aws_caller_identity.current.account_id}",
            "kms:ViaService" : "s3.${var.aws_region}.amazonaws.com"
          }
        }
      }

    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-s3-kms-prd"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${var.project_prefix}-s3-prd"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ============================================================================
# NETWORKING - VPC
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpc-prd"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  log_destination      = aws_s3_bucket.logging.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpc-flow-logs-prd"
  })
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.project_prefix}-vpc-flow-logs-role-prd"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-igw-prd"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-public-subnet-${count.index + 1}-prd"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-subnet-${count.index + 1}-prd"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat-eip-${count.index + 1}-prd"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat-gateway-${count.index + 1}-prd"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-public-rt-prd"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-rt-${count.index + 1}-prd"
  })
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
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for EC2 instances
resource "aws_security_group" "ec2_instances" {
  name        = "${var.project_prefix}-ec2-sg-prd"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  # SSH access from allowed IPs only
  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_ips
  }

  # HTTPS inbound from VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # HTTP inbound from VPC
  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Outbound internet access
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-ec2-sg-prd"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_instance_role" {
  name = "${var.project_prefix}-ec2-role-prd"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# IAM Policy for EC2 to access KMS for EBS encryption
resource "aws_iam_policy" "ec2_kms_access" {
  name        = "${var.project_prefix}-ec2-kms-policy-prd"
  description = "Allow EC2 instances to use KMS keys for EBS encryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.ebs_encryption.arn,
          aws_kms_key.s3_encryption.arn
        ]
      }
    ]
  })
}

# IAM Policy for EC2 to access SNS
resource "aws_iam_policy" "ec2_sns_access" {
  name        = "${var.project_prefix}-ec2-sns-policy-prd"
  description = "Allow EC2 instances to publish to SNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:Subscribe"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# IAM Policy for EC2 to access SSM
resource "aws_iam_policy" "ec2_ssm_access" {
  name        = "${var.project_prefix}-ec2-ssm-policy-prd"
  description = "Allow EC2 instances to use SSM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:ListAssociations",
          "ssm:ListInstanceAssociations",
          "ssm:GetDocument",
          "ssm:DescribeDocument"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::aws-ssm-${var.aws_region}/*",
          "arn:aws:s3:::aws-windows-downloads-${var.aws_region}/*",
          "arn:aws:s3:::amazon-ssm-${var.aws_region}/*",
          "arn:aws:s3:::amazon-ssm-packages-${var.aws_region}/*",
          "arn:aws:s3:::${var.aws_region}-birdwatcher-prod/*",
          "arn:aws:s3:::patch-baseline-snapshot-${var.aws_region}/*"
        ]
      }
    ]
  })
}

# Attach policies to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_kms" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.ec2_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_sns" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.ec2_sns_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.ec2_ssm_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_prefix}-ec2-profile-prd"
  role = aws_iam_role.ec2_instance_role.name

  tags = local.common_tags
}

# ============================================================================
# EC2 INSTANCES
# ============================================================================

# Launch Template for EC2 instances
resource "aws_launch_template" "app_servers" {
  name_prefix   = "${var.project_prefix}-app-lt-prd-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.ec2_instance_type

  vpc_security_group_ids = [aws_security_group.ec2_instances.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ebs_encryption.arn
      delete_on_termination = true
    }
  }

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # Instance metadata configuration
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Don't exit on errors - handle them gracefully
    set +e
    
    # Log everything
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    
    echo "=========================================="
    echo "User Data Script Starting at $(date)"
    echo "=========================================="
    INSTANCE_ID=$(ec2-metadata --instance-id 2>/dev/null | cut -d ' ' -f 2 || echo "unknown")
    echo "Instance ID: $INSTANCE_ID"
    
    # Wait for network connectivity (critical for NAT gateway)
    echo "Checking network connectivity..."
    RETRY_COUNT=0
    MAX_RETRIES=30
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
      if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
        echo "Network connectivity confirmed after $RETRY_COUNT attempts"
        break
      fi
      echo "Waiting for network... attempt $((RETRY_COUNT+1))/$MAX_RETRIES"
      sleep 2
      RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "ERROR: Network connectivity not established after $MAX_RETRIES attempts"
      echo "Continuing anyway, but installations may fail..."
    fi
    
    # SKIP yum update for faster launch - schedule it for later instead
    echo "Scheduling system update for background execution..."
    cat > /usr/local/bin/delayed-update.sh << 'UPDATE_SCRIPT'
    #!/bin/bash
    sleep 300  # Wait 5 minutes after boot
    yum update -y >> /var/log/delayed-update.log 2>&1
    UPDATE_SCRIPT
    chmod +x /usr/local/bin/delayed-update.sh
    nohup /usr/local/bin/delayed-update.sh &
    
    # Install packages in parallel for speed
    echo "Installing required packages..."
    yum install -y httpd amazon-ssm-agent &
    INSTALL_PID=$!
    
    # While packages install, prepare configuration
    echo "Preparing configuration files..."
    mkdir -p /var/www/html
    
    # Create health check endpoint
    cat > /var/www/html/health.html << 'HEALTH_EOF'
    <!DOCTYPE html>
    <html>
    <head><title>Health Check</title></head>
    <body>
      <h1>Instance is healthy</h1>
      <p>Status: Running</p>
      <p>Time: $(date)</p>
    </body>
    </html>
    HEALTH_EOF
    
    # Create index page
    cat > /var/www/html/index.html << 'INDEX_EOF'
    <!DOCTYPE html>
    <html>
    <head><title>Application Server</title></head>
    <body>
      <h1>Application Server Ready</h1>
      <p>This server is operational.</p>
    </body>
    </html>
    INDEX_EOF
    
    # Wait for package installation to complete
    wait $INSTALL_PID
    echo "Package installation completed with exit code: $?"
    
    # Start services immediately
    echo "Starting Apache HTTP Server..."
    systemctl enable httpd 2>&1
    systemctl start httpd 2>&1
    APACHE_STATUS=$?
    echo "Apache start result: $APACHE_STATUS"
    
    echo "Starting SSM agent..."
    systemctl enable amazon-ssm-agent 2>&1
    systemctl start amazon-ssm-agent 2>&1
    SSM_STATUS=$?
    echo "SSM agent start result: $SSM_STATUS"
    
    # Install CloudWatch agent in background (non-critical)
    echo "Installing CloudWatch agent in background..."
    (
      cd /tmp
      wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm 2>&1
      if [ -f amazon-cloudwatch-agent.rpm ]; then
        rpm -U amazon-cloudwatch-agent.rpm 2>&1
        echo "CloudWatch agent installed"
      else
        echo "CloudWatch agent download failed"
      fi
      rm -f amazon-cloudwatch-agent.rpm
    ) >> /var/log/cloudwatch-install.log 2>&1 &
    
    # Basic SSH hardening
    echo "Applying SSH hardening..."
    if ! grep -q "^AllowUsers ec2-user" /etc/ssh/sshd_config; then
      echo "AllowUsers ec2-user" >> /etc/ssh/sshd_config
    fi
    if ! grep -q "^PermitRootLogin no" /etc/ssh/sshd_config; then
      sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
    fi
    systemctl restart sshd 2>&1 || echo "WARNING: SSH restart failed"
    
    # Final status report
    echo "=========================================="
    echo "User Data Script Completed at $(date)"
    echo "=========================================="
    echo "Apache HTTP Server: $(systemctl is-active httpd 2>/dev/null || echo 'unknown')"
    echo "SSM Agent: $(systemctl is-active amazon-ssm-agent 2>/dev/null || echo 'unknown')"
    echo "HTTP Port 80: $(ss -tlnp | grep :80 | wc -l) listeners"
    echo "Instance is ready for service!"
    echo "=========================================="
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_prefix}-app-server-prd"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${var.project_prefix}-app-volume-prd"
    })
  }

  depends_on = [
    aws_kms_key.ebs_encryption,
    aws_iam_instance_profile.ec2_profile
  ]
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app_servers" {
  name                      = "${var.project_prefix}-app-asg-prd"
  vpc_zone_identifier       = aws_subnet.private[*].id
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 2
  health_check_type         = "EC2"
  health_check_grace_period = 300
  wait_for_capacity_timeout = "10m"
  force_delete              = true

  launch_template {
    id      = aws_launch_template.app_servers.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_prefix}-app-asg-instance-prd"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  depends_on = [
    aws_nat_gateway.main,
    aws_iam_instance_profile.ec2_profile,
    aws_kms_key.ebs_encryption
  ]
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# S3 Bucket for centralized logging
resource "aws_s3_bucket" "logging" {
  bucket = local.s3_logging_bucket

  tags = merge(local.common_tags, {
    Name       = local.s3_logging_bucket
    Purpose    = "Centralized logging"
    Compliance = "Required"
  })
}

# S3 Bucket versioning for logging bucket
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption for logging bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

# S3 Bucket public access block for logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = false
  block_public_policy     = true
  ignore_public_acls      = false
  restrict_public_buckets = true
}

# S3 Bucket ownership controls for logging bucket
resource "aws_s3_bucket_ownership_controls" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 Bucket lifecycle for logging bucket
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# S3 Bucket policy for logging bucket
resource "aws_s3_bucket_policy" "logging" {
  bucket = aws_s3_bucket.logging.id

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
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        "Sid" : "AWSCloudTrailLogDelivery",
        "Effect" : "Allow",
        "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
        "Action" : "s3:GetBucketAcl",
        "Resource" : "${aws_s3_bucket.logging.arn}",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceArn" : "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.cloudtrail_name}",
            "AWS:SourceAccount" : "${data.aws_caller_identity.current.account_id}"
          }
        }
      },
      {
        "Sid" : "AWSCloudTrailLogDeliveryWrite",
        "Effect" : "Allow",
        "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
        "Action" : "s3:PutObject",
        "Resource" : "${aws_s3_bucket.logging.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceArn" : "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.cloudtrail_name}",
            "AWS:SourceAccount" : "${data.aws_caller_identity.current.account_id}",
            "s3:x-amz-acl" : "bucket-owner-full-control"
          }
        }
      },

      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/config/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSCloudFrontLogs"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudfront/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
          }
        }
      },
      {
        Sid    = "AWSCloudFrontLogsAcl"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
          }
        }
      },
    ]
  })
}

# CloudFront Logs S3 Bucket
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.project_prefix}-cloudfront-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${var.project_prefix}-cloudfront-logs-${data.aws_caller_identity.current.account_id}"
    Purpose = "CloudFront access logs"
  })
}

# S3 Bucket ownership controls for CloudFront logs bucket
resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 Bucket ACL for CloudFront logs bucket
resource "aws_s3_bucket_acl" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  acl    = "private"

  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs]
}

# S3 Bucket public access block for CloudFront logs bucket
resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Application S3 Bucket
resource "aws_s3_bucket" "application" {
  bucket = local.s3_app_bucket

  tags = merge(local.common_tags, {
    Name    = local.s3_app_bucket
    Purpose = "Application data storage"
  })
}

# S3 Bucket versioning for application bucket
resource "aws_s3_bucket_versioning" "application" {
  bucket = aws_s3_bucket.application.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption for application bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "application" {
  bucket = aws_s3_bucket.application.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

# S3 Bucket public access block for application bucket
resource "aws_s3_bucket_public_access_block" "application" {
  bucket = aws_s3_bucket.application.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

# IAM Role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project_prefix}-cloudtrail-cloudwatch-role-prd"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for CloudTrail CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project_prefix}-cloudtrail-cloudwatch-policy-prd"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = local.cloudtrail_name
  s3_bucket_name                = aws_s3_bucket.logging.id
  kms_key_id                    = aws_kms_key.s3_encryption.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  # CloudWatch Logs integration
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  # Management events and S3 data events
  event_selector {
    include_management_events = true
    read_write_type           = "All"

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.application.arn}/*",
        "${aws_s3_bucket.logging.arn}/*",
        "${aws_s3_bucket.cloudfront_logs.arn}/*"
      ]
    }
  }

  tags = merge(local.common_tags, {
    Name = local.cloudtrail_name
  })

  depends_on = [aws_s3_bucket_policy.logging]
}

# ============================================================================
# AWS CONFIG
# ============================================================================

# Config Recorder Role
resource "aws_iam_role" "config_recorder" {
  name = "${var.project_prefix}-config-recorder-role-prd"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# Config Recorder Role Policy
resource "aws_iam_role_policy" "config_recorder" {
  name = "${var.project_prefix}-config-recorder-policy-prd"
  role = aws_iam_role.config_recorder.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringLike = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_recorder" {
  role       = aws_iam_role.config_recorder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_prefix}-config-recorder-prd"
  role_arn = aws_iam_role.config_recorder.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_prefix}-config-delivery-prd"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  s3_key_prefix  = "config"

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [
    aws_s3_bucket_policy.logging
  ]
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_prefix}-alerts-prd"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-alerts-prd"
  })
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowBackupToPublish"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# Alarm for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project_prefix}-unauthorized-api-calls-prd"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project_prefix}-unauthorized-api-calls-prd"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# Alarm for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "${var.project_prefix}-root-account-usage-prd"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${var.project_prefix}-root-account-usage-prd"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.cloudtrail_name}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.s3_encryption.arn

  tags = local.common_tags
}

# ============================================================================
# CLOUDFRONT AND WAF
# ============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_prefix}-waf-prd"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

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
      metric_name                = "${var.project_prefix}-common-rules-metric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

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
      metric_name                = "${var.project_prefix}-bad-inputs-metric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3

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
      metric_name                = "${var.project_prefix}-rate-limit-metric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_prefix}-waf-metric"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-waf-prd"
  })
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${var.project_prefix} CloudFront OAI"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_prefix} CloudFront Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  web_acl_id          = aws_wafv2_web_acl.main.arn

  origin {
    domain_name = aws_s3_bucket.application.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.application.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.application.id}"

    forwarded_values {
      query_string = false
      headers      = []

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

  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-cdn-prd"
  })
}

# ============================================================================
# API GATEWAY
# ============================================================================

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_prefix}-api-prd"
  description = "Production API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-api-prd"
  })
}

# API Gateway Resource Policy (IP Restriction)
resource "aws_api_gateway_rest_api_policy" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "execute-api:Invoke"
        Resource  = "execute-api:/*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.allowed_ssh_ips
          }
        }
      }
    ]
  })
}

# ============================================================================
# AWS BACKUP
# ============================================================================

# Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_prefix}-backup-vault-prd"
  kms_key_arn = aws_kms_key.ebs_encryption.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-backup-vault-prd"
  })
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${var.project_prefix}-backup-plan-prd"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30 # Keep backups for 30 days
    }

    recovery_point_tags = local.common_tags
  }

  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 ? * 1 *)" # Weekly on Mondays at 3 AM UTC
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 90 # Keep weekly backups for 90 days
    }

    recovery_point_tags = local.common_tags
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-backup-plan-prd"
  })
}

# Backup Selection
resource "aws_backup_selection" "main" {
  name         = "${var.project_prefix}-backup-selection-prd"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup_service.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = "Production"
  }

  resources = [
    "arn:aws:ec2:*:*:volume/*",
    "arn:aws:rds:*:*:db:*"
  ]
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_service" {
  name = "${var.project_prefix}-backup-role-prd"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_service_restore" {
  role       = aws_iam_role.backup_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# ============================================================================
# AWS ORGANIZATIONS - SERVICE CONTROL POLICIES
# ============================================================================

# Data source for current organization
data "aws_organizations_organization" "current" {
  count = var.environment == "Production" ? 1 : 0
}

# Service Control Policy for MFA enforcement
resource "aws_organizations_policy" "require_mfa" {
  count = var.environment == "Production" ? 1 : 0

  name        = "${var.project_prefix}-require-mfa-scp-prd"
  description = "Require MFA for all actions"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyAllExceptListedIfNoMFA"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# ============================================================================
# PASSWORD POLICY
# ============================================================================

# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "logging_bucket" {
  description = "Name of the centralized logging bucket"
  value       = aws_s3_bucket.logging.id
}

output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = aws_backup_vault.main.name
}

