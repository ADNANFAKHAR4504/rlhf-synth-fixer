# canaries.tf - CloudWatch Synthetics Canaries

# IAM Role for Synthetics Canaries
resource "aws_iam_role" "synthetics_canary" {
  name = "synthetics-canary-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "synthetics-canary-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "synthetics_canary_basic" {
  role       = aws_iam_role.synthetics_canary.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
}

resource "aws_iam_role_policy" "synthetics_canary_logs" {
  name = "synthetics-canary-logs-${var.environment_suffix}"
  role = aws_iam_role.synthetics_canary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/cwsyn-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.canary_artifacts.arn,
          "${aws_s3_bucket.canary_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "CloudWatchSynthetics"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 Bucket for Canary Artifacts
resource "aws_s3_bucket" "canary_artifacts" {
  bucket        = "synthetics-canary-artifacts-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "canary-artifacts-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  rule {
    id     = "cleanup-old-artifacts"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# Security Group for Canaries in VPC
resource "aws_security_group" "canary" {
  name_prefix = "synthetics-canary-${var.environment_suffix}-"
  description = "Security group for CloudWatch Synthetics canaries"
  vpc_id      = data.aws_vpc.main.id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound for API calls"
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP outbound"
  }

  tags = {
    Name = "canary-sg-${var.environment_suffix}"
  }
}

# CloudWatch Synthetics Canaries with Custom Scripts
resource "aws_synthetics_canary" "endpoint_monitoring" {
  for_each = var.alb_endpoints

  name                 = "endpoint-${each.key}-${var.environment_suffix}"
  artifact_s3_location = "s3://${aws_s3_bucket.canary_artifacts.bucket}/canaries/${each.key}"
  execution_role_arn   = aws_iam_role.synthetics_canary.arn
  handler              = "apiCanaryBlueprint.handler"
  zip_file             = data.archive_file.canary_scripts[each.key].output_path
  runtime_version      = "syn-nodejs-puppeteer-6.2"
  start_canary         = true

  schedule {
    expression          = "rate(5 minutes)"
    duration_in_seconds = 0
  }

  run_config {
    timeout_in_seconds = 300
    memory_in_mb       = 960
    active_tracing     = true
  }

  vpc_config {
    subnet_ids         = data.aws_subnets.private.ids
    security_group_ids = [aws_security_group.canary.id]
  }

  success_retention_period = 7
  failure_retention_period = 14

  tags = {
    Name    = "canary-${each.key}-${var.environment_suffix}"
    Service = each.key
  }

  depends_on = [
    aws_iam_role_policy.synthetics_canary_logs,
    aws_iam_role_policy_attachment.synthetics_canary_basic
  ]
}

# Create custom canary scripts
data "archive_file" "canary_scripts" {
  for_each = var.alb_endpoints

  type        = "zip"
  output_path = "${path.module}/.terraform/tmp/canary-${each.key}.zip"

  source {
    content = templatefile("${path.module}/canary-script.js.tpl", {
      endpoint_url = each.value
      service_name = each.key
    })
    filename = "nodejs/node_modules/apiCanaryBlueprint.js"
  }
}

# Canary Alarms
resource "aws_cloudwatch_metric_alarm" "canary_failure" {
  for_each = var.alb_endpoints

  alarm_name          = "canary-failure-${each.key}-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Canary failure for ${each.key} endpoint"
  treat_missing_data  = "breaching"

  dimensions = {
    CanaryName = aws_synthetics_canary.endpoint_monitoring[each.key].name
  }

  alarm_actions = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Name     = "canary-failure-${each.key}-${var.environment_suffix}"
    Service  = each.key
    Severity = "critical"
  }
}

resource "aws_cloudwatch_metric_alarm" "canary_latency" {
  for_each = var.alb_endpoints

  alarm_name          = "canary-latency-${each.key}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 5000
  alarm_description   = "High latency detected for ${each.key} endpoint"
  treat_missing_data  = "notBreaching"

  dimensions = {
    CanaryName = aws_synthetics_canary.endpoint_monitoring[each.key].name
  }

  alarm_actions = [aws_sns_topic.warning_alerts.arn]

  tags = {
    Name     = "canary-latency-${each.key}-${var.environment_suffix}"
    Service  = each.key
    Severity = "warning"
  }
}
