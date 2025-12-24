terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "alert_email" { type = string }

resource "aws_sns_topic" "alerts" {
  name = "transaction-alerts-${var.region}-${var.environment_suffix}"

  tags = {
    Name = "transaction-alerts-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

output "topic_arn" { value = aws_sns_topic.alerts.arn }
output "topic_name" { value = aws_sns_topic.alerts.name }
