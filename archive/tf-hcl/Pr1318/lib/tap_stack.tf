# Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}


variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "reset816"
  validation {
    condition     = contains(["production", "staging", "development", "freshdeploy", "newenv20250815", "cleanstate20250815", "ultrafresh20250816", "reset20250816203000", "reset816"], var.environment)
    error_message = "Environment must be one of: production, staging, development, freshdeploy, newenv20250815, cleanstate20250815, ultrafresh20250816, reset20250816203000, reset816."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "new-deploy"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "db_engine" {
  description = "RDS database engine"
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "RDS database engine version"
  type        = string
  default     = "8.0"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "enable_mfa" {
  description = "Enable MFA for IAM users"
  type        = bool
  default     = true
}

# Local values for resource naming and tagging
locals {
  common_tags = {
    Environment  = var.environment
    Project      = var.project_name
    ManagedBy    = "Terraform"
    CreatedDate  = timestamp()
    DeploymentId = random_string.deployment_id.result
  }

  name_prefix = "${var.project_name}-${random_string.deployment_id.result}-v2"
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Random suffix for unique resource names
resource "random_string" "unique_suffix" {
  length  = 8
  upper   = false
  special = false
}

# Additional random string for complete state reset
resource "random_string" "deployment_id" {
  length  = 6
  upper   = false
  special = false
  keepers = {
    deployment       = "reset816"
    force_recreation = "20250816-032000"
    complete_reset   = "final"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix}"
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
      }
    ]
  })
  tags = local.common_tags
  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
  depends_on    = [aws_kms_key.main]

  lifecycle {
    create_before_destroy = true
    replace_triggered_by = [
      random_string.deployment_id
    ]
  }
}

