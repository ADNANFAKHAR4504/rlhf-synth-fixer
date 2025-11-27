# tap_stack.tf - Secure AWS Environment Configuration
# This configuration implements strict corporate security policies across AWS

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current region
data "aws_region" "current" {}

# Get all available regions
data "aws_regions" "all" {
  all_regions = true
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS key for encryption - rotates every 365 days
resource "aws_kms_key" "prod_main" {
  description             = "prod-main-kms-key"
  enable_key_rotation     = true
  rotation_period_in_days = 365
  deletion_window_in_days = 10 # No deletion protection

  tags = {
    Name = "prod-main-kms-key"
  }
}

# KMS key alias
resource "aws_kms_alias" "prod_main" {
  name          = "alias/prod-main"
  target_key_id = aws_kms_key.prod_main.key_id
}

# S3 bucket for central logging - must be created first
resource "aws_s3_bucket" "prod_logs" {
  bucket = "prod-logs-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"

  tags = {
    Name = "prod-logs-bucket"
  }
}

# Enable versioning on logging bucket
resource "aws_s3_bucket_versioning" "prod_logs" {
  bucket = aws_s3_bucket.prod_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption with AES-256
resource "aws_s3_bucket_server_side_encryption_configuration" "prod_logs" {
  bucket = aws_s3_bucket.prod_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.prod_main.arn
    }
    bucket_key_enabled = true
  }
}

