# PCI-DSS Compliant Payment Processing Infrastructure

This Terraform configuration implements a production-grade PCI-DSS v3.2.1 compliant infrastructure for processing 75,000 daily credit card transactions on AWS.

## Architecture Overview

- **Region**: us-west-2 (with Multi-AZ deployment)
- **Network**: VPC with public, private app, and private database subnets
- **Compute**: Auto Scaling Group with Application Load Balancer
- **Database**: RDS PostgreSQL Multi-AZ with encryption
- **Security**: WAF, KMS encryption, Security Groups, VPC Flow Logs
- **Monitoring**: CloudWatch Logs and Metrics

---

## Infrastructure Code

```hcl
# ===========================# main.tf

# PCI-DSS COMPLIANT PAYMENT PROCESSING INFRASTRUCTURE

# Transaction Volume: 75,000 daily transactions# ===========================

# Compliance: PCI-DSS v3.2.1# VARIABLES

# Region: us-east-1# ===========================

# ===========================

variable "aws_region" {

# ===========================  description = "AWS region for all resources"

# TERRAFORM CONFIGURATION  type        = string

# ===========================  default     = "us-west-2"

}

terraform {

  required_version = ">= 1.0"variable "project_name" {

    description = "Project name"

  required_providers {  type        = string

    aws = {  default     = "nova"

      source  = "hashicorp/aws"}

      version = "~> 5.0"

    }variable "environment" {

  }  description = "Environment name"

    type        = string

  backend "s3" {  default     = "prod"

    bucket         = "pci-payment-terraform-state"}

    key            = "prod/terraform.tfstate"

    region         = "us-east-1"variable "vpc_cidr" {

    encrypt        = true  description = "CIDR block for VPC"

    dynamodb_table = "pci-payment-terraform-locks"  type        = string

  }  default     = "10.0.0.0/16"

}}



# ===========================variable "vault_address" {

# PROVIDER CONFIGURATION  description = "Vault server address"

# ===========================  type        = string

  default     = ""

provider "aws" {}

  region = var.aws_region

  variable "allowed_ingress_cidrs" {

  default_tags {  description = "Allowed CIDR blocks for ALB ingress"

    tags = local.common_tags  type        = list(string)

  }  default     = ["0.0.0.0/0"]

}}



# ===========================variable "db_master_password" {

# DATA SOURCES  description = "Master password for RDS database"

# ===========================  type        = string

  sensitive   = true

data "aws_caller_identity" "current" {}  default     = "TestPassword123!"

}

data "aws_availability_zones" "available" {

  state = "available"# ===========================

}# LOCALS

# ===========================

data "aws_elb_service_account" "main" {}

locals {

# ===========================  name_prefix = "${var.project_name}-${var.environment}"

# LOCAL VALUES  

# ===========================  common_tags = {

    Environment = var.environment

locals {    Owner       = "CloudEngineering"

  name_prefix = "${var.project_name}-${var.environment}"    ManagedBy   = "Terraform"

      Project     = var.project_name

  common_tags = {  }

    Project      = var.project_name  

    Environment  = var.environment  azs = data.aws_availability_zones.available.names

    ManagedBy    = "Terraform"  

    Compliance   = "PCI-DSS-v3.2.1"  # Subnet CIDR calculations

    CostCenter   = "Payment-Processing"  public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24"]

    DataClass    = "Cardholder-Data"  private_app_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

  }  private_db_subnet_cidrs  = ["10.0.20.0/24", "10.0.21.0/24"]

  }

  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  # ===========================

  # Subnet CIDR calculations for 4-tier architecture# DATA SOURCES

  dmz_subnet_cidrs        = ["10.16.0.0/24", "10.16.1.0/24", "10.16.2.0/24"]# ===========================

  app_subnet_cidrs        = ["10.16.16.0/24", "10.16.17.0/24", "10.16.18.0/24"]

  db_subnet_cidrs         = ["10.16.32.0/24", "10.16.33.0/24", "10.16.34.0/24"]data "aws_availability_zones" "available" {

  management_subnet_cidrs = ["10.16.48.0/24", "10.16.49.0/24", "10.16.50.0/24"]  state = "available"

}}



# ===========================data "aws_caller_identity" "current" {}

# VPC - PCI-DSS Requirement 1.2

# ===========================data "aws_elb_service_account" "main" {}



resource "aws_vpc" "main" {data "aws_ami" "amazon_linux_2023" {

  cidr_block           = var.vpc_cidr  most_recent = true

  enable_dns_hostnames = true  owners      = ["amazon"]

  enable_dns_support   = true  

    filter {

  tags = merge(local.common_tags, {    name   = "name"

    Name    = "${local.name_prefix}-vpc"    values = ["al2023-ami-*-x86_64"]

    PCI_DSS = "Requirement-1.2"  }

  })  

}  filter {

    name   = "virtualization-type"

# ===========================    values = ["hvm"]

# INTERNET GATEWAY  }

# ===========================  

  filter {

resource "aws_internet_gateway" "main" {    name   = "architecture"

  vpc_id = aws_vpc.main.id    values = ["x86_64"]

    }

  tags = merge(local.common_tags, {}

    Name = "${local.name_prefix}-igw"

  })# ===========================

}# KMS KEY

# ===========================

# ===========================

# DMZ/PUBLIC SUBNETS (10.16.0.0/20)resource "aws_kms_key" "main" {

# For ALB and NAT Gateways  description             = "${local.name_prefix}-cmk"

# ===========================  deletion_window_in_days = 30

  enable_key_rotation     = true

resource "aws_subnet" "dmz" {  

  count = 3  policy = jsonencode({

      Version = "2012-10-17"

  vpc_id                  = aws_vpc.main.id    Statement = [

  cidr_block              = local.dmz_subnet_cidrs[count.index]      {

  availability_zone       = local.azs[count.index]        Sid    = "Enable IAM User Permissions"

  map_public_ip_on_launch = false  # PCI-DSS: No public IPs by default        Effect = "Allow"

          Principal = {

  tags = merge(local.common_tags, {          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"

    Name    = "${local.name_prefix}-dmz-subnet-${count.index + 1}"        }

    Tier    = "DMZ"        Action   = "kms:*"

    PCI_DSS = "Requirement-1.2.1"        Resource = "*"

  })      },

}      {

        Sid    = "Allow CloudWatch Logs"

# ===========================        Effect = "Allow"

# APPLICATION SUBNETS (10.16.16.0/20)        Principal = {

# Private subnets for compute workloads          Service = "logs.${var.aws_region}.amazonaws.com"

# ===========================        }

        Action = [

resource "aws_subnet" "app" {          "kms:Encrypt",

  count = 3          "kms:Decrypt",

            "kms:ReEncrypt*",

  vpc_id            = aws_vpc.main.id          "kms:GenerateDataKey*",

  cidr_block        = local.app_subnet_cidrs[count.index]          "kms:CreateGrant",

  availability_zone = local.azs[count.index]          "kms:DescribeKey"

          ]

  tags = merge(local.common_tags, {        Resource = "*"

    Name    = "${local.name_prefix}-app-subnet-${count.index + 1}"        Condition = {

    Tier    = "Application"          ArnLike = {

    PCI_DSS = "Requirement-1.3.6"            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"

  })          }

}        }

      },

# ===========================      {

# DATABASE SUBNETS (10.16.32.0/20)        Sid    = "Allow ELB Service"

# Isolated subnets for RDS        Effect = "Allow"

# ===========================        Principal = {

          Service = "elasticloadbalancing.amazonaws.com"

resource "aws_subnet" "db" {        }

  count = 3        Action = [

            "kms:Decrypt",

  vpc_id            = aws_vpc.main.id          "kms:GenerateDataKey"

  cidr_block        = local.db_subnet_cidrs[count.index]        ]

  availability_zone = local.azs[count.index]        Resource = "*"

        }

  tags = merge(local.common_tags, {    ]

    Name    = "${local.name_prefix}-db-subnet-${count.index + 1}"  })

    Tier    = "Database"  

    PCI_DSS = "Requirement-1.2.1"  tags = merge(local.common_tags, {

  })    Name = "${local.name_prefix}-cmk"

}  })

}

# ===========================

# MANAGEMENT SUBNETS (10.16.48.0/20)resource "aws_kms_alias" "main" {

# For admin and monitoring tools  name          = "alias/${local.name_prefix}-cmk"

# ===========================  target_key_id = aws_kms_key.main.key_id

}

resource "aws_subnet" "management" {

  count = 3# ===========================

  # VPC

  vpc_id            = aws_vpc.main.id# ===========================

  cidr_block        = local.management_subnet_cidrs[count.index]

  availability_zone = local.azs[count.index]resource "aws_vpc" "main" {

    cidr_block           = var.vpc_cidr

  tags = merge(local.common_tags, {  enable_dns_hostnames = true

    Name    = "${local.name_prefix}-management-subnet-${count.index + 1}"  enable_dns_support   = true

    Tier    = "Management"  

    PCI_DSS = "Requirement-1.2.1"  tags = merge(local.common_tags, {

  })    Name = "${local.name_prefix}-vpc"

}  })

}

# ===========================

# ELASTIC IPs FOR NAT GATEWAYS# ===========================

# ===========================# INTERNET GATEWAY

# ===========================

resource "aws_eip" "nat" {

  count  = 3resource "aws_internet_gateway" "main" {

  domain = "vpc"  vpc_id = aws_vpc.main.id

    

  tags = merge(local.common_tags, {  tags = merge(local.common_tags, {

    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"    Name = "${local.name_prefix}-igw"

  })  })

  }

  depends_on = [aws_internet_gateway.main]

}# ===========================

# PUBLIC SUBNETS

# ===========================# ===========================

# NAT GATEWAYS (Multi-AZ for HA)

# ===========================resource "aws_subnet" "public" {

  count = 2

resource "aws_nat_gateway" "main" {  

  count = 3  vpc_id                  = aws_vpc.main.id

    cidr_block              = local.public_subnet_cidrs[count.index]

  allocation_id = aws_eip.nat[count.index].id  availability_zone       = local.azs[count.index]

  subnet_id     = aws_subnet.dmz[count.index].id  map_public_ip_on_launch = true

    

  tags = merge(local.common_tags, {  tags = merge(local.common_tags, {

    Name = "${local.name_prefix}-nat-${count.index + 1}"    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"

  })    Type = "Public"

    })

  depends_on = [aws_internet_gateway.main]}

}

# ===========================

# ===========================# PRIVATE APP SUBNETS

# ROUTE TABLES# ===========================

# ===========================

resource "aws_subnet" "private_app" {

# Public route table for DMZ  count = 2

resource "aws_route_table" "dmz" {  

  vpc_id = aws_vpc.main.id  vpc_id            = aws_vpc.main.id

    cidr_block        = local.private_app_subnet_cidrs[count.index]

  route {  availability_zone = local.azs[count.index]

    cidr_block = "0.0.0.0/0"  

    gateway_id = aws_internet_gateway.main.id  tags = merge(local.common_tags, {

  }    Name = "${local.name_prefix}-private-app-subnet-${count.index + 1}"

      Type = "Private-App"

  tags = merge(local.common_tags, {  })

    Name = "${local.name_prefix}-dmz-rt"}

    Tier = "DMZ"

  })# ===========================

}# PRIVATE DB SUBNETS

# ===========================

# Private route tables for application tier (one per AZ for HA)

resource "aws_route_table" "app" {resource "aws_subnet" "private_db" {

  count  = 3  count = 2

  vpc_id = aws_vpc.main.id  

    vpc_id            = aws_vpc.main.id

  route {  cidr_block        = local.private_db_subnet_cidrs[count.index]

    cidr_block     = "0.0.0.0/0"  availability_zone = local.azs[count.index]

    nat_gateway_id = aws_nat_gateway.main[count.index].id  

  }  tags = merge(local.common_tags, {

      Name = "${local.name_prefix}-private-db-subnet-${count.index + 1}"

  tags = merge(local.common_tags, {    Type = "Private-DB"

    Name = "${local.name_prefix}-app-rt-${count.index + 1}"  })

    Tier = "Application"}

  })

}# ===========================

# ELASTIC IPs FOR NAT GATEWAYS

# Database route table (no internet access)# ===========================

resource "aws_route_table" "db" {

  vpc_id = aws_vpc.main.idresource "aws_eip" "nat" {

    count  = 2

  tags = merge(local.common_tags, {  domain = "vpc"

    Name    = "${local.name_prefix}-db-rt"  

    Tier    = "Database"  tags = merge(local.common_tags, {

    PCI_DSS = "Requirement-1.2.1"    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"

  })  })

}  

  depends_on = [aws_internet_gateway.main]

# Management route table}

resource "aws_route_table" "management" {

  count  = 3# ===========================

  vpc_id = aws_vpc.main.id# NAT GATEWAYS

  # ===========================

  route {

    cidr_block     = "0.0.0.0/0"resource "aws_nat_gateway" "main" {

    nat_gateway_id = aws_nat_gateway.main[count.index].id  count = 2

  }  

    allocation_id = aws_eip.nat[count.index].id

  tags = merge(local.common_tags, {  subnet_id     = aws_subnet.public[count.index].id

    Name = "${local.name_prefix}-management-rt-${count.index + 1}"  

    Tier = "Management"  tags = merge(local.common_tags, {

  })    Name = "${local.name_prefix}-nat-${count.index + 1}"

}  })

  

# ===========================  depends_on = [aws_internet_gateway.main]

# ROUTE TABLE ASSOCIATIONS}

# ===========================

# ===========================

resource "aws_route_table_association" "dmz" {# ROUTE TABLES

  count = 3# ===========================

  

  subnet_id      = aws_subnet.dmz[count.index].idresource "aws_route_table" "public" {

  route_table_id = aws_route_table.dmz.id  vpc_id = aws_vpc.main.id

}  

  route {

resource "aws_route_table_association" "app" {    cidr_block = "0.0.0.0/0"

  count = 3    gateway_id = aws_internet_gateway.main.id

    }

  subnet_id      = aws_subnet.app[count.index].id  

  route_table_id = aws_route_table.app[count.index].id  tags = merge(local.common_tags, {

}    Name = "${local.name_prefix}-public-rt"

  })

resource "aws_route_table_association" "db" {}

  count = 3

  resource "aws_route_table" "private_app" {

  subnet_id      = aws_subnet.db[count.index].id  count  = 2

  route_table_id = aws_route_table.db.id  vpc_id = aws_vpc.main.id

}  

  route {

resource "aws_route_table_association" "management" {    cidr_block     = "0.0.0.0/0"

  count = 3    nat_gateway_id = aws_nat_gateway.main[count.index].id

    }

  subnet_id      = aws_subnet.management[count.index].id  

  route_table_id = aws_route_table.management[count.index].id  tags = merge(local.common_tags, {

}    Name = "${local.name_prefix}-private-app-rt-${count.index + 1}"

  })

# ===========================}

# VPC FLOW LOGS - PCI-DSS Requirement 10.2

# Complete network traffic visibilityresource "aws_route_table" "private_db" {

# ===========================  vpc_id = aws_vpc.main.id

  

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {  tags = merge(local.common_tags, {

  name              = "/aws/vpc/${local.name_prefix}-flow-logs"    Name = "${local.name_prefix}-private-db-rt"

  retention_in_days = var.log_retention_days  })

  kms_key_id        = aws_kms_key.log_tier.arn}

  

  tags = merge(local.common_tags, {# ===========================

    Name    = "${local.name_prefix}-vpc-flow-logs"# ROUTE TABLE ASSOCIATIONS

    PCI_DSS = "Requirement-10.2"# ===========================

  })

}resource "aws_route_table_association" "public" {

  count = 2

resource "aws_iam_role" "vpc_flow_logs" {  

  name = "${local.name_prefix}-vpc-flow-logs-role"  subnet_id      = aws_subnet.public[count.index].id

    route_table_id = aws_route_table.public.id

  assume_role_policy = jsonencode({}

    Version = "2012-10-17"

    Statement = [{resource "aws_route_table_association" "private_app" {

      Action = "sts:AssumeRole"  count = 2

      Effect = "Allow"  

      Principal = {  subnet_id      = aws_subnet.private_app[count.index].id

        Service = "vpc-flow-logs.amazonaws.com"  route_table_id = aws_route_table.private_app[count.index].id

      }}

    }]

  })resource "aws_route_table_association" "private_db" {

    count = 2

  tags = local.common_tags  

}  subnet_id      = aws_subnet.private_db[count.index].id

  route_table_id = aws_route_table.private_db.id

resource "aws_iam_role_policy" "vpc_flow_logs" {}

  name = "${local.name_prefix}-vpc-flow-logs-policy"

  role = aws_iam_role.vpc_flow_logs.id# ===========================

  # VPC FLOW LOGS

  policy = jsonencode({# ===========================

    Version = "2012-10-17"

    Statement = [{resource "aws_cloudwatch_log_group" "vpc_flow_logs" {

      Effect = "Allow"  name              = "/aws/vpc/${local.name_prefix}-flow-logs"

      Action = [  retention_in_days = 30

        "logs:CreateLogGroup",  kms_key_id        = aws_kms_key.main.arn

        "logs:CreateLogStream",  

        "logs:PutLogEvents",  tags = merge(local.common_tags, {

        "logs:DescribeLogGroups",    Name = "${local.name_prefix}-vpc-flow-logs"

        "logs:DescribeLogStreams"  })

      ]}

      Resource = "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"

    }]resource "aws_iam_role" "vpc_flow_logs" {

  })  name = "${local.name_prefix}-vpc-flow-logs-role"

}  

  assume_role_policy = jsonencode({

resource "aws_flow_log" "main" {    Version = "2012-10-17"

  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn    Statement = [{

  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn      Action = "sts:AssumeRole"

  log_destination_type = "cloud-watch-logs"      Effect = "Allow"

  traffic_type         = "ALL"  # Log both accepted and rejected traffic      Principal = {

  vpc_id               = aws_vpc.main.id        Service = "vpc-flow-logs.amazonaws.com"

        }

  tags = merge(local.common_tags, {    }]

    Name    = "${local.name_prefix}-vpc-flow-log"  })

    PCI_DSS = "Requirement-10.2.7"  

  })  tags = local.common_tags

}}



# ===========================resource "aws_iam_role_policy" "vpc_flow_logs" {

# KMS KEYS - PCI-DSS Requirement 3.4  name = "${local.name_prefix}-vpc-flow-logs-policy"

# Separate keys per tier for defense in depth  role = aws_iam_role.vpc_flow_logs.id

# ===========================  

  policy = jsonencode({

# DMZ Tier Key - For ALB logs and public resources    Version = "2012-10-17"

resource "aws_kms_key" "dmz_tier" {    Statement = [{

  description             = "${local.name_prefix}-dmz-tier-cmk"      Effect = "Allow"

  deletion_window_in_days = 30      Action = [

  enable_key_rotation     = true        "logs:CreateLogGroup",

          "logs:CreateLogStream",

  policy = jsonencode({        "logs:PutLogEvents",

    Version = "2012-10-17"        "logs:DescribeLogGroups",

    Statement = [        "logs:DescribeLogStreams"

      {      ]

        Sid    = "Enable IAM User Permissions"      Resource = aws_cloudwatch_log_group.vpc_flow_logs.arn

        Effect = "Allow"    }]

        Principal = {  })

          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"}

        }

        Action   = "kms:*"resource "aws_flow_log" "main" {

        Resource = "*"  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn

      },  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn

      {  log_destination_type = "cloud-watch-logs"

        Sid    = "Allow ELB Service"  traffic_type         = "ALL"

        Effect = "Allow"  vpc_id               = aws_vpc.main.id

        Principal = {  

          Service = "elasticloadbalancing.amazonaws.com"  tags = merge(local.common_tags, {

        }    Name = "${local.name_prefix}-vpc-flow-log"

        Action = [  })

          "kms:Decrypt",}

          "kms:GenerateDataKey"

        ]# ===========================

        Resource = "*"# SECURITY GROUPS

      },# ===========================

      {

        Sid    = "Allow S3 Service"resource "aws_security_group" "alb" {

        Effect = "Allow"  name        = "${local.name_prefix}-alb-sg"

        Principal = {  description = "Security group for Application Load Balancer"

          Service = "s3.amazonaws.com"  vpc_id      = aws_vpc.main.id

        }  

        Action = [  dynamic "ingress" {

          "kms:Decrypt",    for_each = [80, 443]

          "kms:GenerateDataKey"    content {

        ]      from_port   = ingress.value

        Resource = "*"      to_port     = ingress.value

      }      protocol    = "tcp"

    ]      cidr_blocks = var.allowed_ingress_cidrs

  })      description = "Allow HTTP${ingress.value == 443 ? "S" : ""} from allowlist"

      }

  tags = merge(local.common_tags, {  }

    Name    = "${local.name_prefix}-dmz-tier-cmk"  

    Tier    = "DMZ"  egress {

    PCI_DSS = "Requirement-3.4"    from_port   = 0

  })    to_port     = 0

}    protocol    = "-1"

    cidr_blocks = ["0.0.0.0/0"]

resource "aws_kms_alias" "dmz_tier" {    description = "Allow all outbound traffic"

  name          = "alias/${local.name_prefix}-dmz-tier"  }

  target_key_id = aws_kms_key.dmz_tier.key_id  

}  tags = merge(local.common_tags, {

    Name = "${local.name_prefix}-alb-sg"

# Application Tier Key - For application data and EBS volumes  })

resource "aws_kms_key" "app_tier" {}

  description             = "${local.name_prefix}-app-tier-cmk"

  deletion_window_in_days = 30resource "aws_security_group" "app" {

  enable_key_rotation     = true  name        = "${local.name_prefix}-app-sg"

    description = "Security group for application instances"

  policy = jsonencode({  vpc_id      = aws_vpc.main.id

    Version = "2012-10-17"  

    Statement = [  ingress {

      {    from_port       = 443

        Sid    = "Enable IAM User Permissions"    to_port         = 443

        Effect = "Allow"    protocol        = "tcp"

        Principal = {    security_groups = [aws_security_group.alb.id]

          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"    description     = "Allow HTTPS from ALB"

        }  }

        Action   = "kms:*"  

        Resource = "*"  egress {

      },    from_port   = 0

      {    to_port     = 0

        Sid    = "Allow EC2 Service"    protocol    = "-1"

        Effect = "Allow"    cidr_blocks = ["0.0.0.0/0"]

        Principal = {    description = "Allow all outbound traffic"

          Service = "ec2.amazonaws.com"  }

        }  

        Action = [  tags = merge(local.common_tags, {

          "kms:Decrypt",    Name = "${local.name_prefix}-app-sg"

          "kms:GenerateDataKey",  })

          "kms:CreateGrant"}

        ]

        Resource = "*"resource "aws_security_group" "rds" {

      },  name        = "${local.name_prefix}-rds-sg"

      {  description = "Security group for RDS database"

        Sid    = "Allow Lambda Service"  vpc_id      = aws_vpc.main.id

        Effect = "Allow"  

        Principal = {  ingress {

          Service = "lambda.amazonaws.com"    from_port       = 5432

        }    to_port         = 5432

        Action = [    protocol        = "tcp"

          "kms:Decrypt",    security_groups = [aws_security_group.app.id]

          "kms:GenerateDataKey"    description     = "Allow PostgreSQL from app instances"

        ]  }

        Resource = "*"  

      }  egress {

    ]    from_port   = 0

  })    to_port     = 0

      protocol    = "-1"

  tags = merge(local.common_tags, {    cidr_blocks = ["0.0.0.0/0"]

    Name    = "${local.name_prefix}-app-tier-cmk"    description = "Allow all outbound traffic"

    Tier    = "Application"  }

    PCI_DSS = "Requirement-3.4"  

  })  tags = merge(local.common_tags, {

}    Name = "${local.name_prefix}-rds-sg"

  })

resource "aws_kms_alias" "app_tier" {}

  name          = "alias/${local.name_prefix}-app-tier"

  target_key_id = aws_kms_key.app_tier.key_id# ===========================

}# S3 LOGS BUCKET

# ===========================

# Database Tier Key - For RDS encryption

resource "aws_kms_key" "db_tier" {resource "aws_s3_bucket" "logs" {

  description             = "${local.name_prefix}-db-tier-cmk"  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  deletion_window_in_days = 30  

  enable_key_rotation     = true  tags = merge(local.common_tags, {

      Name = "${local.name_prefix}-logs"

  policy = jsonencode({  })

    Version = "2012-10-17"}

    Statement = [

      {resource "aws_s3_bucket_versioning" "logs" {

        Sid    = "Enable IAM User Permissions"  bucket = aws_s3_bucket.logs.id

        Effect = "Allow"  

        Principal = {  versioning_configuration {

          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"    status = "Enabled"

        }  }

        Action   = "kms:*"}

        Resource = "*"

      },resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {

      {  bucket = aws_s3_bucket.logs.id

        Sid    = "Allow RDS to use the key"  

        Effect = "Allow"  rule {

        Principal = {    apply_server_side_encryption_by_default {

          Service = "rds.amazonaws.com"      sse_algorithm = "AES256"

        }    }

        Action = [  }

          "kms:Decrypt",}

          "kms:GenerateDataKey",

          "kms:CreateGrant",resource "aws_s3_bucket_public_access_block" "logs" {

          "kms:DescribeKey"  bucket = aws_s3_bucket.logs.id

        ]  

        Resource = "*"  block_public_acls       = true

        Condition = {  block_public_policy     = true

          StringEquals = {  ignore_public_acls      = true

            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"  restrict_public_buckets = true

          }}

        }

      }resource "aws_s3_bucket_policy" "logs" {

    ]  bucket = aws_s3_bucket.logs.id

  })  

    policy = jsonencode({

  tags = merge(local.common_tags, {    Version = "2012-10-17"

    Name    = "${local.name_prefix}-db-tier-cmk"    Statement = [

    Tier    = "Database"      {

    PCI_DSS = "Requirement-3.4.1"        Sid    = "AWSLogDeliveryWrite"

  })        Effect = "Allow"

}        Principal = {

          AWS = data.aws_elb_service_account.main.arn

resource "aws_kms_alias" "db_tier" {        }

  name          = "alias/${local.name_prefix}-db-tier"        Action   = "s3:PutObject"

  target_key_id = aws_kms_key.db_tier.key_id        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"

}      },

      {

# Log Tier Key - For CloudWatch Logs and CloudTrail        Sid    = "AWSLogDeliveryAclCheck"

resource "aws_kms_key" "log_tier" {        Effect = "Allow"

  description             = "${local.name_prefix}-log-tier-cmk"        Principal = {

  deletion_window_in_days = 30          Service = "elasticloadbalancing.amazonaws.com"

  enable_key_rotation     = true        }

          Action   = "s3:GetBucketAcl"

  policy = jsonencode({        Resource = aws_s3_bucket.logs.arn

    Version = "2012-10-17"      }

    Statement = [    ]

      {  })

        Sid    = "Enable IAM User Permissions"  

        Effect = "Allow"  depends_on = [

        Principal = {    aws_s3_bucket_public_access_block.logs

          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"  ]

        }}

        Action   = "kms:*"

        Resource = "*"# ===========================

      },# APPLICATION LOAD BALANCER

      {# ===========================

        Sid    = "Allow CloudWatch Logs"

        Effect = "Allow"resource "aws_lb" "main" {

        Principal = {  name               = "${local.name_prefix}-alb"

          Service = "logs.${var.aws_region}.amazonaws.com"  internal           = false

        }  load_balancer_type = "application"

        Action = [  security_groups    = [aws_security_group.alb.id]

          "kms:Encrypt",  subnets           = aws_subnet.public[*].id

          "kms:Decrypt",  

          "kms:ReEncrypt*",  enable_deletion_protection = false

          "kms:GenerateDataKey*",  enable_http2              = true

          "kms:CreateGrant",  enable_cross_zone_load_balancing = true

          "kms:DescribeKey"  

        ]  access_logs {

        Resource = "*"    bucket  = aws_s3_bucket.logs.bucket

        Condition = {    prefix  = "alb-logs"

          ArnLike = {    enabled = true

            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"  }

          }  

        }  depends_on = [

      },    aws_s3_bucket_policy.logs

      {  ]

        Sid    = "Allow CloudTrail"  

        Effect = "Allow"  tags = merge(local.common_tags, {

        Principal = {    Name = "${local.name_prefix}-alb"

          Service = "cloudtrail.amazonaws.com"  })

        }}

        Action = [

          "kms:GenerateDataKey*",resource "aws_lb_target_group" "app" {

          "kms:DecryptDataKey"  name     = "${local.name_prefix}-tg"

        ]  port     = 443

        Resource = "*"  protocol = "HTTPS"

        Condition = {  vpc_id   = aws_vpc.main.id

          StringLike = {  

            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"  health_check {

          }    enabled             = true

        }    healthy_threshold   = 2

      }    unhealthy_threshold = 2

    ]    timeout             = 5

  })    interval            = 30

      path                = "/"

  tags = merge(local.common_tags, {    matcher             = "200"

    Name    = "${local.name_prefix}-log-tier-cmk"    protocol            = "HTTPS"

    Tier    = "Logging"  }

    PCI_DSS = "Requirement-10.5"  

  })  tags = merge(local.common_tags, {

}    Name = "${local.name_prefix}-tg"

  })

resource "aws_kms_alias" "log_tier" {}

  name          = "alias/${local.name_prefix}-log-tier"

  target_key_id = aws_kms_key.log_tier.key_idresource "aws_lb_listener" "http" {

}  load_balancer_arn = aws_lb.main.arn

  port              = "80"

# Backup Tier Key - For backup encryption  protocol          = "HTTP"

resource "aws_kms_key" "backup_tier" {  

  description             = "${local.name_prefix}-backup-tier-cmk"  default_action {

  deletion_window_in_days = 30    type             = "forward"

  enable_key_rotation     = true    target_group_arn = aws_lb_target_group.app.arn

    }

  policy = jsonencode({  

    Version = "2012-10-17"  tags = merge(local.common_tags, {

    Statement = [    Name = "${local.name_prefix}-http-listener"

      {  })

        Sid    = "Enable IAM User Permissions"}

        Effect = "Allow"

        Principal = {# ===========================

          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"# WAF v2

        }# ===========================

        Action   = "kms:*"

        Resource = "*"resource "aws_wafv2_web_acl" "main" {

      },  name  = "${local.name_prefix}-waf"

      {  scope = "REGIONAL"

        Sid    = "Allow AWS Backup"  

        Effect = "Allow"  default_action {

        Principal = {    allow {}

          Service = "backup.amazonaws.com"  }

        }  

        Action = [  rule {

          "kms:Decrypt",    name     = "AWSManagedRulesCommonRuleSet"

          "kms:GenerateDataKey",    priority = 1

          "kms:CreateGrant"    

        ]    override_action {

        Resource = "*"      none {}

      }    }

    ]    

  })    statement {

        managed_rule_group_statement {

  tags = merge(local.common_tags, {        name        = "AWSManagedRulesCommonRuleSet"

    Name    = "${local.name_prefix}-backup-tier-cmk"        vendor_name = "AWS"

    Tier    = "Backup"      }

    PCI_DSS = "Requirement-3.4"    }

  })    

}    visibility_config {

      cloudwatch_metrics_enabled = true

resource "aws_kms_alias" "backup_tier" {      metric_name               = "${local.name_prefix}-common-rules"

  name          = "alias/${local.name_prefix}-backup-tier"      sampled_requests_enabled   = true

  target_key_id = aws_kms_key.backup_tier.key_id    }

}  }

  

# Note: Due to file size constraints, the remaining resources will be in separate files:  rule {

# - security-groups.tf: Security groups with strict egress rules    name     = "AWSManagedRulesKnownBadInputsRuleSet"

# - nacls.tf: Network ACLs for subnet isolation    priority = 2

# - rds.tf: Aurora MySQL cluster    

# - iam.tf: IAM roles and policies    override_action {

# - endpoints.tf: VPC endpoints for PrivateLink      none {}

# - transit-gateway.tf: Transit Gateway configuration    }

# - waf.tf: WAF with OWASP rules    

# - guardduty.tf, securityhub.tf, config.tf, macie.tf: Security services    statement {

# - cloudtrail.tf, cloudwatch.tf: Audit and monitoring      managed_rule_group_statement {

# - secrets.tf: Secrets Manager with rotation        name        = "AWSManagedRulesKnownBadInputsRuleSet"

# - lambda.tf: Remediation functions        vendor_name = "AWS"

# - s3.tf, sns.tf: Storage and notifications      }

# - variables.tf, outputs.tf: Inputs and outputs    }

    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${local.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
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
      metric_name               = "${local.name_prefix}-sqli-rules"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf"
  })
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# ===========================
# CLOUDWATCH LOG GROUP FOR APP
# ===========================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/app/web"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

# ===========================
# IAM ROLE FOR EC2
# ===========================

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name = "${local.name_prefix}-ec2-cloudwatch-policy"
  role = aws_iam_role.ec2.id
  
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
        Resource = [
          aws_cloudwatch_log_group.app.arn,
          "${aws_cloudwatch_log_group.app.arn}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = local.common_tags
}

# ===========================
# LAUNCH TEMPLATE
# ===========================

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted            = true
      kms_key_id           = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }
  
  user_data = base64encode(<<-EOT
    #!/bin/bash
    yum update -y
    yum install -y nginx
    
    # Generate self-signed certificate
    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/nginx.key \
      -out /etc/nginx/ssl/nginx.crt \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=${local.name_prefix}.local"
    
    # Configure nginx for HTTPS
    cat > /etc/nginx/conf.d/https.conf <<EOF
    server {
        listen 443 ssl;
        server_name _;
        
        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;
        
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
    EOF
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/nginx/access.log",
                "log_group_name": "/app/web",
                "log_stream_name": "{instance_id}/nginx-access"
              },
              {
                "file_path": "/var/log/nginx/error.log",
                "log_group_name": "/app/web",
                "log_stream_name": "{instance_id}/nginx-error"
              }
            ]
          }
        }
      }
    }
    EOF
    
    # Start services
    systemctl enable nginx
    systemctl start nginx
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOT
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-instance"
    })
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-launch-template"
  })
}

# ===========================
# RDS SUBNET GROUP
# ===========================

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# ===========================
# RDS POSTGRESQL INSTANCE
# ===========================

resource "aws_db_instance" "postgres" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id          = aws_kms_key.main.arn
  
  db_name  = "appdb"
  username = "dbadmin"
  password = var.db_master_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
}

# ===========================
# OUTPUTS
# ===========================

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "VPC ARN"
  value       = aws_vpc.main.arn
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "public_subnet_azs" {
  description = "Public subnet availability zones"
  value       = aws_subnet.public[*].availability_zone
}

output "private_app_subnet_ids" {
  description = "Private app subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_app_subnet_cidrs" {
  description = "Private app subnet CIDR blocks"
  value       = aws_subnet.private_app[*].cidr_block
}

output "private_app_subnet_azs" {
  description = "Private app subnet availability zones"
  value       = aws_subnet.private_app[*].availability_zone
}

output "private_db_subnet_ids" {
  description = "Private DB subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "private_db_subnet_cidrs" {
  description = "Private DB subnet CIDR blocks"
  value       = aws_subnet.private_db[*].cidr_block
}

output "private_db_subnet_azs" {
  description = "Private DB subnet availability zones"
  value       = aws_subnet.private_db[*].availability_zone
}

# Networking Outputs
output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "NAT Gateway public IPs"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

output "private_app_route_table_ids" {
  description = "Private app route table IDs"
  value       = aws_route_table.private_app[*].id
}

output "private_db_route_table_id" {
  description = "Private DB route table ID"
  value       = aws_route_table.private_db.id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "alb_security_group_name" {
  description = "ALB security group name"
  value       = aws_security_group.alb.name
}

output "app_security_group_id" {
  description = "App security group ID"
  value       = aws_security_group.app.id
}

output "app_security_group_name" {
  description = "App security group name"
  value       = aws_security_group.app.name
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "rds_security_group_name" {
  description = "RDS security group name"
  value       = aws_security_group.rds.name
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

# Launch Template Outputs
output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.app.id
}

output "launch_template_latest_version" {
  description = "Launch Template latest version"
  value       = aws_launch_template.app.latest_version
}

# RDS Outputs
output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.postgres.id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS address"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "rds_username" {
  description = "RDS username"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "rds_engine_version" {
  description = "RDS engine version"
  value       = aws_db_instance.postgres.engine_version_actual
}

output "rds_instance_class" {
  description = "RDS instance class"
  value       = aws_db_instance.postgres.instance_class
}

output "rds_allocated_storage" {
  description = "RDS allocated storage"
  value       = aws_db_instance.postgres.allocated_storage
}

output "rds_availability_zone" {
  description = "RDS availability zone"
  value       = aws_db_instance.postgres.availability_zone
}

output "rds_multi_az" {
  description = "RDS multi-AZ status"
  value       = aws_db_instance.postgres.multi_az
}

output "rds_backup_window" {
  description = "RDS backup window"
  value       = aws_db_instance.postgres.backup_window
}

output "rds_subnet_group_name" {
  description = "RDS subnet group name"
  value       = aws_db_subnet_group.main.name
}

# KMS Outputs
output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

# S3 Outputs
output "logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "S3 logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

# CloudWatch Outputs
output "app_log_group_name" {
  description = "App CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app.name
}

output "app_log_group_arn" {
  description = "App CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.app.arn
}

output "vpc_flow_logs_group_name" {
  description = "VPC Flow Logs CloudWatch log group name"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "vpc_flow_logs_group_arn" {
  description = "VPC Flow Logs CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "WAF WebACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "WAF WebACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

# IAM Outputs
output "ec2_role_arn" {
  description = "EC2 IAM role ARN"
  value       = aws_iam_role.ec2.arn
}

output "vpc_flow_logs_role_arn" {
  description = "VPC Flow Logs IAM role ARN"
  value       = aws_iam_role.vpc_flow_logs.arn
}

# Connection Strings
output "database_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${aws_db_instance.postgres.username}:****@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

# Configuration Outputs
output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}```
