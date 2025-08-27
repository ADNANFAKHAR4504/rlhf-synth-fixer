# Variables
variable "cloudtrail_name" {
  description = "Name of the CloudTrail"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "cloudtrail_kms_key_arn" {
  description = "ARN of the KMS key for CloudTrail encryption"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = var.cloudtrail_name
  s3_bucket_name = var.s3_bucket_name

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  kms_key_id                    = var.cloudtrail_kms_key_arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  tags = merge(var.common_tags, {
    Name = var.cloudtrail_name
  })
}

# Outputs
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main.home_region
}
