# Payment Processing Infrastructure - Ideal Response

## Overview

This Terraform configuration deploys a PCI-DSS compliant payment processing infrastructure on AWS with comprehensive security controls, monitoring, and multi-tier network architecture. The infrastructure includes VPC with public/private/database/management subnets across multiple availability zones, CloudTrail audit logging, KMS encryption, and automated security monitoring via CloudWatch and SNS.

## Architecture

- **VPC Network**: 10.50.0.0/16 with 4-tier subnet architecture
- **Multi-AZ Deployment**: 3 availability zones with redundant NAT gateways
- **Security Layers**: Network ACLs + Security Groups for defense in depth
- **Audit & Compliance**: CloudTrail with encrypted S3 storage and VPC Flow Logs
- **Encryption**: KMS keys for CloudWatch Logs and CloudTrail S3 encryption
- **Monitoring**: CloudWatch metrics and SNS alerting for security events
- **Resource Isolation**: Separate subnets for public, private, database, and management tiers

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "payment-processing"
      Compliance  = "pci-dss"
      Owner       = "platform-team"
      CostCenter  = "infrastructure"
    }
  }
}

provider "random" {}

# Variables
variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "production"
}

variable "alert_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "kanakatla.k@turing.com"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}
```

## lib/main.tf

```hcl
# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables for AZ selection
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ==========================================
# KMS Keys for Encryption
# ==========================================

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/vpc-flowlogs-${var.environment}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# KMS Key for S3/CloudTrail
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail S3 bucket encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail Service"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/cloudtrail-logs-${var.environment}"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# ==========================================
# S3 Bucket for CloudTrail
# ==========================================

resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "s3-cloudtrail-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

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
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "RequireEncryptedKey"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.cloudtrail.arn
          }
        }
      }
    ]
  })
}

# ==========================================
# CloudTrail
# ==========================================

resource "aws_cloudtrail" "vpc_api" {
  name                          = "cloudtrail-vpc-api-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  kms_key_id                    = aws_kms_key.cloudtrail.arn
  enable_log_file_validation    = true
  include_global_service_events = true
  is_multi_region_trail         = false

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  depends_on = [
    aws_s3_bucket.cloudtrail,
    aws_s3_bucket_policy.cloudtrail
  ]
}

# ==========================================
# VPC
# ==========================================

resource "aws_vpc" "main" {
  cidr_block           = "10.50.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-payment-${var.environment}"
  }
}

# ==========================================
# Subnets
# ==========================================

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.50.${count.index}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${var.environment}-az${count.index + 1}"
    Tier = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.${10 + count.index}.0/24"
  availability_zone = local.azs[count.index]

  tags = {
    Name = "subnet-private-${var.environment}-az${count.index + 1}"
    Tier = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.${20 + count.index}.0/24"
  availability_zone = local.azs[count.index]

  tags = {
    Name = "subnet-database-${var.environment}-az${count.index + 1}"
    Tier = "database"
  }
}

# Management Subnets
resource "aws_subnet" "management" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.${30 + count.index}.0/24"
  availability_zone = local.azs[count.index]

  tags = {
    Name = "subnet-management-${var.environment}-az${count.index + 1}"
    Tier = "management"
  }
}

# ==========================================
# Internet Gateway
# ==========================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment}"
  }
}

# ==========================================
# Elastic IPs for NAT Gateways
# ==========================================

resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.environment}-az${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==========================================
# NAT Gateways
# ==========================================

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-az${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==========================================
# Route Tables
# ==========================================

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-public-${var.environment}"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-private-${var.environment}-az${count.index + 1}"
  }
}

resource "aws_route" "private_nat" {
  count                  = 3
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-database-${var.environment}"
  }
}

resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Management Route Tables (one per AZ)
resource "aws_route_table" "management" {
  count  = 3
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-management-${var.environment}-az${count.index + 1}"
  }
}

