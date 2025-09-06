# Variables
variable "vpc_id" {
  description = "VPC ID for resources (optional)"
  type        = string
  default     = ""
}

variable "approved_cidrs" {
  description = "List of approved CIDR blocks for security groups"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "cdn_domain" {
  description = "Custom domain for CloudFront distribution (optional)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for ACM certificate validation (optional)"
  type        = string
  default     = ""
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications (optional)"
  type        = string
  default     = ""
}

# Data sources and locals
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_subnets" "private" {
  count = var.vpc_id != "" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
  tags = {
    Type = "private"
  }
}

locals {
  suffix      = var.environment_suffix != "" ? "-${var.environment_suffix}" : ""
  name_prefix = "${var.environment}-tap${local.suffix}"
  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    Owner             = var.owner
    Purpose           = var.purpose
    ManagedBy         = "Terraform"
  }
}

# KMS CMK for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} tap stack encryption"
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
        Sid    = "Allow CloudTrail access"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs access"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow RDS access"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# S3 Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  depends_on = [aws_s3_bucket_ownership_controls.logs]

  bucket = aws_s3_bucket.logs.id
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# S3 Data Bucket
resource "aws_s3_bucket" "data" {
  bucket = "${local.name_prefix}-data-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-bucket"
  })
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "data" {
  bucket = aws_s3_bucket.data.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "data-bucket-access-logs/"
}

# S3 Bucket Policies
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedPuts"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowCloudTrailPuts"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AllowCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Sid    = "AllowCloudFrontLogs"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudfront-logs/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.logs]
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedPuts"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowOriginAccessIdentity"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.data.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.data]
}

# CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

resource "aws_iam_role" "cloudtrail" {
  name = "${local.name_prefix}-cloudtrail-role"

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

resource "aws_iam_role_policy" "cloudtrail" {
  name = "${local.name_prefix}-cloudtrail-policy"
  role = aws_iam_role.cloudtrail.id

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

resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.logs.id
  s3_key_prefix                 = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.logs]
}

# CloudFront Distribution
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Origin Access Identity for ${local.name_prefix}"
}

resource "aws_acm_certificate" "main" {
  count = var.cdn_domain != "" ? 1 : 0

  domain_name       = var.cdn_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-acm-cert"
  })
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.cdn_domain != "" && var.route53_zone_id != "" ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

resource "aws_acm_certificate_validation" "main" {
  count = var.cdn_domain != "" && var.route53_zone_id != "" ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_s3_bucket.data.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.data.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  aliases = var.cdn_domain != "" ? [var.cdn_domain] : []

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.data.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.cdn_domain != "" ? aws_acm_certificate.main[0].arn : null
    ssl_support_method             = var.cdn_domain != "" ? "sni-only" : null
    minimum_protocol_version       = var.cdn_domain != "" ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.cdn_domain == "" ? true : null
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront"
  })

  depends_on = [aws_acm_certificate_validation.main]
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${local.name_prefix}-web-"
  description = "Security group for web servers"
  vpc_id      = var.vpc_id != "" ? var.vpc_id : null

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
    description = "HTTP access from approved CIDRs"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
    description = "HTTPS access from approved CIDRs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ssh" {
  name_prefix = "${local.name_prefix}-ssh-"
  description = "Security group for SSH access"
  vpc_id      = var.vpc_id != "" ? var.vpc_id : null

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
    description = "SSH access from approved CIDRs only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ssh-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-db-"
  description = "Security group for database access"
  vpc_id      = var.vpc_id != "" ? var.vpc_id : null

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
    description = "MySQL access from approved CIDRs only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# DB Subnet Group (only if VPC is provided)
resource "aws_db_subnet_group" "main" {
  count = var.vpc_id != "" ? 1 : 0

  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = data.aws_subnets.private[0].ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance (only if VPC is provided)
resource "aws_db_instance" "main" {
  count = var.vpc_id != "" ? 1 : 0

  identifier     = "${local.name_prefix}-rds"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "appdb"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring[0].arn

  publicly_accessible       = false
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-rds-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds"
  })
}

resource "aws_iam_role" "rds_monitoring" {
  count = var.vpc_id != "" ? 1 : 0
  name  = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.vpc_id != "" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# VPC Flow Logs (if VPC provided)
resource "aws_flow_log" "vpc" {
  count = var.vpc_id != "" ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.vpc_id != "" ? 1 : 0

  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_iam_role" "flow_logs" {
  count = var.vpc_id != "" ? 1 : 0
  name  = "${local.name_prefix}-flow-logs-role"

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

resource "aws_iam_role_policy" "flow_logs" {
  count = var.vpc_id != "" ? 1 : 0
  name  = "${local.name_prefix}-flow-logs-policy"
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
        Resource = "*"
      }
    ]
  })
}

# IAM Roles - Application
resource "aws_iam_role" "app_role" {
  name = "${local.name_prefix}-app-role"

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

resource "aws_iam_role_policy" "app_policy" {
  name = "${local.name_prefix}-app-policy"
  role = aws_iam_role.app_role.id

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
        Resource = "${aws_s3_bucket.data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.name_prefix}-app-profile"
  role = aws_iam_role.app_role.name

  tags = local.common_tags
}

# IAM Roles - Admin
resource "aws_iam_role" "admin_role" {
  name = "${local.name_prefix}-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${local.name_prefix}-admin-external-id"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "admin_policy" {
  name = "${local.name_prefix}-admin-policy"
  role = aws_iam_role.admin_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*",
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# CloudWatch Monitoring for IAM Policy Changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${local.name_prefix}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  pattern = "{ ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"

  metric_transformation {
    name      = "IAMPolicyChangeCount"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name              = "${local.name_prefix}-security-alarms"
  kms_master_key_id = aws_kms_key.main.id

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarm for IAM Policy Changes
resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${local.name_prefix}-iam-policy-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChangeCount"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This alarm monitors IAM policy changes"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# Outputs
output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.main.name
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "s3_logs_bucket_arn" {
  description = "ARN of the S3 logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = aws_s3_bucket.data.id
}

output "s3_data_bucket_arn" {
  description = "ARN of the S3 data bucket"
  value       = aws_s3_bucket.data.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = var.vpc_id != "" ? aws_db_instance.main[0].endpoint : null
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = var.vpc_id != "" ? aws_db_instance.main[0].arn : null
}

output "security_group_ids" {
  description = "Map of security group IDs"
  value = {
    web      = aws_security_group.web.id
    ssh      = aws_security_group.ssh.id
    database = aws_security_group.database.id
  }
}

output "iam_app_policy_json" {
  description = "JSON representation of the app IAM policy"
  value       = aws_iam_role_policy.app_policy.policy
}

output "iam_admin_policy_json" {
  description = "JSON representation of the admin IAM policy"
  value       = aws_iam_role_policy.admin_policy.policy
}

output "iam_app_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.app_role.arn
}

output "iam_admin_role_arn" {
  description = "ARN of the admin IAM role"
  value       = aws_iam_role.admin_role.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = var.cdn_domain != "" ? aws_acm_certificate.main[0].arn : null
}