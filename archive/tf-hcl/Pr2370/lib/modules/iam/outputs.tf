output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_s3_readonly.name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = aws_iam_user.terraform_user.arn
}

output "terraform_user_name" {
  description = "Name of the Terraform user"
  value       = aws_iam_user.terraform_user.name
}