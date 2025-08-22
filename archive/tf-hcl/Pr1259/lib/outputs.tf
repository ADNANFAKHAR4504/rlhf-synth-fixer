output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

# output "cloudtrail_name" {
#   description = "Name of the CloudTrail"
#   value       = aws_cloudtrail.main.name
# }

# output "config_recorder_name" {
#   description = "Name of the Config recorder"
#   value       = aws_config_configuration_recorder.main.name
# }

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    web = aws_security_group.web.id
    ssh = aws_security_group.ssh.id
  }
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}