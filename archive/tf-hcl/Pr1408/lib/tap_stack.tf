#############################################
# variables
#############################################
variable "company" {
  description = "Company short name"
  type        = string
  default     = "turinggpt"
}

variable "environment" {
  description = "Environment name (dev|stg|prod)"
  type        = string
  default     = "dev"
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
  description = "Primary VPC CIDR"
  type        = string
  default     = "10.10.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "Secondary VPC CIDR"
  type        = string
  default     = "10.20.0.0/16"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project    = "fs-multiregion"
    Owner      = "platform"
    CostCenter = "fin-ops"
    Compliance = "financial"
  }
}


data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  name_prefix = "${var.company}-${var.environment}"
  common_tags = merge(var.tags, {
    Company     = var.company
    Environment = var.environment
  })
}

#############################################
# KMS (one CMK per region) – for logs/data
#############################################
resource "aws_kms_key" "logs_primary" {
  description             = "KMS CMK for CloudWatch Logs & data (primary)"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Root account admin
      {
        Sid       = "AllowRootAccountAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      # Allow CloudWatch Logs service to use the key
      {
        Sid       = "AllowCWLogsUse"
        Effect    = "Allow"
        Principal = { Service = "logs.${var.primary_region}.amazonaws.com" }
        Action = [
          "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_kms_alias" "logs_primary" {
  name          = "alias/${local.name_prefix}-logs"
  target_key_id = aws_kms_key.logs_primary.id
}

resource "aws_kms_key" "logs_secondary" {
  provider                = aws.secondary
  description             = "KMS CMK for CloudWatch Logs & data (secondary)"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowRootAccountAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowCWLogsUse"
        Effect    = "Allow"
        Principal = { Service = "logs.${var.secondary_region}.amazonaws.com" }
        Action = [
          "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_kms_alias" "logs_secondary" {
  provider      = aws.secondary
  name          = "alias/${local.name_prefix}-logs"
  target_key_id = aws_kms_key.logs_secondary.id
}

#############################################
# CloudWatch Log Groups (per region, encrypted)
#############################################
resource "aws_cloudwatch_log_group" "platform_primary" {
  name              = "/aws/${local.name_prefix}/platform"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.logs_primary.arn
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "platform_secondary" {
  provider          = aws.secondary
  name              = "/aws/${local.name_prefix}/platform"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.logs_secondary.arn
  tags              = local.common_tags
}

#############################################
# IAM role for VPC Flow Logs → CloudWatch
#############################################
data "aws_iam_policy_document" "vpc_flowlogs_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flowlogs_primary" {
  name               = "${local.name_prefix}-vpc-flowlogs-role-${var.primary_region}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flowlogs_trust.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "vpc_flowlogs_policy_primary" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["${aws_cloudwatch_log_group.platform_primary.arn}:*"]
  }
}

resource "aws_iam_policy" "vpc_flowlogs_primary" {
  name   = "${local.name_prefix}-vpc-flowlogs-policy-${var.primary_region}"
  policy = data.aws_iam_policy_document.vpc_flowlogs_policy_primary.json
}

resource "aws_iam_role_policy_attachment" "vpc_flowlogs_primary" {
  role       = aws_iam_role.vpc_flowlogs_primary.name
  policy_arn = aws_iam_policy.vpc_flowlogs_primary.arn
}

# Secondary region role/policy
resource "aws_iam_role" "vpc_flowlogs_secondary" {
  provider           = aws.secondary
  name               = "${local.name_prefix}-vpc-flowlogs-role-${var.secondary_region}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flowlogs_trust.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "vpc_flowlogs_policy_secondary" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["${aws_cloudwatch_log_group.platform_secondary.arn}:*"]
  }
}

resource "aws_iam_policy" "vpc_flowlogs_secondary" {
  provider = aws.secondary
  name     = "${local.name_prefix}-vpc-flowlogs-policy-${var.secondary_region}"
  policy   = data.aws_iam_policy_document.vpc_flowlogs_policy_secondary.json
}

resource "aws_iam_role_policy_attachment" "vpc_flowlogs_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.vpc_flowlogs_secondary.name
  policy_arn = aws_iam_policy.vpc_flowlogs_secondary.arn
}

#############################################
# Networking (Primary VPC)
#############################################
data "aws_availability_zones" "primary" {
  state = "available"
}

resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-${var.primary_region}"
  })
}

resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-igw-${var.primary_region}" })
}

# 3 public subnets
resource "aws_subnet" "public_primary" {
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 4, count.index) # /20s
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}-${var.primary_region}"
    Tier = "public"
  })
}

# 3 private subnets
resource "aws_subnet" "private_primary" {
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 4, count.index + 8)
  map_public_ip_on_launch = false
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}-${var.primary_region}"
    Tier = "private"
  })
}

# Public route tables + routes
resource "aws_route_table" "public_primary" {
  vpc_id = aws_vpc.primary.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-public-rt-${var.primary_region}" })
}

resource "aws_route" "public_inet_primary" {
  route_table_id         = aws_route_table.public_primary.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.primary.id
}

