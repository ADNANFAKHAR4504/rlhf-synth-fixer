# CloudWatch Observability Stack - Terraform Implementation

I'll provide a comprehensive Terraform configuration for a multi-layer CloudWatch observability stack that monitors ECS-based microservices with intelligent alerting, synthetic monitoring, and cross-account visibility.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch resources"
  type        = string
  default     = "us-east-1"
}

variable "microservices" {
  description = "List of microservice names to monitor"
  type        = list(string)
  default     = ["auth-service", "payment-service", "order-service", "inventory-service", "notification-service"]
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster to monitor"
  type        = string
}

variable "alb_endpoints" {
  description = "Map of service names to their ALB endpoint URLs"
  type        = map(string)
  default = {
    "auth-service"         = "https://auth.example.com/health"
    "payment-service"      = "https://payment.example.com/health"
    "order-service"        = "https://order.example.com/health"
    "inventory-service"    = "https://inventory.example.com/health"
    "notification-service" = "https://notification.example.com/health"
  }
}

variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
}

variable "alert_webhook_url" {
  description = "Webhook URL for alert notifications (e.g., Slack, PagerDuty)"
  type        = string
  default     = ""
}

variable "warning_threshold_percentage" {
  description = "Warning threshold percentage for alarms"
  type        = number
  default     = 70
}

variable "critical_threshold_percentage" {
  description = "Critical threshold percentage for alarms"
  type        = number
  default     = 90
}

variable "dev_account_id" {
  description = "AWS Account ID for dev environment (for cross-account monitoring)"
  type        = string
  default     = ""
}

variable "staging_account_id" {
  description = "AWS Account ID for staging environment (for cross-account monitoring)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Team        = "platform"
    CostCenter  = "engineering"
  }
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      var.tags,
      {
        ManagedBy         = "terraform"
        EnvironmentSuffix = var.environment_suffix
      }
    )
  }
}
```

## File: lib/data.tf

```hcl
# Data sources for existing infrastructure

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_ecs_cluster" "main" {
  cluster_name = var.ecs_cluster_name
}

# Lookup ECS services in the cluster
data "aws_ecs_service" "microservices" {
  for_each     = toset(var.microservices)
  service_name = each.value
  cluster_arn  = data.aws_ecs_cluster.main.arn
}

# Lookup existing VPC for Synthetics canaries
data "aws_vpc" "main" {
  tags = {
    Name = "*-vpc-*"
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  tags = {
    Type = "private"
  }
}

# Get default security group for Synthetics
data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.main.id

  filter {
    name   = "group-name"
    values = ["default"]
  }
}
```

## File: lib/kms.tf

```hcl
# KMS key for SNS topic encryption

resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption - monitoring-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "monitoring-sns-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/monitoring-sns-${var.environment_suffix}"
  target_key_id = aws_kms_key.sns_encryption.key_id
}
```

## File: lib/logs.tf

```hcl
# CloudWatch Log Groups for each microservice

resource "aws_cloudwatch_log_group" "microservice_logs" {
  for_each = toset(var.microservices)

  name              = "/ecs/${each.value}-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.sns_encryption.arn

  tags = {
    Name        = "log-group-${each.value}-${var.environment_suffix}"
    Service     = each.value
    Environment = var.tags["Environment"]
  }
}

# Metric filters to extract error rates from logs

resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  for_each = toset(var.microservices)

  name           = "error-rate-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "CustomMetrics/${each.value}"
    value     = "1"
    default_value = "0"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "response_time" {
  for_each = toset(var.microservices)

  name           = "response-time-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "[time, request_id, level, message, duration_ms]"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "CustomMetrics/${each.value}"
    value     = "$duration_ms"
    default_value = "0"
    unit      = "Milliseconds"
  }
}

# Metric filter for critical errors (5xx, exceptions, fatal)

