# Secure AWS Infrastructure with Terraform
# Region: us-west-2
# All security best practices implemented

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# KMS KEYS
# =============================================================================

# KMS key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
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
        Sid    = "Allow use of the key for S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "S3 Encryption Key"
    Environment = "production"
  }
}

# KMS key alias for S3
resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/s3-encryption-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3_key.key_id
}

# KMS key for VPC Flow Logs
resource "aws_kms_key" "flow_logs_key" {
  description             = "KMS key for VPC Flow Logs encryption"
  deletion_window_in_days = 7
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
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "VPC Flow Logs Encryption Key"
    Environment = "production"
  }
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "secure-vpc"
    Environment = "production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "secure-igw"
    Environment = "production"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "secure-public-subnet-${count.index + 1}"
    Environment = "production"
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "secure-private-subnet-${count.index + 1}"
    Environment = "production"
    Type        = "private"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "secure-public-rt"
    Environment = "production"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Security Group for Web Servers (only ports 80 and 443)
resource "aws_security_group" "web_sg" {
  name_prefix = "secure-web-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers - only HTTP and HTTPS"

  # HTTP inbound
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS inbound
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "secure-web-sg"
    Environment = "production"
  }
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2_sg" {
  name_prefix = "secure-ec2-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  # Allow traffic from web security group
  ingress {
    description     = "Traffic from web security group"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  ingress {
    description     = "HTTPS from web security group"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "secure-ec2-sg"
    Environment = "production"
  }
}

# =============================================================================
# IAM POLICIES AND ROLES
# =============================================================================

# IAM policy for MFA enforcement
resource "aws_iam_policy" "mfa_policy" {
  name        = "MFAEnforcementPolicy-${var.environment_suffix}-1"
  description = "Policy to enforce MFA for all users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "MFA Enforcement Policy"
    Environment = "production"
  }
}

# IAM policy for IP restriction
resource "aws_iam_policy" "ip_restriction_policy" {
  name        = "IPRestrictionPolicy-${var.environment_suffix}"
  description = "Policy to restrict access based on IP address"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowFromSpecificIPs"
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = [
              "52.200.0.0/24", # Production office network
              "34.195.0.0/24"  # Production VPN network
            ]
          }
        }
      },
      {
        Sid      = "DenyFromOtherIPs"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          IpAddressIfExists = {
            "aws:SourceIp" = "0.0.0.0/0"
          }
          StringNotEquals = {
            "aws:SourceIp" = [
              "52.200.0.0/24", # Production office network
              "34.195.0.0/24"  # Production VPN network
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name        = "IP Restriction Policy"
    Environment = "production"
  }
}

# IAM role for EC2 instances to access S3
resource "aws_iam_role" "ec2_s3_role" {
  name = "EC2S3AccessRole-${var.environment_suffix}"

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

  tags = {
    Name        = "EC2 S3 Access Role"
    Environment = "production"
  }
}

# IAM policy for S3 access from EC2
resource "aws_iam_policy" "ec2_s3_policy" {
  name        = "EC2S3AccessPolicy-${var.environment_suffix}"
  description = "Policy for EC2 instances to access S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.content_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.content_bucket.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_key.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "EC2 S3 Access Policy"
    Environment = "production"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_s3_policy_attachment" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.ec2_s3_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-s3-access-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_s3_role.name

  tags = {
    Name        = "EC2 S3 Access Profile"
    Environment = "production"
  }
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# S3 bucket for content (to be served via CloudFront)
resource "aws_s3_bucket" "content_bucket" {
  bucket = "secure-content-bucket-${var.environment_suffix}"

  tags = {
    Name        = "Secure Content Bucket"
    Environment = "production"
    Purpose     = "cloudfront-content"
  }
}

# S3 bucket versioning for content bucket
resource "aws_s3_bucket_versioning" "content_bucket" {
  bucket = aws_s3_bucket.content_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption for content bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "content_bucket" {
  bucket = aws_s3_bucket.content_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block public access to content bucket
resource "aws_s3_bucket_public_access_block" "content_bucket" {
  bucket = aws_s3_bucket.content_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "content_bucket_policy" {
  bucket     = aws_s3_bucket.content_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.content_bucket]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.content_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.content_distribution.arn
          }
        }
      }
    ]
  })
}

