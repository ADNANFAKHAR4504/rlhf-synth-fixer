# Main orchestrator for zero-trust architecture deployment
# This file implements all infrastructure resources directly for single-account deployment

# ============================================================================
# Data Sources
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_organizations_organization" "org" {
  count = var.multi_account_enabled ? 1 : 0
}

# ============================================================================
# Local Values
# ============================================================================

locals {
  # Common tags applied to all resources for compliance and cost tracking
  common_tags = {
    Project            = var.project_name
    Environment        = var.environment
    EnvironmentSuffix  = var.environment_suffix
    ComplianceRequired = "true"
    DataClassification = "highly-sensitive"
    ManagedBy          = "terraform"
    SecurityFramework  = "zero-trust"
  }

  # Determine if this is a pilot deployment
  is_pilot = var.environment == "pilot"

  # Calculate subnet CIDR blocks
  az_list               = slice(var.availability_zones, 0, var.az_count)
  public_subnet_cidrs   = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + var.az_count)]
  isolated_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + (2 * var.az_count))]

  # Resource naming
  name_prefix = "${var.project_name}-${var.environment_suffix}"
}

# ============================================================================
# KMS Keys for Encryption
# ============================================================================

# KMS key for S3 bucket encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-key"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
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
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudwatch-key"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/${local.name_prefix}-cloudwatch"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# ============================================================================
# VPC and Network Resources
# ============================================================================

# VPC with DNS support for PrivateLink endpoints
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Public subnets for load balancers and NAT gateways
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.az_list[count.index]
  map_public_ip_on_launch = false # Explicit deny for security

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${local.az_list[count.index]}"
    Type = "public"
    Tier = "public"
  })
}

# Private subnets for application workloads
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.az_list[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${local.az_list[count.index]}"
    Type = "private"
    Tier = "private"
  })
}

# Isolated subnets for sensitive data (databases, etc.)
resource "aws_subnet" "isolated" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.isolated_subnet_cidrs[count.index]
  availability_zone = local.az_list[count.index]

  tags = merge(local.common_tags, {
    Name               = "${local.name_prefix}-isolated-${local.az_list[count.index]}"
    Type               = "isolated"
    Tier               = "isolated"
    DataClassification = "highly-sensitive"
  })
}

# Internet Gateway for public subnet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.az_count

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${local.az_list[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet outbound traffic
resource "aws_nat_gateway" "main" {
  count = var.az_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${local.az_list[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "public"
  })
}

# Route table associations for public subnets
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route tables for private subnets (one per AZ for HA)
resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${local.az_list[count.index]}"
    Type = "private"
  })
}

# Route table associations for private subnets
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route table for isolated subnets (no internet access)
resource "aws_route_table" "isolated" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-isolated-rt"
    Type = "isolated"
  })
}

# Route table associations for isolated subnets
resource "aws_route_table_association" "isolated" {
  count = var.az_count

  subnet_id      = aws_subnet.isolated[count.index].id
  route_table_id = aws_route_table.isolated.id
}

# ============================================================================
# VPC Flow Logs
# ============================================================================

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = var.flow_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${local.name_prefix}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# IAM policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = aws_cloudwatch_log_group.flow_logs[0].arn
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  iam_role_arn         = aws_iam_role.flow_logs[0].arn
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  # Enhanced flow log format for better visibility
  log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log"
  })

  depends_on = [aws_iam_role_policy.flow_logs]
}

# ============================================================================
# Transit Gateway
# ============================================================================

# Transit Gateway for inter-VPC routing
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for zero-trust architecture"
  amazon_side_asn                 = var.transit_gateway_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw"
  })
}

# Transit Gateway VPC attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  subnet_ids         = aws_subnet.private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.main.id

  dns_support                                     = "enable"
  ipv6_support                                    = "disable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-attachment"
  })
}

# ============================================================================
# AWS Network Firewall
# ============================================================================

