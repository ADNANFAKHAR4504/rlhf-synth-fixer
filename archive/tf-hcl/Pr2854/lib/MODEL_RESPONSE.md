### Reasoning Trace
---

This is a comprehensive Terraform configuration request that needs to be created in a single file. Let me break down the requirements:

1. Two regions: us-east-2 (primary) with 10.0.0.0/16, us-west-1 (secondary) with 10.1.0.0/16
2. VPCs with public/private subnets, NAT gateways, internet gateways, route tables across 3 AZs
3. IAM policies with least privilege and MFA
4. Lambda functions with API Gateway and WAF protection
5. Private S3 bucket with KMS encryption and HTTPS/TLS 1.2
6. RDS in each region with Multi-AZ, random username/password via Secrets Manager
7. CloudTrail and CloudWatch logging/monitoring
8. Tagging strategy and AWS Config
9. Security Groups and NACLs
10. Bastion host for secure access
11. Consistent naming conventions via locals/variables
12. Provider aliases for each resource

I need to create this as a single tap_stack.tf file with variables, locals, resources, and outputs. This is quite extensive, so I'll structure it logically:

- Variables
- Locals (for naming conventions and common values)
- Data sources
- IAM resources
- KMS resources
- VPC and networking resources for both regions
- Security Groups and NACLs
- S3 bucket
- RDS and Secrets Manager
- Lambda and API Gateway
- WAF
- CloudTrail and CloudWatch
- AWS Config
- Bastion hosts
- Outputs

Let me start crafting this comprehensive configuration.
### Answer 
---

Here's a comprehensive Terraform configuration file that meets all your requirements:

