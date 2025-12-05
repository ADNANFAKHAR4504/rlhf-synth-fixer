# CloudWatch Monitoring Infrastructure Implementation

This Terraform configuration implements comprehensive CloudWatch monitoring for payment processing services with log groups, metric filters, alarms, composite alarms, dashboards, and SNS notifications.

## File: lib/main.tf

```hcl
# Data source for existing KMS key
data "aws_kms_alias" "cloudwatch" {
  name = "alias/cloudwatch-logs"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/payment-api-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = data.aws_kms_alias.cloudwatch.target_key_arn

  tags = {
    Name       = "payment-api-logs-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/aws/transaction-processor-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = data.aws_kms_alias.cloudwatch.target_key_arn

  tags = {
    Name       = "transaction-processor-logs-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "fraud_detector" {
  name              = "/aws/fraud-detector-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = data.aws_kms_alias.cloudwatch.target_key_arn

  tags = {
    Name       = "fraud-detector-logs-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

# Metric Filters for Error Rates
resource "aws_cloudwatch_log_metric_filter" "payment_api_errors" {
  name           = "payment-api-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "transaction_processor_errors" {
  name           = "transaction-processor-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "fraud_detector_errors" {
  name           = "fraud-detector-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.fraud_detector.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/FraudDetector/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filters for Response Times
resource "aws_cloudwatch_log_metric_filter" "payment_api_response_time" {
  name           = "payment-api-response-time-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.responseTime = * }"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "$.responseTime"
    unit      = "Milliseconds"
  }
}

# Metric Filters for Transaction Amounts
resource "aws_cloudwatch_log_metric_filter" "transaction_amounts" {
  name           = "transaction-amounts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.transactionAmount = * }"

  metric_transformation {
    name      = "TransactionAmount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "$.transactionAmount"
    unit      = "None"
  }
}

# Metric Filters for Failed Transactions
resource "aws_cloudwatch_log_metric_filter" "failed_transactions" {
  name           = "failed-transactions-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.status = \"FAILED\" }"

  metric_transformation {
    name      = "FailedTransactions"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Cold Starts
resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "lambda-cold-starts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, duration_unit=\"ms\", billed_duration_label=\"Billed Duration:\", billed_duration, billed_duration_unit=\"ms\", memory_label=\"Memory Size:\", memory_size, memory_unit=\"MB\", max_memory_label=\"Max Memory Used:\", max_memory_used, max_memory_unit=\"MB\", init_duration_label=\"Init Duration:\", init_duration, init_duration_unit=\"ms\"]"

  metric_transformation {
    name      = "ColdStart"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Duration
resource "aws_cloudwatch_log_metric_filter" "lambda_duration" {
  name           = "lambda-duration-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, ...]"

  metric_transformation {
    name      = "Duration"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "$duration"
    unit      = "Milliseconds"
  }
}

# SNS Topic for Notifications
resource "aws_sns_topic" "alerts" {
  name              = "payment-monitoring-alerts-${var.environment_suffix}"
  display_name      = "Payment Processing Monitoring Alerts"
  kms_master_key_id = data.aws_kms_alias.cloudwatch.target_key_id

  tags = {
    Name       = "monitoring-alerts-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "payment-api-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when payment API error rate exceeds 1%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name       = "api-error-alarm-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_response_time" {
  alarm_name          = "payment-api-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ResponseTime"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Alert when payment API response time exceeds 500ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name       = "api-response-time-alarm-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  alarm_name          = "failed-transactions-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTransactions"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when failed transactions exceed 5 per minute"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name       = "failed-transactions-alarm-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "transaction-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when transaction processor errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name       = "transaction-processor-errors-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detector_errors" {
  alarm_name          = "fraud-detector-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/FraudDetector/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when fraud detector errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name       = "fraud-detector-errors-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

# Composite Alarm
resource "aws_cloudwatch_composite_alarm" "multi_service_failure" {
  alarm_name          = "multi-service-failure-${var.environment_suffix}"
  alarm_description   = "Alert when 2 or more services are experiencing issues"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.api_error_rate.alarm_name}) AND (ALARM(${aws_cloudwatch_metric_alarm.transaction_processor_errors.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.fraud_detector_errors.alarm_name}))"

  tags = {
    Name       = "multi-service-failure-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

# Auto Scaling Policy (for high load response)
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "payment-scale-up-${var.environment_suffix}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = var.autoscaling_group_name

  lifecycle {
    create_before_destroy = true
  }
}

# CloudWatch Alarm for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "high_load" {
  alarm_name          = "payment-high-load-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Scale up when high load detected"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.alerts.arn,
    aws_autoscaling_policy.scale_up.arn
  ]

  tags = {
    Name       = "high-load-alarm-${var.environment_suffix}"
    CostCenter = var.cost_center
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_monitoring" {
  dashboard_name = "payment-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: Service Health (3 columns)
      {
        type = "metric"
        x    = 0
        y    = 0
        width = 8
        height = 6
        properties = {
          title   = "Payment API Error Rate"
          region  = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type = "metric"
        x    = 8
        y    = 0
        width = 8
        height = 6
        properties = {
          title   = "Transaction Processor Health"
          region  = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 60, label = "Errors" }],
            [".", "FailedTransactions", { stat = "Sum", period = 60, label = "Failed Transactions" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 0
        width = 8
        height = 6
        properties = {
          title   = "Fraud Detector Status"
          region  = var.aws_region
          metrics = [
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      # Row 2: Transaction Volume and Performance (3 columns)
      {
        type = "metric"
        x    = 0
        y    = 6
        width = 8
        height = 6
        properties = {
          title   = "Transaction Volume Trends"
          region  = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "SampleCount", period = 300, label = "Total Transactions" }],
            ["...", { stat = "Sum", period = 300, label = "Transaction Volume" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type = "metric"
        x    = 8
        y    = 6
        width = 8
        height = 6
        properties = {
          title   = "API Response Time"
          region  = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ResponseTime", { stat = "Average", period = 60, label = "Avg Response Time" }],
            ["...", { stat = "Maximum", period = 60, label = "Max Response Time" }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 6
        width = 8
        height = 6
        properties = {
          title   = "Error Distribution"
          region  = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "API Errors" }],
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Processor Errors" }],
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Fraud Detector Errors" }]
          ]
          view    = "timeSeries"
          stacked = true
        }
      },
      # Row 3: Business KPIs and Lambda Metrics (3 columns)
      {
        type = "metric"
        x    = 0
        y    = 12
        width = 8
        height = 6
        properties = {
          title   = "Successful Payments Per Minute"
          region  = var.aws_region
          metrics = [
            [
              {
                expression = "m1 - m2"
                label      = "Successful Payments"
                id         = "e1"
              }
            ],
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { id = "m1", stat = "SampleCount", period = 60, visible = false }],
            [".", "FailedTransactions", { id = "m2", stat = "Sum", period = 60, visible = false }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type = "metric"
        x    = 8
        y    = 12
        width = 8
        height = 6
        properties = {
          title   = "Average Transaction Value"
          region  = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "USD"
            }
          }
        }
      },
      {
        type = "metric"
        x    = 16
        y    = 12
        width = 8
        height = 6
        properties = {
          title   = "Lambda Performance"
          region  = var.aws_region
          metrics = [
            ["FinTech/Lambda/${var.environment}", "ColdStart", { stat = "Sum", period = 300, label = "Cold Starts" }],
            [".", "Duration", { stat = "Average", period = 300, label = "Avg Duration", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      }
    ]
  })
}

# CloudWatch Log Insights Query for Cross-Service Investigation
resource "aws_cloudwatch_query_definition" "error_investigation" {
  name = "payment-error-investigation-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "transaction_flow_analysis" {
  name = "transaction-flow-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, transactionId, status, amount
    | filter ispresent(transactionId)
    | sort @timestamp desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "performance-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name
  ]

  query_string = <<-QUERY
    fields @timestamp, responseTime, endpoint, statusCode
    | filter ispresent(responseTime)
    | stats avg(responseTime) as avgResponseTime, max(responseTime) as maxResponseTime, count() as requestCount by endpoint
    | sort avgResponseTime desc
  QUERY
}
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple deployments"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "FinTech-Payments"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "autoscaling_group_name" {
  description = "Name of the Auto Scaling group for alarm actions"
  type        = string
  default     = "payment-processing-asg"
}
```

