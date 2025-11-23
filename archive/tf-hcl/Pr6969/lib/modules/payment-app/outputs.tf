output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.name
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = aws_security_group.alb.id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = aws_instance.app[*].id
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.app[*].private_ip
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value = {
    rds_cpu     = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_storage = aws_cloudwatch_metric_alarm.rds_storage.arn
    alb_health  = aws_cloudwatch_metric_alarm.alb_healthy_hosts.arn
    ec2_cpu     = aws_cloudwatch_metric_alarm.ec2_cpu[*].arn
  }
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "webacl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.arn
}