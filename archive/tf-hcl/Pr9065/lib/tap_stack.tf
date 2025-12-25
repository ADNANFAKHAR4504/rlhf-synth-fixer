# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# LocalStack compatibility flags
variable "enable_ec2" {
  description = "Enable EC2 instance creation (set to false for LocalStack Community)"
  type        = bool
  default     = false
}

variable "enable_rds" {
  description = "Enable RDS instance creation (set to false for LocalStack Community)"
  type        = bool
  default     = false
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway creation (set to false for LocalStack Community)"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution (set to false for LocalStack Community)"
  type        = bool
  default     = false
}

# Locals
locals {
  project_name = "iac-aws-nova-model-breaking"
  env_suffix   = var.environment_suffix != "" ? "-${var.environment_suffix}" : ""
  name_prefix  = "${local.project_name}${local.env_suffix}"

  common_tags = {
    Project           = local.project_name
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    Owner             = var.owner
    ManagedBy         = "terraform"
  }

  primary_azs   = ["${var.primary_region}a", "${var.primary_region}b"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}b"]
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  provider = aws.primary

  description             = "KMS key for ${local.name_prefix}-${var.environment}"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  provider = aws.primary

  name          = "alias/${local.name_prefix}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# Secrets Manager for DB password
resource "aws_secretsmanager_secret" "db_password" {
  provider = aws.primary

  name        = "${local.name_prefix}-${var.environment}-db-password"
  description = "Database password for ${local.name_prefix}"
  kms_key_id  = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-db-secret"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  provider = aws.primary

  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# PRIMARY REGION RESOURCES
# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider = aws.primary

  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-vpc-primary"
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary

  vpc_id = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-igw-primary"
  })
}

# NAT Gateway EIPs - Primary
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = var.enable_nat_gateway ? 2 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-eip-nat-primary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Public Subnets - Primary
resource "aws_subnet" "public_primary" {
  provider = aws.primary
  count    = 2

  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-public-subnet-primary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Primary
resource "aws_subnet" "private_primary" {
  provider = aws.primary
  count    = 2

  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index + 10)
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-private-subnet-primary-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets - Primary
resource "aws_subnet" "database_primary" {
  provider = aws.primary
  count    = 2

  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index + 20)
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-database-subnet-primary-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways - Primary
resource "aws_nat_gateway" "primary" {
  provider = aws.primary
  count    = var.enable_nat_gateway ? 2 : 0

  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-nat-gateway-primary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route Tables - Primary
resource "aws_route_table" "public_primary" {
  provider = aws.primary

  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rt-public-primary"
  })
}

resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 2

  vpc_id = aws_vpc.primary.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.primary[count.index].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rt-private-primary-${count.index + 1}"
  })
}

# Route Table Associations - Primary
resource "aws_route_table_association" "public_primary" {
  provider = aws.primary
  count    = 2

  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  provider = aws.primary
  count    = 2

  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# Security Groups - Primary
resource "aws_security_group" "web_primary" {
  provider = aws.primary

  name_prefix = "${local.name_prefix}-${var.environment}-web-primary-"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-sg-web-primary"
  })
}

resource "aws_security_group" "database_primary" {
  provider = aws.primary

  name_prefix = "${local.name_prefix}-${var.environment}-database-primary-"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_primary.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-sg-database-primary"
  })
}

# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary" {
  provider = aws.primary
  count    = var.enable_rds ? 1 : 0

  name       = "${local.name_prefix}-${var.environment}-db-subnet-group-primary"
  subnet_ids = aws_subnet.database_primary[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-db-subnet-group-primary"
  })
}

# RDS Instance - Primary
resource "aws_db_instance" "primary" {
  provider = aws.primary
  count    = var.enable_rds ? 1 : 0

  identifier     = "${local.name_prefix}-${var.environment}-db-primary"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "appdb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rds-primary"
  })
}

# EC2 Instance - Primary
resource "aws_instance" "web_primary" {
  provider = aws.primary
  count    = var.enable_ec2 ? 2 : 0

  ami           = data.aws_ami.amazon_linux_primary.id
  instance_type = var.ec2_instance_type

  subnet_id                   = aws_subnet.private_primary[count.index].id
  vpc_security_group_ids      = [aws_security_group.web_primary.id]
  associate_public_ip_address = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = false
    # KMS encryption disabled for LocalStack compatibility
    # kms_key_id  = aws_kms_key.main.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-web-primary-${count.index + 1}"
  })
}

# SECONDARY REGION RESOURCES
# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider = aws.secondary

  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-vpc-secondary"
  })
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary

  vpc_id = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-igw-secondary"
  })
}

