#==============================================================================
# VARIABLES
#==============================================================================

variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "stage", "prod"], var.environment)
    error_message = "Environment must be one of: dev, stage, prod."
  }
}

variable "regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "eu-central-1"]
}

variable "allowed_ingress_cidrs" {
  description = "List of CIDR blocks allowed for ingress"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Owner       = "platform-team"
    Purpose     = "multi-region-web-app"
    Environment = "dev"
    CostCenter  = "engineering"
    Project     = "tap-stack"
  }
}

variable "active_color" {
  description = "Active deployment color for blue-green deployment"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.active_color)
    error_message = "Active color must be either 'blue' or 'green'."
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "tap-stack.example.com"
}

#==============================================================================
# LOCAL VALUES
#==============================================================================

locals {
  name_prefix = "${var.environment}-tap-stack"
  
  # AZ configuration per region
  az_config = {
    "us-east-1" = {
      azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
      cidr = "10.0.0.0/16"
    }
    "eu-central-1" = {
      azs = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
      cidr = "10.1.0.0/16"
    }
  }
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
  description             = "KMS key for ${var.environment} in us-east-1"
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

# VPC
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
  name_prefix = "${local.name_prefix}-app-role-us-east-1-"

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
  name_prefix = "${local.name_prefix}-app-role-eu-central-1-"

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
  role       = aws_iam_role.app_role_eu_central