# tap_stack.tf - Zero-Trust PCI-DSS Compliant Security Architecture
# All infrastructure resources for the PCI-DSS compliant payment processing platform

# Locals for reusable values
locals {
  common_tags = {
    Environment     = "prod"
    Owner           = "security-team"
    ComplianceScope = "PCI-DSS"
  }

  dmz_cidr  = "10.0.0.0/16"
  app_cidr  = "10.1.0.0/16"
  data_cidr = "10.2.0.0/16"

  account_id         = data.aws_caller_identity.current.account_id
  logging_account_id = var.logging_account_id

  azs_primary   = data.aws_availability_zones.primary.names
  azs_secondary = data.aws_availability_zones.secondary.names
}

# Data sources
data "aws_caller_identity" "current" {
  provider = aws.primary
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_elb_service_account" "main" {
  provider = aws.primary
}

# AWS Secrets Manager for secure password storage
resource "aws_secretsmanager_secret" "db_password" {
  provider                = aws.primary
  name                    = "pci-dss/database/master-password"
  description             = "Master database password with automatic rotation"
  kms_key_id              = aws_kms_key.parameter_store.arn
  recovery_window_in_days = 30

  tags = merge(local.common_tags, {
    Name       = "db-master-password"
    Compliance = "PCI-DSS"
    AutoRotate = "true"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 4
  min_upper        = 4
  min_numeric      = 4
  min_special      = 4
}

data "aws_secretsmanager_secret_version" "db_password" {
  provider   = aws.primary
  secret_id  = aws_secretsmanager_secret.db_password.id
  depends_on = [aws_secretsmanager_secret_version.db_password]
}

data "aws_iam_policy_document" "assume_role_policy_ec2" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "assume_role_policy_lambda" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "assume_role_policy_ecs" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# ================================================================================
# KMS KEYS - Encryption at rest for all services
# ================================================================================

# Master KMS key for general encryption
resource "aws_kms_key" "master" {
  provider                = aws.primary
  description             = "Master KMS key for PCI-DSS compliant encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30

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
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "cloudtrail.amazonaws.com",
            "logs.amazonaws.com",
            "config.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "master" {
  provider      = aws.primary
  name          = "alias/pci-dss-master"
  target_key_id = aws_kms_key.master.key_id
}

# KMS key for S3 bucket encryption
resource "aws_kms_key" "s3" {
  provider                = aws.primary
  description             = "KMS key for S3 bucket encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  provider      = aws.primary
  name          = "alias/pci-dss-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for Parameter Store
resource "aws_kms_key" "parameter_store" {
  provider                = aws.primary
  description             = "KMS key for Parameter Store encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  tags = local.common_tags
}

resource "aws_kms_alias" "parameter_store" {
  provider      = aws.primary
  name          = "alias/pci-dss-parameter-store"
  target_key_id = aws_kms_key.parameter_store.key_id
}

# ================================================================================
# NETWORKING - Three isolated VPCs with zero-trust architecture
# ================================================================================

# DMZ VPC - Internet-facing resources
resource "aws_vpc" "dmz" {
  provider             = aws.primary
  cidr_block           = local.dmz_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "dmz-vpc"
    Zone = "DMZ"
  })
}

# DMZ Public Subnets
resource "aws_subnet" "dmz_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.dmz.id
  cidr_block              = cidrsubnet(local.dmz_cidr, 8, count.index)
  availability_zone       = local.azs_primary[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "dmz-public-${count.index + 1}"
    Type = "Public"
  })
}

# DMZ Private Subnets
resource "aws_subnet" "dmz_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.dmz.id
  cidr_block        = cidrsubnet(local.dmz_cidr, 8, count.index + 10)
  availability_zone = local.azs_primary[count.index]

  tags = merge(local.common_tags, {
    Name = "dmz-private-${count.index + 1}"
    Type = "Private"
  })
}