resource "aws_cloudwatch_log_metric_filter" "critical_errors" {
  for_each = toset(var.microservices)

  name           = "critical-errors-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "?FATAL ?CRITICAL ?\"5xx\" ?Exception ?\"Internal Server Error\""

  metric_transformation {
    name      = "CriticalErrorCount"
    namespace = "CustomMetrics/${each.value}"
    value     = "1"
    default_value = "0"
    unit      = "Count"
  }
}
```

## File: lib/notifications.tf

```hcl
# SNS Topics for alert routing

resource "aws_sns_topic" "critical_alerts" {
  name              = "monitoring-critical-alerts-${var.environment_suffix}"
  display_name      = "Critical Alerts - ${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "critical-alerts-${var.environment_suffix}"
    Severity = "critical"
  }
}

resource "aws_sns_topic" "warning_alerts" {
  name              = "monitoring-warning-alerts-${var.environment_suffix}"
  display_name      = "Warning Alerts - ${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "warning-alerts-${var.environment_suffix}"
    Severity = "warning"
  }
}

# Email subscriptions

resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "warning_email" {
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Webhook subscriptions (conditional on webhook URL being provided)

resource "aws_sns_topic_subscription" "critical_webhook" {
  count = var.alert_webhook_url != "" ? 1 : 0

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "https"
  endpoint  = var.alert_webhook_url
}

resource "aws_sns_topic_subscription" "warning_webhook" {
  count = var.alert_webhook_url != "" ? 1 : 0

  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "https"
  endpoint  = var.alert_webhook_url
}
```

## File: lib/alarms.tf

```hcl
# Individual CloudWatch Alarms for CPU, Memory, and Custom Metrics

# CPU Utilization Alarms (Warning Level)

resource "aws_cloudwatch_metric_alarm" "cpu_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "cpu-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.warning_threshold_percentage
  alarm_description   = "CPU utilization warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "cpu-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

# CPU Utilization Alarms (Critical Level)

resource "aws_cloudwatch_metric_alarm" "cpu_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "cpu-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.critical_threshold_percentage
  alarm_description   = "CPU utilization critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "cpu-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Memory Utilization Alarms (Warning Level)

resource "aws_cloudwatch_metric_alarm" "memory_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "memory-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.warning_threshold_percentage
  alarm_description   = "Memory utilization warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "memory-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

# Memory Utilization Alarms (Critical Level)

resource "aws_cloudwatch_metric_alarm" "memory_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "memory-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.critical_threshold_percentage
  alarm_description   = "Memory utilization critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name     = "memory-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Application Error Rate Alarms

resource "aws_cloudwatch_metric_alarm" "error_rate_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "error-rate-warning-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "CustomMetrics/${each.value}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Error rate warning for ${each.value}"
  treat_missing_data  = "notBreaching"

  tags = {
    Name     = "error-rate-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "error-rate-critical-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "CustomMetrics/${each.value}"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Error rate critical for ${each.value}"
  treat_missing_data  = "notBreaching"

  tags = {
    Name     = "error-rate-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# Composite Alarms (Combining CPU, Memory, and Error Rate)

resource "aws_cloudwatch_composite_alarm" "service_health_warning" {
  for_each = toset(var.microservices)

  alarm_name          = "service-health-warning-${each.value}-${var.environment_suffix}"
  alarm_description   = "Composite warning alarm for ${each.value} - triggers when CPU OR Memory OR Error Rate exceeds warning thresholds"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.warning_alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.cpu_warning[each.value].alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.memory_warning[each.value].alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.error_rate_warning[each.value].alarm_name})"

  tags = {
    Name     = "composite-warning-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "warning"
  }
}

resource "aws_cloudwatch_composite_alarm" "service_health_critical" {
  for_each = toset(var.microservices)

  alarm_name          = "service-health-critical-${each.value}-${var.environment_suffix}"
  alarm_description   = "Composite critical alarm for ${each.value} - triggers when CPU AND Memory are high OR Error Rate is critical"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.critical_alerts.arn]

  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.cpu_critical[each.value].alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.memory_critical[each.value].alarm_name})) OR ALARM(${aws_cloudwatch_metric_alarm.error_rate_critical[each.value].alarm_name})"

  tags = {
    Name     = "composite-critical-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}

# ECS Task Failure Alarms (Container Insights)

resource "aws_cloudwatch_metric_alarm" "task_failure" {
  for_each = toset(var.microservices)

  alarm_name          = "task-failure-${each.value}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "SampleCount"
  threshold           = 0
  alarm_description   = "Alert when ${each.value} tasks fail"
  treat_missing_data  = "breaching"

  dimensions = {
    ServiceName = each.value
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Name     = "task-failure-${each.value}-${var.environment_suffix}"
    Service  = each.value
    Severity = "critical"
  }
}
```

## File: lib/canaries.tf

```hcl
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
```

## File: lib/canary-script.js.tpl

```javascript
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const syntheticsConfiguration = synthetics.getConfiguration();
const syntheticsLogHelper = require('SyntheticsLogHelper');

const apiCanaryBlueprint = async function () {
    const postData = "";

    syntheticsConfiguration.setConfig({
        restrictedHeaders: [],
        restrictedHeaderValues: []
    });

    const headers = {
        'User-Agent': 'CloudWatch-Synthetics-Canary/${service_name}',
        'Accept': 'application/json'
    };

    const requestOptions = {
        hostname: new URL('${endpoint_url}').hostname,
        method: 'GET',
        path: new URL('${endpoint_url}').pathname,
        port: new URL('${endpoint_url}').port || (new URL('${endpoint_url}').protocol === 'https:' ? 443 : 80),
        protocol: new URL('${endpoint_url}').protocol,
        body: postData,
        headers: headers
    };

    const stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true,
        continueOnHttpStepFailure: false
    };

    await syntheticsLogHelper.executeHttpStep('Verify endpoint health', requestOptions, function(res) {
        return new Promise((resolve, reject) => {
            log.info(`Status Code: $${res.statusCode}`);
            log.info(`Response: $${res.body}`);

            if (res.statusCode < 200 || res.statusCode >= 300) {
                reject(`Failed with status code: $${res.statusCode}`);
            }

            // Custom validation for health endpoint
            try {
                if (res.body) {
                    const body = JSON.parse(res.body);
                    if (body.status && body.status === 'healthy') {
                        log.info('Health check passed - service is healthy');
                        resolve();
                    } else {
                        reject(`Service reported unhealthy status: $${body.status}`);
                    }
                } else {
                    // If no JSON response, just check status code
                    resolve();
                }
            } catch (e) {
                log.info('Response is not JSON, checking status code only');
                resolve();
            }
        });
    }, stepConfig);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
```

## File: lib/events.tf

```hcl
# CloudWatch Event Rules for ECS Task State Changes

resource "aws_cloudwatch_event_rule" "ecs_task_stopped" {
  name        = "ecs-task-stopped-${var.environment_suffix}"
  description = "Capture ECS task stopped events"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      lastStatus  = ["STOPPED"]
      clusterArn  = [data.aws_ecs_cluster.main.arn]
      stoppedReason = [
        { "prefix" = "Essential container" },
        { "prefix" = "Task failed" }
      ]
    }
  })

  tags = {
    Name = "ecs-task-stopped-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_rule" "ecs_task_failed_to_start" {
  name        = "ecs-task-failed-start-${var.environment_suffix}"
  description = "Capture ECS task failed to start events"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      lastStatus = ["STOPPED"]
      clusterArn = [data.aws_ecs_cluster.main.arn]
      desiredStatus = ["RUNNING"]
      stoppedReason = [
        { "prefix" = "CannotPullContainer" },
        { "prefix" = "ResourceInitializationError" }
      ]
    }
  })

  tags = {
    Name = "ecs-task-failed-start-${var.environment_suffix}"
  }
}

