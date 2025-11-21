# Root Module - Outputs
output "name_prefix" {
  value       = local.name_prefix
  description = "Resource naming prefix (includes PR number)"
}

output "pr_number" {
  value       = var.pr_number
  description = "PR number used for resource identification"
}

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "DNS name of the Application Load Balancer"
}

output "alb_arn" {
  value       = module.alb.alb_arn
  description = "ARN of the Application Load Balancer"
}

output "target_group_arn" {
  value       = module.alb.target_group_arn
  description = "ARN of the target group"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "rds_identifier" {
  value       = "${local.name_prefix}-db"
  description = "RDS instance identifier with PR number"
}

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Name of the S3 bucket"
}

output "s3_bucket_arn" {
  value       = module.s3.bucket_arn
  description = "ARN of the S3 bucket"
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.db_password.arn
  description = "ARN of the database password secret in AWS Secrets Manager"
}

output "db_secret_name" {
  value       = aws_secretsmanager_secret.db_password.name
  description = "Name of the database password secret in AWS Secrets Manager (includes PR number)"
}

output "db_username" {
  value       = var.db_username
  description = "Database master username"
  sensitive   = true
}

output "waf_web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "ID of the WAF Web ACL"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "ARN of the WAF Web ACL"
}

output "waf_web_acl_name" {
  value       = "${local.name_prefix}-waf-acl"
  description = "Name of the WAF Web ACL with PR number"
}

output "iam_role_arn" {
  value       = aws_iam_role.ec2_instance.arn
  description = "ARN of the EC2 IAM role"
}

output "iam_role_name" {
  value       = "${local.name_prefix}-ec2-role"
  description = "Name of the EC2 IAM role with PR number"
}

output "kms_rds_key_id" {
  value       = aws_kms_key.rds.key_id
  description = "KMS key ID for RDS encryption"
}

output "kms_rds_key_arn" {
  value       = aws_kms_key.rds.arn
  description = "KMS key ARN for RDS encryption"
}

output "kms_rds_alias" {
  value       = "alias/${local.name_prefix}-rds"
  description = "KMS key alias for RDS with PR number"
}

output "kms_ebs_key_id" {
  value       = aws_kms_key.ebs.key_id
  description = "KMS key ID for EBS encryption"
}

output "kms_ebs_key_arn" {
  value       = aws_kms_key.ebs.arn
  description = "KMS key ARN for EBS encryption"
}

output "kms_ebs_alias" {
  value       = "alias/${local.name_prefix}-ebs"
  description = "KMS key alias for EBS with PR number"
}

output "cloudwatch_alarm_arns" {
  value = {
    alb_5xx_errors = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
    rds_cpu        = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_storage    = aws_cloudwatch_metric_alarm.rds_storage.arn
    asg_unhealthy  = aws_cloudwatch_metric_alarm.asg_unhealthy_instances.arn
  }
  description = "ARNs of CloudWatch alarms"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alarms.arn
  description = "ARN of the SNS topic for alarms"
}

output "resource_summary" {
  value = {
    name_prefix    = local.name_prefix
    environment    = var.environment
    pr_number      = var.pr_number
    vpc_id         = module.vpc.vpc_id
    alb_dns        = module.alb.alb_dns_name
    s3_bucket      = module.s3.bucket_name
    rds_identifier = "${local.name_prefix}-db"
    secret_name    = aws_secretsmanager_secret.db_password.name
    waf_acl_name   = "${local.name_prefix}-waf-acl"
    iam_role_name  = "${local.name_prefix}-ec2-role"
    kms_rds_alias  = "alias/${local.name_prefix}-rds"
    kms_ebs_alias  = "alias/${local.name_prefix}-ebs"
  }
  description = "Summary of all resources with PR number naming"
}