# Internet Gateway for DMZ VPC
resource "aws_internet_gateway" "dmz" {
  provider = aws.primary

  vpc_id = aws_vpc.dmz.id

  tags = merge(local.common_tags, {
    Name = "dmz-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "dmz_nat" {
  provider = aws.primary

  count  = 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "dmz-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways for DMZ VPC
resource "aws_nat_gateway" "dmz" {
  provider      = aws.primary
  count         = 2
  allocation_id = aws_eip.dmz_nat[count.index].id
  subnet_id     = aws_subnet.dmz_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "dmz-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.dmz]
}

# Route table for DMZ public subnets
resource "aws_route_table" "dmz_public" {
  provider = aws.primary

  vpc_id = aws_vpc.dmz.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dmz.id
  }

  tags = merge(local.common_tags, {
    Name = "dmz-public-rt"
  })
}

# Route table for DMZ private subnets
resource "aws_route_table" "dmz_private" {
  provider = aws.primary

  count  = 2
  vpc_id = aws_vpc.dmz.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dmz[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "dmz-private-rt-${count.index + 1}"
  })
}

# Route table associations for DMZ
resource "aws_route_table_association" "dmz_public" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.dmz_public[count.index].id
  route_table_id = aws_route_table.dmz_public.id
}

resource "aws_route_table_association" "dmz_private" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.dmz_private[count.index].id
  route_table_id = aws_route_table.dmz_private[count.index].id
}

# Application VPC - Application tier
resource "aws_vpc" "application" {
  provider             = aws.primary
  cidr_block           = local.app_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "application-vpc"
    Zone = "Application"
  })
}

# Application Private Subnets
resource "aws_subnet" "app_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.application.id
  cidr_block        = cidrsubnet(local.app_cidr, 8, count.index)
  availability_zone = local.azs_primary[count.index]

  tags = merge(local.common_tags, {
    Name = "app-private-${count.index + 1}"
    Type = "Private"
  })
}

# Data VPC - Database tier
resource "aws_vpc" "data" {
  provider             = aws.primary
  cidr_block           = local.data_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "data-vpc"
    Zone = "Data"
  })
}

# Data Private Subnets
resource "aws_subnet" "data_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.data.id
  cidr_block        = cidrsubnet(local.data_cidr, 8, count.index)
  availability_zone = local.azs_primary[count.index]

  tags = merge(local.common_tags, {
    Name = "data-private-${count.index + 1}"
    Type = "Private"
  })
}

# ================================================================================
# SECURITY GROUPS - Zero-trust network policies
# ================================================================================

# Bastion host security group
resource "aws_security_group" "bastion" {
  provider    = aws.primary
  name        = "bastion-sg"
  description = "Security group for bastion host - SSH access only"
  vpc_id      = aws_vpc.dmz.id

  # No ingress rules - must be added based on specific IP requirements

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "bastion-sg"
  })
}

# Web tier security group
resource "aws_security_group" "web" {
  provider    = aws.primary
  name        = "web-sg"
  description = "Security group for web tier - HTTPS only from CloudFront"
  vpc_id      = aws_vpc.dmz.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # In production, restrict to CloudFront IPs
    description = "HTTPS from CloudFront"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "web-sg"
  })
}

# Application tier security group
resource "aws_security_group" "app" {
  provider    = aws.primary
  name        = "app-sg"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.application.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "HTTPS from web tier"
  }

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
    description     = "SSH from bastion host only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "app-sg"
  })
}

# Database tier security group
resource "aws_security_group" "database" {
  provider    = aws.primary
  name        = "database-sg"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.data.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "MySQL from application tier"
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL from application tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "database-sg"
  })
}

# ================================================================================
# S3 BUCKETS - Centralized logging with lifecycle management
# ================================================================================

# CloudTrail S3 bucket
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.primary

  bucket = "${local.account_id}-cloudtrail-logs"

  tags = merge(local.common_tags, {
    Name    = "cloudtrail-logs"
    Purpose = "CloudTrail logging"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  provider = aws.primary

  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.primary

  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  provider = aws.primary

  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.primary

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
      }
    ]
  })
}

# VPC Flow Logs S3 bucket
resource "aws_s3_bucket" "vpc_flow_logs" {
  provider = aws.primary

  bucket = "${local.account_id}-vpc-flow-logs"

  tags = merge(local.common_tags, {
    Name    = "vpc-flow-logs"
    Purpose = "VPC Flow Logs"
  })
}

