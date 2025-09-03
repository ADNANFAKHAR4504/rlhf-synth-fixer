# Local values for consistent resource naming
locals {
  deployment_suffix = var.deployment_id != null ? var.deployment_id : random_id.resource_suffix.hex
  base_name         = "${var.project_name}-${var.environment_suffix}"
}

# Data source for latest Amazon Linux 2 AMI
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

# Data source for current caller identity
data "aws_caller_identity" "current" {}

# S3 Bucket with encryption
resource "aws_s3_bucket" "main_bucket" {
  bucket = "${lower(var.project_name)}-${var.environment_suffix}-s3bucket-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${local.base_name}-s3bucket"
    Environment = var.environment
    Purpose     = "CloudFront Origin"
  }
}

# Random suffix for unique resource naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "random_id" "resource_suffix" {
  byte_length = 3
  keepers = {
    # Generate new ID when deployment timestamp changes
    timestamp = timestamp()
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main_bucket_encryption" {
  bucket = aws_s3_bucket.main_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "main_bucket_pab" {
  bucket = aws_s3_bucket.main_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "main_bucket_versioning" {
  bucket = aws_s3_bucket.main_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "main_bucket_policy" {
  bucket = aws_s3_bucket.main_bucket.id

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
        Resource = "${aws_s3_bucket.main_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main_distribution.arn
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.main_bucket_pab,
    aws_cloudfront_distribution.main_distribution
  ]
}

# CloudFront Origin Access Control with unique suffix
resource "aws_cloudfront_origin_access_control" "main_oac" {
  name                              = "${local.base_name}-oac-${local.deployment_suffix}"
  description                       = "OAC for ${local.base_name} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main_distribution" {
  origin {
    domain_name              = aws_s3_bucket.main_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main_oac.id
    origin_id                = "S3-${aws_s3_bucket.main_bucket.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Enable Shield Standard (automatically enabled, no additional cost)
  web_acl_id = ""

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.main_bucket.bucket}"

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
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${local.base_name}-distribution"
    Environment = var.environment
  }
}

# IAM Role for EC2 instance with unique suffix
resource "aws_iam_role" "ec2_s3_role" {
  name = "${local.base_name}-ec2-s3-role-${local.deployment_suffix}"

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
    Name        = "${local.base_name}-ec2-s3-role-${local.deployment_suffix}"
    Environment = var.environment
  }
}

# IAM Policy for S3 access (least privilege) with unique suffix
resource "aws_iam_policy" "ec2_s3_policy" {
  name        = "${local.base_name}-ec2-s3-policy-${local.deployment_suffix}"
  description = "Policy allowing EC2 to access specific S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main_bucket.arn,
          "${aws_s3_bucket.main_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_s3_policy_attachment" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.ec2_s3_policy.arn
}

# Instance profile for EC2 with unique suffix
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.base_name}-ec2-profile-${local.deployment_suffix}"
  role = aws_iam_role.ec2_s3_role.name
}

# Security Group for EC2 with unique suffix
resource "aws_security_group" "ec2_sg" {
  name        = "${local.base_name}-webserver-sg-${local.deployment_suffix}"
  description = "Security group for web server"

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ip_ranges
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ip_ranges
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"] # Restrict SSH to private networks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.base_name}-webserver-sg-${local.deployment_suffix}"
    Environment = var.environment
  }
}

# EC2 Instance with encrypted EBS
resource "aws_instance" "webserver" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  security_groups      = [aws_security_group.ec2_sg.name]

  # Enable EBS encryption
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    encrypted             = true
    delete_on_termination = true
  }

  # User data script to install and configure web server
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd aws-cli
    systemctl start httpd
    systemctl enable httpd
    
    # Create a simple index.html
    cat << HTML > /var/www/html/index.html
    <html>
    <head><title>Secure Infrastructure</title></head>
    <body>
    <h1>Welcome to ${local.base_name}</h1>
    <p>This is a secure infrastructure deployed with Terraform</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    </body>
    </html>
HTML

    # Set proper permissions
    chown apache:apache /var/www/html/index.html
    chmod 644 /var/www/html/index.html
  EOF
  )

  tags = {
    Name        = "${local.base_name}-webserver"
    Environment = var.environment
  }

  # Ensure the instance is created after the IAM role is ready
  depends_on = [
    aws_iam_role_policy_attachment.ec2_s3_policy_attachment
  ]
}

# Upload a sample file to S3 for CloudFront testing
resource "aws_s3_object" "sample_content" {
  bucket       = aws_s3_bucket.main_bucket.id
  key          = "index.html"
  content      = "<html><body><h1>Hello from CloudFront!</h1><p>This content is served securely via CloudFront with OAC.</p></body></html>"
  content_type = "text/html"

  server_side_encryption = "AES256"

  tags = {
    Name        = "Sample Content"
    Environment = var.environment
  }
}