# SNS targets for event rules

resource "aws_cloudwatch_event_target" "task_stopped_sns" {
  rule      = aws_cloudwatch_event_rule.ecs_task_stopped.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn

  input_transformer {
    input_paths = {
      cluster = "$.detail.clusterArn"
      taskArn = "$.detail.taskArn"
      reason  = "$.detail.stoppedReason"
      service = "$.detail.group"
    }
    input_template = "\"ECS Task Stopped - Cluster: <cluster>, Task: <taskArn>, Service: <service>, Reason: <reason>\""
  }
}

resource "aws_cloudwatch_event_target" "task_failed_start_sns" {
  rule      = aws_cloudwatch_event_rule.ecs_task_failed_to_start.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn

  input_transformer {
    input_paths = {
      cluster = "$.detail.clusterArn"
      taskArn = "$.detail.taskArn"
      reason  = "$.detail.stoppedReason"
      service = "$.detail.group"
    }
    input_template = "\"ECS Task Failed to Start - Cluster: <cluster>, Task: <taskArn>, Service: <service>, Reason: <reason>\""
  }
}

# SNS topic policy to allow EventBridge to publish

resource "aws_sns_topic_policy" "critical_alerts_events" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}
```

## File: lib/dashboard.tf

```hcl
# CloudWatch Dashboard with Metric Math Expressions

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "monitoring-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = concat(
      # Infrastructure Metrics Section
      [
        {
          type = "metric"
          properties = {
            title   = "ECS Cluster Overview"
            region  = data.aws_region.current.name
            metrics = [
              ["ECS/ContainerInsights", "RunningTaskCount", { stat = "Average", label = "Running Tasks" }],
              [".", "PendingTaskCount", { stat = "Average", label = "Pending Tasks" }],
              [".", "DesiredTaskCount", { stat = "Average", label = "Desired Tasks" }]
            ]
            period = 300
            yAxis = {
              left = {
                min = 0
              }
            }
          }
          width  = 12
          height = 6
        },
        {
          type = "metric"
          properties = {
            title   = "CPU and Memory Utilization by Service"
            region  = data.aws_region.current.name
            metrics = flatten([
              for service in var.microservices : [
                ["AWS/ECS", "CPUUtilization", { "ServiceName" = service, "ClusterName" = var.ecs_cluster_name, stat = "Average", label = "$${service} CPU" }],
                [".", "MemoryUtilization", { "ServiceName" = service, "ClusterName" = var.ecs_cluster_name, stat = "Average", label = "$${service} Memory" }]
              ]
            ])
            period = 300
            yAxis = {
              left = {
                min = 0
                max = 100
              }
            }
          }
          width  = 12
          height = 6
        }
      ],

      # Application Metrics Section with Metric Math
      [
        {
          type = "metric"
          properties = {
            title   = "Error Rate Percentage (Calculated)"
            region  = data.aws_region.current.name
            metrics = flatten([
              for service in var.microservices : [
                [{ expression = "m1/m2*100", label = "$${service} Error Rate %", id = "e${index(var.microservices, service)}" }],
                ["CustomMetrics/$${service}", "ErrorCount", { id = "m1", visible = false, stat = "Sum" }],
                [".", "RequestCount", { id = "m2", visible = false, stat = "Sum" }]
              ]
            ])
            period = 300
            yAxis = {
              left = {
                min = 0
              }
            }
          }
          width  = 12
          height = 6
        },
        {
          type = "metric"
          properties = {
            title   = "p99 Response Time by Service"
            region  = data.aws_region.current.name
            metrics = [
              for service in var.microservices :
              ["CustomMetrics/$${service}", "ResponseTime", { "ServiceName" = service, stat = "p99", label = "$${service} p99" }]
            ]
            period = 300
            yAxis = {
              left = {
                min = 0
              }
            }
          }
          width  = 12
          height = 6
        },
        {
          type = "metric"
          properties = {
            title   = "Service Availability (Calculated)"
            region  = data.aws_region.current.name
            metrics = flatten([
              for service in var.microservices : [
                [{ expression = "(m2-m1)/m2*100", label = "$${service} Availability %", id = "e${index(var.microservices, service)}" }],
                ["CustomMetrics/$${service}", "ErrorCount", { id = "m1", visible = false, stat = "Sum" }],
                [".", "RequestCount", { id = "m2", visible = false, stat = "Sum" }]
              ]
            ])
            period = 300
            yAxis = {
              left = {
                min = 95
                max = 100
              }
            }
          }
          width  = 12
          height = 6
        }
      ],

      # Synthetic Monitoring Section
      [
        {
          type = "metric"
          properties = {
            title   = "Canary Success Rate"
            region  = data.aws_region.current.name
            metrics = [
              for service, endpoint in var.alb_endpoints :
              ["CloudWatchSynthetics", "SuccessPercent", { "CanaryName" = "endpoint-$${service}-$${var.environment_suffix}", stat = "Average", label = "$${service}" }]
            ]
            period = 300
            yAxis = {
              left = {
                min = 0
                max = 100
              }
            }
          }
          width  = 12
          height = 6
        },
        {
          type = "metric"
          properties = {
            title   = "Canary Duration (ms)"
            region  = data.aws_region.current.name
            metrics = [
              for service, endpoint in var.alb_endpoints :
              ["CloudWatchSynthetics", "Duration", { "CanaryName" = "endpoint-$${service}-$${var.environment_suffix}", stat = "Average", label = "$${service}" }]
            ]
            period = 300
            yAxis = {
              left = {
                min = 0
              }
            }
          }
          width  = 12
          height = 6
        }
      ],

      # Alarm Status Section
      [
        {
          type = "metric"
          properties = {
            title   = "Alarm Status Overview"
            region  = data.aws_region.current.name
            annotations = {
              alarms = [
                for service in var.microservices :
                aws_cloudwatch_composite_alarm.service_health_critical[service].arn
              ]
            }
          }
          width  = 24
          height = 6
        }
      ]
    )
  })
}
```

## File: lib/cross_account.tf

```hcl
# Cross-Account CloudWatch Observability Configuration

