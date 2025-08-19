output "iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_secrets_role.name
}