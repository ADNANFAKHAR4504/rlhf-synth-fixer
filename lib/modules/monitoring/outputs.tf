# modules/monitoring/outputs.tf - Monitoring Module Outputs

output "sns_topic_arn" {
  description = "ARN of SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of SNS alerts topic"
  value       = aws_sns_topic.alerts.name
}

output "dashboard_name" {
  description = "Name of CloudWatch dashboard"
  value       = var.create_dashboard ? aws_cloudwatch_dashboard.vpc_peering[0].dashboard_name : null
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = var.create_dashboard ? "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.vpc_peering[0].dashboard_name}" : "Dashboard not created"
}

output "alarm_vpc_a_traffic_volume_arn" {
  description = "ARN of VPC-A traffic volume alarm"
  value       = aws_cloudwatch_metric_alarm.vpc_a_traffic_volume.arn
}

output "alarm_vpc_a_rejected_connections_arn" {
  description = "ARN of VPC-A rejected connections alarm"
  value       = aws_cloudwatch_metric_alarm.vpc_a_rejected_connections.arn
}

output "alarm_vpc_b_traffic_volume_arn" {
  description = "ARN of VPC-B traffic volume alarm"
  value       = aws_cloudwatch_metric_alarm.vpc_b_traffic_volume.arn
}

output "alarm_vpc_b_rejected_connections_arn" {
  description = "ARN of VPC-B rejected connections alarm"
  value       = aws_cloudwatch_metric_alarm.vpc_b_rejected_connections.arn
}

# output "anomaly_detector_id" {
#   description = "ID of the CloudWatch Anomaly Detector"
#   value       = aws_cloudwatch_anomaly_detector.vpc_traffic.id
# }