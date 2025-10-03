### Reasoning Trace
---

Alright, I'm being asked to create a comprehensive Terraform script named `tap_stack.tf` for a legal firm's storage system. Let me break down the requirements:

1. **S3 Bucket** for document storage with:
   - Versioning enabled
   - 90-day retention policy via lifecycle rules
   - KMS encryption at rest
   - TLS-only access (encryption in transit)

2. **IAM Policies & Roles** following the principle of least privilege

3. **CloudTrail** for access logging 

4. **CloudWatch Monitoring** with metrics and alarms

5. **Security & Compliance** measures including encryption and auditing

6. **Resource Tagging** with Environment, Owner, and Project

Additionally, the script should reference an existing variable `aws_region` from an external provider file.

Let me start building this Terraform script:

1. First, I'll declare the variables
2. Then I'll set up the KMS key for encryption
3. Next, I'll create the S3 buckets (one for documents, one for logs)
4. I'll configure IAM roles and policies
5. Set up CloudTrail
6. Configure CloudWatch metrics and alarms
7. Add outputs for reference

Here's the complete Terraform script:

```terraform
# Variables
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Legal Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Document Management System"
}

variable "document_retention_days" {
  description = "Number of days to retain documents"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 365 # Longer retention for logs to meet compliance requirements
}

# Reference to existing aws_region variable from provider.tf
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
}

# Random suffix for globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# KMS Key for S3 bucket encryption
resource "aws_kms_key" "document_key" {
  description             = "KMS key for document encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "document_key_alias" {
  name          = "alias/legal-documents-key"
  target_key_id = aws_kms_key.document_key.key_id
}

# KMS Key for CloudTrail logs encryption
resource "aws_kms_key" "cloudtrail_key" {
  description             = "KMS key for CloudTrail logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudTrail to encrypt logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey*",
        "kms:Decrypt"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "cloudtrail_key_alias" {
  name          = "alias/legal-cloudtrail-key"
  target_key_id = aws_kms_key.cloudtrail_key.key_id
}

# Get the current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Bucket for document storage
resource "aws_s3_bucket" "document_bucket" {
  bucket = "legal-documents-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Bucket versioning
resource "aws_s3_bucket_versioning" "document_versioning" {
  bucket = aws_s3_bucket.document_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "document_encryption" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for 90-day retention
resource "aws_s3_bucket_lifecycle_configuration" "document_lifecycle" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    id     = "90-day-retention"
    status = "Enabled"

    expiration {
      days = var.document_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days
    }
  }
}

# S3 bucket policy to enforce TLS
resource "aws_s3_bucket_policy" "document_bucket_policy" {
  bucket = aws_s3_bucket.document_bucket.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
POLICY
}

# Block public access
resource "aws_s3_bucket_public_access_block" "document_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.document_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for access logs
resource "aws_s3_bucket" "log_bucket" {
  bucket = "legal-logs-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Server-side encryption for log bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for log retention
resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

# Block public access for log bucket
resource "aws_s3_bucket_public_access_block" "log_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable bucket logging for document bucket
resource "aws_s3_bucket_logging" "document_bucket_logging" {
  bucket        = aws_s3_bucket.document_bucket.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "s3-access-logs/"
}

# CloudTrail for auditing
resource "aws_cloudtrail" "legal_trail" {
  name                          = "legal-documents-trail"
  s3_bucket_name                = aws_s3_bucket.log_bucket.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail_key.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.document_bucket.arn}/"]
    }
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM policy for S3 read access
resource "aws_iam_policy" "s3_read_policy" {
  name        = "LegalDocumentReadPolicy"
  description = "Policy for read-only access to legal documents S3 bucket"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# IAM policy for S3 write access
resource "aws_iam_policy" "s3_write_policy" {
  name        = "LegalDocumentWritePolicy"
  description = "Policy for write access to legal documents S3 bucket"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:PutObjectVersionAcl",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# IAM role for read-only access
resource "aws_iam_role" "document_reader_role" {
  name = "LegalDocumentReaderRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM role for write access
resource "aws_iam_role" "document_writer_role" {
  name = "LegalDocumentWriterRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Attach read policy to reader role
resource "aws_iam_role_policy_attachment" "reader_policy_attach" {
  role       = aws_iam_role.document_reader_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# Attach write policy to writer role
resource "aws_iam_role_policy_attachment" "writer_policy_attach" {
  role       = aws_iam_role.document_writer_role.name
  policy_arn = aws_iam_policy.s3_write_policy.arn
}

# CloudWatch Metrics for S3 bucket
resource "aws_cloudwatch_metric_alarm" "s3_error_alarm" {
  alarm_name          = "S3LegalDocumentsErrorAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors S3 errors for the legal documents bucket"
  alarm_actions       = [] # Add SNS topic ARN here if needed
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Alarm for unusual access patterns (example: high number of delete operations)
resource "aws_cloudwatch_metric_alarm" "s3_delete_alarm" {
  alarm_name          = "S3LegalDocumentsDeleteAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeleteObject"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 50 # Adjust based on expected delete patterns
  alarm_description   = "This alarm detects unusually high number of delete operations"
  alarm_actions       = [] # Add SNS topic ARN here if needed
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Outputs
output "document_bucket_name" {
  description = "Name of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.id
}

output "document_bucket_arn" {
  description = "ARN of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.arn
}

output "log_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.log_bucket.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for document encryption"
  value       = aws_kms_key.document_key.key_id
}

output "reader_role_arn" {
  description = "ARN of the IAM role for read-only access"
  value       = aws_iam_role.document_reader_role.arn
}

output "writer_role_arn" {
  description = "ARN of the IAM role for write access"
  value       = aws_iam_role.document_writer_role.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.legal_trail.name
}
```

