# Enterprise-grade secure AWS environment for web application
# Region: Configurable via var.aws_region (default: us-east-1)
# This configuration implements comprehensive security controls including encryption,
# monitoring, compliance, and threat detection

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Data source for current region
data "aws_region" "current" {}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# KMS key for general encryption
resource "aws_kms_key" "main" {
  description             = "Main KMS key for encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "main-kms-key-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# KMS key alias
resource "aws_kms_alias" "main" {
  name          = "alias/main-key-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.main.key_id
}

# KMS key for CloudTrail
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail encryption"
  deletion_window_in_days = 10
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
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "cloudtrail-kms-key-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# KMS key alias for CloudTrail
resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/cloudtrail-key-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "main-igw-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Public Subnet 1
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Type        = "public"
  }
}

# Public Subnet 2
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-2-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Type        = "public"
  }
}

# Private Subnet 1
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "private-subnet-1-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Type        = "private"
  }
}

# Private Subnet 2
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "private-subnet-2-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Type        = "private"
  }
}

# Elastic IP for NAT Gateway 1
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-1-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Elastic IP for NAT Gateway 2
resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name        = "nat-eip-2-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 1
resource "aws_nat_gateway" "main_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "nat-gateway-1-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 2
resource "aws_nat_gateway" "main_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "nat-gateway-2-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-rt-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Route Table for Private Subnet 1
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_1.id
  }

  tags = {
    Name        = "private-rt-1-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Route Table for Private Subnet 2
resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_2.id
  }

  tags = {
    Name        = "private-rt-2-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# S3 Bucket for Central Logging
resource "aws_s3_bucket" "logs" {
  bucket = "central-logs-${data.aws_caller_identity.current.account_id}-${random_id.suffix.hex}"

  tags = {
    Name        = "central-logs-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "central-logging"
  }
}

# S3 Bucket Versioning for Logs
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption for Logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket Public Access Block for Logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration for Logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 Bucket Policy for Logs
resource "aws_s3_bucket_policy" "logs" {
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
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.logs.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "VPCFlowLogsDelivery"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "VPCFlowLogsAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl"
        ]
        Resource = aws_s3_bucket.logs.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket.logs]
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "main-trail-${random_id.suffix.hex}"
  s3_bucket_name                = aws_s3_bucket.logs.bucket
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function/*"]
    }
  }

  tags = {
    Name        = "main-trail-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_s3_bucket_policy.logs]
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "config-role-${random_id.suffix.hex}"

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
    Name        = "config-role-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM Policy for AWS Config
resource "aws_iam_role_policy" "config" {
  name = "config-policy-${random_id.suffix.hex}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:GetObjectAcl",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWS managed policy to Config role
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "main-recorder-${random_id.suffix.hex}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "main-delivery-channel-${random_id.suffix.hex}"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "config"

  depends_on = [aws_s3_bucket_policy.logs]
}

# Start AWS Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rules for Security Compliance
# Rule: Ensure S3 buckets have encryption enabled
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-enabled-${random_id.suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  tags = {
    Name        = "s3-bucket-encryption-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule: Ensure RDS encryption is enabled
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-encryption-enabled-${random_id.suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = {
    Name        = "rds-encryption-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule: Ensure MFA is enabled for IAM users
resource "aws_config_config_rule" "mfa_enabled_for_iam_console_access" {
  name = "mfa-enabled-for-iam-console-access-${random_id.suffix.hex}"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }

  tags = {
    Name        = "mfa-enabled-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Amazon GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

  tags = {
    Name        = "main-guardduty-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM User with MFA enforcement
resource "aws_iam_user" "app_user" {
  name = "app-user-${random_id.suffix.hex}"

  tags = {
    Name        = "app-user-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM Group for MFA enforcement
resource "aws_iam_group" "mfa_enforced" {
  name = "mfa-enforced-group-${random_id.suffix.hex}"
}

# IAM Group membership
resource "aws_iam_user_group_membership" "app_user" {
  user = aws_iam_user.app_user.name
  groups = [
    aws_iam_group.mfa_enforced.name
  ]
}

# IAM Policy for MFA enforcement
resource "aws_iam_group_policy" "mfa_enforcement" {
  name  = "mfa-enforcement-policy-${random_id.suffix.hex}"
  group = aws_iam_group.mfa_enforced.name

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
        Sid    = "AllowManageOwnVirtualMFADevice"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice"
        ]
        Resource = "arn:aws:iam::*:mfa/*"
      },
      {
        Sid    = "AllowManageOwnUserMFA"
        Effect = "Allow"
        Action = [
          "iam:DeactivateMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
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
}

# Secrets Manager Secret for RDS
resource "aws_secretsmanager_secret" "rds" {
  name                    = "rds-credentials-${random_id.suffix.hex}"
  description             = "RDS database credentials"
  recovery_window_in_days = 0 # For immediate deletion in testing

  tags = {
    Name        = "rds-secret-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Generate random password for RDS
resource "random_password" "rds" {
  length  = 32
  special = true
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "rds" {
  secret_id = aws_secretsmanager_secret.rds.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = 3306
    dbname   = aws_db_instance.main.db_name
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group-${random_id.suffix.hex}"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name        = "main-db-subnet-group-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg-${random_id.suffix.hex}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Allow MySQL access from application servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "rds-sg-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "main-db-${random_id.suffix.hex}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "appdb"
  username = "admin"
  password = random_password.rds.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn

  tags = {
    Name        = "main-db-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_cloudwatch_log_group.rds]
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "rds-enhanced-monitoring-${random_id.suffix.hex}"

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
    Name        = "rds-monitoring-role-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/secure-app-prod"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "rds-logs-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Security Group for Application
resource "aws_security_group" "app" {
  name        = "app-sg-${random_id.suffix.hex}"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTPS from ALB"
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTP from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "app-sg-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${random_id.suffix.hex}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "alb-sg-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "main-alb-${random_id.suffix.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = {
    Name        = "main-alb-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${data.aws_caller_identity.current.account_id}-${random_id.suffix.hex}"

  tags = {
    Name        = "alb-logs-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "alb-logging"
  }
}

# S3 Bucket Server-Side Encryption for ALB Logs
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket Public Access Block for ALB Logs
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Data source for ELB service account
data "aws_elb_service_account" "main" {}

# S3 Bucket Policy for ALB Logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name     = "main-tg-${random_id.suffix.hex}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "main-tg-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# ALB Listener for HTTP (redirects to HTTPS)
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
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "main-waf-acl-${random_id.suffix.hex}"
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

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
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
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed SQL Database Rule Set
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3

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
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "main-waf-acl-metric"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "main-waf-acl-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.flow_logs.arn
  log_destination          = "${aws_s3_bucket.logs.arn}/vpc-flow-logs/"
  log_destination_type     = "s3"
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  tags = {
    Name        = "main-vpc-flow-logs-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "vpc-flow-logs-role-${random_id.suffix.hex}"

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
    Name        = "vpc-flow-logs-role-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  name = "vpc-flow-logs-policy-${random_id.suffix.hex}"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetObject",
          "s3:PutObjectAcl"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

# IAM Role for Application EC2 instances
resource "aws_iam_role" "app_instance" {
  name = "app-instance-role-${random_id.suffix.hex}"

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
    Name        = "app-instance-role-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM Policy for Application instances to access secrets
resource "aws_iam_role_policy" "app_secrets_access" {
  name = "app-secrets-access-${random_id.suffix.hex}"
  role = aws_iam_role.app_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.rds.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.main.arn
        ]
      }
    ]
  })
}

# IAM Policy for Application instances to write logs
resource "aws_iam_role_policy" "app_logs_access" {
  name = "app-logs-access-${random_id.suffix.hex}"
  role = aws_iam_role.app_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/application-logs/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile for Application instances
resource "aws_iam_instance_profile" "app" {
  name = "app-instance-profile-${random_id.suffix.hex}"
  role = aws_iam_role.app_instance.name

  tags = {
    Name        = "app-instance-profile-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# CloudWatch Log Group for EC2
resource "aws_cloudwatch_log_group" "ec2" {
  name              = "/aws/ec2/secure-app-prod"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "ec2-logs-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name         = "secure-app-prod-alerts-${random_id.suffix.hex}"
  display_name = "Secure App Production Alerts"

  tags = {
    Name        = "secure-app-prod-alerts-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Launch Template for Auto Scaling Group
resource "aws_launch_template" "app" {
  name_prefix   = "app-template-${random_id.suffix.hex}"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Secure App Server</h1>" > /var/www/html/index.html
              
              # Configure CloudWatch agent for logs
              yum install -y amazon-cloudwatch-agent
              
              # Basic security hardening
              systemctl disable postfix
              systemctl stop postfix
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "app-instance-${random_id.suffix.hex}"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }

  tags = {
    Name        = "app-launch-template-${random_id.suffix.hex}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "secure-app-prod-asg-${random_id.suffix.hex}"
  vpc_zone_identifier       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "secure-app-prod-asg-${random_id.suffix.hex}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "production"
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "terraform"
    propagate_at_launch = true
  }
}

# Outputs for reference
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "central_logs_bucket" {
  value       = aws_s3_bucket.logs.id
  description = "Name of the central logging S3 bucket"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "secret_arn" {
  value       = aws_secretsmanager_secret.rds.arn
  description = "ARN of the Secrets Manager secret for RDS credentials"
}

output "ec2_asg_name" {
  value       = aws_autoscaling_group.main.name
  description = "Name of the Auto Scaling Group for application instances"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "ARN of the SNS topic for monitoring alerts and notifications"
}

output "cloudwatch_log_group_ec2" {
  value       = aws_cloudwatch_log_group.ec2.name
  description = "Name of the CloudWatch log group for EC2 instances"
}

output "cloudwatch_log_group_rds" {
  value       = aws_cloudwatch_log_group.rds.name
  description = "Name of the CloudWatch log group for RDS database logs"
}

output "kms_key_id" {
  value       = aws_kms_key.main.key_id
  description = "ID of the main KMS key used for encryption"
}

output "kms_key_arn" {
  value       = aws_kms_key.main.arn
  description = "ARN of the main KMS key used for encryption"
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.rds.arn
  description = "ARN of the database secrets in AWS Secrets Manager"
}

output "db_secret_name" {
  value       = aws_secretsmanager_secret.rds.name
  description = "Name of the database secret in AWS Secrets Manager"
}

output "rds_instance_id" {
  value       = aws_db_instance.main.id
  description = "ID of the RDS database instance"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.logs.id
  description = "Name of the central logging S3 bucket"
}

output "s3_bucket_arn" {
  value       = aws_s3_bucket.logs.arn
  description = "ARN of the central logging S3 bucket"
}

output "public_subnet_ids" {
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  description = "IDs of the public subnets"
}

output "private_subnet_ids" {
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  description = "IDs of the private subnets"
}