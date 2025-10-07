output "kms_key_id" {
  value = aws_kms_key.main.arn
}

output "kms_key_arn" {
  value = aws_kms_key.main.arn
}

output "instance_role_arn" {
  value = aws_iam_role.instance.arn
}

output "instance_profile_name" {
  value = aws_iam_instance_profile.instance.name
}

output "app_data_bucket" {
  value = aws_s3_bucket.app_data.id
}