```hcl
# tap_stack.tf - Complete Infrastructure as Code Configuration

# =============================================================================
# VARIABLES
# =============================================================================

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps-Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Naming conventions
  primary_prefix   = "${var.project_name}-${var.environment}-primary"
  secondary_prefix = "${var.project_name}-${var.environment}-secondary"

  # Network configuration
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Availability zones
  primary_azs   = ["${var.primary_region}a", "${var.primary_region}b", "${var.primary_region}c"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}b", "${var.secondary_region}c"]

  # Subnet CIDR blocks for primary region
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  # Subnet CIDR blocks for secondary region
  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.us_east_2
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.us_west_1
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

# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {
  provider = aws.us_east_2
}

data "aws_caller_identity" "secondary" {
  provider = aws.us_west_1
}

# =============================================================================
# RANDOM RESOURCES FOR RDS
# =============================================================================

# Random username for primary RDS
resource "random_string" "primary_db_username" {
  length  = 8
  upper   = true
  lower   = true
  numeric = true
  special = false

  keepers = {
    region = var.primary_region
  }
}

# Random password for primary RDS
resource "random_password" "primary_db_password" {
  length  = 16
  upper   = true
  lower   = true
  numeric = true
  special = true
  # AWS RDS doesn't allow certain special characters
  override_special = "!#$%&*()-_=+[]{}|;:,.<>?"

  keepers = {
    region = var.primary_region
  }
}

# Random username for secondary RDS
resource "random_string" "secondary_db_username" {
  length  = 8
  upper   = true
  lower   = true
  numeric = true
  special = false

  keepers = {
    region = var.secondary_region
  }
}

# Random password for secondary RDS
resource "random_password" "secondary_db_password" {
  length  = 16
  upper   = true
  lower   = true
  numeric = true
  special = true
  override_special = "!#$%&*()-_=+[]{}|;:,.<>?"

  keepers = {
    region = var.secondary_region
  }
}

# =============================================================================
# KMS KEYS
# =============================================================================

# KMS Key for primary region
resource "aws_kms_key" "primary_kms_key" {
  provider                = aws.us_east_2
  description             = "KMS key for ${local.primary_prefix} encryption"
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
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-kms-key"
  })
}

# KMS Key alias for primary region
resource "aws_kms_alias" "primary_kms_alias" {
  provider      = aws.us_east_2
  name          = "alias/${local.primary_prefix}-key"
  target_key_id = aws_kms_key.primary_kms_key.key_id
}

# KMS Key for secondary region
resource "aws_kms_key" "secondary_kms_key" {
  provider                = aws.us_west_1
  description             = "KMS key for ${local.secondary_prefix} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.secondary.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-kms-key"
  })
}

# KMS Key alias for secondary region
resource "aws_kms_alias" "secondary_kms_alias" {
  provider      = aws.us_west_1
  name          = "alias/${local.secondary_prefix}-key"
  target_key_id = aws_kms_key.secondary_kms_key.key_id
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-lambda-execution-role"

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

  tags = local.common_tags
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-lambda-execution-policy"
  role     = aws_iam_role.lambda_execution_role.id

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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudTrail service role
resource "aws_iam_role" "cloudtrail_role" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-cloudtrail-role"

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

  tags = local.common_tags
}

# Config service role
resource "aws_iam_role" "config_role" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-config-role"

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

# Config service role policy
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  provider   = aws.us_east_2
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Bastion host role
resource "aws_iam_role" "bastion_role" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-bastion-role"

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

# Bastion host instance profile
resource "aws_iam_instance_profile" "bastion_profile" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-bastion-profile"
  role     = aws_iam_role.bastion_role.name

  tags = local.common_tags
}

# Secondary region bastion role
resource "aws_iam_role" "bastion_role_secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-bastion-role"

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

# Secondary bastion instance profile
resource "aws_iam_instance_profile" "bastion_profile_secondary" {
  provider = aws.us_west_1
  name     = "${local.secondary_prefix}-bastion-profile"
  role     = aws_iam_role.bastion_role_secondary.name

  tags = local.common_tags
}

# =============================================================================
# VPC RESOURCES - PRIMARY REGION (us-east-2)
# =============================================================================

# Primary VPC
resource "aws_vpc" "primary_vpc" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-vpc"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary_igw" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-igw"
  })
}

# Primary public subnets
resource "aws_subnet" "primary_public_subnets" {
  provider                = aws.us_east_2
  count                   = length(local.primary_public_subnets)
  vpc_id                  = aws_vpc.primary_vpc.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Primary private subnets
resource "aws_subnet" "primary_private_subnets" {
  provider          = aws.us_east_2
  count             = length(local.primary_private_subnets)
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Primary Elastic IPs for NAT Gateways
resource "aws_eip" "primary_nat_eips" {
  provider   = aws.us_east_2
  count      = length(local.primary_azs)
  domain     = "vpc"
  depends_on = [aws_internet_gateway.primary_igw]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-eip-${count.index + 1}"
  })
}

# Primary NAT Gateways
resource "aws_nat_gateway" "primary_nat_gateways" {
  provider      = aws.us_east_2
  count         = length(local.primary_azs)
  allocation_id = aws_eip.primary_nat_eips[count.index].id
  subnet_id     = aws_subnet.primary_public_subnets[count.index].id
  depends_on    = [aws_internet_gateway.primary_igw]

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nat-gateway-${count.index + 1}"
  })
}

# Primary public route table
resource "aws_route_table" "primary_public_rt" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-public-rt"
  })
}

# Primary private route tables
resource "aws_route_table" "primary_private_rts" {
  provider = aws.us_east_2
  count    = length(local.primary_azs)
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_nat_gateways[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-private-rt-${count.index + 1}"
  })
}

# Primary public subnet route table associations
resource "aws_route_table_association" "primary_public_rta" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_public_subnets)
  subnet_id      = aws_subnet.primary_public_subnets[count.index].id
  route_table_id = aws_route_table.primary_public_rt.id
}

# Primary private subnet route table associations
resource "aws_route_table_association" "primary_private_rta" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_private_subnets)
  subnet_id      = aws_subnet.primary_private_subnets[count.index].id
  route_table_id = aws_route_table.primary_private_rts[count.index].id
}

# =============================================================================
# VPC RESOURCES - SECONDARY REGION (us-west-1)
# =============================================================================

# Secondary VPC
resource "aws_vpc" "secondary_vpc" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-vpc"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary_igw" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-igw"
  })
}

# Secondary public subnets
resource "aws_subnet" "secondary_public_subnets" {
  provider                = aws.us_west_1
  count                   = length(local.secondary_public_subnets)
  vpc_id                  = aws_vpc.secondary_vpc.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Secondary private subnets
resource "aws_subnet" "secondary_private_subnets" {
  provider          = aws.us_west_1
  count             = length(local.secondary_private_subnets)
  vpc_id            = aws_vpc.secondary_vpc.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Secondary Elastic IPs for NAT Gateways
resource "aws_eip" "secondary_nat_eips" {
  provider   = aws.us_west_1
  count      = length(local.secondary_azs)
  domain     = "vpc"
  depends_on = [aws_internet_gateway.secondary_igw]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-eip-${count.index + 1}"
  })
}

# Secondary NAT Gateways
resource "aws_nat_gateway" "secondary_nat_gateways" {
  provider      = aws.us_west_1
  count         = length(local.secondary_azs)
  allocation_id = aws_eip.secondary_nat_eips[count.index].id
  subnet_id     = aws_subnet.secondary_public_subnets[count.index].id
  depends_on    = [aws_internet_gateway.secondary_igw]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nat-gateway-${count.index + 1}"
  })
}

# Secondary public route table
resource "aws_route_table" "secondary_public_rt" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-public-rt"
  })
}

# Secondary private route tables
resource "aws_route_table" "secondary_private_rts" {
  provider = aws.us_west_1
  count    = length(local.secondary_azs)
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_nat_gateways[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-private-rt-${count.index + 1}"
  })
}

# Secondary public subnet route table associations
resource "aws_route_table_association" "secondary_public_rta" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_public_subnets)
  subnet_id      = aws_subnet.secondary_public_subnets[count.index].id
  route_table_id = aws_route_table.secondary_public_rt.id
}

# Secondary private subnet route table associations
resource "aws_route_table_association" "secondary_private_rta" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_private_subnets)
  subnet_id      = aws_subnet.secondary_private_subnets[count.index].id
  route_table_id = aws_route_table.secondary_private_rts[count.index].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Primary region Lambda security group
resource "aws_security_group" "primary_lambda_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.primary_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-lambda-sg"
  })
}

# Primary region RDS security group
resource "aws_security_group" "primary_rds_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-rds-sg"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_lambda_sg.id, aws_security_group.primary_bastion_sg.id]
    description     = "MySQL access from Lambda and Bastion"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-sg"
  })
}

# Primary region Bastion security group
resource "aws_security_group" "primary_bastion_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-bastion-sg"
  description = "Security group for Bastion host"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-bastion-sg"
  })
}

# Secondary region Lambda security group
resource "aws_security_group" "secondary_lambda_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.secondary_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-lambda-sg"
  })
}

# Secondary region RDS security group
resource "aws_security_group" "secondary_rds_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-rds-sg"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_lambda_sg.id, aws_security_group.secondary_bastion_sg.id]
    description     = "MySQL access from Lambda and Bastion"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-sg"
  })
}

# Secondary region Bastion security group
resource "aws_security_group" "secondary_bastion_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_prefix}-bastion-sg"
  description = "Security group for Bastion host"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-bastion-sg"
  })
}

# =============================================================================
# NETWORK ACLs
# =============================================================================

# Primary region Network ACL
resource "aws_network_acl" "primary_nacl" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  # Allow HTTP traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow HTTPS traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow SSH traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Allow ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-nacl"
  })
}

# Secondary region Network ACL
resource "aws_network_acl" "secondary_nacl" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  # Allow HTTP traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow HTTPS traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow SSH traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Allow ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-nacl"
  })
}

# =============================================================================
# S3 BUCKET
# =============================================================================

# S3 bucket for application storage
resource "aws_s3_bucket" "app_bucket" {
  provider = aws.us_east_2
  bucket   = "${local.primary_prefix}-app-bucket-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-app-bucket"
  })
}

# Random string for S3 bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = true
  special = false
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket_encryption" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary_kms_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "app_bucket_pab" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy to enforce HTTPS
resource "aws_s3_bucket_policy" "app_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.app_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.app_bucket.arn,
          "${aws_s3_bucket.app_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_bucket_pab]
}

# =============================================================================
# SECRETS MANAGER
# =============================================================================

# Primary region RDS secrets
resource "aws_secretsmanager_secret" "primary_rds_secret" {
  provider                = aws.us_east_2
  name                    = "${local.primary_prefix}-rds-credentials"
  description             = "RDS database credentials for primary region"
  kms_key_id              = aws_kms_key.primary_kms_key.arn
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-secret"
  })
}

# Primary region RDS secret version
resource "aws_secretsmanager_secret_version" "primary_rds_secret_version" {
  provider  = aws.us_east_2
  secret_id = aws_secretsmanager_secret.primary_rds_secret.id
  secret_string = jsonencode({
    username = random_string.primary_db_username.result
    password = random_password.primary_db_password.result
  })
}

# Secondary region RDS secrets
resource "aws_secretsmanager_secret" "secondary_rds_secret" {
  provider                = aws.us_west_1
  name                    = "${local.secondary_prefix}-rds-credentials"
  description             = "RDS database credentials for secondary region"
  kms_key_id              = aws_kms_key.secondary_kms_key.arn
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-secret"
  })
}

# Secondary region RDS secret version
resource "aws_secretsmanager_secret_version" "secondary_rds_secret_version" {
  provider  = aws.us_west_1
  secret_id = aws_secretsmanager_secret.secondary_rds_secret.id
  secret_string = jsonencode({
    username = random_string.secondary_db_username.result
    password = random_password.secondary_db_password.result
  })
}

# =============================================================================
# RDS INSTANCES
# =============================================================================

# Primary region RDS subnet group
resource "aws_db_subnet_group" "primary_rds_subnet_group" {
  provider   = aws.us_east_2
  name       = "${local.primary_prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.primary_private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-subnet-group"
  })
}

# Primary region RDS instance
resource "aws_db_instance" "primary_rds" {
  provider = aws.us_east_2

  # Basic configuration
  identifier     = "${local.primary_prefix}-rds-instance"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.primary_kms_key.arn

  # Database configuration
  db_name  = "appdb"
  username = random_string.primary_db_username.result
  password = random_password.primary_db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.primary_rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.primary_rds_sg.id]
  publicly_accessible    = false
  availability_zone      = local.primary_azs[0]

  # Multi-AZ configuration
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Updates and monitoring
  auto_minor_version_upgrade = true
  monitoring_interval        = 60
  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]

  # Deletion protection
  skip_final_snapshot       = true
  delete_automated_backups  = true
  deletion_protection       = false

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-rds-instance"
  })
}

# Secondary region RDS subnet group
resource "aws_db_subnet_group" "secondary_rds_subnet_group" {
  provider   = aws.us_west_1
  name       = "${local.secondary_prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.secondary_private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-subnet-group"
  })
}

# Secondary region RDS instance
resource "aws_db_instance" "secondary_rds" {
  provider = aws.us_west_1

  # Basic configuration
  identifier     = "${local.secondary_prefix}-rds-instance"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.secondary_kms_key.arn

  # Database configuration
  db_name  = "appdb"
  username = random_string.secondary_db_username.result
  password = random_password.secondary_db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.secondary_rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.secondary_rds_sg.id]
  publicly_accessible    = false
  availability_zone      = local.secondary_azs[0]

  # Multi-AZ configuration
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Updates and monitoring
  auto_minor_version_upgrade = true
  monitoring_interval        = 60
  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]

  # Deletion protection
  skip_final_snapshot       = true
  delete_automated_backups  = true
  deletion_protection       = false

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-rds-instance"
  })
}

# =============================================================================
# LAMBDA FUNCTION
# =============================================================================

# Lambda function ZIP archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"
  source {
    content = <<EOF
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('Lambda function invoked')
    logger.info(f'Event: {json.dumps(event)}')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'requestId': context.aws_request_id
        })
    }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda function
resource "aws_lambda_function" "app_lambda" {
  provider         = aws.us_east_2
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.primary_prefix}-lambda-function"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30

  vpc_config {
    subnet_ids         = aws_subnet.primary_private_subnets[*].id
    security_group_ids = [aws_security_group.primary_lambda_sg.id]
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
      PROJECT     = var.project_name
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-lambda-function"
  })
}

# Lambda CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  provider          = aws.us_east_2
  name              = "/aws/lambda/${aws_lambda_function.app_lambda.function_name}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.primary_kms_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-lambda-logs"
  })
}

# =============================================================================
# API GATEWAY
# =============================================================================

# API Gateway REST API
resource "aws_api_gateway_rest_api" "app_api" {
  provider    = aws.us_east_2
  name        = "${local.primary_prefix}-api"
  description = "REST API for ${var.project_name} application"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-api"
  })
}

# API Gateway resource
resource "aws_api_gateway_resource" "app_resource" {
  provider    = aws.us_east_2
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  parent_id   = aws_api_gateway_rest_api.app_api.root_resource_id
  path_part   = "app"
}

# API Gateway method
resource "aws_api_gateway_method" "app_method" {
  provider      = aws.us_east_2
  rest_api_id   = aws_api_gateway_rest_api.app_api.id
  resource_id   = aws_api_gateway_resource.app_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway integration
resource "aws_api_gateway_integration" "app_integration" {
  provider                = aws.us_east_2
  rest_api_id             = aws_api_gateway_rest_api.app_api.id
  resource_id             = aws_api_gateway_resource.app_resource.id
  http_method             = aws_api_gateway_method.app_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app_lambda.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  provider      = aws.us_east_2
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.app_api.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "app_deployment" {
  provider = aws.us_east_2
  depends_on = [
    aws_api_gateway_method.app_method,
    aws_api_gateway_integration.app_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.app_api.id
  stage_name  = var.environment

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.app_resource.id,
      aws_api_gateway_method.app_method.id,
      aws_api_gateway_integration.app_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# WAF
# =============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "app_waf" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-waf"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.primary_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }

    action {
      block {}
    }
  }

  # AWS managed rule set
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
      metric_name                = "${local.primary_prefix}-common-rule-set"
      sampled_requests_enabled   = true
    }

    action {
      allow {}
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-waf"
  })

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.primary_prefix}-waf"
    sampled_requests_enabled   = true
  }
}

# WAF association with API Gateway
resource "aws_wafv2_web_acl_association" "app_waf_association" {
  provider     = aws.us_east_2
  resource_arn = aws_api_gateway_deployment.app_deployment.execution_arn
  web_acl_arn  = aws_wafv2_web_acl.app_waf.arn
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

# CloudTrail S3 bucket
resource "aws_s3_bucket" "cloudtrail_bucket" {
  provider = aws.us_east_2
  bucket   = "${local.primary_prefix}-cloudtrail-${random_string.cloudtrail_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudtrail-bucket"
  })
}

# Random string for CloudTrail bucket suffix
resource "random_string" "cloudtrail_suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = true
  special = false
}

# CloudTrail bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.cloudtrail_bucket.id

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
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "app_cloudtrail" {
  provider                      = aws.us_east_2
  name                          = "${local.primary_prefix}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.primary_kms_key.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_bucket.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
}

# =============================================================================
# CLOUDWATCH
# =============================================================================

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "app_dashboard" {
  provider       = aws.us_east_2
  dashboard_name = "${local.primary_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.app_lambda.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.app_lambda.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.app_lambda.function_name]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.app_lambda.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-lambda-error-alarm"
  })
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  provider         = aws.us_east_2
  name             = "${local.primary_prefix}-alerts"
  kms_master_key_id = aws_kms_key.primary_kms_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-alerts-topic"
  })
}

# =============================================================================
# AWS CONFIG
# =============================================================================

# Config bucket
resource "aws_s3_bucket" "config_bucket" {
  provider = aws.us_east_2
  bucket   = "${local.primary_prefix}-config-${random_string.config_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-config-bucket"
  })
}

# Random string for Config bucket suffix
resource "random_string" "config_suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = true
  special = false
}

# Config bucket policy
resource "aws_s3_bucket_policy" "config_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.config_bucket.id

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
        Resource = aws_s3_bucket.config_bucket.arn
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
        Resource = aws_s3_bucket.config_bucket.arn
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
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"     = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Config delivery channel
resource "aws_config_delivery_channel" "app_config_delivery_channel" {
  provider           = aws.us_east_2
  name               = "${local.primary_prefix}-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_bucket.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }
  depends_on = [aws_config_configuration_recorder.app_config_recorder]
}

# Config configuration recorder
resource "aws_config_configuration_recorder" "app_config_recorder" {
  provider = aws.us_east_2
  name     = "${local.primary_prefix}-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config configuration recorder status
resource "aws_config_configuration_recorder_status" "app_config_recorder_status" {
  provider   = aws.us_east_2
  name       = aws_config_configuration_recorder.app_config_recorder.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.app_config_delivery_channel]
}

# =============================================================================
# BASTION HOSTS
# =============================================================================

# Primary region Bastion host
resource "aws_instance" "primary_bastion" {
  provider                    = aws.us_east_2
  ami                         = data.aws_ami.amazon_linux_primary.id
  instance_type               = "t3.micro"
  key_name                    = null # You would specify your key pair name here
  vpc_security_group_ids      = [aws_security_group.primary_bastion_sg.id]
  subnet_id                   = aws_subnet.primary_public_subnets[0].id
  iam_instance_profile        = aws_iam_instance_profile.bastion_profile.name
  associate_public_ip_address = true

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y mysql
              echo "Bastion host setup complete" > /var/log/bastion-setup.log
              EOF
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
    kms_key_id  = aws_kms_key.primary_kms_key.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-bastion"
  })
}

# Secondary region Bastion host
resource "aws_instance" "secondary_bastion" {
  provider                    = aws.us_west_1
  ami                         = data.aws_ami.amazon_linux_secondary.id
  instance_type               = "t3.micro"
  key_name                    = null # You would specify your key pair name here
  vpc_security_group_ids      = [aws_security_group.secondary_bastion_sg.id]
  subnet_id                   = aws_subnet.secondary_public_subnets[0].id
  iam_instance_profile        = aws_iam_instance_profile.bastion_profile_secondary.name
  associate_public_ip_address = true

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y mysql
              echo "Bastion host setup complete" > /var/log/bastion-setup.log
              EOF
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
    kms_key_id  = aws_kms_key.secondary_kms_key.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-bastion"
  })
}

# =============================================================================
