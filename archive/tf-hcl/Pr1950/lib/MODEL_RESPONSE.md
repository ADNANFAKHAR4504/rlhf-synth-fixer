## provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "iac-aws-nova-model-breaking-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "iac-aws-nova-model-breaking-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Project     = "iac-aws-nova-model-breaking"
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Project     = "iac-aws-nova-model-breaking"
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "global"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "iac-aws-nova-model-breaking"
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "terraform"
    }
  }
}
```

## lib/tap_stack.tf

```hcl
# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
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

# Locals
locals {
  project_name = "iac-aws-nova-model-breaking"

  common_tags = {
    Project     = local.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "terraform"
  }

  primary_azs = ["${var.primary_region}a", "${var.primary_region}b"]
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

  description             = "KMS key for ${local.project_name}-${var.environment}"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  provider = aws.primary

  name          = "alias/${local.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# Secrets Manager for DB password
resource "aws_secretsmanager_secret" "db_password" {
  provider = aws.primary

  name        = "${local.project_name}-${var.environment}-db-password"
  description = "Database password for ${local.project_name}"
  kms_key_id  = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-db-secret"
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
    Name = "${local.project_name}-${var.environment}-vpc-primary"
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary

  vpc_id = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-igw-primary"
  })
}

# NAT Gateway EIPs - Primary
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = 2

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-eip-nat-primary-${count.index + 1}"
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
    Name = "${local.project_name}-${var.environment}-public-subnet-primary-${count.index + 1}"
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
    Name = "${local.project_name}-${var.environment}-private-subnet-primary-${count.index + 1}"
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
    Name = "${local.project_name}-${var.environment}-database-subnet-primary-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways - Primary
resource "aws_nat_gateway" "primary" {
  provider = aws.primary
  count    = 2

  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-nat-gateway-primary-${count.index + 1}"
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
    Name = "${local.project_name}-${var.environment}-rt-public-primary"
  })
}

resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 2

  vpc_id = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-rt-private-primary-${count.index + 1}"
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

  name_prefix = "${local.project_name}-${var.environment}-web-primary-"
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
    Name = "${local.project_name}-${var.environment}-sg-web-primary"
  })
}

resource "aws_security_group" "database_primary" {
  provider = aws.primary

  name_prefix = "${local.project_name}-${var.environment}-database-primary-"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_primary.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-sg-database-primary"
  })
}

# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${local.project_name}-${var.environment}-db-subnet-group-primary"
  subnet_ids = aws_subnet.database_primary[*].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-db-subnet-group-primary"
  })
}

# RDS Instance - Primary
resource "aws_db_instance" "primary" {
  provider = aws.primary

  identifier     = "${local.project_name}-${var.environment}-db-primary"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.main.arn

  db_name  = "appdb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-rds-primary"
  })
}

# EC2 Instance - Primary
resource "aws_instance" "web_primary" {
  provider = aws.primary
  count    = 2

  ami           = data.aws_ami.amazon_linux_primary.id
  instance_type = var.ec2_instance_type

  subnet_id                   = aws_subnet.private_primary[count.index].id
  vpc_security_group_ids      = [aws_security_group.web_primary.id]
  associate_public_ip_address = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.main.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-web-primary-${count.index + 1}"
  })
}

# SECONDARY REGION RESOURCES (Similar structure)
resource "aws_vpc" "secondary" {
  provider = aws.secondary

  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-vpc-secondary"
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

  name = "${local.project_name}-${var.environment}.local"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-${var.environment}-hosted-zone"
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  provider = aws.global

  origin {
    domain_name = aws_route53_zone.main.name
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
    Name = "${local.project_name}-${var.environment}-cloudfront"
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

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = aws_db_instance.primary.endpoint
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.key_id
}
```
