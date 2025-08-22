# Data sources for current AWS account and caller identity
locals {
  environment = terraform.workspace
  common_tags = {
    Environment = local.environment
    Project     = "SecureCloudInfra"
    Owner       = "DevOpsTeam"
    ManagedBy   = "Terraform"
    CostCenter  = "IT-Security"
    Compliance  = "SOC2-PCI-DSS"
  }

  # Allowed IP ranges for security groups (replace with your actual ranges)
  allowed_ip_ranges = [
    "10.0.0.0/8",    # Internal network
    "172.16.0.0/12", # Private network
    "203.0.113.0/24" # Example public IP range - replace with actual
  ]

  regions = ["us-west-1", "eu-central-1"]
}

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
  name          = "alias/secure-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  target_key_id = aws_kms_key.main_us_west.key_id
}

resource "aws_kms_alias" "main_eu_central" {
  provider      = aws.eu_central
  name          = "alias/secure-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
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
  name        = "${local.environment}-web-tier-sg-us-west-1"
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

  # Restricted egress - HTTPS for external API calls and updates
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for API calls and updates"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_us_west.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTP for package updates (can be restricted to specific repos in production)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }



  tags = merge(local.common_tags, {
    Name = "${local.environment}-web-tier-sg-us-west-1"
    Tier = "Web"
  })
}

resource "aws_security_group" "web_tier_eu_central" {
  provider    = aws.eu_central
  name        = "${local.environment}-web-tier-sg-eu-central-1"
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

  # Restricted egress - HTTPS for external API calls and updates
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for API calls and updates"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_eu_central.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTP for package updates (can be restricted to specific repos in production)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }



  tags = merge(local.common_tags, {
    Name = "${local.environment}-web-tier-sg-eu-central-1"
    Tier = "Web"
  })
}

resource "aws_security_group" "database_tier_us_west" {
  provider    = aws.us_west
  name        = "${local.environment}-database-tier-sg-us-west-1"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.secure_app_vpc_us_west.id



  # DNS resolution for updates
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_us_west.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTPS for security updates and patches
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for security updates and patches"
  }

  # HTTP for package repositories (restricted as much as possible)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }

  tags = merge(local.common_tags, {
    Name = "${local.environment}-database-tier-sg-us-west-1"
    Tier = "Database"
  })
}

resource "aws_security_group" "database_tier_eu_central" {
  provider    = aws.eu_central
  name        = "${local.environment}-database-tier-sg-eu-central-1"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.secure_app_vpc_eu_central.id



  # DNS resolution for updates
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_eu_central.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTPS for security updates and patches
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for security updates and patches"
  }

  # HTTP for package repositories (restricted as much as possible)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }

  tags = merge(local.common_tags, {
    Name = "${local.environment}-database-tier-sg-eu-central-1"
    Tier = "Database"
  })
}

########################
# Security Group Rules (Separate to avoid circular dependencies)
########################

# Web tier to database tier communication - us-west-1
resource "aws_security_group_rule" "web_to_db_us_west" {
  provider                 = aws.us_west
  type                     = "egress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.database_tier_us_west.id
  security_group_id        = aws_security_group.web_tier_us_west.id
  description              = "MySQL to database tier"
}

# Database tier from web tier communication - us-west-1
resource "aws_security_group_rule" "db_from_web_us_west" {
  provider                 = aws.us_west
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web_tier_us_west.id
  security_group_id        = aws_security_group.database_tier_us_west.id
  description              = "MySQL from web tier"
}

# Web tier to database tier communication - eu-central-1
resource "aws_security_group_rule" "web_to_db_eu_central" {
  provider                 = aws.eu_central
  type                     = "egress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.database_tier_eu_central.id
  security_group_id        = aws_security_group.web_tier_eu_central.id
  description              = "MySQL to database tier"
}

# Database tier from web tier communication - eu-central-1
resource "aws_security_group_rule" "db_from_web_eu_central" {
  provider                 = aws.eu_central
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web_tier_eu_central.id
  security_group_id        = aws_security_group.database_tier_eu_central.id
  description              = "MySQL from web tier"
}

########################
# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 24
  hard_expiry                    = false
}

# IAM Role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_secure_role" {
  name = "EC2SecureRole-${local.environment}-${random_string.bucket_suffix.result}"

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
  name = "EC2SecurePolicy-${local.environment}-${random_string.bucket_suffix.result}"
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
  name = "EC2Profile-${local.environment}-${random_string.bucket_suffix.result}"
  role = aws_iam_role.ec2_secure_role.name

  tags = local.common_tags
}

# IAM Group for developers with MFA requirement
resource "aws_iam_group" "developers" {
  name = "Developers-${local.environment}-${random_string.bucket_suffix.result}"
}

