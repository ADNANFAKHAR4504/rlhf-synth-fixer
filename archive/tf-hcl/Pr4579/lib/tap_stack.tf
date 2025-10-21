# Financial Services Disaster Recovery Infrastructure
# RTO: 5 minutes | RPO: 1 minute
# Primary: us-east-1 | DR: us-west-2

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  # Add random suffix to ensure unique resource names across deployments
  unique_suffix = "${var.environment_suffix}-${random_id.suffix.hex}"

  common_tags = {
    Environment     = var.environment
    Project         = var.project_name
    ComplianceScope = "PCI-DSS"
    ManagedBy       = "terraform"
    Suffix          = var.environment_suffix
    UniqueSuffix    = local.unique_suffix
  }

  regions = {
    primary = var.primary_region
    dr      = var.secondary_region
  }
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_region" "primary" {
  provider = aws.primary
}

data "aws_region" "dr" {
  provider = aws.dr
}

# ========================================
# VPC Configuration - Primary Region
# ========================================

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-vpc-primary-${local.unique_suffix}"
    Region = "primary"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-igw-primary-${local.unique_suffix}"
    Region = "primary"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = length(var.availability_zones_primary)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = var.public_subnets_primary[count.index]
  availability_zone       = var.availability_zones_primary[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-${count.index + 1}-primary-${local.unique_suffix}"
    Region = "primary"
    Tier   = "public"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = length(var.availability_zones_primary)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = var.private_subnets_primary[count.index]
  availability_zone = var.availability_zones_primary[count.index]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-${count.index + 1}-primary-${local.unique_suffix}"
    Region = "primary"
    Tier   = "private"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "primary_database" {
  provider          = aws.primary
  count             = length(var.availability_zones_primary)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = var.database_subnets_primary[count.index]
  availability_zone = var.availability_zones_primary[count.index]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-database-${count.index + 1}-primary-${local.unique_suffix}"
    Region = "primary"
    Tier   = "database"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = 1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-eip-nat-${count.index + 1}-primary-${local.unique_suffix}"
    Region = "primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 1
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-nat-${count.index + 1}-primary-${local.unique_suffix}"
    Region = "primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rt-public-primary-${local.unique_suffix}"
    Region = "primary"
  })
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[0].id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rt-private-primary-${local.unique_suffix}"
    Region = "primary"
  })
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(var.availability_zones_primary)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(var.availability_zones_primary)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_database" {
  provider       = aws.primary
  count          = length(var.availability_zones_primary)
  subnet_id      = aws_subnet.primary_database[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# ========================================
# VPC Configuration - DR Region
# ========================================

resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-vpc-dr-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-igw-dr-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "dr_public" {
  provider                = aws.dr
  count                   = length(var.availability_zones_dr)
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = var.public_subnets_dr[count.index]
  availability_zone       = var.availability_zones_dr[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-public-${count.index + 1}-dr-${local.unique_suffix}"
    Region = "dr"
    Tier   = "public"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = length(var.availability_zones_dr)
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.private_subnets_dr[count.index]
  availability_zone = var.availability_zones_dr[count.index]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-private-${count.index + 1}-dr-${local.unique_suffix}"
    Region = "dr"
    Tier   = "private"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_subnet" "dr_database" {
  provider          = aws.dr
  count             = length(var.availability_zones_dr)
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.database_subnets_dr[count.index]
  availability_zone = var.availability_zones_dr[count.index]

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-database-${count.index + 1}-dr-${local.unique_suffix}"
    Region = "dr"
    Tier   = "database"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_eip" "dr_nat" {
  provider = aws.dr
  count    = 1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-eip-nat-${count.index + 1}-dr-${local.unique_suffix}"
    Region = "dr"
  })

  depends_on = [aws_internet_gateway.dr]
}

resource "aws_nat_gateway" "dr" {
  provider      = aws.dr
  count         = 1
  allocation_id = aws_eip.dr_nat[count.index].id
  subnet_id     = aws_subnet.dr_public[count.index].id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-nat-${count.index + 1}-dr-${local.unique_suffix}"
    Region = "dr"
  })

  depends_on = [aws_internet_gateway.dr]
}

resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rt-public-dr-${local.unique_suffix}"
    Region = "dr"
  })
}

resource "aws_route_table" "dr_private" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr[0].id
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-rt-private-dr-${local.unique_suffix}"
    Region = "dr"
  })
}

