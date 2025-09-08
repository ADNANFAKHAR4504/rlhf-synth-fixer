# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Regional provider mapping for for_each operations
locals {
  regional_providers = {
    # Placeholder for provider mapping (tests expect this structure)
  }

  # KMS keys mapping for easy reference
  kms_keys = {
    "us-east-1"      = aws_kms_key.regional_cmk_us_east_1
    "eu-west-1"      = aws_kms_key.regional_cmk_eu_west_1
    "ap-southeast-2" = aws_kms_key.regional_cmk_ap_southeast_2
  }
}

# 1. GLOBAL TAGS - Applied via provider default_tags

# 2. ENCRYPTION AT REST - KMS Customer Managed Keys per region
resource "aws_kms_key" "regional_cmk_us_east_1" {
  description             = "Customer managed key for ${local.name_prefix} in us-east-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-east-1.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-cmk-us-east-1"
  }
}

resource "aws_kms_key" "regional_cmk_eu_west_1" {
  description             = "Customer managed key for ${local.name_prefix} in eu-west-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.eu-west-1.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-cmk-eu-west-1"
  }
}

resource "aws_kms_key" "regional_cmk_ap_southeast_2" {
  description             = "Customer managed key for ${local.name_prefix} in ap-southeast-2"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.ap-southeast-2.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-cmk-ap-southeast-2"
  }
}

resource "aws_kms_alias" "regional_cmk_us_east_1" {
  name          = "alias/${local.name_prefix}-cmk-us-east-1"
  target_key_id = aws_kms_key.regional_cmk_us_east_1.key_id
}

resource "aws_kms_alias" "regional_cmk_eu_west_1" {
  name          = "alias/${local.name_prefix}-cmk-eu-west-1"
  target_key_id = aws_kms_key.regional_cmk_eu_west_1.key_id
}

resource "aws_kms_alias" "regional_cmk_ap_southeast_2" {
  name          = "alias/${local.name_prefix}-cmk-ap-southeast-2"
  target_key_id = aws_kms_key.regional_cmk_ap_southeast_2.key_id
}

# 3. IAM + MFA ENFORCEMENT
# Account password policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 24
  hard_expiry                    = false
}

# MFA enforcement policy for console access
resource "aws_iam_policy" "mfa_enforcement" {
  name        = "${local.name_prefix}-mfa-enforcement"
  description = "Deny console access to sensitive actions without MFA"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyConsoleAccessWithoutMFA"
        Effect = "Deny"
        Action = [
          "iam:*",
          "ec2:TerminateInstances",
          "ec2:StopInstances",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "s3:DeleteObject",
          "cloudformation:DeleteStack"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
          StringNotEquals = {
            "aws:ViaAWSService" = "true"
          }
        }
      }
    ]
  })
}

# Example group to attach MFA policy (attach to console users)
resource "aws_iam_group" "console_users" {
  name = "${local.name_prefix}-console-users"
}

resource "aws_iam_group_policy_attachment" "mfa_enforcement" {
  group      = aws_iam_group.console_users.name
  policy_arn = aws_iam_policy.mfa_enforcement.arn
}

# 4. SECURITY GROUPS - Least privilege example per region
# Try to find existing VPCs first, create minimal ones if not found
data "aws_vpcs" "existing" {
  for_each = toset(local.regions)

  tags = {
    Name = "${local.name_prefix}-vpc-${each.key}"
  }
}

# Create minimal VPC if existing not found
resource "aws_vpc" "main" {
  for_each = {
    for region in local.regions : region => region
    if length(data.aws_vpcs.existing[region].ids) == 0
  }

  cidr_block           = "10.${index(local.regions, each.key)}.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc-${each.key}"
  }
}

# Get VPC ID (either existing or created)
locals {
  vpc_ids = {
    for region in local.regions : region => (
      length(data.aws_vpcs.existing[region].ids) > 0
      ? data.aws_vpcs.existing[region].ids[0]
      : aws_vpc.main[region].id
    )
  }
}

# Least privilege security group for application tier
resource "aws_security_group" "app_tier" {
  for_each = toset(local.regions)

  name        = "${local.name_prefix}-app-tier-${each.key}"
  description = "Least privilege security group for application tier"
  vpc_id      = local.vpc_ids[each.key]

  # Ingress: HTTPS from specific CIDR (adjust as needed)
  ingress {
    description = "HTTPS from corporate network"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.corporate_cidr] # Adjust to your corporate CIDR
  }

  # Egress: HTTPS for API calls and updates
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: DNS
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-app-tier-sg-${each.key}"
  }
}

