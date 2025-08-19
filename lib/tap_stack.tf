# Variables
variable "org_prefix" {
  description = "Organization prefix for resource naming"
  type        = string
  default     = "acme"
  validation {
    condition     = length(var.org_prefix) <= 10
    error_message = "Organization prefix must be 10 characters or less."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "001"
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters and numbers."
  }
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

variable "allowed_ingress_cidrs" {
  description = "Organization-approved CIDR blocks for ingress"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "allowed_ports" {
  description = "Allowed ports for ingress"
  type        = list(number)
  default     = [22, 443]
}

variable "flow_logs_retention_days" {
  description = "CloudWatch Logs retention period for VPC Flow Logs"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Locals
locals {
  common_tags = merge({
    Project     = "IaC - AWS Nova Model Breaking"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }, var.tags)

  name_prefix = "${var.org_prefix}-${var.environment}-${var.environment_suffix}"
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.eu_west_1
  state    = "available"
}

# EBS Default Encryption - Primary Region
resource "aws_ebs_encryption_by_default" "primary" {
  enabled = true
}

# EBS Default Encryption - Secondary Region
resource "aws_ebs_encryption_by_default" "secondary" {
  provider = aws.eu_west_1
  enabled  = true
}

# IAM Policy Document for VPC Flow Logs
data "aws_iam_policy_document" "flow_logs_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "flow_logs_policy_primary" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:us-east-1:*:log-group:${local.name_prefix}-vpc-flow-logs-primary",
      "arn:aws:logs:us-east-1:*:log-group:${local.name_prefix}-vpc-flow-logs-primary:*"
    ]
  }
}

data "aws_iam_policy_document" "flow_logs_policy_secondary" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:eu-west-1:*:log-group:${local.name_prefix}-vpc-flow-logs-secondary",
      "arn:aws:logs:eu-west-1:*:log-group:${local.name_prefix}-vpc-flow-logs-secondary:*"
    ]
  }
}

# IAM Role for VPC Flow Logs - Primary Region
resource "aws_iam_role" "flow_logs_role_primary" {
  name               = "${local.name_prefix}-vpc-flow-logs-role-primary"
  assume_role_policy = data.aws_iam_policy_document.flow_logs_assume_role.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role-primary"
  })
}

# IAM Role for VPC Flow Logs - Secondary Region
resource "aws_iam_role" "flow_logs_role_secondary" {
  provider           = aws.eu_west_1
  name               = "${local.name_prefix}-vpc-flow-logs-role-secondary"
  assume_role_policy = data.aws_iam_policy_document.flow_logs_assume_role.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role-secondary"
  })
}

# IAM Policy for VPC Flow Logs - Primary Region
resource "aws_iam_role_policy" "flow_logs_policy_primary" {
  name   = "${local.name_prefix}-vpc-flow-logs-policy-primary"
  role   = aws_iam_role.flow_logs_role_primary.id
  policy = data.aws_iam_policy_document.flow_logs_policy_primary.json
}

# IAM Policy for VPC Flow Logs - Secondary Region
resource "aws_iam_role_policy" "flow_logs_policy_secondary" {
  provider = aws.eu_west_1
  name     = "${local.name_prefix}-vpc-flow-logs-policy-secondary"
  role     = aws_iam_role.flow_logs_role_secondary.id
  policy   = data.aws_iam_policy_document.flow_logs_policy_secondary.json
}

# VPC - Primary Region
resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-primary"
  })
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_1
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-secondary"
  })
}

# Internet Gateway - Primary Region
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-primary"
  })
}

# Internet Gateway - Secondary Region
resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-secondary"
  })
}

# Public Subnet - Primary Region
resource "aws_subnet" "public_primary" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, 1)
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-primary"
    Type = "Public"
  })
}

# Public Subnet - Secondary Region
resource "aws_subnet" "public_secondary" {
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 8, 1)
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-secondary"
    Type = "Public"
  })
}

# Private Subnet - Primary Region
resource "aws_subnet" "private_primary" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, 2)
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-primary"
    Type = "Private"
  })
}

# Private Subnet - Secondary Region
resource "aws_subnet" "private_secondary" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, 2)
  availability_zone = data.aws_availability_zones.secondary.names[1]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-secondary"
    Type = "Private"
  })
}

# Route Table for Public Subnet - Primary Region
resource "aws_route_table" "public_primary" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt-primary"
  })
}

# Route Table for Public Subnet - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt-secondary"
  })
}

# Route Table Association - Primary Region
resource "aws_route_table_association" "public_primary" {
  subnet_id      = aws_subnet.public_primary.id
  route_table_id = aws_route_table.public_primary.id
}

# Route Table Association - Secondary Region
resource "aws_route_table_association" "public_secondary" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.public_secondary.id
  route_table_id = aws_route_table.public_secondary.id
}

# CloudWatch Log Group for VPC Flow Logs - Primary Region
resource "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  name              = "${local.name_prefix}-vpc-flow-logs-primary"
  retention_in_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-primary"
  })
}

# CloudWatch Log Group for VPC Flow Logs - Secondary Region
resource "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  provider          = aws.eu_west_1
  name              = "${local.name_prefix}-vpc-flow-logs-secondary"
  retention_in_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-secondary"
  })
}

# VPC Flow Log - Primary Region
resource "aws_flow_log" "vpc_flow_logs_primary" {
  iam_role_arn    = aws_iam_role.flow_logs_role_primary.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log-primary"
  })
}

# VPC Flow Log - Secondary Region
resource "aws_flow_log" "vpc_flow_logs_secondary" {
  provider        = aws.eu_west_1
  iam_role_arn    = aws_iam_role.flow_logs_role_secondary.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log-secondary"
  })
}