resource "aws_route" "management_nat" {
  count                  = 3
  route_table_id         = aws_route_table.management[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "management" {
  count          = 3
  subnet_id      = aws_subnet.management[count.index].id
  route_table_id = aws_route_table.management[count.index].id
}

# ==========================================
# CloudWatch Logs Group for VPC Flow Logs
# ==========================================

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]

  lifecycle {
    ignore_changes = [kms_key_id]
  }

  tags = {
    Name = "log-group-vpc-flowlogs-${var.environment}"
  }
}

# ==========================================
# IAM Role for VPC Flow Logs
# ==========================================

data "aws_iam_policy_document" "vpc_flow_logs_trust" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  name               = "role-vpc-flow-logs-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_trust.json

  tags = {
    Name = "role-vpc-flow-logs-${var.environment}"
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      aws_cloudwatch_log_group.vpc_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*"
    ]
  }
}

resource "aws_iam_policy" "vpc_flow_logs" {
  name        = "policy-vpc-flow-logs-${var.environment}"
  description = "Policy for VPC Flow Logs to write to CloudWatch Logs"
  policy      = data.aws_iam_policy_document.vpc_flow_logs_policy.json
}

resource "aws_iam_role_policy_attachment" "vpc_flow_logs" {
  role       = aws_iam_role.vpc_flow_logs.name
  policy_arn = aws_iam_policy.vpc_flow_logs.arn
}

# ==========================================
# VPC Flow Logs
# ==========================================

resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  tags = {
    Name = "flow-log-vpc-${var.environment}"
  }

  depends_on = [
    aws_iam_role.vpc_flow_logs,
    aws_iam_role_policy_attachment.vpc_flow_logs,
    aws_cloudwatch_log_group.vpc_flow_logs,
    aws_kms_key.cloudwatch_logs
  ]
}

# ==========================================
# Network ACLs
# ==========================================

# Public NACL
resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-public-${var.environment}"
  }
}

# Public NACL Rules - Ingress
resource "aws_network_acl_rule" "public_ingress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ingress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_ingress_deny_172" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 300
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "public_ingress_deny_192" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 310
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

# Public NACL Rules - Egress
resource "aws_network_acl_rule" "public_egress_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  network_acl_id = aws_network_acl.public.id
}

# Private NACL
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-private-${var.environment}"
  }
}

# Private NACL Rules - Ingress
resource "aws_network_acl_rule" "private_ingress_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = aws_vpc.main.cidr_block
}

resource "aws_network_acl_rule" "private_ingress_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_ingress_deny_172" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 300
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "private_ingress_deny_192" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 310
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

# Private NACL Rules - Egress
resource "aws_network_acl_rule" "private_egress_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  network_acl_id = aws_network_acl.private.id
}

# Database NACL
resource "aws_network_acl" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-database-${var.environment}"
  }
}

# Database NACL Rules - Ingress
resource "aws_network_acl_rule" "database_ingress_postgres" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.50.10.0/23"
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "database_ingress_ephemeral" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.50.10.0/23"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "database_ingress_deny_172" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 300
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "database_ingress_deny_192" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 310
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

# Database NACL Rules - Egress
resource "aws_network_acl_rule" "database_egress_response" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.50.10.0/23"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  network_acl_id = aws_network_acl.database.id
}

# Management NACL
resource "aws_network_acl" "management" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-management-${var.environment}"
  }
}

# Management NACL Rules - Ingress
resource "aws_network_acl_rule" "management_ingress_vpc" {
  network_acl_id = aws_network_acl.management.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = aws_vpc.main.cidr_block
}