# IAM Policy requiring MFA for console access
resource "aws_iam_policy" "force_mfa" {
  name        = "ForceMFA-${local.environment}-${random_string.bucket_suffix.result}"
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
  name              = "/aws/application/${local.environment}/us-west-1-${random_string.bucket_suffix.result}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_us_west.arn

  tags = merge(local.common_tags, {
    Name = "ApplicationLogs-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_log_group" "application_logs_eu_central" {
  provider          = aws.eu_central
  name              = "/aws/application/${local.environment}/eu-central-1-${random_string.bucket_suffix.result}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_eu_central.arn

  tags = merge(local.common_tags, {
    Name = "ApplicationLogs-${local.environment}-eu-central-1"
  })
}

resource "aws_cloudwatch_log_group" "security_logs_us_west" {
  provider          = aws.us_west
  name              = "/aws/security/${local.environment}/us-west-1-${random_string.bucket_suffix.result}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_us_west.arn

  tags = merge(local.common_tags, {
    Name = "SecurityLogs-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_log_group" "security_logs_eu_central" {
  provider          = aws.eu_central
  name              = "/aws/security/${local.environment}/eu-central-1-${random_string.bucket_suffix.result}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_eu_central.arn

  tags = merge(local.common_tags, {
    Name = "SecurityLogs-${local.environment}-eu-central-1"
  })
}

# CloudWatch Alarms for security monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_us_west" {
  provider            = aws.us_west
  alarm_name          = "HighCPUUtilization-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
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
  alarm_name          = "HighCPUUtilization-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
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
  provider          = aws.us_west
  name              = "SecurityAlerts-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  kms_master_key_id = aws_kms_key.main_us_west.id

  tags = merge(local.common_tags, {
    Name = "SecurityAlerts-${local.environment}-us-west-1"
  })
}

resource "aws_sns_topic" "security_alerts_eu_central" {
  provider          = aws.eu_central
  name              = "SecurityAlerts-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  kms_master_key_id = aws_kms_key.main_eu_central.id

  tags = merge(local.common_tags, {
    Name = "SecurityAlerts-${local.environment}-eu-central-1"
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "AWSConfigRole-${local.environment}-${random_string.bucket_suffix.result}"

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

# Attach AWS managed policy for Config service role
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# S3 bucket for AWS Config delivery channel - US West
resource "aws_s3_bucket" "config_bucket_us_west" {
  provider      = aws.us_west
  bucket        = "aws-config-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "AWSConfigBucket-${local.environment}-us-west-1"
  })
}

# S3 bucket for AWS Config delivery channel - EU Central  
resource "aws_s3_bucket" "config_bucket_eu_central" {
  provider      = aws.eu_central
  bucket        = "aws-config-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "AWSConfigBucket-${local.environment}-eu-central-1"
  })
}

# S3 bucket encryption for Config bucket - US West
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_us_west_encryption" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_us_west.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket encryption for Config bucket - EU Central
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_eu_central_encryption" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_eu_central.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block for Config bucket - US West
resource "aws_s3_bucket_public_access_block" "config_bucket_us_west_pab" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket public access block for Config bucket - EU Central
resource "aws_s3_bucket_public_access_block" "config_bucket_eu_central_pab" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for AWS Config - US West
resource "aws_s3_bucket_policy" "config_bucket_us_west_policy" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

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
        Resource = aws_s3_bucket.config_bucket_us_west.arn
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
        Resource = aws_s3_bucket.config_bucket_us_west.arn
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
        Resource = "${aws_s3_bucket.config_bucket_us_west.arn}/*"
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

# S3 bucket policy for AWS Config - EU Central
resource "aws_s3_bucket_policy" "config_bucket_eu_central_policy" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

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
        Resource = aws_s3_bucket.config_bucket_eu_central.arn
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
        Resource = aws_s3_bucket.config_bucket_eu_central.arn
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
        Resource = "${aws_s3_bucket.config_bucket_eu_central.arn}/*"
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

# Random string for S3 bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# AWS Config - Smart deployment strategy
# Uses locals to control Config resource creation based on environment needs

locals {
  # Set these based on your environment:
  # - true: Create new Config resources (safe for fresh environments)
  # - false: Skip creation (use when Config already exists)
  deploy_config_us_west    = false # Set to false if Config already exists in us-west-1
  deploy_config_eu_central = false # Set to false if Config already exists in eu-central-1
}

# Create Config resources only when explicitly enabled
resource "aws_config_configuration_recorder" "recorder_us_west" {
  provider = aws.us_west
  count    = local.deploy_config_us_west ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_configuration_recorder" "recorder_eu_central" {
  provider = aws.eu_central
  count    = local.deploy_config_eu_central ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = false
  }
}

resource "aws_config_delivery_channel" "delivery_channel_us_west" {
  provider       = aws.us_west
  count          = local.deploy_config_us_west ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  s3_bucket_name = aws_s3_bucket.config_bucket_us_west.bucket

  depends_on = [
    aws_s3_bucket_policy.config_bucket_us_west_policy,
    aws_iam_role_policy_attachment.config_role_policy
  ]
}

resource "aws_config_delivery_channel" "delivery_channel_eu_central" {
  provider       = aws.eu_central
  count          = local.deploy_config_eu_central ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  s3_bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket

  depends_on = [
    aws_s3_bucket_policy.config_bucket_eu_central_policy,
    aws_iam_role_policy_attachment.config_role_policy
  ]
}

########################
# AWS GuardDuty - Threat Detection
########################

# GuardDuty Detector - us-west-1
resource "aws_guardduty_detector" "main_us_west" {
  provider = aws.us_west
  enable   = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "GuardDutyDetector-${local.environment}-us-west-1"
  })
}

# GuardDuty Detector - eu-central-1
resource "aws_guardduty_detector" "main_eu_central" {
  provider = aws.eu_central
  enable   = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "GuardDutyDetector-${local.environment}-eu-central-1"
  })
}

