# cross_account.tf - Cross-Account CloudWatch Observability Configuration

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
