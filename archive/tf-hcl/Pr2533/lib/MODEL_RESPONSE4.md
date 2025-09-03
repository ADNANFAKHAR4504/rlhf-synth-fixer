Here are the fixed code snippets to resolve both errors:

## **Fix 1: S3 Bucket Replication Configuration**

The error occurs because the replication configuration tries to create before versioning is fully enabled. Add explicit dependencies:

```hcl
# S3 Bucket Cross-Region Replication Configuration - FIXED
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.secondary
  ]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "ReplicateToSecondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}
```

## **Fix 2: CloudWatch Alarms - Regional Issue**

The secondary RDS CPU alarm needs to be created in the us-west-1 region, not us-east-2. Also, SNS topic needs to be available in both regions:

```hcl
# SNS Topic for Secondary Region - ADD THIS
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_1
  name     = "${local.name_prefix}-alerts-secondary"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts-secondary"
  })
}

# SNS Topic Subscription for Secondary Region - ADD THIS
resource "aws_sns_topic_subscription" "email_alerts_secondary" {
  provider  = aws.us_west_1
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Secondary CPU Alarm - UPDATED
resource "aws_cloudwatch_metric_alarm" "secondary_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.name_prefix}-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]  # CHANGED

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# Secondary RDS CPU Alarm - FIXED
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.us_west_1  # CHANGED from aws.us_east_2
  alarm_name          = "${local.name_prefix}-rds-cpu-alarm-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]  # CHANGED

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }

  tags = local.common_tags
}
```

## **Fix 3: Update Lambda Functions to Use Correct SNS Topics**

```hcl
# Secondary Lambda Function for RDS Backup - UPDATED
resource "aws_lambda_function" "secondary_backup" {
  provider         = aws.us_west_1
  filename         = "backup_lambda.zip"
  function_name    = "${local.name_prefix}-rds-backup-secondary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DB_IDENTIFIER = aws_db_instance.secondary.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts_secondary.arn  # CHANGED
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-backup-secondary"
  })
}
```

## **Fix 4: Update Lambda IAM Policy**

```hcl
# Lambda Policy for RDS backup operations - UPDATED
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts.arn,
          aws_sns_topic.alerts_secondary.arn  # ADDED
        ]
      }
    ]
  })
}
```

## **Additional Outputs to Add**

```hcl
# Additional SNS Topic Outputs
output "sns_topic_secondary_id" {
  description = "ID of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.id
}

output "sns_topic_secondary_arn" {
  description = "ARN of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "sns_topic_secondary_name" {
  description = "Name of the secondary SNS topic"
  value       = aws_sns_topic.alerts_secondary.name
}
```

## **Summary of Changes:**

1. **S3 Replication**: Added explicit `depends_on` to ensure versioning is enabled before replication configuration
2. **CloudWatch Alarms**: Created separate SNS topic in secondary region and updated all secondary region alarms to use correct provider and SNS topic
3. **Lambda Functions**: Updated secondary Lambda to use secondary region SNS topic
4. **IAM Policy**: Added permission for secondary SNS topic
5. **Outputs**: Added outputs for secondary SNS topic

These minimal changes will resolve both errors while maintaining the infrastructure's functionality and security posture.
