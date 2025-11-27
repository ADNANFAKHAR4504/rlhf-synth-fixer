output "global_cluster_id" {
  description = "Global cluster identifier"
  value       = aws_rds_global_cluster.main.id
}

output "primary_cluster_id" {
  description = "Primary cluster identifier"
  value       = aws_rds_cluster.primary.id
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "dr_cluster_id" {
  description = "DR cluster identifier"
  value       = aws_rds_cluster.dr.id
}

output "dr_cluster_endpoint" {
  description = "DR cluster endpoint"
  value       = aws_rds_cluster.dr.endpoint
}

output "replication_lag_alarm_arn" {
  description = "Replication lag alarm ARN"
  value       = aws_cloudwatch_metric_alarm.replication_lag.arn
}
