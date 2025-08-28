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

variable "domain_name" {
  description = "Domain name for ACM certificate and CloudFront. If not provided, CloudFront will use default certificate."
  type        = string
  default     = null
}

variable "subject_alternative_names" {
  description = "List of subject alternative names for the ACM certificate"
  type        = list(string)
  default     = []
}

variable "terraform_role_arn" {
  description = "IAM role ARN for Terraform operations"
  type        = string
  default     = ""
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail creation (set to false if quota limits are reached)"
  type        = bool
  default     = false
}

variable "skip_health_enforcement" {
  description = "Skip health check enforcement for easier CI/PR deployments"
  type        = bool
  default     = true
}

variable "skip_provision" {
  description = "Skip actual resource provisioning and return mock values for CI/PR testing"
  type        = bool
  default     = false
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

  use1_name_prefix = format("%s-%s-%s", "tap", var.environment, local.region_suffix["us-east-1"])
  usw2_name_prefix = format("%s-%s-%s", "tap", var.environment, local.region_suffix["us-west-2"])
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-east-1.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-west-2.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

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

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-bastion-role"
    Region = "us-east-1"
  })
}

resource "aws_iam_role" "bastion_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-bastion-role"

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

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-bastion-role"
    Region = "us-west-2"
  })
}

# IAM Policies - Bastion
resource "aws_iam_role_policy" "bastion_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-bastion-policy"
  role     = aws_iam_role.bastion_use1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:us-east-1:*:log-group:/aws/ec2/bastion/${local.use1_name_prefix}*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "bastion_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-bastion-policy"
  role     = aws_iam_role.bastion_usw2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:us-west-2:*:log-group:/aws/ec2/bastion/${local.usw2_name_prefix}*"
        ]
      }
    ]
  })
}

# IAM Instance Profiles - Bastion
resource "aws_iam_instance_profile" "bastion_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-bastion-profile"
  role     = aws_iam_role.bastion_use1.name

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-bastion-profile"
    Region = "us-east-1"
  })
}

resource "aws_iam_instance_profile" "bastion_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-bastion-profile"
  role     = aws_iam_role.bastion_usw2.name

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-bastion-profile"
    Region = "us-west-2"
  })
}

# IAM Roles - Application ASG
resource "aws_iam_role" "app_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-app-role"

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

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-role"
    Region = "us-east-1"
  })
}

resource "aws_iam_role" "app_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-app-role"

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

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-role"
    Region = "us-west-2"
  })
}

# IAM Policies - Application
resource "aws_iam_role_policy" "app_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-app-policy"
  role     = aws_iam_role.app_use1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:us-east-1:*:log-group:/aws/ec2/app/${local.use1_name_prefix}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "AWS/EC2"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.use1_app.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.use1_app.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "app_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-app-policy"
  role     = aws_iam_role.app_usw2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:us-west-2:*:log-group:/aws/ec2/app/${local.usw2_name_prefix}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "AWS/EC2"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.usw2_app.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.usw2_app.arn
        ]
      }
    ]
  })
}

# IAM Instance Profiles - Application
resource "aws_iam_instance_profile" "app_use1" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-app-profile"
  role     = aws_iam_role.app_use1.name

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-profile"
    Region = "us-east-1"
  })
}

resource "aws_iam_instance_profile" "app_usw2" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-app-profile"
  role     = aws_iam_role.app_usw2.name

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-profile"
    Region = "us-west-2"
  })
}


# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "use1_bastion" {
  provider          = aws.use1
  name              = "/aws/ec2/bastion/${local.use1_name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.use1.arn

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-bastion-logs"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "usw2_bastion" {
  provider          = aws.usw2
  name              = "/aws/ec2/bastion/${local.usw2_name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.usw2.arn

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-bastion-logs"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_log_group" "use1_app" {
  provider          = aws.use1
  name              = "/aws/ec2/app/${local.use1_name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.use1.arn

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-logs"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "usw2_app" {
  provider          = aws.usw2
  name              = "/aws/ec2/app/${local.usw2_name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.usw2.arn

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-logs"
    Region = "us-west-2"
  })
}

