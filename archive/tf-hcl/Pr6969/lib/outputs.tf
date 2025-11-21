output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.payment_app.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.payment_app.alb_arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.payment_app.rds_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.payment_app.rds_port
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = module.payment_app.ec2_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = module.payment_app.rds_security_group_id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = module.payment_app.alb_security_group_id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = module.payment_app.ec2_instance_ids
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.payment_app.target_group_arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value       = module.payment_app.cloudwatch_alarm_arns
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = module.payment_app.db_credentials_secret_arn
}

output "webacl_arn" {
  description = "ARN of the WAF WebACL"
  value       = module.payment_app.webacl_arn
}