########################
# Data Sources
########################

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

data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = [data.aws_availability_zones.available.names[0], data.aws_availability_zones.available.names[1]]
  }
}


########################
# Resources
########################
# IAM role for EC2 instances
resource "aws_iam_role" "corp_ec2_role" {
  name = "corp-ec2-ha-dr-role"

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

  tags = var.common_tags
}

# IAM policy for EC2 instances (minimal permissions)
resource "aws_iam_policy" "corp_ec2_policy" {
  name        = "corp-ec2-ha-dr-policy"
  description = "Minimal permissions for HA/DR EC2 instances"

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
        Resource = "${aws_s3_bucket.corp_backup_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.corp_backup_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "corp_ec2_policy_attachment" {
  role       = aws_iam_role.corp_ec2_role.name
  policy_arn = aws_iam_policy.corp_ec2_policy.arn
}

resource "aws_iam_instance_profile" "corp_ec2_profile" {
  name = "corp-ec2-ha-dr-profile"
  role = aws_iam_role.corp_ec2_role.name

  tags = var.common_tags
}

# Security group for EC2 instances
resource "aws_security_group" "corp_web_sg" {
  name        = "corp-web-ha-dr-sg"
  description = "Security group for HA/DR web servers"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "corp-web-ha-dr-sg"
  })
}

# User data script for web server setup
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Create a simple health check page
    echo "<html><body><h1>Server Health: OK</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/health.html
    
    # Create main page
    echo "<html><body><h1>Corp HA/DR Web Server</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Configure log forwarding
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": ["used_percent"],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": ["mem_used_percent"],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    EOL
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )
}

# Primary EC2 instance (AZ-1)
resource "aws_instance" "corp_primary_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.corp_web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.corp_ec2_profile.name
  user_data_base64       = local.user_data

  monitoring = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  tags = merge(var.common_tags, {
    Name = "corp-primary-web-server"
    Role = "primary"
    AZ   = data.aws_availability_zones.available.names[0]
  })
}

# Secondary EC2 instance (AZ-2)
resource "aws_instance" "corp_secondary_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[1]
  vpc_security_group_ids = [aws_security_group.corp_web_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.corp_ec2_profile.name
  user_data_base64       = local.user_data

  monitoring = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  tags = merge(var.common_tags, {
    Name = "corp-secondary-web-server"
    Role = "secondary"
    AZ   = data.aws_availability_zones.available.names[1]
  })
}


# Route 53 hosted zone (assuming you have a domain)
resource "aws_route53_zone" "corp_zone" {
  name = var.domain_name

  tags = merge(var.common_tags, {
    Name = "corp-ha-dr-zone"
  })
}

# Health check for primary instance
resource "aws_route53_health_check" "corp_primary_health_check" {
  fqdn              = aws_instance.corp_primary_instance.public_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health.html"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(var.common_tags, {
    Name = "corp-primary-health-check"
  })
}

# Health check for secondary instance
resource "aws_route53_health_check" "corp_secondary_health_check" {
  fqdn              = aws_instance.corp_secondary_instance.public_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health.html"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(var.common_tags, {
    Name = "corp-secondary-health-check"
  })
}

# Primary DNS record with failover routing
resource "aws_route53_record" "corp_primary_record" {
  zone_id = aws_route53_zone.corp_zone.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"
  ttl     = 60

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.corp_primary_health_check.id
  records         = [aws_instance.corp_primary_instance.public_ip]
}

# Secondary DNS record with failover routing
resource "aws_route53_record" "corp_secondary_record" {
  zone_id = aws_route53_zone.corp_zone.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"
  ttl     = 60

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "secondary"
  health_check_id = aws_route53_health_check.corp_secondary_health_check.id
  records         = [aws_instance.corp_secondary_instance.public_ip]
}

