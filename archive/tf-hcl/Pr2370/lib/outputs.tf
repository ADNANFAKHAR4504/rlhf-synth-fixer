output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.storage.kms_key_id
}

output "s3_bucket_name" {
  description = "Name of the encrypted S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = module.iam.terraform_user_arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = module.monitoring.config_recorder_name
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = module.monitoring.security_alerts_topic_arn
}

output "config_rules" {
  description = "List of AWS Config rule names"
  value       = module.monitoring.config_rules
}

#output "cloudtrail_arn" {
#  description = "ARN of the CloudTrail"
#  value       = module.monitoring.cloudtrail_arn
#}
#
#output "guardduty_detector_id" {
#  description = "ID of the GuardDuty detector"
#  value       = module.monitoring.guardduty_detector_id
#