Wait, I think I'm missing a policy to allow the CloudTrail to write to the S3 log bucket. Let me add that:

```terraform
# S3 bucket policy to allow CloudTrail to write to the log bucket
resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.log_bucket.id
  
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.log_bucket.arn}",
        "${aws_s3_bucket.log_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/cloudtrail/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }
  ]
}
POLICY
}
```

I also need to allow S3 logging service to write to the log bucket:

```terraform
# Add permission for S3 log delivery to write to log bucket
resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.log_bucket.id
  
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.log_bucket.arn}",
        "${aws_s3_bucket.log_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/cloudtrail/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/s3-access-logs/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    }
  ]
}
POLICY
}
```

Let me combine all these changes and create the final version of the terraform file:

```terraform
# Variables
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Legal Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Document Management System"
}

variable "document_retention_days" {
  description = "Number of days to retain documents"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 365 # Longer retention for logs to meet compliance requirements
}

# Reference to existing aws_region variable from provider.tf
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
}

# Random suffix for globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Get the current AWS account ID
data "aws_caller_identity" "current" {}

# KMS Key for S3 bucket encryption
resource "aws_kms_key" "document_key" {
  description             = "KMS key for document encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "document_key_alias" {
  name          = "alias/legal-documents-key"
  target_key_id = aws_kms_key.document_key.key_id
}

# KMS Key for CloudTrail logs encryption
resource "aws_kms_key" "cloudtrail_key" {
  description             = "KMS key for CloudTrail logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudTrail to encrypt logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey*",
        "kms:Decrypt"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "cloudtrail_key_alias" {
  name          = "alias/legal-cloudtrail-key"
  target_key_id = aws_kms_key.cloudtrail_key.key_id
}

# S3 Bucket for document storage
resource "aws_s3_bucket" "document_bucket" {
  bucket = "legal-documents-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"
  
  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Bucket versioning
resource "aws_s3_bucket_versioning" "document_versioning" {
  bucket = aws_s3_bucket.document_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "document_encryption" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for 90-day retention
resource "aws_s3_bucket_lifecycle_configuration" "document_lifecycle" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    id     = "90-day-retention"
    status = "Enabled"

    expiration {
      days = var.document_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days
    }
  }
}

# S3 bucket policy to enforce TLS
resource "aws_s3_bucket_policy" "document_bucket_policy" {
  bucket = aws_s3_bucket.document_bucket.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
POLICY
}

# Block public access
resource "aws_s3_bucket_public_access_block" "document_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.document_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for access logs
resource "aws_s3_bucket" "log_bucket" {
  bucket = "legal-logs-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Server-side encryption for log bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for log retention
resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

# Block public access for log bucket
resource "aws_s3_bucket_public_access_block" "log_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy to allow CloudTrail and S3 access logging to write to the log bucket
resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.log_bucket.id
  
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.log_bucket.arn}",
        "${aws_s3_bucket.log_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/cloudtrail/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/s3-access-logs/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    }
  ]
}
POLICY
}

# Enable bucket logging for document bucket
resource "aws_s3_bucket_logging" "document_bucket_logging" {
  bucket        = aws_s3_bucket.document_bucket.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "s3-access-logs/"
}

# CloudTrail for auditing
resource "aws_cloudtrail" "legal_trail" {
  name                          = "legal-documents-trail"
  s3_bucket_name                = aws_s3_bucket.log_bucket.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail_key.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.document_bucket.arn}/"]
    }
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM policy for S3 read access
resource "aws_iam_policy" "s3_read_policy" {
  name        = "LegalDocumentReadPolicy"
  description = "Policy for read-only access to legal documents S3 bucket"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# IAM policy for S3 write access
resource "aws_iam_policy" "s3_write_policy" {
  name        = "LegalDocumentWritePolicy"
  description = "Policy for write access to legal documents S3 bucket"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:PutObjectVersionAcl",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# IAM role for read-only access
resource "aws_iam_role" "document_reader_role" {
  name = "LegalDocumentReaderRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM role for write access
resource "aws_iam_role" "document_writer_role" {
  name = "LegalDocumentWriterRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Attach read policy to reader role
resource "aws_iam_role_policy_attachment" "reader_policy_attach" {
  role       = aws_iam_role.document_reader_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# Attach write policy to writer role
resource "aws_iam_role_policy_attachment" "writer_policy_attach" {
  role       = aws_iam_role.document_writer_role.name
  policy_arn = aws_iam_policy.s3_write_policy.arn
}

# CloudWatch Metrics for S3 bucket
resource "aws_cloudwatch_metric_alarm" "s3_error_alarm" {
  alarm_name          = "S3LegalDocumentsErrorAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors S3 errors for the legal documents bucket"
  alarm_actions       = [] # Add SNS topic ARN here if needed
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Alarm for unusual access patterns (example: high number of delete operations)
resource "aws_cloudwatch_metric_alarm" "s3_delete_alarm" {
  alarm_name          = "S3LegalDocumentsDeleteAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeleteObject"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 50 # Adjust based on expected delete patterns
  alarm_description   = "This alarm detects unusually high number of delete operations"
  alarm_actions       = [] # Add SNS topic ARN here if needed
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Outputs
output "document_bucket_name" {
  description = "Name of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.id
}

output "document_bucket_arn" {
  description = "ARN of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.arn
}

output "log_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.log_bucket.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for document encryption"
  value       = aws_kms_key.document_key.key_id
}

output "reader_role_arn" {
  description = "ARN of the IAM role for read-only access"
  value       = aws_iam_role.document_reader_role.arn
}

output "writer_role_arn" {
  description = "ARN of the IAM role for write access"
  value       = aws_iam_role.document_writer_role.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.legal_trail.name
}
```

