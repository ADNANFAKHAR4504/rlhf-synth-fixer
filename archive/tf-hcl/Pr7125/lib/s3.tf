resource "aws_s3_bucket" "reconciliation_data" {
  bucket = "reconciliation-data-${var.environment_suffix}"

  tags = {
    Name = "reconciliation-data-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "reconciliation_data" {
  bucket = aws_s3_bucket.reconciliation_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "reconciliation_data" {
  bucket = aws_s3_bucket.reconciliation_data.id

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_notification" "reconciliation_trigger" {
  bucket = aws_s3_bucket.reconciliation_data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.trigger_reconciliation.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".csv"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
