#==============================================================================
# TERRAFORM CONFIGURATION
#==============================================================================

#==============================================================================
# LOCAL VALUES
#==============================================================================

locals {
  name_prefix = "${var.environment}-tap-stack"
}

#==============================================================================
# DATA SOURCES
#==============================================================================

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_ami" "amazon_linux_us_east_1" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_eu_central_1" {
  provider    = aws.eu_central_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Data source for existing Route53 zone if not creating new one
data "aws_route53_zone" "existing" {
  count        = var.create_zone ? 0 : 1
  name         = var.domain_name
  private_zone = false
}

#==============================================================================
# RANDOM RESOURCES
#==============================================================================

resource "random_id" "suffix" {
  byte_length = 4
}

#==============================================================================
# KMS KEYS (per region)
#==============================================================================

resource "aws_kms_key" "main_us_east_1" {
  provider                = aws.us_east_1
  deletion_window_in_days = 7
  enable_key_rotation     = true
  description             = "KMS key for ${var.environment} in us-east-1"

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
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-kms-us-east-1"
  })
}

resource "aws_kms_alias" "main_us_east_1" {
  provider      = aws.us_east_1
  name          = "alias/${local.name_prefix}-us-east-1"
  target_key_id = aws_kms_key.main_us_east_1.key_id
}

resource "aws_kms_key" "main_eu_central_1" {
  provider                = aws.eu_central_1
  description             = "KMS key for ${var.environment} in eu-central-1"
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
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-kms-eu-central-1"
  })
}

resource "aws_kms_alias" "main_eu_central_1" {
  provider      = aws.eu_central_1
  name          = "alias/${local.name_prefix}-eu-central-1"
  target_key_id = aws_kms_key.main_eu_central_1.key_id
}

#==============================================================================
# NETWORKING - US-EAST-1
#==============================================================================

# Local Values
locals {
  az_config = {
    "us-east-1" = {
      cidr = "10.0.0.0/16"
      azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    "eu-central-1" = {
      cidr = "10.1.0.0/16"
      azs  = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
    }
  }
}

# VPC Configuration
resource "aws_vpc" "main_us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = local.az_config["us-east-1"].cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-vpc-us-east-1"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-igw-us-east-1"
  })
}

# Public Subnets
resource "aws_subnet" "public_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  vpc_id                  = aws_vpc.main_us_east_1.id
  cidr_block              = cidrsubnet(local.az_config["us-east-1"].cidr, 8, count.index)
  availability_zone       = local.az_config["us-east-1"].azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-public-us-east-1-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  vpc_id            = aws_vpc.main_us_east_1.id
  cidr_block        = cidrsubnet(local.az_config["us-east-1"].cidr, 8, count.index + 10)
  availability_zone = local.az_config["us-east-1"].azs[count.index]

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-private-us-east-1-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways
resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-nat-eip-us-east-1-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main_us_east_1]
}

resource "aws_nat_gateway" "main_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  allocation_id = aws_eip.nat_us_east_1[count.index].id
  subnet_id     = aws_subnet.public_us_east_1[count.index].id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-nat-us-east-1-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main_us_east_1]
}

# Route Tables
resource "aws_route_table" "public_us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.main_us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_us_east_1.id
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-public-rt-us-east-1"
  })
}

resource "aws_route_table" "private_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  vpc_id = aws_vpc.main_us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_us_east_1[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-private-rt-us-east-1-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  subnet_id      = aws_subnet.public_us_east_1[count.index].id
  route_table_id = aws_route_table.public_us_east_1.id
}

resource "aws_route_table_association" "private_us_east_1" {
  provider = aws.us_east_1
  count    = 3

  subnet_id      = aws_subnet.private_us_east_1[count.index].id
  route_table_id = aws_route_table.private_us_east_1[count.index].id
}

#==============================================================================
# NETWORKING - EU-CENTRAL-1
#==============================================================================