resource "aws_network_acl_rule" "management_ingress_ephemeral" {
  network_acl_id = aws_network_acl.management.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "management_ingress_deny_172" {
  network_acl_id = aws_network_acl.management.id
  rule_number    = 300
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "management_ingress_deny_192" {
  network_acl_id = aws_network_acl.management.id
  rule_number    = 310
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

# Management NACL Rules - Egress
resource "aws_network_acl_rule" "management_egress_all" {
  network_acl_id = aws_network_acl.management.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "management" {
  count          = 3
  subnet_id      = aws_subnet.management[count.index].id
  network_acl_id = aws_network_acl.management.id
}

# ==========================================
# Security Groups
# ==========================================

# Public Security Group
resource "aws_security_group" "public" {
  name        = "public-${var.environment}"
  description = "Security group for public-facing ALBs"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-public-${var.environment}"
  }
}

resource "aws_security_group_rule" "public_ingress_https" {
  type              = "ingress"
  security_group_id = aws_security_group.public.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS from internet for ALB health checks and customer traffic"
}

resource "aws_security_group_rule" "public_egress_all" {
  type              = "egress"
  security_group_id = aws_security_group.public.id
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Private Security Group
resource "aws_security_group" "private" {
  name        = "private-${var.environment}"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-private-${var.environment}"
  }
}

resource "aws_security_group_rule" "private_ingress_from_public" {
  type                     = "ingress"
  security_group_id        = aws_security_group.private.id
  protocol                 = "tcp"
  from_port                = 8080
  to_port                  = 8080
  source_security_group_id = aws_security_group.public.id
  description              = "Allow app traffic from ALB tier only"
}

resource "aws_security_group_rule" "private_egress_all" {
  type              = "egress"
  security_group_id = aws_security_group.private.id
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Database Security Group
resource "aws_security_group" "database" {
  name        = "database-${var.environment}"
  description = "Security group for database instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-database-${var.environment}"
  }
}

resource "aws_security_group_rule" "database_ingress_postgres" {
  type                     = "ingress"
  security_group_id        = aws_security_group.database.id
  protocol                 = "tcp"
  from_port                = 5432
  to_port                  = 5432
  source_security_group_id = aws_security_group.private.id
  description              = "Allow database access from application tier only - PCI isolation requirement"
}

resource "aws_security_group_rule" "database_egress_vpc" {
  type              = "egress"
  security_group_id = aws_security_group.database.id
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = [aws_vpc.main.cidr_block]
  description       = "Allow outbound traffic within VPC only"
}

# Management Security Group
resource "aws_security_group" "management" {
  name        = "management-${var.environment}"
  description = "Security group for bastion and management tools"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-management-${var.environment}"
  }
}

resource "aws_security_group_rule" "management_ingress_ssh" {
  type              = "ingress"
  security_group_id = aws_security_group.management.id
  protocol          = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_blocks       = ["10.0.0.0/8"]
  description       = "Bastion access from corporate VPN only"
}

resource "aws_security_group_rule" "management_egress_all" {
  type              = "egress"
  security_group_id = aws_security_group.management.id
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# ==========================================
# SNS Topic for Alerts
# ==========================================

resource "aws_sns_topic" "alerts" {
  name              = "sns-vpc-security-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "sns-vpc-security-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ==========================================
# CloudWatch Metric Filters
# ==========================================

resource "aws_cloudwatch_log_metric_filter" "rejected_packets" {
  name           = "rejected-packets-${var.environment}"
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action=REJECT, log_status]"
  log_group_name = aws_cloudwatch_log_group.vpc_flow_logs.name

  metric_transformation {
    name      = "RejectedPackets"
    namespace = "VPC/FlowLogs"
    value     = "$packets"
  }
}

resource "aws_cloudwatch_log_metric_filter" "ssh_attempts" {
  name           = "ssh-attempts-${var.environment}"
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport=22, protocol, packets, bytes, start, end, action, log_status]"
  log_group_name = aws_cloudwatch_log_group.vpc_flow_logs.name

  metric_transformation {
    name      = "SSHAttempts"
    namespace = "VPC/FlowLogs"
    value     = "$packets"
  }
}

# ==========================================
# CloudWatch Alarms
# ==========================================

resource "aws_cloudwatch_metric_alarm" "nat_gateway_packet_drops" {
  count               = 3
  alarm_name          = "nat-gateway-packet-drops-${var.environment}-az${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "PacketDropCount"
  namespace           = "AWS/NATGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "NAT Gateway packet drops exceed 1000 in 5 minutes - potential network issue"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    NatGatewayId = aws_nat_gateway.main[count.index].id
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc_flow_logs_rejected" {
  alarm_name          = "vpc-flow-logs-rejected-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedPackets"
  namespace           = "VPC/FlowLogs"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "VPC Flow Logs rejected packets exceed 100 in 5 minutes - potential security event"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "nat_gateway_errors" {
  count               = 3
  alarm_name          = "nat-gateway-errors-${var.environment}-az${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorPortAllocation"
  namespace           = "AWS/NATGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "NAT Gateway port allocation errors detected - capacity issue"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    NatGatewayId = aws_nat_gateway.main[count.index].id
  }
}

# ==========================================
# Outputs
# ==========================================

# KMS Outputs
output "kms_cloudwatch_logs_key_id" {
  value       = aws_kms_key.cloudwatch_logs.id
  description = "KMS key ID for CloudWatch Logs encryption"
  sensitive   = true
}

output "kms_cloudwatch_logs_key_arn" {
  value       = aws_kms_key.cloudwatch_logs.arn
  description = "KMS key ARN for CloudWatch Logs encryption"
}

output "kms_cloudtrail_key_id" {
  value       = aws_kms_key.cloudtrail.id
  description = "KMS key ID for CloudTrail S3 encryption"
  sensitive   = true
}

output "kms_cloudtrail_key_arn" {
  value       = aws_kms_key.cloudtrail.arn
  description = "KMS key ARN for CloudTrail S3 encryption"
}

# S3 Outputs
output "s3_cloudtrail_bucket_name" {
  value       = aws_s3_bucket.cloudtrail.id
  description = "S3 bucket name for CloudTrail logs"
}

output "s3_cloudtrail_bucket_arn" {
  value       = aws_s3_bucket.cloudtrail.arn
  description = "S3 bucket ARN for CloudTrail logs"
}

# CloudTrail Outputs
output "cloudtrail_trail_id" {
  value       = aws_cloudtrail.vpc_api.id
  description = "CloudTrail trail ID"
}

output "cloudtrail_trail_arn" {
  value       = aws_cloudtrail.vpc_api.arn
  description = "CloudTrail trail ARN"
}

# VPC Outputs
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "vpc_cidr_block" {
  value       = aws_vpc.main.cidr_block
  description = "VPC CIDR block"
}

output "vpc_arn" {
  value       = aws_vpc.main.arn
  description = "VPC ARN"
}

# Subnet Outputs
output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "public_subnet_cidrs" {
  value       = aws_subnet.public[*].cidr_block
  description = "List of public subnet CIDR blocks"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "private_subnet_cidrs" {
  value       = aws_subnet.private[*].cidr_block
  description = "List of private subnet CIDR blocks"
}

output "database_subnet_ids" {
  value       = aws_subnet.database[*].id
  description = "List of database subnet IDs"
}

output "database_subnet_cidrs" {
  value       = aws_subnet.database[*].cidr_block
  description = "List of database subnet CIDR blocks"
}

output "management_subnet_ids" {
  value       = aws_subnet.management[*].id
  description = "List of management subnet IDs"
}

output "management_subnet_cidrs" {
  value       = aws_subnet.management[*].cidr_block
  description = "List of management subnet CIDR blocks"
}

# Internet Gateway Outputs
output "internet_gateway_id" {
  value       = aws_internet_gateway.main.id
  description = "Internet Gateway ID"
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  value       = aws_nat_gateway.main[*].id
  description = "List of NAT Gateway IDs"
}

output "nat_gateway_public_ips" {
  value       = aws_eip.nat[*].public_ip
  description = "List of NAT Gateway public IP addresses"
}

output "elastic_ip_ids" {
  value       = aws_eip.nat[*].id
  description = "List of Elastic IP IDs for NAT Gateways"
}

# Route Table Outputs
output "route_table_public_id" {
  value       = aws_route_table.public.id
  description = "Public route table ID"
}

output "route_table_private_ids" {
  value       = aws_route_table.private[*].id
  description = "List of private route table IDs (one per AZ)"
}

output "route_table_database_id" {
  value       = aws_route_table.database.id
  description = "Database route table ID"
}

output "route_table_management_ids" {
  value       = aws_route_table.management[*].id
  description = "List of management route table IDs (one per AZ)"
}

# Security Group Outputs
output "security_group_public_id" {
  value       = aws_security_group.public.id
  description = "Public tier security group ID"
}

output "security_group_private_id" {
  value       = aws_security_group.private.id
  description = "Private tier security group ID"
}

output "security_group_database_id" {
  value       = aws_security_group.database.id
  description = "Database tier security group ID"
}

output "security_group_management_id" {
  value       = aws_security_group.management.id
  description = "Management tier security group ID"
}

# VPC Flow Logs Outputs
output "vpc_flow_logs_id" {
  value       = aws_flow_log.main.id
  description = "VPC Flow Logs ID"
}

output "vpc_flow_logs_arn" {
  value       = aws_flow_log.main.arn
  description = "VPC Flow Logs ARN"
}

output "vpc_flow_logs_destination" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
  description = "VPC Flow Logs destination log group"
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
  description = "CloudWatch Log Group name for VPC Flow Logs"
}

output "cloudwatch_log_group_arn" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.arn
  description = "CloudWatch Log Group ARN for VPC Flow Logs"
}

output "cloudwatch_log_group_kms_key" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.kms_key_id
  description = "KMS key used for CloudWatch Log Group encryption"
}