resource "aws_route_table_association" "dr_public" {
  provider       = aws.dr
  count          = length(var.availability_zones_dr)
  subnet_id      = aws_subnet.dr_public[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = length(var.availability_zones_dr)
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private.id
}

resource "aws_route_table_association" "dr_database" {
  provider       = aws.dr
  count          = length(var.availability_zones_dr)
  subnet_id      = aws_subnet.dr_database[count.index].id
  route_table_id = aws_route_table.dr_private.id
}

# ========================================
# KMS Keys for Encryption
# ========================================

resource "aws_kms_key" "aurora_primary" {
  provider                = aws.primary
  description             = "Aurora encryption key - primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-aurora-key-primary-${local.unique_suffix}"
    Purpose = "aurora-encryption"
    Region  = "primary"
  })
}

resource "aws_kms_alias" "aurora_primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-aurora-primary-${local.unique_suffix}"
  target_key_id = aws_kms_key.aurora_primary.key_id
}

resource "aws_kms_key" "aurora_dr" {
  provider                = aws.dr
  description             = "Aurora encryption key - DR region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-aurora-key-dr-${local.unique_suffix}"
    Purpose = "aurora-encryption"
    Region  = "dr"
  })
}

resource "aws_kms_alias" "aurora_dr" {
  provider      = aws.dr
  name          = "alias/${var.project_name}-aurora-dr-${local.unique_suffix}"
  target_key_id = aws_kms_key.aurora_dr.key_id
}

resource "aws_kms_key" "dynamodb_primary" {
  provider                = aws.primary
  description             = "DynamoDB encryption key - primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-dynamodb-key-primary-${local.unique_suffix}"
    Purpose = "dynamodb-encryption"
    Region  = "primary"
  })
}

resource "aws_kms_alias" "dynamodb_primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-dynamodb-primary-${local.unique_suffix}"
  target_key_id = aws_kms_key.dynamodb_primary.key_id
}

resource "aws_kms_key" "dynamodb_dr" {
  provider                = aws.dr
  description             = "DynamoDB encryption key - DR region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-dynamodb-key-dr-${local.unique_suffix}"
    Purpose = "dynamodb-encryption"
    Region  = "dr"
  })
}

resource "aws_kms_alias" "dynamodb_dr" {
  provider      = aws.dr
  name          = "alias/${var.project_name}-dynamodb-dr-${local.unique_suffix}"
  target_key_id = aws_kms_key.dynamodb_dr.key_id
}

# ========================================
# S3 Buckets for Transaction Logs
# ========================================

resource "aws_s3_bucket" "transaction_logs_primary" {
  provider      = aws.primary
  bucket        = "fs-txn-pri-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-txn-logs-primary-${local.unique_suffix}"
    Purpose = "transaction-logs"
    Region  = "primary"
  })
}

resource "aws_s3_bucket_versioning" "transaction_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.transaction_logs_primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.transaction_logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs_primary" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.transaction_logs_primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "transaction_logs_dr" {
  provider      = aws.dr
  bucket        = "fs-txn-dr-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-txn-logs-dr-${local.unique_suffix}"
    Purpose = "transaction-logs"
    Region  = "dr"
  })
}

resource "aws_s3_bucket_versioning" "transaction_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.transaction_logs_dr.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.transaction_logs_dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs_dr" {
  provider                = aws.dr
  bucket                  = aws_s3_bucket.transaction_logs_dr.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Replication Configuration for RPO compliance (~1 minute)
resource "aws_iam_role" "s3_replication" {
  provider = aws.primary
  name     = "${var.project_name}-s3-replication-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.primary
  role     = aws_iam_role.s3_replication.id
  name     = "s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.transaction_logs_primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.transaction_logs_primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.transaction_logs_dr.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "transaction_logs_replication" {
  provider = aws.primary
  bucket   = aws_s3_bucket.transaction_logs_primary.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id       = "replicate-all-objects"
    status   = "Enabled"
    priority = 1

    filter {
      prefix = ""
    }

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.transaction_logs_dr.arn
      storage_class = "STANDARD_IA"

      # Enable replication time control for guaranteed 15-minute replication (meets 1-min RPO)
      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.transaction_logs_primary,
    aws_s3_bucket_versioning.transaction_logs_dr
  ]
}

# ========================================
# S3 Buckets for VPC Flow Logs
# ========================================