# Sample content for the S3 bucket
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.content_bucket.id
  key          = "index.html"
  content_type = "text/html"

  content = <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Secure AWS Infrastructure</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #232f3e; }
        .feature { margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #0073bb; }
        .security-badge { display: inline-block; background-color: #28a745; color: white; padding: 5px 10px; border-radius: 4px; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Secure AWS Infrastructure Deployed Successfully!</h1>
        
        <div class="feature">
            <h3>Security Features Implemented:</h3>
            <div class="security-badge">✅ VPC with Security Groups (HTTP/HTTPS only)</div>
            <div class="security-badge">✅ IAM MFA Enforcement</div>
            <div class="security-badge">✅ S3 KMS Encryption</div>
            <div class="security-badge">✅ IAM Roles for EC2-S3 Access</div>
            <div class="security-badge">✅ CloudFront Distribution</div>
            <div class="security-badge">✅ VPC Flow Logs</div>
            <div class="security-badge">✅ IP Address Restrictions</div>
            <div class="security-badge">✅ WAF Protection</div>
        </div>
        
        <div class="feature">
            <h3>Architecture Overview:</h3>
            <ul>
                <li><strong>Region:</strong> us-west-2</li>
                <li><strong>VPC:</strong> Secure networking with public/private subnets</li>
                <li><strong>Security Groups:</strong> Restricted to ports 80 and 443 only</li>
                <li><strong>S3:</strong> Encrypted with AWS KMS, served via CloudFront</li>
                <li><strong>IAM:</strong> MFA required, IP-based access control</li>
                <li><strong>Monitoring:</strong> VPC Flow Logs with CloudWatch</li>
            </ul>
        </div>
        
        <p><em>This content is served securely through AWS CloudFront from an encrypted S3 bucket using Infrastructure as Code with Terraform.</em></p>
    </div>
</body>
</html>
EOF

  tags = {
    Name        = "Sample Index Page"
    Environment = "production"
  }
}

# =============================================================================
# CLOUDFRONT DISTRIBUTION
# =============================================================================

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "content_oac" {
  name                              = "secure-content-oac"
  description                       = "OAC for secure content bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "content_distribution" {
  origin {
    domain_name              = aws_s3_bucket.content_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.content_oac.id
    origin_id                = "S3-${aws_s3_bucket.content_bucket.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.content_bucket.id}"
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
    cloudfront_default_certificate = true
  }

  web_acl_id = aws_wafv2_web_acl.cloudfront_waf.arn

  tags = {
    Name        = "Secure Content Distribution"
    Environment = "production"
  }
}

# =============================================================================
# WAF FOR CLOUDFRONT
# =============================================================================

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "cloudfront_waf" {
  provider = aws.us_east_1
  name     = "cloudfront-security-waf"
  scope    = "CLOUDFRONT"

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
    metric_name                = "CloudFrontWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "CloudFront Security WAF"
    Environment = "production"
  }
}

# =============================================================================
# VPC FLOW LOGS
# =============================================================================

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.flow_logs_key.arn

  tags = {
    Name        = "VPC Flow Logs"
    Environment = "production"
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs_role" {
  name = "VPCFlowLogsRole-${var.environment_suffix}"

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

  tags = {
    Name        = "VPC Flow Logs Role"
    Environment = "production"
  }
}

# IAM policy for VPC Flow Logs
resource "aws_iam_policy" "flow_logs_policy" {
  name        = "VPCFlowLogsPolicy-${var.environment_suffix}"
  description = "Policy for VPC Flow Logs to write to CloudWatch"

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

  tags = {
    Name        = "VPC Flow Logs Policy"
    Environment = "production"
  }
}

# Attach policy to flow logs role
resource "aws_iam_role_policy_attachment" "flow_logs_policy_attachment" {
  role       = aws_iam_role.flow_logs_role.name
  policy_arn = aws_iam_policy.flow_logs_policy.arn
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name        = "VPC Flow Logs"
    Environment = "production"
  }
}

# =============================================================================
# SAMPLE EC2 INSTANCE (OPTIONAL)
# =============================================================================

# Data source for Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 instance
resource "aws_instance" "web_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data_base64 = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Secure Web Server</h1>" > /var/www/html/index.html
    echo "<p>This server can securely access S3 using IAM roles.</p>" >> /var/www/html/index.html
  EOF
  )

  tags = {
    Name        = "secure-web-server"
    Environment = "production"
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

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

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_sg.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_sg.id
}

output "s3_content_bucket_name" {
  description = "Name of the S3 content bucket"
  value       = aws_s3_bucket.content_bucket.bucket
}

output "s3_content_bucket_arn" {
  description = "ARN of the S3 content bucket"
  value       = aws_s3_bucket.content_bucket.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.content_distribution.id
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.content_distribution.domain_name
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web_server.id
}

output "ec2_instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web_server.public_ip
}

output "kms_s3_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_key.key_id
}

output "flow_logs_log_group_name" {
  description = "Name of the CloudWatch log group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}