# NAT Gateway EIPs - Secondary
resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  count    = var.enable_nat_gateway ? 2 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-eip-nat-secondary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Public Subnets - Secondary
resource "aws_subnet" "public_secondary" {
  provider = aws.secondary
  count    = 2

  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 8, count.index)
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-public-subnet-secondary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Secondary
resource "aws_subnet" "private_secondary" {
  provider = aws.secondary
  count    = 2

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, count.index + 10)
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-private-subnet-secondary-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets - Secondary
resource "aws_subnet" "database_secondary" {
  provider = aws.secondary
  count    = 2

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, count.index + 20)
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-database-subnet-secondary-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways - Secondary
resource "aws_nat_gateway" "secondary" {
  provider = aws.secondary
  count    = var.enable_nat_gateway ? 2 : 0

  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-nat-gateway-secondary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary

  vpc_id = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rt-public-secondary"
  })
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 2

  vpc_id = aws_vpc.secondary.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.secondary[count.index].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rt-private-secondary-${count.index + 1}"
  })
}

# Route Table Associations - Secondary
resource "aws_route_table_association" "public_secondary" {
  provider = aws.secondary
  count    = 2

  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  provider = aws.secondary
  count    = 2

  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# Security Groups - Secondary
resource "aws_security_group" "web_secondary" {
  provider = aws.secondary

  name_prefix = "${local.name_prefix}-${var.environment}-web-secondary-"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-sg-web-secondary"
  })
}

resource "aws_security_group" "database_secondary" {
  provider = aws.secondary

  name_prefix = "${local.name_prefix}-${var.environment}-database-secondary-"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_secondary.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-sg-database-secondary"
  })
}

# KMS Key for encryption - Secondary
resource "aws_kms_key" "secondary" {
  provider = aws.secondary

  description             = "KMS key for ${local.name_prefix}-${var.environment}-secondary"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-kms-key-secondary"
  })
}

resource "aws_kms_alias" "secondary" {
  provider = aws.secondary

  name          = "alias/${local.name_prefix}-${var.environment}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# DB Subnet Group - Secondary
resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary
  count    = var.enable_rds ? 1 : 0

  name       = "${local.name_prefix}-${var.environment}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.database_secondary[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-db-subnet-group-secondary"
  })
}

# RDS Instance - Secondary
resource "aws_db_instance" "secondary" {
  provider = aws.secondary
  count    = var.enable_rds ? 1 : 0

  identifier     = "${local.name_prefix}-${var.environment}-db-secondary"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.secondary.arn

  db_name  = "appdb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary[0].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-rds-secondary"
  })
}

# EC2 Instances - Secondary
resource "aws_instance" "web_secondary" {
  provider = aws.secondary
  count    = var.enable_ec2 ? 2 : 0

  ami           = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.ec2_instance_type

  subnet_id                   = aws_subnet.private_secondary[count.index].id
  vpc_security_group_ids      = [aws_security_group.web_secondary.id]
  associate_public_ip_address = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = false
    # KMS encryption disabled for LocalStack compatibility
    # kms_key_id  = aws_kms_key.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-web-secondary-${count.index + 1}"
  })
}

# Data sources
data "aws_ami" "amazon_linux_primary" {
  provider = aws.primary

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_secondary" {
  provider = aws.secondary

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.global
  count    = var.enable_cloudfront ? 1 : 0

  name = "${local.name_prefix}-${var.environment}.local"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-hosted-zone"
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  provider = aws.global
  count    = var.enable_cloudfront ? 1 : 0

  origin {
    domain_name = aws_route53_zone.main[0].name
    origin_id   = "primary"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled = true

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "primary"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${var.environment}-cloudfront"
  })
}

# Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.private_primary[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.private_secondary[*].id
}

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = var.enable_rds ? aws_db_instance.primary[0].endpoint : ""
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint in secondary region"
  value       = var.enable_rds ? aws_db_instance.secondary[0].endpoint : ""
}

# LocalStack compatibility outputs
output "enable_ec2" {
  description = "Whether EC2 instances are enabled"
  value       = var.enable_ec2
}

output "enable_rds" {
  description = "Whether RDS instances are enabled"
  value       = var.enable_rds
}

output "enable_nat_gateway" {
  description = "Whether NAT Gateways are enabled"
  value       = var.enable_nat_gateway
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.main[0].domain_name : ""
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.enable_cloudfront ? aws_route53_zone.main[0].zone_id : ""
}

output "enable_cloudfront" {
  description = "Whether CloudFront distribution is enabled"
  value       = var.enable_cloudfront
}

output "primary_kms_key_id" {
  description = "KMS key ID for encryption in primary region"
  value       = aws_kms_key.main.key_id
}

output "secondary_kms_key_id" {
  description = "KMS key ID for encryption in secondary region"
  value       = aws_kms_key.secondary.key_id
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB password"
  value       = aws_secretsmanager_secret.db_password.arn
}