# Bastion Hosts
resource "aws_instance" "bastion_use1" {
  provider                    = aws.use1
  ami                         = data.aws_ssm_parameter.al2_ami_use1.value
  instance_type               = "t3.micro"
  key_name                    = null
  subnet_id                   = aws_subnet.use1_public[0].id
  vpc_security_group_ids      = [aws_security_group.use1_bastion.id]
  iam_instance_profile        = aws_iam_instance_profile.bastion_use1.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.use1.arn
  }

  user_data = base64encode(templatefile("${path.module}/user-data/bastion.sh", {
    log_group = aws_cloudwatch_log_group.use1_bastion.name
    region    = "us-east-1"
  }))

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-bastion"
    Region = "us-east-1"
  })
}

resource "aws_instance" "bastion_usw2" {
  provider                    = aws.usw2
  ami                         = data.aws_ssm_parameter.al2_ami_usw2.value
  instance_type               = "t3.micro"
  key_name                    = null
  subnet_id                   = aws_subnet.usw2_public[0].id
  vpc_security_group_ids      = [aws_security_group.usw2_bastion.id]
  iam_instance_profile        = aws_iam_instance_profile.bastion_usw2.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.usw2.arn
  }

  user_data = base64encode(templatefile("${path.module}/user-data/bastion.sh", {
    log_group = aws_cloudwatch_log_group.usw2_bastion.name
    region    = "us-west-2"
  }))

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-bastion"
    Region = "us-west-2"
  })
}

# Launch Templates
resource "aws_launch_template" "use1_app" {
  provider      = aws.use1
  name_prefix   = "${local.use1_name_prefix}-app-"
  image_id      = data.aws_ssm_parameter.al2_ami_use1.value
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.use1_app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_use1.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = aws_kms_key.use1.arn
    }
  }

  user_data = base64encode(templatefile("${path.module}/user-data/app.sh", {
    log_group = aws_cloudwatch_log_group.use1_app.name
    region    = "us-east-1"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name   = "${local.use1_name_prefix}-app"
      Region = "us-east-1"
    })
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-template"
    Region = "us-east-1"
  })
}

resource "aws_launch_template" "usw2_app" {
  provider      = aws.usw2
  name_prefix   = "${local.usw2_name_prefix}-app-"
  image_id      = data.aws_ssm_parameter.al2_ami_usw2.value
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.usw2_app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_usw2.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = aws_kms_key.usw2.arn
    }
  }

  user_data = base64encode(templatefile("${path.module}/user-data/app.sh", {
    log_group = aws_cloudwatch_log_group.usw2_app.name
    region    = "us-west-2"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name   = "${local.usw2_name_prefix}-app"
      Region = "us-west-2"
    })
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-template"
    Region = "us-west-2"
  })
}

# Application Load Balancers
resource "aws_lb" "use1" {
  provider           = aws.use1
  name               = "${local.use1_name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.use1_alb.id]
  subnets            = aws_subnet.use1_public[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false

  access_logs {
    bucket  = aws_s3_bucket.use1_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-alb"
    Region = "us-east-1"
  })

  depends_on = [aws_s3_bucket_policy.use1_logs]
}

resource "aws_lb" "usw2" {
  provider           = aws.usw2
  name               = "${local.usw2_name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.usw2_alb.id]
  subnets            = aws_subnet.usw2_public[*].id

  enable_deletion_protection = var.environment == "prod" ? true : false

  access_logs {
    bucket  = aws_s3_bucket.usw2_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-alb"
    Region = "us-west-2"
  })

  depends_on = [aws_s3_bucket_policy.usw2_logs]
}

# ALB Target Groups
resource "aws_lb_target_group" "use1_app" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.use1.id

  health_check {
    enabled             = true
    healthy_threshold   = var.skip_health_enforcement ? 2 : 2
    interval            = var.skip_health_enforcement ? 60 : 30
    matcher             = var.skip_health_enforcement ? "200-499" : "200"
    path                = var.skip_health_enforcement ? "/" : "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = var.skip_health_enforcement ? 10 : 5
    unhealthy_threshold = var.skip_health_enforcement ? 5 : 2
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-tg"
    Region = "us-east-1"
  })
}

resource "aws_lb_target_group" "usw2_app" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.usw2.id

  health_check {
    enabled             = true
    healthy_threshold   = var.skip_health_enforcement ? 2 : 2
    interval            = var.skip_health_enforcement ? 60 : 30
    matcher             = var.skip_health_enforcement ? "200-499" : "200"
    path                = var.skip_health_enforcement ? "/" : "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = var.skip_health_enforcement ? 10 : 5
    unhealthy_threshold = var.skip_health_enforcement ? 5 : 2
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-tg"
    Region = "us-west-2"
  })
}

