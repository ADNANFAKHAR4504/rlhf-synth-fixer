# Variables
variable "aws_region" {
  description = "AWS region for primary resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner tag for cost allocation"
  type        = string
  default     = "platform-team"
}

variable "environment" {
  description = "Environment tag for cost allocation"
  type        = string
  default     = "production"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

# Locals
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id
  partition  = data.aws_partition.current.partition

  # Add unique suffix to avoid conflicts
  unique_suffix = "v3"

  # Common tags for cost allocation - using provider default_tags instead
  common_tags = {}
}

# Access Logging Bucket
resource "aws_s3_bucket" "access_logging" {
  bucket = "data-secured-${local.account_id}-access-logs-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Name       = "data-secured-${local.account_id}-access-logs-${local.unique_suffix}"
    Purpose    = "S3 Access Logging"
    Compliance = "Required"
  })
}

# Access Logging Bucket Versioning
resource "aws_s3_bucket_versioning" "access_logging_versioning" {
  bucket = aws_s3_bucket.access_logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Access Logging Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "access_logging_encryption" {
  bucket = aws_s3_bucket.access_logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Access Logging Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "access_logging_pab" {
  bucket = aws_s3_bucket.access_logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Access Logging Bucket Policy - Allow S3 service to write logs
resource "aws_s3_bucket_policy" "access_logging_policy" {
  bucket = aws_s3_bucket.access_logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ServerAccessLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.access_logging.arn}/access-logs/*"
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.primary.arn
          }
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
        }
      },
      {
        Sid    = "S3ServerAccessLogsDeliveryRootAccess"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.access_logging.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.access_logging.arn,
          "${aws_s3_bucket.access_logging.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.access_logging_pab]
}

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  bucket = "data-secured-${local.account_id}-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Name        = "data-secured-${local.account_id}-${local.unique_suffix}"
    Purpose     = "Secure Data Storage"
    Compliance  = "Required"
    Replication = "Enabled"
  })
}

# Primary Bucket Versioning
resource "aws_s3_bucket_versioning" "primary_versioning" {
  bucket = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Primary Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_encryption" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "aws/s3"
    }
    bucket_key_enabled = true
  }
}

# Primary Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "primary_pab" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Primary Bucket Access Logging
resource "aws_s3_bucket_logging" "primary_logging" {
  bucket = aws_s3_bucket.primary.id

  target_bucket = aws_s3_bucket.access_logging.id
  target_prefix = "access-logs/"
}

# Primary Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "primary_lifecycle" {
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "delete_old_objects"
    status = "Enabled"

    filter {}

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary_versioning]
}

# Replication Destination Bucket (us-west-2)
resource "aws_s3_bucket" "replication_destination" {
  provider = aws.us_west_2
  bucket   = "data-secured-${local.account_id}-replica-${local.unique_suffix}"

  tags = merge(local.common_tags, {
    Name       = "data-secured-${local.account_id}-replica-${local.unique_suffix}"
    Purpose    = "Disaster Recovery Replica"
    Compliance = "Required"
    Region     = "us-west-2"
  })
}

# Replication Destination Bucket Versioning
resource "aws_s3_bucket_versioning" "replication_destination_versioning" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.replication_destination.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Replication Destination Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "replication_destination_encryption" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.replication_destination.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "aws/s3"
    }
    bucket_key_enabled = true
  }
}

# Replication Destination Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "replication_destination_pab" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.replication_destination.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Replication Destination Bucket Policy
resource "aws_s3_bucket_policy" "replication_destination_policy" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.replication_destination.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReplicationPolicy"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication_role.arn
        }
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replication_destination.arn}/*"
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.replication_destination.arn,
          "${aws_s3_bucket.replication_destination.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "RequireSSEKMS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.replication_destination.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.replication_destination_pab,
    aws_iam_role.replication_role
  ]
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication_role" {
  name = "data-secured-${local.account_id}-replication-role-${local.unique_suffix}"

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
    Name    = "data-secured-${local.account_id}-replication-role-${local.unique_suffix}"
    Purpose = "S3 Cross-Region Replication"
  })
}

# IAM Policy for S3 Replication
resource "aws_iam_policy" "replication_policy" {
  name        = "data-secured-${local.account_id}-replication-policy-${local.unique_suffix}"
  description = "Policy for S3 cross-region replication"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replication_destination.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "arn:${local.partition}:kms:${local.region}:${local.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${local.region}.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey"
        ]
        Resource = "arn:${local.partition}:kms:us-west-2:${local.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.us-west-2.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "data-secured-${local.account_id}-replication-policy-${local.unique_suffix}"
    Purpose = "S3 Cross-Region Replication"
  })
}

# Attach Replication Policy to Role
resource "aws_iam_role_policy_attachment" "replication_policy_attachment" {
  role       = aws_iam_role.replication_role.name
  policy_arn = aws_iam_policy.replication_policy.arn
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_replication" {
  depends_on = [
    aws_s3_bucket_versioning.primary_versioning,
    aws_s3_bucket_versioning.replication_destination_versioning
  ]

  role   = aws_iam_role.replication_role.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate_all_objects"
    status = "Enabled"

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    destination {
      bucket        = aws_s3_bucket.replication_destination.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = "arn:${local.partition}:kms:us-west-2:${local.account_id}:alias/aws/s3"
      }
    }
  }
}

# IAM Policy for MFA-enforced S3 Access
resource "aws_iam_policy" "mfa_s3_access_policy" {
  name        = "data-secured-${local.account_id}-mfa-access-policy-${local.unique_suffix}"
  description = "Policy requiring MFA for S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowListS3BucketWithMFA"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.primary.arn
        ]
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      },
      {
        Sid    = "AllowS3ObjectAccessWithMFA"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      },
      {
        Sid    = "DenyS3AccessWithoutMFA"
        Effect = "Deny"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "data-secured-${local.account_id}-mfa-access-policy-${local.unique_suffix}"
    Purpose = "MFA Enforcement for S3 Access"
  })
}

# S3 Bucket Policy for Additional Security
resource "aws_s3_bucket_policy" "primary_bucket_policy" {
  bucket = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "RequireSSEKMS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowReplicationRole"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication_role.arn
        }
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging",
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
      }
    ]
  })

  depends_on = [aws_iam_role.replication_role]
}

# Outputs
output "source_bucket_name" {
  description = "Name of the primary secure S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "destination_bucket_name" {
  description = "Name of the replication destination bucket in us-west-2"
  value       = aws_s3_bucket.replication_destination.bucket
}

output "logging_bucket_name" {
  description = "Name of the access logging bucket"
  value       = aws_s3_bucket.access_logging.bucket
}

output "mfa_policy_arn" {
  description = "ARN of the MFA enforcement policy"
  value       = aws_iam_policy.mfa_s3_access_policy.arn
}

output "replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication_role.arn
}

output "aws_region" {
  description = "AWS region where primary resources are deployed"
  value       = local.region
}