# Security Group for Bastion/App Access - Primary Region
resource "aws_security_group" "bastion_app_primary" {
  name        = "${local.name_prefix}-bastion-app-sg-primary"
  description = "Security group for bastion/app access with restricted ingress"
  vpc_id      = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-app-sg-primary"
  })
}

# Security Group for Bastion/App Access - Secondary Region
resource "aws_security_group" "bastion_app_secondary" {
  provider    = aws.eu_west_1
  name        = "${local.name_prefix}-bastion-app-sg-secondary"
  description = "Security group for bastion/app access with restricted ingress"
  vpc_id      = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-app-sg-secondary"
  })
}

# Security Group Rules for Ingress - Primary Region
resource "aws_security_group_rule" "bastion_app_ingress_primary" {
  for_each = {
    for combo in setproduct(var.allowed_ports, var.allowed_ingress_cidrs) :
    "${combo[0]}-${replace(combo[1], "/", "-")}" => {
      port = combo[0]
      cidr = combo[1]
    }
  }

  type              = "ingress"
  from_port         = each.value.port
  to_port           = each.value.port
  protocol          = "tcp"
  cidr_blocks       = [each.value.cidr]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow port ${each.value.port} from ${each.value.cidr}"
}

# Security Group Rules for Ingress - Secondary Region
resource "aws_security_group_rule" "bastion_app_ingress_secondary" {
  for_each = {
    for combo in setproduct(var.allowed_ports, var.allowed_ingress_cidrs) :
    "${combo[0]}-${replace(combo[1], "/", "-")}" => {
      port = combo[0]
      cidr = combo[1]
    }
  }

  provider          = aws.eu_west_1
  type              = "ingress"
  from_port         = each.value.port
  to_port           = each.value.port
  protocol          = "tcp"
  cidr_blocks       = [each.value.cidr]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow port ${each.value.port} from ${each.value.cidr}"
}

# Security Group Rules for Egress (HTTPS and DNS only) - Primary Region
resource "aws_security_group_rule" "bastion_app_egress_https_primary" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow HTTPS outbound for package updates and API calls"
}

resource "aws_security_group_rule" "bastion_app_egress_dns_primary" {
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow DNS resolution"
}

# Security Group Rules for Egress (HTTPS and DNS only) - Secondary Region
resource "aws_security_group_rule" "bastion_app_egress_https_secondary" {
  provider          = aws.eu_west_1
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow HTTPS outbound for package updates and API calls"
}

resource "aws_security_group_rule" "bastion_app_egress_dns_secondary" {
  provider          = aws.eu_west_1
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow DNS resolution"
}

# S3 Bucket for Audit Logs - Primary Region
resource "aws_s3_bucket" "audit_logs_primary" {
  bucket = "${local.name_prefix}-audit-logs-primary-${random_string.bucket_suffix_primary.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs-primary"
  })
}

# S3 Bucket for Audit Logs - Secondary Region
resource "aws_s3_bucket" "audit_logs_secondary" {
  provider = aws.eu_west_1
  bucket   = "${local.name_prefix}-audit-logs-secondary-${random_string.bucket_suffix_secondary.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs-secondary"
  })
}

# Random string for S3 bucket uniqueness - Primary Region
resource "random_string" "bucket_suffix_primary" {
  length  = 8
  special = false
  upper   = false
}

# Random string for S3 bucket uniqueness - Secondary Region
resource "random_string" "bucket_suffix_secondary" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Encryption - Primary Region
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs_primary" {
  bucket = aws_s3_bucket.audit_logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Encryption - Secondary Region
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs_secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.audit_logs_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block - Primary Region
resource "aws_s3_bucket_public_access_block" "audit_logs_primary" {
  bucket                  = aws_s3_bucket.audit_logs_primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Public Access Block - Secondary Region
resource "aws_s3_bucket_public_access_block" "audit_logs_secondary" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.audit_logs_secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for TLS-only access - Primary Region
data "aws_iam_policy_document" "s3_tls_only_primary" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_logs_primary.arn,
      "${aws_s3_bucket.audit_logs_primary.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# S3 Bucket Policy for TLS-only access - Secondary Region
data "aws_iam_policy_document" "s3_tls_only_secondary" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_logs_secondary.arn,
      "${aws_s3_bucket.audit_logs_secondary.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "audit_logs_tls_only_primary" {
  bucket = aws_s3_bucket.audit_logs_primary.id
  policy = data.aws_iam_policy_document.s3_tls_only_primary.json
}

resource "aws_s3_bucket_policy" "audit_logs_tls_only_secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.audit_logs_secondary.id
  policy   = data.aws_iam_policy_document.s3_tls_only_secondary.json
}

# Outputs
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs for both regions"
  value = {
    primary   = aws_subnet.public_primary.id
    secondary = aws_subnet.public_secondary.id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for both regions"
  value = {
    primary   = aws_subnet.private_primary.id
    secondary = aws_subnet.private_secondary.id
  }
}

output "flow_log_ids" {
  description = "VPC Flow Log IDs for both regions"
  value = {
    primary   = aws_flow_log.vpc_flow_logs_primary.id
    secondary = aws_flow_log.vpc_flow_logs_secondary.id
  }
}

output "flow_log_group_arns" {
  description = "CloudWatch Log Group ARNs for VPC Flow Logs"
  value = {
    primary   = aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
    secondary = aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  }
}

output "security_group_ids" {
  description = "Security Group IDs for bastion/app access"
  value = {
    primary   = aws_security_group.bastion_app_primary.id
    secondary = aws_security_group.bastion_app_secondary.id
  }
}

output "s3_audit_bucket_names" {
  description = "S3 bucket names for audit logs"
  value = {
    primary   = aws_s3_bucket.audit_logs_primary.id
    secondary = aws_s3_bucket.audit_logs_secondary.id
  }
}