Let's review the final script to make sure it meets all requirements:

1. **S3 Bucket for Document Storage**
   - Created with versioning enabled
   - 90-day retention policy via lifecycle rules
   - KMS encryption at rest
   - TLS-only access enforced through bucket policy
   - Blocked public access

2. **IAM Policies & Roles**
   - Created separate read and write policies following least privilege
   - Created reader and writer roles

3. **CloudTrail**
   - Set up CloudTrail to monitor all S3 operations
   - Logs stored in a separate, encrypted bucket

4. **CloudWatch Monitoring**
   - Added metrics and alarms for monitoring errors and unusual activity

5. **Security & Compliance**
   - All data encrypted in transit (TLS enforcement) and at rest (KMS)
   - Logging and auditing configuration
   - Public access blocked

6. **Tagging**
   - All resources tagged with Environment, Owner, and Project

7. **Lifecycle Rules for Retention**
   - 90-day retention for documents
   - Longer retention for audit logs

8. **Access Logging**
   - S3 access logs enabled and stored in a dedicated bucket

The script includes all variables, resource definitions, and outputs as required, and should be fully deployable. It uses the aws_region variable from the provider.tf file as specified in the requirements.

This solution should provide a secure, compliant, and auditable storage system for the legal firm's documents.
### Answer 
---

