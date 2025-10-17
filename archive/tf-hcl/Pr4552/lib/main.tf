# Data Sources
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name = "virtualization-type"
    values = ["hvm"]  # virtualization-type hvm
  }

  filter {
    name = "architecture"
    values = ["x86_64"]  # architecture x86_64
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Variables
variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "availability_zone" {
  description = "Availability zone for EC2 instance"
  type        = string
  default     = "us-west-2a"
}

variable "volume_size" {
  description = "Size of the EBS volume in GB"
  type        = number
  default     = 80
}

variable "snapshot_schedule" {
  description = "Cron expression for snapshot schedule"
  type        = string
  default     = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC
}

variable "snapshot_retention_days" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops-team@company.com"
}

# Locals
locals {
  common_tags = {
    Environment  = "production"
    ManagedBy    = "terraform"
    Project      = "webapp"
    CostCenter   = "engineering"
    Application  = "web-application"
    Owner        = "infrastructure-team"
  }

  vpc_cidr    = "10.0.0.0/16"
  subnet_cidr = "10.0.1.0/24"
  private_ip  = "10.0.1.10"

  user_data_script = <<-EOF
    #!/bin/bash
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF
}

# Random String for Unique Naming
resource "random_string" "unique_suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# VPC and Networking Resources
resource "aws_vpc" "webapp_vpc" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, { Name = "webapp-vpc" })
}

resource "aws_subnet" "webapp_subnet" {
  vpc_id                  = aws_vpc.webapp_vpc.id
  cidr_block              = local.subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, { Name = "webapp-subnet" })
}

resource "aws_security_group" "webapp_security_group" {
  name = "webapp-security-group-${random_string.unique_suffix.result}"
  description = "Security group for webapp EC2 instance"
  vpc_id      = aws_vpc.webapp_vpc.id

  tags = merge(local.common_tags, { Name = "webapp-security-group" })
}

resource "aws_security_group_rule" "allow_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
  security_group_id = aws_security_group.webapp_security_group.id
  description       = "Allow SSH access from internal network (10.0.0.0/8)"
}

resource "aws_security_group_rule" "allow_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
  security_group_id = aws_security_group.webapp_security_group.id
  description       = "Allow HTTPS access from internal network (10.0.0.0/8)"
}

resource "aws_security_group_rule" "allow_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.webapp_security_group.id
  description       = "Allow all outbound traffic"
}

# IAM Role for EC2 Instance (SSM Access)
resource "aws_iam_role" "webapp_instance_role" {
  name = "webapp-instance-role-${random_string.unique_suffix.result}"

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

  tags = merge(local.common_tags, { Name = "webapp-instance-role" })
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.webapp_instance_role.name
}

resource "aws_iam_instance_profile" "webapp_instance_profile" {
  name = "webapp-instance-profile-${random_string.unique_suffix.result}"
  role = aws_iam_role.webapp_instance_role.name

  tags = merge(local.common_tags, { Name = "webapp-instance-profile" })
}

# EC2 Instance
resource "aws_instance" "webapp_instance" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.webapp_subnet.id
  private_ip             = local.private_ip
  vpc_security_group_ids = [aws_security_group.webapp_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.webapp_instance_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data_base64 = base64encode(local.user_data_script)


  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = merge(local.common_tags, { Name = "webapp-instance" })
}

# EBS Volume for Application Data
resource "aws_ebs_volume" "webapp_volume" {
  availability_zone = var.availability_zone
  size              = var.volume_size
  type              = "gp3"
  encrypted = true

  tags = merge(local.common_tags, {
    Name = "webapp-volume"
    DeletionProtection = "true"
    Purpose = "Application Data"
  })
}

resource "aws_volume_attachment" "webapp_volume_attachment" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.webapp_volume.id
  instance_id = aws_instance.webapp_instance.id
}

# IAM Role for DLM
resource "aws_iam_role" "dlm_lifecycle_role" {
  name = "webapp-dlm-role-${random_string.unique_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-dlm-role"
    }
  )
}