# VPC
resource "aws_vpc" "main_eu_central_1" {
  provider             = aws.eu_central_1
  cidr_block           = local.az_config["eu-central-1"].cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-vpc-eu-central-1"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main_eu_central_1" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.main_eu_central_1.id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-igw-eu-central-1"
  })
}

# Public Subnets
resource "aws_subnet" "public_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  vpc_id                  = aws_vpc.main_eu_central_1.id
  cidr_block              = cidrsubnet(local.az_config["eu-central-1"].cidr, 8, count.index)
  availability_zone       = local.az_config["eu-central-1"].azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-public-eu-central-1-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  vpc_id            = aws_vpc.main_eu_central_1.id
  cidr_block        = cidrsubnet(local.az_config["eu-central-1"].cidr, 8, count.index + 10)
  availability_zone = local.az_config["eu-central-1"].azs[count.index]

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-private-eu-central-1-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways
resource "aws_eip" "nat_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-nat-eip-eu-central-1-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main_eu_central_1]
}

resource "aws_nat_gateway" "main_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  allocation_id = aws_eip.nat_eu_central_1[count.index].id
  subnet_id     = aws_subnet.public_eu_central_1[count.index].id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-nat-eu-central-1-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main_eu_central_1]
}

# Route Tables
resource "aws_route_table" "public_eu_central_1" {
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.main_eu_central_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_eu_central_1.id
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-public-rt-eu-central-1"
  })
}

resource "aws_route_table" "private_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  vpc_id = aws_vpc.main_eu_central_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_eu_central_1[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-private-rt-eu-central-1-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  subnet_id      = aws_subnet.public_eu_central_1[count.index].id
  route_table_id = aws_route_table.public_eu_central_1.id
}

resource "aws_route_table_association" "private_eu_central_1" {
  provider = aws.eu_central_1
  count    = 3

  subnet_id      = aws_subnet.private_eu_central_1[count.index].id
  route_table_id = aws_route_table.private_eu_central_1[count.index].id
}

#==============================================================================
# VPC PEERING
#==============================================================================

resource "aws_vpc_peering_connection" "main" {
  provider    = aws.us_east_1
  vpc_id      = aws_vpc.main_us_east_1.id
  peer_vpc_id = aws_vpc.main_eu_central_1.id
  peer_region = "eu-central-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-peering"
  })
}

resource "aws_vpc_peering_connection_accepter" "main" {
  provider                  = aws.eu_central_1
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-peering-accepter"
  })
}

# Add routes for peering
resource "aws_route" "us_east_1_to_eu_central_1" {
  provider                  = aws.us_east_1
  count                     = 3
  route_table_id            = aws_route_table.private_us_east_1[count.index].id
  destination_cidr_block    = local.az_config["eu-central-1"].cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}

resource "aws_route" "eu_central_1_to_us_east_1" {
  provider                  = aws.eu_central_1
  count                     = 3
  route_table_id            = aws_route_table.private_eu_central_1[count.index].id
  destination_cidr_block    = local.az_config["us-east-1"].cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}

#==============================================================================
# SECURITY GROUPS - US-EAST-1
#==============================================================================

