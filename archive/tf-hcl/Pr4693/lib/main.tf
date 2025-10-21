# main.tf - Core infrastructure setup and resource orchestration

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for Lambda deployment packages
resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.environment_suffix}-lambda-deployments-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-deployments"
    }
  )
}

# Enable versioning for Lambda deployment bucket
resource "aws_s3_bucket_versioning" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for Lambda deployment bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to Lambda deployment bucket
resource "aws_s3_bucket_public_access_block" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Package Lambda function from lambda folder
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_deployment.zip"
}

# Upload Lambda package to S3
resource "aws_s3_object" "lambda_package" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "lambda/${var.environment_suffix}/lambda_deployment_${data.archive_file.lambda_package.output_base64sha256}.zip"
  source = data.archive_file.lambda_package.output_path
  etag   = filemd5(data.archive_file.lambda_package.output_path)

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-package"
    }
  )
}