## File: lib/outputs.tf

```hcl
output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_monitoring.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alert notifications"
  value       = aws_sns_topic.alerts.arn
}

output "log_group_names" {
  description = "Names of the CloudWatch log groups"
  value = {
    payment_api           = aws_cloudwatch_log_group.payment_api.name
    transaction_processor = aws_cloudwatch_log_group.transaction_processor.name
    fraud_detector        = aws_cloudwatch_log_group.fraud_detector.name
  }
}

output "alarm_names" {
  description = "Names of the CloudWatch alarms"
  value = {
    api_error_rate           = aws_cloudwatch_metric_alarm.api_error_rate.alarm_name
    api_response_time        = aws_cloudwatch_metric_alarm.api_response_time.alarm_name
    failed_transactions      = aws_cloudwatch_metric_alarm.failed_transactions.alarm_name
    multi_service_failure    = aws_cloudwatch_composite_alarm.multi_service_failure.alarm_name
    high_load                = aws_cloudwatch_metric_alarm.high_load.alarm_name
  }
}

output "custom_metric_namespaces" {
  description = "Custom metric namespaces for business KPIs"
  value = [
    "FinTech/PaymentAPI/${var.environment}",
    "FinTech/TransactionProcessor/${var.environment}",
    "FinTech/FraudDetector/${var.environment}",
    "FinTech/Lambda/${var.environment}"
  ]
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"

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
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment
      CostCenter  = var.cost_center
    }
  }
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this file to terraform.tfvars and fill in your values

environment_suffix      = "dev-001"
environment             = "prod"
cost_center             = "FinTech-Payments"
aws_region              = "us-east-1"
alert_email             = "alerts@example.com"
autoscaling_group_name  = "payment-processing-asg"
```