# S3 bucket for backups with versioning
resource "aws_s3_bucket" "corp_backup_bucket" {
  bucket = "corp-backup-${random_id.bucket_suffix.hex}"

  tags = merge(var.common_tags, {
    Name    = "corp-backup-bucket"
    Purpose = "disaster-recovery"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Enable versioning
resource "aws_s3_bucket_versioning" "corp_backup_versioning" {
  bucket = aws_s3_bucket.corp_backup_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "corp_backup_encryption" {
  bucket = aws_s3_bucket.corp_backup_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "corp_backup_pab" {
  bucket = aws_s3_bucket.corp_backup_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle configuration for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "corp_backup_lifecycle" {
  bucket = aws_s3_bucket.corp_backup_bucket.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# SNS topic for notifications
resource "aws_sns_topic" "corp_alerts" {
  name = "corp-ha-dr-alerts"

  tags = var.common_tags
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "corp_email_alerts" {
  topic_arn = aws_sns_topic.corp_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch alarm for primary instance CPU utilization
resource "aws_cloudwatch_metric_alarm" "corp_primary_cpu_alarm" {
  alarm_name          = "corp-primary-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.corp_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.corp_primary_instance.id
  }

  tags = var.common_tags
}

# CloudWatch alarm for secondary instance CPU utilization
resource "aws_cloudwatch_metric_alarm" "corp_secondary_cpu_alarm" {
  alarm_name          = "corp-secondary-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.corp_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.corp_secondary_instance.id
  }

  tags = var.common_tags
}

# CloudWatch alarm for primary instance status check
resource "aws_cloudwatch_metric_alarm" "corp_primary_status_alarm" {
  alarm_name          = "corp-primary-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors ec2 status check"
  alarm_actions       = [aws_sns_topic.corp_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.corp_primary_instance.id
  }

  tags = var.common_tags
}

# CloudWatch alarm for primary health check (used by Route 53)
resource "aws_cloudwatch_metric_alarm" "corp_primary_health_alarm" {
  alarm_name          = "corp-primary-health-check-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Route 53 health check alarm for primary instance"
  alarm_actions       = [aws_sns_topic.corp_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.corp_primary_health_check.id
  }

  tags = var.common_tags
}

# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "corp_ha_dr_dashboard" {
  dashboard_name = "corp-ha-dr-monitoring"

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
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.corp_primary_instance.id],
            [".", ".", ".", aws_instance.corp_secondary_instance.id]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "EC2 Instance CPU Utilization"
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
            ["AWS/EC2", "StatusCheckFailed", "InstanceId", aws_instance.corp_primary_instance.id],
            [".", ".", ".", aws_instance.corp_secondary_instance.id]
          ]
          period = 300
          stat   = "Maximum"
          region = var.region
          title  = "EC2 Instance Status Checks"
        }
      }
    ]
  })
}


########################
# Outputs
########################
output "primary_instance_id" {
  description = "ID of the primary EC2 instance"
  value       = aws_instance.corp_primary_instance.id
}

output "secondary_instance_id" {
  description = "ID of the secondary EC2 instance"
  value       = aws_instance.corp_secondary_instance.id
}

output "primary_instance_public_ip" {
  description = "Public IP of the primary instance"
  value       = aws_instance.corp_primary_instance.public_ip
}

output "secondary_instance_public_ip" {
  description = "Public IP of the secondary instance"
  value       = aws_instance.corp_secondary_instance.public_ip
}

output "backup_bucket_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.corp_backup_bucket.bucket
}

output "dns_name" {
  description = "DNS name for the application"
  value       = "app.${var.domain_name}"
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.corp_zone.zone_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.corp_alerts.arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.corp_ha_dr_dashboard.dashboard_name}"
}


########################
# Variables
########################

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ha-dr"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = "admin@yourcompany.com"
}

variable "domain_name" {
  description = "Domain name for Route 53 health checks"
  type        = string
  default     = "yourcompany.com"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "corp-ha-dr"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "infrastructure-team"
    CostCenter  = "IT-Operations"
  }
}