# GuardDuty Threat Intel Set - us-west-1 (Optional: Custom threat intelligence)
# Commented out as it requires special IAM permissions and S3 setup
# Uncomment and configure when ready to use custom threat intelligence
# resource "aws_guardduty_threatintelset" "threat_intel_us_west" {
#   provider        = aws.us_west
#   activate        = true
#   detector_id     = aws_guardduty_detector.main_us_west.id
#   format          = "TXT"
#   location        = "s3://${aws_s3_bucket.config_bucket_us_west.bucket}/threat-intel/malicious-ips.txt"
#   name            = "ThreatIntelSet-${local.environment}-us-west-1"
#
#   tags = merge(local.common_tags, {
#     Name = "GuardDutyThreatIntel-${local.environment}-us-west-1"
#   })
#
#   # Note: This requires the threat intel file to exist in S3
#   # In production, you would populate this with actual threat intelligence data
# }

# GuardDuty CloudWatch Event Rule for Findings - us-west-1
resource "aws_cloudwatch_event_rule" "guardduty_finding_us_west" {
  provider    = aws.us_west
  name        = "guardduty-finding-${local.environment}-us-west-1"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0]
    }
  })

  tags = merge(local.common_tags, {
    Name = "GuardDutyEventRule-${local.environment}-us-west-1"
  })
}

# GuardDuty CloudWatch Event Target - us-west-1
resource "aws_cloudwatch_event_target" "guardduty_sns_us_west" {
  provider  = aws.us_west
  rule      = aws_cloudwatch_event_rule.guardduty_finding_us_west.name
  target_id = "GuardDutySNSTarget"
  arn       = aws_sns_topic.security_alerts_us_west.arn
}

# GuardDuty CloudWatch Event Rule for Findings - eu-central-1
resource "aws_cloudwatch_event_rule" "guardduty_finding_eu_central" {
  provider    = aws.eu_central
  name        = "guardduty-finding-${local.environment}-eu-central-1"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0]
    }
  })

  tags = merge(local.common_tags, {
    Name = "GuardDutyEventRule-${local.environment}-eu-central-1"
  })
}

# GuardDuty CloudWatch Event Target - eu-central-1
resource "aws_cloudwatch_event_target" "guardduty_sns_eu_central" {
  provider  = aws.eu_central
  rule      = aws_cloudwatch_event_rule.guardduty_finding_eu_central.name
  target_id = "GuardDutySNSTarget"
  arn       = aws_sns_topic.security_alerts_eu_central.arn
}

########################
# API Gateway CloudWatch Logs Role (Account-level setting)
########################

# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "APIGatewayCloudWatchLogsRole-${random_string.bucket_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for API Gateway CloudWatch Logs
resource "aws_iam_role_policy" "api_gateway_cloudwatch_policy" {
  name = "APIGatewayCloudWatchLogsPolicy"
  role = aws_iam_role.api_gateway_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Gateway Account Settings for CloudWatch Logs (us-west-1)
resource "aws_api_gateway_account" "api_gateway_account_us_west" {
  provider            = aws.us_west
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

# API Gateway Account Settings for CloudWatch Logs (eu-central-1)
resource "aws_api_gateway_account" "api_gateway_account_eu_central" {
  provider            = aws.eu_central
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

########################
# AWS WAF + API Gateway - DDoS Protection
########################

# WAF Web ACL - us-west-1
resource "aws_wafv2_web_acl" "api_protection_us_west" {
  provider = aws.us_west
  name     = "APIProtection-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

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

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

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

  # Geo-blocking rule (example: block traffic from specific countries)
  rule {
    name     = "GeoBlockRule"
    priority = 4

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"] # Block China, Russia, North Korea as example
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIProtectionWebACL"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "WAFWebACL-${local.environment}-us-west-1"
  })
}

# WAF Web ACL - eu-central-1
resource "aws_wafv2_web_acl" "api_protection_eu_central" {
  provider = aws.eu_central
  name     = "APIProtection-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

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

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

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

  # Geo-blocking rule (example: block traffic from specific countries)
  rule {
    name     = "GeoBlockRule"
    priority = 4

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"] # Block China, Russia, North Korea as example
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIProtectionWebACL"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "WAFWebACL-${local.environment}-eu-central-1"
  })
}

# API Gateway REST API - us-west-1
resource "aws_api_gateway_rest_api" "secure_api_us_west" {
  provider = aws.us_west
  name     = "SecureAPI-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "execute-api:Invoke"
        Resource  = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = local.allowed_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "APIGateway-${local.environment}-us-west-1"
  })
}

# API Gateway REST API - eu-central-1
resource "aws_api_gateway_rest_api" "secure_api_eu_central" {
  provider = aws.eu_central
  name     = "SecureAPI-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "execute-api:Invoke"
        Resource  = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = local.allowed_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "APIGateway-${local.environment}-eu-central-1"
  })
}

# API Gateway Stage - us-west-1
resource "aws_api_gateway_stage" "secure_api_stage_us_west" {
  provider      = aws.us_west
  deployment_id = aws_api_gateway_deployment.secure_api_deployment_us_west.id
  rest_api_id   = aws_api_gateway_rest_api.secure_api_us_west.id
  stage_name    = local.environment

  xray_tracing_enabled = true

  depends_on = [aws_api_gateway_account.api_gateway_account_us_west]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.application_logs_us_west.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "APIGatewayStage-${local.environment}-us-west-1"
  })
}

# API Gateway Stage - eu-central-1
resource "aws_api_gateway_stage" "secure_api_stage_eu_central" {
  provider      = aws.eu_central
  deployment_id = aws_api_gateway_deployment.secure_api_deployment_eu_central.id
  rest_api_id   = aws_api_gateway_rest_api.secure_api_eu_central.id
  stage_name    = local.environment

  xray_tracing_enabled = true

  depends_on = [aws_api_gateway_account.api_gateway_account_eu_central]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.application_logs_eu_central.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "APIGatewayStage-${local.environment}-eu-central-1"
  })
}

# Simple health check endpoint resource - us-west-1
resource "aws_api_gateway_resource" "health_us_west" {
  provider    = aws.us_west
  rest_api_id = aws_api_gateway_rest_api.secure_api_us_west.id
  parent_id   = aws_api_gateway_rest_api.secure_api_us_west.root_resource_id
  path_part   = "health"
}

# Simple health check endpoint resource - eu-central-1
resource "aws_api_gateway_resource" "health_eu_central" {
  provider    = aws.eu_central
  rest_api_id = aws_api_gateway_rest_api.secure_api_eu_central.id
  parent_id   = aws_api_gateway_rest_api.secure_api_eu_central.root_resource_id
  path_part   = "health"
}

