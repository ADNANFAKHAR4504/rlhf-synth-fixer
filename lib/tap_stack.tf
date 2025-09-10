# Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "db_engine" {
  description = "RDS engine"
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.39"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "webapp"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  default     = "ChangeMe123!"
  sensitive   = true
}

variable "log_lifecycle_days" {
  description = "Days after which logs are deleted"
  type        = number
  default     = 90
}

variable "log_transition_days" {
  description = "Days after which logs transition to IA"
  type        = number
  default     = 30
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for CloudFront"
  type        = string
  default     = ""
}

variable "create_db_subnet_group" {
  description = "Whether to create a new DB subnet group (set to false if quota exceeded)"
  type        = bool
  default     = true
}

variable "existing_db_subnet_group" {
  description = "Name of existing DB subnet group to use if create_db_subnet_group is false"
  type        = string
  default     = ""
}

# Locals
locals {
  common_tags = {
    cost-center = "1234"
    Environment = "production"
    Project     = "tap-stack"
    ManagedBy   = "terraform"
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ssm_parameter" "amazon_linux_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# KMS Keys
resource "aws_kms_key" "logs_key" {
  description             = "KMS key for logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-west-2.amazonaws.com"
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
        Sid    = "AllowCloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "logs_key" {
  name          = "alias/tap-stack-logs-${random_id.bucket_suffix.hex}"
  target_key_id = aws_kms_key.logs_key.key_id
}

resource "aws_kms_key" "data_key" {
  description             = "KMS key for data encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowRDS"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "data_key" {
  name          = "alias/tap-stack-data-${random_id.bucket_suffix.hex}"
  target_key_id = aws_kms_key.data_key.key_id
}

# Using aws_caller_identity data source from backend.tf

# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "tap-stack-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "tap-stack-igw"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "tap-stack-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "tap-stack-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_eip" "nat" {
  count  = length(aws_subnet.public)
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "tap-stack-eip-nat-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(aws_subnet.public)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "tap-stack-nat-${count.index + 1}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-private-rt-${count.index + 1}"
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

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "tap-stack-alb-"
  vpc_id      = aws_vpc.main.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app" {
  name_prefix = "tap-stack-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "tap-stack-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket        = "tap-stack-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = local.common_tags
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
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
      kms_master_key_id = aws_kms_key.logs_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.log_transition_days
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.log_lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

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
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/vpc-flow-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
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
      },
      {
        Sid    = "ALBLogDelivery"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
      },
      {
        Sid    = "CloudFrontLogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudfront-logs/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      },
      {
        Sid    = "CloudTrailLogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-west-2:${data.aws_caller_identity.current.account_id}:trail/tap-stack-cloudtrail-${random_id.bucket_suffix.hex}"
          }
        }
      },
      {
        Sid    = "CloudTrailBucketCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-west-2:${data.aws_caller_identity.current.account_id}:trail/tap-stack-cloudtrail-${random_id.bucket_suffix.hex}"
          }
        }
      },
      {
        Sid    = "ConfigLogDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "ConfigLogDeliveryPut"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/config-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "tap-stack-ec2-role-${random_id.bucket_suffix.hex}"

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

resource "aws_iam_role_policy" "ec2_policy" {
  name = "tap-stack-ec2-policy-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/tap-stack/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "tap-stack-ec2-profile-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "tap-stack-lt-"
  image_id      = data.aws_ssm_parameter.amazon_linux_ami.value
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from TAP Stack $(hostname -f)</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "tap-stack-instance"
    })
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "tap-stack-asg-${random_id.bucket_suffix.hex}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "tap-stack-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "tap-stack-scale-up-${random_id.bucket_suffix.hex}"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.main.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.target_cpu_utilization
  }
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "tap-stack-scale-down-${random_id.bucket_suffix.hex}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "tap-stack-alb-${random_id.bucket_suffix.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "main" {
  name     = "tap-stack-tg-${random_id.bucket_suffix.hex}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = local.common_tags

  depends_on = [aws_acm_certificate.main]
}

# ACM Certificate for ALB (dummy certificate for testing)
resource "aws_acm_certificate" "main" {
  domain_name       = "example.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs"
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"

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
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn == "" ? null : var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == "" ? null : "sni-only"
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = local.common_tags
}

# WAF v2
resource "aws_wafv2_web_acl" "main" {
  name  = "tap-stack-waf-${random_id.bucket_suffix.hex}"
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
      metric_name                = "CommonRuleSetMetric"
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
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "TapStackWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  count      = var.create_db_subnet_group ? 1 : 0
  name       = "tap-stack-db-subnet-group-${random_id.bucket_suffix.hex}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "tap-stack-db-subnet-group"
  })
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "tap-stack-db-params-${random_id.bucket_suffix.hex}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  tags = local.common_tags
}

# RDS Primary Instance
resource "aws_db_instance" "main" {
  identifier     = "tap-stack-db-primary-${random_id.bucket_suffix.hex}"
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.data_key.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.create_db_subnet_group ? aws_db_subnet_group.main[0].name : var.existing_db_subnet_group
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  multi_az = true

  performance_insights_enabled = true

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "tap-stack-db-primary"
  })
}