output "cloudwatch_alarm_nat_packet_drops" {
  value       = aws_cloudwatch_metric_alarm.nat_gateway_packet_drops[*].alarm_name
  description = "List of CloudWatch alarm names for NAT Gateway packet drops"
}

output "cloudwatch_alarm_vpc_rejected_packets" {
  value       = aws_cloudwatch_metric_alarm.vpc_flow_logs_rejected.alarm_name
  description = "CloudWatch alarm name for VPC rejected packets"
}

output "cloudwatch_alarm_nat_errors" {
  value       = aws_cloudwatch_metric_alarm.nat_gateway_errors[*].alarm_name
  description = "List of CloudWatch alarm names for NAT Gateway errors"
}

# SNS Outputs
output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for security alerts"
}

output "sns_topic_name" {
  value       = aws_sns_topic.alerts.name
  description = "SNS topic name for security alerts"
}

# IAM Outputs
output "iam_role_vpc_flow_logs_arn" {
  value       = aws_iam_role.vpc_flow_logs.arn
  description = "IAM role ARN for VPC Flow Logs"
}

output "iam_role_vpc_flow_logs_name" {
  value       = aws_iam_role.vpc_flow_logs.name
  description = "IAM role name for VPC Flow Logs"
}

# Network ACL Outputs
output "network_acl_public_id" {
  value       = aws_network_acl.public.id
  description = "Public tier Network ACL ID"
}

output "network_acl_private_id" {
  value       = aws_network_acl.private.id
  description = "Private tier Network ACL ID"
}

output "network_acl_database_id" {
  value       = aws_network_acl.database.id
  description = "Database tier Network ACL ID"
}

output "network_acl_management_id" {
  value       = aws_network_acl.management.id
  description = "Management tier Network ACL ID"
}

# Availability Zone Outputs
output "availability_zones" {
  value       = local.azs
  description = "List of availability zones used for deployment"
}

# Region Output
output "region" {
  value       = data.aws_region.current.name
  description = "AWS region where resources are deployed"
}

# Account Output
output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account ID where resources are deployed"
}
```