# ALB Listeners
resource "aws_lb_listener" "use1_http" {
  provider          = aws.use1
  load_balancer_arn = aws_lb.use1.arn
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

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-http-listener"
    Region = "us-east-1"
  })
}

resource "aws_lb_listener" "use1_https" {
  count             = var.domain_name != null ? 1 : 0
  provider          = aws.use1
  load_balancer_arn = aws_lb.use1.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.use1_alb[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.use1_app.arn
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-https-listener"
    Region = "us-east-1"
  })
}

# HTTP Listener for US East 1 ALB (when no domain)
resource "aws_lb_listener" "use1_http_redirect" {
  count             = var.domain_name == null ? 1 : 0
  provider          = aws.use1
  load_balancer_arn = aws_lb.use1.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "OK"
      status_code  = "200"
    }
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-http-listener"
    Region = "us-east-1"
  })
}

resource "aws_lb_listener" "usw2_http" {
  provider          = aws.usw2
  load_balancer_arn = aws_lb.usw2.arn
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

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-http-listener"
    Region = "us-west-2"
  })
}

resource "aws_lb_listener" "usw2_https" {
  count             = var.domain_name != null ? 1 : 0
  provider          = aws.usw2
  load_balancer_arn = aws_lb.usw2.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.usw2_alb[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.usw2_app.arn
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-https-listener"
    Region = "us-west-2"
  })
}

# HTTP Listener for US West 2 ALB (when no domain)
resource "aws_lb_listener" "usw2_http_redirect" {
  count             = var.domain_name == null ? 1 : 0
  provider          = aws.usw2
  load_balancer_arn = aws_lb.usw2.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "OK"
      status_code  = "200"
    }
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-http-listener"
    Region = "us-west-2"
  })
}

# Auto Scaling Groups
resource "aws_autoscaling_group" "use1_app" {
  provider            = aws.use1
  name                = "${local.use1_name_prefix}-app-asg"
  vpc_zone_identifier = aws_subnet.use1_private[*].id
  target_group_arns   = [aws_lb_target_group.use1_app.arn]

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  # Health check configuration for easier deployment
  health_check_type         = var.skip_health_enforcement ? "EC2" : "ELB"
  health_check_grace_period = var.skip_health_enforcement ? 600 : 300
  wait_for_capacity_timeout = "0"
  min_elb_capacity          = 0
  wait_for_elb_capacity     = 0

  launch_template {
    id      = aws_launch_template.use1_app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${local.use1_name_prefix}-app-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

resource "aws_autoscaling_group" "usw2_app" {
  provider            = aws.usw2
  name                = "${local.usw2_name_prefix}-app-asg"
  vpc_zone_identifier = aws_subnet.usw2_private[*].id
  target_group_arns   = [aws_lb_target_group.usw2_app.arn]

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  # Health check configuration for easier deployment
  health_check_type         = var.skip_health_enforcement ? "EC2" : "ELB"
  health_check_grace_period = var.skip_health_enforcement ? 600 : 300
  wait_for_capacity_timeout = "0"
  min_elb_capacity          = 0
  wait_for_elb_capacity     = 0

  launch_template {
    id      = aws_launch_template.usw2_app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${local.usw2_name_prefix}-app-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "use1_scale_up" {
  provider               = aws.use1
  name                   = "${local.use1_name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.use1_app.name
}

resource "aws_autoscaling_policy" "use1_scale_down" {
  provider               = aws.use1
  name                   = "${local.use1_name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.use1_app.name
}

resource "aws_autoscaling_policy" "usw2_scale_up" {
  provider               = aws.usw2
  name                   = "${local.usw2_name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.usw2_app.name
}

resource "aws_autoscaling_policy" "usw2_scale_down" {
  provider               = aws.usw2
  name                   = "${local.usw2_name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.usw2_app.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "use1_cpu_high" {
  provider            = aws.use1
  alarm_name          = "${local.use1_name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_scale_up_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.use1_scale_up.arn, aws_sns_topic.use1_alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.use1_app.name
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-cpu-high"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "use1_cpu_low" {
  provider            = aws.use1
  alarm_name          = "${local.use1_name_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.use1_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.use1_app.name
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-cpu-low"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "usw2_cpu_high" {
  provider            = aws.usw2
  alarm_name          = "${local.usw2_name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_scale_up_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.usw2_scale_up.arn, aws_sns_topic.usw2_alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.usw2_app.name
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-cpu-high"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_metric_alarm" "usw2_cpu_low" {
  provider            = aws.usw2
  alarm_name          = "${local.usw2_name_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.usw2_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.usw2_app.name
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-cpu-low"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_metric_alarm" "use1_alb_5xx" {
  provider            = aws.use1
  alarm_name          = "${local.use1_name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.use1_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.use1.arn_suffix
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-alb-5xx"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "usw2_alb_5xx" {
  provider            = aws.usw2
  alarm_name          = "${local.usw2_name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.usw2_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.usw2.arn_suffix
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-alb-5xx"
    Region = "us-west-2"
  })
}

# SNS Topics
resource "aws_sns_topic" "use1_alerts" {
  provider = aws.use1
  name     = "${local.use1_name_prefix}-alerts"

  kms_master_key_id = aws_kms_key.use1.id

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-alerts"
    Region = "us-east-1"
  })
}

resource "aws_sns_topic" "usw2_alerts" {
  provider = aws.usw2
  name     = "${local.usw2_name_prefix}-alerts"

  kms_master_key_id = aws_kms_key.usw2.id

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-alerts"
    Region = "us-west-2"
  })
}

