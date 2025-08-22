provider.tf
terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "nova-model-breaking/tfstate/primary.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Default provider - uses var.aws_region from lib/tap_stack.tf
provider "aws" {
  region = var.aws_region
}

# US East 1 provider
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

# US West 2 provider
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}
lib/tap_stack.tf
# Variables
variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "owner" {
  description = "Project owner"
  type        = string
  default     = "platform-team"
}

variable "bastion_allowed_cidrs" {
  description = "CIDRs allowed to SSH into bastion"
  type        = list(string)
  default     = []
}

variable "asg_min_size" {
  description = "ASG minimum size"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "ASG maximum size"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "ASG desired capacity"
  type        = number
  default     = 2
}

variable "cpu_scale_up_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 70
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_engine" {
  description = "RDS engine"
  type        = string
  default     = "postgres"
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "14"
}

variable "rds_backup_retention_days" {
  description = "RDS backup retention days"
  type        = number
  default     = 7
}

variable "cloudfront_acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront HTTPS"
  type        = string
}

variable "terraform_role_arn" {
  description = "IAM role ARN for Terraform operations"
  type        = string
  default     = ""
}

# Locals
locals {
  tags = {
    Environment = var.environment
    Project     = var.project
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
  
  region_suffix = {
    "us-east-1" = "use1"
    "us-west-2" = "usw2"
  }
  
  use1_name_prefix = format("%s-%s-%s", var.project, var.environment, local.region_suffix["us-east-1"])
  usw2_name_prefix = format("%s-%s-%s", var.project, var.environment, local.region_suffix["us-west-2"])
}

# Data Sources
data "aws_availability_zones" "use1" {
  provider = aws.use1
  state    = "available"
}

data "aws_availability_zones" "usw2" {
  provider = aws.usw2
  state    = "available"
}

data "aws_ssm_parameter" "al2_ami_use1" {
  name     = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
  provider = aws.use1
}

data "aws_ssm_parameter" "al2_ami_usw2" {
  name     = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
  provider = aws.usw2
}

# KMS Keys
resource "aws_kms_key" "use1" {
  provider                = aws.use1
  description             = "KMS key for ${local.use1_name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-kms"
    Region = "us-east-1"
  })
}

resource "aws_kms_alias" "use1" {
  provider      = aws.use1
  name          = "alias/${local.use1_name_prefix}-key"
  target_key_id = aws_kms_key.use1.key_id
}

resource "aws_kms_key" "usw2" {
  provider                = aws.usw2
  description             = "KMS key for ${local.usw2_name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-kms"
    Region = "us-west-2"
  })
}

resource "aws_kms_alias" "usw2" {
  provider      = aws.usw2
  name          = "alias/${local.usw2_name_prefix}-key"
  target_key_id = aws_kms_key.usw2.key_id
}

# VPCs
resource "aws_vpc" "use1" {
  provider             = aws.use1
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-vpc"
    Region = "us-east-1"
  })
}

resource "aws_vpc" "usw2" {
  provider             = aws.usw2
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-vpc"
    Region = "us-west-2"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "use1" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-igw"
    Region = "us-east-1"
  })
}

resource "aws_internet_gateway" "usw2" {
  provider = aws.usw2
  vpc_id   = aws_vpc.usw2.id
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-igw"
    Region = "us-west-2"
  })
}

# Public Subnets
resource "aws_subnet" "use1_public" {
  provider                = aws.use1
  count                   = 2
  vpc_id                  = aws_vpc.use1.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.use1.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-public-${count.index + 1}"
    Type   = "Public"
    Region = "us-east-1"
  })
}

resource "aws_subnet" "usw2_public" {
  provider                = aws.usw2
  count                   = 2
  vpc_id                  = aws_vpc.usw2.id
  cidr_block              = "10.2.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.usw2.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-public-${count.index + 1}"
    Type   = "Public"
    Region = "us-west-2"
  })
}