resource "aws_s3_bucket_versioning" "vpc_flow_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.vpc_flow_logs.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vpc_flow_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.vpc_flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "vpc_flow_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.vpc_flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "vpc_flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.vpc_flow_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

# Cross-account bucket policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "vpc_flow_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.vpc_flow_logs.id

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
        Resource = "${aws_s3_bucket.vpc_flow_logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.vpc_flow_logs.arn
      },
      {
        Sid    = "CrossAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.logging_account_id}:root"
        }
        Action = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.vpc_flow_logs.arn,
          "${aws_s3_bucket.vpc_flow_logs.arn}/*"
        ]
      }
    ]
  })
}

# AWS Config S3 bucket
resource "aws_s3_bucket" "config" {
  provider = aws.primary

  bucket = "${local.account_id}-aws-config"

  tags = merge(local.common_tags, {
    Name    = "aws-config"
    Purpose = "AWS Config"
  })
}

resource "aws_s3_bucket_versioning" "config" {
  provider = aws.primary

  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  provider = aws.primary

  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  provider = aws.primary

  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config" {
  provider = aws.primary

  bucket = aws_s3_bucket.config.id

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
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ================================================================================
# VPC FLOW LOGS - Network traffic monitoring for all VPCs
# ================================================================================

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  provider = aws.primary
  name     = "vpc-flow-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  provider = aws.primary

  name = "vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:us-east-1:${local.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.vpc_flow_logs.arn}/*"
      }
    ]
  })
}

# VPC Flow Logs for DMZ VPC
resource "aws_flow_log" "dmz" {
  provider             = aws.primary
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  log_destination      = aws_s3_bucket.vpc_flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.dmz.id

  tags = merge(local.common_tags, {
    Name = "dmz-vpc-flow-log"
  })
}

# VPC Flow Logs for Application VPC
resource "aws_flow_log" "application" {
  provider             = aws.primary
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  log_destination      = aws_s3_bucket.vpc_flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.application.id

  tags = merge(local.common_tags, {
    Name = "application-vpc-flow-log"
  })
}

# VPC Flow Logs for Data VPC
resource "aws_flow_log" "data" {
  provider             = aws.primary
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  log_destination      = aws_s3_bucket.vpc_flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.data.id

  tags = merge(local.common_tags, {
    Name = "data-vpc-flow-log"
  })
}

# ================================================================================
# CLOUDTRAIL - Audit logging for all API calls
# ================================================================================

# CloudWatch Logs group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  provider          = aws.primary
  name              = "/aws/cloudtrail/pci-dss"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.master.arn

  tags = local.common_tags
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
  provider = aws.primary

  name = "cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail" {
  provider = aws.primary

  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/cloudtrail/pci-dss:*"
    }]
  })
}

