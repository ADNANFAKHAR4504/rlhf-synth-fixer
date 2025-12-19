# Data sources to import existing infrastructure state (Requirement 8)

data "aws_caller_identity" "current" {
  provider = aws.source
}

data "aws_region" "source" {
  provider = aws.source
}

data "aws_region" "target" {
  provider = aws.target
}

# Data source to check for existing S3 bucket in source region
data "aws_s3_bucket" "existing_source" {
  provider = aws.source
  bucket   = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"

  # This will fail if bucket doesn't exist, which is expected for new deployments
  depends_on = []
}

# Data source to check for existing DynamoDB table in source region
data "aws_dynamodb_table" "existing_metadata" {
  provider = aws.source
  name     = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"

  # This will fail if table doesn't exist, which is expected for new deployments
  depends_on = []
}