# Monitoring account configuration (sink)

resource "aws_oam_sink" "monitoring_sink" {
  count = var.dev_account_id != "" || var.staging_account_id != "" ? 1 : 0

  name = "monitoring-sink-${var.environment_suffix}"

  tags = {
    Name = "monitoring-sink-${var.environment_suffix}"
  }
}

resource "aws_oam_sink_policy" "monitoring_sink_policy" {
  count = var.dev_account_id != "" || var.staging_account_id != "" ? 1 : 0

  sink_identifier = aws_oam_sink.monitoring_sink[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = compact([
            var.dev_account_id != "" ? "arn:aws:iam::${var.dev_account_id}:root" : "",
            var.staging_account_id != "" ? "arn:aws:iam::${var.staging_account_id}:root" : ""
          ])
        }
        Action = [
          "oam:CreateLink",
          "oam:UpdateLink"
        ]
        Resource = aws_oam_sink.monitoring_sink[0].arn
        Condition = {
          "ForAllValues:StringEquals" = {
            "oam:ResourceTypes" = [
              "AWS::CloudWatch::Metric",
              "AWS::Logs::LogGroup"
            ]
          }
        }
      }
    ]
  })
}

# Output the sink ARN for source account configuration

output "monitoring_sink_arn" {
  description = "ARN of the CloudWatch Observability Access Manager sink for cross-account monitoring"
  value       = var.dev_account_id != "" || var.staging_account_id != "" ? aws_oam_sink.monitoring_sink[0].arn : "Cross-account monitoring not configured"
}

