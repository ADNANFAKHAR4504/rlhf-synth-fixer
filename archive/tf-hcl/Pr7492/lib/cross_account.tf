# CloudWatch cross-account observability configuration

# Create CloudWatch observability access manager links
resource "aws_oam_link" "cross_account" {
  count = length(var.cross_account_ids)

  label_template  = "$AccountName"
  resource_types  = ["AWS::CloudWatch::Metric", "AWS::Logs::LogGroup", "AWS::XRay::Trace"]
  sink_identifier = aws_oam_sink.main.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-oam-link-${count.index}"
    }
  )
}

# Create sink for receiving metrics from other accounts
resource "aws_oam_sink" "main" {
  name = "${local.name_prefix}-oam-sink"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-observability-sink"
    }
  )
}

# Sink policy to allow cross-account access
resource "aws_oam_sink_policy" "main" {
  sink_identifier = aws_oam_sink.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action = [
          "oam:CreateLink",
          "oam:UpdateLink"
        ]
        Resource = aws_oam_sink.main.arn
        Condition = {
          "ForAllValues:StringEquals" = {
            "oam:ResourceTypes" = [
              "AWS::CloudWatch::Metric",
              "AWS::Logs::LogGroup",
              "AWS::XRay::Trace"
            ]
          }
        }
      }
    ]
  })
}

# Dashboard for cross-account metrics
resource "aws_cloudwatch_dashboard" "cross_account_monitoring" {
  dashboard_name = "${local.name_prefix}-cross-account-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = concat(
            [
              ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Current Account" }]
            ],
            [
              for account_id in var.cross_account_ids :
              ["AWS/Lambda", "Invocations", { stat = "Sum", accountId = account_id, label = "Account ${account_id}" }]
            ]
          )
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Lambda Invocations"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for account_id in var.cross_account_ids :
            ["AWS/Lambda", "Errors", { stat = "Sum", accountId = account_id, label = "Errors - ${account_id}" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Error Tracking"
        }
      }
    ]
  })
}