resource "aws_security_group" "alb_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${local.name_prefix}-alb-us-east-1-"
  vpc_id      = aws_vpc.main_us_east_1.id

  # HTTPS inbound from allowed CIDRs only
  ingress {
    description = "HTTPS from allowed CIDRs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # HTTP inbound from allowed CIDRs only (for redirect to HTTPS)
  ingress {
    description = "HTTP from allowed CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-alb-sg-us-east-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${local.name_prefix}-app-us-east-1-"
  vpc_id      = aws_vpc.main_us_east_1.id

  # HTTP from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_us_east_1.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-app-sg-us-east-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

#==============================================================================
# SECURITY GROUPS - EU-CENTRAL-1
#==============================================================================

resource "aws_security_group" "alb_eu_central_1" {
  provider    = aws.eu_central_1
  name_prefix = "${local.name_prefix}-alb-eu-central-1-"
  vpc_id      = aws_vpc.main_eu_central_1.id

  # HTTPS inbound from allowed CIDRs only
  ingress {
    description = "HTTPS from allowed CIDRs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # HTTP inbound from allowed CIDRs only (for redirect to HTTPS)
  ingress {
    description = "HTTP from allowed CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-alb-sg-eu-central-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app_eu_central_1" {
  provider    = aws.eu_central_1
  name_prefix = "${local.name_prefix}-app-eu-central-1-"
  vpc_id      = aws_vpc.main_eu_central_1.id

  # HTTP from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_eu_central_1.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-app-sg-eu-central-1"
  })

  lifecycle {
    create_before_destroy = true
  }
}

#==============================================================================
# SECRETS MANAGER - US-EAST-1
#==============================================================================

resource "aws_secretsmanager_secret" "app_secrets_us_east_1" {
  provider                = aws.us_east_1
  name                    = "${local.name_prefix}-app-secrets-us-east-1"
  description             = "Application secrets for ${var.environment} in us-east-1"
  kms_key_id              = aws_kms_key.main_us_east_1.arn
  recovery_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-app-secrets-us-east-1"
  })
}

resource "aws_secretsmanager_secret_version" "app_secrets_us_east_1" {
  provider  = aws.us_east_1
  secret_id = aws_secretsmanager_secret.app_secrets_us_east_1.id
  secret_string = jsonencode({
    database_url = "postgresql://user:pass@localhost:5432/mydb"
    api_key      = "your-api-key-here"
    jwt_secret   = "your-jwt-secret-here"
  })
}

#==============================================================================
# SECRETS MANAGER - EU-CENTRAL-1
#==============================================================================

resource "aws_secretsmanager_secret" "app_secrets_eu_central_1" {
  provider                = aws.eu_central_1
  name                    = "${local.name_prefix}-app-secrets-eu-central-1"
  description             = "Application secrets for ${var.environment} in eu-central-1"
  kms_key_id              = aws_kms_key.main_eu_central_1.arn
  recovery_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-app-secrets-eu-central-1"
  })
}

resource "aws_secretsmanager_secret_version" "app_secrets_eu_central_1" {
  provider  = aws.eu_central_1
  secret_id = aws_secretsmanager_secret.app_secrets_eu_central_1.id
  secret_string = jsonencode({
    database_url = "postgresql://user:pass@localhost:5432/mydb"
    api_key      = "your-api-key-here"
    jwt_secret   = "your-jwt-secret-here"
  })
}

#==============================================================================
# IAM ROLES AND POLICIES - US-EAST-1
#==============================================================================

resource "aws_iam_role" "app_role_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${var.environment}-app-${random_id.suffix.hex}-"

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

  tags = var.common_tags
}

resource "aws_iam_policy" "app_secrets_policy_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${local.name_prefix}-app-secrets-us-east-1-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_secrets_us_east_1.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main_us_east_1.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.us-east-1.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "app_secrets_us_east_1" {
  provider   = aws.us_east_1
  role       = aws_iam_role.app_role_us_east_1.name
  policy_arn = aws_iam_policy.app_secrets_policy_us_east_1.arn
}

resource "aws_iam_instance_profile" "app_profile_us_east_1" {
  provider    = aws.us_east_1
  name_prefix = "${local.name_prefix}-app-profile-us-east-1-"
  role        = aws_iam_role.app_role_us_east_1.name

  tags = var.common_tags
}

#==============================================================================
# IAM ROLES AND POLICIES - EU-CENTRAL-1
#==============================================================================

resource "aws_iam_role" "app_role_eu_central_1" {
  provider    = aws.eu_central_1
  name_prefix = "${var.environment}-app-${random_id.suffix.hex}-"

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

  tags = var.common_tags
}

