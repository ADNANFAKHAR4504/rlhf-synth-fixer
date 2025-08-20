# Infrastructure as Code Solution

## Terraform Configuration Files


### compute.tf

```hcl
# Launch Template with encrypted EBS
resource "aws_launch_template" "main" {
  name_prefix   = "${var.resource_prefix}-${var.environment_suffix}-template"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [
    aws_security_group.web.id,
    aws_security_group.ssh.id
  ]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type           = "gp3"
      volume_size           = 20
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = var.enable_detailed_monitoring
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd amazon-cloudwatch-agent
              systemctl start httpd
              systemctl enable httpd
              echo "<html><body><h1>Hello from SecureTF</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html
              # Configure CloudWatch agent if config exists
              if [ -f /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json ]; then
                /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              fi
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.resource_prefix}-${var.environment_suffix}-instance"
    }
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-launch-template"
  }
}

# Random suffix for ASG to avoid naming conflicts
resource "random_string" "asg_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${var.resource_prefix}-${var.environment_suffix}-asg-${random_string.asg_suffix.result}"
  vpc_zone_identifier       = aws_subnet.public[*].id
  health_check_type         = "EC2"
  health_check_grace_period = 300
  wait_for_capacity_timeout = "15m"
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 1

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  timeouts {
    update = "20m"
  }

  tag {
    key                 = "Name"
    value               = "${var.resource_prefix}-${var.environment_suffix}-asg"
    propagate_at_launch = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Attach target group after ASG is healthy
resource "aws_autoscaling_attachment" "main" {
  autoscaling_group_name = aws_autoscaling_group.main.id
  lb_target_group_arn    = aws_lb_target_group.main.arn

  depends_on = [aws_autoscaling_group.main]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.resource_prefix}-${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name     = "${var.resource_prefix}-${var.environment_suffix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-target-group"
  }
}

# Self-signed certificate for HTTPS
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "main" {
  private_key_pem = tls_private_key.main.private_key_pem

  subject {
    common_name  = "securetf.local"
    organization = "SecureTF"
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "main" {
  private_key      = tls_private_key.main.private_key_pem
  certificate_body = tls_self_signed_cert.main.cert_pem

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-cert"
  }
}

resource "aws_lb_listener" "main" {
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
}
```


### iam.tf

```hcl
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.resource_prefix}-${var.environment_suffix}-ec2-role"

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
    Name = "${var.resource_prefix}-${var.environment_suffix}-ec2-role"
  }
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.resource_prefix}-${var.environment_suffix}-ec2-policy"
  description = "Least privilege policy for EC2 instances"

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  policy_arn = aws_iam_policy.ec2_policy.arn
  role       = aws_iam_role.ec2_role.name
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.resource_prefix}-${var.environment_suffix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name = "${var.resource_prefix}-${var.environment_suffix}-cloudtrail-role"

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

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-cloudtrail-role"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${var.resource_prefix}-${var.environment_suffix}-flow-log-role"

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
    Name = "${var.resource_prefix}-${var.environment_suffix}-flow-log-role"
  }
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.resource_prefix}-${var.environment_suffix}-flow-log-policy"
  role = aws_iam_role.flow_log.id

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

# IAM Role for Config
resource "aws_iam_role" "config_role" {
  name = "${var.resource_prefix}-${var.environment_suffix}-config-role"

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

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-config-role"
  }
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}
```


### monitoring.tf

