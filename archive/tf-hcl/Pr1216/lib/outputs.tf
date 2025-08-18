output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  value = [for s in aws_subnet.private : s.id]
}

output "public_sg_id" {
  value = aws_security_group.public_sg.id
}

output "s3_logs_bucket" {
  value = aws_s3_bucket.logs.bucket
}

output "s3_data_bucket" {
  value = aws_s3_bucket.data.bucket
}

output "cloudtrail_name" {
  value = aws_cloudtrail.this.name
}

output "config_rules" {
  value = [
    aws_config_config_rule.restricted_ssh.name,
    aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name
  ]
}

output "iam_policy_name" {
  value = aws_iam_user_policy.least_priv.name
}
