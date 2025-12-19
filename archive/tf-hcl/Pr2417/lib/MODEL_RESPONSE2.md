I'll continue from where I left off and complete the CloudTrail configuration, then add all the remaining resources and outputs.

```hcl
# ============================================================================
# CLOUDTRAIL
# ============================================================================

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name_prefix = "${local.name_prefix}-cloudtrail-role-"
  
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-role"
  })
}

# IAM Policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name_prefix = "${local.name_prefix}-cloudtrail-logs-policy-"
  role        = aws_iam_role.cloudtrail_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.logs.id
  
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
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-access-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
  
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "cloudtrail-logs"
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logs.arn}/*"]
    }
  }
  
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn
  
  kms_key_id                = aws_kms_key.main.arn
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging               = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

# ============================================================================
# GUARDDUTY
# ============================================================================

# GuardDuty Detector
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
  
  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-guardduty"
  })
}

# GuardDuty S3 Bucket for findings
resource "aws_s3_bucket" "guardduty_findings" {
  bucket        = "${local.name_prefix}-guardduty-findings-${random_id.guardduty_suffix.hex}"
  force_destroy = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-guardduty-findings"
  })
}

resource "random_id" "guardduty_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "guardduty_findings" {
  bucket = aws_s3_bucket.guardduty_findings.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "guardduty_findings" {
  bucket = aws_s3_bucket.guardduty_findings.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# EBS SNAPSHOTS AND BACKUP
# ============================================================================

# IAM Role for EBS Snapshots
resource "aws_iam_role" "dlm_lifecycle_role" {
  name_prefix = "${local.name_prefix}-dlm-lifecycle-role-"
  
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dlm-lifecycle-role"
  })
}

# IAM Policy for DLM
resource "aws_iam_role_policy_attachment" "dlm_lifecycle_role_policy" {
  role       = aws_iam_role.dlm_lifecycle_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

# Data Lifecycle Manager Policy for EBS Snapshots
resource "aws_dlm_lifecycle_policy" "ebs_snapshots" {
  description        = "EBS snapshot policy for TAP stack"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"
  
  policy_details {
    resource_types   = ["VOLUME"]
    target_tags = {
      Environment = "Production"
    }
    
    schedule {
      name = "Daily snapshots"
      
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }
      
      retain_rule {
        count = 7
      }
      
      tags_to_add = merge(local.common_tags, {
        SnapshotCreator = "DLM"
      })
      
      copy_tags = true
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dlm-policy"
  })
}

# ============================================================================
# AWS BACKUP
# ============================================================================

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${local.name_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.main.arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-vault"
  })
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name_prefix = "${local.name_prefix}-backup-role-"
  
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
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-role"
  })
}

# Attach AWS managed backup policies
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# AWS Backup Plan
resource "aws_backup_plan" "main" {
  name = "${local.name_prefix}-backup-plan"
  
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM UTC
    
    start_window      = 480  # 8 hours
    completion_window = 10080 # 7 days
    
    recovery_point_tags = merge(local.common_tags, {
      BackupPlan = "${local.name_prefix}-backup-plan"
    })
    
    lifecycle {
      cold_storage_after = 30
      delete_after       = 120
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-plan"
  })
}

# AWS Backup Selection
resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${local.name_prefix}-backup-selection"
  plan_id      = aws_backup_plan.main.id
  
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = "Production"
  }
  
  resources = [
    "*"
  ]
}

# ============================================================================
# ADDITIONAL CLOUDWATCH DASHBOARDS AND ALARMS
# ============================================================================

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
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
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.main.name],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 and ALB Metrics"
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
            ["AWS/AutoScaling", "GroupMinSize", "AutoScalingGroupName", aws_autoscaling_group.main.name],
            [".", "GroupMaxSize", ".", "."],
            [".", "GroupDesiredCapacity", ".", "."],
            [".", "GroupInServiceInstances", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Auto Scaling Group Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Additional CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${local.name_prefix}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${local.name_prefix}-alb-healthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors healthy host count"
  treat_missing_data  = "breaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = local.common_tags
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
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
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# Internet Gateway and NAT Gateway Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "elastic_ip_addresses" {
  description = "Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
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

# EC2 and AMI Outputs
output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "ami_name" {
  description = "Name of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.name
}

output "standalone_instance_id" {
  description = "ID of the standalone EC2 instance"
  value       = aws_instance.standalone.id
}

output "standalone_instance_private_ip" {
  description = "Private IP address of the standalone EC2 instance"
  value       = aws_instance.standalone.private_ip
}

output "standalone_instance_arn" {
  description = "ARN of the standalone EC2 instance"
  value       = aws_instance.standalone.arn
}

# Launch Template and Auto Scaling Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.main.latest_version
}

output "autoscaling_group_id" {
  description = "ID of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

# Load Balancer Outputs
output "load_balancer_id" {
  description = "ID of the Application Load Balancer"
  value       = aws_lb.main.id
}

output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_id" {
  description = "ID of the target group"
  value       = aws_lb_target_group.main.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "cloudtrail_iam_role_arn" {
  description = "ARN of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail_role.arn
}

output "backup_iam_role_arn" {
  description = "ARN of the AWS Backup IAM role"
  value       = aws_iam_role.backup_role.arn
}

output "dlm_lifecycle_role_arn" {
  description = "ARN of the DLM lifecycle IAM role"
  value       = aws_iam_role.dlm_lifecycle_role.arn
}

# S3 Bucket Outputs
output "logs_bucket_id" {
  description = "ID of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_domain_name" {
  description = "Domain name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.bucket_domain_name
}

output "guardduty_findings_bucket_id" {
  description = "ID of the GuardDuty findings S3 bucket"
  value       = aws_s3_bucket.guardduty_findings.id
}

output "guardduty_findings_bucket_arn" {
  description = "ARN of the GuardDuty findings S3 bucket"
  value       = aws_s3_bucket.guardduty_findings.arn
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

output "kms_alias_name" {
  description = "Name of the KMS key alias"
  value       = aws_kms_alias.main.name
}

output "kms_alias_arn" {
  description = "ARN of the KMS key alias"
  value       = aws_kms_alias.main.arn
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

# CloudWatch Outputs
output "cloudwatch_log_group_httpd_access_name" {
  description = "Name of the CloudWatch log group for HTTPD access logs"
  value       = aws_cloudwatch_log_group.httpd_access.name
}

output "cloudwatch_log_group_httpd_error_name" {
  description = "Name of the CloudWatch log group for HTTPD error logs"
  value       = aws_cloudwatch_log_group.httpd_error.name
}

output "cloudwatch_log_group_cloudtrail_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# CloudTrail Outputs
output "cloudtrail_id" {
  description = "ID of the CloudTrail"
  value       = aws_cloudtrail.main.id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main.home_region
}

# GuardDuty Outputs
output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "guardduty_detector_arn" {
  description = "ARN of the GuardDuty detector"
  value       = aws_guardduty_detector.main.arn
}

# Backup Outputs
output "backup_vault_id" {
  description = "ID of the AWS Backup vault"
  value       = aws_backup_vault.main.id
}

output "backup_vault_arn" {
  description = "ARN of the AWS Backup vault"
  value       = aws_backup_vault.main.arn
}

output "backup_plan_id" {
  description = "ID of the AWS Backup plan"
  value       = aws_backup_plan.main.id
}

output "backup_plan_arn" {
  description = "ARN of the AWS Backup plan"
  value       = aws_backup_plan.main.arn
}

output "backup_selection_id" {
  description = "ID of the AWS Backup selection"
  value       = aws_backup_selection.main.id
}

# DLM Policy Outputs
output "dlm_lifecycle_policy_id" {
  description = "ID of the DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.ebs_snapshots.id
}

output "dlm_lifecycle_policy_arn" {
  description = "ARN of the DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.ebs_snapshots.arn
}

# Auto Scaling Policy Outputs
output "autoscaling_policy_scale_up_arn" {
  description = "ARN of the scale up policy"
  value       = aws_autoscaling_policy.scale_up.arn
}

output "autoscaling_policy_scale_down_arn" {
  description = "ARN of the scale down policy"
  value       = aws_autoscaling_policy.scale_down.arn
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_cpu_high_arn" {
  description = "ARN of the CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.cpu_high.arn
}

output "cloudwatch_alarm_cpu_low_arn" {
  description = "ARN of the CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.cpu_low.arn
}

output "cloudwatch_alarm_alb_response_time_arn" {
  description = "ARN of the ALB response time alarm"
  value       = aws_cloudwatch_metric_alarm.alb_response_time.arn
}

output "cloudwatch_alarm_alb_healthy_hosts_arn" {
  description = "ARN of the ALB healthy hosts alarm"
  value       = aws_cloudwatch_metric_alarm.alb_healthy_hosts.arn
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

# Application URL Output
output "application_url" {
  description = "URL to access the application via ALB"
  value       = "http://${aws_lb.main.dns_name}"
}

output "cloudfront_url" {
  description = "URL to access the application via CloudFront"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# Summary Output
output "deployment_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    vpc_id                    = aws_vpc.main.id
    public_subnets           = length(aws_subnet.public)
    private_subnets          = length(aws_subnet.private)
    availability_zones       = local.availability_zones
    load_balancer_dns        = aws_lb.main.dns_name
    cloudfront_domain        = aws_cloudfront_distribution.main.domain_name
    autoscaling_group_name   = aws_autoscaling_group.main.name
    kms_key_id              = aws_kms_key.main.key_id
    logs_bucket             = aws_s3_bucket.logs.id
    guardduty_enabled       = aws_guardduty_detector.main.enable
    backup_vault            = aws_backup_vault.main.name
    cloudtrail_name         = aws_cloudtrail.main.name
    region                  = var.aws_region
  }
}
```

This completes the comprehensive Terraform configuration file `tap_stack.tf` that includes:

## **Key Features Implemented:**

1. **VPC with proper networking** - 2 public and 2 private subnets across 2 AZs
2. **Security Groups** - Restrictive access controls
3. **EC2 instances** - Both standalone and Auto Scaling Group managed
4. **Application Load Balancer** - With health checks and logging
5. **Auto Scaling** - Min 2, Max 5 instances with CloudWatch alarms
6. **IAM Roles and Policies** - Least privilege access
7. **KMS encryption** - For data at rest
8. **CloudFront distribution** - With HTTPS redirect