# Private Subnets
resource "aws_subnet" "use1_private" {
  provider          = aws.use1
  count             = 2
  vpc_id            = aws_vpc.use1.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.use1.names[count.index]
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-private-${count.index + 1}"
    Type   = "Private"
    Region = "us-east-1"
  })
}

resource "aws_subnet" "usw2_private" {
  provider          = aws.usw2
  count             = 2
  vpc_id            = aws_vpc.usw2.id
  cidr_block        = "10.2.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.usw2.names[count.index]
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-private-${count.index + 1}"
    Type   = "Private"
    Region = "us-west-2"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "use1_nat" {
  provider = aws.use1
  domain   = "vpc"
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-nat-eip"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.use1]
}

resource "aws_eip" "usw2_nat" {
  provider = aws.usw2
  domain   = "vpc"
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-nat-eip"
    Region = "us-west-2"
  })
  
  depends_on = [aws_internet_gateway.usw2]
}

# NAT Gateways
resource "aws_nat_gateway" "use1" {
  provider      = aws.use1
  allocation_id = aws_eip.use1_nat.id
  subnet_id     = aws_subnet.use1_public[0].id
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-nat"
    Region = "us-east-1"
  })
  
  depends_on = [aws_internet_gateway.use1]
}

resource "aws_nat_gateway" "usw2" {
  provider      = aws.usw2
  allocation_id = aws_eip.usw2_nat.id
  subnet_id     = aws_subnet.usw2_public[0].id
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-nat"
    Region = "us-west-2"
  })
  
  depends_on = [aws_internet_gateway.usw2]
}

# Route Tables - Public
resource "aws_route_table" "use1_public" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.use1.id
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-public-rt"
    Region = "us-east-1"
  })
}

resource "aws_route_table" "usw2_public" {
  provider = aws.usw2
  vpc_id   = aws_vpc.usw2.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.usw2.id
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-public-rt"
    Region = "us-west-2"
  })
}

# Route Tables - Private
resource "aws_route_table" "use1_private" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.use1.id
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-private-rt"
    Region = "us-east-1"
  })
}

resource "aws_route_table" "usw2_private" {
  provider = aws.usw2
  vpc_id   = aws_vpc.usw2.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.usw2.id
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-private-rt"
    Region = "us-west-2"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "use1_public" {
  provider       = aws.use1
  count          = 2
  subnet_id      = aws_subnet.use1_public[count.index].id
  route_table_id = aws_route_table.use1_public.id
}

resource "aws_route_table_association" "usw2_public" {
  provider       = aws.usw2
  count          = 2
  subnet_id      = aws_subnet.usw2_public[count.index].id
  route_table_id = aws_route_table.usw2_public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "use1_private" {
  provider       = aws.use1
  count          = 2
  subnet_id      = aws_subnet.use1_private[count.index].id
  route_table_id = aws_route_table.use1_private.id
}

resource "aws_route_table_association" "usw2_private" {
  provider       = aws.usw2
  count          = 2
  subnet_id      = aws_subnet.usw2_private[count.index].id
  route_table_id = aws_route_table.usw2_private.id
}

# VPC Peering
resource "aws_vpc_peering_connection" "use1_to_usw2" {
  provider    = aws.use1
  vpc_id      = aws_vpc.use1.id
  peer_vpc_id = aws_vpc.usw2.id
  peer_region = "us-west-2"
  auto_accept = false
  
  tags = merge(local.tags, {
    Name = "${var.project}-${var.environment}-peering"
    Side = "Requester"
  })
}

resource "aws_vpc_peering_connection_accepter" "usw2_accept" {
  provider                  = aws.usw2
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_usw2.id
  auto_accept               = true
  
  tags = merge(local.tags, {
    Name = "${var.project}-${var.environment}-peering"
    Side = "Accepter"
  })
}

# VPC Peering Routes
resource "aws_route" "use1_to_usw2" {
  provider                  = aws.use1
  route_table_id            = aws_route_table.use1_private.id
  destination_cidr_block    = aws_vpc.usw2.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_usw2.id
}

resource "aws_route" "usw2_to_use1" {
  provider                  = aws.usw2
  route_table_id            = aws_route_table.usw2_private.id
  destination_cidr_block    = aws_vpc.use1.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_usw2.id
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "use1_vpc_flow_logs" {
  provider          = aws.use1
  name              = "/aws/vpc/flowlogs/${local.use1_name_prefix}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.use1.arn
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-vpc-flow-logs"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "usw2_vpc_flow_logs" {
  provider          = aws.usw2
  name              = "/aws/vpc/flowlogs/${local.usw2_name_prefix}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.usw2.arn
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-vpc-flow-logs"
    Region = "us-west-2"
  })
}

resource "aws_iam_role" "vpc_flow_logs_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-vpc-flow-logs-role"
  
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
  
  tags = local.tags
}

