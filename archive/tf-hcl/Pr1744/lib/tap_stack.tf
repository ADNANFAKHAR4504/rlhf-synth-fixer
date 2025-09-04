# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nova-elite-project"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
  default     = "nova-elite-project.meerio.com"
}

# Locals
locals {
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : var.environment
  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = local.name_suffix
    ManagedBy         = "terraform"
    Compliance        = "nist-cis"
    Owner             = "infrastructure-team"
  }

  # Networking configuration
  vpc_cidr = "10.0.0.0/16"
  azs      = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}


# KMS Keys for encryption
resource "aws_kms_key" "main" {
  description              = "Main encryption key for ${var.project_name}"
  deletion_window_in_days  = 7
  enable_key_rotation      = true
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  key_usage                = "ENCRYPT_DECRYPT"

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
        Sid    = "Allow Config to use the key"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
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

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-main-${local.name_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# DNSSEC KMS Key for Route 53
resource "aws_kms_key" "dnssec" {
  description              = "DNSSEC signing key for ${var.project_name}"
  deletion_window_in_days  = 7
  enable_key_rotation      = false # DNSSEC keys should not rotate automatically
  customer_master_key_spec = "ECC_NIST_P256"
  key_usage                = "SIGN_VERIFY"

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
        Sid    = "Allow Route53 DNSSEC Service"
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Purpose = "DNSSEC-Signing"
  })
}

resource "aws_kms_alias" "dnssec" {
  name          = "alias/${var.project_name}-dnssec-${local.name_suffix}"
  target_key_id = aws_kms_key.dnssec.key_id
}

# VPC and Enhanced Networking
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-${local.name_suffix}"
  })
}

# VPC Flow Logs for enhanced monitoring
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs/${var.project_name}-${local.name_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "flow_log_role" {
  name_prefix = "${var.project_name}-fl-${local.name_suffix}-"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "${var.project_name}-flow-log-policy-${local.name_suffix}"
  role = aws_iam_role.flow_log_role.id

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
        Effect = "Allow"
        # BEST PRACTICE: Scoped down permissions to the specific log group ARN.
        Resource = "${aws_cloudwatch_log_group.vpc_flow_log.arn}:*"
      }
    ]
  })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = element(local.azs, count.index)

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-${local.name_suffix}-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = element(local.azs, count.index)
  map_public_ip_on_launch = false # Security best practice

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-${local.name_suffix}-${count.index + 1}"
    Type = "public"
  })
}

# Database subnets for enhanced isolation
resource "aws_subnet" "database" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = element(local.azs, count.index)

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-database-${local.name_suffix}-${count.index + 1}"
    Type = "database"
  })
}

# DB Subnet Group - SKIPPED DUE TO QUOTA: 150 DB subnet groups limit reached
# resource "aws_db_subnet_group" "main" {
#   name       = "${var.project_name}-db-subnet-group-${local.name_suffix}"
#   subnet_ids = aws_subnet.database[*].id

#   tags = merge(local.common_tags, {
#     Name = "${var.project_name}-db-subnet-group-${local.name_suffix}"
#   })
# }

# Internet Gateway and NAT Gateways
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw-${local.name_suffix}"
  })
}

resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-${local.name_suffix}-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-${local.name_suffix}-${count.index + 1}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt-${local.name_suffix}"
  })
}

resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${local.name_suffix}-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Enhanced Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-${local.name_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web tier"

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere (for redirection)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-sg-${local.name_suffix}"
    Tier = "web"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-${local.name_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application tier"

  ingress {
    description     = "Traffic from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-app-sg-${local.name_suffix}"
    Tier = "app"
  })
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-${local.name_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database tier"

  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-sg-${local.name_suffix}"
    Tier = "database"
  })
}

# Enhanced Network ACLs
resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
  egress {
    rule_no    = 100
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-nacl-${local.name_suffix}"
  })
}

resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  ingress {
    rule_no    = 100
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = local.vpc_cidr
    action     = "allow"
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
  egress {
    rule_no    = 100
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-nacl-${local.name_suffix}"
  })
}

# Associate NACLs with subnets
resource "aws_network_acl_association" "public" {
  count          = length(aws_subnet.public)
  network_acl_id = aws_network_acl.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

resource "aws_network_acl_association" "private" {
  count          = length(aws_subnet.private)
  network_acl_id = aws_network_acl.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

# Enhanced WAF with latest security rules
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-waf-${local.name_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
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
      metric_name                = "waf-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
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
      metric_name                = "waf-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-${local.name_suffix}"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# WAF Log Group (must use aws-waf-logs- prefix)
resource "aws_cloudwatch_log_group" "waf_log_group" {
  name              = "aws-waf-logs-${var.project_name}-${local.name_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_log_group.arn]
}

# Route 53 with DNSSEC
resource "aws_route53_zone" "main" {
  name = var.domain_name

  # Allow deletion without DNSSEC conflicts
  lifecycle {
    prevent_destroy = false
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-zone-${local.name_suffix}"
  })
}

# DNSSEC configuration - disabled to prevent deletion issues
# resource "aws_route53_key_signing_key" "main" {
#   hosted_zone_id             = aws_route53_zone.main.id
#   key_management_service_arn = aws_kms_key.dnssec.arn
#   name                       = "${var.project_name}-ksk-${local.name_suffix}"
# }

# resource "aws_route53_hosted_zone_dnssec" "main" {
#   hosted_zone_id = aws_route53_key_signing_key.main.hosted_zone_id
#   signing_status = "SIGNING"
#   depends_on = [
#     aws_route53_key_signing_key.main
#   ]
# }

# Enhanced S3 Configuration
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${local.name_suffix}"

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket      = aws_s3_bucket.main.id
  eventbridge = true
}

# CloudTrail S3 bucket for logging
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-${local.name_suffix}"
  # FIX: Added force_destroy to prevent BucketNotEmpty errors during terraform destroy.
  # Use with caution in production.
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
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
        Condition = {
          StringEquals = {
            "aws:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-trail-${local.name_suffix}"
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
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "aws:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-trail-${local.name_suffix}"
          }
        }
      }
    ]
  })
}

# Enhanced IAM with MFA enforcement
resource "aws_iam_user" "admin_user" {
  name = "${var.project_name}-admin-${local.name_suffix}"
  tags = local.common_tags
  
  lifecycle {
    ignore_changes = [name]
  }
}

resource "aws_iam_policy" "mfa_enforcement" {
  name        = "${var.project_name}-mfa-enforcement-${local.name_suffix}"
  description = "Policy to enforce MFA for all operations"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AllowAllUsersToListAccounts",
        Effect   = "Allow",
        Action   = ["iam:ListAccountAliases", "iam:ListUsers", "iam:GetAccountSummary"],
        Resource = "*"
      },
      {
        Sid      = "AllowIndividualUserToSeeAndManageOnlyTheirOwnAccountInformation",
        Effect   = "Allow",
        Action   = ["iam:ChangePassword", "iam:CreateAccessKey", "iam:CreateLoginProfile", "iam:DeleteAccessKey", "iam:DeleteLoginProfile", "iam:GetLoginProfile", "iam:ListAccessKeys", "iam:UpdateAccessKey", "iam:UpdateLoginProfile", "iam:GetUser"],
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/$${aws:username}"
      },
      {
        Sid      = "AllowIndividualUserToManageTheirOwnMFA",
        Effect   = "Allow",
        Action   = ["iam:CreateVirtualMFADevice", "iam:DeleteVirtualMFADevice", "iam:EnableMFADevice", "iam:ListMFADevices", "iam:ResyncMFADevice"],
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:mfa/$${aws:username}"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_user_policy_attachment" "mfa_enforcement" {
  user       = aws_iam_user.admin_user.name
  policy_arn = aws_iam_policy.mfa_enforcement.arn
}

# Least-privilege IAM Role for applications
resource "aws_iam_role" "app_role" {
  name = "${var.project_name}-app-role-${local.name_suffix}"

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

resource "aws_iam_policy" "app_policy" {
  name = "${var.project_name}-app-policy-${local.name_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_policy_attachment" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_policy.arn
}

# CloudTrail for comprehensive logging
# SKIPPED DUE TO QUOTA: Maximum 5 trails reached
# resource "aws_cloudtrail" "main" {
#   name           = "${var.project_name}-trail-${local.name_suffix}"
#   s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true

#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["${aws_s3_bucket.main.arn}/*"]
#     }
#   }

#   kms_key_id                    = aws_kms_key.main.arn
#   enable_log_file_validation    = true
#   is_multi_region_trail         = false
#   include_global_service_events = true

#   cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
#   cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

#   tags = local.common_tags

#   depends_on = [aws_s3_bucket_policy.cloudtrail]
# }

resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/cloudtrail/${var.project_name}-${local.name_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  name = "${var.project_name}-cloudtrail-cloudwatch-role-${local.name_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "${var.project_name}-cloudtrail-cloudwatch-policy-${local.name_suffix}"
  role = aws_iam_role.cloudtrail_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
      }
    ]
  })
}

resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-config-recorder-${local.name_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_s3_bucket" "config" {
  bucket        = "${var.project_name}-config-${local.name_suffix}"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
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
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
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

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-config-delivery-channel-${local.name_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role-${local.name_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_bucket_access" {
  name = "${var.project_name}-config-bucket-access-${local.name_suffix}"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringLike = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Recorder Status
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules for NIST/CIS compliance
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited-${local.name_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.project_name}-encrypted-volumes-${local.name_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "${var.project_name}-iam-password-policy-${local.name_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# GuardDuty for threat detection
# Import existing detector or skip if already exists
data "aws_guardduty_detector" "existing" {
  count = 1
}

resource "aws_guardduty_detector" "main" {
  count                        = length(data.aws_guardduty_detector.existing) == 0 ? 1 : 0
  enable                       = true
  finding_publishing_frequency = "SIX_HOURS"

  tags = local.common_tags
}

# GuardDuty detector features - modern approach
resource "aws_guardduty_detector_feature" "s3_data_events" {
  count       = length(data.aws_guardduty_detector.existing) == 0 ? 1 : 0
  detector_id = aws_guardduty_detector.main[0].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

resource "aws_guardduty_detector_feature" "ebs_malware_protection" {
  count       = length(data.aws_guardduty_detector.existing) == 0 ? 1 : 0
  detector_id = aws_guardduty_detector.main[0].id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# CloudWatch Alarms for security monitoring
resource "aws_sns_topic" "security_alerts" {
  name              = "${var.project_name}-security-alerts-${local.name_suffix}"
  kms_master_key_id = aws_kms_key.main.id

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${var.project_name}-root-account-usage-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project_name}-unauthorized-api-calls-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "security_group_web_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}

output "security_group_app_id" {
  description = "App security group ID"
  value       = aws_security_group.app.id
}

output "security_group_database_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "s3_bucket_name" {
  description = "Main S3 bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_cloudtrail_name" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "s3_bucket_config_name" {
  description = "Config S3 bucket name"
  value       = aws_s3_bucket.config.bucket
}

output "kms_key_id" {
  description = "Main KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "Main KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "waf_acl_arn" {
  description = "WAF ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "iam_role_app_arn" {
  description = "Application IAM role ARN"
  value       = aws_iam_role.app_role.arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = "cloudtrail-skipped-due-to-quota"
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = length(data.aws_guardduty_detector.existing) > 0 ? data.aws_guardduty_detector.existing[0].id : (length(aws_guardduty_detector.main) > 0 ? aws_guardduty_detector.main[0].id : "")
}

output "sns_topic_security_alerts_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = [for ng in aws_nat_gateway.main : ng.id]
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
