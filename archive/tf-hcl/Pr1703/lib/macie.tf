# Enable Macie
resource "aws_macie2_account" "main" {}

# Macie classification job for S3 buckets
resource "aws_macie2_classification_job" "s3_classification" {
  count               = length(aws_s3_bucket.secure_buckets)
  job_type            = "SCHEDULED"
  name                = "${var.application_name}-macie-job-${var.bucket_names[count.index]}-${var.environment}-${var.environment_suffix}"
  description         = "Macie classification job for ${aws_s3_bucket.secure_buckets[count.index].id}"
  initial_run         = true
  sampling_percentage = 100

  schedule_frequency {
    daily_schedule = true
  }

  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [aws_s3_bucket.secure_buckets[count.index].id]
    }
  }

  depends_on = [aws_macie2_account.main]

  tags = {
    Name        = "${var.application_name}-macie-job-${var.bucket_names[count.index]}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}