resource "aws_iam_role" "vpc_flow_logs_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-vpc-flow-logs-role"
  
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
  
  tags = local.tags
}

resource "aws_iam_role_policy" "vpc_flow_logs_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-vpc-flow-logs-policy"
  role     = aws_iam_role.vpc_flow_logs_use1.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.use1_vpc_flow_logs.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-vpc-flow-logs-policy"
  role     = aws_iam_role.vpc_flow_logs_usw2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.usw2_vpc_flow_logs.arn}:*"
      }
    ]
  })
}

resource "aws_flow_log" "use1_vpc" {
  provider        = aws.use1
  iam_role_arn    = aws_iam_role.vpc_flow_logs_use1.arn
  log_destination = aws_cloudwatch_log_group.use1_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.use1.id
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-vpc-flow-log"
    Region = "us-east-1"
  })
}

resource "aws_flow_log" "usw2_vpc" {
  provider        = aws.usw2
  iam_role_arn    = aws_iam_role.vpc_flow_logs_usw2.arn
  log_destination = aws_cloudwatch_log_group.usw2_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.usw2.id
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-vpc-flow-log"
    Region = "us-west-2"
  })
}

# Security Groups - Bastion
resource "aws_security_group" "use1_bastion" {
  provider    = aws.use1
  name        = "${local.use1_name_prefix}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.use1.id
  
  dynamic "ingress" {
    for_each = length(var.bastion_allowed_cidrs) > 0 ? var.bastion_allowed_cidrs : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-bastion-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "usw2_bastion" {
  provider    = aws.usw2
  name        = "${local.usw2_name_prefix}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.usw2.id
  
  dynamic "ingress" {
    for_each = length(var.bastion_allowed_cidrs) > 0 ? var.bastion_allowed_cidrs : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-bastion-sg"
    Region = "us-west-2"
  })
}

# Security Groups - ALB
resource "aws_security_group" "use1_alb" {
  provider    = aws.use1
  name        = "${local.use1_name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.use1.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-alb-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "usw2_alb" {
  provider    = aws.usw2
  name        = "${local.usw2_name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.usw2.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-alb-sg"
    Region = "us-west-2"
  })
}

# Security Groups - App
resource "aws_security_group" "use1_app" {
  provider    = aws.use1
  name        = "${local.use1_name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.use1.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.use1_alb.id]
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.use1_alb.id]
  }
  
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.use1_bastion.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "usw2_app" {
  provider    = aws.usw2
  name        = "${local.usw2_name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.usw2.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.usw2_alb.id]
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.usw2_alb.id]
  }
  
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.usw2_bastion.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-sg"
    Region = "us-west-2"
  })
}

# Security Groups - RDS
resource "aws_security_group" "use1_rds" {
  provider    = aws.use1
  name        = "${local.use1_name_prefix}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.use1.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.use1_app.id]
  }
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.use1_bastion.id]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds-sg"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "usw2_rds" {
  provider    = aws.usw2
  name        = "${local.usw2_name_prefix}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.usw2.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.usw2_app.id]
  }
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.usw2_bastion.id]
  }
  
  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds-sg"
    Region = "us-west-2"
  })
}

# IAM Roles - Bastion
resource "aws_iam_role" "bastion_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-bastion-role"