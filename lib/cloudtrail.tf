########################
# CloudTrail (API Auditing)
########################

resource "aws_cloudtrail" "main" {
  name                          = "${var.name_prefix}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.this.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  cloud_watch_logs_group_arn    = aws_cloudwatch_log_group.cloudtrail.arn
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_logs.arn
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-cloudtrail"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.name_prefix}-${var.environment}"
  retention_in_days = 90
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_iam_role" "cloudtrail_logs" {
  name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-role"
  }
}

resource "aws_iam_role_policy" "cloudtrail_logs" {
  name = "${var.name_prefix}-${var.environment}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = aws_cloudwatch_log_group.cloudtrail.arn
      }
    ]
  })
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.main.arn
}