```hcl
# CloudTrail for audit logging
# NOTE: Commented out due to AWS account limit (max 6 trails per region)
# resource "aws_cloudtrail" "main" {
#   depends_on = [aws_s3_bucket_policy.cloudtrail]
#
#   name           = "${var.resource_prefix}-${var.environment_suffix}-trail"
#   s3_bucket_name = aws_s3_bucket.cloudtrail.id
#
#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true
#
#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["${aws_s3_bucket.main.arn}/*"]
#     }
#   }
#
#   kms_key_id                    = aws_kms_key.main.arn
#   include_global_service_events = true
#   is_multi_region_trail         = true
#   enable_log_file_validation    = true
#
#   tags = {
#     Name = "${var.resource_prefix}-${var.environment_suffix}-cloudtrail"
#   }
# }

# Config configuration recorder
# NOTE: Commented out due to dependency issues with delivery channel
# resource "aws_config_configuration_recorder" "main" {
#   name     = "${var.resource_prefix}-${var.environment_suffix}-recorder"
#   role_arn = aws_iam_role.config_role.arn
#
#   recording_group {
#     all_supported                 = true
#     include_global_resource_types = true
#   }
#
#   depends_on = [aws_config_delivery_channel.main]
# }

# Config delivery channel
# resource "aws_config_delivery_channel" "main" {
#   name           = "${var.resource_prefix}-${var.environment_suffix}-delivery-channel"
#   s3_bucket_name = aws_s3_bucket.config.id
# }

# Config S3 bucket
resource "aws_s3_bucket" "config" {
  bucket        = "${lower(var.resource_prefix)}-${var.environment_suffix}-config-${random_string.config_suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-config-bucket"
  }
}

resource "random_string" "config_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
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
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
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

# resource "aws_config_configuration_recorder_status" "main" {
#   name       = aws_config_configuration_recorder.main.name
#   is_enabled = true
#   depends_on = [aws_config_delivery_channel.main]
# }
```


### outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

# output "cloudtrail_name" {
#   description = "Name of the CloudTrail"
#   value       = aws_cloudtrail.main.name
# }

# output "config_recorder_name" {
#   description = "Name of the Config recorder"
#   value       = aws_config_configuration_recorder.main.name
# }

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    web = aws_security_group.web.id
    ssh = aws_security_group.ssh.id
  }
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}
```


### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```


### security.tf

```hcl
# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.resource_prefix}-${var.environment_suffix} infrastructure encryption"
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
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.id}.amazonaws.com"
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
    Name = "${var.resource_prefix}-${var.environment_suffix}-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.resource_prefix}-${var.environment_suffix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "${var.resource_prefix}-${var.environment_suffix}-web-sg"
  description = "Security group for web servers with restricted access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-web-sg"
  }
}

resource "aws_security_group" "ssh" {
  name        = "${var.resource_prefix}-${var.environment_suffix}-ssh-sg"
  description = "Security group for SSH access with IP restrictions"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-ssh-sg"
  }
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-guardduty"
  }
}

# Security Hub
resource "aws_securityhub_account" "main" {
  enable_default_standards = true
}
```


### storage.tf

```hcl
# S3 Bucket for secure storage
resource "aws_s3_bucket" "main" {
  bucket = "${lower(var.resource_prefix)}-${var.environment_suffix}-secure-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.resource_prefix}-${var.environment_suffix}-secure-bucket"
    Environment = "production"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket encryption
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

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket logging
resource "aws_s3_bucket" "log_bucket" {
  bucket = "${lower(var.resource_prefix)}-${var.environment_suffix}-logs-${random_string.log_bucket_suffix.result}"

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-access-logs"
  }
}

resource "random_string" "log_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_bucket" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "log_bucket" {
  bucket = aws_s3_bucket.log_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "access-logs/"
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${lower(var.resource_prefix)}-${var.environment_suffix}-trail-${random_string.cloudtrail_suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-cloudtrail-bucket"
  }
}

resource "random_string" "cloudtrail_suffix" {
  length  = 8
  special = false
  upper   = false
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:trail/${var.resource_prefix}-${var.environment_suffix}-trail"
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:trail/${var.resource_prefix}-${var.environment_suffix}-trail"
          }
        }
      }
    ]
  })
}
```


### tap_stack.tf

```hcl
# Data sources for current account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get the latest Amazon Linux 2 AMI with encryption support
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

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-igw"
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-private-subnet-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-vpc-flow-log"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs/${var.resource_prefix}-${var.environment_suffix}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-vpc-flow-log-group"
  }
}
```


### variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "resource_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "SecureTF"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for inbound traffic"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for resources"
  type        = bool
  default     = true
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}
```
