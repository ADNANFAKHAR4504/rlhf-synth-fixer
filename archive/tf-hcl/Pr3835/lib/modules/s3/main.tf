# S3 Module - Storage Infrastructure

resource "aws_s3_bucket" "primary_data" {
  bucket = "${var.primary_bucket_name}rlhf"

  tags = merge(
    var.tags,
    {
      Name   = "${var.name_prefix}-data-primary"
      Region = var.region
    }
  )
}

resource "aws_s3_bucket_versioning" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_data" {
  bucket = aws_s3_bucket.primary_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_data" {
  count  = var.enable_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.primary_data.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = var.transition_to_ia_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.transition_to_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.expiration_days
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }
  }
}

resource "aws_s3_bucket" "cloudformation_templates" {
  bucket = "${var.cfn_bucket_name}rlhf"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cfn-templates"
    }
  )
}

resource "aws_s3_bucket_versioning" "cloudformation_templates" {
  bucket = aws_s3_bucket.cloudformation_templates.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudformation_templates" {
  bucket = aws_s3_bucket.cloudformation_templates.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudformation_templates" {
  bucket = aws_s3_bucket.cloudformation_templates.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