resource "aws_iam_policy" "app_secrets_policy_eu_central_1" {
  provider    = aws.eu_central_1
  name_prefix = "${local.name_prefix}-app-secrets-eu-central-1-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_secrets_eu_central_1.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main_eu_central_1.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.eu-central-1.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "app_secrets_eu_central_1" {
  provider   = aws.eu_central_1
  role       = aws_iam_role.app_role_eu_central_1.name
  policy_arn = aws_iam_policy.app_secrets_policy_eu_central_1.arn
}

resource "aws_iam_instance_profile" "app_profile_eu_central_1" {
  provider    = aws.eu_central_1
  name_prefix = "${local.name_prefix}-app-profile-eu-central-1-"
  role        = aws_iam_role.app_role_eu_central_1.name

  tags = var.common_tags
}

#==============================================================================
# CLOUDFRONT DISTRIBUTION
#==============================================================================

#==============================================================================
# CLOUDFRONT DISTRIBUTION
#==============================================================================

locals {
  s3_origin_id = "myS3Origin"
}

resource "aws_cloudfront_distribution" "main" {
  depends_on          = [aws_lb.app_us_east_1, aws_lb.app_eu_central_1, aws_acm_certificate.main, aws_wafv2_web_acl.cloudfront]
  provider            = aws.us_east_1
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = var.cloudfront_price_class
  retain_on_delete    = false
  wait_for_deployment = false
  aliases             = [var.domain_name]
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn

  origin {
    domain_name = aws_lb.app_us_east_1.dns_name
    origin_id   = "us-east-1"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = aws_lb.app_eu_central_1.dns_name
    origin_id   = "eu-central-1"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = var.cloudfront_allowed_methods
    cached_methods   = var.cloudfront_cached_methods
    target_origin_id = var.blue_green_deployment.active_color == "blue" ? "us-east-1" : "eu-central-1"

    forwarded_values {
      query_string = true
      headers      = ["Host"]
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

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.blue_green_deployment.active_color == "blue" ? "us-east-1" : "eu-central-1"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-distribution"
  })
}

#==============================================================================
# ROUTE53 AND ACM CERTIFICATE
#==============================================================================

resource "aws_route53_zone" "main" {
  count = var.create_zone ? 1 : 0
  name  = var.domain_name

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-zone"
  })
}

resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-certificate"
  })
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

#==============================================================================
# DNS Records for Blue-Green Deployment
#==============================================================================

resource "aws_route53_record" "app_blue" {
  zone_id = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
  name    = "blue.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_green" {
  zone_id = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
  name    = "green.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_main" {
  zone_id = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.blue_green_deployment.active_color == "blue" ? aws_route53_record.app_blue.name : aws_route53_record.app_green.name
    zone_id                = var.create_zone ? aws_route53_zone.main[0].id : data.aws_route53_zone.existing[0].id
    evaluate_target_health = true
  }
}

#==============================================================================
# WAF Configuration for CloudFront
#==============================================================================

resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-cloudfront-waf"
  description = "WAF rules for CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "rate-limit"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection prevention
  rule {
    name     = "prevent-sql-injection"
    priority = 2

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
      metric_name                = "${local.name_prefix}-sql-injection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-cloudfront-waf"
  })
}

#==============================================================================
# LAUNCH TEMPLATES AND AUTO SCALING GROUPS
#==============================================================================

# Launch Template - US East 1
resource "aws_launch_template" "app_us_east_1" {
  provider      = aws.us_east_1
  name_prefix   = "${local.name_prefix}-lt-us-east-1-"
  image_id      = data.aws_ami.amazon_linux_us_east_1.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.app_us_east_1.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile_us_east_1.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main_us_east_1.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = "us-east-1"
    environment = var.environment
    secrets_arn = aws_secretsmanager_secret.app_secrets_us_east_1.arn
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-instance-us-east-1"
      Environment = var.environment
      Region = "us-east-1"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-volume-us-east-1"
      Environment = var.environment
      Region = "us-east-1"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-lt-us-east-1"
  })
}

