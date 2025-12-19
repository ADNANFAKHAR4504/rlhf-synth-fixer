# IDEAL RESPONSE

Below is the complete and final Terraform implementation for the secure data analytics infrastructure, exactly as defined in `tap_stack.tf`.

```hcl
# tap_stack.tf - Secure Data Analytics Infrastructure for Financial Services
# Terraform 1.5+ compatible configuration implementing defense-in-depth security controls
# Compliant with PCI-DSS requirements and AWS security best practices

# ==============================================================================
# VARIABLES - Input parameters for the infrastructure
# ==============================================================================

# Core variables are defined in variables.tf (aws_region, environment_suffix, etc.)
# Application-specific variables defined here

variable "preexisting_kms_key_arn" {
  description = "ARN of pre-existing KMS key for data encryption (optional)"
  type        = string
  default     = ""
}

variable "iam_permission_boundary_arn" {
  description = "ARN of IAM permission boundary policy to apply to all roles"
  type        = string
  default     = "" # Optional - only used if required by organization
}

variable "security_account_id" {
  description = "AWS Account ID for the security account"
  type        = string
  default     = "" # Will default to current account if not specified
}

variable "flow_logs_account_id" {
  description = "AWS Account ID that will receive VPC Flow Logs"
  type        = string
  default     = "" # Will default to current account if not specified
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "high_severity_threshold" {
  description = "GuardDuty severity threshold for automated remediation"
  type        = number
  default     = 7
}

# ==============================================================================
# DATA SOURCES - Reference existing resources
# ==============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Reference existing KMS key if provided
data "aws_kms_key" "existing_data_key" {
  count  = var.preexisting_kms_key_arn != "" ? 1 : 0
  key_id = var.preexisting_kms_key_arn
}

# ==============================================================================
# LOCALS - Reusable values and configurations
# ==============================================================================

locals {
  # Common naming prefix using environment_suffix from variables.tf
  name_prefix = "finserv-analytics-${var.environment_suffix}"

  # Security account defaults to current account if not specified
  security_account_id  = var.security_account_id != "" ? var.security_account_id : data.aws_caller_identity.current.account_id
  flow_logs_account_id = var.flow_logs_account_id != "" ? var.flow_logs_account_id : data.aws_caller_identity.current.account_id

  # VPC CIDR configuration
  vpc_cidr = "10.0.0.0/16"

  # Subnet CIDR blocks - 3 AZs with /24 subnets
  private_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]

  # Security group rules structure for dynamic blocks
  security_group_rules = {
    ssm_endpoints = {
      ingress = [
        {
          description = "HTTPS for SSM endpoints"
          from_port   = 443
          to_port     = 443
          protocol    = "tcp"
          cidr_blocks = [local.vpc_cidr]
        }
      ]
      egress = []
    }
    lambda = {
      ingress = []
      egress = [
        {
          description = "HTTPS outbound for AWS API calls"
          from_port   = 443
          to_port     = 443
          protocol    = "tcp"
          cidr_blocks = ["0.0.0.0/0"]
        }
      ]
    }
    vpc_endpoints = {
      ingress = [
        {
          description = "HTTPS from VPC for service endpoints"
          from_port   = 443
          to_port     = 443
          protocol    = "tcp"
          cidr_blocks = [local.vpc_cidr]
        }
      ]
      egress = []
    }
  }

  # S3 bucket names must be globally unique
  flow_logs_bucket_name   = "${local.name_prefix}-flow-logs-${data.aws_caller_identity.current.account_id}"
  data_lake_bucket_name   = "${local.name_prefix}-data-lake-${data.aws_caller_identity.current.account_id}"
  access_logs_bucket_name = "${local.name_prefix}-access-logs-${data.aws_caller_identity.current.account_id}"
  cloudtrail_bucket_name  = "${local.name_prefix}-cloudtrail-${data.aws_caller_identity.current.account_id}"
  config_bucket_name      = "${local.name_prefix}-config-${data.aws_caller_identity.current.account_id}"
}

# ==============================================================================
# NETWORKING - Security VPC with no internet access
# PCI-DSS Control: Network segmentation (1.2, 1.3)
# ==============================================================================

# Security VPC - isolated network for sensitive operations
resource "aws_vpc" "security_vpc" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name           = "${local.name_prefix}-security-vpc"
    Type           = "Security"
    InternetAccess = "None"
  }
}

# Private subnets across 3 availability zones
resource "aws_subnet" "private_subnets" {
  count = 3

  vpc_id                  = aws_vpc.security_vpc.id
  cidr_block              = local.private_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
    Tier = "Data"
  }
}

# Route table for private subnets - routes through Transit Gateway
resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.security_vpc.id

  tags = {
    Name = "${local.name_prefix}-private-rt"
    Type = "Private"
  }
}

# Associate private subnets with route table
resource "aws_route_table_association" "private_subnet_associations" {
  count = length(aws_subnet.private_subnets)

  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_route_table.id
}

# Transit Gateway attachment for centralized routing
resource "aws_ec2_transit_gateway_vpc_attachment" "security_vpc_attachment" {
  count = var.transit_gateway_id != "tgw-xxxxxxxxxxxxxxxxx" ? 1 : 0
  
  subnet_ids         = aws_subnet.private_subnets[*].id
  transit_gateway_id = var.transit_gateway_id
  vpc_id             = aws_vpc.security_vpc.id

  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name = "${local.name_prefix}-tgw-attachment"
  }
}

# Default route through Transit Gateway for egress
resource "aws_route" "default_route_to_tgw" {
  count = var.transit_gateway_id != "tgw-xxxxxxxxxxxxxxxxx" ? 1 : 0
  
  route_table_id         = aws_route_table.private_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = var.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.security_vpc_attachment]
}

# ==============================================================================
# NETWORK ACLS - Additional layer of network security
# PCI-DSS Control: Network security controls (1.2.1)
# ==============================================================================

# Create custom NACL for additional security layer
resource "aws_network_acl" "private_nacl" {
  vpc_id = aws_vpc.security_vpc.id

  # Allow internal VPC communication
  ingress {
    rule_no    = 100
    protocol   = -1
    action     = "allow"
    cidr_block = local.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Explicit deny for SSH (redundant with security groups, defense in depth)
  ingress {
    rule_no    = 90
    protocol   = "tcp"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Explicit deny for RDP
  ingress {
    rule_no    = 91
    protocol   = "tcp"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 3389
    to_port    = 3389
  }

  # Allow return traffic
  ingress {
    rule_no    = 200
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Egress rules
  egress {
    rule_no    = 100
    protocol   = -1
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${local.name_prefix}-private-nacl"
  }
}

# Associate NACL with private subnets
resource "aws_network_acl_association" "private_nacl_associations" {
  count = length(aws_subnet.private_subnets)

  network_acl_id = aws_network_acl.private_nacl.id
  subnet_id      = aws_subnet.private_subnets[count.index].id
}

# ==============================================================================
# VPC FLOW LOGS - Network traffic monitoring
# PCI-DSS Control: Network monitoring (10.1, 10.2)
# ==============================================================================

# S3 bucket for VPC Flow Logs with immutable storage
resource "aws_s3_bucket" "flow_logs_bucket" {
  bucket = local.flow_logs_bucket_name

  # Deletion protection explicitly disabled as required
  # deletion_protection = false  # Not a valid S3 attribute

  tags = {
    Name      = local.flow_logs_bucket_name
    Purpose   = "VPCFlowLogs"
    Retention = "${var.log_retention_days}days"
    Immutable = "true"
  }
}

# Enable versioning for flow logs bucket
resource "aws_s3_bucket_versioning" "flow_logs_versioning" {
  bucket = aws_s3_bucket.flow_logs_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Object lock configuration for immutability
resource "aws_s3_bucket_object_lock_configuration" "flow_logs_lock" {
  bucket = aws_s3_bucket.flow_logs_bucket.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.log_retention_days
    }
  }
}

# Lifecycle rule for flow logs
resource "aws_s3_bucket_lifecycle_configuration" "flow_logs_lifecycle" {
  bucket = aws_s3_bucket.flow_logs_bucket.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.log_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Block public access for flow logs bucket
resource "aws_s3_bucket_public_access_block" "flow_logs_pab" {
  bucket = aws_s3_bucket.flow_logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for VPC Flow Logs service
resource "aws_s3_bucket_policy" "flow_logs_policy" {
  bucket = aws_s3_bucket.flow_logs_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.flow_logs_bucket.arn
      },
      {
        Sid    = "SecurityAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.flow_logs_account_id}:root"
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.flow_logs_bucket.arn,
          "${aws_s3_bucket.flow_logs_bucket.arn}/*"
        ]
      }
    ]
  })
}

# VPC Flow Logs configuration
resource "aws_flow_log" "security_vpc_flow_logs" {
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs_bucket.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.security_vpc.id

  log_format = "$${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${action}"

  tags = {
    Name = "${local.name_prefix}-vpc-flow-logs"
  }
}

# ==============================================================================
# S3 DATA LAKE - Secure data storage with encryption
# PCI-DSS Control: Data encryption at rest (3.4)
# ==============================================================================

# Access logs bucket for data lake
resource "aws_s3_bucket" "data_lake_access_logs" {
  bucket = local.access_logs_bucket_name

  tags = {
    Name    = local.access_logs_bucket_name
    Purpose = "AccessLogs"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake_access_logs_encryption" {
  bucket = aws_s3_bucket.data_lake_access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Versioning for access logs bucket
resource "aws_s3_bucket_versioning" "access_logs_versioning" {
  bucket = aws_s3_bucket.data_lake_access_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access for access logs
resource "aws_s3_bucket_public_access_block" "access_logs_pab" {
  bucket = aws_s3_bucket.data_lake_access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Main data lake bucket
resource "aws_s3_bucket" "data_lake" {
  bucket = local.data_lake_bucket_name

  tags = {
    Name              = local.data_lake_bucket_name
    Purpose           = "DataLake"
    DataSensitivity   = "High"
    EncryptionEnabled = "true"
    MFADelete         = "PendingEnable"
  }
}

# Enable versioning with MFA delete (requires manual activation)
resource "aws_s3_bucket_versioning" "data_lake_versioning" {
  bucket = aws_s3_bucket.data_lake.id

  versioning_configuration {
    status = "Enabled"
    # MFA Delete can only be enabled via AWS CLI with MFA
  }
}

# Note: MFA Delete can only be enabled via AWS CLI with MFA authentication
# To enable: aws s3api put-bucket-versioning --bucket <BUCKET_NAME> \
#   --versioning-configuration Status=Enabled,MFADelete=Enabled \
#   --mfa 'arn:aws:iam::ACCOUNT_ID:mfa/USERNAME MFA_CODE'

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake_encryption" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn
    }
    bucket_key_enabled = true
  }
}

# Access logging for data lake
resource "aws_s3_bucket_logging" "data_lake_logging" {
  bucket = aws_s3_bucket.data_lake.id

  target_bucket = aws_s3_bucket.data_lake_access_logs.id
  target_prefix = "data-lake-logs/"
}

# Block public access for data lake
resource "aws_s3_bucket_public_access_block" "data_lake_pab" {
  bucket = aws_s3_bucket.data_lake.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy restricting access to specific roles
resource "aws_s3_bucket_policy" "data_lake_policy" {
  bucket = aws_s3_bucket.data_lake.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowSecurityAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.security_account_id}:root"
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Sid    = "AllowAnalyticsRoleAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.analytics_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      }
    ]
  })
}

# Lifecycle rules for data retention
resource "aws_s3_bucket_lifecycle_configuration" "data_lake_lifecycle" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-old-data"
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

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }
  }
}

# ==============================================================================
# IAM ROLES AND POLICIES - Least privilege access control
# PCI-DSS Control: Access control (7.1, 7.2, 8.1)
# ==============================================================================

# Analytics role for EC2 instances
resource "aws_iam_role" "analytics_role" {
  name                 = "${local.name_prefix}-analytics-role"
  permissions_boundary = var.iam_permission_boundary_arn != "" ? var.iam_permission_boundary_arn : null

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "ssm.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Purpose = "DataAnalytics"
  }
}

# Explicit deny policy for sensitive operations
resource "aws_iam_role_policy" "analytics_explicit_deny" {
  name = "${local.name_prefix}-explicit-deny"
  role = aws_iam_role.analytics_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ExplicitDenySensitiveOperations"
        Effect = "Deny"
        Action = [
          "iam:DeleteUser",
          "iam:DeleteRole",
          "iam:DeleteGroup",
          "iam:RemoveUserFromGroup",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey",
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy",
          "s3:PutBucketPolicy",
          "ec2:TerminateInstances",
          "rds:DeleteDBInstance",
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
          "guardduty:DeleteDetector",
          "config:DeleteConfigurationRecorder"
        ]
        Resource = "*"
      }
    ]
  })
}

# Allow policy for analytics operations
resource "aws_iam_role_policy" "analytics_allow_policy" {
  name = "${local.name_prefix}-analytics-allow"
  role = aws_iam_role.analytics_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3DataLakeReadAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Sid    = "KMSDecryptAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn
      },
      {
        Sid    = "SSMAccess"
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:GetMessages"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "analytics_profile" {
  name = "${local.name_prefix}-analytics-profile"
  role = aws_iam_role.analytics_role.name
}

# Lambda execution role for GuardDuty remediation
resource "aws_iam_role" "guardduty_lambda_role" {
  name                 = "${local.name_prefix}-guardduty-lambda-role"
  permissions_boundary = var.iam_permission_boundary_arn != "" ? var.iam_permission_boundary_arn : null

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
}

# Lambda execution policy
resource "aws_iam_role_policy" "guardduty_lambda_policy" {
  name = "${local.name_prefix}-guardduty-lambda-policy"
  role = aws_iam_role.guardduty_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Sid    = "GuardDutyFindings"
        Effect = "Allow"
        Action = [
          "guardduty:GetFindings",
          "guardduty:UpdateFindingsFeedback"
        ]
        Resource = aws_guardduty_detector.main.arn
      },
      {
        Sid    = "RemediationActions"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:ModifyInstanceAttribute",
          "ec2:CreateSecurityGroup",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
          "s3:PutObjectTagging",
          "s3:GetObjectTagging",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# Basic Lambda execution policy attachment
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.guardduty_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Dedicated Lambda execution role for KMS rotation
resource "aws_iam_role" "kms_rotation_lambda_role" {
  count                = var.preexisting_kms_key_arn == "" ? 1 : 0
  name                 = "${local.name_prefix}-kms-rotation-lambda-role"
  permissions_boundary = var.iam_permission_boundary_arn != "" ? var.iam_permission_boundary_arn : null

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
}

resource "aws_iam_role_policy" "kms_rotation_lambda_policy" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  name = "${local.name_prefix}-kms-rotation-lambda-policy"
  role = aws_iam_role.kms_rotation_lambda_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Sid    = "KMSRotateKey"
        Effect = "Allow"
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:ListResourceTags",
          "kms:ListKeyPolicies",
          "kms:EnableKeyRotation",
          "kms:DisableKeyRotation"
        ]
        Resource = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "kms_rotation_lambda_basic_execution" {
  count      = var.preexisting_kms_key_arn == "" ? 1 : 0
  role       = aws_iam_role.kms_rotation_lambda_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ==============================================================================
# KMS - Encryption key management
# PCI-DSS Control: Cryptographic key management (3.5, 3.6)
# ==============================================================================

# Create KMS key if not using pre-existing
resource "aws_kms_key" "data_encryption_key" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  description             = "KMS key for data lake encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true # Annual rotation - see EventBridge rule for 90-day rotation
  multi_region            = false

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
        Sid    = "Allow use of the key for encryption"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.analytics_role.arn,
            "arn:aws:iam::${local.security_account_id}:root"
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.analytics_role.arn
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-data-encryption-key"
  }
}

# KMS key alias
resource "aws_kms_alias" "data_encryption_key_alias" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  name          = "alias/${local.name_prefix}-data-encryption"
  target_key_id = aws_kms_key.data_encryption_key[0].key_id
}

# Lambda function for 90-day key rotation
resource "aws_lambda_function" "kms_rotation_lambda" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  filename      = "${path.module}/lambda/kms_rotation_payload.zip"
  function_name = "${local.name_prefix}-kms-rotation"
  role          = aws_iam_role.kms_rotation_lambda_role[0].arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60

  source_code_hash = data.archive_file.kms_rotation_lambda[0].output_base64sha256

  environment {
    variables = {
      KMS_KEY_ID = aws_kms_key.data_encryption_key[0].id
    }
  }

  tags = {
    Purpose = "KMSRotation"
    Note    = "AWS managed rotation is annual. This documents 90-day rotation requirement."
  }
}

# Create deployment package for KMS rotation Lambda
data "archive_file" "kms_rotation_lambda" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  type        = "zip"
  source_file = "${path.module}/lambda/kms_rotation/index.py"
  output_path = "${path.module}/lambda/kms_rotation_payload.zip"
}

# EventBridge rule for 90-day KMS rotation
resource "aws_cloudwatch_event_rule" "kms_rotation_schedule" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  name                = "${local.name_prefix}-kms-rotation-90days"
  description         = "Trigger KMS key rotation every 90 days"
  schedule_expression = "rate(90 days)"
}

resource "aws_cloudwatch_event_target" "kms_rotation_lambda_target" {
  count = var.preexisting_kms_key_arn == "" ? 1 : 0

  rule      = aws_cloudwatch_event_rule.kms_rotation_schedule[0].name
  target_id = "KMSRotationLambda"
  arn       = aws_lambda_function.kms_rotation_lambda[0].arn
}

resource "aws_lambda_permission" "kms_rotation_eventbridge" {
  count         = var.preexisting_kms_key_arn == "" ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridgeKMSRotation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.kms_rotation_lambda[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.kms_rotation_schedule[0].arn
}

# ==============================================================================
# GUARDDUTY - Threat detection and automated response
# PCI-DSS Control: Intrusion detection (11.4)
# ==============================================================================

# Enable GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Not using EKS in this infrastructure
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
    Name = "${local.name_prefix}-guardduty-detector"
  }
}

# Lambda function for GuardDuty remediation
resource "aws_lambda_function" "guardduty_remediation" {
  filename      = "${path.module}/lambda/guardduty_remediation_payload.zip"
  function_name = "${local.name_prefix}-guardduty-remediation"
  role          = aws_iam_role.guardduty_lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 300

  source_code_hash = data.archive_file.guardduty_remediation_lambda.output_base64sha256

  environment {
    variables = {
      QUARANTINE_SECURITY_GROUP_ID = aws_security_group.quarantine_sg.id
      SNS_TOPIC_ARN                = aws_sns_topic.security_alerts.arn
    }
  }

  tags = {
    Purpose = "SecurityRemediation"
  }
}

# Create deployment package for GuardDuty remediation Lambda
data "archive_file" "guardduty_remediation_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/guardduty_remediation/index.py"
  output_path = "${path.module}/lambda/guardduty_remediation_payload.zip"
}

# EventBridge rule for high-severity GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_high_severity" {
  name        = "${local.name_prefix}-guardduty-high-severity"
  description = "Trigger on high severity GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{
        numeric = [">=", var.high_severity_threshold]
      }]
    }
  })
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "guardduty_lambda_target" {
  rule      = aws_cloudwatch_event_rule.guardduty_high_severity.name
  target_id = "GuardDutyRemediationLambda"
  arn       = aws_lambda_function.guardduty_remediation.arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "guardduty_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.guardduty_remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty_high_severity.arn
}

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name = "${local.name_prefix}-security-alerts"

  kms_master_key_id = "alias/aws/sns"

  tags = {
    Purpose = "SecurityAlerts"
  }
}

# ==============================================================================
# SECURITY HUB - Centralized security findings
# PCI-DSS Control: Security monitoring and alerting (10.6)
# ==============================================================================

# Enable Security Hub
resource "aws_securityhub_account" "main" {}

# Subscribe to CIS AWS Foundations Benchmark
resource "aws_securityhub_standards_subscription" "cis_aws_foundations" {
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]
}

# Note: Custom Security Standards can be added via AWS Security Hub console
# 1. Navigate to Security Hub console -> Security standards
# 2. Choose 'Create custom standard' 
# 3. Define controls mapping to compliance requirements
# 4. Use aws_securityhub_standards_subscription resource with the custom standard ARN

# ==============================================================================
# AWS CONFIG - Configuration compliance monitoring
# PCI-DSS Control: Configuration management (2.2, 2.4)
# ==============================================================================

# S3 bucket for Config
resource "aws_s3_bucket" "config_bucket" {
  bucket = local.config_bucket_name

  tags = {
    Name    = local.config_bucket_name
    Purpose = "ConfigCompliance"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_encryption" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Versioning for Config bucket
resource "aws_s3_bucket_versioning" "config_versioning" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access for Config bucket
resource "aws_s3_bucket_public_access_block" "config_pab" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "config_bucket_logging" {
  bucket = aws_s3_bucket.config_bucket.id

  target_bucket = aws_s3_bucket.data_lake_access_logs.id
  target_prefix = "config-logs/"
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

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
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config recorder role
resource "aws_iam_role" "config_role" {
  name = "${local.name_prefix}-config-role"

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
}

# Config role policy
resource "aws_iam_role_policy" "config_policy" {
  name = "${local.name_prefix}-config-policy"
  role = aws_iam_role.config_role.id

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
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*",
          "tag:GetResources",
          "tag:GetTagKeys",
          "tag:GetTagValues",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = "*"
      }
    ]
  })
}

# Config configuration recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

# Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rule: Required Tags
resource "aws_config_config_rule" "required_tags" {
  name = "${local.name_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "DataClassification"
    tag2Key = "ComplianceScope"
    tag3Key = "Environment"
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rule: S3 Public Read Prohibited
resource "aws_config_config_rule" "s3_public_read_prohibited" {
  name = "${local.name_prefix}-s3-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rule: EC2 IMDSv2 Check
resource "aws_config_config_rule" "ec2_imdsv2_check" {
  name = "${local.name_prefix}-ec2-imdsv2-check"

  source {
    owner             = "AWS"
    source_identifier = "EC2_IMDSV2_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# ==============================================================================
# SECURITY GROUPS - Network access control
# PCI-DSS Control: Network security (1.2.1, 1.3.1)
# ==============================================================================

# Quarantine security group for compromised resources
resource "aws_security_group" "quarantine_sg" {
  name        = "${local.name_prefix}-quarantine-sg"
  description = "Quarantine security group - no inbound or outbound traffic"
  vpc_id      = aws_vpc.security_vpc.id

  # No ingress rules - complete isolation

  # Minimal egress for AWS service endpoints only
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS API endpoints only"
  }

  tags = {
    Name    = "${local.name_prefix}-quarantine-sg"
    Purpose = "IsolateCompromisedResources"
  }
}

# SSM endpoints security group
resource "aws_security_group" "ssm_endpoints_sg" {
  name        = "${local.name_prefix}-ssm-endpoints-sg"
  description = "Security group for SSM VPC endpoints"
  vpc_id      = aws_vpc.security_vpc.id

  dynamic "ingress" {
    for_each = local.security_group_rules.ssm_endpoints.ingress
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  tags = {
    Name = "${local.name_prefix}-ssm-endpoints-sg"
  }
}

# Lambda security group
resource "aws_security_group" "lambda_sg" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.security_vpc.id

  dynamic "egress" {
    for_each = local.security_group_rules.lambda.egress
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
    }
  }

  tags = {
    Name = "${local.name_prefix}-lambda-sg"
  }
}

# VPC endpoints security group
resource "aws_security_group" "vpc_endpoints_sg" {
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.security_vpc.id

  dynamic "ingress" {
    for_each = local.security_group_rules.vpc_endpoints.ingress
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  tags = {
    Name = "${local.name_prefix}-vpc-endpoints-sg"
  }
}

# ==============================================================================
# CLOUDTRAIL - Audit logging
# PCI-DSS Control: Audit trails (10.1, 10.2, 10.3)
# ==============================================================================

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = local.cloudtrail_bucket_name

  tags = {
    Name      = local.cloudtrail_bucket_name
    Purpose   = "AuditLogs"
    Immutable = "true"
  }
}

# Enable versioning for CloudTrail bucket
resource "aws_s3_bucket_versioning" "cloudtrail_versioning" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Object lock for immutable storage
resource "aws_s3_bucket_object_lock_configuration" "cloudtrail_lock" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 365 # 1 year retention for audit logs
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "cloudtrail_pab" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

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
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "SecurityAccountReadAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.security_account_id}:root"
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cloudtrail_bucket.arn,
          "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        ]
      }
    ]
  })
}

# CloudTrail configuration
resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${aws_s3_bucket.data_lake.id}/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function/*"]
    }
  }

  kms_key_id = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn

  tags = {
    Name = "${local.name_prefix}-cloudtrail"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
}

# ==============================================================================
# AWS SYSTEMS MANAGER (SSM) - Secure access management
# PCI-DSS Control: Secure remote access (8.2.3)
# ==============================================================================

# VPC endpoints for SSM Session Manager
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.security_vpc.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_subnets[*].id
  security_group_ids  = [aws_security_group.ssm_endpoints_sg.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name_prefix}-ssm-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_messages" {
  vpc_id              = aws_vpc.security_vpc.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_subnets[*].id
  security_group_ids  = [aws_security_group.ssm_endpoints_sg.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name_prefix}-ssm-messages-endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2_messages" {
  vpc_id              = aws_vpc.security_vpc.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_subnets[*].id
  security_group_ids  = [aws_security_group.ssm_endpoints_sg.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name_prefix}-ec2-messages-endpoint"
  }
}

# SSM Document for session logging
resource "aws_ssm_document" "session_manager_prefs" {
  name            = "${local.name_prefix}-session-manager-prefs"
  document_type   = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Session Manager preferences"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName                = aws_s3_bucket.cloudtrail_bucket.id
      s3KeyPrefix                 = "session-logs/"
      s3EncryptionEnabled         = true
      cloudWatchLogGroupName      = "/aws/ssm/session-logs"
      cloudWatchEncryptionEnabled = true
      idleSessionTimeout          = "20"
      maxSessionDuration          = "60"
      runAsEnabled                = false
      kmsKeyId                    = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn
    }
  })

  tags = {
    Name = "${local.name_prefix}-session-manager-prefs"
  }
}

# ==============================================================================
# OUTPUTS - Export critical resource identifiers
# ==============================================================================

output "vpc_id" {
  description = "ID of the security VPC"
  value       = aws_vpc.security_vpc.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "data_lake_bucket_arn" {
  description = "ARN of the data lake S3 bucket"
  value       = aws_s3_bucket.data_lake.arn
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_bucket.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "security_hub_arn" {
  description = "ARN of Security Hub"
  value       = aws_securityhub_account.main.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS encryption key"
  value       = var.preexisting_kms_key_arn != "" ? data.aws_kms_key.existing_data_key[0].arn : aws_kms_key.data_encryption_key[0].arn
}

output "analytics_role_arn" {
  description = "ARN of the analytics IAM role"
  value       = aws_iam_role.analytics_role.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "flow_logs_bucket_name" {
  description = "Name of the VPC Flow Logs S3 bucket"
  value       = aws_s3_bucket.flow_logs_bucket.id
}
```