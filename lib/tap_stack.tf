########################
# Variables
########################

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region replication"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix to avoid naming conflicts"
  type        = string
  default     = "dev"
}

variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "fintech"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "core-infrastructure"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

########################
# Local Values
########################

locals {
  name_prefix = "${var.company_name}-${var.environment_suffix}"

  common_tags = {
    Environment    = var.environment_suffix
    Project        = var.project_name
    Company        = var.company_name
    ManagedBy      = "terraform"
    CostCenter     = "infrastructure"
    Compliance     = "financial-services"
    BackupRequired = "true"
    Owner          = "devops-team"
  }

  # Get availability zones for multi-AZ deployment
  azs = data.aws_availability_zones.available.names
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

########################
# Random ID for Unique Naming
########################

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

########################
# KMS Keys for Encryption
########################

resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} infrastructure encryption"
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
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-main-key"
  target_key_id = aws_kms_key.main.key_id
}

########################
# VPC and Networking
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_vpc_flow_logs" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  depends_on = [aws_iam_role.flow_logs]
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets (for NAT Gateways and Load Balancers)
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets (for Application Tier)
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Isolated Subnets (for Database Tier)
resource "aws_subnet" "isolated" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-isolated-subnet-${count.index + 1}"
    Type = "isolated"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw-${count.index + 1}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table" "isolated" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-isolated-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "isolated" {
  count = 3

  subnet_id      = aws_subnet.isolated[count.index].id
  route_table_id = aws_route_table.isolated.id
}

########################
# Security Groups
########################

resource "aws_security_group" "web_tier" {
  name_prefix = "${local.name_prefix}-web-"
  description = "Security group for web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP traffic from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app_tier" {
  name_prefix = "${local.name_prefix}-app-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
    description     = "Application traffic from web tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "db_tier" {
  name_prefix = "${local.name_prefix}-db-"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
    description     = "PostgreSQL traffic from app tier"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

########################
# IAM Roles and Policies
########################

# S3 Access Role
resource "aws_iam_role" "s3_access" {
  name = "${local.name_prefix}-s3-access-role"

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

  tags = local.common_tags
}

resource "aws_iam_policy" "s3_access" {
  name        = "${local.name_prefix}-s3-access-policy"
  description = "Policy for S3 access with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${data.aws_region.current.name}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.s3_access.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# CloudWatch Logs Role
resource "aws_iam_role" "cloudwatch_logs" {
  name = "${local.name_prefix}-cloudwatch-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# VPC Flow Logs Role
resource "aws_iam_role" "flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"

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

  tags = local.common_tags
}

resource "aws_iam_policy" "flow_logs" {
  name        = "${local.name_prefix}-vpc-flow-logs-policy"
  description = "Policy for VPC Flow Logs"

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
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "flow_logs" {
  role       = aws_iam_role.flow_logs.name
  policy_arn = aws_iam_policy.flow_logs.arn
}

########################
# S3 Buckets
########################

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  bucket = "${local.name_prefix}-primary-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-primary-bucket"
    Type = "primary-storage"
  })
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "lifecycle_rule"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Logging S3 Bucket
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
    Type = "logging"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "logs_lifecycle_rule"
    status = "Enabled"

    expiration {
      days = 2555 # 7 years for financial compliance
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

########################
# CloudWatch Monitoring
########################

resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/${local.name_prefix}/main"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-main-log-group"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/${local.name_prefix}/vpc-flow-logs"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/${local.name_prefix}/cloudtrail"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-log-group"
  })
}

########################
# CloudTrail
########################

resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-trail"
  s3_bucket_name = aws_s3_bucket.logs.id
  s3_key_prefix  = "cloudtrail"

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  kms_key_id                    = aws_kms_key.main.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })
}

resource "aws_iam_role" "cloudtrail_logs" {
  name = "${local.name_prefix}-cloudtrail-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudtrail_logs" {
  name        = "${local.name_prefix}-cloudtrail-logs-policy"
  description = "Policy for CloudTrail to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cloudtrail_logs" {
  role       = aws_iam_role.cloudtrail_logs.name
  policy_arn = aws_iam_policy.cloudtrail_logs.arn
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.logs.id

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
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-trail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-trail"
          }
        }
      }
    ]
  })
}

########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "isolated_subnet_ids" {
  description = "IDs of the isolated subnets"
  value       = aws_subnet.isolated[*].id
}

output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web_tier.id
}

output "app_security_group_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app_tier.id
}

output "db_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.db_tier.id
}

output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "logs_s3_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_s3_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "s3_access_role_arn" {
  description = "ARN of the S3 access IAM role"
  value       = aws_iam_role.s3_access.arn
}

output "cloudwatch_logs_role_arn" {
  description = "ARN of the CloudWatch Logs IAM role"
  value       = aws_iam_role.cloudwatch_logs.arn
}

output "main_log_group_name" {
  description = "Name of the main CloudWatch log group"
  value       = aws_cloudwatch_log_group.main.name
}

output "vpc_flow_logs_group_name" {
  description = "Name of the VPC flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
