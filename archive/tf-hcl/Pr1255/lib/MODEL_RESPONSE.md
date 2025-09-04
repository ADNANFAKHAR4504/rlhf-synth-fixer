I'll create a comprehensive, highly secure AWS cloud environment using Terraform that meets all your requirements. Here's the complete configuration:

```hcl
# secure_aws_environment.tf
# Highly Secure AWS Cloud Environment
# Author: DevOps & Cloud Security Team
# Version: 1.0

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Local variables for environment and naming conventions
locals {
  environment = terraform.workspace
  common_tags = {
    Environment   = local.environment
    Project      = "SecureCloudInfra"
    Owner        = "DevOpsTeam"
    ManagedBy    = "Terraform"
    CostCenter   = "IT-Security"
    Compliance   = "SOC2-PCI-DSS"
  }
  
  # Allowed IP ranges for security groups (replace with your actual ranges)
  allowed_ip_ranges = [
    "10.0.0.0/8",     # Internal network
    "172.16.0.0/12",  # Private network
    "203.0.113.0/24"  # Example public IP range - replace with actual
  ]
  
  regions = ["us-west-1", "eu-central-1"]
}

# Primary AWS Provider (us-west-1)
provider "aws" {
  alias  = "us_west"
  region = "us-west-1"
  
  default_tags {
    tags = local.common_tags
  }
}

# Secondary AWS Provider (eu-central-1)
provider "aws" {
  alias  = "eu_central"
  region = "eu-central-1"
  
  default_tags {
    tags = local.common_tags
  }
}

# Data sources for current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "us_west" {
  provider = aws.us_west
}
data "aws_region" "eu_central" {
  provider = aws.eu_central
}

# KMS Keys for encryption
resource "aws_kms_key" "main_us_west" {
  provider                = aws.us_west
  description             = "Main KMS key for ${local.environment} environment in us-west-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootPermissions"
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
      }
    ]
  })
}

resource "aws_kms_key" "main_eu_central" {
  provider                = aws.eu_central
  description             = "Main KMS key for ${local.environment} environment in eu-central-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootPermissions"
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
      }
    ]
  })
}

# KMS Key Aliases
resource "aws_kms_alias" "main_us_west" {
  provider      = aws.us_west
  name          = "alias/secure-${local.environment}-us-west-1"
  target_key_id = aws_kms_key.main_us_west.key_id
}

resource "aws_kms_alias" "main_eu_central" {
  provider      = aws.eu_central
  name          = "alias/secure-${local.environment}-eu-central-1"
  target_key_id = aws_kms_key.main_eu_central.key_id
}

# VPC Configuration - US West 1
resource "aws_vpc" "secure_app_vpc_us_west" {
  provider             = aws.us_west
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "SecureAppVPC-${local.environment}-us-west-1"
  })
}

# VPC Configuration - EU Central 1
resource "aws_vpc" "secure_app_vpc_eu_central" {
  provider             = aws.eu_central
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "SecureAppVPC-${local.environment}-eu-central-1"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "igw_us_west" {
  provider = aws.us_west
  vpc_id   = aws_vpc.secure_app_vpc_us_west.id
  
  tags = merge(local.common_tags, {
    Name = "SecureIGW-${local.environment}-us-west-1"
  })
}

resource "aws_internet_gateway" "igw_eu_central" {
  provider = aws.eu_central
  vpc_id   = aws_vpc.secure_app_vpc_eu_central.id
  
  tags = merge(local.common_tags, {
    Name = "SecureIGW-${local.environment}-eu-central-1"
  })
}

# Private Subnets - US West 1
resource "aws_subnet" "private_subnet_us_west_1a" {
  provider          = aws.us_west
  vpc_id            = aws_vpc.secure_app_vpc_us_west.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-1a"
  
  tags = merge(local.common_tags, {
    Name = "PrivateSubnet-${local.environment}-us-west-1a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_subnet_us_west_1c" {
  provider          = aws.us_west
  vpc_id            = aws_vpc.secure_app_vpc_us_west.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-1c"
  
  tags = merge(local.common_tags, {
    Name = "PrivateSubnet-${local.environment}-us-west-1c"
    Type = "Private"
  })
}

# Private Subnets - EU Central 1
resource "aws_subnet" "private_subnet_eu_central_1a" {
  provider          = aws.eu_central
  vpc_id            = aws_vpc.secure_app_vpc_eu_central.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "eu-central-1a"
  
  tags = merge(local.common_tags, {
    Name = "PrivateSubnet-${local.environment}-eu-central-1a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_subnet_eu_central_1b" {
  provider          = aws.eu_central
  vpc_id            = aws_vpc.secure_app_vpc_eu_central.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "eu-central-1b"
  
  tags = merge(local.common_tags, {
    Name = "PrivateSubnet-${local.environment}-eu-central-1b"
    Type = "Private"
  })
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public_subnet_us_west_1a" {
  provider                = aws.us_west
  vpc_id                  = aws_vpc.secure_app_vpc_us_west.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = "us-west-1a"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "PublicSubnet-${local.environment}-us-west-1a"
    Type = "Public"
  })
}

resource "aws_subnet" "public_subnet_eu_central_1a" {
  provider                = aws.eu_central
  vpc_id                  = aws_vpc.secure_app_vpc_eu_central.id
  cidr_block              = "10.1.10.0/24"
  availability_zone       = "eu-central-1a"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "PublicSubnet-${local.environment}-eu-central-1a"
    Type = "Public"
  })
}

# NAT Gateways
resource "aws_eip" "nat_eip_us_west" {
  provider = aws.us_west
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "NATGatewayEIP-${local.environment}-us-west-1"
  })
}

resource "aws_eip" "nat_eip_eu_central" {
  provider = aws.eu_central
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "NATGatewayEIP-${local.environment}-eu-central-1"
  })
}

resource "aws_nat_gateway" "nat_us_west" {
  provider      = aws.us_west
  allocation_id = aws_eip.nat_eip_us_west.id
  subnet_id     = aws_subnet.public_subnet_us_west_1a.id
  
  tags = merge(local.common_tags, {
    Name = "NATGateway-${local.environment}-us-west-1"
  })
}

resource "aws_nat_gateway" "nat_eu_central" {
  provider      = aws.eu_central
  allocation_id = aws_eip.nat_eip_eu_central.id
  subnet_id     = aws_subnet.public_subnet_eu_central_1a.id
  
  tags = merge(local.common_tags, {
    Name = "NATGateway-${local.environment}-eu-central-1"
  })
}

# Route Tables
resource "aws_route_table" "private_rt_us_west" {
  provider = aws.us_west
  vpc_id   = aws_vpc.secure_app_vpc_us_west.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_us_west.id
  }
  
  tags = merge(local.common_tags, {
    Name = "PrivateRouteTable-${local.environment}-us-west-1"
  })
}

resource "aws_route_table" "private_rt_eu_central" {
  provider = aws.eu_central
  vpc_id   = aws_vpc.secure_app_vpc_eu_central.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_eu_central.id
  }
  
  tags = merge(local.common_tags, {
    Name = "PrivateRouteTable-${local.environment}-eu-central-1"
  })
}

resource "aws_route_table" "public_rt_us_west" {
  provider = aws.us_west
  vpc_id   = aws_vpc.secure_app_vpc_us_west.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_us_west.id
  }
  
  tags = merge(local.common_tags, {
    Name = "PublicRouteTable-${local.environment}-us-west-1"
  })
}

resource "aws_route_table" "public_rt_eu_central" {
  provider = aws.eu_central
  vpc_id   = aws_vpc.secure_app_vpc_eu_central.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_eu_central.id
  }
  
  tags = merge(local.common_tags, {
    Name = "PublicRouteTable-${local.environment}-eu-central-1"
  })
}

# Route Table Associations
resource "aws_route_table_association" "private_rta_us_west_1a" {
  provider       = aws.us_west
  subnet_id      = aws_subnet.private_subnet_us_west_1a.id
  route_table_id = aws_route_table.private_rt_us_west.id
}

resource "aws_route_table_association" "private_rta_us_west_1c" {
  provider       = aws.us_west
  subnet_id      = aws_subnet.private_subnet_us_west_1c.id
  route_table_id = aws_route_table.private_rt_us_west.id
}

resource "aws_route_table_association" "private_rta_eu_central_1a" {
  provider       = aws.eu_central
  subnet_id      = aws_subnet.private_subnet_eu_central_1a.id
  route_table_id = aws_route_table.private_rt_eu_central.id
}

resource "aws_route_table_association" "private_rta_eu_central_1b" {
  provider       = aws.eu_central
  subnet_id      = aws_subnet.private_subnet_eu_central_1b.id
  route_table_id = aws_route_table.private_rt_eu_central.id
}

resource "aws_route_table_association" "public_rta_us_west" {
  provider       = aws.us_west
  subnet_id      = aws_subnet.public_subnet_us_west_1a.id
  route_table_id = aws_route_table.public_rt_us_west.id
}

resource "aws_route_table_association" "public_rta_eu_central" {
  provider       = aws.eu_central
  subnet_id      = aws_subnet.public_subnet_eu_central_1a.id
  route_table_id = aws_route_table.public_rt_eu_central.id
}

# Security Groups with explicit IP ranges only
resource "aws_security_group" "web_tier_us_west" {
  provider    = aws.us_west
  name        = "WebTierSG-${local.environment}-us-west-1"
  description = "Security group for web tier with restricted access"
  vpc_id      = aws_vpc.secure_app_vpc_us_west.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTPS from allowed IP ranges"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTP from allowed IP ranges"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "WebTierSG-${local.environment}-us-west-1"
    Tier = "Web"
  })
}

resource "aws_security_group" "web_tier_eu_central" {
  provider    = aws.eu_central
  name        = "WebTierSG-${local.environment}-eu-central-1"
  description = "Security group for web tier with restricted access"
  vpc_id      = aws_vpc.secure_app_vpc_eu_central.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTPS from allowed IP ranges"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTP from allowed IP ranges"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "WebTierSG-${local.environment}-eu-central-1"
    Tier = "Web"
  })
}

resource "aws_security_group" "database_tier_us_west" {
  provider    = aws.us_west
  name        = "DatabaseTierSG-${local.environment}-us-west-1"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.secure_app_vpc_us_west.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier_us_west.id]
    description     = "MySQL from web tier"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "DatabaseTierSG-${local.environment}-us-west-1"
    Tier = "Database"
  })
}

resource "aws_security_group" "database_tier_eu_central" {
  provider    = aws.eu_central
  name        = "DatabaseTierSG-${local.environment}-eu-central-1"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.secure_app_vpc_eu_central.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier_eu_central.id]
    description     = "MySQL from web tier"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "DatabaseTierSG-${local.environment}-eu-central-1"
    Tier = "Database"
  })
}

# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers               = true
  require_uppercase_characters   = true
  require_symbols               = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 24
  hard_expiry                   = false
}

# IAM Role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_secure_role" {
  name = "EC2SecureRole-${local.environment}"
  
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

# IAM Policy for EC2 role with minimal permissions
resource "aws_iam_role_policy" "ec2_secure_policy" {
  name = "EC2SecurePolicy-${local.environment}"
  role = aws_iam_role.ec2_secure_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "EC2Profile-${local.environment}"
  role = aws_iam_role.ec2_secure_role.name
  
  tags = local.common_tags
}

# IAM Group for developers with MFA requirement
resource "aws_iam_group" "developers" {
  name = "Developers-${local.environment}"
}

# IAM Policy requiring MFA for console access
resource "aws_iam_policy" "force_mfa" {
  name        = "ForceMFA-${local.environment}"
  description = "Policy to force MFA for console access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
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
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
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
  
  tags = local.common_tags
}

# Attach MFA policy to developers group
resource "aws_iam_group_policy_attachment" "developers_force_mfa" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.force_mfa.arn
}

# CloudWatch Log Groups with encryption
resource "aws_cloudwatch_log_group" "application_logs_us_west" {
  provider          = aws.us_west
  name              = "/aws/application/${local.environment}/us-west-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_us_west.arn
  
  tags = merge(local.common_tags, {
    Name = "ApplicationLogs-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_log_group" "application_logs_eu_central" {
  provider          = aws.eu_central
  name              = "/aws/application/${local.environment}/eu-central-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_eu_central.arn
  
  tags = merge(local.common_tags, {
    Name = "ApplicationLogs-${local.environment}-eu-central-1"
  })
}

resource "aws_cloudwatch_log_group" "security_logs_us_west" {
  provider          = aws.us_west
  name              = "/aws/security/${local.environment}/us-west-1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_us_west.arn
  
  tags = merge(local.common_tags, {
    Name = "SecurityLogs-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_log_group" "security_logs_eu_central" {
  provider          = aws.eu_central
  name              = "/aws/security/${local.environment}/eu-central-1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_eu_central.arn
  
  tags = merge(local.common_tags, {
    Name = "SecurityLogs-${local.environment}-eu-central-1"
  })
}

# CloudWatch Alarms for security monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_us_west" {
  provider            = aws.us_west
  alarm_name          = "HighCPUUtilization-${local.environment}-us-west-1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.security_alerts_us_west.arn]
  
  tags = merge(local.common_tags, {
    Name = "HighCPUAlarm-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_eu_central" {
  provider            = aws.eu_central
  alarm_name          = "HighCPUUtilization-${local.environment}-eu-central-1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.security_alerts_eu_central.arn]
  
  tags = merge(local.common_tags, {
    Name = "HighCPUAlarm-${local.environment}-eu-central-1"
  })
}

# SNS Topics for security alerts
resource "aws_sns_topic" "security_alerts_us_west" {
  provider         = aws.us_west
  name             = "SecurityAlerts-${local.environment}-us-west-1"
  kms_master_key_id = aws_kms_key.main_us_west.id
  
  tags = merge(local.common_tags, {
    Name = "SecurityAlerts-${local.environment}-us-west-1"
  })
}

resource "aws_sns_topic" "security_alerts_eu_central" {
  provider         = aws.eu_central
  name             = "SecurityAlerts-${local.environment}-eu-central-1"
  kms_master_key_id = aws_kms_key.main_eu_central.id
  
  tags = merge(local.common_tags, {
    Name = "SecurityAlerts-${local.environment}-eu-central-1"
  })
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "recorder_us_west" {
  provider = aws.us_west
  name     = "SecurityRecorder-${local.environment}-us-west-1"
  role_arn = aws_iam_role.config_role.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
  
  depends_on = [aws_config_delivery_channel.delivery_channel_us_west]
}

resource "aws_config_configuration_recorder" "recorder_eu_central" {
  provider = aws.eu_central
  name     = "SecurityRecorder-${local.environment}-eu-central-1"
  role_arn = aws_iam_role.config_role.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = false
  }
  
  depends_on = [aws_config_delivery_channel.delivery_channel_eu_central]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "delivery_channel_us_west" {
  provider       = aws.us_west
  name           = "SecurityDeliveryChannel-${local.environment}-us-west-1"
  s3_bucket_name = aws_s3_bucket.config_bucket_us_west.bucket
}

resource "aws_config_delivery_channel" "delivery_channel_eu_central" {
  provider       = aws.eu_central
  name           = "SecurityDeliveryChannel-${local.environment}-eu-central-1"
  s3_bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket
}