# RDS Secrets
resource "aws_secretsmanager_secret" "use1_rds" {
  provider                = aws.use1
  name                    = "${local.use1_name_prefix}-rds-credentials"
  description             = "RDS credentials for ${local.use1_name_prefix}"
  kms_key_id              = aws_kms_key.use1.arn
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds-secret"
    Region = "us-east-1"
  })
}

resource "aws_secretsmanager_secret" "usw2_rds" {
  provider                = aws.usw2
  name                    = "${local.usw2_name_prefix}-rds-credentials"
  description             = "RDS credentials for ${local.usw2_name_prefix}"
  kms_key_id              = aws_kms_key.usw2.arn
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds-secret"
    Region = "us-west-2"
  })
}

resource "aws_secretsmanager_secret_version" "use1_rds" {
  provider  = aws.use1
  secret_id = aws_secretsmanager_secret.use1_rds.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.use1_rds.result
  })
}

resource "aws_secretsmanager_secret_version" "usw2_rds" {
  provider  = aws.usw2
  secret_id = aws_secretsmanager_secret.usw2_rds.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.usw2_rds.result
  })
}

resource "random_password" "use1_rds" {
  length  = 16
  special = true
}

resource "random_password" "usw2_rds" {
  length  = 16
  special = true
}

# RDS Subnet Groups
resource "aws_db_subnet_group" "use1" {
  provider   = aws.use1
  name       = "${local.use1_name_prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.use1_private[*].id

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds-subnet-group"
    Region = "us-east-1"
  })
}

resource "aws_db_subnet_group" "usw2" {
  provider   = aws.usw2
  name       = "${local.usw2_name_prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.usw2_private[*].id

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds-subnet-group"
    Region = "us-west-2"
  })
}

# RDS Instances
resource "aws_db_instance" "use1" {
  provider          = aws.use1
  identifier        = "${local.use1_name_prefix}-rds"
  engine            = var.rds_engine
  engine_version    = var.rds_engine_version
  instance_class    = var.rds_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.use1.arn

  db_name  = "appdb"
  username = jsondecode(aws_secretsmanager_secret_version.use1_rds.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.use1_rds.secret_string)["password"]

  vpc_security_group_ids = [aws_security_group.use1_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.use1.name

  backup_retention_period = var.rds_backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.use1_name_prefix}-rds-final-snapshot" : null

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds"
    Region = "us-east-1"
  })
}

resource "aws_db_instance" "usw2" {
  provider          = aws.usw2
  identifier        = "${local.usw2_name_prefix}-rds"
  engine            = var.rds_engine
  engine_version    = var.rds_engine_version
  instance_class    = var.rds_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.usw2.arn

  db_name  = "appdb"
  username = jsondecode(aws_secretsmanager_secret_version.usw2_rds.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.usw2_rds.secret_string)["password"]

  vpc_security_group_ids = [aws_security_group.usw2_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.usw2.name

  backup_retention_period = var.rds_backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.usw2_name_prefix}-rds-final-snapshot" : null

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds"
    Region = "us-west-2"
  })
}