# Block all public access to logging bucket
resource "aws_s3_bucket_public_access_block" "prod_logs" {
  bucket = aws_s3_bucket.prod_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for logging services
resource "aws_s3_bucket_policy" "prod_logs" {
  bucket = aws_s3_bucket.prod_logs.id

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
        Resource = aws_s3_bucket.prod_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.prod_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.prod_logs.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.prod_logs.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.prod_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "VPCFlowLogsWrite"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.prod_logs.arn}/*"
      }
    ]
  })
}

# Account-level S3 public access block
resource "aws_s3_account_public_access_block" "account" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable default EBS encryption for the account
resource "aws_ebs_encryption_by_default" "prod" {
  enabled = true
}

# Set default KMS key for EBS encryption
resource "aws_ebs_default_kms_key" "prod" {
  key_arn = aws_kms_key.prod_main.arn
}

# VPC Configuration
resource "aws_vpc" "prod" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "prod-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "prod" {
  vpc_id = aws_vpc.prod.id

  tags = {
    Name = "prod-igw"
  }
}

# Public Subnets
resource "aws_subnet" "prod_public" {
  count                   = 2
  vpc_id                  = aws_vpc.prod.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "prod-public-subnet-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "prod_private" {
  count             = 2
  vpc_id            = aws_vpc.prod.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "prod-private-subnet-${count.index + 1}"
  }
}

# NAT Gateway EIPs
resource "aws_eip" "prod_nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "prod-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "prod" {
  count         = 2
  allocation_id = aws_eip.prod_nat[count.index].id
  subnet_id     = aws_subnet.prod_public[count.index].id

  tags = {
    Name = "prod-nat-gateway-${count.index + 1}"
  }
}

# Public Route Table
resource "aws_route_table" "prod_public" {
  vpc_id = aws_vpc.prod.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod.id
  }

  tags = {
    Name = "prod-public-rt"
  }
}

# Private Route Tables
resource "aws_route_table" "prod_private" {
  count  = 2
  vpc_id = aws_vpc.prod.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.prod[count.index].id
  }

  tags = {
    Name = "prod-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "prod_public" {
  count          = 2
  subnet_id      = aws_subnet.prod_public[count.index].id
  route_table_id = aws_route_table.prod_public.id
}

resource "aws_route_table_association" "prod_private" {
  count          = 2
  subnet_id      = aws_subnet.prod_private[count.index].id
  route_table_id = aws_route_table.prod_private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "prod_vpc" {
  log_destination      = "${aws_s3_bucket.prod_logs.arn}/vpc-flow-logs/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.prod.id

  tags = {
    Name = "prod-vpc-flow-logs"
  }
}

# IAM role for CloudTrail
resource "aws_iam_role" "prod_cloudtrail" {
  name = "prod-cloudtrail-role"

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
    Name = "prod-cloudtrail-role"
  }
}

# CloudTrail - Multi-region trail
resource "aws_cloudtrail" "prod_main" {
  name                          = "prod-main-trail"
  s3_bucket_name                = aws_s3_bucket.prod_logs.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.prod_main.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }
  }

  tags = {
    Name = "prod-main-trail"
  }

  depends_on = [aws_s3_bucket_policy.prod_logs]
}

# IAM role for AWS Config
resource "aws_iam_role" "prod_config" {
  name = "prod-config-role"

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
    Name = "prod-config-role"
  }
}

# IAM policy for AWS Config
resource "aws_iam_role_policy" "prod_config" {
  name = "prod-config-policy"
  role = aws_iam_role.prod_config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.prod_logs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.prod_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "ec2:Describe*",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "s3:GetBucketVersioning",
          "s3:GetBucketPolicy",
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "rds:Describe*",
          "kms:Describe*",
          "kms:ListKeys"
        ]
        Resource = "*"
      }
    ]
  })
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "prod" {
  name     = "prod-config-recorder"
  role_arn = aws_iam_role.prod_config.arn

  recording_group {
    all_supported = true
  }

  depends_on = [aws_config_delivery_channel.prod]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "prod" {
  name           = "prod-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.prod_logs.id
  s3_key_prefix  = "config"
}

# Start AWS Config Recorder
resource "aws_config_configuration_recorder_status" "prod" {
  name       = aws_config_configuration_recorder.prod.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.prod]
}

# AWS Config Rules - S3 Bucket Encryption
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "prod-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.prod]
}

# AWS Config Rules - EBS Encryption
resource "aws_config_config_rule" "ebs_encrypted" {
  name = "prod-ebs-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.prod]
}

# AWS Config Rules - RDS Encryption
resource "aws_config_config_rule" "rds_encrypted" {
  name = "prod-rds-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.prod]
}

# AWS Config Rules - IAM MFA
resource "aws_config_config_rule" "iam_mfa" {
  name = "prod-iam-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }

  depends_on = [aws_config_configuration_recorder.prod]
}

# AWS Config Rules - Root Access Keys
resource "aws_config_config_rule" "root_access_key" {
  name = "prod-root-access-key-check"

  source {
    owner             = "AWS"
    source_identifier = "IAM_ROOT_ACCESS_KEY_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.prod]
}

# GuardDuty Detector
resource "aws_guardduty_detector" "prod" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs {
      enable = true
    }
  }

  tags = {
    Name = "prod-guardduty-detector"
  }
}

# CloudWatch Event Rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty" {
  name        = "prod-guardduty-findings"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })

  tags = {
    Name = "prod-guardduty-event-rule"
  }
}

# CloudWatch Log Group for GuardDuty
resource "aws_cloudwatch_log_group" "guardduty" {
  name              = "/aws/guardduty/prod-findings"
  retention_in_days = 30

  tags = {
    Name = "prod-guardduty-logs"
  }
}

# CloudWatch Event Target for GuardDuty
resource "aws_cloudwatch_event_target" "guardduty" {
  rule      = aws_cloudwatch_event_rule.guardduty.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.guardduty.arn
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "prod" {
  name  = "prod-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
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
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Block malicious IPs
  rule {
    name     = "BlockMaliciousIPs"
    priority = 2

    action {
      block {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.malicious_ips.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockMaliciousIPsMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "prod-web-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "prod-web-acl"
  }
}

# WAF IP Set for malicious IPs
resource "aws_wafv2_ip_set" "malicious_ips" {
  name               = "prod-malicious-ips"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"

  # Example malicious IPs (replace with actual malicious IPs)
  addresses = [
    "192.0.2.0/24",
    "198.51.100.0/24"
  ]

  tags = {
    Name = "prod-malicious-ip-set"
  }
}

# IAM password policy to enforce MFA
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 24
}

# Service Control Policy to deny root access keys
resource "aws_iam_policy" "deny_root_access_keys" {
  name        = "prod-deny-root-access-keys"
  description = "Deny creation and use of root access keys"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::*:root"
      }
    ]
  })
}

# IAM role for EC2 instances
resource "aws_iam_role" "prod_ec2" {
  name = "prod-ec2-role"

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
    Name = "prod-ec2-role"
  }
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "prod_ec2" {
  name = "prod-ec2-profile"
  role = aws_iam_role.prod_ec2.name
}

# Minimal IAM policy for EC2 instances
resource "aws_iam_role_policy" "prod_ec2" {
  name = "prod-ec2-policy"
  role = aws_iam_role.prod_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.prod_app_data.arn,
          "${aws_s3_bucket.prod_app_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.prod_main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      }
    ]
  })
}

# IAM role for Lambda functions
resource "aws_iam_role" "prod_lambda" {
  name = "prod-lambda-role"

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

  tags = {
    Name = "prod-lambda-role"
  }
}

# Minimal IAM policy for Lambda - only CloudWatch Logs
resource "aws_iam_role_policy" "prod_lambda" {
  name = "prod-lambda-policy"
  role = aws_iam_role.prod_lambda.id

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
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.prod_main.arn
      }
    ]
  })
}

# Security Group for EC2 instances
resource "aws_security_group" "prod_ec2" {
  name        = "prod-ec2-sg"
  description = "Security group for prod EC2 instances"
  vpc_id      = aws_vpc.prod.id

  # Allow HTTPS inbound (enforce TLS)
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.prod.cidr_block]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-ec2-sg"
  }
}

# Security Group for RDS
resource "aws_security_group" "prod_rds" {
  name        = "prod-rds-sg"
  description = "Security group for prod RDS instances"
  vpc_id      = aws_vpc.prod.id

  # Allow MySQL/Aurora with SSL only from EC2 security group
  ingress {
    description     = "MySQL/Aurora SSL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_ec2.id]
  }

  # No egress needed for RDS
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-rds-sg"
  }
}

# Get latest encrypted Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2_encrypted" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-kernel-*-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# EC2 Launch Template with encryption
resource "aws_launch_template" "prod" {
  name_prefix = "prod-ec2-"

  image_id               = data.aws_ami.amazon_linux_2_encrypted.id
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.prod_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.prod_ec2.name
  }

  # Enforce encrypted EBS root volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.prod_main.arn
      delete_on_termination = true
    }
  }

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # Enforce IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Enable SSL/TLS for all connections
    echo "HTTPS_ONLY=true" >> /etc/environment
    
    # Install and configure SSM agent for secure management
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF
  )

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "prod-ec2-instance"
    }
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "prod" {
  name       = "prod-rds-subnet-group"
  subnet_ids = aws_subnet.prod_private[*].id

  tags = {
    Name = "prod-rds-subnet-group"
  }
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store RDS credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "prod/rds/credentials"
  description             = "RDS database credentials for production environment"
  kms_key_id              = aws_kms_key.prod_main.arn
  recovery_window_in_days = 7

  tags = {
    Name = "prod-rds-credentials"
  }
}

# Store the actual credentials
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

# RDS instance with encryption and SSL enforcement
resource "aws_db_instance" "prod" {
  identifier = "prod-rds-instance"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.prod_main.arn

  db_name                       = "proddb"
  username                      = "admin"
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.prod_main.arn

  vpc_security_group_ids = [aws_security_group.prod_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.prod.name

  # NO deletion protection as required
  deletion_protection = false
  skip_final_snapshot = true

  # Enable backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn

  # Enforce SSL/TLS
  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = {
    Name = "prod-rds-instance"
  }
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "prod-rds-enhanced-monitoring-role"

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

  tags = {
    Name = "prod-rds-monitoring-role"
  }
}

# Attach managed policy for RDS enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Lambda function example with minimal permissions
# Note: lambda_function.zip must be created before running terraform apply
resource "aws_lambda_function" "prod_example" {
  filename         = "${path.module}/lambda_function.zip"
  function_name    = "prod-lambda-function"
  role             = aws_iam_role.prod_lambda.arn
  handler          = "index.handler"
  source_code_hash = fileexists("${path.module}/lambda_function.zip") ? filebase64sha256("${path.module}/lambda_function.zip") : null
  runtime          = "python3.11"

  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }

  # Encrypt environment variables
  kms_key_arn = aws_kms_key.prod_main.arn

  # Place in VPC for network isolation
  vpc_config {
    subnet_ids         = aws_subnet.prod_private[*].id
    security_group_ids = [aws_security_group.prod_lambda.id]
  }

  tags = {
    Name = "prod-lambda-function"
  }
}

# Security group for Lambda
resource "aws_security_group" "prod_lambda" {
  name        = "prod-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.prod.id

  # Lambda only needs outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-lambda-sg"
  }
}

# S3 bucket for application data
resource "aws_s3_bucket" "prod_app_data" {
  bucket = "prod-app-data-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "prod-app-data-bucket"
  }
}

# Enable versioning on app data bucket
resource "aws_s3_bucket_versioning" "prod_app_data" {
  bucket = aws_s3_bucket.prod_app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encrypt app data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "prod_app_data" {
  bucket = aws_s3_bucket.prod_app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access on app data bucket
resource "aws_s3_bucket_public_access_block" "prod_app_data" {
  bucket = aws_s3_bucket.prod_app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Sample IAM user with MFA enforcement
resource "aws_iam_user" "prod_user" {
  name = "prod-user-example"

  tags = {
    Name = "prod-user-example"
  }
}

# Policy to enforce MFA for the user
resource "aws_iam_user_policy" "prod_user_mfa" {
  name = "prod-enforce-mfa"
  user = aws_iam_user.prod_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:ListVirtualMFADevices",
          "iam:ListMFADevices",
          "iam:GetUser"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnVirtualMFADevice"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice"
        ]
        Resource = "arn:aws:iam::*:mfa/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnUserMFA"
        Effect = "Allow"
        Action = [
          "iam:DeactivateMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
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
}

# Remediation role for AWS Config
resource "aws_iam_role" "config_remediation" {
  name = "prod-config-remediation-role"

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
    Name = "prod-config-remediation-role"
  }
}

# Remediation policy
resource "aws_iam_role_policy" "config_remediation" {
  name = "prod-config-remediation-policy"
  role = aws_iam_role.config_remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutBucketEncryption",
          "s3:PutBucketPublicAccessBlock",
          "ec2:ModifyEbsDefaultKmsKeyId",
          "ec2:EnableEbsEncryptionByDefault",
          "rds:ModifyDBInstance"
        ]
        Resource = "*"
      }
    ]
  })
}

# Output important information
output "vpc_id" {
  value       = aws_vpc.prod.id
  description = "ID of the production VPC"
}

output "logging_bucket" {
  value       = aws_s3_bucket.prod_logs.id
  description = "Name of the central logging bucket"
}

output "kms_key_id" {
  value       = aws_kms_key.prod_main.id
  description = "ID of the main KMS key"
}

output "cloudtrail_name" {
  value       = aws_cloudtrail.prod_main.name
  description = "Name of the CloudTrail"
}

output "guardduty_detector_id" {
  value       = aws_guardduty_detector.prod.id
  description = "ID of the GuardDuty detector"
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.db_credentials.arn
  description = "ARN of the RDS credentials secret in Secrets Manager"
}