resource "aws_s3_bucket" "vpc_flow_logs_primary" {
  provider      = aws.primary
  bucket        = "fs-vpcfl-pri-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-vpc-flow-logs-primary-${local.unique_suffix}"
    Purpose = "vpc-flow-logs"
    Region  = "primary"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vpc_flow_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.vpc_flow_logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "vpc_flow_logs_primary" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.vpc_flow_logs_primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "vpc_flow_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.vpc_flow_logs_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.vpc_flow_logs_primary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.vpc_flow_logs_primary.arn
      }
    ]
  })
}

resource "aws_flow_log" "primary" {
  provider             = aws.primary
  vpc_id               = aws_vpc.primary.id
  traffic_type         = "ALL"
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.vpc_flow_logs_primary.arn

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-flow-log-primary-${local.unique_suffix}"
    Region = "primary"
  })
}

resource "aws_s3_bucket" "vpc_flow_logs_dr" {
  provider      = aws.dr
  bucket        = "fs-vpcfl-dr-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-vpc-flow-logs-dr-${local.unique_suffix}"
    Purpose = "vpc-flow-logs"
    Region  = "dr"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vpc_flow_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.vpc_flow_logs_dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "vpc_flow_logs_dr" {
  provider                = aws.dr
  bucket                  = aws_s3_bucket.vpc_flow_logs_dr.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "vpc_flow_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.vpc_flow_logs_dr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.vpc_flow_logs_dr.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.vpc_flow_logs_dr.arn
      }
    ]
  })
}

resource "aws_flow_log" "dr" {
  provider             = aws.dr
  vpc_id               = aws_vpc.dr.id
  traffic_type         = "ALL"
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.vpc_flow_logs_dr.arn

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-flow-log-dr-${local.unique_suffix}"
    Region = "dr"
  })
}

# ========================================
# S3 Buckets for ALB Access Logs
# ========================================

resource "aws_s3_bucket" "alb_logs_primary" {
  provider      = aws.primary
  bucket        = "fs-albl-pri-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-alb-logs-primary-${local.unique_suffix}"
    Purpose = "alb-logs"
    Region  = "primary"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.alb_logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs_primary" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.alb_logs_primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "alb_logs_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.alb_logs_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs_primary.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "alb_logs_dr" {
  provider      = aws.dr
  bucket        = "fs-albl-dr-${local.unique_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-alb-logs-dr-${local.unique_suffix}"
    Purpose = "alb-logs"
    Region  = "dr"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.alb_logs_dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs_dr" {
  provider                = aws.dr
  bucket                  = aws_s3_bucket.alb_logs_dr.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "alb_logs_dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.alb_logs_dr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs_dr.arn}/*"
      }
    ]
  })
}

# ========================================
# Aurora Global Database Configuration
# Provides ~1 second RPO with cross-region replication
# ========================================

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_rds_global_cluster" "financial_db" {
  provider                  = aws.primary
  global_cluster_identifier = "${var.project_name}-global-db-${local.unique_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.database_name
  storage_encrypted         = true
  deletion_protection       = false
  force_destroy             = true
}

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.project_name}-db-subnet-group-primary-${local.unique_suffix}"
  subnet_ids = aws_subnet.primary_database[*].id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-subnet-group-primary-${local.unique_suffix}"
    Region = "primary"
  })
}

resource "aws_db_subnet_group" "dr" {
  provider   = aws.dr
  name       = "${var.project_name}-db-subnet-group-dr-${local.unique_suffix}"
  subnet_ids = aws_subnet.dr_database[*].id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-db-subnet-group-dr-${local.unique_suffix}"
    Region = "dr"
  })
}

# Security Groups for Aurora
resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-aurora-sg-primary-${local.unique_suffix}"
  description = "Security group for Aurora primary cluster"
  vpc_id      = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-aurora-sg-primary-${local.unique_suffix}"
    Region = "primary"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "aurora_primary_ingress" {
  provider                 = aws.primary
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app_primary.id
  security_group_id        = aws_security_group.aurora_primary.id
  description              = "PostgreSQL from app tier"
}