# Multi-region CloudTrail
resource "aws_cloudtrail" "main" {
  provider                      = aws.primary
  name                          = "pci-dss-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    # Data events for sensitive S3 buckets
    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.cloudtrail.arn}/*",
        "${aws_s3_bucket.vpc_flow_logs.arn}/*",
        "${aws_s3_bucket.config.arn}/*"
      ]
    }
  }

  kms_key_id = aws_kms_key.master.arn

  tags = local.common_tags

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ================================================================================
# AWS CONFIG - Compliance monitoring
# ================================================================================

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  provider = aws.primary

  name = "aws-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config" {
  provider   = aws.primary
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  provider = aws.primary

  name = "config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

# Config Recorder
resource "aws_config_configuration_recorder" "main" {
  provider = aws.primary

  name     = "pci-dss-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  provider       = aws.primary
  name           = "pci-dss-delivery"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  provider   = aws.primary
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rule: Encrypted EBS Volumes
resource "aws_config_config_rule" "encrypted_volumes" {
  provider = aws.primary

  name = "encrypted-ebs-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

# Config Rule: No public S3 buckets
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  provider = aws.primary

  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

# Config Rule: Security groups should not allow unrestricted access
resource "aws_config_config_rule" "restricted_ssh" {
  provider = aws.primary

  name = "restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = local.common_tags
}

# ================================================================================
# GUARDDUTY - Threat detection
# ================================================================================

# Enable GuardDuty detector
resource "aws_guardduty_detector" "main" {
  provider                     = aws.primary
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
  }

  tags = local.common_tags
}

# ================================================================================
# SNS TOPICS - Notifications for security events
# ================================================================================

# SNS topic for GuardDuty findings
resource "aws_sns_topic" "guardduty" {
  provider          = aws.primary
  name              = "guardduty-findings"
  kms_master_key_id = aws_kms_key.master.id

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "guardduty_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.guardduty.arn
  protocol  = "email"
  endpoint  = var.security_notification_email
}

# SNS topic for CloudWatch alarms
resource "aws_sns_topic" "cloudwatch_alarms" {
  provider          = aws.primary
  name              = "cloudwatch-security-alarms"
  kms_master_key_id = aws_kms_key.master.id

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "cloudwatch_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.cloudwatch_alarms.arn
  protocol  = "email"
  endpoint  = var.security_notification_email
}

# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  provider    = aws.primary
  name        = "guardduty-findings-rule"
  description = "Trigger on GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.guardduty.arn
}

# ================================================================================
# CLOUDWATCH ALARMS - Security monitoring
# ================================================================================

# CloudWatch Log Metric Filter for failed authentication
resource "aws_cloudwatch_log_metric_filter" "failed_auth" {
  provider       = aws.primary
  name           = "failed-authentication-attempts"
  pattern        = "[time, request_id, event_type = ERROR, event_name = *Authentication*, ...]"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "FailedAuthenticationAttempts"
    namespace = "Security/Authentication"
    value     = "1"
  }
}

# CloudWatch Alarm for failed authentication attempts
resource "aws_cloudwatch_metric_alarm" "failed_auth" {
  provider            = aws.primary
  alarm_name          = "high-failed-authentication-attempts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedAuthenticationAttempts"
  namespace           = "Security/Authentication"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors failed authentication attempts"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  tags = local.common_tags
}

# ================================================================================
# WAF - Web Application Firewall
# ================================================================================

# IP set for rate limiting
resource "aws_wafv2_ip_set" "allowed_ips" {
  provider           = aws.primary
  name               = "allowed-ips"
  description        = "Allowed IP addresses"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = [] # Add allowed IPs as needed

  tags = local.common_tags
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  provider    = aws.primary
  name        = "pci-dss-web-acl"
  description = "WAF ACL for PCI DSS compliance"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule - 2000 requests per 5 minutes
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

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Core Rule Set
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
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
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
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "pci-dss-web-acl"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  provider          = aws.primary
  name              = "/aws/wafv2/pci-dss"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.master.arn

  tags = local.common_tags
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  provider                = aws.primary
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# ================================================================================
# SYSTEMS MANAGER PARAMETER STORE - Secure credential storage
# ================================================================================

# Database password with automatic rotation
resource "aws_ssm_parameter" "db_password" {
  provider    = aws.primary
  name        = "/pci-dss/database/master/password"
  description = "Master database password - Retrieved from AWS Secrets Manager"
  type        = "SecureString"
  value       = data.aws_secretsmanager_secret_version.db_password.secret_string
  key_id      = aws_kms_key.parameter_store.key_id

  tags = merge(local.common_tags, {
    AutoRotate = "true"
  })
}

# API key storage
resource "aws_ssm_parameter" "api_key" {
  provider    = aws.primary
  name        = "/pci-dss/api/payment/key"
  description = "Payment API key"
  type        = "SecureString"
  value       = var.api_key_placeholder
  key_id      = aws_kms_key.parameter_store.key_id

  tags = merge(local.common_tags, {
    AutoRotate = "true"
  })
}

# ================================================================================
# IAM ROLES AND POLICIES - Least privilege access
# ================================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_instance" {
  provider           = aws.primary
  name               = "pci-dss-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_ec2.json

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_instance" {
  provider = aws.primary

  name = "pci-dss-ec2-policy"
  role = aws_iam_role.ec2_instance.id

  # Least privilege policy - only specific resources
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${local.account_id}-application-data/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:us-east-1:${local.account_id}:parameter/pci-dss/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.parameter_store.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/ec2/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  provider = aws.primary

  name = "pci-dss-ec2-profile"
  role = aws_iam_role.ec2_instance.name

  tags = local.common_tags
}

# Lambda Function Role
resource "aws_iam_role" "lambda_function" {
  provider           = aws.primary
  name               = "pci-dss-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_lambda.json

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_function" {
  provider = aws.primary

  name = "pci-dss-lambda-policy"
  role = aws_iam_role.lambda_function.id

  # Least privilege policy for Lambda
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
        Resource = [
          "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/lambda/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:us-east-1:${local.account_id}:parameter/pci-dss/api/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.parameter_store.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  provider           = aws.primary
  name               = "pci-dss-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_ecs.json

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ecs_task" {
  provider = aws.primary

  name = "pci-dss-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  # Least privilege policy for ECS tasks
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = [
          "arn:aws:ecr:us-east-1:${local.account_id}:repository/pci-dss-app"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:us-east-1:${local.account_id}:log-group:/ecs/pci-dss/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:us-east-1:${local.account_id}:parameter/pci-dss/database/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.parameter_store.arn
        ]
      }
    ]
  })
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  provider           = aws.primary
  name               = "pci-dss-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_ecs.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  provider   = aws.primary
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ================================================================================
# APPLICATION LOAD BALANCER - For web tier
# ================================================================================

# ALB for web application
resource "aws_lb" "web" {
  provider           = aws.primary
  name               = "pci-dss-web-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.dmz_public[*].id

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = local.common_tags
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  provider = aws.primary

  bucket = "${local.account_id}-alb-logs"

  tags = merge(local.common_tags, {
    Name    = "alb-logs"
    Purpose = "ALB Access Logs"
  })
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "alb_logs" {
  provider = aws.primary

  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  provider     = aws.primary
  resource_arn = aws_lb.web.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# ================================================================================
# OUTPUTS - Key resource identifiers for reference
# ================================================================================

output "vpc_ids" {
  value = {
    dmz         = aws_vpc.dmz.id
    application = aws_vpc.application.id
    data        = aws_vpc.data.id
  }
  description = "VPC IDs for all network zones"
}

output "kms_key_arns" {
  value = {
    master          = aws_kms_key.master.arn
    s3              = aws_kms_key.s3.arn
    parameter_store = aws_kms_key.parameter_store.arn
  }
  description = "KMS key ARNs for encryption"
  sensitive   = true
}

output "s3_bucket_names" {
  value = {
    cloudtrail    = aws_s3_bucket.cloudtrail.id
    vpc_flow_logs = aws_s3_bucket.vpc_flow_logs.id
    config        = aws_s3_bucket.config.id
    alb_logs      = aws_s3_bucket.alb_logs.id
  }
  description = "S3 bucket names for logging and compliance"
}

output "sns_topic_arns" {
  value = {
    guardduty         = aws_sns_topic.guardduty.arn
    cloudwatch_alarms = aws_sns_topic.cloudwatch_alarms.arn
  }
  description = "SNS topic ARNs for notifications"
}

output "iam_role_arns" {
  value = {
    ec2_instance       = aws_iam_role.ec2_instance.arn
    lambda_function    = aws_iam_role.lambda_function.arn
    ecs_task           = aws_iam_role.ecs_task.arn
    ecs_task_execution = aws_iam_role.ecs_task_execution.arn
  }
  description = "IAM role ARNs for compute resources"
}

output "alb_dns_name" {
  value       = aws_lb.web.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "waf_web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "WAF Web ACL ID for application protection"
}

output "guardduty_detector_id" {
  value       = aws_guardduty_detector.main.id
  description = "GuardDuty detector ID for threat detection"
}

output "cloudtrail_name" {
  value       = aws_cloudtrail.main.name
  description = "CloudTrail name for audit logging"
}

output "config_recorder_name" {
  value       = aws_config_configuration_recorder.main.name
  description = "AWS Config recorder name for compliance monitoring"
}
