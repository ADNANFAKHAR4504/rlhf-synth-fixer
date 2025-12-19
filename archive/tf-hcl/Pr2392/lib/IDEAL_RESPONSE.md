```hcl
# main.tf
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "web-app-vpc-274802" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "main-igw-274802" }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "public-subnet-274802" }
}

resource "aws_subnet" "public_secondary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  tags = { Name = "public-subnet-secondary-274802" }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "main-rt-274802" }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "public_secondary" {
  subnet_id      = aws_subnet.public_secondary.id
  route_table_id = aws_route_table.main.id
}

# Security group for HTTPS only as specified in prompt
resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "web-sg-274802" }
}

resource "aws_kms_key" "s3" {
  description = "S3 encryption key"
  tags = { Name = "s3-kms-key-274802" }
}

resource "aws_s3_bucket" "app" {
  bucket = "webapp-bucket-274802"
  tags = { Name = "webapp-s3-274802" }
}

resource "aws_s3_bucket_acl" "app" {
  bucket = aws_s3_bucket.app.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.app.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.app.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-274802"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "s3_read" {
  name = "s3-read-policy-274802"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = ["s3:GetObject", "s3:GetObjectVersion"]
      Resource = "${aws_s3_bucket.app.arn}/*"
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_read" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.s3_read.arn
}

resource "aws_cloudtrail" "main" {
  name                          = "web-app-trail-274802"
  s3_bucket_name               = aws_s3_bucket.app.bucket
  s3_key_prefix                = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  enable_log_file_validation   = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app.arn}/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  tags = { Name = "cloudtrail-274802" }
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail" {
  name = "cloudtrail-role-274802"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = { Name = "cloudtrail-role-274802" }
}

resource "aws_iam_role_policy" "cloudtrail" {
  name = "cloudtrail-policy-274802"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/web-app-trail-274802"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  tags = { Name = "cloudtrail-logs-274802" }
}

# CloudWatch metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "unauthorized-api-calls-274802"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# CloudWatch metric filter for IAM policy violations
resource "aws_cloudwatch_log_metric_filter" "iam_policy_violations" {
  name           = "iam-policy-violations-274802"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.responseElements.ConsoleLogin = \"Failure\") }"

  metric_transformation {
    name      = "IAMPolicyViolations"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access" {
  alarm_name          = "unauthorized-access-alarm-274802"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alarm when unauthorized API calls are detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = { Name = "unauthorized-access-alarm-274802" }

  depends_on = [aws_cloudwatch_log_metric_filter.unauthorized_api_calls]
}

# Additional alarm for IAM policy violations
resource "aws_cloudwatch_metric_alarm" "iam_violations" {
  alarm_name          = "iam-violations-alarm-274802"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyViolations"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alarm when IAM policy violations are detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = { Name = "iam-violations-alarm-274802" }

  depends_on = [aws_cloudwatch_log_metric_filter.iam_policy_violations]
}

# SNS topic for alarm notifications
resource "aws_sns_topic" "alerts" {
  name              = "security-alerts-274802"
  kms_master_key_id = aws_kms_key.s3.arn

  tags = { Name = "security-alerts-274802" }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app.bucket
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.s3.id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "security_group_id" {
  description = "Security group ID for HTTPS traffic"
  value       = aws_security_group.web.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarm names for security monitoring"
  value = {
    unauthorized_access = aws_cloudwatch_metric_alarm.unauthorized_access.alarm_name
    iam_violations     = aws_cloudwatch_metric_alarm.iam_violations.alarm_name
  }
}
```