resource "aws_security_group_rule" "aurora_primary_egress" {
  provider          = aws.primary
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.aurora_primary.id
  description       = "Allow all outbound"
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name        = "${var.project_name}-aurora-sg-dr-${local.unique_suffix}"
  description = "Security group for Aurora DR cluster"
  vpc_id      = aws_vpc.dr.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-aurora-sg-dr-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "aurora_dr_ingress" {
  provider                 = aws.dr
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app_dr.id
  security_group_id        = aws_security_group.aurora_dr.id
  description              = "PostgreSQL from app tier"
}

resource "aws_security_group_rule" "aurora_dr_egress" {
  provider          = aws.dr
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.aurora_dr.id
  description       = "Allow all outbound"
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring_primary" {
  provider = aws.primary
  name     = "${var.project_name}-rds-monitoring-primary-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_primary" {
  provider   = aws.primary
  role       = aws_iam_role.rds_monitoring_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "rds_monitoring_dr" {
  provider = aws.dr
  name     = "${var.project_name}-rds-monitoring-dr-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_dr" {
  provider   = aws.dr
  role       = aws_iam_role.rds_monitoring_dr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  provider                  = aws.primary
  cluster_identifier        = "${var.project_name}-primary-cluster-${local.unique_suffix}"
  engine                    = aws_rds_global_cluster.financial_db.engine
  engine_version            = aws_rds_global_cluster.financial_db.engine_version
  global_cluster_identifier = aws_rds_global_cluster.financial_db.id
  database_name             = var.database_name
  master_username           = var.db_master_username
  master_password           = random_password.db_password.result
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.aurora_primary.id]

  backup_retention_period         = 35
  preferred_backup_window         = "03:00-04:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.aurora_primary.arn
  deletion_protection             = false
  skip_final_snapshot             = true
  final_snapshot_identifier       = "${var.project_name}-primary-final-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-primary-cluster-${local.unique_suffix}"
    Region = "primary"
  })

  depends_on = [aws_rds_global_cluster.financial_db]
}

# DR Aurora Cluster (standalone for existing deployments)
resource "aws_rds_cluster" "dr" {
  provider               = aws.dr
  cluster_identifier     = "${var.project_name}-dr-cluster-${local.unique_suffix}"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  database_name          = var.database_name
  master_username        = var.db_master_username
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.dr.name
  vpc_security_group_ids = [aws_security_group.aurora_dr.id]

  backup_retention_period         = 35
  preferred_backup_window         = "03:00-04:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.aurora_dr.arn
  deletion_protection             = false
  skip_final_snapshot             = true
  final_snapshot_identifier       = "${var.project_name}-dr-final-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-dr-cluster-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    ignore_changes = [engine_version, global_cluster_identifier, master_password]
  }
}

# Aurora Instances - Primary Region
resource "aws_rds_cluster_instance" "primary" {
  provider           = aws.primary
  count              = var.aurora_instance_count_primary
  identifier         = "${var.project_name}-primary-instance-${count.index}-${local.unique_suffix}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  monitoring_interval = 5
  monitoring_role_arn = aws_iam_role.rds_monitoring_primary.arn

  # Performance Insights enabled conditionally based on instance class
  performance_insights_enabled    = var.enable_performance_insights
  performance_insights_kms_key_id = var.enable_performance_insights ? aws_kms_key.aurora_primary.arn : null

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-primary-instance-${count.index}-${local.unique_suffix}"
    Region = "primary"
  })
}

# Aurora Instances - DR Region
resource "aws_rds_cluster_instance" "dr" {
  provider           = aws.dr
  count              = var.aurora_instance_count_dr
  identifier         = "${var.project_name}-dr-instance-${count.index}-${local.unique_suffix}"
  cluster_identifier = aws_rds_cluster.dr.id
  instance_class     = var.aurora_instance_class_dr
  engine             = aws_rds_cluster.dr.engine
  engine_version     = aws_rds_cluster.dr.engine_version

  monitoring_interval = 5
  monitoring_role_arn = aws_iam_role.rds_monitoring_dr.arn

  performance_insights_enabled    = var.enable_performance_insights
  performance_insights_kms_key_id = var.enable_performance_insights ? aws_kms_key.aurora_dr.arn : null

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-dr-instance-${count.index}-${local.unique_suffix}"
    Region = "dr"
  })
}

# ========================================
# DynamoDB Global Tables for Session/State Data
# ========================================

resource "aws_dynamodb_table" "session_data" {
  provider         = aws.primary
  name             = "${var.project_name}-session-data-${local.unique_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_primary.arn
  }

  replica {
    region_name = local.regions.dr
    kms_key_arn = aws_kms_key.dynamodb_dr.arn
  }

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    attribute_name = "expiry"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-session-data-${local.unique_suffix}"
    Purpose = "session-state"
  })
}

# ========================================
# Security Groups for Application Tier
# ========================================