# Legal Firm Document Storage System - Terraform Script

Below is a complete, deployable Terraform script that implements a secure and compliant storage solution for a legal firm. This solution includes S3 storage with versioning, encryption, access controls, and comprehensive audit capabilities.

```terraform
# tap_stack.tf

# -----------------------------------------------------
# Variables
# -----------------------------------------------------

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Legal Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Legal Document Management"
}

variable "document_retention_days" {
  description = "Number of days to retain documents"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 730 # 2 years for compliance
}

# Reference to existing aws_region variable from provider.tf
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
}

# -----------------------------------------------------
# Data Sources & Local Values
# -----------------------------------------------------

data "aws_caller_identity" "current" {}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

locals {
  account_id    = data.aws_caller_identity.current.account_id
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------
# KMS Keys for Encryption
# -----------------------------------------------------

# KMS Key for document encryption
resource "aws_kms_key" "document_key" {
  description             = "KMS key for legal document encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "document_key_alias" {
  name          = "alias/legal-documents-key"
  target_key_id = aws_kms_key.document_key.key_id
}

# KMS Key for CloudTrail logs encryption
resource "aws_kms_key" "cloudtrail_key" {
  description             = "KMS key for CloudTrail logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${local.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudTrail to encrypt logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey*",
        "kms:Decrypt"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  tags = local.common_tags
}

resource "aws_kms_alias" "cloudtrail_key_alias" {
  name          = "alias/legal-cloudtrail-key"
  target_key_id = aws_kms_key.cloudtrail_key.key_id
}

# -----------------------------------------------------
# Document Storage Bucket
# -----------------------------------------------------

resource "aws_s3_bucket" "document_bucket" {
  bucket = "legal-documents-${local.account_id}-${random_id.bucket_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "document_versioning" {
  bucket = aws_s3_bucket.document_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "document_encryption" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "document_lifecycle" {
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    id     = "90-day-retention"
    status = "Enabled"

    expiration {
      days = var.document_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "document_bucket_block_public_access" {
  bucket                  = aws_s3_bucket.document_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------
# Log Bucket for Access Logs and CloudTrail
# -----------------------------------------------------

resource "aws_s3_bucket" "log_bucket" {
  bucket = "legal-logs-${local.account_id}-${random_id.bucket_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "log_versioning" {
  bucket = aws_s3_bucket.log_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_bucket_block_public_access" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------
# Bucket Policies
# -----------------------------------------------------

# Document bucket policy (enforce TLS)
resource "aws_s3_bucket_policy" "document_bucket_policy" {
  bucket = aws_s3_bucket.document_bucket.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
POLICY
}

# Log bucket policy (allow CloudTrail and S3 logging)
resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.log_bucket.id
  
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "${aws_s3_bucket.log_bucket.arn}",
        "${aws_s3_bucket.log_bucket.arn}/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/cloudtrail/AWSLogs/${local.account_id}/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "${aws_s3_bucket.log_bucket.arn}/s3-access-logs/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "S3LogDeliveryAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "${aws_s3_bucket.log_bucket.arn}"
    }
  ]
}
POLICY
}

# Enable access logging for document bucket
resource "aws_s3_bucket_logging" "document_bucket_logging" {
  bucket        = aws_s3_bucket.document_bucket.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "s3-access-logs/"
}

# -----------------------------------------------------
# CloudTrail Configuration
# -----------------------------------------------------

resource "aws_cloudtrail" "legal_document_trail" {
  name                          = "legal-document-trail"
  s3_bucket_name                = aws_s3_bucket.log_bucket.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail_key.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.document_bucket.arn}/"]
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------
# IAM Policies & Roles
# -----------------------------------------------------

# Read-only policy
resource "aws_iam_policy" "document_read_policy" {
  name        = "LegalDocumentReadPolicy"
  description = "Policy for read-only access to legal documents"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# Write policy
resource "aws_iam_policy" "document_write_policy" {
  name        = "LegalDocumentWritePolicy"
  description = "Policy for write access to legal documents"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:PutObjectVersionAcl",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.document_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "${aws_kms_key.document_key.arn}"
    }
  ]
}
EOF
}

# Reader role
resource "aws_iam_role" "document_reader_role" {
  name = "LegalDocumentReaderRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = local.common_tags
}

# Writer role
resource "aws_iam_role" "document_writer_role" {
  name = "LegalDocumentWriterRole"
  
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = local.common_tags
}

# Attach policies to roles
resource "aws_iam_role_policy_attachment" "reader_policy_attachment" {
  role       = aws_iam_role.document_reader_role.name
  policy_arn = aws_iam_policy.document_read_policy.arn
}

resource "aws_iam_role_policy_attachment" "writer_policy_attachment" {
  role       = aws_iam_role.document_writer_role.name
  policy_arn = aws_iam_policy.document_write_policy.arn
}

# -----------------------------------------------------
# CloudWatch Monitoring
# -----------------------------------------------------

# Alarm for high error rates
resource "aws_cloudwatch_metric_alarm" "s3_error_alarm" {
  alarm_name          = "S3LegalDocumentsErrorAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alarm when S3 bucket has more than 10 4xx errors in 5 minutes"
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = local.common_tags
}

# Alarm for unusual delete operations
resource "aws_cloudwatch_metric_alarm" "s3_delete_alarm" {
  alarm_name          = "S3LegalDocumentsDeleteAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeleteObject"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Alarm when more than 50 delete operations occur in 5 minutes"
  
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------
# Outputs
# -----------------------------------------------------

output "document_bucket_name" {
  description = "Name of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.id
}

output "log_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.log_bucket.id
}

output "document_kms_key_id" {
  description = "ID of the KMS key used for document encryption"
  value       = aws_kms_key.document_key.key_id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.legal_document_trail.name
}

output "document_reader_role_arn" {
  description = "ARN of the IAM role for read-only access"
  value       = aws_iam_role.document_reader_role.arn
}

output "document_writer_role_arn" {
  description = "ARN of the IAM role for write access"
  value       = aws_iam_role.document_writer_role.arn
}
```