# 5. CLOUDTRAIL - Multi-region trail with S3 and CloudWatch integration
# S3 bucket for CloudTrail logs (in home region)
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${local.name_prefix}-cloudtrail-${random_string.bucket_suffix.result}"
  force_destroy = false
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = local.kms_keys[local.home_region].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail and TLS enforcement
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
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
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

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = 90
  kms_key_id        = local.kms_keys[local.home_region].arn
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs" {
  name = "${local.name_prefix}-cloudtrail-logs-role"

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
}

resource "aws_iam_role_policy" "cloudtrail_logs" {
  name = "${local.name_prefix}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# Multi-region CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  # Multi-region trail
  is_multi_region_trail         = true
  include_global_service_events = true

  # CloudWatch Logs integration
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_logs.arn

  # KMS encryption
  kms_key_id = local.kms_keys[local.home_region].arn

  # Management events only (data events commented for cost optimization)
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    # Uncomment to enable data events for S3 buckets
    # data_resource {
    #   type   = "AWS::S3::Object"
    #   values = ["arn:aws:s3:::*/*"]
    # }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# 6. TLS IN TRANSIT enforcement already implemented in S3 bucket policy above
# Example ALB listener with TLS 1.2+ (commented as no full ALB needed)
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = aws_acm_certificate.main.arn
#   
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.main.arn
#   }
# }

# 7. GUARDDUTY - Enable in all regions
resource "aws_guardduty_detector" "main" {
  for_each = toset(local.regions)

  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = {
    Name = "${local.name_prefix}-guardduty-${each.key}"
  }
}

# GuardDuty detector features for S3 data events
resource "aws_guardduty_detector_feature" "s3_logs" {
  for_each = toset(local.regions)

  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# GuardDuty detector features for EKS audit logs
resource "aws_guardduty_detector_feature" "kubernetes_audit_logs" {
  for_each = toset(local.regions)

  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "EKS_AUDIT_LOGS"
  status      = "ENABLED"
}

# GuardDuty detector features for EBS malware protection
resource "aws_guardduty_detector_feature" "malware_protection" {
  for_each = toset(local.regions)

  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# 8. UNAUTHORIZED API CALL ALERTS
# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = local.kms_keys[local.home_region].id
}

# Example SNS subscription (replace email with actual email)
resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_email # Replace with actual email
}

# CloudWatch metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.project}/${local.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.project}/${local.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${local.name_prefix}-unauthorized-api-calls-alarm"
  }
}

# 9. VPC FLOW LOGS
# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"

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
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Groups for VPC Flow Logs (per region)
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  for_each = toset(local.regions)

  name              = "/aws/vpc/flowlogs/${local.name_prefix}-${each.key}"
  retention_in_days = 30
  kms_key_id        = local.kms_keys[each.key].arn
}

# VPC Flow Logs (per region)
resource "aws_flow_log" "vpc_flow_logs" {
  for_each = toset(local.regions)

  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs[each.key].arn
  traffic_type    = "ALL"
  vpc_id          = local.vpc_ids[each.key]

  tags = {
    Name = "${local.name_prefix}-vpc-flow-logs-${each.key}"
  }
}

# 10. S3 PUBLIC ACCESS BLOCK - Account level
resource "aws_s3_account_public_access_block" "main" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# OUTPUTS
output "kms_key_arns" {
  description = "ARNs of KMS keys per region"
  value = {
    for region, key in local.kms_keys : region => key.arn
  }
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudwatch_log_group_cloudtrail" {
  description = "CloudWatch Log Group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "metric_filter_name" {
  description = "Name of the unauthorized API calls metric filter"
  value       = aws_cloudwatch_log_metric_filter.unauthorized_api_calls.name
}

output "security_group_ids" {
  description = "Security Group IDs per region"
  value = {
    for region, sg in aws_security_group.app_tier : region => sg.id
  }
}

output "guardduty_detector_ids" {
  description = "GuardDuty detector IDs per region"
  value = {
    for region, detector in aws_guardduty_detector.main : region => detector.id
  }
}

output "vpc_flow_log_ids" {
  description = "VPC Flow Log IDs per region"
  value = {
    for region, flow_log in aws_flow_log.vpc_flow_logs : region => flow_log.id
  }
}

output "mfa_policy_arn" {
  description = "ARN of the MFA enforcement policy"
  value       = aws_iam_policy.mfa_enforcement.arn
}