# Network Firewall Rule Group (Stateful)
resource "aws_networkfirewall_rule_group" "stateful" {
  count = var.enable_network_firewall ? 1 : 0

  capacity = 100
  name     = "${local.name_prefix}-stateful-rules"
  type     = "STATEFUL"

  rule_group {
    rules_source {
      # Use stateful rules source only
      stateful_rule {
        action = "DROP"
        header {
          destination      = "ANY"
          destination_port = "ANY"
          direction        = "ANY"
          protocol         = "IP"
          source           = "ANY"
          source_port      = "ANY"
        }
        rule_option {
          keyword  = "sid"
          settings = ["1"]
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-stateful-rules"
  })
}

# Network Firewall Policy
resource "aws_networkfirewall_firewall_policy" "main" {
  count = var.enable_network_firewall ? 1 : 0

  name = "${local.name_prefix}-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.stateful[0].arn
    }
  }

  tags = local.common_tags
}

# Network Firewall
resource "aws_networkfirewall_firewall" "main" {
  count = var.enable_network_firewall ? 1 : 0

  name                = "${local.name_prefix}-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main[0].arn
  vpc_id              = aws_vpc.main.id

  dynamic "subnet_mapping" {
    for_each = aws_subnet.public[*].id
    content {
      subnet_id = subnet_mapping.value
    }
  }

  tags = local.common_tags
}

# ============================================================================
# S3 Bucket for Logging
# ============================================================================

# S3 bucket for centralized logging
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-logs"
    Purpose = "centralized-logging"
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.log_retention_days
    }
  }
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "logs" {
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
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.logs]
}

# ============================================================================
# GuardDuty
# ============================================================================

# Enable GuardDuty detector
resource "aws_guardduty_detector" "main" {
  count = var.enable_guardduty ? 1 : 0

  enable = true

  # Enhanced threat detection
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-guardduty"
  })
}

# Enable S3 protection
resource "aws_guardduty_detector_feature" "s3" {
  count = var.enable_guardduty ? 1 : 0

  detector_id = aws_guardduty_detector.main[0].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# Enable EBS malware protection
resource "aws_guardduty_detector_feature" "ebs_malware" {
  count = var.enable_guardduty ? 1 : 0

  detector_id = aws_guardduty_detector.main[0].id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# ============================================================================
# Security Hub
# ============================================================================

# Enable Security Hub
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0

  control_finding_generator = "SECURITY_CONTROL"
  auto_enable_controls      = true
}

# Subscribe to CIS AWS Foundations Benchmark
resource "aws_securityhub_standards_subscription" "cis" {
  count = var.enable_security_hub ? 1 : 0

  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]
}

# Subscribe to PCI DSS
resource "aws_securityhub_standards_subscription" "pci" {
  count = var.enable_security_hub ? 1 : 0

  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/pci-dss/v/3.2.1"

  depends_on = [aws_securityhub_account.main]
}

# ============================================================================
# CloudTrail
# ============================================================================

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0

  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = var.cloudtrail_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0

  name = "${local.name_prefix}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# IAM policy for CloudTrail CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail" {
  count = var.enable_cloudtrail ? 1 : 0

  name = "${local.name_prefix}-cloudtrail-policy"
  role = aws_iam_role.cloudtrail[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*"
      }
    ]
  })
}