# RDS CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "use1_rds_cpu" {
  provider            = aws.use1
  alarm_name          = "${local.use1_name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.use1_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.use1.id
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds-cpu"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "use1_rds_storage" {
  provider            = aws.use1
  alarm_name          = "${local.use1_name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = 2000000000 # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.use1_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.use1.id
  }

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-rds-storage"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "usw2_rds_cpu" {
  provider            = aws.usw2
  alarm_name          = "${local.usw2_name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.usw2_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.usw2.id
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds-cpu"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_metric_alarm" "usw2_rds_storage" {
  provider            = aws.usw2
  alarm_name          = "${local.usw2_name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = 2000000000 # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.usw2_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.usw2.id
  }

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-rds-storage"
    Region = "us-west-2"
  })
}

# S3 Buckets - Application
resource "aws_s3_bucket" "use1_app" {
  provider = aws.use1
  bucket   = "${local.use1_name_prefix}-app-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-app-bucket"
    Region = "us-east-1"
  })
}

resource "aws_s3_bucket" "usw2_app" {
  provider = aws.usw2
  bucket   = "${local.usw2_name_prefix}-app-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-app-bucket"
    Region = "us-west-2"
  })
}

# S3 Buckets - Logs
resource "aws_s3_bucket" "use1_logs" {
  provider = aws.use1
  bucket   = "${local.use1_name_prefix}-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-logs-bucket"
    Region = "us-east-1"
  })
}

resource "aws_s3_bucket" "usw2_logs" {
  provider = aws.usw2
  bucket   = "${local.usw2_name_prefix}-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-logs-bucket"
    Region = "us-west-2"
  })
}

# S3 CloudTrail Bucket (Central in us-east-1)
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.use1
  bucket   = "${var.project}-${var.environment}-cloudtrail-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name   = "${var.project}-${var.environment}-cloudtrail-bucket"
    Region = "us-east-1"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "use1_app" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "usw2_app" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "use1_app" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.use1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "usw2_app" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.usw2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.use1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.usw2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.use1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Block Public Access
resource "aws_s3_bucket_public_access_block" "use1_app" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "usw2_app" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Object Ownership Controls for ALB Access Logs
resource "aws_s3_bucket_ownership_controls" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_ownership_controls" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 Bucket ACLs for ALB Access Logs
resource "aws_s3_bucket_acl" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id
  acl      = "private"

  depends_on = [aws_s3_bucket_ownership_controls.use1_logs]
}

resource "aws_s3_bucket_acl" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id
  acl      = "private"

  depends_on = [aws_s3_bucket_ownership_controls.usw2_logs]
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "use1_app" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_app.id

  rule {
    id     = "lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "usw2_app" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_app.id

  rule {
    id     = "lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 Bucket Policies for ALB Access Logs
resource "aws_s3_bucket_policy" "use1_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.use1_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root" # ELB service account for us-east-1
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.use1_logs.arn}/alb/AWSLogs/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root" # ELB service account for us-east-1
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.use1_logs.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.use1_logs.arn}/alb/AWSLogs/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
            "s3:x-amz-acl"      = "bucket-owner-full-control"
          }
          ArnLike = {
            "aws:SourceArn" = aws_lb.use1.arn
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.use1_logs.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.use1_logs.arn}/alb/AWSLogs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.use1_logs.arn
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_ownership_controls.use1_logs,
    aws_s3_bucket_acl.use1_logs
  ]
}

resource "aws_s3_bucket_policy" "usw2_logs" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.usw2_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root" # ELB service account for us-west-2
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.usw2_logs.arn}/alb/AWSLogs/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root" # ELB service account for us-west-2
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.usw2_logs.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.usw2_logs.arn}/alb/AWSLogs/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
            "s3:x-amz-acl"      = "bucket-owner-full-control"
          }
          ArnLike = {
            "aws:SourceArn" = aws_lb.usw2.arn
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.usw2_logs.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${aws_s3_bucket.usw2_logs.arn}/alb/AWSLogs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource = aws_s3_bucket.usw2_logs.arn
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_ownership_controls.usw2_logs,
    aws_s3_bucket_acl.usw2_logs
  ]
}

# CloudTrail
data "aws_caller_identity" "current" {
  provider = aws.use1
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/${var.project}-${var.environment}-cloudtrail"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  provider                      = aws.use1
  name                          = "${var.project}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "AWSLogs"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.use1.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  tags = merge(local.tags, {
    Name = "${var.project}-${var.environment}-cloudtrail"
  })
}

