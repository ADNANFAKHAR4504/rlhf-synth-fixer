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

output "cloudtrail_bucket_name" {
  value = module.s3.cloudtrail_bucket_name
}

output "sns_topic_arn" {
  value = module.sns.topic_arn
}

output "cloudwatch_log_group_name" {
  value = module.cloudwatch.log_group_name
}

output "guardduty_detector_id" {
  value = module.guardduty.detector_id
}