# Launch Template - EU Central 1
resource "aws_launch_template" "app_eu_central_1" {
  provider      = aws.eu_central_1
  name_prefix   = "${local.name_prefix}-lt-eu-central-1-"
  image_id      = data.aws_ami.amazon_linux_eu_central_1.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.app_eu_central_1.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile_eu_central_1.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main_eu_central_1.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = "eu-central-1"
    environment = var.environment
    secrets_arn = aws_secretsmanager_secret.app_secrets_eu_central_1.arn
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-instance-eu-central-1"
      Environment = var.environment
      Region = "eu-central-1"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-volume-eu-central-1"
      Environment = var.environment
      Region = "eu-central-1"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-lt-eu-central-1"
  })
}

# Auto Scaling Group - US East 1 (Blue)
resource "aws_autoscaling_group" "app_blue_us_east_1" {
  provider            = aws.us_east_1
  name                = "${local.name_prefix}-asg-blue-us-east-1"
  vpc_zone_identifier = aws_subnet.private_us_east_1[*].id
  target_group_arns   = [aws_lb_target_group.app_us_east_1.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.blue_green_deployment.active_color == "blue" ? var.asg_desired_capacity : var.asg_min_size

  launch_template {
    id      = aws_launch_template.app_us_east_1.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize", 
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
    triggers = ["tag"]
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-blue-us-east-1"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "us-east-1"
    propagate_at_launch = true
  }

  tag {
    key                 = "Color"
    value               = "blue"
    propagate_at_launch = true
  }

  depends_on = [aws_lb_target_group.app_us_east_1]
}

# Auto Scaling Group - EU Central 1 (Green)
resource "aws_autoscaling_group" "app_green_eu_central_1" {
  provider            = aws.eu_central_1
  name                = "${local.name_prefix}-asg-green-eu-central-1"
  vpc_zone_identifier = aws_subnet.private_eu_central_1[*].id
  target_group_arns   = [aws_lb_target_group.app_eu_central_1.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.blue_green_deployment.active_color == "green" ? var.asg_desired_capacity : var.asg_min_size

  launch_template {
    id      = aws_launch_template.app_eu_central_1.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity", 
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
    triggers = ["tag"]
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-green-eu-central-1"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "eu-central-1"
    propagate_at_launch = true
  }

  tag {
    key                 = "Color"
    value               = "green"
    propagate_at_launch = true
  }

  depends_on = [aws_lb_target_group.app_eu_central_1]
}

# Auto Scaling Policies - US East 1
resource "aws_autoscaling_policy" "scale_up_us_east_1" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-scale-up-us-east-1"
  scaling_adjustment = 2
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.app_blue_us_east_1.name
}

resource "aws_autoscaling_policy" "scale_down_us_east_1" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-scale-down-us-east-1"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.app_blue_us_east_1.name
}

# Auto Scaling Policies - EU Central 1
resource "aws_autoscaling_policy" "scale_up_eu_central_1" {
  provider           = aws.eu_central_1
  name               = "${local.name_prefix}-scale-up-eu-central-1"
  scaling_adjustment = 2
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.app_green_eu_central_1.name
}

resource "aws_autoscaling_policy" "scale_down_eu_central_1" {
  provider           = aws.eu_central_1
  name               = "${local.name_prefix}-scale-down-eu-central-1"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.app_green_eu_central_1.name
}

# CloudWatch Alarms - US East 1
resource "aws_cloudwatch_metric_alarm" "high_cpu_us_east_1" {
  provider            = aws.us_east_1
  alarm_name          = "${local.name_prefix}-high-cpu-us-east-1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_us_east_1.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_blue_us_east_1.name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu_us_east_1" {
  provider            = aws.us_east_1
  alarm_name          = "${local.name_prefix}-low-cpu-us-east-1"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "25"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_us_east_1.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_blue_us_east_1.name
  }

  tags = var.common_tags
}