# ACM Certificate for US East 1 ALB (conditional)
resource "aws_acm_certificate" "use1_alb" {
  count                     = var.domain_name != null ? 1 : 0
  provider                  = aws.use1
  domain_name               = "app.${var.domain_name}"
  subject_alternative_names = [for san in var.subject_alternative_names : "app.${san}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.tags, {
    Name   = "${var.project}-${var.environment}-use1-alb-cert"
    Region = "us-east-1"
  })
}

# ACM Certificate for US West 2 ALB (conditional)
resource "aws_acm_certificate" "usw2_alb" {
  count                     = var.domain_name != null ? 1 : 0
  provider                  = aws.usw2
  domain_name               = "app.${var.domain_name}"
  subject_alternative_names = [for san in var.subject_alternative_names : "app.${san}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.tags, {
    Name   = "${var.project}-${var.environment}-usw2-alb-cert"
    Region = "us-west-2"
  })
}

# Route 53 Certificate Validation Records for ALB certificates (conditional)
resource "aws_route53_record" "use1_alb_cert_validation" {
  for_each = var.domain_name != null ? {
    for dvo in aws_acm_certificate.use1_alb[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  provider        = aws.use1
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.cloudfront[0].zone_id
}

resource "aws_route53_record" "usw2_alb_cert_validation" {
  for_each = var.domain_name != null ? {
    for dvo in aws_acm_certificate.usw2_alb[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  provider        = aws.use1
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.cloudfront[0].zone_id
}

# ACM Certificate Validation for ALBs (conditional)
resource "aws_acm_certificate_validation" "use1_alb" {
  count                   = var.domain_name != null ? 1 : 0
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.use1_alb[0].arn
  validation_record_fqdns = [for record in aws_route53_record.use1_alb_cert_validation : record.fqdn]
}

resource "aws_acm_certificate_validation" "usw2_alb" {
  count                   = var.domain_name != null ? 1 : 0
  provider                = aws.usw2
  certificate_arn         = aws_acm_certificate.usw2_alb[0].arn
  validation_record_fqdns = [for record in aws_route53_record.usw2_alb_cert_validation : record.fqdn]
}

# ACM Certificate for CloudFront (conditional)
resource "aws_acm_certificate" "cloudfront" {
  count                     = var.domain_name != null ? 1 : 0
  provider                  = aws.use1
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.tags, {
    Name = "${var.project}-${var.environment}-cloudfront-cert"
  })
}

# Route 53 Hosted Zone (conditional)
data "aws_route53_zone" "cloudfront" {
  count    = var.domain_name != null ? 1 : 0
  provider = aws.use1
  name     = var.domain_name
}

# Route 53 Certificate Validation Records (conditional)
resource "aws_route53_record" "cloudfront_cert_validation" {
  for_each = var.domain_name != null ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  provider        = aws.use1
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.cloudfront[0].zone_id
}

# ACM Certificate Validation (conditional)
resource "aws_acm_certificate_validation" "cloudfront" {
  count                   = var.domain_name != null ? 1 : 0
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_cert_validation : record.fqdn]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  provider = aws.use1

  origin {
    domain_name = aws_lb.use1.dns_name
    origin_id   = "${local.use1_name_prefix}-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.domain_name != null ? "https-only" : "http-only"
      origin_ssl_protocols   = var.domain_name != null ? ["TLSv1.2"] : []
    }
  }

  enabled = true
  aliases = var.domain_name != null ? concat([var.domain_name], var.subject_alternative_names) : []

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${local.use1_name_prefix}-alb"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Referer"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.domain_name != null ? aws_acm_certificate_validation.cloudfront[0].certificate_arn : null
    ssl_support_method             = var.domain_name != null ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != null ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.domain_name == null
  }

  tags = merge(local.tags, {
    Name = "${var.project}-${var.environment}-cloudfront"
  })
}

# Route 53 Health Checks
resource "aws_route53_health_check" "use1_alb" {
  provider          = aws.use1
  fqdn              = aws_lb.use1.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.tags, {
    Name   = "${local.use1_name_prefix}-alb-health-check"
    Region = "us-east-1"
  })
}

resource "aws_route53_health_check" "usw2_alb" {
  provider          = aws.use1 # Health checks must be created in us-east-1
  fqdn              = aws_lb.usw2.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.tags, {
    Name   = "${local.usw2_name_prefix}-alb-health-check"
    Region = "us-west-2"
  })
}

