output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "kms_key_arn" {
  value = aws_kms_key.master.arn
}

output "s3_logs_bucket" {
  value = aws_s3_bucket.logs.id
}

output "cloudtrail_name" {
  value = aws_cloudtrail.main.name
}

output "security_alerts_topic" {
  value = aws_sns_topic.security_alerts.arn
}

output "aurora_cluster_endpoint" {
  value = aws_rds_cluster.aurora.endpoint
}

output "fsx_dns_name" {
  value = aws_fsx_lustre_file_system.main.dns_name
}