resource "aws_iam_role_policy" "dlm_lifecycle_policy" {
  name = "webapp-dlm-policy-${random_string.unique_suffix.result}"
  role = aws_iam_role.dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:DeleteSnapshot",
          "ec2:DescribeInstances",
          "ec2:DescribeSnapshots",
          "ec2:DescribeVolumes",
        ]
        Resource = "*"
      }
    ]
  })
}

# Data Lifecycle Manager for EBS Snapshots
resource "aws_dlm_lifecycle_policy" "webapp_snapshot_policy" {
  description        = "Daily snapshot policy for webapp EBS volume"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags = {
      Name = "webapp-volume"
    }

    schedule {
      name = "daily-snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["02:00"]  # 2 AM UTC
      }

      retain_rule {
        count = var.snapshot_retention_days
      }

      tags_to_add = merge(
        local.common_tags,
        {
          SnapshotCreator = "DLM"
          Purpose         = "Automated Backup"
        }
      )

      copy_tags = true
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "webapp-snapshot-policy"
    }
  )
}


# Outputs
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.webapp_instance.id
}

output "private_ip_address" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.webapp_instance.private_ip
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for CloudWatch alarm notifications"
  value       = aws_sns_topic.webapp_alerts.arn
}

output "cloudwatch_alarm_names" {
  description = "Names of configured CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.instance_cpu_high.alarm_name,
    aws_cloudwatch_metric_alarm.instance_status_check_failed.alarm_name,
    aws_cloudwatch_metric_alarm.ebs_volume_throughput.alarm_name,
  ]
}

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "webapp_alerts" {
  name = "webapp-alerts-${random_string.unique_suffix.result}"
  tags = merge(local.common_tags, { Name = "webapp-alerts" })
}

resource "aws_sns_topic_subscription" "webapp_alerts_email" {
  topic_arn = aws_sns_topic.webapp_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "instance_cpu_high" {
  alarm_name          = "webapp-cpu-${random_string.unique_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.webapp_alerts.arn]
  dimensions          = { InstanceId = aws_instance.webapp_instance.id }
  tags                = merge(local.common_tags, { Name = "webapp-cpu-alarm" })
}

resource "aws_cloudwatch_metric_alarm" "instance_status_check_failed" {
  alarm_name          = "webapp-status-${random_string.unique_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors ec2 status check"
  alarm_actions       = [aws_sns_topic.webapp_alerts.arn]
  dimensions          = { InstanceId = aws_instance.webapp_instance.id }
  tags                = merge(local.common_tags, { Name = "webapp-status-alarm" })
}

resource "aws_cloudwatch_metric_alarm" "ebs_volume_throughput" {
  alarm_name          = "webapp-ebs-throughput-${random_string.unique_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "VolumeThroughputPercentage"
  namespace           = "AWS/EBS"
  period              = "300"
  statistic           = "Average"
  threshold           = "95"
  alarm_description   = "This metric monitors EBS volume throughput"
  alarm_actions       = [aws_sns_topic.webapp_alerts.arn]
  dimensions          = { VolumeId = aws_ebs_volume.webapp_volume.id }
  tags                = merge(local.common_tags, { Name = "webapp-ebs-throughput-alarm" })
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/webapp-${random_string.unique_suffix.result}"
  retention_in_days = 7
  tags = merge(local.common_tags, {
    Name = "webapp-vpc-flow-logs"
  })
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "webapp-vpc-flow-log-role-${random_string.unique_suffix.result}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
    }]
  })
  tags = merge(local.common_tags, { Name = "webapp-vpc-flow-log-role" })
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "webapp-vpc-flow-log-policy-${random_string.unique_suffix.result}"
  role = aws_iam_role.vpc_flow_log_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogGroups", "logs:DescribeLogStreams"]
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "webapp_vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.webapp_vpc.id
  tags = merge(local.common_tags, { Name = "webapp-vpc-flow-log" })
}

output "vpc_flow_log_group" {
  description = "CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.webapp_vpc_flow_log.id
}