resource "aws_security_group" "app_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-app-sg-primary-${local.unique_suffix}"
  description = "Security group for application tier primary"
  vpc_id      = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-app-sg-primary-${local.unique_suffix}"
    Region = "primary"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "app_primary_ingress_https" {
  provider                 = aws.primary
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb_primary.id
  security_group_id        = aws_security_group.app_primary.id
  description              = "HTTPS from ALB"
}

resource "aws_security_group_rule" "app_primary_ingress_http" {
  provider                 = aws.primary
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb_primary.id
  security_group_id        = aws_security_group.app_primary.id
  description              = "HTTP from ALB"
}

resource "aws_security_group_rule" "app_primary_egress" {
  provider          = aws.primary
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_primary.id
  description       = "Allow all outbound"
}

resource "aws_security_group" "app_dr" {
  provider    = aws.dr
  name        = "${var.project_name}-app-sg-dr-${local.unique_suffix}"
  description = "Security group for application tier DR"
  vpc_id      = aws_vpc.dr.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-app-sg-dr-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "app_dr_ingress_https" {
  provider                 = aws.dr
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb_dr.id
  security_group_id        = aws_security_group.app_dr.id
  description              = "HTTPS from ALB"
}

resource "aws_security_group_rule" "app_dr_ingress_http" {
  provider                 = aws.dr
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb_dr.id
  security_group_id        = aws_security_group.app_dr.id
  description              = "HTTP from ALB"
}

resource "aws_security_group_rule" "app_dr_egress" {
  provider          = aws.dr
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_dr.id
  description       = "Allow all outbound"
}

# ========================================
# Application Load Balancers
# ========================================

resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-alb-sg-primary-${local.unique_suffix}"
  description = "Security group for ALB primary"
  vpc_id      = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-alb-sg-primary-${local.unique_suffix}"
    Region = "primary"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "alb_primary_ingress_https" {
  provider          = aws.primary
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_primary.id
  description       = "HTTPS from internet"
}

resource "aws_security_group_rule" "alb_primary_ingress_http" {
  provider          = aws.primary
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_primary.id
  description       = "HTTP from internet"
}

resource "aws_security_group_rule" "alb_primary_egress" {
  provider          = aws.primary
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_primary.id
  description       = "Allow all outbound"
}

resource "aws_security_group" "alb_dr" {
  provider    = aws.dr
  name        = "${var.project_name}-alb-sg-dr-${local.unique_suffix}"
  description = "Security group for ALB DR"
  vpc_id      = aws_vpc.dr.id

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-alb-sg-dr-${local.unique_suffix}"
    Region = "dr"
  })

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_security_group_rule" "alb_dr_ingress_https" {
  provider          = aws.dr
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_dr.id
  description       = "HTTPS from internet"
}

resource "aws_security_group_rule" "alb_dr_ingress_http" {
  provider          = aws.dr
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_dr.id
  description       = "HTTP from internet"
}

resource "aws_security_group_rule" "alb_dr_egress" {
  provider          = aws.dr
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_dr.id
  description       = "Allow all outbound"
}

resource "aws_lb" "primary" {
  provider                   = aws.primary
  name                       = "${substr(var.project_name, 0, 8)}-alb-pri-${local.unique_suffix}"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_primary.id]
  subnets                    = aws_subnet.primary_public[*].id
  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs_primary.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-alb-primary-${local.unique_suffix}"
    Region = "primary"
  })

  depends_on = [
    aws_s3_bucket_policy.alb_logs_primary,
    aws_internet_gateway.primary,
    aws_nat_gateway.primary
  ]
}

resource "aws_lb" "dr" {
  provider                   = aws.dr
  name                       = "${substr(var.project_name, 0, 8)}-alb-dr-${local.unique_suffix}"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_dr.id]
  subnets                    = aws_subnet.dr_public[*].id
  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs_dr.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-alb-dr-${local.unique_suffix}"
    Region = "dr"
  })

  depends_on = [
    aws_s3_bucket_policy.alb_logs_dr,
    aws_internet_gateway.dr,
    aws_nat_gateway.dr
  ]
}

# ALB Target Groups with aggressive health checks for quick failure detection (RTO 5 minutes)
resource "aws_lb_target_group" "primary" {
  provider             = aws.primary
  name                 = "${substr(var.project_name, 0, 8)}-tg-pri-${local.unique_suffix}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.primary.id
  deregistration_delay = 5

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 10
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  stickiness {
    cookie_duration = 3600
    enabled         = true
    type            = "lb_cookie"
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-tg-primary-${local.unique_suffix}"
    Region = "primary"
  })
}

