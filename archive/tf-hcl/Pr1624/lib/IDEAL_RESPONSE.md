# =============================================================================
# VARIABLES
# =============================================================================

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "secure-tap-stack"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "sensitive_bucket_names" {
  description = "List of sensitive S3 bucket names to create"
  type        = list(string)
  default     = ["sensitive-data-primary", "sensitive-data-backup"]
}

variable "authorized_user_names" {
  description = "List of IAM user names that will have access to sensitive buckets"
  type        = list(string)
  default     = ["data-analyst", "security-admin"]
}

variable "authorized_role_names" {
  description = "List of IAM role names that will have access to sensitive buckets"
  type        = list(string)
  default     = ["data-processing-role", "backup-service-role"]
}

variable "terraform_state_bucket_suffix" {
  description = "Suffix for the Terraform state bucket name"
  type        = string
  default     = "terraform-state"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "secure-tap-stack"
    Environment = "dev"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Generate random suffix for globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# =============================================================================
# IAM USERS FOR SENSITIVE BUCKET ACCESS
# =============================================================================

# Create IAM users that will have access to sensitive buckets
resource "aws_iam_user" "authorized_users" {
  count = length(var.authorized_user_names)
  name  = "${var.project_name}-${var.authorized_user_names[count.index]}"
  path  = "/"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.authorized_user_names[count.index]}"
    Type = "authorized-user"
  })
}

# Create access keys for the users (in production, consider using temporary credentials)
resource "aws_iam_access_key" "authorized_users_keys" {
  count = length(aws_iam_user.authorized_users)
  user  = aws_iam_user.authorized_users[count.index].name
}

# =============================================================================
# IAM ROLES FOR SENSITIVE BUCKET ACCESS
# =============================================================================

# Trust policy for the roles (allows EC2 instances to assume these roles)
data "aws_iam_policy_document" "role_trust_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Create IAM roles that will have access to sensitive buckets
resource "aws_iam_role" "authorized_roles" {
  count              = length(var.authorized_role_names)
  name               = "${var.project_name}-${var.authorized_role_names[count.index]}"
  assume_role_policy = data.aws_iam_policy_document.role_trust_policy.json

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.authorized_role_names[count.index]}"
    Type = "authorized-role"
  })
}

# Create instance profiles for the roles
resource "aws_iam_instance_profile" "authorized_roles_profiles" {
  count = length(aws_iam_role.authorized_roles)
  name  = "${aws_iam_role.authorized_roles[count.index].name}-profile"
  role  = aws_iam_role.authorized_roles[count.index].name
}

# =============================================================================
# TERRAFORM STATE MANAGEMENT RESOURCES
# =============================================================================

# S3 bucket for Terraform state storage
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-${var.terraform_state_bucket_suffix}-${random_id.bucket_suffix.hex}"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.terraform_state_bucket_suffix}"
    Purpose     = "terraform-state"
    Sensitivity = "high"
  })
}

# Enable versioning on the state bucket
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for the state bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block all public access to the state bucket
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for Terraform state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "${var.project_name}-terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-terraform-state-lock"
    Purpose = "terraform-state-locking"
  })
}

# =============================================================================
# SENSITIVE DATA S3 BUCKETS
# =============================================================================

# Create sensitive data buckets
resource "aws_s3_bucket" "sensitive_buckets" {
  count  = length(var.sensitive_bucket_names)
  bucket = "${var.project_name}-${var.sensitive_bucket_names[count.index]}-${random_id.bucket_suffix.hex}"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.sensitive_bucket_names[count.index]}"
    Purpose     = "sensitive-data-storage"
    Sensitivity = "high"
  })
}

# Enable versioning on sensitive buckets
resource "aws_s3_bucket_versioning" "sensitive_buckets" {
  count  = length(aws_s3_bucket.sensitive_buckets)
  bucket = aws_s3_bucket.sensitive_buckets[count.index].id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for sensitive buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_buckets" {
  count  = length(aws_s3_bucket.sensitive_buckets)
  bucket = aws_s3_bucket.sensitive_buckets[count.index].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block all public access to sensitive buckets
resource "aws_s3_bucket_public_access_block" "sensitive_buckets" {
  count  = length(aws_s3_bucket.sensitive_buckets)
  bucket = aws_s3_bucket.sensitive_buckets[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# IAM POLICIES FOR LEAST PRIVILEGE ACCESS
# =============================================================================

# Policy document for sensitive bucket access (least privilege)
data "aws_iam_policy_document" "sensitive_bucket_access" {
  # Allow listing of buckets (required for S3 operations)
  statement {
    sid    = "AllowListBuckets"
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [for bucket in aws_s3_bucket.sensitive_buckets : bucket.arn]
    
    # Restrict to specific IP ranges or VPC endpoints if needed
    condition {
      test     = "StringEquals"
      variable = "s3:ExistingObjectTag/Sensitivity"
      values   = ["high"]
    }
  }

  # Allow object operations on sensitive buckets
  statement {
    sid    = "AllowObjectOperations"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:DeleteObject",
      "s3:DeleteObjectVersion"
    ]
    resources = [for bucket in aws_s3_bucket.sensitive_buckets : "${bucket.arn}/*"]
  }

  # Deny all other S3 operations
  statement {
    sid    = "DenyAllOtherS3Operations"
    effect = "Deny"
    not_actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:DeleteObject",
      "s3:DeleteObjectVersion"
    ]
    resources = [
      for bucket in aws_s3_bucket.sensitive_buckets : [
        bucket.arn,
        "${bucket.arn}/*"
      ]
    ]
  }
}

# Create IAM policy for sensitive bucket access
resource "aws_iam_policy" "sensitive_bucket_access" {
  name        = "${var.project_name}-sensitive-bucket-access"
  description = "Least privilege policy for accessing sensitive S3 buckets"
  policy      = data.aws_iam_policy_document.sensitive_bucket_access.json

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-sensitive-bucket-access"
    Type = "least-privilege-policy"
  })
}

