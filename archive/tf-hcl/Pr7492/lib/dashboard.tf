# Comprehensive CloudWatch Dashboard with 5+ widget types
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-observability"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: Line chart - Lambda metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", { stat = "Sum", label = "Throttles" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Lambda Function Metrics"
          yAxis = {
            left = {
              label = "Count"
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Error Threshold"
                value = 10
                fill  = "above"
                color = "#ff0000"
              }
            ]
          }
        }
      },

      # Widget 2: Number widget - Current error rate
      {
        type = "metric"
        properties = {
          metrics = [
            [
              {
                expression = "(m2/m1)*100"
                label      = "Error Rate %"
                id         = "error_rate"
              }
            ],
            ["AWS/Lambda", "Errors", { id = "m2", visible = false }],
            [".", "Invocations", { id = "m1", visible = false }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Current Error Rate"
          view   = "singleValue"
        }
      },

      # Widget 3: Stacked area chart - ECS metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period  = 300
          stat    = "Average"
          region  = var.region
          title   = "ECS Resource Utilization"
          view    = "timeSeries"
          stacked = true
          yAxis = {
            left = {
              label = "Percent"
              max   = 100
            }
          }
        }
      },

      # Widget 4: Log widget - Recent errors
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.application.name}' | fields @timestamp, @message | filter level = 'ERROR' | sort @timestamp desc | limit 20"
          region  = var.region
          title   = "Recent Application Errors"
          stacked = false
        }
      },

      # Widget 5: Alarm status widget
      {
        type = "alarm"
        properties = {
          title = "Alarm Status"
          alarms = [
            aws_cloudwatch_metric_alarm.high_cpu.arn,
            aws_cloudwatch_metric_alarm.high_memory.arn,
            aws_cloudwatch_metric_alarm.high_error_rate.arn,
            aws_cloudwatch_composite_alarm.system_health.arn
          ]
        }
      },

      # Widget 6: Pie chart - Alarm state distribution
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }]
          ]
          period = 86400
          stat   = "Sum"
          region = var.region
          title  = "Daily Invocations vs Errors"
          view   = "pie"
        }
      },

      # Widget 7: Gauge widget - Current CPU utilization
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Current CPU Utilization"
          view   = "gauge"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Critical"
                value = 80
                fill  = "above"
                color = "#ff0000"
              },
              {
                label = "Warning"
                value = 60
                fill  = "above"
                color = "#ff9900"
              }
            ]
          }
        }
      },

      # Widget 8: Bar chart - Custom metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["CustomMetrics/${local.name_prefix}", "ErrorCount", { stat = "Sum" }],
            [".", "ServerErrorCount", { stat = "Sum" }]
          ]
          period = 3600
          stat   = "Sum"
          region = var.region
          title  = "Hourly Error Distribution"
          view   = "bar"
        }
      },

      # Widget 9: Text widget with annotations
      {
        type = "text"
        properties = {
          markdown = "## CloudWatch Observability Dashboard\n\n**Environment:** ${var.environment}\n\n**Last Updated:** {{date}}\n\n### Key Metrics:\n- Lambda invocations and errors\n- ECS resource utilization\n- Custom application metrics\n- Anomaly detection status\n\n### Alert Severity:\n- 🔴 Critical: Immediate action required\n- 🟡 Warning: Investigation needed\n- 🟢 Info: Informational only"
        }
      },

      # Widget 10: Metric explorer - Anomaly detection
      {
        type = "metric"
        properties = {
          metrics = [
            [
              {
                expression = "ANOMALY_DETECTION_BAND(m1, 2)"
                label      = "Expected Range"
                id         = "ad1"
              }
            ],
            ["CustomMetrics/${local.name_prefix}", "ResponseTime", { id = "m1", stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Response Time with Anomaly Detection"
          view   = "timeSeries"
          annotations = {
            horizontal = [
              {
                label = "SLA Threshold"
                value = 1000
              }
            ]
          }
        }
      }
    ]
  })
}

# Secondary dashboard for cross-account metrics
resource "aws_cloudwatch_dashboard" "cross_account" {
  dashboard_name = "${local.name_prefix}-cross-account"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", accountId = data.aws_caller_identity.current.account_id }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Lambda Invocations"
        }
      }
    ]
  })
}