## Architecture Overview

This Terraform script creates a secure storage solution with the following components:

### 1. S3 Storage

- **Document Bucket**: Primary storage for legal documents with:
  - Versioning enabled for document history tracking
  - 90-day retention policy via lifecycle rules
  - KMS encryption for all objects at rest
  - TLS-only access enforcement
  - Public access completely blocked
  - Access logging enabled

- **Log Bucket**: Secure storage for audit logs with:
  - Longer retention period (2 years)
  - Encryption with dedicated KMS key
  - Permissions for CloudTrail and S3 logging services

### 2. Security & Encryption

- **KMS Keys**: Separate keys for document encryption and log encryption
- **TLS Enforcement**: All data transfers must use HTTPS
- **Access Control**: No public access permitted to any resource
- **Least Privilege**: IAM roles and policies that grant minimal necessary permissions

### 3. Audit & Monitoring

- **CloudTrail**: Records all API calls related to the document bucket
- **Access Logs**: S3 access logging enabled for the document bucket
- **CloudWatch Alarms**: Monitoring for unusual patterns:
  - High error rates (4xx errors)
  - Unusual number of delete operations

### 4. IAM Access Control

- **Reader Role**: Read-only access to documents
- **Writer Role**: Write access to documents
- **Policies**: Separate policies for read and write operations

This architecture ensures the legal firm can securely store and manage their 10,000 daily documents while meeting compliance and audit requirements.