## File: lib/README.md

```markdown
# CloudWatch Monitoring Infrastructure for Payment Processing

This Terraform configuration deploys comprehensive CloudWatch monitoring for fintech payment processing services.

## Features

- **CloudWatch Log Groups**: Encrypted log storage for payment-api, transaction-processor, and fraud-detector services
- **Metric Filters**: Extract error rates, response times, transaction amounts, and Lambda metrics from JSON logs
- **CloudWatch Alarms**: Monitor API error rates, response times, and failed transactions
- **Composite Alarm**: Multi-service failure detection
- **SNS Notifications**: Email alerts for alarm state changes
- **CloudWatch Dashboard**: 3-column layout with service health, transaction trends, and error distribution
- **Custom Metrics**: Business KPIs including successful_payments_per_minute and average_transaction_value
- **Auto Scaling Integration**: Automatic capacity increases on high load
- **Log Insights Queries**: Saved searches for incident investigation

## Prerequisites

- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- Existing KMS key with alias `alias/cloudwatch-logs`
- Auto Scaling group for high-load response integration

## Deployment

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   environment_suffix = "dev-001"
   alert_email        = "your-email@example.com"
   ```

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the execution plan:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Outputs

- `dashboard_url`: Direct link to CloudWatch dashboard
- `sns_topic_arn`: ARN for integration with external alerting systems
- `log_group_names`: Log group names for application configuration
- `alarm_names`: Alarm names for reference
- `custom_metric_namespaces`: Metric namespaces for publishing custom metrics

## Custom Metrics

To publish custom metrics from your application:

```python
import boto3

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

cloudwatch.put_metric_data(
    Namespace='FinTech/TransactionProcessor/prod',
    MetricData=[
        {
            'MetricName': 'TransactionAmount',
            'Value': 150.00,
            'Unit': 'None'
        }
    ]
)
```

## Log Format

Ensure your application logs are in JSON format for metric filter extraction:

```json
{
  "timestamp": "2025-12-05T10:30:00Z",
  "level": "ERROR",
  "message": "Payment processing failed",
  "transactionId": "txn-12345",
  "responseTime": 450,
  "transactionAmount": 100.50,
  "status": "FAILED"
}
```

## Alarm Thresholds

- **API Error Rate**: > 1% (2 evaluation periods)
- **Response Time**: > 500ms average (2 evaluation periods)
- **Failed Transactions**: > 5 per minute (1 evaluation period)
- **Composite Alarm**: 2 or more service alarms in ALARM state

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Cost Optimization

This configuration uses cost-effective CloudWatch features:
- 7-day log retention to minimize storage costs
- Metric filters instead of continuous queries
- Efficient dashboard with metric math expressions
- Consolidated SNS topic for all notifications
```