# Attach policy to authorized users
resource "aws_iam_user_policy_attachment" "sensitive_bucket_access_users" {
  count      = length(aws_iam_user.authorized_users)
  user       = aws_iam_user.authorized_users[count.index].name
  policy_arn = aws_iam_policy.sensitive_bucket_access.arn
}

# Attach policy to authorized roles
resource "aws_iam_role_policy_attachment" "sensitive_bucket_access_roles" {
  count      = length(aws_iam_role.authorized_roles)
  role       = aws_iam_role.authorized_roles[count.index].name
  policy_arn = aws_iam_policy.sensitive_bucket_access.arn
}

# =============================================================================
# S3 BUCKET POLICIES FOR ADDITIONAL SECURITY
# =============================================================================

# Bucket policy for sensitive buckets - deny all except authorized principals
data "aws_iam_policy_document" "sensitive_bucket_policy" {
  count = length(aws_s3_bucket.sensitive_buckets)

  # Deny all access except to authorized users and roles
  statement {
    sid       = "DenyAllExceptAuthorizedPrincipals"
    effect    = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [
      aws_s3_bucket.sensitive_buckets[count.index].arn,
      "${aws_s3_bucket.sensitive_buckets[count.index].arn}/*"
    ]

    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalArn"
      values = concat(
        [for user in aws_iam_user.authorized_users : user.arn],
        [for role in aws_iam_role.authorized_roles : role.arn],
        ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"] # Allow root for emergency access
      )
    }
  }

  # Enforce SSL/TLS for all requests
  statement {
    sid       = "DenyInsecureConnections"
    effect    = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [
      aws_s3_bucket.sensitive_buckets[count.index].arn,
      "${aws_s3_bucket.sensitive_buckets[count.index].arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# Apply bucket policies to sensitive buckets
resource "aws_s3_bucket_policy" "sensitive_buckets" {
  count  = length(aws_s3_bucket.sensitive_buckets)
  bucket = aws_s3_bucket.sensitive_buckets[count.index].id
  policy = data.aws_iam_policy_document.sensitive_bucket_policy[count.index].json
}

# Bucket policy for Terraform state bucket
data "aws_iam_policy_document" "terraform_state_bucket_policy" {
  # Deny all access except to the current AWS account
  statement {
    sid       = "DenyAllExceptAccountRoot"
    effect    = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*"
    ]

    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  # Enforce SSL/TLS for all requests
  statement {
    sid       = "DenyInsecureConnections"
    effect    = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# Apply bucket policy to Terraform state bucket
resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  policy = data.aws_iam_policy_document.terraform_state_bucket_policy.json
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "terraform_state_bucket" {
  description = "Terraform state S3 bucket details"
  value = {
    id          = aws_s3_bucket.terraform_state.id
    arn         = aws_s3_bucket.terraform_state.arn
    domain_name = aws_s3_bucket.terraform_state.bucket_domain_name
  }
}

output "terraform_state_dynamodb_table" {
  description = "Terraform state DynamoDB table details"
  value = {
    name = aws_dynamodb_table.terraform_state_lock.name
    arn  = aws_dynamodb_table.terraform_state_lock.arn
  }
}

output "sensitive_buckets" {
  description = "Sensitive S3 buckets details"
  value = {
    for idx, bucket in aws_s3_bucket.sensitive_buckets : var.sensitive_bucket_names[idx] => {
      id          = bucket.id
      arn         = bucket.arn
      domain_name = bucket.bucket_domain_name
    }
  }
}

output "authorized_users" {
  description = "Authorized IAM users details"
  value = {
    for idx, user in aws_iam_user.authorized_users : var.authorized_user_names[idx] => {
      name = user.name
      arn  = user.arn
    }
  }
}

output "authorized_users_access_keys" {
  description = "Access keys for authorized users (sensitive)"
  value = {
    for idx, key in aws_iam_access_key.authorized_users_keys : var.authorized_user_names[idx] => {
      access_key_id = key.id
      secret_access_key = key.secret
    }
  }
  sensitive = true
}

output "authorized_roles" {
  description = "Authorized IAM roles details"
  value = {
    for idx, role in aws_iam_role.authorized_roles : var.authorized_role_names[idx] => {
      name = role.name
      arn  = role.arn
    }
  }
}

output "iam_policy" {
  description = "IAM policy for sensitive bucket access"
  value = {
    name = aws_iam_policy.sensitive_bucket_access.name
    arn  = aws_iam_policy.sensitive_bucket_access.arn
  }
}

output "backend_configuration" {
  description = "Backend configuration for this Terraform stack"
  value = {
    bucket         = aws_s3_bucket.terraform_state.id
    key            = "terraform.tfstate"
    region         = data.aws_region.current.name
    dynamodb_table = aws_dynamodb_table.terraform_state_lock.name
    encrypt        = true
  }
}

# Example of how to configure the backend (add this to your backend configuration)
output "backend_config_example" {
  description = "Example backend configuration block"
  value = <<-EOT
    terraform {
      backend "s3" {
        bucket         = "${aws_s3_bucket.terraform_state.id}"
        key            = "terraform.tfstate"
        region         = "${data.aws_region.current.name}"
        dynamodb_table = "${aws_dynamodb_table.terraform_state_lock.name}"
        encrypt        = true
      }
    }
  EOT
}