# API Gateway Method - us-west-1
resource "aws_api_gateway_method" "health_get_us_west" {
  provider      = aws.us_west
  rest_api_id   = aws_api_gateway_rest_api.secure_api_us_west.id
  resource_id   = aws_api_gateway_resource.health_us_west.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Method - eu-central-1
resource "aws_api_gateway_method" "health_get_eu_central" {
  provider      = aws.eu_central
  rest_api_id   = aws_api_gateway_rest_api.secure_api_eu_central.id
  resource_id   = aws_api_gateway_resource.health_eu_central.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Integration - us-west-1
resource "aws_api_gateway_integration" "health_integration_us_west" {
  provider    = aws.us_west
  rest_api_id = aws_api_gateway_rest_api.secure_api_us_west.id
  resource_id = aws_api_gateway_resource.health_us_west.id
  http_method = aws_api_gateway_method.health_get_us_west.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# API Gateway Integration - eu-central-1
resource "aws_api_gateway_integration" "health_integration_eu_central" {
  provider    = aws.eu_central
  rest_api_id = aws_api_gateway_rest_api.secure_api_eu_central.id
  resource_id = aws_api_gateway_resource.health_eu_central.id
  http_method = aws_api_gateway_method.health_get_eu_central.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# API Gateway Method Response - us-west-1
resource "aws_api_gateway_method_response" "health_response_us_west" {
  provider    = aws.us_west
  rest_api_id = aws_api_gateway_rest_api.secure_api_us_west.id
  resource_id = aws_api_gateway_resource.health_us_west.id
  http_method = aws_api_gateway_method.health_get_us_west.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# API Gateway Method Response - eu-central-1
resource "aws_api_gateway_method_response" "health_response_eu_central" {
  provider    = aws.eu_central
  rest_api_id = aws_api_gateway_rest_api.secure_api_eu_central.id
  resource_id = aws_api_gateway_resource.health_eu_central.id
  http_method = aws_api_gateway_method.health_get_eu_central.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# API Gateway Integration Response - us-west-1
resource "aws_api_gateway_integration_response" "health_integration_response_us_west" {
  provider    = aws.us_west
  rest_api_id = aws_api_gateway_rest_api.secure_api_us_west.id
  resource_id = aws_api_gateway_resource.health_us_west.id
  http_method = aws_api_gateway_method.health_get_us_west.http_method
  status_code = aws_api_gateway_method_response.health_response_us_west.status_code

  response_templates = {
    "application/json" = jsonencode({
      message   = "API is healthy"
      timestamp = "$context.requestTime"
      stage     = "$context.stage"
    })
  }

  depends_on = [aws_api_gateway_integration.health_integration_us_west]
}

# API Gateway Integration Response - eu-central-1
resource "aws_api_gateway_integration_response" "health_integration_response_eu_central" {
  provider    = aws.eu_central
  rest_api_id = aws_api_gateway_rest_api.secure_api_eu_central.id
  resource_id = aws_api_gateway_resource.health_eu_central.id
  http_method = aws_api_gateway_method.health_get_eu_central.http_method
  status_code = aws_api_gateway_method_response.health_response_eu_central.status_code

  response_templates = {
    "application/json" = jsonencode({
      message   = "API is healthy"
      timestamp = "$context.requestTime"
      stage     = "$context.stage"
    })
  }

  depends_on = [aws_api_gateway_integration.health_integration_eu_central]
}

# API Gateway Deployment - us-west-1
resource "aws_api_gateway_deployment" "secure_api_deployment_us_west" {
  provider    = aws.us_west
  rest_api_id = aws_api_gateway_rest_api.secure_api_us_west.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health_us_west.id,
      aws_api_gateway_method.health_get_us_west.id,
      aws_api_gateway_integration.health_integration_us_west.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Deployment - eu-central-1
resource "aws_api_gateway_deployment" "secure_api_deployment_eu_central" {
  provider    = aws.eu_central
  rest_api_id = aws_api_gateway_rest_api.secure_api_eu_central.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health_eu_central.id,
      aws_api_gateway_method.health_get_eu_central.id,
      aws_api_gateway_integration.health_integration_eu_central.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Associate WAF with API Gateway - us-west-1
resource "aws_wafv2_web_acl_association" "api_waf_association_us_west" {
  provider     = aws.us_west
  resource_arn = aws_api_gateway_stage.secure_api_stage_us_west.arn
  web_acl_arn  = aws_wafv2_web_acl.api_protection_us_west.arn
}

# Associate WAF with API Gateway - eu-central-1
resource "aws_wafv2_web_acl_association" "api_waf_association_eu_central" {
  provider     = aws.eu_central
  resource_arn = aws_api_gateway_stage.secure_api_stage_eu_central.arn
  web_acl_arn  = aws_wafv2_web_acl.api_protection_eu_central.arn
}

########################
# Outputs
########################

# Account and Region Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_regions" {
  description = "AWS regions being used"
  value = {
    primary   = data.aws_region.us_west.name
    secondary = data.aws_region.eu_central.name
  }
}

output "environment" {
  description = "Current environment (workspace)"
  value       = local.environment
}

# VPC Outputs - us-west-1
output "vpc_us_west" {
  description = "VPC information for us-west-1"
  value = {
    id         = aws_vpc.secure_app_vpc_us_west.id
    arn        = aws_vpc.secure_app_vpc_us_west.arn
    cidr_block = aws_vpc.secure_app_vpc_us_west.cidr_block
  }
}

# VPC Outputs - eu-central-1
output "vpc_eu_central" {
  description = "VPC information for eu-central-1"
  value = {
    id         = aws_vpc.secure_app_vpc_eu_central.id
    arn        = aws_vpc.secure_app_vpc_eu_central.arn
    cidr_block = aws_vpc.secure_app_vpc_eu_central.cidr_block
  }
}

# Subnet Outputs - us-west-1
output "subnets_us_west" {
  description = "Subnet information for us-west-1"
  value = {
    private = {
      subnet_1a = {
        id                = aws_subnet.private_subnet_us_west_1a.id
        arn               = aws_subnet.private_subnet_us_west_1a.arn
        cidr_block        = aws_subnet.private_subnet_us_west_1a.cidr_block
        availability_zone = aws_subnet.private_subnet_us_west_1a.availability_zone
      }
      subnet_1c = {
        id                = aws_subnet.private_subnet_us_west_1c.id
        arn               = aws_subnet.private_subnet_us_west_1c.arn
        cidr_block        = aws_subnet.private_subnet_us_west_1c.cidr_block
        availability_zone = aws_subnet.private_subnet_us_west_1c.availability_zone
      }
    }
    public = {
      subnet_1a = {
        id                = aws_subnet.public_subnet_us_west_1a.id
        arn               = aws_subnet.public_subnet_us_west_1a.arn
        cidr_block        = aws_subnet.public_subnet_us_west_1a.cidr_block
        availability_zone = aws_subnet.public_subnet_us_west_1a.availability_zone
      }
    }
  }
}

# Subnet Outputs - eu-central-1
output "subnets_eu_central" {
  description = "Subnet information for eu-central-1"
  value = {
    private = {
      subnet_1a = {
        id                = aws_subnet.private_subnet_eu_central_1a.id
        arn               = aws_subnet.private_subnet_eu_central_1a.arn
        cidr_block        = aws_subnet.private_subnet_eu_central_1a.cidr_block
        availability_zone = aws_subnet.private_subnet_eu_central_1a.availability_zone
      }
      subnet_1b = {
        id                = aws_subnet.private_subnet_eu_central_1b.id
        arn               = aws_subnet.private_subnet_eu_central_1b.arn
        cidr_block        = aws_subnet.private_subnet_eu_central_1b.cidr_block
        availability_zone = aws_subnet.private_subnet_eu_central_1b.availability_zone
      }
    }
    public = {
      subnet_1a = {
        id                = aws_subnet.public_subnet_eu_central_1a.id
        arn               = aws_subnet.public_subnet_eu_central_1a.arn
        cidr_block        = aws_subnet.public_subnet_eu_central_1a.cidr_block
        availability_zone = aws_subnet.public_subnet_eu_central_1a.availability_zone
      }
    }
  }
}

# Internet Gateway Outputs
output "internet_gateways" {
  description = "Internet Gateway information"
  value = {
    us_west = {
      id  = aws_internet_gateway.igw_us_west.id
      arn = aws_internet_gateway.igw_us_west.arn
    }
    eu_central = {
      id  = aws_internet_gateway.igw_eu_central.id
      arn = aws_internet_gateway.igw_eu_central.arn
    }
  }
}

# NAT Gateway Outputs
output "nat_gateways" {
  description = "NAT Gateway and Elastic IP information"
  value = {
    us_west = {
      id            = aws_nat_gateway.nat_us_west.id
      public_ip     = aws_eip.nat_eip_us_west.public_ip
      elastic_ip_id = aws_eip.nat_eip_us_west.id
      allocation_id = aws_eip.nat_eip_us_west.allocation_id
    }
    eu_central = {
      id            = aws_nat_gateway.nat_eu_central.id
      public_ip     = aws_eip.nat_eip_eu_central.public_ip
      elastic_ip_id = aws_eip.nat_eip_eu_central.id
      allocation_id = aws_eip.nat_eip_eu_central.allocation_id
    }
  }
}

# Security Group Outputs
output "security_groups" {
  description = "Security Group information"
  value = {
    us_west = {
      web_tier = {
        id   = aws_security_group.web_tier_us_west.id
        arn  = aws_security_group.web_tier_us_west.arn
        name = aws_security_group.web_tier_us_west.name
      }
      database_tier = {
        id   = aws_security_group.database_tier_us_west.id
        arn  = aws_security_group.database_tier_us_west.arn
        name = aws_security_group.database_tier_us_west.name
      }
    }
    eu_central = {
      web_tier = {
        id   = aws_security_group.web_tier_eu_central.id
        arn  = aws_security_group.web_tier_eu_central.arn
        name = aws_security_group.web_tier_eu_central.name
      }
      database_tier = {
        id   = aws_security_group.database_tier_eu_central.id
        arn  = aws_security_group.database_tier_eu_central.arn
        name = aws_security_group.database_tier_eu_central.name
      }
    }
  }
}

# KMS Key Outputs
output "kms_keys" {
  description = "KMS key information"
  value = {
    us_west = {
      key_id     = aws_kms_key.main_us_west.key_id
      arn        = aws_kms_key.main_us_west.arn
      alias_name = aws_kms_alias.main_us_west.name
      alias_arn  = aws_kms_alias.main_us_west.arn
    }
    eu_central = {
      key_id     = aws_kms_key.main_eu_central.key_id
      arn        = aws_kms_key.main_eu_central.arn
      alias_name = aws_kms_alias.main_eu_central.name
      alias_arn  = aws_kms_alias.main_eu_central.arn
    }
  }
}

# IAM Outputs
output "iam_resources" {
  description = "IAM role and policy information"
  value = {
    ec2_role = {
      name = aws_iam_role.ec2_secure_role.name
      arn  = aws_iam_role.ec2_secure_role.arn
    }
    ec2_instance_profile = {
      name = aws_iam_instance_profile.ec2_profile.name
      arn  = aws_iam_instance_profile.ec2_profile.arn
    }
    config_role = {
      name = aws_iam_role.config_role.name
      arn  = aws_iam_role.config_role.arn
    }
    developers_group = {
      name = aws_iam_group.developers.name
      arn  = aws_iam_group.developers.arn
    }
    mfa_policy = {
      name = aws_iam_policy.force_mfa.name
      arn  = aws_iam_policy.force_mfa.arn
    }
  }
}

# CloudWatch Log Groups
output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group information"
  value = {
    us_west = {
      application_logs = {
        name = aws_cloudwatch_log_group.application_logs_us_west.name
        arn  = aws_cloudwatch_log_group.application_logs_us_west.arn
      }
      security_logs = {
        name = aws_cloudwatch_log_group.security_logs_us_west.name
        arn  = aws_cloudwatch_log_group.security_logs_us_west.arn
      }
    }
    eu_central = {
      application_logs = {
        name = aws_cloudwatch_log_group.application_logs_eu_central.name
        arn  = aws_cloudwatch_log_group.application_logs_eu_central.arn
      }
      security_logs = {
        name = aws_cloudwatch_log_group.security_logs_eu_central.name
        arn  = aws_cloudwatch_log_group.security_logs_eu_central.arn
      }
    }
  }
}

# CloudWatch Alarms
output "cloudwatch_alarms" {
  description = "CloudWatch Alarm information"
  value = {
    us_west = {
      high_cpu_alarm = {
        name = aws_cloudwatch_metric_alarm.high_cpu_us_west.alarm_name
        arn  = aws_cloudwatch_metric_alarm.high_cpu_us_west.arn
      }
    }
    eu_central = {
      high_cpu_alarm = {
        name = aws_cloudwatch_metric_alarm.high_cpu_eu_central.alarm_name
        arn  = aws_cloudwatch_metric_alarm.high_cpu_eu_central.arn
      }
    }
  }
}

# SNS Topics
output "sns_topics" {
  description = "SNS Topic information"
  value = {
    us_west = {
      security_alerts = {
        name = aws_sns_topic.security_alerts_us_west.name
        arn  = aws_sns_topic.security_alerts_us_west.arn
      }
    }
    eu_central = {
      security_alerts = {
        name = aws_sns_topic.security_alerts_eu_central.name
        arn  = aws_sns_topic.security_alerts_eu_central.arn
      }
    }
  }
}

# S3 Buckets for AWS Config
output "config_s3_buckets" {
  description = "S3 bucket information for AWS Config"
  value = {
    us_west = {
      bucket_name = aws_s3_bucket.config_bucket_us_west.bucket
      bucket_arn  = aws_s3_bucket.config_bucket_us_west.arn
    }
    eu_central = {
      bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket
      bucket_arn  = aws_s3_bucket.config_bucket_eu_central.arn
    }
  }
}

# AWS Config Resources
output "aws_config" {
  description = "AWS Config resources information"
  value = {
    us_west = {
      configuration_recorder = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_us_west ? aws_config_configuration_recorder.recorder_us_west[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_us_west
      }
      delivery_channel = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_us_west ? aws_config_delivery_channel.delivery_channel_us_west[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_us_west
      }
    }
    eu_central = {
      configuration_recorder = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_eu_central ? aws_config_configuration_recorder.recorder_eu_central[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_eu_central
      }
      delivery_channel = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_eu_central ? aws_config_delivery_channel.delivery_channel_eu_central[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_eu_central
      }
    }
  }
}

# Route Tables
output "route_tables" {
  description = "Route table information"
  value = {
    us_west = {
      private_route_table = {
        id  = aws_route_table.private_rt_us_west.id
        arn = aws_route_table.private_rt_us_west.arn
      }
      public_route_table = {
        id  = aws_route_table.public_rt_us_west.id
        arn = aws_route_table.public_rt_us_west.arn
      }
    }
    eu_central = {
      private_route_table = {
        id  = aws_route_table.private_rt_eu_central.id
        arn = aws_route_table.private_rt_eu_central.arn
      }
      public_route_table = {
        id  = aws_route_table.public_rt_eu_central.id
        arn = aws_route_table.public_rt_eu_central.arn
      }
    }
  }
}

# AWS GuardDuty Outputs
output "guardduty" {
  description = "GuardDuty detector information"
  value = {
    us_west = {
      detector_id  = aws_guardduty_detector.main_us_west.id
      detector_arn = aws_guardduty_detector.main_us_west.arn
      enabled      = aws_guardduty_detector.main_us_west.enable
      event_rule = {
        name = aws_cloudwatch_event_rule.guardduty_finding_us_west.name
        arn  = aws_cloudwatch_event_rule.guardduty_finding_us_west.arn
      }
    }
    eu_central = {
      detector_id  = aws_guardduty_detector.main_eu_central.id
      detector_arn = aws_guardduty_detector.main_eu_central.arn
      enabled      = aws_guardduty_detector.main_eu_central.enable
      event_rule = {
        name = aws_cloudwatch_event_rule.guardduty_finding_eu_central.name
        arn  = aws_cloudwatch_event_rule.guardduty_finding_eu_central.arn
      }
    }
  }
}

# AWS WAF Outputs
output "waf" {
  description = "WAF Web ACL information"
  value = {
    us_west = {
      web_acl_id   = aws_wafv2_web_acl.api_protection_us_west.id
      web_acl_arn  = aws_wafv2_web_acl.api_protection_us_west.arn
      web_acl_name = aws_wafv2_web_acl.api_protection_us_west.name
      api_association = {
        resource_arn = aws_wafv2_web_acl_association.api_waf_association_us_west.resource_arn
        web_acl_arn  = aws_wafv2_web_acl_association.api_waf_association_us_west.web_acl_arn
      }
    }
    eu_central = {
      web_acl_id   = aws_wafv2_web_acl.api_protection_eu_central.id
      web_acl_arn  = aws_wafv2_web_acl.api_protection_eu_central.arn
      web_acl_name = aws_wafv2_web_acl.api_protection_eu_central.name
      api_association = {
        resource_arn = aws_wafv2_web_acl_association.api_waf_association_eu_central.resource_arn
        web_acl_arn  = aws_wafv2_web_acl_association.api_waf_association_eu_central.web_acl_arn
      }
    }
  }
}

# API Gateway Outputs
output "api_gateway" {
  description = "API Gateway information"
  value = {
    cloudwatch_role = {
      arn  = aws_iam_role.api_gateway_cloudwatch_role.arn
      name = aws_iam_role.api_gateway_cloudwatch_role.name
    }
    us_west = {
      rest_api = {
        id            = aws_api_gateway_rest_api.secure_api_us_west.id
        name          = aws_api_gateway_rest_api.secure_api_us_west.name
        arn           = aws_api_gateway_rest_api.secure_api_us_west.arn
        execution_arn = aws_api_gateway_rest_api.secure_api_us_west.execution_arn
      }
      stage = {
        name       = aws_api_gateway_stage.secure_api_stage_us_west.stage_name
        arn        = aws_api_gateway_stage.secure_api_stage_us_west.arn
        invoke_url = aws_api_gateway_stage.secure_api_stage_us_west.invoke_url
      }
      deployment = {
        id = aws_api_gateway_deployment.secure_api_deployment_us_west.id
      }
      health_endpoint = {
        resource_id = aws_api_gateway_resource.health_us_west.id
        path        = aws_api_gateway_resource.health_us_west.path_part
      }
    }
    eu_central = {
      rest_api = {
        id            = aws_api_gateway_rest_api.secure_api_eu_central.id
        name          = aws_api_gateway_rest_api.secure_api_eu_central.name
        arn           = aws_api_gateway_rest_api.secure_api_eu_central.arn
        execution_arn = aws_api_gateway_rest_api.secure_api_eu_central.execution_arn
      }
      stage = {
        name       = aws_api_gateway_stage.secure_api_stage_eu_central.stage_name
        arn        = aws_api_gateway_stage.secure_api_stage_eu_central.arn
        invoke_url = aws_api_gateway_stage.secure_api_stage_eu_central.invoke_url
      }
      deployment = {
        id = aws_api_gateway_deployment.secure_api_deployment_eu_central.id
      }
      health_endpoint = {
        resource_id = aws_api_gateway_resource.health_eu_central.id
        path        = aws_api_gateway_resource.health_eu_central.path_part
      }
    }
  }
}
