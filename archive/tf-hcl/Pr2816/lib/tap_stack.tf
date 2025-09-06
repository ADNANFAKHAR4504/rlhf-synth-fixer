# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random ID for resource naming to avoid conflicts
resource "random_id" "resource_suffix" {
  byte_length = 4
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "${local.name_prefix} master key for encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-kms-${random_id.resource_suffix.hex}"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-sec-kms-${random_id.resource_suffix.hex}"
  target_key_id = aws_kms_key.main.key_id
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-igw"
  })
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-subnet-private-${count.index + 1}"
  })
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-subnet-public-${count.index + 1}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-rt-public"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

# S3 Buckets
resource "aws_s3_bucket" "app_content" {
  bucket = "${local.name_prefix}-app-content-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-content"
  })
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs"
  })
}

resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${local.name_prefix}-cloudfront-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront-logs"
  })
}

# S3 Bucket configurations
resource "aws_s3_bucket_server_side_encryption_configuration" "app_content" {
  bucket = aws_s3_bucket.app_content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_content" {
  bucket = aws_s3_bucket.app_content.id

  block_public_acls       = var.s3_block_public_access
  block_public_policy     = var.s3_block_public_access
  ignore_public_acls      = var.s3_block_public_access
  restrict_public_buckets = var.s3_block_public_access
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = var.s3_block_public_access
  block_public_policy     = var.s3_block_public_access
  ignore_public_acls      = var.s3_block_public_access
  restrict_public_buckets = var.s3_block_public_access
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = var.s3_block_public_access
  block_public_policy     = var.s3_block_public_access
  ignore_public_acls      = var.s3_block_public_access
  restrict_public_buckets = var.s3_block_public_access
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name_prefix}-oac-${random_id.resource_suffix.hex}"
  description                       = "OAC for ${local.name_prefix} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "app_content" {
  bucket = aws_s3_bucket.app_content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.app_content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# ACM Certificate for CloudFront
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = "${local.name_prefix}-${random_id.resource_suffix.hex}.example.com" # Updated with unique suffix
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-cert-${random_id.resource_suffix.hex}"
  })
}

# Note: For demo purposes, we'll skip automatic validation since we don't own the domain
# In production, you would add aws_acm_certificate_validation resource

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name              = aws_s3_bucket.app_content.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.app_content.bucket}"
  }

  enabled = true

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.app_content.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    # Use CloudFront default certificate for demo since we don't have a real domain
    cloudfront_default_certificate = true
    # For production with real domain, use:
    # acm_certificate_arn      = aws_acm_certificate.main.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-net-cloudfront"
  })
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-sec-sg-web"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.ip_allowlist
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.ip_allowlist
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ip_allowlist
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-sg-web"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-sec-sg-db"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from web tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-sg-db"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group-${random_id.resource_suffix.hex}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-${random_id.resource_suffix.hex}"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db-postgres"

  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "appdb"
  username = "dbadmin"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-postgres"
  })
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# IAM Role for EC2 instances (example workload role)
resource "aws_iam_role" "ec2_app_role" {
  name = "${local.name_prefix}-iam-role-ec2-app-${random_id.resource_suffix.hex}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-iam-role-ec2-app-${random_id.resource_suffix.hex}"
  })
}

# IAM Policy for application access (least privilege)
resource "aws_iam_policy" "app_s3_access" {
  name        = "${local.name_prefix}-iam-policy-app-s3-${random_id.resource_suffix.hex}"
  description = "Limited S3 access for application"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_content.arn}/*"
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-iam-policy-app-s3-${random_id.resource_suffix.hex}"
  })
}

resource "aws_iam_role_policy_attachment" "app_s3_access" {
  role       = aws_iam_role.ec2_app_role.name
  policy_arn = aws_iam_policy.app_s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_app_profile" {
  name = "${local.name_prefix}-iam-profile-ec2-app-${random_id.resource_suffix.hex}"
  role = aws_iam_role.ec2_app_role.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-iam-profile-ec2-app-${random_id.resource_suffix.hex}"
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-sec-cloudtrail"
  s3_bucket_name = aws_s3_bucket.logs.bucket

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-cloudtrail"
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}-${random_id.resource_suffix.hex}"
  retention_in_days = 30
  # Remove KMS key for now to fix the permission issue
  # kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-cloudtrail-logs-${random_id.resource_suffix.hex}"
  })
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  name = "${local.name_prefix}-iam-role-cloudtrail-${random_id.resource_suffix.hex}"

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
    Name = "${local.name_prefix}-iam-role-cloudtrail-${random_id.resource_suffix.hex}"
  })
}

resource "aws_iam_role_policy" "cloudtrail" {
  name = "${local.name_prefix}-iam-policy-cloudtrail-${random_id.resource_suffix.hex}"
  role = aws_iam_role.cloudtrail.id

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

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail" {
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
}

# CloudWatch Metric Filter for IAM Policy Changes
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${local.name_prefix}-sec-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "IAMPolicyChangeAttempts"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for IAM Policy Changes
resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${local.name_prefix}-sec-iam-policy-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChangeAttempts"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm for failed IAM policy change attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-alarm-iam"
  })
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-sec-alerts"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sec-alerts"
  })
}

resource "aws_sns_topic_subscription" "security_alerts" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "https"
  endpoint  = "https://example.com/webhook" # TODO: Replace with actual webhook endpoint
}

# Outputs
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_content_bucket" {
  description = "S3 bucket for application content"
  value       = aws_s3_bucket.app_content.bucket
}

output "logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "cloudfront_logs_bucket" {
  description = "S3 bucket for CloudFront logs"
  value       = aws_s3_bucket.cloudfront_logs.bucket
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.key_id
}