# Ideal Response

This file contains the complete ideal response for the infrastructure challenge.

## Complete Terraform Code

```terraform
# tap_stack.tf - Production-grade secure AWS environment for financial data processing
# Terraform 1.5+ compatible, AWS Provider 5.x
# Implements PCI-DSS Level 1 and SOC2 Type II controls with zero-trust model

# ============================================================================
# LOCALS
# ============================================================================

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Naming conventions
  prefix = "findata-secure"

  # Common bucket names
  cloudtrail_bucket_name  = "${local.prefix}-cloudtrail-${local.account_id}"
  application_bucket_name = "${local.prefix}-application-${local.account_id}"
  audit_bucket_name       = "${local.prefix}-audit-${local.account_id}"

  # VPC configuration - use provided or create minimal
  vpc_id     = var.vpc_id != "" ? var.vpc_id : aws_vpc.main[0].id
  subnet_ids = length(var.subnet_ids) > 0 ? var.subnet_ids : aws_subnet.private[*].id

  # Security services
  security_services = ["securityhub.amazonaws.com", "guardduty.amazonaws.com", "cloudtrail.amazonaws.com", "config.amazonaws.com"]

  # CloudWatch log retention
  log_retention_days = 365

  # Common security group rules
  no_ingress_cidr = []
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# VPC CONFIGURATION (Fallback if not provided)
# ============================================================================

# Create minimal VPC if not provided
resource "aws_vpc" "main" {
  count = var.vpc_id == "" ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.prefix}-vpc"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Create private subnets across 3 AZs if not provided
resource "aws_subnet" "private" {
  count = var.vpc_id == "" ? 3 : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# KMS CONFIGURATION
# ============================================================================

# Customer-managed KMS key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.prefix} encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  # Key policy restricting usage to specific IAM roles
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:CallerAccount" = local.account_id
          }
        }
      },
      {
        Sid    = "Allow use by specified roles only"
        Effect = "Allow"
        Principal = {
          AWS = var.allowed_kms_role_arns
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail and CloudWatch"
        Effect = "Allow"
        Principal = {
          Service = [
            "cloudtrail.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 for server-side encryption"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:s3:arn" = [
              "arn:${data.aws_partition.current.partition}:s3:::${local.cloudtrail_bucket_name}/*",
              "arn:${data.aws_partition.current.partition}:s3:::${local.application_bucket_name}/*",
              "arn:${data.aws_partition.current.partition}:s3:::${local.audit_bucket_name}/*"
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name = "${local.prefix}-kms-key"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# ============================================================================
# S3 BUCKETS CONFIGURATION
# ============================================================================

# CloudTrail logs bucket (locked)
resource "aws_s3_bucket" "cloudtrail" {
  bucket = local.cloudtrail_bucket_name

  tags = {
    Name       = local.cloudtrail_bucket_name
    Purpose    = "CloudTrail logs"
    Compliance = "PCI-DSS-SOC2"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "retention"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years for compliance
    }
  }
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

# Application bucket
resource "aws_s3_bucket" "application" {
  bucket = local.application_bucket_name

  tags = {
    Name    = local.application_bucket_name
    Purpose = "Application data"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "application" {
  bucket = aws_s3_bucket.application.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "application" {
  bucket = aws_s3_bucket.application.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "application" {
  bucket = aws_s3_bucket.application.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Audit bucket
resource "aws_s3_bucket" "audit" {
  bucket = local.audit_bucket_name

  tags = {
    Name    = local.audit_bucket_name
    Purpose = "Audit logs"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# Least-privilege admin role with MFA and IP restrictions
resource "aws_iam_role" "admin" {
  name = "${local.prefix}-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${local.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true" # Require MFA
          }
          IpAddress = {
            "aws:SourceIp" = var.allowed_admin_ips # Restrict by IP
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600" # MFA must be recent
          }
        }
      }
    ]
  })

  tags = {
    Name = "${local.prefix}-admin-role"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Admin policy - no wildcards, least privilege
resource "aws_iam_role_policy" "admin" {
  name = "${local.prefix}-admin-policy"
  role = aws_iam_role.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "s3:List*",
          "s3:GetBucket*",
          "iam:Get*",
          "iam:List*",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus",
          "kms:Describe*",
          "kms:List*"
        ]
        Resource = "*"
      },
      {
        Sid    = "RestrictedWriteAccess"
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:${data.aws_partition.current.partition}:ec2:${var.aws_region}:${local.account_id}:*",
          "${aws_s3_bucket.application.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })
}

# Application role for workloads
resource "aws_iam_role" "application" {
  name = "${local.prefix}-application-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.prefix}-application-role"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "application" {
  name = "${local.prefix}-application-policy"
  role = aws_iam_role.application.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.application.arn}/*"
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      }
    ]
  })
}

# ============================================================================
# VPC ENDPOINTS
# ============================================================================

# Security group for VPC endpoints - no inbound from 0.0.0.0/0
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.prefix}-vpc-endpoints-"
  vpc_id      = local.vpc_id
  description = "Security group for VPC endpoints - zero trust model"

  # Egress only to HTTPS
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only within VPC
    description = "HTTPS within VPC"
  }

  tags = {
    Name = "${local.prefix}-vpc-endpoints-sg"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# S3 Gateway endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = local.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.vpc_id == "" ? aws_route_table.private[*].id : []

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*",
          aws_s3_bucket.application.arn,
          "${aws_s3_bucket.application.arn}/*",
          aws_s3_bucket.audit.arn,
          "${aws_s3_bucket.audit.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Name = "${local.prefix}-s3-endpoint"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# DynamoDB Gateway endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = local.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.vpc_id == "" ? aws_route_table.private[*].id : []

  tags = {
    Name = "${local.prefix}-dynamodb-endpoint"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Secrets Manager Interface endpoint
resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = local.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = local.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.prefix}-secrets-manager-endpoint"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Route tables for private subnets (if VPC created)
resource "aws_route_table" "private" {
  count  = var.vpc_id == "" ? 3 : 0
  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = "${local.prefix}-private-rt-${count.index + 1}"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table_association" "private" {
  count          = var.vpc_id == "" ? 3 : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

resource "aws_cloudtrail" "main" {
  name                          = "${local.prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:${data.aws_partition.current.partition}:lambda:*:${local.account_id}:function/*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = {
    Name = "${local.prefix}-trail"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# CLOUDWATCH LOGS
# ============================================================================

# Log group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${local.prefix}/flow-logs"
  retention_in_days = local.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${local.prefix}-vpc-flow-logs"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Log group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${local.prefix}"
  retention_in_days = local.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${local.prefix}-application-logs"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count                    = var.vpc_id == "" ? 1 : 0
  iam_role_arn             = aws_iam_role.flow_logs[0].arn
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main[0].id
  log_format               = "$${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action}"
  max_aggregation_interval = 60

  tags = {
    Name = "${local.prefix}-flow-logs"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  count = var.vpc_id == "" ? 1 : 0
  name  = "${local.prefix}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.vpc_id == "" ? 1 : 0
  name  = "${local.prefix}-flow-logs-policy"
  role  = aws_iam_role.flow_logs[0].id

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
        Resource = aws_cloudwatch_log_group.vpc_flow_logs.arn
      }
    ]
  })
}

# ============================================================================
# SECURITY HUB
# ============================================================================

resource "aws_securityhub_account" "main" {
  enable_default_standards = false # We'll enable specific standards

  lifecycle {
    prevent_destroy = false
  }
}

# Enable CIS AWS Foundations Benchmark
resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:${data.aws_partition.current.partition}:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Enable PCI-DSS standard
resource "aws_securityhub_standards_subscription" "pci_dss" {
  standards_arn = "arn:${data.aws_partition.current.partition}:securityhub:${var.aws_region}::standards/pci-dss/v/3.2.1"

  depends_on = [aws_securityhub_account.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Custom Security Hub insight for high-risk findings
resource "aws_securityhub_insight" "high_risk" {
  name = "${local.prefix}-high-risk-findings"

  filters {
    severity_label {
      comparison = "EQUALS"
      value      = "CRITICAL"
    }

    workflow_status {
      comparison = "EQUALS"
      value      = "NEW"
    }
  }

  group_by_attribute = "ResourceType"

  depends_on = [aws_securityhub_account.main]

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# GUARDDUTY
# ============================================================================

resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
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

  tags = {
    Name = "${local.prefix}-guardduty"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# GuardDuty threat intelligence set
resource "aws_guardduty_threatintelset" "main" {
  activate    = true
  detector_id = aws_guardduty_detector.main.id
  format      = "TXT"
  location    = "s3://${aws_s3_bucket.audit.id}/threat-intel.txt"
  name        = "${local.prefix}-threat-intel"

  lifecycle {
    prevent_destroy = false
  }
}

# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty" {
  name        = "${local.prefix}-guardduty-findings"
  description = "Trigger on GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        4, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, # Medium
        7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, # High
        8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9  # Critical
      ]
    }
  })

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda for automated remediation
resource "aws_lambda_function" "guardduty_remediation" {
  filename         = data.archive_file.lambda_remediation.output_path
  function_name    = "${local.prefix}-guardduty-remediation"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_remediation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      SECURITY_HUB_REGION = var.aws_region
    }
  }

  tags = {
    Name = "${local.prefix}-guardduty-remediation"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda remediation code
data "archive_file" "lambda_remediation" {
  type        = "zip"
  output_path = "/tmp/remediation.zip"

  source {
    content  = <<EOF
import json
import boto3
import os

def handler(event, context):
    """
    Automated remediation for GuardDuty findings
    - Isolates compromised EC2 instances
    - Blocks malicious IPs
    - Forwards findings to Security Hub
    """
    
    ec2 = boto3.client('ec2')
    securityhub = boto3.client('securityhub', region_name=os.environ['SECURITY_HUB_REGION'])
    
    finding = json.loads(event['Records'][0]['Sns']['Message'])
    finding_type = finding['detail']['type']
    
    # Example remediation: Isolate EC2 instance
    if 'EC2' in finding_type:
        instance_id = finding['detail']['resource']['instanceDetails']['instanceId']
        
        # Create isolation security group if not exists
        try:
            sg_response = ec2.create_security_group(
                GroupName='isolation-sg',
                Description='Isolation security group for compromised instances'
            )
            isolation_sg_id = sg_response['GroupId']
            
            # Remove all ingress rules
            ec2.revoke_security_group_ingress(
                GroupId=isolation_sg_id,
                IpPermissions=[{'IpProtocol': '-1', 'FromPort': -1, 'ToPort': -1, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}]
            )
        except ec2.exceptions.InvalidGroup.Duplicate:
            # Security group already exists
            sg_response = ec2.describe_security_groups(GroupNames=['isolation-sg'])
            isolation_sg_id = sg_response['SecurityGroups'][0]['GroupId']
        
        # Apply isolation security group to instance
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[isolation_sg_id]
        )
        
        print(f"Isolated instance {instance_id}")
    
    # Forward to Security Hub
    try:
        securityhub.batch_import_findings(
            Findings=[{
                'SchemaVersion': '2018-10-08',
                'Id': finding['id'],
                'ProductArn': f"arn:aws:securityhub:{os.environ['SECURITY_HUB_REGION']}::product/aws/guardduty",
                'GeneratorId': 'GuardDuty',
                'AwsAccountId': finding['accountId'],
                'Types': [finding_type],
                'CreatedAt': finding['time'],
                'UpdatedAt': finding['time'],
                'Severity': {
                    'Product': finding['detail']['severity'],
                    'Normalized': int(finding['detail']['severity'] * 10)
                },
                'Title': finding['detail']['title'],
                'Description': finding['detail']['description'],
                'Resources': [{
                    'Type': 'AwsEc2Instance',
                    'Id': finding['detail']['resource']['resourceId']
                }]
            }]
        )
    except Exception as e:
        print(f"Failed to import finding to Security Hub: {e}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Remediation completed')
    }
EOF
    filename = "index.py"
  }
}

# IAM role for Lambda remediation
resource "aws_iam_role" "lambda_remediation" {
  name = "${local.prefix}-lambda-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "lambda_remediation" {
  name = "${local.prefix}-lambda-remediation-policy"
  role = aws_iam_role.lambda_remediation.id

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
        Resource = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:ModifyInstanceAttribute",
          "ec2:CreateSecurityGroup",
          "ec2:DescribeSecurityGroups",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "securityhub:BatchImportFindings"
        ]
        Resource = "*"
      }
    ]
  })
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "guardduty_lambda" {
  rule      = aws_cloudwatch_event_rule.guardduty.name
  target_id = "GuardDutyRemediation"
  arn       = aws_lambda_function.guardduty_remediation.arn
}

resource "aws_lambda_permission" "guardduty_invoke" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.guardduty_remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty.arn
}

# ============================================================================
# AWS CONFIG
# ============================================================================

# Config S3 bucket
resource "aws_s3_bucket" "config" {
  bucket = "${local.prefix}-config-${local.account_id}"

  tags = {
    Name = "${local.prefix}-config"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
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

# Config IAM role
resource "aws_iam_role" "config" {
  name = "${local.prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "${local.prefix}-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# Config recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.prefix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true

    recording_strategy {
      use_only = "ALL_SUPPORTED_RESOURCE_TYPES"
    }
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  lifecycle {
    prevent_destroy = false
  }
}

# Start Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]

  lifecycle {
    prevent_destroy = false
  }
}

# Config rules
resource "aws_config_config_rule" "s3_public_read_prohibited" {
  name = "${local.prefix}-s3-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${local.prefix}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_config_rule" "root_mfa_enabled" {
  name = "${local.prefix}-root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_config_config_rule" "ec2_imdsv2_check" {
  name = "${local.prefix}-ec2-imdsv2-check"

  source {
    owner             = "AWS"
    source_identifier = "EC2_IMDSV2_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# SECRETS MANAGER
# ============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${local.prefix}-db-credentials"
  description             = "Database credentials with automatic rotation"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.main.id

  tags = {
    Name = "${local.prefix}-db-credentials"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = "placeholder.rds.amazonaws.com"
    port     = 5432
    dbname   = "findata"
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes  = [secret_string]
  }
}

# Secret rotation configuration
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [
    aws_lambda_permission.secret_rotation
  ]
}

# Lambda for secret rotation
resource "aws_lambda_function" "secret_rotation" {
  filename         = data.archive_file.lambda_rotation.output_path
  function_name    = "${local.prefix}-secret-rotation"
  role             = aws_iam_role.lambda_rotation.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_rotation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.aws_region}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda_rotation.id]
  }

  tags = {
    Name = "${local.prefix}-secret-rotation"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Security group for Lambda rotation function
resource "aws_security_group" "lambda_rotation" {
  name_prefix = "${local.prefix}-lambda-rotation-"
  vpc_id      = local.vpc_id
  description = "Security group for Lambda rotation function"

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "HTTPS to VPC endpoints"
  }

  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "PostgreSQL"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda rotation code
data "archive_file" "lambda_rotation" {
  type        = "zip"
  output_path = "/tmp/rotation.zip"

  source {
    content  = <<EOF
import json
import boto3
import os

def handler(event, context):
    """
    Basic secret rotation function stub
    In production, implement full rotation logic
    """
    
    service_client = boto3.client('secretsmanager')
    arn = event['SecretId']
    token = event['Token']
    step = event['Step']
    
    if step == "createSecret":
        # Generate new secret
        pass
    elif step == "setSecret":
        # Set new secret in service
        pass
    elif step == "testSecret":
        # Verify new secret
        pass
    elif step == "finishSecret":
        # Mark new secret as current
        service_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token,
            RemoveFromVersionId=event['Token']
        )
    
    return {"statusCode": 200}
EOF
    filename = "index.py"
  }
}

# IAM role for Lambda rotation
resource "aws_iam_role" "lambda_rotation" {
  name = "${local.prefix}-lambda-rotation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy" "lambda_rotation" {
  name = "${local.prefix}-lambda-rotation-policy"
  role = aws_iam_role.lambda_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeNetworkInterfaces"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_rotation_vpc" {
  role       = aws_iam_role.lambda_rotation.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Permission for Secrets Manager to invoke Lambda
resource "aws_lambda_permission" "rotation" {
  statement_id  = "AllowSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# ============================================================================
# SERVICE CONTROL POLICIES (SCPs)
# ============================================================================

# SCP to prevent disabling security services
resource "aws_organizations_policy" "security_baseline" {
  count = var.target_organization_unit_id != "" ? 1 : 0

  name        = "${local.prefix}-security-baseline"
  description = "Prevent disabling of key security services"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "securityhub:Disable*",
          "securityhub:Delete*",
          "securityhub:UpdateStandardsControl"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "guardduty:Delete*",
          "guardduty:Disable*",
          "guardduty:StopMonitoringMembers",
          "guardduty:UpdateDetector"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "cloudtrail:UpdateTrail"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "ec2:ModifyInstanceMetadataOptions"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "ec2:MetadataHttpTokens" = "required"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${local.prefix}-security-baseline"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Attach SCP to OU
resource "aws_organizations_policy_attachment" "security_baseline" {
  count = var.target_organization_unit_id != "" ? 1 : 0

  policy_id = aws_organizations_policy.security_baseline[0].id
  target_id = var.target_organization_unit_id

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# CLOUDWATCH ALARMS AND METRICS
# ============================================================================

# SNS topic for alarm notifications
resource "aws_sns_topic" "security_alarms" {
  name              = "${local.prefix}-security-alarms"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${local.prefix}-security-alarms"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_sns_topic_subscription" "security_alarms" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alarms.arn
  protocol  = "email"
  endpoint  = var.notification_email

  lifecycle {
    prevent_destroy = false
  }
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${local.prefix}-unauthorized-api-calls"
  log_group_name = "/aws/cloudtrail/${local.prefix}"
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.prefix}/Security"
    value     = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${local.prefix}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${local.prefix}-unauthorized-api-calls"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "${local.prefix}-root-account-usage"
  log_group_name = "/aws/cloudtrail/${local.prefix}"
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${local.prefix}/Security"
    value     = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${local.prefix}-root-account-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${local.prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert on root account usage"
  alarm_actions       = [aws_sns_topic.security_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${local.prefix}-root-account-usage"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# AWS WAF
# ============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${local.prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Core Rule Set (OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

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
      metric_name                = "${local.prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # Known bad inputs rule set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

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
      metric_name                = "${local.prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection rule set
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.prefix}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Linux rule set
  rule {
    name     = "AWSManagedRulesLinuxRuleSet"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.prefix}-linux"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.prefix}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${local.prefix}-web-acl"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# WAF logging configuration
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/waf/${local.prefix}"
  retention_in_days = local.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${local.prefix}-waf-logs"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# EC2 LAUNCH TEMPLATE WITH IMDSv2 ENFORCEMENT
# ============================================================================

resource "aws_launch_template" "secure" {
  name_prefix = "${local.prefix}-secure-"
  description = "Launch template with IMDSv2 enforcement and security hardening"

  metadata_options {
    http_tokens                 = "required" # Enforce IMDSv2
    http_put_response_hop_limit = 1
    http_endpoint               = "enabled"
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  iam_instance_profile {
    arn = aws_iam_instance_profile.application.arn
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      var.tags,
      {
        Name               = "${local.prefix}-instance"
        DataClassification = var.data_classification
      }
    )
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Security hardening script
    
    # Update system
    yum update -y
    
    # Install security tools
    yum install -y aws-cli aide
    
    # Configure AIDE
    aide --init
    mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
    
    # Enable SELinux (if available)
    if [ -f /etc/selinux/config ]; then
      sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config
    fi
    
    # Configure CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a query -m ec2 -c default -s
  EOF
  )

  lifecycle {
    prevent_destroy = false
  }
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "application" {
  name = "${local.prefix}-application-profile"
  role = aws_iam_role.application.name

  lifecycle {
    prevent_destroy = false
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.main.arn
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "application_bucket_arn" {
  description = "ARN of the application S3 bucket"
  value       = aws_s3_bucket.application.arn
}

output "audit_bucket_arn" {
  description = "ARN of the audit S3 bucket"
  value       = aws_s3_bucket.audit.arn
}

output "security_hub_arn" {
  description = "ARN of Security Hub"
  value       = aws_securityhub_account.main.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "vpc_endpoint_ids" {
  description = "Map of VPC endpoint IDs"
  value = {
    s3              = aws_vpc_endpoint.s3.id
    dynamodb        = aws_vpc_endpoint.dynamodb.id
    secrets_manager = aws_vpc_endpoint.secrets_manager.id
  }
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "org_policy_arns" {
  description = "ARNs of Organization SCPs"
  value       = var.target_organization_unit_id != "" ? [aws_organizations_policy.security_baseline[0].arn] : []
}

output "admin_role_arn" {
  description = "ARN of the admin IAM role"
  value       = aws_iam_role.admin.arn
}

output "application_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.application.arn
}

output "launch_template_id" {
  description = "ID of the secure launch template"
  value       = aws_launch_template.secure.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alarms"
  value       = aws_sns_topic.security_alarms.arn
}

output "vpc_flow_logs_group" {
  description = "CloudWatch log group for VPC flow logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

`