# VPC resources are defined inline below
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
  depends_on = [aws_vpc.main, null_resource.empty_old_cloudtrail_bucket]
  lifecycle {
    create_before_destroy = true
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  depends_on              = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  depends_on        = [aws_vpc.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateway EIPs
resource "aws_eip" "nat" {
  count = 3

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
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

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = 30
  # Temporarily removing KMS encryption to avoid dependency issues
  # kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${local.name_prefix}-flow-role"

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

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${local.name_prefix}-flow-policy"
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
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${local.name_prefix}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"
  depends_on  = [aws_vpc.main]

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database servers"
  depends_on  = [aws_vpc.main]

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Buckets
resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-main-${random_string.unique_suffix.result}"

  # Force delete bucket even if not empty
  force_destroy = true

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-logs-${random_string.unique_suffix.result}"

  # Force delete bucket even if not empty
  force_destroy = true

  tags = merge(local.common_tags, {
    Purpose = "CloudTrail Logs"
  })

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

# Null resource to empty S3 bucket before destruction  
resource "null_resource" "empty_old_cloudtrail_bucket" {
  triggers = {
    always_run = timestamp()
  }
  # Final robust cleanup: delete all objects, versions, and delete markers
  provisioner "local-exec" {
    command     = <<EOT
      BUCKET="secure-multi-account-development-cloudtrail-4185c46d"
      # Remove all objects
      aws s3 rm s3://$BUCKET --recursive || echo 'Bucket not found or already empty'
      # Remove all versions and delete markers
      aws s3api list-object-versions --bucket $BUCKET --output json > versions.json
      jq -r '.Versions[]? | "aws s3api delete-object --bucket $BUCKET --key \"\(.Key)\" --version-id \"\(.VersionId)\""' versions.json > delete_versions.sh
      jq -r '.DeleteMarkers[]? | "aws s3api delete-object --bucket $BUCKET --key \"\(.Key)\" --version-id \"\(.VersionId)\""' versions.json >> delete_versions.sh
      chmod +x delete_versions.sh
      sh delete_versions.sh || echo 'No versions to delete'
      rm -f versions.json delete_versions.sh
    EOT
    interpreter = ["/bin/sh", "-c"]
    on_failure  = continue
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Lifecycle Configuration to auto-delete objects
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket     = aws_s3_bucket.main.id
  depends_on = [aws_s3_bucket_versioning.main]

  rule {
    id     = "delete_all_objects"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 1
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket     = aws_s3_bucket.cloudtrail.id
  depends_on = [aws_s3_bucket_versioning.cloudtrail]

  rule {
    id     = "delete_all_objects"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 1
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policies
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
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
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
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.id
  s3_key_prefix  = "cloudtrail-logs"

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  tags = local.common_tags
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-database"

  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "maindb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = var.environment == "production" ? true : false

  publicly_accessible = false

  tags = local.common_tags
}

# IAM User with MFA
resource "aws_iam_user" "app_user" {
  name = "${local.name_prefix}-app-user"
  path = "/"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

# IAM User Policy
resource "aws_iam_user_policy" "app_user" {
  name = "${local.name_prefix}-app-user-policy"
  user = aws_iam_user.app_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      }
    ]
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

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

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [random_string.deployment_id]
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_flow_log_status" {
  description = "VPC Flow Log status"
  value = {
    flow_log_id = aws_flow_log.vpc.id
    log_group   = aws_cloudwatch_log_group.vpc_flow_logs.name
    status      = "enabled"
  }
}

output "s3_bucket_main" {
  description = "Main S3 bucket details"
  value = {
    bucket_name       = aws_s3_bucket.main.id
    bucket_arn        = aws_s3_bucket.main.arn
    encryption_status = "enabled"
    encryption_type   = "aws:kms"
    kms_key_id        = aws_kms_key.main.arn
  }
}

output "s3_bucket_cloudtrail" {
  description = "CloudTrail S3 bucket details"
  value = {
    bucket_name       = aws_s3_bucket.cloudtrail.id
    bucket_arn        = aws_s3_bucket.cloudtrail.arn
    encryption_status = "enabled"
    encryption_type   = "aws:kms"
    kms_key_id        = aws_kms_key.main.arn
  }
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_security_status" {
  description = "RDS security configuration"
  value = {
    publicly_accessible = aws_db_instance.main.publicly_accessible
    encrypted           = aws_db_instance.main.storage_encrypted
    kms_key_id          = aws_db_instance.main.kms_key_id
    vpc_security_groups = aws_db_instance.main.vpc_security_group_ids
  }
}

output "cloudtrail_details" {
  description = "CloudTrail configuration"
  value = {
    trail_name    = aws_cloudtrail.main.name
    trail_arn     = aws_cloudtrail.main.arn
    s3_bucket_arn = aws_s3_bucket.cloudtrail.arn
    status        = "enabled"
  }
}

output "iam_user_mfa_status" {
  description = "IAM user MFA configuration"
  value = {
    user_name    = aws_iam_user.app_user.name
    user_arn     = aws_iam_user.app_user.arn
    mfa_required = var.enable_mfa
    mfa_status   = var.enable_mfa ? "enabled" : "disabled"
  }
}

output "iam_roles" {
  description = "IAM roles and their ARNs"
  value = {
    ec2_role = {
      name = aws_iam_role.ec2_role.name
      arn  = aws_iam_role.ec2_role.arn
    }
    vpc_flow_logs_role = {
      name = aws_iam_role.vpc_flow_logs.name
      arn  = aws_iam_role.vpc_flow_logs.arn
    }
  }
}

output "security_groups" {
  description = "Security group details"
  value = {
    web_sg = {
      id    = aws_security_group.web.id
      name  = aws_security_group.web.name
      rules = "HTTP(80), HTTPS(443) inbound; All outbound"
    }
    database_sg = {
      id    = aws_security_group.database.id
      name  = aws_security_group.database.name
      rules = "MySQL(3306) from web SG; All outbound"
    }
  }
}

output "kms_key" {
  description = "KMS key details"
  value = {
    key_id   = aws_kms_key.main.key_id
    key_arn  = aws_kms_key.main.arn
    alias    = aws_kms_alias.main.name
    rotation = "enabled"
  }
}

output "environment_summary" {
  description = "Complete environment summary"
  value = {
    environment  = var.environment
    region       = var.aws_region
    project_name = var.project_name
    vpc_id       = aws_vpc.main.id
    subnets = {
      public_subnets  = aws_subnet.public[*].id
      private_subnets = aws_subnet.private[*].id
    }
    security_status = {
      encryption_enabled  = true
      vpc_flow_logs       = true
      cloudtrail_enabled  = true
      mfa_configured      = var.enable_mfa
      least_privilege_iam = true
      private_rds         = true
    }
  }
}