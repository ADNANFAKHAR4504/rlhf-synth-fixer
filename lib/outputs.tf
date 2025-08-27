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
  value = module.s3_cloudtrail_bucket.s3_bucket_id
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

output "guardduty_detector_id" {
  value = module.guardduty.guardduty_detector_id
}


output "role_arn" {
  value = module.iam_cloudtrail.role_arn
}