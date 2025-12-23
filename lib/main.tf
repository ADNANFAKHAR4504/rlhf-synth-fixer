# main.tf - Main infrastructure resources

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# ✅ NEW: Data source for current AWS account
data "aws_caller_identity" "current" {}

# VPC - ✅ FIXED: Now uses variable for CIDR
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name           = "vpc-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name           = "igw-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Public Subnets (3 AZs)
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name           = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Tier           = "Public"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Private Subnets (3 AZs)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name           = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Tier           = "Private"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name           = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (3 AZs for high availability)
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name           = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name           = "public-route-table-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Route Tables for Private Subnets (one per NAT Gateway)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name           = "private-route-table-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ✅ FIXED: KMS Key with proper policy
resource "aws_kms_key" "main" {
  description             = "KMS key for payment processing infrastructure"
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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow DMS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name           = "payment-processing-key-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/payment-processing-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# ✅ NEW: CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name           = "vpc-flow-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ✅ NEW: IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log" {
  name = "vpc-flow-log-role-${var.environment_suffix}"

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

  tags = {
    Name           = "vpc-flow-log-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ✅ NEW: IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "vpc-flow-log-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_log.id

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
        Resource = "*"
      }
    ]
  })
}

# ✅ NEW: VPC Flow Log
resource "aws_flow_log" "main" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn

  tags = {
    Name           = "vpc-flow-log-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# CloudWatch Log Groups for ECS
resource "aws_cloudwatch_log_group" "ecs_blue" {
  name              = "/ecs/payment-processing-blue-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name           = "ecs-blue-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Blue"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_cloudwatch_log_group" "ecs_green" {
  name              = "/ecs/payment-processing-green-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name           = "ecs-green-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    DeploymentType = "Green"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# CloudWatch Log Group for DMS
resource "aws_cloudwatch_log_group" "dms" {
  count = var.enable_dms ? 1 : 0

  name              = "/dms/replication-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name           = "dms-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# ✅ NEW: CloudWatch Log Group for ALB Access Logs (not direct S3 for simplicity)
resource "aws_cloudwatch_log_group" "alb" {
  name              = "/alb/access-logs-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name           = "alb-access-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}