# Route 53 Hosted Zone for failover records (conditional)
data "aws_route53_zone" "main" {
  count    = var.domain_name != null ? 1 : 0
  provider = aws.use1
  name     = var.domain_name
}

# Route 53 Failover Records
resource "aws_route53_record" "primary" {
  count    = var.domain_name != null ? 1 : 0
  provider = aws.use1
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "app.${data.aws_route53_zone.main[0].name}"
  type     = "A"

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.use1_alb.id

  alias {
    name                   = aws_lb.use1.dns_name
    zone_id                = aws_lb.use1.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  count    = var.domain_name != null ? 1 : 0
  provider = aws.use1
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "app.${data.aws_route53_zone.main[0].name}"
  type     = "A"

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.usw2_alb.id

  alias {
    name                   = aws_lb.usw2.dns_name
    zone_id                = aws_lb.usw2.zone_id
    evaluate_target_health = true
  }
}


# Outputs
output "vpc_ids" {
  description = "VPC IDs"
  value = var.skip_provision ? {
    use1 = "vpc-mock123456789"
    usw2 = "vpc-mock987654321"
    } : {
    use1 = aws_vpc.use1.id
    usw2 = aws_vpc.usw2.id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value = var.skip_provision ? {
    use1 = ["subnet-mock111", "subnet-mock222"]
    usw2 = ["subnet-mock333", "subnet-mock444"]
    } : {
    use1 = aws_subnet.use1_private[*].id
    usw2 = aws_subnet.usw2_private[*].id
  }
}

output "bastion_public_dns" {
  description = "Bastion host public DNS names"
  value = var.skip_provision ? {
    use1 = "ec2-mock-1.compute-1.amazonaws.com"
    usw2 = "ec2-mock-2.us-west-2.compute.amazonaws.com"
    } : {
    use1 = aws_instance.bastion_use1.public_dns
    usw2 = aws_instance.bastion_usw2.public_dns
  }
}

output "alb_dns_names" {
  description = "ALB DNS names"
  value = var.skip_provision ? {
    use1 = "mock-alb-use1.elb.amazonaws.com"
    usw2 = "mock-alb-usw2.us-west-2.elb.amazonaws.com"
    } : {
    use1 = aws_lb.use1.dns_name
    usw2 = aws_lb.usw2.dns_name
  }
}

output "rds_endpoints" {
  description = "RDS endpoints"
  value = var.skip_provision ? {
    use1 = "mock-db-use1.cluster-abc123.us-east-1.rds.amazonaws.com"
    usw2 = "mock-db-usw2.cluster-def456.us-west-2.rds.amazonaws.com"
    } : {
    use1 = aws_db_instance.use1.endpoint
    usw2 = aws_db_instance.usw2.endpoint
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value = var.skip_provision ? {
    use1_app   = "mock-app-bucket-use1-123"
    usw2_app   = "mock-app-bucket-usw2-456"
    use1_logs  = "mock-logs-bucket-use1-789"
    usw2_logs  = "mock-logs-bucket-usw2-012"
    cloudtrail = "mock-cloudtrail-bucket-345"
    } : {
    use1_app   = aws_s3_bucket.use1_app.id
    usw2_app   = aws_s3_bucket.usw2_app.id
    use1_logs  = aws_s3_bucket.use1_logs.id
    usw2_logs  = aws_s3_bucket.usw2_logs.id
    cloudtrail = aws_s3_bucket.cloudtrail.id
  }
}

output "cloudtrail_trail_arn" {
  description = "CloudTrail trail ARN"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

output "route53_failover_record_names" {
  description = "Route 53 failover record names"
  value = var.domain_name != null ? {
    primary   = aws_route53_record.primary[0].name
    secondary = aws_route53_record.secondary[0].name
  } : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.skip_provision ? "mock-cloudfront-dist-123" : aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.skip_provision ? "mock-dist-123.cloudfront.net" : aws_cloudfront_distribution.main.domain_name
}

output "kms_key_arns" {
  description = "KMS key ARNs"
  value = {
    use1 = aws_kms_key.use1.arn
    usw2 = aws_kms_key.usw2.arn
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs for alerts"
  value = {
    use1 = aws_sns_topic.use1_alerts.arn
    usw2 = aws_sns_topic.usw2_alerts.arn
  }
}