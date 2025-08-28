# tap_stack.tf - Multi-region S3 buckets with cross-region replication and Lambda access
```hcl
# Input Variables
variable "environment" {
  description = "Environment name for resource tagging"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap"
}

variable "bucket_versioning_enabled" {
  description = "Enable versioning on S3 buckets"
  type        = bool
  default     = true
}

variable "bucket_encryption_enabled" {
  description = "Enable encryption on S3 buckets"
  type        = bool
  default     = true
}

# Local Values for consistent naming and configuration
locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Region configurations
  regions = {
    us_east_1      = "us-east-1"
    eu_west_1      = "eu-west-1"
    ap_southeast_1 = "ap-southeast-1"
  }

  # Bucket naming convention - S3 bucket names must be lowercase
  bucket_names = {
    us_east_1      = "${lower(var.project_name)}-${lower(var.environment)}-bucket-us-east-1"
    eu_west_1      = "${lower(var.project_name)}-${lower(var.environment)}-bucket-eu-west-1"
    ap_southeast_1 = "${lower(var.project_name)}-${lower(var.environment)}-bucket-ap-southeast-1"
  }

  # IAM role name
  lambda_role_name = "${var.project_name}-${var.environment}-lambda-s3-access-role"
}

# S3 Bucket - US East 1 (Primary)
resource "aws_s3_bucket" "us_east_1" {
  provider = aws.us_east_1
  bucket   = local.bucket_names.us_east_1

  tags = merge(local.common_tags, {
    Name   = local.bucket_names.us_east_1
    Region = local.regions.us_east_1
    Type   = "Primary"
  })
}

# S3 Bucket Versioning - US East 1
resource "aws_s3_bucket_versioning" "us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_east_1.id

  versioning_configuration {
    status = var.bucket_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# S3 Bucket Server Side Encryption - US East 1
resource "aws_s3_bucket_server_side_encryption_configuration" "us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block - US East 1
resource "aws_s3_bucket_public_access_block" "us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket - EU West 1
resource "aws_s3_bucket" "eu_west_1" {
  provider = aws.eu_west_1
  bucket   = local.bucket_names.eu_west_1

  tags = merge(local.common_tags, {
    Name   = local.bucket_names.eu_west_1
    Region = local.regions.eu_west_1
    Type   = "Replica"
  })
}

# S3 Bucket Versioning - EU West 1
resource "aws_s3_bucket_versioning" "eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.eu_west_1.id

  versioning_configuration {
    status = var.bucket_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# S3 Bucket Server Side Encryption - EU West 1
resource "aws_s3_bucket_server_side_encryption_configuration" "eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.eu_west_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block - EU West 1
resource "aws_s3_bucket_public_access_block" "eu_west_1" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.eu_west_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket - AP Southeast 1
resource "aws_s3_bucket" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  bucket   = local.bucket_names.ap_southeast_1

  tags = merge(local.common_tags, {
    Name   = local.bucket_names.ap_southeast_1
    Region = local.regions.ap_southeast_1
    Type   = "Replica"
  })
}

# S3 Bucket Versioning - AP Southeast 1
resource "aws_s3_bucket_versioning" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  bucket   = aws_s3_bucket.ap_southeast_1.id

  versioning_configuration {
    status = var.bucket_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# S3 Bucket Server Side Encryption - AP Southeast 1
resource "aws_s3_bucket_server_side_encryption_configuration" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  bucket   = aws_s3_bucket.ap_southeast_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block - AP Southeast 1
resource "aws_s3_bucket_public_access_block" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  bucket   = aws_s3_bucket.ap_southeast_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication" {
  provider = aws.us_east_1
  name     = "${var.project_name}-${var.environment}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-s3-replication-role"
    Type = "S3ReplicationRole"
  })
}

# IAM Policy for S3 Replication
resource "aws_iam_role_policy" "replication" {
  provider = aws.us_east_1
  name     = "${var.project_name}-${var.environment}-s3-replication-policy"
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.us_east_1.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.us_east_1.arn
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.eu_west_1.arn}/*",
          "${aws_s3_bucket.ap_southeast_1.arn}/*"
        ]
      }
    ]
  })
}

# S3 Bucket Replication Configuration - US East 1 to EU West 1
resource "aws_s3_bucket_replication_configuration" "us_to_eu" {
  provider = aws.us_east_1
  depends_on = [
    aws_s3_bucket_versioning.us_east_1,
    aws_s3_bucket_versioning.eu_west_1
  ]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.us_east_1.id

  rule {
    id     = "replicate-to-eu-west-1"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.eu_west_1.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# S3 Bucket Replication Configuration - US East 1 to AP Southeast 1
resource "aws_s3_bucket_replication_configuration" "us_to_ap" {
  provider = aws.us_east_1
  depends_on = [
    aws_s3_bucket_versioning.us_east_1,
    aws_s3_bucket_versioning.ap_southeast_1
  ]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.us_east_1.id

  rule {
    id     = "replicate-to-ap-southeast-1"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.ap_southeast_1.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_s3_access" {
  provider = aws.us_east_1
  name     = local.lambda_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = local.lambda_role_name
    Type = "LambdaExecutionRole"
  })
}

# IAM Policy for Lambda S3 Access
resource "aws_iam_role_policy" "lambda_s3_access" {
  provider = aws.us_east_1
  name     = "${var.project_name}-${var.environment}-lambda-s3-access-policy"
  role     = aws_iam_role.lambda_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObjectVersion",
          "s3:PutObjectAcl",
          "s3:GetObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.us_east_1.arn,
          "${aws_s3_bucket.us_east_1.arn}/*",
          aws_s3_bucket.eu_west_1.arn,
          "${aws_s3_bucket.eu_west_1.arn}/*",
          aws_s3_bucket.ap_southeast_1.arn,
          "${aws_s3_bucket.ap_southeast_1.arn}/*"
        ]
      }
    ]
  })
}

# Attach AWS Lambda Basic Execution Role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  provider   = aws.us_east_1
  role       = aws_iam_role.lambda_s3_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Outputs
# US East 1 outputs
output "s3_bucket_id_us_east_1" {
  description = "ID of S3 bucket in us-east-1"
  value       = aws_s3_bucket.us_east_1.id
}

output "s3_bucket_arn_us_east_1" {
  description = "ARN of S3 bucket in us-east-1"
  value       = aws_s3_bucket.us_east_1.arn
}

output "s3_bucket_domain_name_us_east_1" {
  description = "Domain name of S3 bucket in us-east-1"
  value       = aws_s3_bucket.us_east_1.bucket_domain_name
}

output "s3_bucket_regional_domain_name_us_east_1" {
  description = "Regional domain name of S3 bucket in us-east-1"
  value       = aws_s3_bucket.us_east_1.bucket_regional_domain_name
}

# EU West 1 outputs
output "s3_bucket_id_eu_west_1" {
  description = "ID of S3 bucket in eu-west-1"
  value       = aws_s3_bucket.eu_west_1.id
}

output "s3_bucket_arn_eu_west_1" {
  description = "ARN of S3 bucket in eu-west-1"
  value       = aws_s3_bucket.eu_west_1.arn
}

output "s3_bucket_domain_name_eu_west_1" {
  description = "Domain name of S3 bucket in eu-west-1"
  value       = aws_s3_bucket.eu_west_1.bucket_domain_name
}

output "s3_bucket_regional_domain_name_eu_west_1" {
  description = "Regional domain name of S3 bucket in eu-west-1"
  value       = aws_s3_bucket.eu_west_1.bucket_regional_domain_name
}

# AP Southeast 1 outputs
output "s3_bucket_id_ap_southeast_1" {
  description = "ID of S3 bucket in ap-southeast-1"
  value       = aws_s3_bucket.ap_southeast_1.id
}

output "s3_bucket_arn_ap_southeast_1" {
  description = "ARN of S3 bucket in ap-southeast-1"
  value       = aws_s3_bucket.ap_southeast_1.arn
}

output "s3_bucket_domain_name_ap_southeast_1" {
  description = "Domain name of S3 bucket in ap-southeast-1"
  value       = aws_s3_bucket.ap_southeast_1.bucket_domain_name
}

output "s3_bucket_regional_domain_name_ap_southeast_1" {
  description = "Regional domain name of S3 bucket in ap-southeast-1"
  value       = aws_s3_bucket.ap_southeast_1.bucket_regional_domain_name
}

output "lambda_iam_role_arn" {
  description = "ARN of the IAM role for Lambda functions to access S3 buckets"
  value       = aws_iam_role.lambda_s3_access.arn
}

output "lambda_iam_role_name" {
  description = "Name of the IAM role for Lambda functions"
  value       = aws_iam_role.lambda_s3_access.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication.arn
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.replication.name
}

output "bucket_regions" {
  description = "Regions where S3 buckets are deployed"
  value       = local.regions
}

output "environment" {
  description = "Environment tag applied to all resources"
  value       = var.environment
}

output "project_name" {
  description = "Project name used for resource naming"
  value       = var.project_name
}
```

# provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}
```
