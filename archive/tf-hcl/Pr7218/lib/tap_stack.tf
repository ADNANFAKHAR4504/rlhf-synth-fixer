# Local values for consistent naming and configuration
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}


locals {
  project_name = "PaymentPlatform"
  environment  = var.environment_suffix
  region       = data.aws_region.current.id
  account_id   = data.aws_caller_identity.current.account_id

  # Resource naming convention
  name_prefix = "${lower(local.project_name)}-${lower(local.environment)}"

  # VPC CIDR blocks
  vpc_cidr      = "10.0.0.0/16"
  public_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  db_cidrs      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  # Common tags for all resources
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    CostCenter  = "Finance"
    ManagedBy   = "Terraform"
    Owner       = "SecurityTeam"
  }

  # AZ mapping
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# KMS CMK for encryption
resource "aws_kms_key" "vpc_encryption" {
  description             = "KMS key for VPC encryption - ${local.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow VPC Flow Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
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
            "aws:SourceAccount" = local.account_id
          }
        }
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-kms"
  })
}

resource "aws_kms_alias" "vpc_encryption" {
  name          = "alias/${local.name_prefix}-vpc"
  target_key_id = aws_kms_key.vpc_encryption.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = { for idx, cidr in local.public_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  } }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${each.value.availability_zone}"
    Type = "Public"
    Tier = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = { for idx, cidr in local.private_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  } }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr_block
  availability_zone = each.value.availability_zone

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${each.value.availability_zone}"
    Type = "Private"
    Tier = "Application"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  for_each = { for idx, cidr in local.db_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  } }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr_block
  availability_zone = each.value.availability_zone

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${each.value.availability_zone}"
    Type = "Database"
    Tier = "Data"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = aws_subnet.public

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${each.value.availability_zone}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways - One per AZ for high availability
resource "aws_nat_gateway" "main" {
  for_each = aws_subnet.public

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${each.value.availability_zone}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "Public"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables - One per AZ
resource "aws_route_table" "private" {
  for_each = aws_subnet.private

  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${aws_subnet.private[each.key].availability_zone}"
    Type = "Private"
  })
}

resource "aws_route" "private_nat" {
  for_each = aws_route_table.private

  route_table_id         = each.value.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[each.key].id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

# Database Route Table (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
    Type = "Database"
  })
}

resource "aws_route_table_association" "database" {
  for_each = aws_subnet.database

  subnet_id      = each.value.id
  route_table_id = aws_route_table.database.id
}

# VPC Endpoints
# S3 Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${local.region}.s3"

  route_table_ids = concat(
    [for rt in aws_route_table.private : rt.id],
    [aws_route_table.database.id]
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# DynamoDB Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${local.region}.dynamodb"

  route_table_ids = concat(
    [for rt in aws_route_table.private : rt.id],
    [aws_route_table.database.id]
  )

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

# Network ACLs
# Public NACL
resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  subnet_ids = [for subnet in aws_subnet.public : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-nacl"
    Type = "Public"
  })
}

# Public NACL Rules
resource "aws_network_acl_rule" "public_https_ingress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_https_egress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ephemeral_ingress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_ephemeral_egress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  subnet_ids = [for subnet in aws_subnet.private : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-nacl"
    Type = "Private"
  })
}

# Private NACL Rules
resource "aws_network_acl_rule" "private_https_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_https_egress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_ssh_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.admin_cidr
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "private_postgres_to_db" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "private_ephemeral_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_ephemeral_egress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 1024
  to_port        = 65535
}

# Database NACL
resource "aws_network_acl" "database" {
  vpc_id = aws_vpc.main.id

  subnet_ids = [for subnet in aws_subnet.database : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-nacl"
    Type = "Database"
  })
}

# Database NACL Rules
resource "aws_network_acl_rule" "database_postgres_ingress" {
  for_each = { for idx, cidr in local.private_cidrs : idx => cidr }

  network_acl_id = aws_network_acl.database.id
  rule_number    = 100 + tonumber(each.key)
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "database_ephemeral_egress" {
  for_each = { for idx, cidr in local.private_cidrs : idx => cidr }

  network_acl_id = aws_network_acl.database.id
  rule_number    = 100 + tonumber(each.key)
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 1024
  to_port        = 65535
}

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  bucket = "${local.name_prefix}-vpc-flow-logs-${local.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  bucket = aws_s3_bucket.flow_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.vpc_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  bucket = aws_s3_bucket.flow_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  bucket = aws_s3_bucket.flow_logs[0].id

  rule {
    id     = "expire_old_logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.flow_logs_retention_days
    }
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  log_destination_type = "s3"
  log_destination      = "${aws_s3_bucket.flow_logs[0].arn}/"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

# Transit Gateway Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  count = var.enable_transit_gateway ? 1 : 0

  subnet_ids         = [for subnet in aws_subnet.private : subnet.id]
  transit_gateway_id = var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id
  vpc_id             = aws_vpc.main.id

  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = true
  transit_gateway_default_route_table_propagation = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-attachment"
  })
}

# Create Transit Gateway if not provided
resource "aws_ec2_transit_gateway" "main" {
  count = var.enable_transit_gateway && var.transit_gateway_id == "" ? 1 : 0

  description                     = "Transit Gateway for ${local.name_prefix}"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw"
  })
}

# Routes for Transit Gateway
resource "aws_route" "private_to_tgw" {
  for_each = var.enable_transit_gateway ? aws_route_table.private : {}

  route_table_id         = each.value.id
  destination_cidr_block = "192.168.0.0/16" # Example for other regions
  transit_gateway_id     = var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.main]
}
