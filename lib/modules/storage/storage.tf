resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}


resource "random_pet" "suffix" {
  length = 2
}

resource "aws_s3_bucket" "data" {
  bucket = "${lower(substr(var.project_name, 0, 20))}-data-bucket-${random_pet.suffix.id}"

  tags = {
    Name        = "${var.project_name}-data-bucket"
    Project     = var.project_name
    Environment = var.environment
  }
}

output "s3_logs_bucket_name" {
  description = "The name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.bucket
}

resource "aws_s3_bucket" "logs" {
  bucket = "${lower(substr(var.project_name, 0, 20))}-logs-bucket-${random_pet.suffix.id}"

  tags = {
    Name        = "${var.project_name}-logs-bucket"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = data.aws_iam_policy_document.s3_data.json
}

data "aws_iam_policy_document" "s3_data" {
  statement {
    sid = "AllowAllS3ActionsForCiUser"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/iac-rlhf-github"]
    }
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
  }
}

data "aws_caller_identity" "current" {}

resource "aws_vpc_endpoint" "s3" {
  vpc_id          = var.vpc_id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = var.private_route_table_ids

  tags = {
    Name        = "${var.project_name}-s3-vpc-endpoint"
    Project     = var.project_name
    Environment = var.environment
  }
}