# CloudTrail for comprehensive audit logging
resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0

  name                          = "${local.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  # Enable log file validation for integrity
  enable_log_file_validation = true

  # Send events to CloudWatch Logs for real-time analysis
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail[0].arn

  # Log all management and data events
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${aws_s3_bucket.logs.id}/*"]
    }
  }

  # Enable CloudTrail Insights
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-trail"
    Compliance = "required"
  })

  depends_on = [
    aws_s3_bucket_policy.logs,
    aws_iam_role_policy.cloudtrail
  ]
}

# ============================================================================
# SNS Topic for Security Alerts
# ============================================================================

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = merge(local.common_tags, {
    Purpose = "security-alerts"
  })
}

# SNS topic subscription for email notifications
resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_notification_email
}

# ============================================================================
# Lambda Function for Incident Response
# ============================================================================

# IAM role for Lambda incident response function
resource "aws_iam_role" "incident_response" {
  name = "${local.name_prefix}-incident-response-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# IAM policy for incident response Lambda
resource "aws_iam_role_policy" "incident_response" {
  name = "${local.name_prefix}-incident-response-policy"
  role = aws_iam_role.incident_response.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-incident-response:*"
      },
      {
        Effect = "Allow"
        Action = [
          "securityhub:GetFindings",
          "securityhub:UpdateFindings",
          "securityhub:BatchUpdateFindings"
        ]
        Resource = "arn:aws:securityhub:${var.aws_region}:${data.aws_caller_identity.current.account_id}:hub/default"
      },
      {
        Effect = "Allow"
        Action = [
          "guardduty:GetFindings",
          "guardduty:UpdateFindingsFeedback"
        ]
        Resource = var.enable_guardduty ? "arn:aws:guardduty:${var.aws_region}:${data.aws_caller_identity.current.account_id}:detector/${aws_guardduty_detector.main[0].id}" : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:StopInstances",
          "ec2:ModifyInstanceAttribute"
        ]
        Resource = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress"
        ]
        Resource = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:security-group/*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })
}

# Archive file for Lambda function code
data "archive_file" "incident_response" {
  type        = "zip"
  output_path = "${path.module}/incident_response.zip"

  source {
    content  = <<-EOT
      import json
      import boto3
      import os
      
      sns = boto3.client('sns')
      
      def handler(event, context):
          """
          Lambda function for automated incident response
          Triggered by Security Hub or GuardDuty findings
          """
          print(f"Received event: {json.dumps(event)}")
          
          # Parse the finding
          detail = event.get('detail', {})
          finding_type = detail.get('type', 'Unknown')
          severity = detail.get('severity', {}).get('label', 'UNKNOWN')
          
          # Send SNS notification
          message = f"Security Finding Detected\\n"
          message += f"Type: {finding_type}\\n"
          message += f"Severity: {severity}\\n"
          message += f"Auto-remediation: {'Enabled' if os.environ.get('ENABLE_AUTO_REMEDIATION') == 'true' else 'Disabled'}"
          
          sns.publish(
              TopicArn=os.environ['SNS_TOPIC_ARN'],
              Subject=f"Security Alert: {severity} - {finding_type}",
              Message=message
          )
          
          return {
              'statusCode': 200,
              'body': json.dumps('Incident response executed successfully')
          }
    EOT
    filename = "index.py"
  }
}

# Lambda function for incident response
resource "aws_lambda_function" "incident_response" {
  filename         = data.archive_file.incident_response.output_path
  function_name    = "${local.name_prefix}-incident-response"
  role             = aws_iam_role.incident_response.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512
  source_code_hash = data.archive_file.incident_response.output_base64sha256

  environment {
    variables = {
      ENABLE_AUTO_REMEDIATION = tostring(var.enable_auto_remediation)
      SNS_TOPIC_ARN           = aws_sns_topic.security_alerts.arn
      LOG_LEVEL               = "INFO"
    }
  }

  tags = merge(local.common_tags, {
    Component = "incident-response"
  })

  depends_on = [aws_iam_role_policy.incident_response]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "incident_response" {
  name              = "/aws/lambda/${aws_lambda_function.incident_response.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# ============================================================================
# EventBridge Rules for Security Automation
# ============================================================================

# EventBridge rule for Security Hub findings
resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  count = var.enable_security_hub ? 1 : 0

  name        = "${local.name_prefix}-security-hub-findings"
  description = "Trigger incident response for critical Security Hub findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
        Workflow = {
          Status = ["NEW"]
        }
      }
    }
  })

  tags = local.common_tags
}

# EventBridge target for Security Hub findings
resource "aws_cloudwatch_event_target" "security_hub_lambda" {
  count = var.enable_security_hub ? 1 : 0

  rule      = aws_cloudwatch_event_rule.security_hub_findings[0].name
  target_id = "SecurityHubToLambda"
  arn       = aws_lambda_function.incident_response.arn
}

# Lambda permission for Security Hub EventBridge
resource "aws_lambda_permission" "security_hub_invoke" {
  count = var.enable_security_hub ? 1 : 0

  statement_id  = "AllowSecurityHubInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.incident_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_hub_findings[0].arn
}

# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  count = var.enable_guardduty ? 1 : 0

  name        = "${local.name_prefix}-guardduty-findings"
  description = "Trigger incident response for GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [7, 8, 9] # High and Critical severity
    }
  })

  tags = local.common_tags
}

# EventBridge target for GuardDuty findings
resource "aws_cloudwatch_event_target" "guardduty_lambda" {
  count = var.enable_guardduty ? 1 : 0

  rule      = aws_cloudwatch_event_rule.guardduty_findings[0].name
  target_id = "GuardDutyToLambda"
  arn       = aws_lambda_function.incident_response.arn
}

# Lambda permission for GuardDuty EventBridge
resource "aws_lambda_permission" "guardduty_invoke" {
  count = var.enable_guardduty ? 1 : 0

  statement_id  = "AllowGuardDutyInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.incident_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty_findings[0].arn
}

# ============================================================================
# IAM Roles for Systems Manager Session Manager
# ============================================================================

# IAM role for EC2 instances to use Session Manager
resource "aws_iam_role" "ec2_ssm" {
  name = "${local.name_prefix}-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# Attach SSM managed policy
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "${local.name_prefix}-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm.name

  tags = local.common_tags
}

# IAM role for Session Manager access with MFA and IP restrictions
resource "aws_iam_role" "session_manager" {
  name = "${local.name_prefix}-session-manager-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Action = "sts:AssumeRole"
      Condition = {
        Bool = {
          "aws:MultiFactorAuthPresent" = "true"
        }
        IpAddress = {
          "aws:SourceIp" = var.allowed_ip_ranges
        }
      }
    }]
  })

  max_session_duration = var.max_session_duration

  tags = merge(local.common_tags, {
    Purpose = "session-manager-access"
  })
}

# IAM policy for Session Manager role
resource "aws_iam_role_policy" "session_manager" {
  name = "${local.name_prefix}-session-manager-policy"
  role = aws_iam_role.session_manager.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:StartSession"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ssm:${var.aws_region}::document/AWS-StartSSHSession",
          "arn:aws:ssm:${var.aws_region}::document/AWS-StartPortForwardingSession"
        ]
        Condition = {
          BoolIfExists = {
            "ssm:SessionDocumentAccessCheck" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeSessions",
          "ssm:GetConnectionStatus",
          "ssm:DescribeInstanceInformation",
          "ssm:DescribeInstanceProperties"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:TerminateSession"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:session/$${aws:username}-*"
      }
    ]
  })
}

# ============================================================================
# Service Control Policy (Only if multi-account enabled)
# ============================================================================

resource "aws_organizations_policy" "zero_trust_scp" {
  count = var.multi_account_enabled ? 1 : 0

  name        = "${local.name_prefix}-zero-trust-scp"
  description = "Service Control Policy enforcing zero-trust principles"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyWithoutMFA"
        Effect = "Deny"
        Action = [
          "ec2:TerminateInstances",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "iam:DeleteRole",
          "iam:DeleteUser"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        Sid    = "DenySecurityServiceDisable"
        Effect = "Deny"
        Action = [
          "guardduty:DeleteDetector",
          "guardduty:DisableOrganizationAdminAccount",
          "securityhub:DisableSecurityHub",
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}
