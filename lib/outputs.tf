output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}


output "kms_key_arn" {
  value = module.kms.kms_key_arn
}

output "sns_topic_arn" {
  value = module.sns.sns_topic_arn
}

output "cloudwatch_log_group_name" {
  value = module.cloudwatch_security.log_group_arn
}

output "cloudtrail_log_group_name" {
  value = module.cloudwatch_cloudtrail.log_group_arn
}

output "role_arn_cloudtrail" {
  value = module.iam_cloudtrail.role_arn
}

output "role_arn_config" {
  value = module.iam_config.role_arn
}

output "role_arn_mfa" {
  value = module.iam_mfa_role.role_arn
}

output "s3_secure_bucket" {
  value = module.s3_secure_bucket.s3_bucket_id
}

output "s3_cloudtrail_bucket" {
  value = module.s3_cloudtrail_bucket.s3_bucket_id
}

output "s3_config_bucket" {
  value = module.s3_config_bucket.s3_bucket_id
}

output "scurity_group_id_bastion" {
  description = "ID of the bastion security group"
  value       = module.sg.bastion_sg_id
}

output "security_group_id_private_instance" {
  description = "ID of the private instance security group"
  value       = module.sg.private_sg_id
}

output "config_delivery_channel" {
  description = "Config delivery channel name"
  value       = module.config.config_delivery_channel
}