# RDS Read Replica
resource "aws_db_instance" "read_replica" {
  identifier                 = "tap-stack-db-replica-${random_id.bucket_suffix.hex}"
  replicate_source_db        = aws_db_instance.main.identifier
  instance_class             = var.db_instance_class
  publicly_accessible        = false
  auto_minor_version_upgrade = true

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = merge(local.common_tags, {
    Name = "tap-stack-db-replica"
  })
}

# RDS Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "tap-stack-rds-monitoring-role-${random_id.bucket_suffix.hex}"

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
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${random_id.bucket_suffix.hex}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.logs_key.arn

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = local.common_tags
}

resource "aws_iam_role" "flow_logs" {
  name = "tap-stack-flow-logs-role-${random_id.bucket_suffix.hex}"

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
  name = "tap-stack-flow-logs-policy-${random_id.bucket_suffix.hex}"
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
        Resource = "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
      }
    ]
  })
}

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
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/tap-stack-${random_id.bucket_suffix.hex}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.logs_key.arn

  tags = local.common_tags
}

resource "aws_cloudtrail" "main" {
  name                       = "tap-stack-cloudtrail-${random_id.bucket_suffix.hex}"
  s3_bucket_name             = aws_s3_bucket.logs.bucket
  s3_key_prefix              = "cloudtrail-logs"
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  kms_key_id = aws_kms_key.logs_key.arn

  enable_log_file_validation    = true
  include_global_service_events = true
  is_multi_region_trail         = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logs.arn}/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = [aws_lambda_function.sample.arn]
    }
  }

  tags = local.common_tags
}

resource "aws_iam_role" "cloudtrail" {
  name = "tap-stack-cloudtrail-role-${random_id.bucket_suffix.hex}"

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
  name = "tap-stack-cloudtrail-policy-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# AWS Config
resource "aws_config_configuration_recorder" "main" {
  name     = "tap-stack-config-recorder-${random_id.bucket_suffix.hex}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_iam_role_policy_attachment.config]
}

# Note: AWS Config delivery channel commented out due to regional limit (max 1 per region)
# Uncomment if you don't have an existing delivery channel in this region
# resource "aws_config_delivery_channel" "main" {
#   name           = "tap-stack-config-delivery-channel"
#   s3_bucket_name = aws_s3_bucket.logs.bucket
#   s3_key_prefix  = "config-logs"
# }

resource "aws_iam_role" "config" {
  name = "tap-stack-config-role-${random_id.bucket_suffix.hex}"

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

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "tap-stack-config-s3-policy-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/config-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Rules
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled-${random_id.bucket_suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

resource "aws_config_config_rule" "s3_encryption" {
  name = "s3-bucket-server-side-encryption-enabled-${random_id.bucket_suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes-${random_id.bucket_suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

resource "aws_config_config_rule" "restricted_ssh" {
  name = "incoming-ssh-disabled-${random_id.bucket_suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "tap-stack-alerts-${random_id.bucket_suffix.hex}"
  kms_master_key_id = aws_kms_key.logs_key.arn

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "asg_cpu_high" {
  alarm_name          = "tap-stack-asg-cpu-high-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn, aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "asg_cpu_low" {
  alarm_name          = "tap-stack-asg-cpu-low-${random_id.bucket_suffix.hex}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "tap-stack-alb-5xx-errors-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "tap-stack-alb-response-time-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "tap-stack-rds-cpu-high-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "tap-stack-rds-free-storage-low-${random_id.bucket_suffix.hex}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# Lambda Function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "sample_lambda.zip"
  source {
    content  = <<EOF
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Process SNS message
    if 'Records' in event:
        for record in event['Records']:
            if record.get('EventSource') == 'aws:sns':
                message = record['Sns']['Message']
                logger.info(f"Processing SNS message: {message}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from TAP Stack Lambda!')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "sample" {
  filename         = "sample_lambda.zip"
  function_name    = "tap-stack-sample-function-${random_id.bucket_suffix.hex}"
  role             = aws_iam_role.lambda.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/tap-stack-sample-function-${random_id.bucket_suffix.hex}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.logs_key.arn

  tags = local.common_tags
}

resource "aws_iam_role" "lambda" {
  name = "tap-stack-lambda-role-${random_id.bucket_suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda.name
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "tap-stack-lambda-policy-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.lambda.id

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
        Resource = "${aws_cloudwatch_log_group.lambda_logs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.logs_key.arn,
          aws_kms_key.data_key.arn
        ]
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.sample.arn
}

resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sample.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "cloudfront_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_replica_endpoint" {
  description = "RDS read replica endpoint"
  value       = aws_db_instance.read_replica.endpoint
}

output "logs_bucket" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "logs_kms_key_arn" {
  description = "ARN of the KMS key for logs"
  value       = aws_kms_key.logs_key.arn
}

output "data_kms_key_arn" {
  description = "ARN of the KMS key for data"
  value       = aws_kms_key.data_key.arn
}

output "lambda_function_name" {
  description = "Name of the sample Lambda function"
  value       = aws_lambda_function.sample.function_name
}

output "lambda_function_arn" {
  description = "ARN of the sample Lambda function"
  value       = aws_lambda_function.sample.arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_app_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}