# CloudWatch Alarms - EU Central 1
resource "aws_cloudwatch_metric_alarm" "high_cpu_eu_central_1" {
  provider            = aws.eu_central_1
  alarm_name          = "${local.name_prefix}-high-cpu-eu-central-1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_eu_central_1.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_green_eu_central_1.name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu_eu_central_1" {
  provider            = aws.eu_central_1
  alarm_name          = "${local.name_prefix}-low-cpu-eu-central-1"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "25"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_eu_central_1.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_green_eu_central_1.name
  }

  tags = var.common_tags
}

#==============================================================================
# APPLICATION LOAD BALANCERS
#==============================================================================

# US East Load Balancer
resource "aws_lb" "app_us_east_1" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-alb-us-east-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_us_east_1.id]
  subnets            = aws_subnet.public_us_east_1[*].id

  enable_deletion_protection = true
  enable_http2               = true
  idle_timeout               = 60

  tags = merge(var.common_tags, {
    Name   = "${local.name_prefix}-alb-us-east-1"
    Region = "us-east-1"
  })
}

resource "aws_lb_listener" "https_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.app_us_east_1.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_us_east_1.arn
  }
}

resource "aws_lb_listener" "http_us_east_1" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.app_us_east_1.arn
  port              = 80
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

resource "aws_lb_target_group" "app_us_east_1" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-tg-us-east-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_us_east_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 15
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.common_tags, {
    Name   = "${local.name_prefix}-tg-us-east-1"
    Region = "us-east-1"
  })
}

# EU Central Load Balancer
resource "aws_lb" "app_eu_central_1" {
  provider           = aws.eu_central_1
  name               = "${local.name_prefix}-alb-eu-central-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_eu_central_1.id]
  subnets            = aws_subnet.public_eu_central_1[*].id

  enable_deletion_protection = true
  enable_http2               = true
  idle_timeout               = 60

  tags = merge(var.common_tags, {
    Name   = "${local.name_prefix}-alb-eu-central-1"
    Region = "eu-central-1"
  })
}

resource "aws_lb_listener" "https_eu_central_1" {
  provider          = aws.eu_central_1
  load_balancer_arn = aws_lb.app_eu_central_1.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_eu_central_1.arn
  }
}

resource "aws_lb_listener" "http_eu_central_1" {
  provider          = aws.eu_central_1
  load_balancer_arn = aws_lb.app_eu_central_1.arn
  port              = 80
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

resource "aws_lb_target_group" "app_eu_central_1" {
  provider    = aws.eu_central_1
  name        = "${local.name_prefix}-tg-eu-central-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main_eu_central_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 15
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.common_tags, {
    Name   = "${local.name_prefix}-tg-eu-central-1"
    Region = "eu-central-1"
  })
}

#==============================================================================
# CLOUDTRAIL AUDIT LOGGING
#==============================================================================

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  provider = aws.us_east_1
  bucket   = "${local.name_prefix}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}-${random_id.suffix.hex}"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:${data.aws_partition.current.partition}:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-trail"
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
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:${data.aws_partition.current.partition}:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-trail"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs]
}

# CloudTrail - Multi-region trail with CloudWatch integration
resource "aws_cloudtrail" "main" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-trail"
  s3_bucket_name     = aws_s3_bucket.cloudtrail_logs.id
  s3_key_prefix      = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main_us_east_1.arn
  
  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.cloudtrail.arn
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:${data.aws_partition.current.partition}:lambda:*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs,
    aws_iam_role_policy.cloudtrail_cloudwatch_logs_policy
  ]

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  provider          = aws.us_east_1
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_us_east_1.arn

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-logs"
  })
}

# IAM role for CloudTrail CloudWatch integration
resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-cloudtrail-cloudwatch-role"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_logs_policy" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-cloudtrail-cloudwatch-logs-policy"
  role     = aws_iam_role.cloudtrail_cloudwatch_role.id

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