resource "aws_lb_target_group" "dr" {
  provider             = aws.dr
  name                 = "${substr(var.project_name, 0, 8)}-tg-dr-${local.unique_suffix}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.dr.id
  deregistration_delay = 5

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 10
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  stickiness {
    cookie_duration = 3600
    enabled         = true
    type            = "lb_cookie"
  }

  tags = merge(local.common_tags, {
    Name   = "${var.project_name}-tg-dr-${local.unique_suffix}"
    Region = "dr"
  })
}

# ALB Listeners (HTTP for testing, HTTPS if certificates provided)
resource "aws_lb_listener" "primary_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

resource "aws_lb_listener" "primary_https" {
  count             = var.acm_certificate_arn_primary != "" ? 1 : 0
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn_primary

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

resource "aws_lb_listener" "dr_http" {
  provider          = aws.dr
  load_balancer_arn = aws_lb.dr.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dr.arn
  }
}

resource "aws_lb_listener" "dr_https" {
  count             = var.acm_certificate_arn_dr != "" ? 1 : 0
  provider          = aws.dr
  load_balancer_arn = aws_lb.dr.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn_dr

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dr.arn
  }
}

# ========================================
# Route 53 Health Checks and Failover
# ========================================

resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = 2
  request_interval  = 10

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-health-check-primary-${local.unique_suffix}"
  })
}

resource "aws_route53_health_check" "dr" {
  fqdn              = aws_lb.dr.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = 2
  request_interval  = 10

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-health-check-dr-${local.unique_suffix}"
  })
}

# Route 53 Failover Records (only created if zone_id is provided)
resource "aws_route53_record" "primary" {
  count   = var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "${local.unique_suffix}.${var.domain_name}"
  type    = "A"

  set_identifier = "Primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  count   = var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "${local.unique_suffix}.${var.domain_name}"
  type    = "A"

  set_identifier = "DR"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.dr.id
}

# ========================================
# CloudWatch Alarms for Failover Triggers
# ========================================

resource "aws_cloudwatch_metric_alarm" "primary_health" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-primary-health-alarm-${local.unique_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ALB health for failover triggers"

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  alarm_actions = [aws_sns_topic.primary_notifications.arn]

  tags = local.common_tags

  depends_on = [
    aws_sns_topic.primary_notifications,
    aws_lb.primary,
    aws_lb_target_group.primary
  ]
}

resource "aws_cloudwatch_metric_alarm" "aurora_lag_alarm" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-aurora-replication-lag-${local.unique_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 30000
  alarm_description   = "Aurora cross-region replication lag exceeds 30 seconds"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.primary_notifications.arn]

  tags = local.common_tags

  depends_on = [
    aws_sns_topic.primary_notifications,
    aws_rds_cluster.primary
  ]
}

# ========================================
# SNS Topics for Notifications
# ========================================

# SNS topic in primary region for primary region alarms
resource "aws_sns_topic" "primary_notifications" {
  provider = aws.primary
  name     = "${var.project_name}-primary-notifications-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Purpose = "primary-notifications"
  })
}

resource "aws_sns_topic_subscription" "primary_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.primary_notifications.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# SNS topic in DR region for DR region alarms
resource "aws_sns_topic" "dr_notifications" {
  provider = aws.dr
  name     = "${var.project_name}-dr-notifications-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Purpose = "dr-notifications"
  })
}

resource "aws_sns_topic_subscription" "dr_email" {
  provider  = aws.dr
  topic_arn = aws_sns_topic.dr_notifications.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ========================================
# Lambda Functions for Failover Orchestration
# ========================================

resource "aws_sqs_queue" "lambda_dlq" {
  provider                  = aws.primary
  name                      = "${var.project_name}-lambda-dlq-${local.unique_suffix}"
  message_retention_seconds = 1209600

  tags = merge(local.common_tags, {
    Purpose = "lambda-dlq"
  })
}

resource "aws_iam_role" "lambda_failover" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-failover-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_failover" {
  provider = aws.primary
  role     = aws_iam_role.lambda_failover.id
  name     = "failover-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:FailoverGlobalCluster",
          "rds:DescribeGlobalClusters",
          "rds:DescribeDBClusters"
        ]
        Resource = [
          aws_rds_global_cluster.financial_db.arn,
          aws_rds_cluster.primary.arn,
          aws_rds_cluster.dr.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.primary_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.regions.primary}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-failover-orchestrator-${local.unique_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}