output "monitoring_sink_id" {
  description = "ID of the CloudWatch Observability Access Manager sink"
  value       = var.dev_account_id != "" || var.staging_account_id != "" ? aws_oam_sink.monitoring_sink[0].id : "Cross-account monitoring not configured"
}
```

## File: lib/outputs.tf

```hcl
output "log_groups" {
  description = "CloudWatch Log Groups created for microservices"
  value = {
    for k, v in aws_cloudwatch_log_group.microservice_logs : k => v.name
  }
}

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "canaries" {
  description = "CloudWatch Synthetics canaries created"
  value = {
    for k, v in aws_synthetics_canary.endpoint_monitoring : k => {
      name   = v.name
      status = v.status
      id     = v.id
    }
  }
}

output "composite_alarms" {
  description = "Composite alarms for service health monitoring"
  value = {
    for k, v in aws_cloudwatch_composite_alarm.service_health_critical : k => {
      name = v.alarm_name
      arn  = v.arn
    }
  }
}

output "kms_key_id" {
  description = "KMS key ID used for SNS encryption"
  value       = aws_kms_key.sns_encryption.id
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file

environment_suffix = "prod"
aws_region         = "us-east-1"

microservices = [
  "auth-service",
  "payment-service",
  "order-service",
  "inventory-service",
  "notification-service"
]

ecs_cluster_name = "fintech-ecs-cluster"

alb_endpoints = {
  "auth-service"         = "https://auth.example.com/health"
  "payment-service"      = "https://payment.example.com/health"
  "order-service"        = "https://order.example.com/health"
  "inventory-service"    = "https://inventory.example.com/health"
  "notification-service" = "https://notification.example.com/health"
}

alert_email        = "devops-alerts@example.com"
alert_webhook_url  = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

warning_threshold_percentage  = 70
critical_threshold_percentage = 90

# Optional: Cross-account monitoring
# dev_account_id     = "123456789012"
# staging_account_id = "234567890123"

tags = {
  Environment = "production"
  Team        = "platform"
  CostCenter  = "engineering"
}
```

## File: lib/README.md

```markdown
# CloudWatch Observability Stack for ECS Microservices

Comprehensive multi-layer monitoring solution for ECS-based microservices using Terraform.

## Features

- **Centralized Logging**: CloudWatch Log Groups with 30-day retention and metric filters
- **Intelligent Alarming**: Two-tier threshold system (70% warning, 90% critical) with composite alarms
- **Synthetic Monitoring**: CloudWatch Synthetics canaries with custom scripts running every 5 minutes
- **Alert Routing**: SNS topics with email and webhook subscriptions, encrypted with KMS
- **Comprehensive Dashboard**: Real-time metrics with metric math expressions for calculated values
- **Event-Driven Monitoring**: CloudWatch Events for ECS task state changes
- **Cross-Account Observability**: Aggregate metrics from dev and staging accounts

## Architecture

### Monitoring Components

1. **Log Groups**: One per microservice with metric filters for error rates and response times
2. **Alarms**: Individual alarms for CPU, memory, and error rates with warning and critical thresholds
3. **Composite Alarms**: Combine multiple metrics with AND/OR logic for intelligent alerting
4. **Synthetics Canaries**: Monitor API endpoint health and functionality every 5 minutes
5. **Dashboard**: Multi-section dashboard with infrastructure, application, and synthetic metrics
6. **Event Rules**: Capture ECS task failures and state changes

### Resource Naming

All resources include `environment_suffix` for uniqueness:
- Log Groups: `/ecs/{service}-{environmentSuffix}`
- Alarms: `{alarm-type}-{service}-{environmentSuffix}`
- Canaries: `endpoint-{service}-{environmentSuffix}`
- SNS Topics: `monitoring-{severity}-alerts-{environmentSuffix}`

## Prerequisites

- Terraform >= 1.5.0
- AWS Provider >= 5.0
- Existing ECS cluster with Container Insights enabled
- VPC with private subnets for Synthetics canaries
- ALB endpoints for each microservice

## Deployment

### 1. Configure Variables

Copy the example variables file:

```bash
cp lib/terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix = "prod"
ecs_cluster_name   = "your-ecs-cluster"
alert_email        = "your-email@example.com"

# Update ALB endpoints
alb_endpoints = {
  "service-name" = "https://your-endpoint.com/health"
}
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Deployment

```bash
terraform plan -out=monitoring.tfplan
```

### 4. Apply Configuration

```bash
terraform apply monitoring.tfplan
```

### 5. Confirm SNS Subscriptions

Check your email and confirm the SNS subscription for alert notifications.

## Dashboard Access

After deployment, access your dashboard at:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=monitoring-dashboard-{environmentSuffix}
```

Or use the output URL:

```bash
terraform output dashboard_url
```

## Alarm Configuration

### Warning Thresholds (70%)
- Triggers SNS notification to warning topic
- Email alert sent
- Composite alarm evaluates: CPU OR Memory OR Error Rate

### Critical Thresholds (90%)
- Triggers SNS notification to critical topic
- Email and webhook alerts sent
- Composite alarm evaluates: (CPU AND Memory) OR Error Rate

## Synthetics Canaries

Canaries run every 5 minutes and perform:
1. HTTP GET request to health endpoint
2. Validate response status code (200-299)
3. Parse JSON response and check health status
4. Report success/failure to CloudWatch

### Canary Alarms
- Success rate < 90%: Critical alert
- Average duration > 5000ms: Warning alert

## Cross-Account Monitoring

To enable cross-account monitoring:

1. Set account IDs in `terraform.tfvars`:
```hcl
dev_account_id     = "123456789012"
staging_account_id = "234567890123"
```

2. In source accounts (dev/staging), create OAM link:
```hcl
resource "aws_oam_link" "to_monitoring" {
  label_template  = "$AccountName"
  resource_types  = ["AWS::CloudWatch::Metric", "AWS::Logs::LogGroup"]
  sink_identifier = "<SINK_ARN_FROM_OUTPUT>"
}
```

3. Metrics will appear in the central monitoring account dashboard

## Metric Math Expressions

The dashboard uses several calculated metrics:

- **Error Rate %**: `(ErrorCount / RequestCount) * 100`
- **Availability %**: `((RequestCount - ErrorCount) / RequestCount) * 100`
- **p99 Latency**: 99th percentile of response times

## Testing

### Test Log Metric Filters

Send test log entries:

```bash
aws logs put-log-events \
  --log-group-name /ecs/auth-service-prod \
  --log-stream-name test-stream \
  --log-events timestamp=$(date +%s000),message="ERROR: Authentication failed"
```

### Test Canaries

Canaries start automatically. Check status:

```bash
terraform output canaries
```

### Test Alarms

View alarm status:

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "service-health-critical"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: All resources have `force_destroy = true` for log groups and S3 buckets.

## Cost Optimization

- Log retention: 30 days (compliance requirement)
- Canary artifacts: 30-day lifecycle policy
- Synthetics canaries: Run every 5 minutes (8,640 runs/month per service)
- CloudWatch Logs: Pay per GB ingested and stored

## Troubleshooting

### Canaries Not Starting

Check IAM role permissions:
```bash
aws iam get-role-policy --role-name synthetics-canary-role-prod --policy-name synthetics-canary-logs-prod
```

### Alarms Not Triggering

Verify metrics are being published:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=auth-service Name=ClusterName,Value=fintech-ecs-cluster \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Average
```

### SNS Notifications Not Received

Check topic subscription status:
```bash
aws sns list-subscriptions-by-topic --topic-arn $(terraform output -raw critical_alerts_topic_arn)
```

## Security

- SNS topics encrypted with customer-managed KMS key
- KMS key rotation enabled
- S3 buckets for canary artifacts: private access only
- IAM roles follow least privilege principle
- VPC security group restricts canary egress to HTTPS/HTTP only

## Maintenance

### Update Canary Scripts

Modify `lib/canary-script.js.tpl` and run:
```bash
terraform apply
```

### Add New Microservice

Add to `microservices` list and `alb_endpoints` map in `terraform.tfvars`, then:
```bash
terraform apply
```

### Adjust Thresholds

Update threshold variables and reapply:
```bash
terraform apply -var="warning_threshold_percentage=75" -var="critical_threshold_percentage=95"
```
```
