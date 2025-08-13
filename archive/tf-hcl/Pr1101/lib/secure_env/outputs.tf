# secure_env/outputs.tf
output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = aws_instance.secure_instance.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.secure_instance.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.secure_instance.private_ip
}

output "security_group_id" {
  description = "ID of the created security group"
  value       = aws_security_group.secure_web_sg.id
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account IAM role"
  value       = aws_iam_role.cross_account_role.arn
}

output "cross_account_role_external_id" {
  description = "External ID required for assuming the cross-account role"
  value       = "secure-environment-access"
  sensitive   = true
}