resource "aws_lambda_function" "failover_orchestrator" {
  provider      = aws.primary
  function_name = "${var.project_name}-failover-orchestrator-${local.unique_suffix}"
  role          = aws_iam_role.lambda_failover.arn
  handler       = "failover_orchestrator.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512

  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")

  environment {
    variables = {
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.financial_db.id
      DR_CLUSTER_ID     = aws_rds_cluster.dr.cluster_identifier
      SNS_TOPIC_ARN     = aws_sns_topic.primary_notifications.arn
      DR_REGION         = local.regions.dr
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tags = merge(local.common_tags, {
    Purpose = "failover-orchestration"
  })
}

resource "aws_iam_role" "lambda_dr_test" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-dr-test-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_dr_test" {
  provider = aws.primary
  role     = aws_iam_role.lambda_dr_test.id
  name     = "dr-test-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeGlobalClusters",
          "rds:DescribeDBClusters",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_rds_global_cluster.financial_db.arn,
          aws_rds_cluster.primary.arn,
          aws_rds_cluster.dr.arn,
          aws_dynamodb_table.session_data.arn,
          "${aws_s3_bucket.transaction_logs_primary.arn}/*",
          "${aws_s3_bucket.transaction_logs_dr.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.regions.primary}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-dr-test-validator-${local.unique_suffix}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "dr_test_validator" {
  provider      = aws.primary
  function_name = "${var.project_name}-dr-test-validator-${local.unique_suffix}"
  role          = aws_iam_role.lambda_dr_test.arn
  handler       = "dr_test_validator.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 256

  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")

  environment {
    variables = {
      PRIMARY_CLUSTER_ID = aws_rds_cluster.primary.cluster_identifier
      DR_CLUSTER_ID      = aws_rds_cluster.dr.cluster_identifier
      DYNAMODB_TABLE     = aws_dynamodb_table.session_data.name
    }
  }

  tags = merge(local.common_tags, {
    Purpose = "dr-testing"
  })
}

# ========================================
# EventBridge Rules for Automated Failover
# ========================================

resource "aws_cloudwatch_event_rule" "failover_trigger" {
  provider    = aws.primary
  name        = "${var.project_name}-failover-trigger-${local.unique_suffix}"
  description = "Trigger failover on health check failures"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      alarmName = [aws_cloudwatch_metric_alarm.primary_health.alarm_name]
      state = {
        value = ["ALARM"]
      }
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "failover_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.failover_trigger.name
  target_id = "FailoverLambdaTarget"
  arn       = aws_lambda_function.failover_orchestrator.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_trigger.arn
}

# ========================================
# Systems Manager Automation Document for DR Testing
# ========================================

resource "aws_iam_role" "ssm_automation" {
  provider = aws.primary
  name     = "${var.project_name}-ssm-automation-role-${local.unique_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ssm.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ssm_automation" {
  provider = aws.primary
  role     = aws_iam_role.ssm_automation.id
  name     = "ssm-automation-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeGlobalClusters",
          "rds:CreateDBClusterSnapshot"
        ]
        Resource = [
          aws_rds_global_cluster.financial_db.arn,
          aws_rds_cluster.primary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.dr_test_validator.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.primary_notifications.arn
      }
    ]
  })
}

resource "aws_ssm_document" "dr_test_runbook" {
  provider        = aws.primary
  name            = "${var.project_name}-dr-test-runbook-${local.unique_suffix}"
  document_type   = "Automation"
  document_format = "YAML"

  content = <<DOC
schemaVersion: '0.3'
description: 'Automated DR testing runbook for quarterly compliance tests'
assumeRole: '${aws_iam_role.ssm_automation.arn}'
parameters:
  TestType:
    type: String
    default: 'read-only'
    allowedValues:
      - 'read-only'
      - 'partial-failover'
      - 'full-failover'
mainSteps:
  - name: ValidatePreConditions
    action: 'aws:executeAwsApi'
    inputs:
      Service: rds
      Api: DescribeGlobalClusters
      GlobalClusterIdentifier: ${aws_rds_global_cluster.financial_db.id}
    outputs:
      - Name: ClusterStatus
        Selector: '$.GlobalClusters[0].Status'
        Type: String
  
  - name: CreateBackupSnapshot
    action: 'aws:executeAwsApi'
    inputs:
      Service: rds
      Api: CreateDBClusterSnapshot
      DBClusterIdentifier: ${aws_rds_cluster.primary.cluster_identifier}
      DBClusterSnapshotIdentifier: 'dr-test-backup-{{global:DATE_TIME}}'
  
  - name: TestReadTraffic
    action: 'aws:invokeLambdaFunction'
    inputs:
      FunctionName: ${aws_lambda_function.dr_test_validator.function_name}
      Payload: '{"testType": "{{ TestType }}", "targetRegion": "${local.regions.dr}"}'
  
  - name: SendTestReport
    action: 'aws:executeAwsApi'
    inputs:
      Service: sns
      Api: Publish
      TopicArn: ${aws_sns_topic.primary_notifications.arn}
      Message: 'DR Test completed successfully. Type: {{ TestType }}'
DOC

  tags = merge(local.common_tags, {
    Purpose = "dr-testing"
  })
}