resource "aws_route_table_association" "public_assoc_primary" {
  count          = length(aws_subnet.public_primary)
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

# NAT per AZ for HA
resource "aws_eip" "nat_primary" {
  count      = 3
  domain     = "vpc"
  depends_on = [aws_internet_gateway.primary]
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-eip-nat-${count.index + 1}-${var.primary_region}" })
}

resource "aws_nat_gateway" "primary" {
  count         = 3
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}-${var.primary_region}" })
}

# Private route tables (one per AZ → NAT in same AZ)
resource "aws_route_table" "private_primary" {
  count  = 3
  vpc_id = aws_vpc.primary.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-private-rt-${count.index + 1}-${var.primary_region}" })
}

resource "aws_route" "private_nat_primary" {
  count                  = 3
  route_table_id         = aws_route_table.private_primary[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.primary[count.index].id
}

resource "aws_route_table_association" "private_assoc_primary" {
  count          = 3
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# Primary region VPC Flow Logs -> CloudWatch Logs
resource "aws_flow_log" "primary" {
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.platform_primary.arn
  iam_role_arn         = aws_iam_role.vpc_flowlogs_primary.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.primary.id
  tags                 = merge(local.common_tags, { Name = "${local.name_prefix}-flowlogs-${var.primary_region}" })
}




#############################################
# Networking (Secondary VPC)
#############################################
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-${var.secondary_region}"
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags     = merge(local.common_tags, { Name = "${local.name_prefix}-igw-${var.secondary_region}" })
}

resource "aws_subnet" "public_secondary" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 4, count.index)
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}-${var.secondary_region}"
    Tier = "public"
  })
}

resource "aws_subnet" "private_secondary" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 4, count.index + 8)
  map_public_ip_on_launch = false
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}-${var.secondary_region}"
    Tier = "private"
  })
}

resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags     = merge(local.common_tags, { Name = "${local.name_prefix}-public-rt-${var.secondary_region}" })
}

resource "aws_route" "public_inet_secondary" {
  provider               = aws.secondary
  route_table_id         = aws_route_table.public_secondary.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.secondary.id
}

resource "aws_route_table_association" "public_assoc_secondary" {
  provider       = aws.secondary
  count          = length(aws_subnet.public_secondary)
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_eip" "nat_secondary" {
  provider   = aws.secondary
  count      = 3
  domain     = "vpc"
  depends_on = [aws_internet_gateway.secondary]
  tags       = merge(local.common_tags, { Name = "${local.name_prefix}-eip-nat-${count.index + 1}-${var.secondary_region}" })
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 3
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}-${var.secondary_region}" })
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id
  tags     = merge(local.common_tags, { Name = "${local.name_prefix}-private-rt-${count.index + 1}-${var.secondary_region}" })
}

resource "aws_route" "private_nat_secondary" {
  provider               = aws.secondary
  count                  = 3
  route_table_id         = aws_route_table.private_secondary[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.secondary[count.index].id
}

resource "aws_route_table_association" "private_assoc_secondary" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# Secondary region VPC Flow Logs -> CloudWatch Logs
resource "aws_flow_log" "secondary" {
  provider             = aws.secondary
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.platform_secondary.arn
  iam_role_arn         = aws_iam_role.vpc_flowlogs_secondary.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.secondary.id
  tags                 = merge(local.common_tags, { Name = "${local.name_prefix}-flowlogs-${var.secondary_region}" })
}

#############################################
# Example S3 logs/data buckets (SSE-KMS)
#############################################
resource "aws_s3_bucket" "data_primary" {
  bucket        = "${local.name_prefix}-data-${var.primary_region}"
  force_destroy = false
  tags          = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_primary" {
  bucket = aws_s3_bucket.data_primary.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket" "data_secondary" {
  provider      = aws.secondary
  bucket        = "${local.name_prefix}-data-${var.secondary_region}"
  force_destroy = false
  tags          = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.data_secondary.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_secondary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

#############################################
# Minimal security groups (deny-all defaults; add as needed)
#############################################
resource "aws_security_group" "app_primary" {
  name        = "${local.name_prefix}-app-sg-${var.primary_region}"
  description = "App SG (restrictive by default)"
  vpc_id      = aws_vpc.primary.id
  tags        = local.common_tags
}

resource "aws_security_group" "app_secondary" {
  provider    = aws.secondary
  name        = "${local.name_prefix}-app-sg-${var.secondary_region}"
  description = "App SG (restrictive by default)"
  vpc_id      = aws_vpc.secondary.id
  tags        = local.common_tags
}

#############################################
# outputs
#############################################
output "primary_vpc_id" {
  value = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  value = aws_vpc.secondary.id
}

output "primary_public_subnet_ids" {
  value = aws_subnet.public_primary[*].id
}

output "primary_private_subnet_ids" {
  value = aws_subnet.private_primary[*].id
}

output "secondary_public_subnet_ids" {
  value = aws_subnet.public_secondary[*].id
}

output "secondary_private_subnet_ids" {
  value = aws_subnet.private_secondary[*].id
}

output "kms_logs_primary_arn" {
  value = aws_kms_key.logs_primary.arn
}

output "kms_logs_secondary_arn" {
  value = aws_kms_key.logs_secondary.arn
}

output "cw_log_group_primary" {
  value = aws_cloudwatch_log_group.platform_primary.name
}

output "cw_log_group_secondary" {
  value = aws_cloudwatch_log_group.platform_secondary.name
}