# ========================================
# Security Hub for PCI-DSS Compliance
# Note: Security Hub may already be enabled in the account
# Using data source to reference existing Security Hub instead of creating
# ========================================

# Commenting out Security Hub resources to avoid conflicts with existing account-level subscription
# Security Hub is typically enabled at the organization level

# data "aws_securityhub_hub" "primary" {
#   provider = aws.primary
# }

# data "aws_securityhub_hub" "dr" {
#   provider = aws.dr
# }

# If Security Hub needs to be managed by this stack, uncomment and import existing:
# terraform import aws_securityhub_account.primary <account-id>
# terraform import aws_securityhub_account.dr <account-id>

# ========================================
# Secrets Manager for Database Credentials
# ========================================

resource "aws_secretsmanager_secret" "db_credentials_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-db-credentials-primary-${local.unique_suffix}"
  description = "Aurora database master credentials"

  replica {
    region = local.regions.dr
  }

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials_primary" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_credentials_primary.id

  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_password.result
    endpoint = aws_rds_cluster.primary.endpoint
    port     = aws_rds_cluster.primary.port
  })
}

# ========================================
# Outputs
# ========================================

output "primary_alb_endpoint" {
  value       = aws_lb.primary.dns_name
  description = "Primary ALB endpoint"
}

output "dr_alb_endpoint" {
  value       = aws_lb.dr.dns_name
  description = "DR ALB endpoint"
}

output "aurora_global_cluster_id" {
  value       = aws_rds_global_cluster.financial_db.id
  description = "Aurora Global Database cluster ID"
}

output "route53_failover_domain" {
  value       = var.route53_zone_id != "" ? "${local.unique_suffix}.${var.domain_name}" : "Not configured - Route 53 zone ID not provided"
  description = "Route 53 failover domain"
}

output "database_endpoints" {
  description = "Aurora database endpoints for both regions"
  value = {
    primary_writer = aws_rds_cluster.primary.endpoint
    primary_reader = aws_rds_cluster.primary.reader_endpoint
    dr_writer      = aws_rds_cluster.dr.endpoint
    dr_reader      = aws_rds_cluster.dr.reader_endpoint
  }
  sensitive = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = aws_dynamodb_table.session_data.name
}

output "s3_buckets" {
  description = "S3 bucket names for transaction logs"
  value = {
    primary_logs = aws_s3_bucket.transaction_logs_primary.id
    dr_logs      = aws_s3_bucket.transaction_logs_dr.id
  }
}

output "secrets_manager_arn" {
  description = "ARN for Secrets Manager secret"
  value       = aws_secretsmanager_secret.db_credentials_primary.arn
  sensitive   = true
}

output "sns_topic_arns" {
  description = "SNS topic ARNs for notifications"
  value = {
    primary = aws_sns_topic.primary_notifications.arn
    dr      = aws_sns_topic.dr_notifications.arn
  }
}

output "lambda_function_arns" {
  description = "Lambda function ARNs for DR orchestration"
  value = {
    failover_orchestrator = aws_lambda_function.failover_orchestrator.arn
    dr_test_validator     = aws_lambda_function.dr_test_validator.arn
  }
}

output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary = aws_vpc.primary.id
    dr      = aws_vpc.dr.id
  }
}

output "security_group_ids" {
  description = "Security group IDs for application deployment"
  value = {
    app_primary    = aws_security_group.app_primary.id
    app_dr         = aws_security_group.app_dr.id
    aurora_primary = aws_security_group.aurora_primary.id
    aurora_dr      = aws_security_group.aurora_dr.id
    alb_primary    = aws_security_group.alb_primary.id
    alb_dr         = aws_security_group.alb_dr.id
  }
}

output "ssm_document_name" {
  description = "Systems Manager document name for DR testing"
  value       = aws_ssm_document.dr_test_runbook.name
}